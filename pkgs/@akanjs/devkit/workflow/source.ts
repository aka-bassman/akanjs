import type { Sys } from "../commandDecorators";
import { generatedFilePathsForTarget } from "./artifacts";
import { createPrimitiveWriteReport } from "./primitive";
import type {
  PrimitiveChangedFile,
  PrimitiveFileMap,
  PrimitiveGeneratedFile,
  PrimitiveNextAction,
  PrimitiveValidationCommand,
  WorkflowDiagnostic,
} from "./types";

export const getSysRoot = (sys: Sys) => `${sys.type}s/${sys.name}`;

export const sourceFile = (sys: Sys, path: string, action: PrimitiveChangedFile["action"], reason: string) => ({
  path: `${getSysRoot(sys)}/${path}`,
  action,
  reason,
});

export const generatedFilesForSync = (sys: Sys, reason = "Generated files may change after sync.") =>
  generatedFilePathsForTarget(getSysRoot(sys), reason);

export const validationCommandsForTarget = (target: string) =>
  [
    { command: `akan sync ${target}`, reason: "Refresh generated Akan files from source conventions." },
    { command: `akan lint ${target}`, reason: "Validate formatting, imports, and static lint rules." },
  ] satisfies PrimitiveValidationCommand[];

export const nextActionsForTarget = (target: string) =>
  [
    { command: `akan sync ${target}`, reason: "Refresh generated Akan files after source changes." },
    { command: `akan lint ${target}`, reason: "Validate the target after generated files are refreshed." },
  ] satisfies PrimitiveNextAction[];

export const createPassedPrimitiveReport = ({
  command,
  changedFiles,
  generatedFiles,
  target,
  nextActions,
}: {
  command: string;
  changedFiles: PrimitiveChangedFile[];
  generatedFiles?: PrimitiveGeneratedFile[];
  target: string;
  nextActions?: PrimitiveNextAction[];
}) =>
  createPrimitiveWriteReport({
    command,
    changedFiles,
    generatedFiles: generatedFiles ?? [],
    validationCommands: validationCommandsForTarget(target),
    diagnostics: [],
    nextActions: nextActions ?? nextActionsForTarget(target),
  });

export const scalarChangedFiles = (sys: Sys, scalarName: string, files: PrimitiveFileMap) =>
  Object.values(files).map((file) =>
    sourceFile(sys, `lib/__scalar/${scalarName}/${file.filename}`, "create", "Scalar source file was created."),
  );

export const titleize = (value: string) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const lowerlize = (value: string) => `${value.slice(0, 1).toLowerCase()}${value.slice(1)}`;

export const normalizeFieldType = (typeName: string) => {
  const normalizedTypes: Record<string, string> = {
    string: "String",
    boolean: "Boolean",
    date: "Date",
    int: "Int",
    integer: "Int",
    float: "Float",
    double: "Float",
    decimal: "Float",
  };
  return normalizedTypes[typeName.toLowerCase()] ?? typeName;
};

export const ensureBaseTypeImport = (content: string, typeName: string) => {
  if (typeName !== "Int" && typeName !== "Float") return content;
  if (new RegExp(`import \\{[^}]*\\b${typeName}\\b[^}]*\\} from "akanjs/base";`).test(content)) return content;
  const baseImport = /import \{ ([^}]+) \} from "akanjs\/base";/.exec(content);
  if (baseImport) {
    const names = baseImport[1]
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean);
    return content.replace(baseImport[0], `import { ${[...names, typeName].sort().join(", ")} } from "akanjs/base";`);
  }
  return `import { ${typeName} } from "akanjs/base";\n${content}`;
};

const numericDefault = (typeName: "Int" | "Float", rawDefault: string): string | null => {
  const trimmed = rawDefault.trim();
  if (!trimmed || !Number.isFinite(Number(trimmed))) return null;
  if (typeName === "Int" && !/^-?\d+$/.test(trimmed)) return null;
  return trimmed;
};

export const coerceFieldDefault = (
  typeName: string,
  defaultValue?: string | null,
): { expression: string | null; diagnostic?: WorkflowDiagnostic } => {
  if (defaultValue === undefined || defaultValue === null || defaultValue === "") return { expression: null };
  const normalizedType = normalizeFieldType(typeName);
  if (normalizedType === "Int" || normalizedType === "Float") {
    const expression = numericDefault(normalizedType, defaultValue);
    if (expression !== null) return { expression };
    return {
      expression: null,
      diagnostic: {
        severity: "error",
        code: "primitive-default-value-invalid",
        input: "default",
        failureScope: "source-change",
        message: `Default value for ${normalizedType} must be a numeric literal. Received: ${JSON.stringify(defaultValue)}.`,
      },
    };
  }
  if (normalizedType === "Boolean") {
    const lowered = defaultValue.trim().toLowerCase();
    if (lowered === "true" || lowered === "false") return { expression: lowered };
    return {
      expression: null,
      diagnostic: {
        severity: "error",
        code: "primitive-default-value-invalid",
        input: "default",
        failureScope: "source-change",
        message: `Default value for Boolean must be true or false. Received: ${JSON.stringify(defaultValue)}.`,
      },
    };
  }
  return { expression: JSON.stringify(defaultValue) };
};

export const fieldExpression = (typeName: string, defaultValue?: string | null) => {
  const typeExpression = normalizeFieldType(typeName);
  const defaultExpression = coerceFieldDefault(typeExpression, defaultValue).expression;
  const defaultOption = defaultExpression ? `, { default: ${defaultExpression} }` : "";
  return `field(${typeExpression}${defaultOption})`;
};

export const insertIntoObject = (content: string, className: string, line: string) => {
  const classIndex = content.indexOf(`export class ${className} extends via`);
  if (classIndex < 0) return null;
  const objectEndIndex = content.indexOf("}))", classIndex);
  if (objectEndIndex < 0) return null;
  const prefix = content.slice(0, objectEndIndex);
  const suffix = content.slice(objectEndIndex);
  const insertion = prefix.endsWith("\n") ? `  ${line}\n` : `\n  ${line}\n`;
  return `${prefix}${insertion}${suffix}`;
};

export const ensureEnumImport = (content: string) => {
  if (content.includes("enumOf")) return content;
  const baseImport = /import \{ ([^}]+) \} from "akanjs\/base";/.exec(content);
  if (baseImport) {
    const names = baseImport[1]?.split(",").map((name) => name.trim()) ?? [];
    return content.replace(baseImport[0], `import { ${[...names, "enumOf"].sort().join(", ")} } from "akanjs/base";`);
  }
  return `import { enumOf } from "akanjs/base";\n${content}`;
};

export const insertEnumClass = (content: string, enumClassName: string, enumName: string, values: string[]) => {
  if (content.includes(`export class ${enumClassName} extends enumOf`)) return content;
  const enumClass = `export class ${enumClassName} extends enumOf("${enumName}", [\n${values
    .map((value) => `  ${JSON.stringify(value)},`)
    .join("\n")}\n] as const) {}\n\n`;
  const firstClassIndex = content.indexOf("export class ");
  if (firstClassIndex < 0) return `${content}\n${enumClass}`;
  return `${content.slice(0, firstClassIndex)}${enumClass}${content.slice(firstClassIndex)}`;
};

export const insertDictionaryModelField = (content: string, moduleClassName: string, fieldName: string) => {
  if (new RegExp(`\\b${fieldName}\\s*:`).test(content)) return content;
  const label = titleize(fieldName);
  const modelIndex = content.indexOf(`.model<${moduleClassName}>((t) => ({`);
  if (modelIndex < 0) return null;
  const objectEndIndex = content.indexOf("  }))", modelIndex);
  if (objectEndIndex < 0) return null;
  return `${content.slice(0, objectEndIndex)}    ${fieldName}: t([${JSON.stringify(label)}, ${JSON.stringify(
    label,
  )}]).desc([${JSON.stringify(label)}, ${JSON.stringify(label)}]),\n${content.slice(objectEndIndex)}`;
};

export const ensureConstantTypeImport = (content: string, constantPath: string, typeName: string) => {
  if (new RegExp(`import type \\{[^}]*\\b${typeName}\\b[^}]*\\} from "${constantPath}";`).test(content)) return content;
  const importPattern = new RegExp(`import type \\{ ([^}]+) \\} from "${constantPath}";`);
  const existingImport = content.match(importPattern);
  if (existingImport !== null) {
    const names = existingImport[1]?.split(",").map((name) => name.trim()) ?? [];
    return content.replace(
      existingImport[0],
      `import type { ${[...names, typeName].sort().join(", ")} } from "${constantPath}";`,
    );
  }
  return `import type { ${typeName} } from "${constantPath}";\n${content}`;
};

export const insertDictionaryEnum = (content: string, enumClassName: string, enumName: string, values: string[]) => {
  if (content.includes(`.enum<${enumClassName}>("${enumName}"`)) return content;
  const enumBlock = `  .enum<${enumClassName}>("${enumName}", (t) => ({\n${values
    .map((value) => `    ${value}: t([${JSON.stringify(titleize(value))}, ${JSON.stringify(titleize(value))}]),`)
    .join("\n")}\n  }))\n`;
  const chainEndIndex = content.lastIndexOf(";");
  const insertBeforeIndex = [content.indexOf(".error("), content.indexOf(".translate("), chainEndIndex]
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)[0];
  if (insertBeforeIndex === undefined) return null;
  return `${content.slice(0, insertBeforeIndex)}${enumBlock}${content.slice(insertBeforeIndex)}`;
};

export const parseValues = (value: string | null) =>
  value
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean) ?? [];
