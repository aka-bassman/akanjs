import { capitalize } from "akanjs/common";
import ts from "typescript";
import type { Sys, Workspace } from "../commandDecorators";
import { AppExecutor, LibExecutor } from "../executors";
import { createWorkflowApplyReport, workflowCommandsForPlan } from "./artifacts";
import { moduleSourcePaths } from "./source";
import type {
  PrimitiveChangedFile,
  PrimitiveGeneratedFile,
  PrimitiveNextAction,
  PrimitiveWriteReport,
  WorkflowApplyCommand,
  WorkflowDiagnostic,
  WorkflowInputValue,
  WorkflowPlan,
  WorkflowPostApplyCheck,
  WorkflowPrimitiveOperations,
  WorkflowRecommendation,
  WorkflowStep,
  WorkflowStepRegistry,
  WorkflowStepResult,
} from "./types";
import { addFieldUiPolicyForType } from "./uiPolicy";

export const workflowStepKey = (workflow: string, stepId: string) => `${workflow}:${stepId}`;

export const primitiveReportToWorkflowStepResult = (report: PrimitiveWriteReport): WorkflowStepResult => ({
  changedFiles: report.changedFiles,
  generatedFiles: report.generatedFiles,
  commands: report.validationCommands,
  diagnostics: report.diagnostics,
  recommendations: [],
  nextActions: report.nextActions,
});

const workflowStringInput = (value: WorkflowInputValue | undefined) => (typeof value === "string" ? value : null);
const workflowStringListInput = (value: WorkflowInputValue | undefined) =>
  Array.isArray(value) ? value.join(",") : null;
const workflowStringArrayInput = (value: WorkflowInputValue | undefined) => (Array.isArray(value) ? value : null);
const workflowBooleanInput = (value: WorkflowInputValue | undefined) => (typeof value === "boolean" ? value : null);

const postApplyDiagnostic = (code: string, message: string, target: string): WorkflowDiagnostic => ({
  severity: "error",
  code,
  message,
  failureScope: "source-change",
  context: { target },
});

const sourceKindForPath = (filePath: string) => {
  if (filePath.endsWith(".tsx")) return ts.ScriptKind.TSX;
  if (filePath.endsWith(".ts")) return ts.ScriptKind.TS;
  return null;
};

const checkPathCasing = async (workspace: Workspace, filePath: string) => {
  const segments = filePath.split("/").filter(Boolean);
  let current = ".";
  for (const segment of segments) {
    const entries = await workspace.readdir(current);
    if (entries.includes(segment)) {
      current = current === "." ? segment : `${current}/${segment}`;
      continue;
    }
    const caseInsensitiveMatch = entries.find((entry) => entry.toLowerCase() === segment.toLowerCase());
    return caseInsensitiveMatch
      ? {
          code: "workflow-path-casing-mismatch",
          message: `Reported path segment "${segment}" does not match actual casing "${caseInsensitiveMatch}" in ${filePath}.`,
        }
      : {
          code: "workflow-path-missing",
          message: `Reported path does not exist: ${filePath}.`,
        };
  }
  return null;
};

const checkTypeScriptSyntax = async (workspace: Workspace, filePath: string) => {
  const scriptKind = sourceKindForPath(filePath);
  if (!scriptKind) return null;
  const content = await workspace.readFile(filePath);
  const source = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true, scriptKind);
  const diagnostic = source.parseDiagnostics[0];
  if (!diagnostic) return null;
  const position = diagnostic.file?.getLineAndCharacterOfPosition(diagnostic.start ?? 0);
  const location = position ? `:${position.line + 1}:${position.character + 1}` : "";
  return {
    code: "workflow-post-apply-syntax-error",
    message: `Generated source has a TypeScript syntax error at ${filePath}${location}: ${ts.flattenDiagnosticMessageText(
      diagnostic.messageText,
      " ",
    )}`,
  };
};

const checkChangedFile = async (workspace: Workspace, file: PrimitiveChangedFile): Promise<WorkflowStepResult> => {
  if (file.action === "remove") return { postApplyChecks: [] };
  const diagnostics: WorkflowDiagnostic[] = [];
  const checks: WorkflowPostApplyCheck[] = [];
  const pathIssue = await checkPathCasing(workspace, file.path);
  if (pathIssue) {
    diagnostics.push(postApplyDiagnostic(pathIssue.code, pathIssue.message, file.path));
    checks.push({ ...pathIssue, target: file.path, status: "failed" });
    return { diagnostics, postApplyChecks: checks };
  }
  const syntaxIssue = await checkTypeScriptSyntax(workspace, file.path);
  if (syntaxIssue) {
    diagnostics.push(postApplyDiagnostic(syntaxIssue.code, syntaxIssue.message, file.path));
    checks.push({ ...syntaxIssue, target: file.path, status: "failed" });
    return { diagnostics, postApplyChecks: checks };
  }
  checks.push({
    code: "workflow-post-apply-file-valid",
    target: file.path,
    status: "passed",
    message: "Changed file exists with exact casing and parses as source when applicable.",
  });
  return { postApplyChecks: checks };
};

const checkRecommendationPath = async (
  workspace: Workspace,
  recommendation: WorkflowRecommendation,
): Promise<WorkflowDiagnostic | null> => {
  if (!recommendation.target || recommendation.target.includes("*") || recommendation.target.startsWith("<"))
    return null;
  const pathIssue = await checkPathCasing(workspace, recommendation.target);
  if (!pathIssue) return null;
  return {
    severity: "warning",
    code: "workflow-recommendation-path-unverified",
    message: `${pathIssue.message} Recommendation "${recommendation.code}" should not be treated as an exact file target until the path is corrected.`,
    failureScope: "source-change",
    context: { target: recommendation.target },
  };
};

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

const addFieldUiSurfaceInspection = (plan: WorkflowPlan): WorkflowStepResult => {
  const app = workflowStringInput(plan.inputs.app);
  const module = workflowStringInput(plan.inputs.module) ?? "<module>";
  const field = workflowStringInput(plan.inputs.field) ?? "<field>";
  const typeName = workflowStringInput(plan.inputs.type);
  const policy = addFieldUiPolicyForType(typeName ?? "String");
  const surfaces = workflowStringArrayInput(plan.inputs.surfaces);
  const templateRequested = surfaces?.includes("template") ?? false;
  const moduleClassName = capitalize(module);
  const target = `${app ? `apps/${app}` : "*"}/${moduleSourcePaths(module).template}`;
  return {
    recommendations: [
      {
        code: "add-field-ui-surface-review",
        kind: "manual-action",
        target,
        action: templateRequested
          ? `Template was requested for ${field}. If no Template file changed, auto-edit was skipped because the file was missing, the generated ${module}Form/Layout.Template pattern was not found, or ${policy.component} needs option binding. Candidate position: inside Layout.Template near the existing Field components.`
          : `Template was not selected, so UI files are intentionally left unchanged. Candidate positions if you expose it later: Layout.Template field list for editing, Light${moduleClassName} projection for list/card data, and Unit/View card sections for display.`,
        confidence: "medium",
        message: `Review UI surfaces for ${module}.${field}; recommended component is ${policy.component}, with manual reasons and candidate positions in action.`,
      },
    ],
    nextActions: [
      {
        command: `akan workflow explain ${plan.workflow}`,
        reason: "Review UI surface guidance before manually editing ambiguous UI files.",
      },
    ],
  };
};

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
            surfaces: workflowStringArrayInput(plan.inputs.surfaces),
            includeInLight: workflowBooleanInput(plan.inputs.includeInLight),
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
          surfaces: workflowStringArrayInput(plan.inputs.surfaces),
          includeInLight: workflowBooleanInput(plan.inputs.includeInLight),
        }),
      );
    },
    [workflowStepKey("add-field", "update-dictionary")]: inspect,
    [workflowStepKey("add-field", "update-ui-surfaces")]: async (_step, plan) => addFieldUiSurfaceInspection(plan),
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

export class WorkflowExecutor {
  constructor(
    private readonly registry: WorkflowStepRegistry,
    private readonly workspace?: Workspace,
  ) {}

  async apply(plan: WorkflowPlan) {
    const changedFiles: PrimitiveChangedFile[] = [];
    const generatedFiles: PrimitiveGeneratedFile[] = [];
    const recommendedValidationCommands: WorkflowApplyCommand[] = [];
    const diagnostics: WorkflowDiagnostic[] = [...plan.diagnostics];
    const postApplyChecks: WorkflowPostApplyCheck[] = [];
    const recommendations = [...plan.recommendations];
    const nextActions: PrimitiveNextAction[] = [];

    if (diagnostics.some((diagnostic) => diagnostic.severity === "error")) {
      return createWorkflowApplyReport({
        workflow: plan.workflow,
        mode: "apply",
        changedFiles,
        generatedFiles,
        recommendedValidationCommands,
        diagnostics,
        postApplyChecks,
        recommendations,
        nextActions,
        plan,
      });
    }

    recommendedValidationCommands.push(...workflowCommandsForPlan(plan));
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
      recommendedValidationCommands.push(...(result.commands ?? []));
      diagnostics.push(...(result.diagnostics ?? []));
      recommendations.push(...(result.recommendations ?? []));
      nextActions.push(...(result.nextActions ?? []));
      if (diagnostics.some((diagnostic) => diagnostic.severity === "error")) break;
    }

    if (this.workspace && !diagnostics.some((diagnostic) => diagnostic.severity === "error")) {
      for (const file of changedFiles) {
        const result = await checkChangedFile(this.workspace, file);
        postApplyChecks.push(...(result.postApplyChecks ?? []));
        diagnostics.push(...(result.diagnostics ?? []));
      }
      const recommendationDiagnostics = await Promise.all(
        recommendations.map((recommendation) => checkRecommendationPath(this.workspace as Workspace, recommendation)),
      );
      diagnostics.push(
        ...recommendationDiagnostics.filter((diagnostic): diagnostic is WorkflowDiagnostic => !!diagnostic),
      );
    }

    return createWorkflowApplyReport({
      workflow: plan.workflow,
      mode: "apply",
      changedFiles,
      generatedFiles,
      recommendedValidationCommands,
      diagnostics,
      postApplyChecks,
      recommendations,
      nextActions,
      plan,
    });
  }
}
