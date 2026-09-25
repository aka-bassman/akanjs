import path from "node:path";
import ts from "typescript";

const appRoot = path.resolve(import.meta.dir, "..");
const tableTags = new Set(["Docs.IntroTable", "Docs.OptionTable", "Docs.Table", "Docs.LinkGrid"]);
const listProps = new Set(["items", "rows"]);
const referenceLists = new Set(["props", "args", "options", "notes"]);

const readOptions = () => {
  const argv = process.argv.slice(2);
  const value = (name: string) => {
    const index = argv.indexOf(`--${name}`);
    return index >= 0 ? argv[index + 1] : undefined;
  };
  return {
    max: Number(value("max") ?? 120) || 120,
    dir: value("dir") ?? "page/(docs)",
    all: argv.includes("--all"),
  };
};

const textOf = (node: ts.Node, sourceFile: ts.SourceFile): string => {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isJsxText(node)) return node.text.replace(/\s+/g, " ");
  if (ts.isJsxExpression(node)) return node.expression ? textOf(node.expression, sourceFile) : "";
  if (ts.isParenthesizedExpression(node)) return textOf(node.expression, sourceFile);
  if (ts.isJsxElement(node) || ts.isJsxFragment(node))
    return node.children.map((child) => textOf(child, sourceFile)).join("");
  return "";
};

const enOf = (call: ts.CallExpression, sourceFile: ts.SourceFile) => {
  const arg = call.arguments[0];
  if (!arg || !ts.isObjectLiteralExpression(arg)) return null;
  const en = arg.properties.find(
    (prop): prop is ts.PropertyAssignment => ts.isPropertyAssignment(prop) && prop.name.getText(sourceFile) === "en",
  );
  return en ? textOf(en.initializer, sourceFile).trim() : null;
};

const arraysIn = (node: ts.Node, sourceFile: ts.SourceFile, seen = new Set<string>()): ts.ArrayLiteralExpression[] => {
  const found: ts.ArrayLiteralExpression[] = [];
  const visit = (child: ts.Node) => {
    if (ts.isArrayLiteralExpression(child)) {
      found.push(child);
      return;
    }
    if (ts.isIdentifier(child) && !seen.has(child.text)) {
      seen.add(child.text);
      const declare = (candidate: ts.Node) => {
        if (ts.isVariableDeclaration(candidate) && candidate.name.getText(sourceFile) === child.text) {
          if (candidate.initializer) found.push(...arraysIn(candidate.initializer, sourceFile, seen));
          return;
        }
        candidate.forEachChild(declare);
      };
      declare(sourceFile);
    }
    child.forEachChild(visit);
  };
  visit(node);
  return found;
};

const run = async () => {
  const options = readOptions();
  const findings: string[] = [];
  const lengths: number[] = [];

  for await (const file of new Bun.Glob(`${options.dir}/**/*.tsx`).scan({ cwd: appRoot })) {
    const sourceText = await Bun.file(path.join(appRoot, file)).text();
    if (![...tableTags, "Reference"].some((tag) => sourceText.includes(tag))) continue;
    const sourceFile = ts.createSourceFile(file, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const where = (node: ts.Node) =>
      `${file}:${sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1}`;

    const visitReference = (node: ts.Node) => {
      node.forEachChild(visitReference);
      if (!ts.isPropertyAssignment(node) || !referenceLists.has(node.name.getText(sourceFile))) return;
      if (!ts.isArrayLiteralExpression(node.initializer)) return;
      for (const row of node.initializer.elements.filter(ts.isObjectLiteralExpression)) {
        const desc = row.properties.find(
          (prop): prop is ts.PropertyAssignment =>
            ts.isPropertyAssignment(prop) && prop.name.getText(sourceFile) === "desc",
        );
        if (!desc) continue;
        const text =
          ts.isCallExpression(desc.initializer) && desc.initializer.expression.getText(sourceFile).endsWith(".trans")
            ? enOf(desc.initializer, sourceFile)
            : textOf(desc.initializer, sourceFile).trim() || null;
        if (text === null) continue;
        lengths.push(text.length);
        if (text.length > options.max || options.all)
          findings.push(`${where(desc)}  desc ${text.length} chars: ${text.slice(0, 90)}…`);
      }
    };
    visitReference(sourceFile);

    const visit = (node: ts.Node) => {
      node.forEachChild(visit);
      if (!ts.isJsxSelfClosingElement(node) || !tableTags.has(node.tagName.getText(sourceFile))) return;
      const list = node.attributes.properties.find(
        (attr): attr is ts.JsxAttribute => ts.isJsxAttribute(attr) && listProps.has(attr.name.getText(sourceFile)),
      );
      if (!list?.initializer) return;

      for (const array of arraysIn(list.initializer, sourceFile)) {
        for (const item of array.elements.filter(ts.isObjectLiteralExpression)) {
          for (const prop of item.properties.filter(ts.isPropertyAssignment)) {
            const key = prop.name.getText(sourceFile);
            if ((key === "name" || key === "key") && ts.isStringLiteral(prop.initializer)) {
              if (prop.initializer.text.includes(" · "))
                findings.push(`${where(prop)}  name joins several with " · " — pass a string array`);
            }
            if (key === "default" && ts.isStringLiteral(prop.initializer) && /^[-—]$/.test(prop.initializer.text))
              findings.push(`${where(prop)}  default "${prop.initializer.text}" — omit the default instead`);
            if (key === "en") {
              const en = textOf(prop.initializer, sourceFile).trim();
              lengths.push(en.length);
              if (en.length > options.max || options.all)
                findings.push(`${where(prop)}  en ${en.length} chars: ${en.slice(0, 90)}…`);
              continue;
            }

            const visitText = (child: ts.Node) => {
              if (ts.isCallExpression(child) && child.expression.getText(sourceFile).endsWith(".trans")) {
                const en = enOf(child, sourceFile);
                if (en === null) return;
                lengths.push(en.length);
                if (en.length > options.max || options.all)
                  findings.push(`${where(child)}  ${key} ${en.length} chars: ${en.slice(0, 90)}…`);
                return;
              }
              child.forEachChild(visitText);
            };
            visitText(prop.initializer);
          }
        }
      }
    };
    visit(sourceFile);
  }

  lengths.sort((a, b) => a - b);
  const at = (ratio: number) => lengths[Math.min(lengths.length - 1, Math.floor(lengths.length * ratio))] ?? 0;
  console.info(findings.join("\n"));
  console.info(
    `\n${lengths.length} cells · median ${at(0.5)} · p90 ${at(0.9)} · max ${at(1)} chars (en) · ` +
      `${findings.length} finding(s) over ${options.max}`,
  );
  if (findings.length > 0 && !options.all) process.exit(1);
};

void run();
