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

export const moduleComponentName = (moduleName: string) =>
  `${moduleName.slice(0, 1).toUpperCase()}${moduleName.slice(1)}`;

export const moduleSourcePaths = (moduleName: string) => {
  const componentName = moduleComponentName(moduleName);
  return {
    abstract: `lib/${moduleName}/${moduleName}.abstract.md`,
    constant: `lib/${moduleName}/${moduleName}.constant.ts`,
    dictionary: `lib/${moduleName}/${moduleName}.dictionary.ts`,
    service: `lib/${moduleName}/${moduleName}.service.ts`,
    signal: `lib/${moduleName}/${moduleName}.signal.ts`,
    store: `lib/${moduleName}/${moduleName}.store.ts`,
    template: `lib/${moduleName}/${componentName}.Template.tsx`,
    unit: `lib/${moduleName}/${componentName}.Unit.tsx`,
    util: `lib/${moduleName}/${componentName}.Util.tsx`,
    view: `lib/${moduleName}/${componentName}.View.tsx`,
    zone: `lib/${moduleName}/${componentName}.Zone.tsx`,
  };
};

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

const koLabels: Record<string, string> = {
  amount: "금액",
  budget: "예산",
  category: "카테고리",
  content: "내용",
  count: "개수",
  createdAt: "생성일",
  date: "날짜",
  description: "설명",
  due: "마감일",
  dueAt: "마감일",
  email: "이메일",
  enabled: "활성화",
  endAt: "종료일",
  id: "ID",
  name: "이름",
  owner: "담당자",
  priority: "우선순위",
  project: "프로젝트",
  rating: "평점",
  startAt: "시작일",
  status: "상태",
  title: "제목",
  updatedAt: "수정일",
};

const splitFieldWords = (fieldName: string) =>
  fieldName
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);

const koLabelForField = (fieldName: string) => {
  if (koLabels[fieldName]) return koLabels[fieldName];
  const words = splitFieldWords(fieldName);
  const translated = words.map((word) => koLabels[word] ?? koLabels[lowerlize(word)] ?? null);
  return translated.every(Boolean) ? translated.join(" ") : null;
};

export const bilingualLabelForField = (fieldName: string) => {
  const en = titleize(fieldName);
  return { en, ko: koLabelForField(fieldName) ?? en };
};

export const bilingualDescriptionForField = (fieldName: string) => {
  const label = bilingualLabelForField(fieldName);
  return {
    en: `Enter ${label.en.toLowerCase()}.`,
    ko: `${label.ko} 값을 입력합니다.`,
  };
};

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

export type FieldDefaultValue = string | number | boolean | null;

const numericDefault = (typeName: "Int" | "Float", rawDefault: FieldDefaultValue): string | null => {
  if (typeof rawDefault === "number") {
    if (!Number.isFinite(rawDefault)) return null;
    if (typeName === "Int" && !Number.isInteger(rawDefault)) return null;
    return String(rawDefault);
  }
  if (typeof rawDefault !== "string") return null;
  const trimmed = rawDefault.trim();
  if (!trimmed || !Number.isFinite(Number(trimmed))) return null;
  if (typeName === "Int" && !/^-?\d+$/.test(trimmed)) return null;
  return trimmed;
};

const booleanDefault = (rawDefault: FieldDefaultValue): string | null => {
  if (typeof rawDefault === "boolean") return String(rawDefault);
  if (typeof rawDefault !== "string") return null;
  const lowered = rawDefault.trim().toLowerCase();
  return lowered === "true" || lowered === "false" ? lowered : null;
};

const dateDefault = (rawDefault: FieldDefaultValue): string | null => {
  if (typeof rawDefault === "number" && Number.isFinite(rawDefault)) return `new Date(${rawDefault})`;
  if (typeof rawDefault !== "string") return null;
  const trimmed = rawDefault.trim();
  if (!trimmed) return null;
  if (trimmed === "now") return "new Date()";
  if (!Number.isNaN(Date.parse(trimmed))) return `new Date(${JSON.stringify(trimmed)})`;
  return null;
};

export const coerceFieldDefault = (
  typeName: string,
  defaultValue?: FieldDefaultValue,
  options: { enumValues?: readonly string[] | null } = {},
): { expression: string | null; diagnostic?: WorkflowDiagnostic; normalized: boolean; normalizedType: string } => {
  const normalizedType = typeName.toLowerCase() === "enum" ? "enum" : normalizeFieldType(typeName);
  if (defaultValue === undefined || defaultValue === null || defaultValue === "") {
    return { expression: null, normalized: false, normalizedType };
  }
  if (normalizedType === "Int" || normalizedType === "Float") {
    const expression = numericDefault(normalizedType, defaultValue);
    if (expression !== null) return { expression, normalized: typeof defaultValue === "string", normalizedType };
    return {
      expression: null,
      normalized: false,
      normalizedType,
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
    const expression = booleanDefault(defaultValue);
    if (expression !== null) return { expression, normalized: typeof defaultValue === "string", normalizedType };
    return {
      expression: null,
      normalized: false,
      normalizedType,
      diagnostic: {
        severity: "error",
        code: "primitive-default-value-invalid",
        input: "default",
        failureScope: "source-change",
        message: `Default value for Boolean must be true or false. Received: ${JSON.stringify(defaultValue)}.`,
      },
    };
  }
  if (normalizedType === "Date") {
    const expression = dateDefault(defaultValue);
    if (expression !== null) return { expression, normalized: true, normalizedType };
    return {
      expression: null,
      normalized: false,
      normalizedType,
      diagnostic: {
        severity: "error",
        code: "primitive-default-value-invalid",
        input: "default",
        failureScope: "source-change",
        message: `Default value for Date must be "now", a timestamp, or a parseable date string. Received: ${JSON.stringify(
          defaultValue,
        )}.`,
      },
    };
  }
  if (normalizedType === "enum") {
    if (typeof defaultValue === "string" && options.enumValues?.includes(defaultValue)) {
      return { expression: JSON.stringify(defaultValue), normalized: false, normalizedType };
    }
    return {
      expression: null,
      normalized: false,
      normalizedType,
      diagnostic: {
        severity: "error",
        code: "primitive-default-value-invalid",
        input: "default",
        failureScope: "source-change",
        message: `Default value for enum must be one of: ${(options.enumValues ?? []).join(", ")}. Received: ${JSON.stringify(
          defaultValue,
        )}.`,
      },
    };
  }
  return {
    expression: JSON.stringify(String(defaultValue)),
    normalized: typeof defaultValue !== "string",
    normalizedType,
  };
};

export const fieldExpression = (
  typeName: string,
  defaultValue?: FieldDefaultValue,
  options: { enumValues?: readonly string[] | null; builderName?: string } = {},
) => {
  const typeExpression = normalizeFieldType(typeName);
  const defaultExpression = coerceFieldDefault(
    options.enumValues ? "enum" : typeExpression,
    defaultValue,
    options,
  ).expression;
  const defaultOption = defaultExpression ? `, { default: ${defaultExpression} }` : "";
  return `${options.builderName ?? "field"}(${typeExpression}${defaultOption})`;
};

export const viaBuilderParameterName = (content: string, className: string) => {
  const classIndex = content.indexOf(`export class ${className} extends via`);
  if (classIndex < 0) return null;
  const signature = content.slice(classIndex, content.indexOf("=>", classIndex));
  return /via\(\(\s*([A-Za-z_$][\w$]*)\s*\)/.exec(signature)?.[1] ?? null;
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

export const insertLightProjectionField = (content: string, moduleClassName: string, fieldName: string) => {
  const classIndex = content.indexOf(`export class Light${moduleClassName} extends via`);
  if (classIndex < 0) return null;
  const arrayMatch = /\[([\s\S]*?)\]\s+as const/.exec(content.slice(classIndex));
  if (!arrayMatch || arrayMatch.index === undefined) return null;
  const arrayStart = classIndex + arrayMatch.index;
  const arrayEnd = arrayStart + arrayMatch[0].length;
  const fields = [...arrayMatch[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]).filter(Boolean);
  if (fields.includes(fieldName)) return content;
  const nextFields = [...fields, fieldName];
  const nextArray =
    nextFields.length === 0
      ? "[] as const"
      : `[\n${nextFields.map((field) => `  ${JSON.stringify(field)},`).join("\n")}\n] as const`;
  return `${content.slice(0, arrayStart)}${nextArray}${content.slice(arrayEnd)}`;
};

export const insertTemplateField = ({
  content,
  moduleName,
  moduleClassName,
  fieldName,
  component,
}: {
  content: string;
  moduleName: string;
  moduleClassName: string;
  fieldName: string;
  component: "Field.Text" | "Field.Number" | "Field.Date";
}) => {
  if (content.includes(`l("${moduleName}.${fieldName}")`) || content.includes(`.${fieldName}`)) return content;
  const layoutEndIndex = content.indexOf("    </Layout.Template>");
  if (layoutEndIndex < 0) return null;
  const formName = `${moduleName}Form`;
  if (!content.includes(`const ${formName} = st.use.${moduleName}Form();`)) return null;
  const fieldSetter = `st.do.set${moduleComponentName(fieldName)}On${moduleClassName}`;
  const fieldBlock = `      <${component}
        label={l("${moduleName}.${fieldName}")}
        desc={l("${moduleName}.${fieldName}.desc")}
        value={${formName}.${fieldName}}
        onChange={${fieldSetter}}
      />
`;
  return `${content.slice(0, layoutEndIndex)}${fieldBlock}${content.slice(layoutEndIndex)}`;
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

const findMatchingBrace = (content: string, openIndex: number) => {
  let depth = 0;
  let quote: '"' | "'" | "`" | null = null;
  let escaped = false;
  for (let index = openIndex; index < content.length; index++) {
    const char = content[index];
    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        continue;
      }
      if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
};

const dictionaryModelFieldLine = (fieldName: string) => {
  const label = bilingualLabelForField(fieldName);
  const desc = bilingualDescriptionForField(fieldName);
  return `${fieldName}: t([${JSON.stringify(label.en)}, ${JSON.stringify(label.ko)}]).desc([${JSON.stringify(
    desc.en,
  )}, ${JSON.stringify(desc.ko)}]),`;
};

export const insertDictionaryModelField = (content: string, moduleClassName: string, fieldName: string) => {
  if (new RegExp(`\\b${fieldName}\\s*:`).test(content)) return content;
  const modelIndex = content.indexOf(`.model<${moduleClassName}>((t) => (`);
  if (modelIndex < 0) return null;
  const objectStartIndex = content.indexOf("{", modelIndex);
  if (objectStartIndex < 0) return null;
  const objectEndIndex = findMatchingBrace(content, objectStartIndex);
  if (objectEndIndex < 0) return null;
  const fieldLine = dictionaryModelFieldLine(fieldName);
  const body = content.slice(objectStartIndex + 1, objectEndIndex);
  if (body.trim().length === 0) {
    return `${content.slice(0, objectStartIndex + 1)}\n    ${fieldLine}\n  ${content.slice(objectEndIndex)}`;
  }
  const insertion = body.endsWith("\n") ? `    ${fieldLine}\n` : `\n    ${fieldLine}\n`;
  return `${content.slice(0, objectEndIndex)}${insertion}${content.slice(objectEndIndex)}`;
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
