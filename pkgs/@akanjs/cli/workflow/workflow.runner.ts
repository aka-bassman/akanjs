import { createWorkflowPlan, getWorkflowSpec, listWorkflowSpecs, runner, type WorkflowSpec } from "@akanjs/devkit";
import { workflowSpecs } from "../workflows";

export type WorkflowFormat = "markdown" | "json";
export type WorkflowPlanInputs = Record<string, string | null>;

const jsonText = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;

const compactInputs = (inputs: WorkflowPlanInputs) =>
  Object.fromEntries(Object.entries(inputs).filter(([, value]) => value !== null && value !== ""));

const renderWorkflowList = (specs: readonly WorkflowSpec[]) =>
  [
    "# Akan Workflows",
    "",
    ...specs.flatMap((spec) => [`- \`${spec.name}\`: ${spec.description}`, `  - When: ${spec.whenToUse}`]),
    "",
  ].join("\n");

const renderWorkflowExplain = (spec: WorkflowSpec) =>
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

const renderWorkflowPlan = (plan: ReturnType<typeof createWorkflowPlan>) =>
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

  plan(workflow: string, inputs: WorkflowPlanInputs, { format = "markdown" }: { format?: WorkflowFormat } = {}) {
    const spec = getWorkflowSpec(workflowSpecs, workflow);
    if (!spec) throw new Error(`Unknown workflow: ${workflow}. Run \`akan workflow list\` to see available workflows.`);
    const plan = createWorkflowPlan(spec, compactInputs(inputs));
    return format === "json" ? jsonText(plan) : renderWorkflowPlan(plan);
  }
}
