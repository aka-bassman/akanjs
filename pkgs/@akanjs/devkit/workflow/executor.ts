import { capitalize } from "akanjs/common";
import type { Sys, Workspace } from "../commandDecorators";
import { AppExecutor, LibExecutor } from "../executors";
import { createWorkflowApplyReport, workflowCommandsForPlan } from "./artifacts";
import type {
  PrimitiveChangedFile,
  PrimitiveGeneratedFile,
  PrimitiveNextAction,
  PrimitiveWriteReport,
  WorkflowApplyCommand,
  WorkflowDiagnostic,
  WorkflowInputValue,
  WorkflowPlan,
  WorkflowPrimitiveOperations,
  WorkflowStep,
  WorkflowStepRegistry,
  WorkflowStepResult,
} from "./types";

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
  const isNumeric = typeName === "Int" || typeName === "Float" || typeName === "integer" || typeName === "float";
  const moduleClassName = capitalize(module);
  const target = `${app ? `apps/${app}` : "*"}/lib/${module}/${moduleClassName}.Template.tsx`;
  return {
    recommendations: [
      {
        code: "add-field-ui-surface-review",
        kind: "manual-action",
        target,
        action: isNumeric
          ? `Review ${moduleClassName} Template/Unit/View/Store surfaces before adding ${field}; confirm the local Field.Text numeric parser/formatter, validation rule, and dictionary label pattern.`
          : `Add ${field} to ${moduleClassName} UI surfaces only when the local Field.* pattern is clear.`,
        confidence: "medium",
        message: isNumeric
          ? `No UI file was modified automatically because a safe numeric input component pattern is not yet detected for ${module}.${field}.`
          : `Review Template/Unit/View/Store surfaces for ${module}.${field}; no UI file was modified automatically.`,
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
  constructor(private readonly registry: WorkflowStepRegistry) {}

  async apply(plan: WorkflowPlan) {
    const changedFiles: PrimitiveChangedFile[] = [];
    const generatedFiles: PrimitiveGeneratedFile[] = [];
    const recommendedValidationCommands: WorkflowApplyCommand[] = [];
    const diagnostics: WorkflowDiagnostic[] = [...plan.diagnostics];
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

    return createWorkflowApplyReport({
      workflow: plan.workflow,
      mode: "apply",
      changedFiles,
      generatedFiles,
      recommendedValidationCommands,
      diagnostics,
      recommendations,
      nextActions,
      plan,
    });
  }
}
