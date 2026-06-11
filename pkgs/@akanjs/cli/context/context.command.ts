import { command, Workspace } from "@akanjs/devkit";
import { ContextScript } from "./context.script";

export class ContextCommand extends command("context", [ContextScript], ({ public: target }) => ({
  context: target({ desc: "Print agent-readable Akan workspace context" })
    .option("format", String, {
      desc: "output format",
      default: "markdown",
      enum: ["markdown", "json"],
    })
    .option("app", String, { desc: "app name to include", nullable: true })
    .option("module", String, { desc: "module name to include with abstract content", nullable: true })
    .with(Workspace)
    .exec(async function (format, app, module, workspace) {
      await this.contextScript.context(workspace, { format: format as "markdown" | "json", app, module });
    }),
  doctor: target({ desc: "Report Akan workspace convention diagnostics" })
    .option("format", String, {
      desc: "output format",
      default: "text",
      enum: ["text", "json"],
    })
    .option("strict", Boolean, { desc: "treat recommended conventions as errors", default: false })
    .with(Workspace)
    .exec(async function (format, strict, workspace) {
      await this.contextScript.doctor(workspace, { format: format as "text" | "json", strict });
    }),
  mcpInstall: target({ desc: "Install the Akan MCP server config for Cursor" })
    .arg("target", String, { desc: "cursor", nullable: true })
    .option("force", Boolean, { desc: "overwrite an existing Akan MCP server entry", default: false })
    .with(Workspace)
    .exec(async function (targetName, force, workspace) {
      await this.contextScript.mcpInstall(workspace, targetName, { force });
    }),
  mcp: target({ desc: "Start the read-only Akan MCP server over stdio", stdio: true })
    .with(Workspace)
    .exec(async function (workspace) {
      await this.contextScript.mcp(workspace);
    }),
})) {}
