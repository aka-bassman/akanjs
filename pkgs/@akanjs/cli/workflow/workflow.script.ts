import { script } from "@akanjs/devkit";
import { Logger } from "akanjs/common";
import { type WorkflowFormat, type WorkflowPlanInputs, WorkflowRunner } from "./workflow.runner";

export class WorkflowScript extends script("workflow", [WorkflowRunner]) {
  async workflow(
    action: string,
    workflow: string | null,
    inputs: WorkflowPlanInputs,
    format: WorkflowFormat = "markdown",
  ) {
    if (action === "list") {
      Logger.rawLog(this.workflowRunner.list({ format }));
      return;
    }
    if (!workflow) throw new Error(`Workflow name is required for "${action}".`);
    if (action === "explain") {
      Logger.rawLog(this.workflowRunner.explain(workflow, { format }));
      return;
    }
    if (action === "plan") {
      Logger.rawLog(this.workflowRunner.plan(workflow, inputs, { format }));
      return;
    }
    throw new Error(`Unknown workflow action: ${action}. Use list, explain, or plan.`);
  }
}
