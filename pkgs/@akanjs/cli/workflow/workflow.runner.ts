import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  compactWorkflowInputs,
  createDryRunWorkflowApplyReport,
  createWorkflowApplyReport,
  createWorkflowPlan,
  createWorkflowValidationRunReport,
  getWorkflowSpec,
  jsonText,
  listWorkflowSpecs,
  readWorkflowRunArtifact,
  renderWorkflowApply,
  renderWorkflowExplain,
  renderWorkflowList,
  renderWorkflowPlan,
  renderWorkflowRunArtifact,
  renderWorkflowValidation,
  runner,
  type WorkflowApplyCommand,
  type WorkflowApplyReport,
  WorkflowExecutor,
  type WorkflowFormat,
  type WorkflowPlan,
  type WorkflowPlanInputs,
  type WorkflowRunArtifact,
  type WorkflowStepRegistry,
  type WorkflowValidationCommandExecutor,
  type Workspace,
  workflowCommandsForPlan,
  writeWorkflowRunArtifact,
} from "@akanjs/devkit";
import { workflowSpecs } from "../workflows";

const resolvePath = (filePath: string) => (path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isWorkflowPlan = (value: unknown): value is WorkflowPlan => {
  if (!isRecord(value)) return false;
  return value.schemaVersion === 1 && value.mode === "plan" && typeof value.workflow === "string";
};

const isWorkflowApplyReport = (value: unknown): value is WorkflowApplyReport => {
  if (!isRecord(value)) return false;
  return (
    value.schemaVersion === 1 && (value.mode === "apply" || value.mode === "dry-run") && isWorkflowPlan(value.plan)
  );
};

const isWorkflowRunArtifact = (value: unknown): value is WorkflowRunArtifact => {
  if (!isRecord(value)) return false;
  return value.schemaVersion === 1 && (typeof value.mode === "string" || typeof value.command === "string");
};

const failedPlan = (workflow: string, diagnostics: WorkflowApplyReport["diagnostics"]): WorkflowPlan => ({
  schemaVersion: 1,
  workflow,
  mode: "plan",
  inputs: {},
  optionalSurfaces: {},
  steps: [],
  predictedChanges: [],
  validation: [],
  diagnostics,
  requiresApproval: true,
});

const failedApplyReport = (workflow: string, diagnostics: WorkflowApplyReport["diagnostics"], plan?: WorkflowPlan) =>
  createWorkflowApplyReport({
    workflow,
    mode: "apply",
    changedFiles: [],
    generatedFiles: [],
    commands: [],
    diagnostics,
    nextActions: [],
    plan: plan ?? failedPlan(workflow, diagnostics),
  });

const commandForShell = (command: string) => (command.startsWith("akan ") ? `bun run ${command}` : command);

const defaultValidationExecutor =
  (workspace: Workspace): WorkflowValidationCommandExecutor =>
  async (command) => {
    try {
      const stdout = await workspace.spawn("bash", ["-lc", commandForShell(command.command)], {
        cwd: workspace.workspaceRoot,
      });
      return {
        command: command.command,
        reason: command.reason,
        status: "passed",
        exitCode: 0,
        stdout,
      };
    } catch (error) {
      const commandError = error as { code?: number | null; stdout?: string; stderr?: string; message?: string };
      return {
        command: command.command,
        reason: command.reason,
        status: "failed",
        exitCode: commandError.code ?? 1,
        stdout: commandError.stdout,
        stderr: commandError.stderr ?? commandError.message,
      };
    }
  };

const readJsonFile = async (filePath: string) => JSON.parse(await readFile(resolvePath(filePath), "utf8"));

export class WorkflowRunner extends runner("workflow") {
  list({ format = "markdown" }: { format?: WorkflowFormat } = {}) {
    const workflows = listWorkflowSpecs(workflowSpecs);
    if (format === "json")
      return jsonText({
        schemaVersion: 1,
        workflows: workflows.map(({ name, description, whenToUse }) => ({ name, description, whenToUse })),
      });
    return renderWorkflowList(workflows);
  }

  explain(workflow: string, { format = "markdown" }: { format?: WorkflowFormat } = {}) {
    const spec = getWorkflowSpec(workflowSpecs, workflow);
    if (!spec) throw new Error(`Unknown workflow: ${workflow}. Run \`akan workflow list\` to see available workflows.`);
    return format === "json" ? jsonText(spec) : renderWorkflowExplain(spec);
  }

  async plan(
    workflow: string,
    inputs: WorkflowPlanInputs,
    { format = "markdown", out = null }: { format?: WorkflowFormat; out?: string | null } = {},
  ) {
    const spec = getWorkflowSpec(workflowSpecs, workflow);
    if (!spec) throw new Error(`Unknown workflow: ${workflow}. Run \`akan workflow list\` to see available workflows.`);
    const plan = createWorkflowPlan(spec, compactWorkflowInputs(inputs));
    if (out) {
      const outPath = resolvePath(out);
      await mkdir(path.dirname(outPath), { recursive: true });
      await writeFile(outPath, jsonText(plan));
    }
    return format === "json" ? jsonText(plan) : renderWorkflowPlan(plan);
  }

  async apply(
    planPath: string,
    {
      dryRun = false,
      format = "markdown",
      registry,
    }: { dryRun?: boolean; format?: WorkflowFormat; registry?: WorkflowStepRegistry } = {},
  ) {
    let plan: WorkflowPlan;
    try {
      const parsed = JSON.parse(await readFile(resolvePath(planPath), "utf8"));
      if (!isWorkflowPlan(parsed)) {
        const report = failedApplyReport("unknown", [
          {
            severity: "error",
            code: "workflow-plan-invalid",
            message: `Workflow plan file is invalid: ${planPath}.`,
          },
        ]);
        return renderWorkflowApply(report, format);
      }
      plan = parsed;
    } catch (error) {
      const report = failedApplyReport("unknown", [
        {
          severity: "error",
          code: "workflow-plan-read-failed",
          message:
            `Could not read workflow plan file: ${planPath}. ${error instanceof Error ? error.message : ""}`.trim(),
        },
      ]);
      return renderWorkflowApply(report, format);
    }

    const spec = getWorkflowSpec(workflowSpecs, plan.workflow);
    if (!spec) {
      const report = failedApplyReport(
        plan.workflow,
        [
          {
            severity: "error",
            code: "workflow-unknown",
            message: `Unknown workflow in plan: ${plan.workflow}.`,
          },
        ],
        plan,
      );
      return renderWorkflowApply(report, format);
    }
    if (dryRun) return renderWorkflowApply(createDryRunWorkflowApplyReport(plan), format);
    if (!registry) {
      const report = failedApplyReport(
        plan.workflow,
        [
          {
            severity: "error",
            code: "workflow-registry-missing",
            message: "Workflow apply requires a step runner registry.",
          },
        ],
        plan,
      );
      return renderWorkflowApply(report, format);
    }
    return renderWorkflowApply(await new WorkflowExecutor(registry).apply(plan), format);
  }

  async validate(
    runIdOrPlan: string,
    {
      format = "markdown",
      workspace,
      execute,
    }: { format?: WorkflowFormat; workspace: Workspace; execute?: WorkflowValidationCommandExecutor },
  ) {
    const loaded = await this.loadValidationTarget(runIdOrPlan, workspace);
    const report = await createWorkflowValidationRunReport({
      workflow: loaded.plan?.workflow ?? loaded.workflow,
      source: loaded.source,
      plan: loaded.plan,
      commands: loaded.commands,
      execute: execute ?? defaultValidationExecutor(workspace),
      diagnostics: loaded.diagnostics,
      repairActions: loaded.repairActions,
    });
    await writeWorkflowRunArtifact(workspace, report);
    return renderWorkflowValidation(report, format);
  }

  async report(runId: string, { format = "markdown", workspace }: { format?: WorkflowFormat; workspace: Workspace }) {
    try {
      return renderWorkflowRunArtifact(await readWorkflowRunArtifact(workspace, runId), format);
    } catch (error) {
      const report = await createWorkflowValidationRunReport({
        runId,
        workflow: "unknown",
        source: { type: "run-report", runId },
        commands: [],
        execute: async (command) => ({
          command: command.command,
          reason: command.reason,
          status: "failed",
          exitCode: 1,
        }),
        diagnostics: [
          {
            severity: "error",
            code: "workflow-run-read-failed",
            message:
              `Could not read workflow run report: ${runId}. ${error instanceof Error ? error.message : ""}`.trim(),
          },
        ],
      });
      return renderWorkflowValidation(report, format);
    }
  }

  async loadValidationTarget(runIdOrPlan: string, workspace: Workspace) {
    const loadFromArtifact = (artifact: WorkflowRunArtifact, sourcePath: string) => {
      if (isWorkflowApplyReport(artifact)) {
        return {
          workflow: artifact.workflow,
          source: { type: "apply-report" as const, path: sourcePath },
          plan: artifact.plan,
          commands: workflowCommandsForPlan(artifact.plan),
          diagnostics: artifact.diagnostics,
          repairActions: [],
        };
      }
      if ("mode" in artifact && artifact.mode === "validate") {
        return {
          workflow: artifact.workflow,
          source: { type: "run-report" as const, runId: artifact.runId },
          plan: artifact.plan,
          commands: artifact.plan ? workflowCommandsForPlan(artifact.plan) : [],
          diagnostics: artifact.diagnostics,
          repairActions: artifact.repairActions,
        };
      }
      return {
        workflow: "unknown",
        source: { type: "run-report" as const, runId: runIdOrPlan },
        plan: undefined,
        commands: [] as WorkflowApplyCommand[],
        diagnostics: [
          {
            severity: "error" as const,
            code: "workflow-validation-source-unsupported",
            message: `Workflow validation source is not supported: ${runIdOrPlan}.`,
          },
        ],
        repairActions: [],
      };
    };

    try {
      const parsed = await readJsonFile(runIdOrPlan);
      if (isWorkflowPlan(parsed)) {
        return {
          workflow: parsed.workflow,
          source: { type: "plan" as const, path: resolvePath(runIdOrPlan) },
          plan: parsed,
          commands: workflowCommandsForPlan(parsed),
          diagnostics: parsed.diagnostics,
          repairActions: [],
        };
      }
      if (isWorkflowRunArtifact(parsed)) return loadFromArtifact(parsed, resolvePath(runIdOrPlan));
    } catch {
      // If it is not a readable path, treat it as a run id below.
    }

    try {
      const artifact = await readWorkflowRunArtifact(workspace, runIdOrPlan);
      return loadFromArtifact(artifact, runIdOrPlan);
    } catch (error) {
      return {
        workflow: "unknown",
        source: { type: "run-report" as const, runId: runIdOrPlan },
        plan: undefined,
        commands: [] as WorkflowApplyCommand[],
        diagnostics: [
          {
            severity: "error" as const,
            code: "workflow-validation-source-read-failed",
            message: `Could not read workflow validation source: ${runIdOrPlan}. ${
              error instanceof Error ? error.message : ""
            }`.trim(),
          },
        ],
        repairActions: [],
      };
    }
  }
}
