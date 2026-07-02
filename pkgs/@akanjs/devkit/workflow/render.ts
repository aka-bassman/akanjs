import type {
  RepairReport,
  WorkflowApplyReport,
  WorkflowFormat,
  WorkflowPlan,
  WorkflowRunArtifact,
  WorkflowSpec,
  WorkflowValidationRunReport,
} from "./types";
import { jsonText } from "./utils";

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
    ...plan.predictedChanges.map((change) => {
      const scope = change.applyScope ? ` (${change.applyScope})` : "";
      return `- \`${change.action}\`${scope} ${change.target}: ${change.reason}`;
    }),
    "",
    "## Validation",
    ...plan.validation.map((validation) => `- \`${validation.command}\`: ${validation.reason}`),
    "",
    "## Diagnostics",
    ...(plan.diagnostics.length
      ? plan.diagnostics.map((diagnostic) => `- [${diagnostic.severity}] ${diagnostic.code}: ${diagnostic.message}`)
      : ["- none"]),
    "",
    "## Recommendations",
    ...(plan.recommendations.length
      ? plan.recommendations.map((recommendation) => `- [${recommendation.kind}] ${recommendation.message}`)
      : ["- none"]),
    "",
  ].join("\n");

const renderRecommendation = (recommendation: WorkflowApplyReport["recommendations"][number]) => {
  const target = recommendation.target ? ` ${recommendation.target}` : "";
  const action = recommendation.action ? ` Action: ${recommendation.action}` : "";
  return `- [${recommendation.kind}]${target} ${recommendation.message}${action}`;
};

const renderDiagnostic = (diagnostic: WorkflowApplyReport["diagnostics"][number]) =>
  `- [${diagnostic.severity}] ${diagnostic.code}: ${diagnostic.message}`;

const applySourceStatus = (report: WorkflowApplyReport) =>
  report.diagnostics.some(
    (diagnostic) =>
      diagnostic.severity === "error" &&
      (diagnostic.failureScope === "source-change" ||
        !diagnostic.failureScope ||
        diagnostic.failureScope === "unknown"),
  )
    ? "failed"
    : "passed";

export const renderWorkflowApplyReport = (report: WorkflowApplyReport) => {
  const manualReviewItems = [
    ...report.diagnostics.filter((diagnostic) => diagnostic.severity === "warning").map(renderDiagnostic),
    ...report.recommendations
      .filter((recommendation) => recommendation.kind === "manual-action")
      .map(renderRecommendation),
  ];
  const validationBlockers = report.diagnostics
    .filter(
      (diagnostic) =>
        diagnostic.severity === "error" &&
        (diagnostic.failureScope === "workspace-config" || diagnostic.failureScope === "environment"),
    )
    .map(renderDiagnostic);
  const sourceBlockers = report.diagnostics
    .filter(
      (diagnostic) =>
        diagnostic.severity === "error" &&
        (diagnostic.failureScope === "source-change" ||
          !diagnostic.failureScope ||
          diagnostic.failureScope === "unknown"),
    )
    .map(renderDiagnostic);
  return [
    `# Workflow Apply: ${report.workflow}`,
    "",
    `- Mode: ${report.mode}`,
    `- Status: ${report.status}`,
    `- Source-change status: ${applySourceStatus(report)}`,
    `- Workspace status: ${validationBlockers.length ? "blocked" : "not blocked during apply"}`,
    ...(report.validationTarget ? [`- Validation target: ${report.validationTarget}`] : []),
    "",
    "## Apply Checks",
    ...(report.postApplyChecks?.length
      ? report.postApplyChecks.map((check) => `- [${check.status}] ${check.code} ${check.target}: ${check.message}`)
      : ["- not run"]),
    "",
    "## Source Change Blockers",
    ...(sourceBlockers.length ? sourceBlockers : ["- none"]),
    "",
    "## Automatically Modified",
    ...(report.changedFiles.length
      ? report.changedFiles.map((file) => `- \`${file.action}\` ${file.path}: ${file.reason}`)
      : ["- none"]),
    "",
    "## Generated Sync",
    ...(report.generatedFiles.length
      ? report.generatedFiles.map((file) => `- \`${file.action}\` ${file.path}: ${file.reason}`)
      : ["- none"]),
    "",
    "## Applied Commands",
    ...(report.appliedCommands.length
      ? report.appliedCommands.map((command) => `- \`${command.command}\`: ${command.reason}`)
      : ["- none"]),
    "",
    "## Recommended Validation Commands",
    ...(report.recommendedValidationCommands.length
      ? report.recommendedValidationCommands.map((command) => `- \`${command.command}\`: ${command.reason}`)
      : ["- none"]),
    "",
    "## User Review Required",
    ...(manualReviewItems.length ? manualReviewItems : ["- none"]),
    "",
    "## Validation Blockers",
    ...(validationBlockers.length
      ? validationBlockers
      : report.recommendedValidationCommands.length
        ? ["- none detected during apply; run validation with the validation target for command-level blockers."]
        : ["- none"]),
    "",
    "## Diagnostics",
    ...(report.diagnostics.length ? report.diagnostics.map(renderDiagnostic) : ["- none"]),
    "",
    "## Recommendations",
    ...(report.recommendations.length ? report.recommendations.slice(0, 3).map(renderRecommendation) : ["- none"]),
    "",
    "## Next Actions",
    ...(report.nextActions.length
      ? report.nextActions.map((action) => `- \`${action.command}\`: ${action.reason}`)
      : ["- none"]),
    "",
  ].join("\n");
};

export const renderWorkflowApply = (report: WorkflowApplyReport, format: WorkflowFormat = "markdown") =>
  format === "json" ? jsonText(report) : renderWorkflowApplyReport(report);

export const renderWorkflowValidationRunReport = (report: WorkflowValidationRunReport) =>
  [
    `# Workflow Validation: ${report.workflow}`,
    "",
    `- Run: ${report.runId}`,
    `- Status: ${report.status}`,
    `- Source status: ${report.sourceStatus}`,
    `- Workspace status: ${report.workspaceStatus}`,
    `- Overall status: ${report.overallStatus}`,
    "",
    "## Status Summary",
    `- Source-change: ${report.summary.sourceChange}`,
    `- Generated sync: ${report.summary.generatedSync}`,
    `- Workspace config: ${report.summary.workspaceConfig}`,
    `- Environment: ${report.summary.environment}`,
    "",
    "## Source Change Diagnostics",
    ...(report.workflowDiagnostics?.length
      ? report.workflowDiagnostics.map(
          (diagnostic) => `- [${diagnostic.severity}] ${diagnostic.code}: ${diagnostic.message}`,
        )
      : ["- none"]),
    "",
    "## Existing Workspace Blockers",
    ...(report.baselineDiagnostics?.length
      ? report.baselineDiagnostics.map(
          (diagnostic) => `- [${diagnostic.severity}] ${diagnostic.code}: ${diagnostic.message}`,
        )
      : ["- none"]),
    "",
    "## Known Blockers",
    ...(report.knownBlockers.length
      ? report.knownBlockers.map((blocker) => {
          const command = blocker.command ? ` \`${blocker.command}\`` : "";
          const count = blocker.count > 1 ? ` (${blocker.count}x)` : "";
          const known = blocker.known ? " known" : "";
          return `- [${blocker.failureScope}${known}]${command}${count}: ${blocker.message}`;
        })
      : ["- none"]),
    "",
    "## Commands",
    ...(report.commands.length
      ? report.commands.map((command) => {
          const scope = command.failureScope ? ` (${command.failureScope})` : "";
          return `- [${command.status}] \`${command.command}\`${scope}: ${command.reason}`;
        })
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

export const renderWorkflowRunArtifact = (artifact: WorkflowRunArtifact, format: WorkflowFormat = "markdown") => {
  if ("kind" in artifact) return renderRepairReport(artifact, format);
  if ("mode" in artifact && artifact.mode === "validate") return renderWorkflowValidation(artifact, format);
  if ("mode" in artifact && (artifact.mode === "apply" || artifact.mode === "dry-run")) {
    return renderWorkflowApply(artifact, format);
  }
  return jsonText(artifact);
};
