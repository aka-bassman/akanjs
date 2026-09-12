import { getRouteExports } from "akanjs/common";
import ts from "typescript";

/** What the build needs out of a route module without evaluating it. */
export interface RouteSourceInfo {
  /** `pageConfig.devOnly === true`, or `.config({ devOnly: true })` on a chain, read straight off the AST. */
  devOnly: boolean;
  /** Present when the default export is a `page()` / `layout()` / `rootLayout()` chain. */
  chain?: RouteSourceChain;
}

export interface RouteSourceChain {
  kind: "page" | "layout" | "rootLayout";
  /** The `.param()` names, in chain order. */
  params: string[];
  /** The `.prompt()` name, when the page publishes itself as an MCP prompt. */
  prompt?: string;
}

interface ChainStage {
  name: string;
  args: ts.NodeArray<ts.Expression>;
}

const chainRoots = new Set(["page", "layout", "rootLayout"]);

/**
 * Static enforcement of the `page/` route conventions, split out of `executors.ts` so that importing
 * an executor does not pull `typescript` (+65MB resident) into the module graph. Both validators need
 * a real AST — modifier inspection, `export *` rejection, statement-kind walking and call-expression
 * identity — so `Bun.Transpiler.scan()`, which only reports export names, cannot replace them.
 *
 * Import it dynamically (`await import("./routeSourceValidator")`) so long-lived processes that never
 * validate a route source stay lean.
 */
export class RouteSourceValidator {
  static validateRouteSourceExports(
    source: string,
    filePath: string,
    kind: "page" | "layout",
    options: { rootLayout?: boolean; pattern?: string } = {},
  ): RouteSourceInfo {
    const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const allowed = getRouteExports(kind, { rootLayout: options.rootLayout });
    const exported = new Set<string>();
    const assertExport = (name: string) => {
      if (!allowed.has(name)) {
        throw new Error(`[route-convention] unsupported export "${name}" in ${filePath}`);
      }
      exported.add(name);
    };

    for (const statement of sourceFile.statements) {
      if (ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement)) continue;
      if (ts.isExportDeclaration(statement)) {
        if (statement.isTypeOnly) continue;
        const clause = statement.exportClause;
        if (!clause) throw new Error(`[route-convention] export * is not allowed in route modules: ${filePath}`);
        if (ts.isNamedExports(clause)) {
          for (const element of clause.elements) {
            if (element.isTypeOnly) continue;
            assertExport(element.name.text);
          }
        }
        continue;
      }
      const modifiers = ts.canHaveModifiers(statement) ? ts.getModifiers(statement) : undefined;
      const isExported = modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) ?? false;
      if (!isExported) continue;
      const isDefault = modifiers?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword) ?? false;
      if (isDefault) {
        assertExport("default");
        continue;
      }
      if (ts.isVariableStatement(statement)) {
        for (const declaration of statement.declarationList.declarations) {
          if (ts.isIdentifier(declaration.name)) assertExport(declaration.name.text);
        }
        continue;
      }
      const name = (statement as unknown as { name?: ts.Node }).name;
      if (name && ts.isIdentifier(name)) {
        assertExport(name.text);
      }
    }
    if (exported.has("head") && exported.has("generateHead")) {
      throw new Error(`[route-convention] head and generateHead cannot both be exported in ${filePath}`);
    }
    if (
      !options.rootLayout &&
      (exported.has("head") || exported.has("generateHead")) &&
      (exported.has("metadata") || exported.has("generateMetadata"))
    ) {
      throw new Error(
        `[route-convention] head/generateHead and metadata/generateMetadata cannot both be exported in ${filePath}`,
      );
    }
    if (exported.has("metadata") && exported.has("generateMetadata")) {
      throw new Error(`[route-convention] metadata and generateMetadata cannot both be exported in ${filePath}`);
    }
    const chain = RouteSourceValidator.#readChain(sourceFile, filePath);
    if (!chain) return { devOnly: RouteSourceValidator.#readDevOnly(sourceFile, filePath) };
    const named = [...exported].filter((name) => name !== "default");
    if (named.length)
      throw new Error(
        `[route-convention] ${filePath} exports ${named.join(", ")} beside its ${chain.kind}() chain — every route setting is a stage of the chain`,
      );
    if (kind === "page" && chain.kind !== "page")
      throw new Error(`[route-convention] ${filePath} is a page file but exports ${chain.kind}()`);
    if (kind === "layout" && chain.kind === "page")
      throw new Error(`[route-convention] ${filePath} is a layout file but exports page()`);
    if (options.pattern) RouteSourceValidator.#assertChainParams(chain, options.pattern, filePath);
    return {
      devOnly: chain.devOnly,
      chain: { kind: chain.kind, params: chain.params, ...(chain.prompt ? { prompt: chain.prompt } : {}) },
    };
  }

  /**
   * The default export as a `page()` / `layout()` / `rootLayout()` chain, or null when the module is the legacy
   * shape. Read off the source for the same reason `devOnly` is: the build enumerates routes without importing
   * them, and `akan sync` should name a `[projectId]` folder whose page declares no `.param("projectId")` before
   * the first request does.
   */
  static #readChain(sourceFile: ts.SourceFile, filePath: string) {
    for (const statement of sourceFile.statements) {
      if (!ts.isExportAssignment(statement) || statement.isExportEquals) continue;
      let node = RouteSourceValidator.#unwrapExpression(statement.expression);
      const stages: ChainStage[] = [];
      while (node && ts.isCallExpression(node)) {
        const callee = node.expression;
        if (ts.isPropertyAccessExpression(callee)) {
          stages.unshift({ name: callee.name.text, args: node.arguments });
          node = callee.expression;
          continue;
        }
        if (ts.isIdentifier(callee) && chainRoots.has(callee.text))
          return RouteSourceValidator.#chainOf(callee.text as RouteSourceChain["kind"], stages, filePath);
        return null;
      }
      return null;
    }
    return null;
  }

  static #chainOf(kind: RouteSourceChain["kind"], stages: ChainStage[], filePath: string) {
    const params: string[] = [];
    let prompt: string | undefined;
    let devOnly = false;
    const literal = (stage: ChainStage) => {
      const first = stage.args[0];
      if (!first || !ts.isStringLiteralLike(first))
        throw new Error(
          `[route-convention] .${stage.name}() takes a string literal first in ${filePath} — the build reads it without evaluating the module`,
        );
      return first.text;
    };
    for (const stage of stages) {
      if (stage.name === "param") params.push(literal(stage));
      else if (stage.name === "prompt") prompt = literal(stage);
      else if (stage.name === "config")
        devOnly = RouteSourceValidator.#devOnlyOf(RouteSourceValidator.#unwrapExpression(stage.args[0]), filePath);
    }
    return { kind, params, prompt, devOnly };
  }

  /** The same rule the loader applies: a page names every `[x]` it sits under, a layout may name a subset. */
  static #assertChainParams(chain: { kind: string; params: string[] }, pattern: string, filePath: string) {
    const inPath = pattern
      .split("/")
      .filter((part) => part.startsWith(":"))
      .map((part) => part.slice(1))
      .filter((name) => name !== "lang");
    if (chain.params.includes("lang"))
      throw new Error(`[route-convention] ${filePath} declares .param("lang"), which every route receives undeclared`);
    const unknown = chain.params.find((name) => !inPath.includes(name));
    if (unknown)
      throw new Error(
        `[route-convention] ${filePath} declares .param("${unknown}") but no [${unknown}] segment is in its path`,
      );
    const undeclared = inPath.find((name) => !chain.params.includes(name));
    if (chain.kind === "page" && undeclared)
      throw new Error(
        `[route-convention] ${filePath} sits under [${undeclared}] but declares no .param("${undeclared}") — a page reads only what it declares`,
      );
  }

  /**
   * `devOnly` decides whether the route exists in the production build at all, so it is read from the
   * source rather than from an evaluated module — the build never imports route files to enumerate them.
   * That is why only a literal is accepted: anything the parser cannot settle would otherwise ship a
   * route the author believed was excluded.
   */
  static #readDevOnly(sourceFile: ts.SourceFile, filePath: string): boolean {
    for (const statement of sourceFile.statements) {
      if (!ts.isVariableStatement(statement)) continue;
      const isExported = ts.getModifiers(statement)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) ?? false;
      if (!isExported) continue;
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name) || declaration.name.text !== "pageConfig") continue;
        const initializer = RouteSourceValidator.#unwrapExpression(declaration.initializer);
        if (initializer && ts.isObjectLiteralExpression(initializer))
          return RouteSourceValidator.#devOnlyOf(initializer, filePath);
      }
    }
    return false;
  }

  static #devOnlyOf(config: ts.Expression | undefined, filePath: string): boolean {
    if (!config || !ts.isObjectLiteralExpression(config)) return false;
    for (const property of config.properties) {
      if (!ts.isPropertyAssignment(property)) continue;
      const name = property.name;
      const key = ts.isIdentifier(name) ? name.text : ts.isStringLiteral(name) ? name.text : null;
      if (key !== "devOnly") continue;
      const value = RouteSourceValidator.#unwrapExpression(property.initializer);
      if (value?.kind === ts.SyntaxKind.TrueKeyword) return true;
      if (value?.kind === ts.SyntaxKind.FalseKeyword) return false;
      throw new Error(
        `[route-convention] devOnly must be a literal true or false in ${filePath} — the build reads it without evaluating the module`,
      );
    }
    return false;
  }

  static #unwrapExpression(expression?: ts.Expression): ts.Expression | undefined {
    let current = expression;
    while (
      current &&
      (ts.isAsExpression(current) || ts.isSatisfiesExpression(current) || ts.isParenthesizedExpression(current))
    ) {
      current = current.expression;
    }
    return current;
  }

  /**
   * Statically enforces that a `_overrides.tsx` route file is a logic-free activation manifest: a plain module
   * (no `"use client"` — the framework generates the client wrapper) that only imports components and binds them
   * to slots through a single `export default override({ Modal: BrandModal })`. It must not declare components
   * inline or run logic — that keeps the override contract a thin binding layer rather than a second place to
   * author UI. Slot names and value types are validated at compile time by `override`.
   */
  static validateOverridesSourceExports(source: string, filePath: string) {
    const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const fail = (message: string): never => {
      throw new Error(`[route-convention] ${message}: ${filePath}`);
    };
    let defaultOverride: ts.ExportAssignment | null = null;
    for (const statement of sourceFile.statements) {
      // A "use client" directive is unnecessary (the framework wraps the manifest) but harmless if present.
      if (ts.isExpressionStatement(statement) && ts.isStringLiteral(statement.expression)) continue;
      // The manifest imports the app components it binds; imports and type-only decls carry no runtime logic.
      if (ts.isImportDeclaration(statement)) continue;
      if (ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement)) continue;
      if (ts.isExportAssignment(statement) && !statement.isExportEquals) {
        defaultOverride = statement;
        continue;
      }
      fail(`_overrides.tsx may only contain imports and a single "export default override({ ... })"`);
    }
    if (!defaultOverride) return fail(`_overrides.tsx must "export default override({ ... })"`);
    const expression = defaultOverride.expression;
    if (
      !ts.isCallExpression(expression) ||
      !ts.isIdentifier(expression.expression) ||
      expression.expression.text !== "override"
    )
      fail(
        `_overrides.tsx default export must be a call to "override", e.g. "export default override({ Modal: BrandModal })"`,
      );
  }
}
