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
    "## Diagnostics",
    ...(report.diagnostics.length
      ? report.diagnostics.map((diagnostic) => `- [${diagnostic.severity}] ${diagnostic.code}: ${diagnostic.message}`)
      : ["- none"]),
    "",
    "## Recommendations",
    ...(report.recommendations.length
      ? report.recommendations.map((recommendation) => `- [${recommendation.kind}] ${recommendation.message}`)
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
    `- Source status: ${report.sourceStatus}`,
    `- Workspace status: ${report.workspaceStatus}`,
    `- Overall status: ${report.overallStatus}`,
    "",
    "## Known Blockers",
    ...(report.knownBlockers.length
      ? report.knownBlockers.map((blocker) => {
          const command = blocker.command ? ` \`${blocker.command}\`` : "";
          const count = blocker.count > 1 ? ` (${blocker.count}x)` : "";
          return `- [${blocker.failureScope}]${command}${count}: ${blocker.message}`;
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
