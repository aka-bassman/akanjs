import { capitalize } from "akanjs/common";
import { normalizeFieldType } from "./source";
import type {
  WorkflowDiagnostic,
  WorkflowInputSpec,
  WorkflowInputValue,
  WorkflowPlan,
  WorkflowPlanInputs,
  WorkflowRecommendation,
  WorkflowSpec,
  WorkflowSurfaceMode,
} from "./types";

const surfaceModes = new Set<WorkflowSurfaceMode>(["infer", "include", "skip"]);

const parseStringList = (value: unknown) => {
  if (Array.isArray(value)) {
    const values = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
    return values.length === value.length ? values : null;
  }
  if (typeof value !== "string") return null;
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const normalizeInputValue = (name: string, spec: WorkflowInputSpec, value: unknown): WorkflowInputValue | null => {
  if (spec.type === "string") return typeof value === "string" && value.length > 0 ? value : null;
  if (spec.type === "string-list") {
    const values = parseStringList(value);
    return values && values.length > 0 ? values : null;
  }
  if (typeof value === "string" && surfaceModes.has(value as WorkflowSurfaceMode)) return value as WorkflowSurfaceMode;
  throw new Error(`Unsupported workflow input value for ${name}`);
};

export const listWorkflowSpecs = (specs: readonly WorkflowSpec[]) =>
  [...specs].sort((a, b) => a.name.localeCompare(b.name));

export const getWorkflowSpec = (specs: readonly WorkflowSpec[], name: string) =>
  specs.find((spec) => spec.name === name) ?? null;

export const compactWorkflowInputs = (inputs: WorkflowPlanInputs) =>
  Object.fromEntries(Object.entries(inputs).filter(([, value]) => value !== null && value !== ""));

const addFieldComponentForType = (typeName: string) => {
  const normalizedType = normalizeFieldType(typeName);
  if (normalizedType === "Boolean") return "Field.ToggleSelect";
  if (normalizedType === "Date") return "Field.Date";
  if (normalizedType === "Int" || normalizedType === "Float") return "manual numeric input review";
  if (typeName.toLowerCase() === "enum") return "Field.ToggleSelect";
  return "Field.Text";
};

const createAddFieldRecommendations = (inputs: Record<string, WorkflowInputValue>): WorkflowRecommendation[] => {
  const app = typeof inputs.app === "string" ? inputs.app : "<app-or-lib>";
  const module = typeof inputs.module === "string" ? inputs.module : "<module>";
  const field = typeof inputs.field === "string" ? inputs.field : "<field>";
  const typeName = typeof inputs.type === "string" ? inputs.type : null;
  if (!typeName) return [];

  const normalizedType = typeName.toLowerCase() === "enum" ? "enum" : normalizeFieldType(typeName);
  const constantPath = `*/lib/${module}/${module}.constant.ts`;
  const dictionaryPath = `*/lib/${module}/${module}.dictionary.ts`;
  const templatePath = `*/lib/${module}/${capitalize(module)}.Template.tsx`;
  return [
    ...(normalizedType === "Int" || normalizedType === "Float"
      ? [
          {
            code: "add-field-import",
            kind: "import" as const,
            target: constantPath,
            confidence: "high" as const,
            message: `Import ${normalizedType} from "akanjs/base" before writing field(${normalizedType}).`,
          },
        ]
      : []),
    {
      code: "add-field-placement-constant",
      kind: "placement",
      target: constantPath,
      confidence: "high",
      message: `Insert ${field}: field(${normalizedType}) in ${capitalize(module)}Input.`,
    },
    {
      code: "add-field-placement-dictionary",
      kind: "placement",
      target: dictionaryPath,
      confidence: "high",
      message: `Add dictionary labels for ${module}.${field}.`,
    },
    {
      code: "add-field-component",
      kind: "ui-component",
      target: templatePath,
      confidence: normalizedType === "Int" || normalizedType === "Float" ? "low" : "high",
      action:
        normalizedType === "Int" || normalizedType === "Float"
          ? "Do not auto-edit UI. Check local Template/Unit/View patterns for Field.Text parsing, formatting, validation rules, and dictionary labels before adding a numeric input."
          : undefined,
      message:
        normalizedType === "Int" || normalizedType === "Float"
          ? `Numeric UI for ${field} (${normalizedType}) requires manual review; a safe numeric input component pattern is not yet detected.`
          : `Recommended UI component for ${field} (${normalizedType}): ${addFieldComponentForType(typeName)}.`,
    },
    {
      code: "add-field-ui-manual-review",
      kind: "manual-action",
      target: templatePath,
      action: `Review ${app}:${module} Template/Unit/View/Store surfaces and add ${field} only where the existing pattern is clear. For numeric fields, confirm parser/formatter behavior and validation before using Field.Text.`,
      confidence: "medium",
      message:
        normalizedType === "Int" || normalizedType === "Float"
          ? "UI surface edits stay manual because a safe numeric input component pattern is not yet detected."
          : "UI surface edits are planned as manual-review unless a safe existing field-list pattern is detected.",
    },
  ];
};

const createWorkflowPlanRecommendations = (
  spec: WorkflowSpec,
  inputs: Record<string, WorkflowInputValue>,
): WorkflowRecommendation[] => [
  {
    code: "workflow-apply-first",
    kind: "auto-apply",
    confidence: "high",
    action: "Call apply_workflow with the MCP planPath before editing source files directly.",
    message: `Apply the ${spec.name} plan through apply_workflow when MCP returns planPath or next.tool=apply_workflow.`,
  },
  {
    code: "workflow-validate-apply-report",
    kind: "validation",
    confidence: "high",
    action:
      "After apply_workflow, call run_validation with validationTarget when present; otherwise use applyReportPath.",
    message: "Validate the apply report artifact so diagnostics and recommendations follow the actual apply result.",
  },
  ...(spec.name === "add-field" ? createAddFieldRecommendations(inputs) : []),
];

export const createWorkflowPlan = (spec: WorkflowSpec, rawInputs: Record<string, unknown>): WorkflowPlan => {
  const inputs: Record<string, WorkflowInputValue> = {};
  const diagnostics: WorkflowDiagnostic[] = [];

  for (const [name, inputSpec] of Object.entries(spec.inputs)) {
    const rawValue = rawInputs[name];
    if (rawValue === undefined || rawValue === null || rawValue === "") {
      if (inputSpec.required) {
        diagnostics.push({
          severity: "error",
          code: "workflow-input-missing",
          input: name,
          message: `Workflow ${spec.name} requires input "${name}".`,
        });
      }
      continue;
    }

    const value = normalizeInputValue(name, inputSpec, rawValue);
    if (value === null) {
      diagnostics.push({
        severity: "error",
        code: "workflow-input-invalid",
        input: name,
        message: `Workflow ${spec.name} input "${name}" must be ${inputSpec.type}.`,
      });
      continue;
    }
    if (inputSpec.allowedValues && typeof value === "string" && !inputSpec.allowedValues.includes(value)) {
      diagnostics.push({
        severity: "error",
        code: "workflow-input-not-allowed",
        input: name,
        message: `Workflow ${spec.name} input "${name}" must be one of: ${inputSpec.allowedValues.join(", ")}.`,
      });
      continue;
    }
    inputs[name] = value;
  }

  const fieldType = inputs.type;
  if (
    spec.name === "add-field" &&
    typeof fieldType === "string" &&
    (fieldType.toLowerCase() === "number" || fieldType.toLowerCase() === "numeric")
  ) {
    diagnostics.push({
      severity: "error",
      code: "primitive-field-type-unsupported",
      input: "type",
      message: `Field type "${fieldType}" is ambiguous in Akan. Use Int for integer fields or Float for decimal fields.`,
    });
  }

  return {
    schemaVersion: 1,
    workflow: spec.name,
    mode: "plan",
    inputs,
    optionalSurfaces: spec.optionalSurfaces ?? {},
    steps: spec.steps,
    predictedChanges: spec.predictedChanges,
    validation: spec.validation,
    diagnostics,
    recommendations: createWorkflowPlanRecommendations(spec, inputs),
    requiresApproval: true,
  };
};
