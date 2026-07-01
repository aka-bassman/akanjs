export type WorkflowInputType = "string" | "string-list" | "surface-mode";
export type WorkflowSurfaceMode = "infer" | "include" | "skip";
export type WorkflowInputValue = string | string[] | WorkflowSurfaceMode;

export interface WorkflowInputSpec {
  type: WorkflowInputType;
  required?: boolean;
  description: string;
  allowedValues?: readonly string[];
}

export interface WorkflowStep {
  id: string;
  title: string;
  tool: string;
  description: string;
  when?: string;
}

export interface WorkflowPredictedChange {
  target: string;
  action: "inspect" | "create" | "modify" | "sync" | "validate";
  reason: string;
}

export interface WorkflowValidation {
  command: string;
  reason: string;
}

export interface WorkflowSpec {
  schemaVersion: 1;
  name: string;
  description: string;
  whenToUse: string;
  inputs: Record<string, WorkflowInputSpec>;
  optionalSurfaces?: Record<string, WorkflowSurfaceMode>;
  steps: readonly WorkflowStep[];
  predictedChanges: readonly WorkflowPredictedChange[];
  validation: readonly WorkflowValidation[];
  completionCriteria: readonly string[];
}

export interface WorkflowDiagnostic {
  severity: "warning" | "error";
  code: string;
  message: string;
  input?: string;
}

export interface WorkflowPlan {
  schemaVersion: 1;
  workflow: string;
  mode: "plan";
  inputs: Record<string, WorkflowInputValue>;
  optionalSurfaces: Record<string, WorkflowSurfaceMode>;
  steps: readonly WorkflowStep[];
  predictedChanges: readonly WorkflowPredictedChange[];
  validation: readonly WorkflowValidation[];
  diagnostics: WorkflowDiagnostic[];
  requiresApproval: true;
}

export interface WorkflowReport {
  schemaVersion: 1;
  workflow: string;
  mode: "plan" | "apply";
  status: "passed" | "failed";
  diagnostics: WorkflowDiagnostic[];
  plan?: WorkflowPlan;
}

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
    requiresApproval: true,
  };
};
