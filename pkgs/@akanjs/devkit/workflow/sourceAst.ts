import ts from "typescript";

export const sourceFileFor = (fileName: string, content: string) =>
  ts.createSourceFile(fileName, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

export const nodeName = (node: ts.PropertyName | ts.BindingName | undefined) => {
  if (!node) return null;
  if (ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isNumericLiteral(node)) return node.text;
  return null;
};

export const propertyName = (node: ts.ObjectLiteralElementLike) =>
  ts.isPropertyAssignment(node) || ts.isShorthandPropertyAssignment(node) || ts.isMethodDeclaration(node)
    ? nodeName(node.name)
    : null;

export const expressionName = (expression: ts.Expression): string | null => {
  if (ts.isIdentifier(expression)) return expression.text;
  if (ts.isPropertyAccessExpression(expression)) return expression.name.text;
  if (ts.isCallExpression(expression)) return expressionName(expression.expression);
  if (ts.isAsExpression(expression)) return expressionName(expression.expression);
  return null;
};

export const callExpressionName = (node: ts.CallExpression) =>
  ts.isPropertyAccessExpression(node.expression) ? node.expression.name.text : expressionName(node.expression);

export const firstObjectReturnedByArrow = (node: ts.Node): ts.ObjectLiteralExpression | null => {
  if (!ts.isArrowFunction(node) && !ts.isFunctionExpression(node)) return null;
  if (ts.isObjectLiteralExpression(node.body)) return node.body;
  if (ts.isParenthesizedExpression(node.body) && ts.isObjectLiteralExpression(node.body.expression)) {
    return node.body.expression;
  }
  if (!ts.isBlock(node.body)) return null;
  for (const statement of node.body.statements) {
    if (ts.isReturnStatement(statement) && statement.expression && ts.isObjectLiteralExpression(statement.expression)) {
      return statement.expression;
    }
  }
  return null;
};

const isViaCall = (expression: ts.Expression) =>
  ts.isCallExpression(expression) && expressionName(expression.expression) === "via";

export const heritageCall = (node: ts.ClassDeclaration) => {
  const heritage = node.heritageClauses?.flatMap((clause) => [...clause.types]) ?? [];
  const expression = heritage.find((clause) => isViaCall(clause.expression))?.expression;
  return expression && ts.isCallExpression(expression) ? expression : null;
};
