import path from "node:path";
import ts from "typescript";
import type { QualityWarning, SourceFileInfo } from "./qualityScanner";

interface ExposedDeclaration {
  name: string;
  kind: "endpoint" | "slice";
  line: number;
  /** `unknown` when the option object holds a spread, where a `guards` key may arrive from somewhere unreadable. */
  guards: "declared" | "missing" | "unknown";
}

/**
 * Checks the two things about an MCP exposure that source alone can answer: that it carries a description an agent
 * can act on, and that somebody decided who may call it.
 *
 * A tool's name and argument names are the only other thing a model sees, and neither says what the tool is for
 * or when to reach for it. An undescribed tool is not merely undocumented — it is a tool the model will either
 * skip or call wrongly, so this rides with the exposure decision rather than with general dictionary hygiene.
 *
 * Guards are here because the omission is *syntactic*: the `guards` key sits in the same option literal as
 * `mcp: { expose: true }`, and a named slice inherits nothing from the `slice()` call's own guards map. So the
 * shape that publishes an unguarded read without anyone writing it down is visible in the file, with no resolved
 * types needed — which is what makes it worth checking here rather than only in a boot log.
 *
 * The generated CRUD a slice opts in through `mcp: { get: true }` is checked by neither rule: none of those
 * entries has text of its own to leave out, so each borrows the model's — the `.of()` label as a title, the model
 * `.desc()` appended to the framework's "Get X" as a description — and each takes the `slice()` guards map, which
 * is the one place those guards do reach.
 *
 * It reads source, so it finds `mcp: { expose: true }` only where an author writes it as a literal inside the
 * `slice(` / `endpoint(` call — an option hoisted to a `const`, or an `expose: flag`, is invisible to it. Right
 * for a warning that must not fire on something it merely failed to resolve, but it makes a clean scan "nothing
 * obviously wrong" rather than "everything exposed is described and guarded". The complete answer is the boot log:
 * `McpRouter.report()` holds the resolved catalogue and names every published entry with no description and every
 * one with no guards, generated entries included — and the refusals, which turn on a resolved return type and so
 * are the one class this file could never see.
 */
export class McpScanner {
  scan(sourceFiles: SourceFileInfo[]): QualityWarning[] {
    const dictionaries = new Map(
      sourceFiles
        .filter((sourceFile) => sourceFile.file.endsWith(".dictionary.ts"))
        .map((sourceFile) => [path.dirname(sourceFile.file), sourceFile]),
    );
    return sourceFiles
      .filter((sourceFile) => sourceFile.file.endsWith(".signal.ts"))
      .flatMap((sourceFile) => this.#scanSignal(sourceFile, dictionaries.get(path.dirname(sourceFile.file))));
  }

  #scanSignal(signal: SourceFileInfo, dictionary: SourceFileInfo | undefined): QualityWarning[] {
    const exposed = McpScanner.#exposedDeclarations(signal);
    if (!exposed.length) return [];
    const refName = path.basename(signal.file, ".signal.ts").replace(/^_+/, "");
    const described = dictionary ? McpScanner.#describedEntries(dictionary) : new Map<string, Set<string>>();
    return [
      ...exposed
        .filter(({ name, kind }) => !McpScanner.#isDescribed(described, refName, name, kind))
        .map(({ name, kind, line }) => ({
          rule: "akan.mcp.missing-description",
          scope: "mcp" as const,
          severity: "warning" as const,
          file: signal.file,
          line,
          message: `MCP-exposed ${kind} "${name}" has no dictionary .desc(); an agent sees its name and nothing else.`,
        })),
      ...exposed
        .filter(({ guards }) => guards === "missing")
        .map(({ name, kind, line }) => ({
          rule: "akan.mcp.unguarded-exposure",
          scope: "mcp" as const,
          severity: "warning" as const,
          file: signal.file,
          line,
          message: `MCP-exposed ${kind} "${name}" declares no guards; a slice's guards map never reaches a named slice.`,
        })),
    ];
  }

  static #isDescribed(described: Map<string, Set<string>>, refName: string, name: string, kind: string) {
    if (described.get(kind)?.has(name)) return true;
    // A slice may instead be described through the endpoint it generates, which is how a dictionary that wants
    // separate wording for the list reads (`bannerListInPublic`).
    return kind === "slice" && !!described.get("endpoint")?.has(`${refName}List${McpScanner.#capitalize(name)}`);
  }

  /** Names declared with `mcp: { expose: true }`, keyed by whether they sit in the slice or endpoint builder. */
  static #exposedDeclarations(signal: SourceFileInfo): ExposedDeclaration[] {
    const found: ExposedDeclaration[] = [];
    const visit = (node: ts.Node) => {
      if (McpScanner.#isExposeOption(node)) {
        const declaration = McpScanner.#enclosingDeclaration(node, signal.sourceFile);
        if (declaration) found.push(declaration);
      }
      ts.forEachChild(node, visit);
    };
    visit(signal.sourceFile);
    return found;
  }

  static #isExposeOption(node: ts.Node) {
    if (!ts.isPropertyAssignment(node) || McpScanner.#propertyName(node) !== "mcp") return false;
    if (!ts.isObjectLiteralExpression(node.initializer)) return false;
    return node.initializer.properties.some(
      (property) =>
        ts.isPropertyAssignment(property) &&
        McpScanner.#propertyName(property) === "expose" &&
        property.initializer.kind === ts.SyntaxKind.TrueKeyword,
    );
  }

  /**
   * The name is the property holding the builder chain the option sits in — `inCategory: init({ mcp })…` or
   * `echoTitle: builder.query(String, { mcp })…` — and the kind is the factory that property is declared inside.
   * Reading the kind from the factory rather than from the chain's first identifier keeps it right when a slice
   * callback names its parameter something other than `init`.
   */
  static #enclosingDeclaration(option: ts.Node, sourceFile: ts.SourceFile): ExposedDeclaration | null {
    let declaration: ts.PropertyAssignment | null = null;
    for (let node = option.parent; node; node = node.parent) {
      if (!declaration && ts.isPropertyAssignment(node)) {
        declaration = node;
        continue;
      }
      const kind = McpScanner.#factoryKind(node);
      if (!kind || !declaration) continue;
      const name = McpScanner.#propertyName(declaration);
      if (!name) return null;
      const line = sourceFile.getLineAndCharacterOfPosition(declaration.getStart(sourceFile)).line + 1;
      return { name, kind, line, guards: McpScanner.#guardState(option) };
    }
    return null;
  }

  /**
   * Read off the literal the `mcp` option sits in, which is the same literal `guards` belongs to — `init({ guards,
   * mcp })`, `query(cnst.X, { guards, mcp })`. A spread in there makes the answer unreadable rather than missing,
   * and a warning that fires on what it merely failed to resolve is worse than one that stays quiet.
   */
  static #guardState(option: ts.Node): ExposedDeclaration["guards"] {
    const options = option.parent;
    if (!ts.isObjectLiteralExpression(options)) return "unknown";
    if (options.properties.some((property) => ts.isSpreadAssignment(property))) return "unknown";
    return options.properties.some(
      (property) => ts.isPropertyAssignment(property) && McpScanner.#propertyName(property) === "guards",
    )
      ? "declared"
      : "missing";
  }

  static #factoryKind(node: ts.Node): ExposedDeclaration["kind"] | null {
    if (!ts.isCallExpression(node) || !ts.isIdentifier(node.expression)) return null;
    const factory = node.expression.text;
    return factory === "slice" || factory === "endpoint" ? factory : null;
  }

  /** Entry names that carry a `.desc()`, per dictionary stage. */
  static #describedEntries(dictionary: SourceFileInfo): Map<string, Set<string>> {
    const described = new Map<string, Set<string>>();
    const visit = (node: ts.Node) => {
      const stage = McpScanner.#dictionaryStage(node);
      if (stage) {
        for (const [name, chain] of McpScanner.#stageEntries(node as ts.CallExpression)) {
          if (!chain.has("desc")) continue;
          const names = described.get(stage) ?? new Set<string>();
          names.add(name);
          described.set(stage, names);
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(dictionary.sourceFile);
    return described;
  }

  static #dictionaryStage(node: ts.Node) {
    if (!ts.isCallExpression(node) || !ts.isPropertyAccessExpression(node.expression)) return null;
    const stage = node.expression.name.text;
    return stage === "endpoint" || stage === "slice" ? stage : null;
  }

  static #stageEntries(stage: ts.CallExpression): Array<[string, Set<string>]> {
    const callback = stage.arguments[0];
    if (!callback || !ts.isArrowFunction(callback)) return [];
    const body = ts.isParenthesizedExpression(callback.body) ? callback.body.expression : callback.body;
    if (!ts.isObjectLiteralExpression(body)) return [];
    return body.properties.flatMap((property) => {
      if (!ts.isPropertyAssignment(property)) return [];
      const name = McpScanner.#propertyName(property);
      return name ? [[name, McpScanner.#chainCalls(property.initializer)] as [string, Set<string>]] : [];
    });
  }

  /**
   * Only the calls on the entry's own chain. A nested `.arg((t) => ({ x: t([…]).desc([…]) }))` describes an
   * argument, not the entry, so a subtree walk would read every entry as described.
   */
  static #chainCalls(expression: ts.Expression): Set<string> {
    const calls = new Set<string>();
    let current: ts.Node = expression;
    while (ts.isCallExpression(current) || ts.isPropertyAccessExpression(current)) {
      if (ts.isPropertyAccessExpression(current)) calls.add(current.name.text);
      current = current.expression;
    }
    return calls;
  }

  static #propertyName(property: ts.PropertyAssignment) {
    const { name } = property;
    if (ts.isIdentifier(name) || ts.isStringLiteral(name)) return name.text;
    return null;
  }

  static #capitalize(value: string) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}
