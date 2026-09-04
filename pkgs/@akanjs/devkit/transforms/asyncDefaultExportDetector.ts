import fs from "node:fs";
import path from "node:path";
import type ts from "typescript";

type TypeScript = typeof ts;

export class AsyncDefaultExportDetector {
  static #typescriptLoad: Promise<TypeScript> | undefined;

  // `typescript` costs ~70 MB resident and this detector is reached from the cli entry through the root
  // layout generator, so the compiler loads on first use rather than at import (`entryModuleGraph.test.ts`).
  static #loadTypescript(): Promise<TypeScript> {
    AsyncDefaultExportDetector.#typescriptLoad ??= import("typescript").then(
      (mod) => (mod.default ?? mod) as TypeScript,
    );
    return AsyncDefaultExportDetector.#typescriptLoad;
  }

  static async detect(moduleAbsPath: string): Promise<boolean> {
    try {
      const typescript = await AsyncDefaultExportDetector.#loadTypescript();
      const source = fs.readFileSync(path.resolve(moduleAbsPath), "utf8");
      const sourceFile = typescript.createSourceFile(
        moduleAbsPath,
        source,
        typescript.ScriptTarget.Latest,
        true,
        AsyncDefaultExportDetector.#scriptKind(typescript, moduleAbsPath),
      );
      return new AsyncDefaultExportDetector(typescript).detectInSourceFile(sourceFile);
    } catch {
      return false;
    }
  }

  #ts: TypeScript;

  constructor(typescript: TypeScript) {
    this.#ts = typescript;
  }

  detectInSourceFile(sourceFile: ts.SourceFile): boolean {
    const ts = this.#ts;
    const asyncBindings = new Map<string, boolean>();
    let defaultIdentifier: string | null = null;

    for (const statement of sourceFile.statements) {
      if (ts.isFunctionDeclaration(statement)) {
        if (this.#hasModifier(statement, ts.SyntaxKind.DefaultKeyword)) {
          return this.#hasModifier(statement, ts.SyntaxKind.AsyncKeyword);
        }
        if (statement.name) {
          asyncBindings.set(statement.name.text, this.#hasModifier(statement, ts.SyntaxKind.AsyncKeyword));
        }
        continue;
      }

      if (ts.isVariableStatement(statement)) {
        for (const declaration of statement.declarationList.declarations) {
          if (!ts.isIdentifier(declaration.name)) continue;
          asyncBindings.set(declaration.name.text, this.#isAsyncFunctionExpression(declaration.initializer));
        }
        continue;
      }

      if (ts.isExportAssignment(statement)) {
        if (this.#isAsyncFunctionExpression(statement.expression)) return true;
        if (ts.isIdentifier(statement.expression)) defaultIdentifier = statement.expression.text;
        continue;
      }

      if (ts.isExportDeclaration(statement) && statement.exportClause && ts.isNamedExports(statement.exportClause)) {
        const exportClause = statement.exportClause;
        for (const specifier of exportClause.elements) {
          if (specifier.name.text !== "default") continue;
          defaultIdentifier = specifier.propertyName?.text ?? specifier.name.text;
        }
      }
    }

    return defaultIdentifier ? asyncBindings.get(defaultIdentifier) === true : false;
  }

  #hasModifier(node: ts.Node, kind: ts.SyntaxKind): boolean {
    const ts = this.#ts;
    return ts.canHaveModifiers(node) && (ts.getModifiers(node)?.some((modifier) => modifier.kind === kind) ?? false);
  }

  #isAsyncFunctionExpression(node?: ts.Expression): boolean {
    const ts = this.#ts;
    return Boolean(
      node &&
        (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) &&
        this.#hasModifier(node, ts.SyntaxKind.AsyncKeyword),
    );
  }

  static #scriptKind(typescript: TypeScript, moduleAbsPath: string): ts.ScriptKind {
    return moduleAbsPath.endsWith(".tsx") || moduleAbsPath.endsWith(".jsx")
      ? typescript.ScriptKind.TSX
      : typescript.ScriptKind.TS;
  }
}
