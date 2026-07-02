import type { Workspace } from "../commandDecorators";
import type {
  GeneratedSyncState,
  PrimitiveChangedFile,
  PrimitiveGeneratedFile,
  RepairAction,
  RepairReport,
  WorkflowApplyCommand,
  WorkflowApplyReport,
  WorkflowDiagnostic,
  WorkflowFailureScope,
  WorkflowKnownBlocker,
  WorkflowPlan,
  WorkflowRunArtifact,
  WorkflowRunSource,
  WorkflowValidationCommandResult,
  WorkflowValidationRunReport,
  WorkflowValidationStatus,
} from "./types";
import { commandStatus, jsonText, uniqueBy, workflowStatus } from "./utils";

export const createWorkflowApplyReport = ({
  workflow,
  mode,
  changedFiles = [],
  generatedFiles = [],
  appliedCommands = [],
  recommendedValidationCommands,
  commands = [],
  diagnostics = [],
  recommendations = [],
  nextActions = [],
  plan,
}: Omit<
  WorkflowApplyReport,
  | "schemaVersion"
  | "runId"
  | "applyReportPath"
  | "validationTarget"
  | "status"
  | "appliedCommands"
  | "recommendedValidationCommands"
  | "commands"
  | "recommendations"
> & {
  appliedCommands?: WorkflowApplyCommand[];
  recommendedValidationCommands?: WorkflowApplyCommand[];
  commands?: WorkflowApplyCommand[];
  recommendations?: WorkflowApplyReport["recommendations"];
}): WorkflowApplyReport => {
  const validationCommands = recommendedValidationCommands ?? commands;
  return {
    schemaVersion: 1,
    workflow,
    mode,
    status: workflowStatus(diagnostics),
    changedFiles: uniqueBy(changedFiles, (file) => `${file.action}:${file.path}:${file.reason}`),
    generatedFiles: uniqueBy(generatedFiles, (file) => `${file.action}:${file.path}:${file.reason}`),
    appliedCommands: uniqueBy(appliedCommands, (command) => command.command),
    recommendedValidationCommands: uniqueBy(validationCommands, (command) => command.command),
    commands: uniqueBy(validationCommands, (command) => command.command),
    diagnostics,
    recommendations: uniqueBy(recommendations, (recommendation) => `${recommendation.kind}:${recommendation.code}`),
    nextActions: uniqueBy(nextActions, (action) => action.command),
    plan,
  };
};

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
    kind: validation.kind,
  })) satisfies WorkflowApplyCommand[];

export const workflowRunsDir = ".akan/workflows/runs";

export const createWorkflowRunId = (prefix = "run") =>
  `${prefix}-${new Date()
    .toISOString()
    .replace(/[-:.TZ]/g, "")
    .slice(0, 14)}-${Math.random().toString(36).slice(2, 8)}`;

const getRunId = (artifact: WorkflowRunArtifact) => {
  if ("runId" in artifact && artifact.runId) return artifact.runId;
  return createWorkflowRunId("mode" in artifact ? artifact.mode : artifact.kind);
};

export const workflowRunArtifactPath = (runId: string) => `${workflowRunsDir}/${runId}.json`;

const withWorkflowRunMetadata = (
  artifact: WorkflowRunArtifact,
  runId: string,
  artifactPath: string,
): WorkflowRunArtifact => {
  if ("mode" in artifact && (artifact.mode === "apply" || artifact.mode === "dry-run")) {
    return { ...artifact, runId, applyReportPath: artifactPath, validationTarget: artifactPath };
  }
  if ("kind" in artifact) return { ...artifact, runId, repairReportPath: artifactPath };
  return artifact;
};

export const writeWorkflowRunArtifact = async (workspace: Workspace, artifact: WorkflowRunArtifact) => {
  const runId = getRunId(artifact);
  const artifactPath = workflowRunArtifactPath(runId);
  const artifactWithMetadata = withWorkflowRunMetadata(artifact, runId, artifactPath);
  await workspace.writeFile(artifactPath, jsonText(artifactWithMetadata), { silent: true });
  return { runId, path: artifactPath, artifact: artifactWithMetadata };
};

export const workflowSyncDir = ".akan/workflows/sync";

const syncStateSlug = (target: string) =>
  target
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

export const workflowSyncStatePath = (target: string) => `${workflowSyncDir}/${syncStateSlug(target) || "target"}.json`;

export const generatedFilePathsForTarget = (targetRoot: string, reason = "Generated files were refreshed by sync.") =>
  [
    { path: `${targetRoot}/lib/cnst.ts`, action: "sync", reason },
    { path: `${targetRoot}/lib/dict.ts`, action: "sync", reason },
    { path: `${targetRoot}/lib/option.ts`, action: "sync", reason },
    { path: `${targetRoot}/lib/index.ts`, action: "sync", reason },
  ] satisfies PrimitiveGeneratedFile[];

export const writeGeneratedSyncState = async (workspace: Workspace, state: GeneratedSyncState) => {
  const statePath = workflowSyncStatePath(state.target);
  await workspace.writeFile(statePath, jsonText(state), { silent: true });
  return statePath;
};

export const readWorkflowRunArtifact = async (workspace: Workspace, runId: string) => {
  const artifactPath = workflowRunArtifactPath(runId);
  if (!(await workspace.exists(artifactPath))) throw new Error(`Workflow run artifact does not exist: ${artifactPath}`);
  return (await workspace.readJson(artifactPath)) as WorkflowRunArtifact;
};

export type WorkflowValidationCommandExecutor = (
  command: WorkflowApplyCommand,
) => Promise<WorkflowValidationCommandResult>;

const failedCommandScopes = (commands: readonly WorkflowValidationCommandResult[]) =>
  commands.filter((command) => command.status === "failed").map((command) => command.failureScope ?? "unknown");

const errorDiagnosticScopes = (diagnostics: readonly WorkflowDiagnostic[]) =>
  diagnostics
    .filter((diagnostic) => diagnostic.severity === "error")
    .map(
      (diagnostic) =>
        diagnostic.failureScope ??
        (diagnostic.scope === "baseline"
          ? "workspace-config"
          : diagnostic.scope === "workflow"
            ? "source-change"
            : "unknown"),
    );

const hasScopeFailure = (
  scopes: readonly WorkflowFailureScope[],
  scope: WorkflowFailureScope,
  diagnostics: readonly WorkflowDiagnostic[] = [],
) =>
  scopes.includes(scope) ||
  diagnostics.some((diagnostic) => diagnostic.severity === "error" && diagnostic.failureScope === scope);

const statusForScope = (
  commands: readonly WorkflowValidationCommandResult[],
  diagnostics: readonly WorkflowDiagnostic[],
  scopes: readonly WorkflowFailureScope[],
  expectedScope: WorkflowFailureScope,
): WorkflowValidationStatus => {
  const hasCommands = commands.length > 0 || diagnostics.length > 0;
  if (!hasCommands) return "unknown";
  return hasScopeFailure(scopes, expectedScope, diagnostics) ? "failed" : "passed";
};

const createKnownBlockers = (
  commands: readonly WorkflowValidationCommandResult[],
  diagnostics: readonly WorkflowDiagnostic[],
): WorkflowKnownBlocker[] => {
  const commandBlockers = commands
    .filter(
      (command) =>
        command.status === "failed" &&
        (command.failureScope === "workspace-config" || command.failureScope === "environment"),
    )
    .map((command) => ({
      code: `workflow-validation-${command.failureScope}`,
      message: `${command.failureScope === "environment" ? "Environment" : "Workspace configuration"} blocker: ${command.command}`,
      failureScope: command.failureScope ?? "unknown",
      command: command.command,
      kind: command.kind,
      count: 1,
    }));
  const diagnosticBlockers = diagnostics
    .filter(
      (diagnostic) =>
        diagnostic.severity === "error" &&
        (diagnostic.failureScope === "workspace-config" ||
          diagnostic.failureScope === "environment" ||
          diagnostic.scope === "baseline"),
    )
    .map((diagnostic) => ({
      code: diagnostic.code,
      message: diagnostic.message,
      failureScope: diagnostic.failureScope ?? ("workspace-config" as const),
      command: diagnostic.command,
      kind: diagnostic.kind,
      count: 1,
    }));
  const grouped = new Map<string, WorkflowKnownBlocker>();
  for (const blocker of [...commandBlockers, ...diagnosticBlockers]) {
    const key = `${blocker.failureScope}:${blocker.code}:${blocker.command ?? ""}:${blocker.message}`;
    const existing = grouped.get(key);
    if (existing) existing.count += blocker.count;
    else grouped.set(key, blocker);
  }
  return [...grouped.values()];
};

const createValidationStatuses = (
  commands: readonly WorkflowValidationCommandResult[],
  diagnostics: readonly WorkflowDiagnostic[],
) => {
  const scopes = [...failedCommandScopes(commands), ...errorDiagnosticScopes(diagnostics)];
  const sourceStatus = statusForScope(commands, diagnostics, scopes, "source-change");
  const workspaceStatus =
    hasScopeFailure(scopes, "workspace-config", diagnostics) || hasScopeFailure(scopes, "environment", diagnostics)
      ? "failed"
      : commands.length || diagnostics.length
        ? "passed"
        : "unknown";
  const overallStatus = hasScopeFailure(scopes, "source-change", diagnostics)
    ? "failed"
    : hasScopeFailure(scopes, "workspace-config", diagnostics)
      ? "blocked-by-workspace-config"
      : hasScopeFailure(scopes, "environment", diagnostics)
        ? "blocked-by-environment"
        : workflowStatus(diagnostics) === "failed" || commandStatus(commands) === "failed"
          ? "failed"
          : "passed";
  return { sourceStatus, workspaceStatus, overallStatus };
};

export const createWorkflowValidationRunReport = async ({
  runId = createWorkflowRunId("validation"),
  workflow,
  source,
  plan,
  commands,
  execute,
  diagnostics = [],
  baselineDiagnostics = [],
  workflowDiagnostics = [],
  repairActions = [],
}: {
  runId?: string;
  workflow: string;
  source: WorkflowRunSource;
  plan?: WorkflowPlan;
  commands: WorkflowApplyCommand[];
  execute: WorkflowValidationCommandExecutor;
  diagnostics?: WorkflowDiagnostic[];
  baselineDiagnostics?: WorkflowDiagnostic[];
  workflowDiagnostics?: WorkflowDiagnostic[];
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
            command: result.command,
            kind: result.kind,
            failureScope: result.failureScope,
          },
        ]
      : [],
  );
  const reportDiagnostics = [...diagnostics, ...commandDiagnostics];
  const scopedDiagnostics = [...reportDiagnostics, ...baselineDiagnostics, ...workflowDiagnostics];
  const statuses = createValidationStatuses(results, scopedDiagnostics);
  return {
    schemaVersion: 1,
    runId,
    workflow,
    mode: "validate",
    source,
    status: statuses.overallStatus === "passed" ? "passed" : "failed",
    ...statuses,
    knownBlockers: createKnownBlockers(results, scopedDiagnostics),
    commands: results,
    diagnostics: reportDiagnostics,
    baselineDiagnostics,
    workflowDiagnostics,
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
    recommendations: plan.recommendations,
    nextActions: workflowCommandsForPlan(plan),
    plan,
  });
};

export const createRepairReport = ({
  command,
  kind,
  target = null,
  diagnostics = [],
  repairActions = [],
  nextActions = [],
  commands = [],
  generatedFiles = [],
  syncedAt,
}: Omit<
  RepairReport,
  | "schemaVersion"
  | "runId"
  | "repairReportPath"
  | "status"
  | "target"
  | "diagnostics"
  | "repairActions"
  | "nextActions"
  | "commands"
> &
  Partial<
    Pick<
      RepairReport,
      "target" | "diagnostics" | "repairActions" | "nextActions" | "commands" | "generatedFiles" | "syncedAt"
    >
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
  generatedFiles,
  ...(syncedAt ? { syncedAt } : {}),
});
