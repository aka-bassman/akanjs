import { command } from "@akanjs/devkit";
import { WorkflowScript } from "./workflow.script";

export class WorkflowCommand extends command("workflow", [WorkflowScript], ({ public: target }) => ({
  workflow: target({ desc: "List, explain, or plan read-only Akan workflows" })
    .arg("action", String, { desc: "list, explain, or plan", enum: ["list", "explain", "plan"] })
    .arg("workflow", String, { desc: "workflow name", nullable: true })
    .option("format", String, {
      desc: "output format",
      flag: "o",
      default: "markdown",
      enum: ["markdown", "json"],
    })
    .option("app", String, { desc: "target app or library name", nullable: true })
    .option("module", String, { desc: "target module name", nullable: true })
    .option("field", String, { desc: "field name", nullable: true })
    .option("type", String, { desc: "field type or scalar name", nullable: true })
    .option("values", String, { flag: "l", desc: "comma-separated values", nullable: true })
    .option("default", String, { desc: "default value", nullable: true })
    .option("scalar", String, { flag: "c", desc: "scalar name", nullable: true })
    .option("surface", String, { flag: "u", desc: "UI surface name", nullable: true })
    .option("mutation", String, { flag: "n", desc: "mutation name", nullable: true })
    .option("slice", String, { flag: "i", desc: "slice name", nullable: true })
    .exec(
      async function (
        action,
        workflow,
        format,
        app,
        module,
        field,
        typeName,
        values,
        defaultValue,
        scalar,
        surface,
        mutation,
        slice,
      ) {
        await this.workflowScript.workflow(
          action,
          workflow,
          { app, module, field, type: typeName, values, default: defaultValue, scalar, surface, mutation, slice },
          format as "markdown" | "json",
        );
      },
    ),
})) {}
