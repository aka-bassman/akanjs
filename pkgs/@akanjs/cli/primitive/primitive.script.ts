import {
  type AddEnumFieldInput,
  type AddFieldInput,
  AppExecutor,
  coerceFieldDefault,
  compactDiagnostics,
  createPrimitiveWriteReport,
  ensureBaseTypeImport,
  ensureConstantTypeImport,
  ensureEnumImport,
  fieldExpression,
  generatedFilesForSync,
  insertDictionaryEnum,
  insertDictionaryModelField,
  insertEnumClass,
  insertIntoObject,
  LibExecutor,
  lowerlize,
  ModuleExecutor,
  nextActionsForTarget,
  normalizeFieldType,
  type PrimitiveChangedFile,
  type PrimitiveGeneratedFile,
  type PrimitiveTargetInput,
  parseValues,
  type Sys,
  script,
  sourceFile,
  type UiSurface,
  validationCommandsForTarget,
  type WorkflowDiagnostic,
  type Workspace,
} from "@akanjs/devkit";
import { capitalize } from "akanjs/common";
import { ModuleScript } from "../module/module.script";

export class PrimitiveScript extends script("primitive", [ModuleScript]) {
  async resolveSys(workspace: Workspace, target: string | null): Promise<Sys | null> {
    if (!target) return null;
    const [apps, libs] = await workspace.getSyss();
    if (apps.includes(target)) return AppExecutor.from(workspace, target);
    if (libs.includes(target)) return LibExecutor.from(workspace, target);
    return null;
  }

  async createUi(workspace: Workspace, input: PrimitiveTargetInput & { surface: UiSurface }) {
    const sys = await this.resolveSys(workspace, input.app);
    if (!sys || !input.module) {
      return createPrimitiveWriteReport({
        command: "create-ui",
        changedFiles: [],
        generatedFiles: [],
        validationCommands: [],
        diagnostics: compactDiagnostics([
          !sys && {
            severity: "error",
            code: "primitive-target-missing",
            message: "Target app or library was not found.",
          },
          !input.module && {
            severity: "error",
            code: "primitive-input-missing",
            message: "Module is required.",
            input: "module",
          },
        ] as WorkflowDiagnostic[]),
        nextActions: [],
      });
    }
    const mod = ModuleExecutor.from(sys, input.module);
    if (input.surface === "view") return await this.moduleScript.createView(mod);
    if (input.surface === "unit") return await this.moduleScript.createUnit(mod);
    return await this.moduleScript.createTemplate(mod);
  }

  async addField(workspace: Workspace, input: AddFieldInput) {
    return await this.addFieldToSources(workspace, input, { enumValues: null });
  }

  async addEnumField(workspace: Workspace, input: AddEnumFieldInput) {
    const values = parseValues(input.values);
    return await this.addFieldToSources(
      workspace,
      { ...input, type: `${capitalize(input.field ?? "")}` },
      { enumValues: values },
    );
  }

  async addFieldToSources(workspace: Workspace, input: AddFieldInput, { enumValues }: { enumValues: string[] | null }) {
    const sys = await this.resolveSys(workspace, input.app);
    const ambiguousNumberTypes = new Set(["number", "numeric"]);
    const normalizedType = input.type ? normalizeFieldType(input.type) : null;
    const diagnostics = compactDiagnostics([
      !sys && { severity: "error", code: "primitive-target-missing", message: "Target app or library was not found." },
      !input.module && {
        severity: "error",
        code: "primitive-input-missing",
        message: "Module is required.",
        input: "module",
      },
      !input.field && {
        severity: "error",
        code: "primitive-input-missing",
        message: "Field is required.",
        input: "field",
      },
      !input.type && {
        severity: "error",
        code: "primitive-input-missing",
        message: "Type is required.",
        input: "type",
      },
      enumValues && enumValues.length === 0
        ? { severity: "error", code: "primitive-input-missing", message: "Enum values are required.", input: "values" }
        : null,
      input.type && ambiguousNumberTypes.has(input.type.toLowerCase())
        ? {
            severity: "error",
            code: "primitive-field-type-unsupported",
            message: `Field type "${input.type}" is ambiguous in Akan. Use Int for integer fields or Float for decimal fields.`,
            input: "type",
          }
        : null,
    ] as WorkflowDiagnostic[]);
    if (
      !sys ||
      !input.module ||
      !input.field ||
      !input.type ||
      diagnostics.some((diagnostic) => diagnostic.severity === "error")
    ) {
      return createPrimitiveWriteReport({
        command: enumValues ? "add-enum-field" : "add-field",
        changedFiles: [],
        generatedFiles: [],
        validationCommands: [],
        diagnostics,
        nextActions: [],
      });
    }

    const moduleClassName = capitalize(input.module);
    const inputClassName = `${moduleClassName}Input`;
    const constantPath = `lib/${input.module}/${input.module}.constant.ts`;
    const dictionaryPath = `lib/${input.module}/${input.module}.dictionary.ts`;
    const changedFiles: PrimitiveChangedFile[] = [];
    const generatedFiles: PrimitiveGeneratedFile[] = generatedFilesForSync(sys);
    const [hasConstant, hasDictionary] = await Promise.all([sys.exists(constantPath), sys.exists(dictionaryPath)]);
    if (!hasConstant) {
      diagnostics.push({
        severity: "error",
        code: "primitive-source-missing",
        message: `Constant source file was not found: ${constantPath}.`,
      });
    }
    if (!hasDictionary) {
      diagnostics.push({
        severity: "error",
        code: "primitive-source-missing",
        message: `Dictionary source file was not found: ${dictionaryPath}.`,
      });
    }
    if (diagnostics.some((diagnostic) => diagnostic.severity === "error")) {
      return createPrimitiveWriteReport({
        command: enumValues ? "add-enum-field" : "add-field",
        changedFiles,
        generatedFiles,
        validationCommands: validationCommandsForTarget(sys.name),
        diagnostics,
        nextActions: nextActionsForTarget(sys.name),
      });
    }

    let constantContent = await sys.readFile(constantPath);
    let dictionaryContent = await sys.readFile(dictionaryPath);
    if (new RegExp(`\\b${input.field}\\s*:`).test(constantContent)) {
      diagnostics.push({
        severity: "error",
        code: "primitive-field-exists",
        input: "field",
        message: `Field "${input.field}" already exists in ${constantPath}.`,
      });
    }

    if (enumValues) {
      const enumClassName = `${moduleClassName}${capitalize(input.field)}`;
      const enumName = `${lowerlize(moduleClassName)}${capitalize(input.field)}`;
      constantContent = insertEnumClass(ensureEnumImport(constantContent), enumClassName, enumName, enumValues);
      dictionaryContent = ensureConstantTypeImport(dictionaryContent, `./${input.module}.constant`, enumClassName);
      input.type = enumClassName;
      const enumDictionary = insertDictionaryEnum(dictionaryContent, enumClassName, enumName, enumValues);
      if (!enumDictionary) {
        diagnostics.push({
          severity: "error",
          code: "primitive-dictionary-shape-unsupported",
          message: `Could not find a safe enum insertion point in ${dictionaryPath}.`,
        });
      } else {
        dictionaryContent = enumDictionary;
      }
    }
    if (!enumValues && normalizedType) {
      input.type = normalizedType;
      const defaultCoercion = coerceFieldDefault(input.type, input.defaultValue);
      if (defaultCoercion.diagnostic) diagnostics.push(defaultCoercion.diagnostic);
      constantContent = ensureBaseTypeImport(constantContent, input.type);
    }

    const nextConstantContent = insertIntoObject(
      constantContent,
      inputClassName,
      `${input.field}: ${fieldExpression(input.type, input.defaultValue)},`,
    );
    const nextDictionaryContent = insertDictionaryModelField(dictionaryContent, moduleClassName, input.field);
    if (
      nextConstantContent &&
      (input.type === "Int" || input.type === "Float") &&
      new RegExp(`\\b${input.field}\\s*:\\s*field\\(${input.type}, \\{ default: "`, "m").test(nextConstantContent)
    ) {
      diagnostics.push({
        severity: "error",
        code: "primitive-default-value-invalid",
        input: "default",
        failureScope: "source-change",
        message: `Generated ${input.type} default for "${input.field}" would be a string literal; refusing to write source.`,
      });
    }
    if (
      nextConstantContent &&
      (input.type === "Int" || input.type === "Float") &&
      !new RegExp(`import \\{[^}]*\\b${input.type}\\b[^}]*\\} from "akanjs/base";`).test(nextConstantContent)
    ) {
      diagnostics.push({
        severity: "error",
        code: "primitive-base-type-import-missing",
        failureScope: "source-change",
        message: `Generated source for ${input.field} requires ${input.type} import from "akanjs/base".`,
      });
    }
    if (!nextConstantContent) {
      diagnostics.push({
        severity: "error",
        code: "primitive-constant-shape-unsupported",
        message: `Could not find ${inputClassName} object shape in ${constantPath}.`,
      });
    }
    if (!nextDictionaryContent) {
      diagnostics.push({
        severity: "error",
        code: "primitive-dictionary-shape-unsupported",
        message: `Could not find ${moduleClassName} dictionary model shape in ${dictionaryPath}.`,
      });
    }

    if (
      !diagnostics.some((diagnostic) => diagnostic.severity === "error") &&
      nextConstantContent &&
      nextDictionaryContent
    ) {
      await sys.writeFile(constantPath, nextConstantContent);
      await sys.writeFile(dictionaryPath, nextDictionaryContent);
      changedFiles.push(
        sourceFile(sys, constantPath, "modify", "Field source shape was updated."),
        sourceFile(sys, dictionaryPath, "modify", "Field dictionary labels were updated."),
      );
    }

    return createPrimitiveWriteReport({
      command: enumValues ? "add-enum-field" : "add-field",
      changedFiles,
      generatedFiles,
      validationCommands: validationCommandsForTarget(sys.name),
      diagnostics,
      nextActions: nextActionsForTarget(sys.name),
    });
  }
}
