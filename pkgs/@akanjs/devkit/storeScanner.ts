import path from "node:path";
import ts from "typescript";
import type { QualityWarning, SourceFileInfo } from "./qualityScanner";

interface CustomAction {
  name: string;
  line: number;
  /** The endpoints this action calls as `fetch.<name>`. Empty means it never leaves the client. */
  fetched: string[];
}

/**
 * Checks that a store action an agent can reach says what it does, in the one place this codebase lets it.
 *
 * A store is the surface an in-page agent drives — it reads state through `st.use.*` and acts through `st.do.*` —
 * and an action's name and argument types are the only other thing it sees. Unlike a signal, a store has no
 * builder metadata and no room for prose: the house rules ban JSDoc, and every string a person reads goes through
 * `l()`. So the dictionary's `.store()` stage is the only legal channel for the sentence, and this is the check
 * that it exists where it is actually needed.
 *
 * Three kinds of action are deliberately quiet, because a warning nobody should act on teaches people to ignore
 * the rest:
 *
 *  - **Generated actions** (`createX`, `setFieldOnX`, `initXInY`, …) are not in the file at all. Their wording is
 *    derived from the model's own labels, so there is nothing for an author to write.
 *  - **An action that calls no `fetch.*`** stays on the client and is not published, so its description would be
 *    read by nobody.
 *  - **An action named after the endpoint it calls** already reads as that endpoint's `.desc()`. That is most of
 *    them, and not by accident — the naming rule is that `st.do.X` reads the same as `fetch.X`.
 *
 * What is left is the case where inheriting would be *wrong* rather than merely absent: nine `getSummaryListIn*`
 * actions that all call one `summaryListInPeriod`, where the difference between them is the whole point of having
 * nine; or `logout` over `signoutUser`, where the store name is the verb a user would say and the endpoint name is
 * the verb the API has. Those are the ones a person has to write.
 *
 * It reads source, so an action that reaches its endpoint through anything but a literal `fetch.<name>` — a
 * destructured `fetch`, a helper, a computed key — reads as calling none and stays quiet. Right for a warning that
 * must not fire on what it merely failed to resolve.
 */
export class StoreScanner {
  scan(sourceFiles: SourceFileInfo[]): QualityWarning[] {
    const dictionaries = new Map(
      sourceFiles
        .filter((sourceFile) => sourceFile.file.endsWith(".dictionary.ts"))
        .map((sourceFile) => [path.dirname(sourceFile.file), sourceFile]),
    );
    return sourceFiles
      .filter((sourceFile) => sourceFile.file.endsWith(".store.ts"))
      .flatMap((sourceFile) => this.#scanStore(sourceFile, dictionaries.get(path.dirname(sourceFile.file))));
  }

  #scanStore(store: SourceFileInfo, dictionary: SourceFileInfo | undefined): QualityWarning[] {
    const actions = StoreScanner.#customActions(store);
    if (!actions.length) return [];
    const described = dictionary ? StoreScanner.#describedEntries(dictionary) : new Map<string, Set<string>>();
    return actions
      .filter(({ name, fetched }) => fetched.length && !fetched.includes(name))
      .filter(({ name }) => !described.get("store")?.has(name) && !described.get("endpoint")?.has(name))
      .map(({ name, line, fetched }) => ({
        rule: "akan.agent.missing-store-description",
        scope: "agent" as const,
        severity: "warning" as const,
        file: store.file,
        line,
        message: `Store action "${name}" calls ${fetched.map((key) => `${key}()`).join(", ")} under a different name and has no dictionary .store() entry, so an agent reading it has the name and nothing else.`,
      }));
  }

  /** Methods written in the store class body. Generated actions never appear here, which is why they are exempt. */
  static #customActions(store: SourceFileInfo): CustomAction[] {
    const actions: CustomAction[] = [];
    const visit = (node: ts.Node) => {
      if (ts.isClassDeclaration(node) && StoreScanner.#extendsStore(node)) {
        for (const member of node.members) {
          // A getter computes rather than dispatches, and a static helper is not on `st.do` at all.
          if (!ts.isMethodDeclaration(member)) continue;
          if (member.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword)) continue;
          const name = StoreScanner.#memberName(member);
          if (!name) continue;
          const line = store.sourceFile.getLineAndCharacterOfPosition(member.getStart(store.sourceFile)).line + 1;
          actions.push({ name, line, fetched: StoreScanner.#fetchedEndpoints(member) });
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(store.sourceFile);
    return actions;
  }

  static #extendsStore(node: ts.ClassDeclaration) {
    return !!node.heritageClauses?.some((clause) =>
      clause.types.some((type) => ts.isCallExpression(type.expression) && StoreScanner.#isStoreCall(type.expression)),
    );
  }

  static #isStoreCall(expression: ts.CallExpression) {
    return ts.isIdentifier(expression.expression) && expression.expression.text === "store";
  }

  /** The `fetch.<name>` calls inside one action, which is what says whether it is reachable past the client. */
  static #fetchedEndpoints(member: ts.MethodDeclaration): string[] {
    const fetched = new Set<string>();
    const visit = (node: ts.Node) => {
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        ts.isIdentifier(node.expression.expression) &&
        node.expression.expression.text === "fetch"
      )
        fetched.add(node.expression.name.text);
      ts.forEachChild(node, visit);
    };
    visit(member);
    return [...fetched];
  }

  /** Entry names that carry a `.desc()`, per dictionary stage. */
  static #describedEntries(dictionary: SourceFileInfo): Map<string, Set<string>> {
    const described = new Map<string, Set<string>>();
    const visit = (node: ts.Node) => {
      const stage = StoreScanner.#dictionaryStage(node);
      if (stage) {
        for (const [name, chain] of StoreScanner.#stageEntries(node as ts.CallExpression)) {
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
    return stage === "store" || stage === "endpoint" ? stage : null;
  }

  static #stageEntries(stage: ts.CallExpression): Array<[string, Set<string>]> {
    const callback = stage.arguments[0];
    if (!callback || !ts.isArrowFunction(callback)) return [];
    const body = ts.isParenthesizedExpression(callback.body) ? callback.body.expression : callback.body;
    if (!ts.isObjectLiteralExpression(body)) return [];
    return body.properties.flatMap((property) => {
      if (!ts.isPropertyAssignment(property)) return [];
      const name = StoreScanner.#memberName(property);
      return name ? [[name, StoreScanner.#chainCalls(property.initializer)] as [string, Set<string>]] : [];
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

  static #memberName(member: ts.MethodDeclaration | ts.PropertyAssignment) {
    const { name } = member;
    if (!name || (!ts.isIdentifier(name) && !ts.isStringLiteral(name))) return null;
    return name.text;
  }
}
