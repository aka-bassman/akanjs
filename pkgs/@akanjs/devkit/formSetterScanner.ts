import ts from "typescript";
import type { QualityWarning, SourceFileInfo } from "./qualityScanner";

// Only a setter passed by reference publishes its field (`data-akan-action`, agent tool). The grit rule flags only pure
// forwarding wrappers; this counts every field left unpublished whatever the reason. A zero-parameter handler is a
// button setting a constant, not a form control, so it is not counted.
export class FormSetterScanner {
  static #fieldSetter = /^set[A-Za-z0-9_$]*On[A-Za-z0-9_$]*$/;

  scan(sourceFiles: SourceFileInfo[]): QualityWarning[] {
    return sourceFiles.filter((sourceFile) => sourceFile.file.endsWith(".tsx")).flatMap((f) => this.#scanFile(f));
  }

  #scanFile({ file, sourceFile }: SourceFileInfo): QualityWarning[] {
    const wrapped: { setter: string; line: number }[] = [];
    const visit = (node: ts.Node) => {
      if (ts.isJsxAttribute(node)) {
        const setter = FormSetterScanner.#wrappedSetterOf(node);
        if (setter) wrapped.push({ setter, line: FormSetterScanner.#lineOf(sourceFile, node) });
      }
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
    if (!wrapped.length) return [];
    const setters = [...new Set(wrapped.map((entry) => entry.setter))].sort();
    return [
      {
        rule: "akan.agent.unpublished-form-setter",
        scope: "agent",
        severity: "warning",
        message:
          setters.length === 1
            ? `${setters[0]} is reached through a wrapper, so that field publishes no agent tool and carries no data-akan-action.`
            : `${setters.length} field setters are reached through a wrapper, so those fields publish no agent tool and carry no data-akan-action: ${setters.join(", ")}.`,
        file,
        line: wrapped[0]?.line,
        locations: wrapped.map(({ line }) => ({ file, line })),
      },
    ];
  }

  /** The setter a handler prop writes behind a wrapper, or null when it is passed by reference or absent. */
  static #wrappedSetterOf(attribute: ts.JsxAttribute): string | null {
    if (!ts.isIdentifier(attribute.name) || !/^on[A-Z]/.test(attribute.name.text)) return null;
    const initializer = attribute.initializer;
    if (!initializer || !ts.isJsxExpression(initializer) || !initializer.expression) return null;
    const handler = initializer.expression;
    if (!ts.isArrowFunction(handler) && !ts.isFunctionExpression(handler)) return null;
    if (!handler.parameters.length) return null;
    return FormSetterScanner.#setterCallIn(handler.body);
  }

  static #setterCallIn(node: ts.Node): string | null {
    let found: string | null = null;
    const visit = (current: ts.Node) => {
      if (found) return;
      if (ts.isCallExpression(current) && ts.isPropertyAccessExpression(current.expression)) {
        const { expression, name } = current.expression;
        if (
          ts.isPropertyAccessExpression(expression) &&
          ts.isIdentifier(expression.expression) &&
          expression.expression.text === "st" &&
          expression.name.text === "do" &&
          FormSetterScanner.#fieldSetter.test(name.text)
        ) {
          found = name.text;
          return;
        }
      }
      ts.forEachChild(current, visit);
    };
    visit(node);
    return found;
  }

  static #lineOf(sourceFile: ts.SourceFile, node: ts.Node) {
    return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
  }
}
