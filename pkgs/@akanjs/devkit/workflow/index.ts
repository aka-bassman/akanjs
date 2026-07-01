import type { Sys, Workspace } from "../commandDecorators";
import { AppExecutor, LibExecutor } from "../executors";

export type WorkflowInputType = "string" | "string-list" | "surface-mode";
export type WorkflowSurfaceMode = "infer" | "include" | "skip";
export type WorkflowInputValue = string | string[] | WorkflowSurfaceMode;
export type WorkflowFormat = "markdown" | "json";
export type WorkflowPlanInputs = Record<string, string | null>;
export type PrimitiveFormat = "markdown" | "json";
export type UiSurface = "view" | "unit" | "template";

export interface PrimitiveTargetInput {
  app: string | null;
  module: string | null;
}

export interface AddFieldInput extends PrimitiveTargetInput {
  field: string | null;
  type: string | null;
  defaultValue?: string | null;
}

export interface AddEnumFieldInput extends PrimitiveTargetInput {
  field: string | null;
  values: string | null;
  defaultValue?: string | null;
}

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
  mode: "plan" | "dry-run" | "apply";
  status: "passed" | "failed";
  diagnostics: WorkflowDiagnostic[];
  plan?: WorkflowPlan;
}

export interface WorkflowApplyCommand {
  command: string;
  reason: string;
  stepId?: string;
}

export type WorkflowRunSource =
  | { type: "plan"; path: string }
  | { type: "apply-report"; path: string; runId?: string }
  | { type: "run-report"; runId: string };

export interface WorkflowValidationCommandResult {
  command: string;
  reason: string;
  status: "passed" | "failed";
  exitCode: number;
  stdout?: string;
  stderr?: string;
}

export interface RepairAction {
  command: string;
  reason: string;
  kind: "generated" | "format" | "imports" | "dictionary" | "module-shape";
  safeToRun: boolean;
}

export interface PrimitiveChangedFile {
  path: string;
  action: "create" | "modify" | "remove";
  reason: string;
}

export interface PrimitiveGeneratedFile {
  path: string;
  action: "sync";
  reason: string;
}

export interface PrimitiveValidationCommand {
  command: string;
  reason: string;
}

export interface PrimitiveNextAction {
  command: string;
  reason: string;
}

export interface PrimitiveWriteReport {
  schemaVersion: 1;
  command: string;
  status: "passed" | "failed";
  changedFiles: PrimitiveChangedFile[];
  generatedFiles: PrimitiveGeneratedFile[];
  validationCommands: PrimitiveValidationCommand[];
  diagnostics: WorkflowDiagnostic[];
  nextActions: PrimitiveNextAction[];
}

export type PrimitiveFileMap = Record<string, { filename: string; content: string }>;

export interface WorkflowApplyReport {
  schemaVersion: 1;
  workflow: string;
  mode: "dry-run" | "apply";
  status: "passed" | "failed";
  changedFiles: PrimitiveChangedFile[];
  generatedFiles: PrimitiveGeneratedFile[];
  commands: WorkflowApplyCommand[];
  diagnostics: WorkflowDiagnostic[];
  nextActions: PrimitiveNextAction[];
  plan: WorkflowPlan;
}

export interface WorkflowValidationRunReport {
  schemaVersion: 1;
  runId: string;
  workflow: string;
  mode: "validate";
  source: WorkflowRunSource;
  status: "passed" | "failed";
  commands: WorkflowValidationCommandResult[];
  diagnostics: WorkflowDiagnostic[];
  repairActions: RepairAction[];
  nextActions: PrimitiveNextAction[];
  plan?: WorkflowPlan;
}

export interface RepairReport {
  schemaVersion: 1;
  command: string;
  kind: RepairAction["kind"];
  target: string | null;
  status: "passed" | "failed";
  diagnostics: WorkflowDiagnostic[];
  repairActions: RepairAction[];
  nextActions: PrimitiveNextAction[];
  commands: WorkflowValidationCommandResult[];
}

export type WorkflowRunArtifact = WorkflowApplyReport | WorkflowValidationRunReport | RepairReport;

export interface WorkflowStepResult {
  changedFiles?: PrimitiveChangedFile[];
  generatedFiles?: PrimitiveGeneratedFile[];
  commands?: WorkflowApplyCommand[];
  diagnostics?: WorkflowDiagnostic[];
  nextActions?: PrimitiveNextAction[];
}

export type WorkflowStepRunner = (step: WorkflowStep, plan: WorkflowPlan) => Promise<WorkflowStepResult | undefined>;
export type WorkflowStepRegistry = Record<string, WorkflowStepRunner>;

export interface WorkflowPrimitiveOperations {
  workspace: Workspace;
  createModule: (sys: Sys, module: string) => Promise<PrimitiveWriteReport>;
  createScalar: (sys: Sys, scalar: string) => Promise<PrimitiveWriteReport>;
  createUi: (input: PrimitiveTargetInput & { surface: UiSurface }) => Promise<PrimitiveWriteReport>;
  addField: (input: AddFieldInput) => Promise<PrimitiveWriteReport>;
  addEnumField: (input: AddEnumFieldInput) => Promise<PrimitiveWriteReport>;
}

export const jsonText = (value: unknown, { trailingNewline = true }: { trailingNewline?: boolean } = {}) =>
  `${JSON.stringify(value, null, 2)}${trailingNewline ? "\n" : ""}`;

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

export const renderWorkflowList = (specs: readonly WorkflowSpec[]) =>
  [
    "# Akan Workflows",
    "",
    ...specs.flatMap((spec) => [`- \`${spec.name}\`: ${spec.description}`, `  - When: ${spec.whenToUse}`]),
    "",
  ].join("\n");

export const renderWorkflowExplain = (spec: WorkflowSpec) =>
  [
    `# Workflow: ${spec.name}`,
    "",
    spec.description,
    "",
    "## When To Use",
    spec.whenToUse,
    "",
    "## Inputs",
    ...Object.entries(spec.inputs).map(
      ([name, input]) =>
        `- \`${name}\`${input.required ? " (required)" : ""}: ${input.description}${
          input.allowedValues ? ` Allowed: ${input.allowedValues.join(", ")}.` : ""
        }`,
    ),
    "",
    "## Optional Surfaces",
    ...Object.entries(spec.optionalSurfaces ?? {}).map(([name, mode]) => `- \`${name}\`: ${mode}`),
    "",
    "## Steps",
    ...spec.steps.map((step, index) => `${index + 1}. \`${step.id}\` (${step.tool}): ${step.description}`),
    "",
    "## Validation",
    ...spec.validation.map((validation) => `- \`${validation.command}\`: ${validation.reason}`),
    "",
  ].join("\n");

export const renderWorkflowPlan = (plan: WorkflowPlan) =>
  [
    `# Workflow Plan: ${plan.workflow}`,
    "",
    `- Mode: ${plan.mode}`,
    `- Requires approval: ${plan.requiresApproval}`,
    "",
    "## Inputs",
    ...Object.entries(plan.inputs).map(
      ([name, value]) => `- \`${name}\`: ${Array.isArray(value) ? value.join(", ") : value}`,
    ),
    "",
    "## Optional Surfaces",
    ...Object.entries(plan.optionalSurfaces).map(([name, mode]) => `- \`${name}\`: ${mode}`),
    "",
    "## Steps",
    ...plan.steps.map((step, index) => `${index + 1}. \`${step.id}\` (${step.tool}): ${step.description}`),
    "",
    "## Predicted Changes",
    ...plan.predictedChanges.map((change) => `- \`${change.action}\` ${change.target}: ${change.reason}`),
    "",
    "## Validation",
    ...plan.validation.map((validation) => `- \`${validation.command}\`: ${validation.reason}`),
    "",
    "## Diagnostics",
    ...(plan.diagnostics.length
      ? plan.diagnostics.map((diagnostic) => `- [${diagnostic.severity}] ${diagnostic.code}: ${diagnostic.message}`)
      : ["- none"]),
    "",
  ].join("\n");

const workflowStatus = (diagnostics: readonly WorkflowDiagnostic[]) =>
  diagnostics.some((diagnostic) => diagnostic.severity === "error") ? "failed" : "passed";

const commandStatus = (commands: readonly WorkflowValidationCommandResult[]) =>
  commands.some((command) => command.status === "failed") ? "failed" : "passed";

const uniqueBy = <T>(values: readonly T[], key: (value: T) => string) => {
  const seen = new Set<string>();
  return values.filter((value) => {
    const itemKey = key(value);
    if (seen.has(itemKey)) return false;
    seen.add(itemKey);
    return true;
  });
};

export const createWorkflowApplyReport = ({
  workflow,
  mode,
  changedFiles = [],
  generatedFiles = [],
  commands = [],
  diagnostics = [],
  nextActions = [],
  plan,
}: Omit<WorkflowApplyReport, "schemaVersion" | "status">): WorkflowApplyReport => ({
  schemaVersion: 1,
  workflow,
  mode,
  status: workflowStatus(diagnostics),
  changedFiles: uniqueBy(changedFiles, (file) => `${file.action}:${file.path}:${file.reason}`),
  generatedFiles: uniqueBy(generatedFiles, (file) => `${file.action}:${file.path}:${file.reason}`),
  commands: uniqueBy(commands, (command) => command.command),
  diagnostics,
  nextActions: uniqueBy(nextActions, (action) => action.command),
  plan,
});

export const resolveWorkflowCommand = (command: string, plan: WorkflowPlan) => {
  const target = typeof plan.inputs.app === "string" ? plan.inputs.app : "<app-or-lib>";
  return command
    .replaceAll("<app-or-lib-or-pkg>", target)
    .replaceAll("<app-or-lib>", target)
    .replaceAll("<app-name>", target);
};

export const workflowCommandsForPlan = (plan: WorkflowPlan) =>
  plan.validation.map((validation) => ({
    command: resolveWorkflowCommand(validation.command, plan),
    reason: validation.reason,
  })) satisfies WorkflowApplyCommand[];

export const workflowRunsDir = ".akan/workflows/runs";

export const createWorkflowRunId = (prefix = "run") =>
  `${prefix}-${new Date()
    .toISOString()
    .replace(/[-:.TZ]/g, "")
    .slice(0, 14)}-${Math.random().toString(36).slice(2, 8)}`;

const getRunId = (artifact: WorkflowRunArtifact) => {
  if ("runId" in artifact) return artifact.runId;
  return createWorkflowRunId("mode" in artifact ? artifact.mode : artifact.kind);
};

export const workflowRunArtifactPath = (runId: string) => `${workflowRunsDir}/${runId}.json`;

export const writeWorkflowRunArtifact = async (workspace: Workspace, artifact: WorkflowRunArtifact) => {
  const runId = getRunId(artifact);
  const artifactPath = workflowRunArtifactPath(runId);
  await workspace.writeFile(artifactPath, jsonText(artifact));
  return { runId, path: artifactPath };
};

export const readWorkflowRunArtifact = async (workspace: Workspace, runId: string) => {
  const artifactPath = workflowRunArtifactPath(runId);
  if (!(await workspace.exists(artifactPath))) throw new Error(`Workflow run artifact does not exist: ${artifactPath}`);
  return (await workspace.readJson(artifactPath)) as WorkflowRunArtifact;
};

export type WorkflowValidationCommandExecutor = (
  command: WorkflowApplyCommand,
) => Promise<WorkflowValidationCommandResult>;

export const createWorkflowValidationRunReport = async ({
  runId = createWorkflowRunId("validation"),
  workflow,
  source,
  plan,
  commands,
  execute,
  diagnostics = [],
  repairActions = [],
}: {
  runId?: string;
  workflow: string;
  source: WorkflowRunSource;
  plan?: WorkflowPlan;
  commands: WorkflowApplyCommand[];
  execute: WorkflowValidationCommandExecutor;
  diagnostics?: WorkflowDiagnostic[];
  repairActions?: RepairAction[];
}): Promise<WorkflowValidationRunReport> => {
  const results: WorkflowValidationCommandResult[] = [];
  for (const command of commands) {
    results.push(await execute(command));
  }
  const commandDiagnostics = results.flatMap((result) =>
    result.status === "failed"
      ? [
          {
            severity: "error" as const,
            code: "workflow-validation-command-failed",
            message: `Validation command failed: ${result.command}`,
          },
        ]
      : [],
  );
  return {
    schemaVersion: 1,
    runId,
    workflow,
    mode: "validate",
    source,
    status: workflowStatus([...diagnostics, ...commandDiagnostics]) === "failed" ? "failed" : commandStatus(results),
    commands: results,
    diagnostics: [...diagnostics, ...commandDiagnostics],
    repairActions: uniqueBy(repairActions, (action) => action.command),
    nextActions: results
      .filter((result) => result.status === "failed")
      .map((result) => ({ command: result.command, reason: "Re-run this validation command after repair." })),
    plan,
  };
};

export const createDryRunWorkflowApplyReport = (plan: WorkflowPlan) => {
  const changedFiles: PrimitiveChangedFile[] = plan.predictedChanges.flatMap((change) => {
    if (change.action !== "create" && change.action !== "modify") return [];
    return [
      {
        path: change.target,
        action: change.action,
        reason: change.reason,
      },
    ];
  });
  const generatedFiles: PrimitiveGeneratedFile[] = plan.predictedChanges.flatMap((change) => {
    if (change.action !== "sync") return [];
    return [
      {
        path: change.target,
        action: "sync",
        reason: change.reason,
      },
    ];
  });
  const diagnostics = [...plan.diagnostics];
  return createWorkflowApplyReport({
    workflow: plan.workflow,
    mode: "dry-run",
    changedFiles,
    generatedFiles,
    commands: workflowCommandsForPlan(plan),
    diagnostics,
    nextActions: workflowCommandsForPlan(plan),
    plan,
  });
};

export const workflowStepKey = (workflow: string, stepId: string) => `${workflow}:${stepId}`;

export const primitiveReportToWorkflowStepResult = (report: PrimitiveWriteReport): WorkflowStepResult => ({
  changedFiles: report.changedFiles,
  generatedFiles: report.generatedFiles,
  commands: report.validationCommands,
  diagnostics: report.diagnostics,
  nextActions: report.nextActions,
});

const workflowStringInput = (value: WorkflowInputValue | undefined) => (typeof value === "string" ? value : null);
const workflowStringListInput = (value: WorkflowInputValue | undefined) =>
  Array.isArray(value) ? value.join(",") : null;

const resolveWorkflowSys = async (workspace: Workspace, target: string | null): Promise<Sys | null> => {
  if (!target) return null;
  const [apps, libs] = await workspace.getSyss();
  if (apps.includes(target)) return AppExecutor.from(workspace, target);
  if (libs.includes(target)) return LibExecutor.from(workspace, target);
  return null;
};

const targetMissing = (input = "app"): WorkflowDiagnostic => ({
  severity: "error",
  code: "workflow-target-missing",
  input,
  message: "Workflow target app or library was not found.",
});

const inputMissing = (input: string): WorkflowDiagnostic => ({
  severity: "error",
  code: "workflow-input-missing",
  input,
  message: `Workflow input "${input}" is required for apply.`,
});

const unsupportedInput = (input: string, message: string): WorkflowDiagnostic => ({
  severity: "error",
  code: "workflow-input-unsupported",
  input,
  message,
});

export const createWorkflowStepRegistry = ({
  workspace,
  createModule,
  createScalar,
  createUi,
  addField,
  addEnumField,
}: WorkflowPrimitiveOperations): WorkflowStepRegistry => {
  const inspect = async () => undefined;
  const commandOnly = async () => undefined;

  return {
    inspectSystem: inspect,
    inspectModule: inspect,
    syncTarget: commandOnly,
    lintTarget: commandOnly,
    [workflowStepKey("create-module", "create-module")]: async (_step, plan) => {
      const app = workflowStringInput(plan.inputs.app);
      const module = workflowStringInput(plan.inputs.module);
      const sys = await resolveWorkflowSys(workspace, app);
      if (!sys || !module) return { diagnostics: [!sys ? targetMissing() : inputMissing("module")] };
      return primitiveReportToWorkflowStepResult(await createModule(sys, module));
    },
    [workflowStepKey("create-scalar", "create-scalar")]: async (_step, plan) => {
      const app = workflowStringInput(plan.inputs.app);
      const scalar = workflowStringInput(plan.inputs.scalar);
      const sys = await resolveWorkflowSys(workspace, app);
      if (!sys || !scalar) return { diagnostics: [!sys ? targetMissing() : inputMissing("scalar")] };
      return primitiveReportToWorkflowStepResult(await createScalar(sys, scalar));
    },
    [workflowStepKey("create-ui", "create-ui")]: async (_step, plan) => {
      const surface = workflowStringInput(plan.inputs.surface);
      if (surface !== "view" && surface !== "unit" && surface !== "template") {
        return {
          diagnostics: [
            unsupportedInput("surface", "Workflow apply currently supports create-ui surfaces: view, unit, template."),
          ],
        };
      }
      return primitiveReportToWorkflowStepResult(
        await createUi({
          app: workflowStringInput(plan.inputs.app),
          module: workflowStringInput(plan.inputs.module),
          surface,
        }),
      );
    },
    [workflowStepKey("add-field", "update-constant")]: async (_step, plan) => {
      if (workflowStringInput(plan.inputs.type)?.toLowerCase() === "enum") {
        return primitiveReportToWorkflowStepResult(
          await addEnumField({
            app: workflowStringInput(plan.inputs.app),
            module: workflowStringInput(plan.inputs.module),
            field: workflowStringInput(plan.inputs.field),
            values: workflowStringListInput(plan.inputs.values),
            defaultValue: workflowStringInput(plan.inputs.default),
          }),
        );
      }
      return primitiveReportToWorkflowStepResult(
        await addField({
          app: workflowStringInput(plan.inputs.app),
          module: workflowStringInput(plan.inputs.module),
          field: workflowStringInput(plan.inputs.field),
          type: workflowStringInput(plan.inputs.type),
          defaultValue: workflowStringInput(plan.inputs.default),
        }),
      );
    },
    [workflowStepKey("add-field", "update-dictionary")]: inspect,
    [workflowStepKey("add-field", "update-ui-surfaces")]: inspect,
    [workflowStepKey("add-enum-field", "update-constant")]: async (_step, plan) =>
      primitiveReportToWorkflowStepResult(
        await addEnumField({
          app: workflowStringInput(plan.inputs.app),
          module: workflowStringInput(plan.inputs.module),
          field: workflowStringInput(plan.inputs.field),
          values: workflowStringListInput(plan.inputs.values),
          defaultValue: workflowStringInput(plan.inputs.default),
        }),
      ),
    [workflowStepKey("add-enum-field", "update-dictionary")]: inspect,
    [workflowStepKey("add-enum-field", "update-option")]: inspect,
  };
};

export const createWorkflowStepCommandResult = (
  step: WorkflowStep,
  command: string,
  reason: string,
): WorkflowStepResult => ({
  commands: [{ command, reason, stepId: step.id }],
  nextActions: [{ command, reason }],
});

export const renderWorkflowApplyReport = (report: WorkflowApplyReport) =>
  [
    `# Workflow Apply: ${report.workflow}`,
    "",
    `- Mode: ${report.mode}`,
    `- Status: ${report.status}`,
    "",
    "## Changed Files",
    ...(report.changedFiles.length
      ? report.changedFiles.map((file) => `- \`${file.action}\` ${file.path}: ${file.reason}`)
      : ["- none"]),
    "",
    "## Generated Files",
    ...(report.generatedFiles.length
      ? report.generatedFiles.map((file) => `- \`${file.action}\` ${file.path}: ${file.reason}`)
      : ["- none"]),
    "",
    "## Commands",
    ...(report.commands.length
      ? report.commands.map((command) => `- \`${command.command}\`: ${command.reason}`)
      : ["- none"]),
    "",
    "## Diagnostics",
    ...(report.diagnostics.length
      ? report.diagnostics.map((diagnostic) => `- [${diagnostic.severity}] ${diagnostic.code}: ${diagnostic.message}`)
      : ["- none"]),
    "",
    "## Next Actions",
    ...(report.nextActions.length
      ? report.nextActions.map((action) => `- \`${action.command}\`: ${action.reason}`)
      : ["- none"]),
    "",
  ].join("\n");

export const renderWorkflowApply = (report: WorkflowApplyReport, format: WorkflowFormat = "markdown") =>
  format === "json" ? jsonText(report) : renderWorkflowApplyReport(report);

export const renderWorkflowValidationRunReport = (report: WorkflowValidationRunReport) =>
  [
    `# Workflow Validation: ${report.workflow}`,
    "",
    `- Run: ${report.runId}`,
    `- Status: ${report.status}`,
    "",
    "## Commands",
    ...(report.commands.length
      ? report.commands.map((command) => `- [${command.status}] \`${command.command}\`: ${command.reason}`)
      : ["- none"]),
    "",
    "## Diagnostics",
    ...(report.diagnostics.length
      ? report.diagnostics.map((diagnostic) => `- [${diagnostic.severity}] ${diagnostic.code}: ${diagnostic.message}`)
      : ["- none"]),
    "",
    "## Repair Actions",
    ...(report.repairActions.length
      ? report.repairActions.map((action) => `- \`${action.command}\`: ${action.reason}`)
      : ["- none"]),
    "",
    "## Next Actions",
    ...(report.nextActions.length
      ? report.nextActions.map((action) => `- \`${action.command}\`: ${action.reason}`)
      : ["- none"]),
    "",
  ].join("\n");

export const renderWorkflowValidation = (report: WorkflowValidationRunReport, format: WorkflowFormat = "markdown") =>
  format === "json" ? jsonText(report) : renderWorkflowValidationRunReport(report);

export const renderWorkflowRunArtifact = (artifact: WorkflowRunArtifact, format: WorkflowFormat = "markdown") => {
  if ("kind" in artifact) return renderRepairReport(artifact, format);
  if ("mode" in artifact && artifact.mode === "validate") return renderWorkflowValidation(artifact, format);
  if ("mode" in artifact && (artifact.mode === "apply" || artifact.mode === "dry-run")) {
    return renderWorkflowApply(artifact, format);
  }
  return jsonText(artifact);
};

export const createRepairReport = ({
  command,
  kind,
  target = null,
  diagnostics = [],
  repairActions = [],
  nextActions = [],
  commands = [],
}: Omit<
  RepairReport,
  "schemaVersion" | "status" | "target" | "diagnostics" | "repairActions" | "nextActions" | "commands"
> &
  Partial<
    Pick<RepairReport, "target" | "diagnostics" | "repairActions" | "nextActions" | "commands">
  >): RepairReport => ({
  schemaVersion: 1,
  command,
  kind,
  target,
  status: workflowStatus(diagnostics) === "failed" || commandStatus(commands) === "failed" ? "failed" : "passed",
  diagnostics,
  repairActions: uniqueBy(repairActions, (action) => action.command),
  nextActions: uniqueBy(nextActions, (action) => action.command),
  commands,
});

export const renderRepairReportMarkdown = (report: RepairReport) =>
  [
    `# Akan Repair: ${report.kind}`,
    "",
    `- Status: ${report.status}`,
    `- Target: ${report.target ?? "none"}`,
    "",
    "## Commands",
    ...(report.commands.length
      ? report.commands.map((command) => `- [${command.status}] \`${command.command}\`: ${command.reason}`)
      : ["- none"]),
    "",
    "## Diagnostics",
    ...(report.diagnostics.length
      ? report.diagnostics.map((diagnostic) => `- [${diagnostic.severity}] ${diagnostic.code}: ${diagnostic.message}`)
      : ["- none"]),
    "",
    "## Next Actions",
    ...(report.nextActions.length
      ? report.nextActions.map((action) => `- \`${action.command}\`: ${action.reason}`)
      : ["- none"]),
    "",
  ].join("\n");

export const renderRepairReport = (report: RepairReport, format: WorkflowFormat = "markdown") =>
  format === "json" ? jsonText(report) : renderRepairReportMarkdown(report);

export class WorkflowExecutor {
  constructor(private readonly registry: WorkflowStepRegistry) {}

  async apply(plan: WorkflowPlan): Promise<WorkflowApplyReport> {
    const changedFiles: PrimitiveChangedFile[] = [];
    const generatedFiles: PrimitiveGeneratedFile[] = [];
    const commands: WorkflowApplyCommand[] = [];
    const diagnostics: WorkflowDiagnostic[] = [...plan.diagnostics];
    const nextActions: PrimitiveNextAction[] = [];

    if (diagnostics.some((diagnostic) => diagnostic.severity === "error")) {
      return createWorkflowApplyReport({
        workflow: plan.workflow,
        mode: "apply",
        changedFiles,
        generatedFiles,
        commands,
        diagnostics,
        nextActions,
        plan,
      });
    }

    commands.push(...workflowCommandsForPlan(plan));
    nextActions.push(...workflowCommandsForPlan(plan));

    for (const step of plan.steps) {
      const runner =
        this.registry[workflowStepKey(plan.workflow, step.id)] ?? this.registry[step.tool] ?? this.registry[step.id];
      if (!runner) {
        diagnostics.push({
          severity: "error",
          code: "workflow-step-unsupported",
          message: `Workflow ${plan.workflow} step "${step.id}" is not supported by workflow apply yet.`,
        });
        nextActions.push({
          command: `akan workflow explain ${plan.workflow}`,
          reason: "Review the unsupported workflow step before retrying apply.",
        });
        break;
      }

      const result = await runner(step, plan);
      if (!result) continue;
      changedFiles.push(...(result.changedFiles ?? []));
      generatedFiles.push(...(result.generatedFiles ?? []));
      commands.push(...(result.commands ?? []));
      diagnostics.push(...(result.diagnostics ?? []));
      nextActions.push(...(result.nextActions ?? []));
      if (diagnostics.some((diagnostic) => diagnostic.severity === "error")) break;
    }

    return createWorkflowApplyReport({
      workflow: plan.workflow,
      mode: "apply",
      changedFiles,
      generatedFiles,
      commands,
      diagnostics,
      nextActions,
      plan,
    });
  }
}

export const createPrimitiveWriteReport = ({
  command,
  status,
  changedFiles = [],
  generatedFiles = [],
  validationCommands = [],
  diagnostics = [],
  nextActions = [],
}: Omit<PrimitiveWriteReport, "schemaVersion" | "status"> & {
  status?: PrimitiveWriteReport["status"];
}): PrimitiveWriteReport => ({
  schemaVersion: 1,
  command,
  status: status ?? (diagnostics.some((diagnostic) => diagnostic.severity === "error") ? "failed" : "passed"),
  changedFiles,
  generatedFiles,
  validationCommands,
  diagnostics,
  nextActions,
});

export const renderPrimitiveWriteReport = (report: PrimitiveWriteReport) =>
  [
    `# Primitive Write: ${report.command}`,
    "",
    `- Status: ${report.status}`,
    "",
    "## Changed Files",
    ...(report.changedFiles.length
      ? report.changedFiles.map((file) => `- \`${file.action}\` ${file.path}: ${file.reason}`)
      : ["- none"]),
    "",
    "## Generated Files",
    ...(report.generatedFiles.length
      ? report.generatedFiles.map((file) => `- \`${file.action}\` ${file.path}: ${file.reason}`)
      : ["- none"]),
    "",
    "## Validation Commands",
    ...(report.validationCommands.length
      ? report.validationCommands.map((validation) => `- \`${validation.command}\`: ${validation.reason}`)
      : ["- none"]),
    "",
    "## Diagnostics",
    ...(report.diagnostics.length
      ? report.diagnostics.map((diagnostic) => `- [${diagnostic.severity}] ${diagnostic.code}: ${diagnostic.message}`)
      : ["- none"]),
    "",
    "## Next Actions",
    ...(report.nextActions.length
      ? report.nextActions.map((action) => `- \`${action.command}\`: ${action.reason}`)
      : ["- none"]),
    "",
  ].join("\n");

export const renderPrimitiveReport = (report: PrimitiveWriteReport, format: PrimitiveFormat = "markdown") =>
  format === "json" ? jsonText(report) : renderPrimitiveWriteReport(report);

export const getSysRoot = (sys: Sys) => `${sys.type}s/${sys.name}`;

export const sourceFile = (sys: Sys, path: string, action: PrimitiveChangedFile["action"], reason: string) => ({
  path: `${getSysRoot(sys)}/${path}`,
  action,
  reason,
});

export const generatedFilesForSync = (sys: Sys, reason = "Generated files may change after sync.") =>
  [
    { path: `${getSysRoot(sys)}/lib/cnst.ts`, action: "sync", reason },
    { path: `${getSysRoot(sys)}/lib/dict.ts`, action: "sync", reason },
    { path: `${getSysRoot(sys)}/lib/option.ts`, action: "sync", reason },
    { path: `${getSysRoot(sys)}/lib/index.ts`, action: "sync", reason },
  ] satisfies PrimitiveGeneratedFile[];

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

export const compactDiagnostics = (diagnostics: Array<WorkflowDiagnostic | false | null | undefined>) =>
  diagnostics.filter((diagnostic): diagnostic is WorkflowDiagnostic => !!diagnostic);

export const fieldExpression = (typeName: string, defaultValue?: string | null) => {
  const normalizedTypes: Record<string, string> = {
    string: "String",
    number: "Number",
    boolean: "Boolean",
    date: "Date",
  };
  const typeExpression = normalizedTypes[typeName.toLowerCase()] ?? typeName;
  const defaultOption = defaultValue ? `, { default: ${JSON.stringify(defaultValue)} }` : "";
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
