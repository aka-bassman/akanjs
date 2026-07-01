import { type AkanMcpMode, jsonText, script, type Workspace } from "@akanjs/devkit";
import { Logger } from "akanjs/common";
import { ContextRunner } from "./context.runner";

export class ContextScript extends script("context", [ContextRunner]) {
  async context(
    workspace: Workspace,
    options: { format?: "json" | "markdown"; app?: string | null; module?: string | null } = {},
  ) {
    Logger.rawLog(await this.contextRunner.getContext(workspace, options));
  }

  async doctor(workspace: Workspace, options: { format?: "text" | "json"; strict?: boolean } = {}) {
    Logger.rawLog(await this.contextRunner.doctor(workspace, options));
  }

  async mcpInstall(
    workspace: Workspace,
    target: string | null,
    { force = false, mode = "readonly" }: { force?: boolean; mode?: AkanMcpMode } = {},
  ) {
    if (target && target !== "cursor") throw new Error(`Unknown MCP install target: ${target}. Use cursor.`);
    const written = await this.contextRunner.installMcp(workspace, "cursor", { force, mode });
    Logger.rawLog(`Akan MCP server installed for Cursor:\n- ${written}`);
  }

  async mcp(workspace: Workspace, { mode = "readonly" }: { mode?: AkanMcpMode } = {}) {
    await this.contextRunner.runMcp(workspace, { mode });
  }

  async mcpCall(
    workspace: Workspace,
    tool: string,
    {
      mode = "readonly",
      args = null,
      format = "json",
    }: { mode?: AkanMcpMode; args?: string | null; format?: "json" } = {},
  ) {
    let parsedArgs: Record<string, unknown> = {};
    if (args) {
      const parsed = JSON.parse(args) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("MCP call args must be a JSON object.");
      }
      parsedArgs = parsed as Record<string, unknown>;
    }
    const result = await this.contextRunner.callMcpTool(workspace, tool, parsedArgs, { mode });
    Logger.rawLog(format === "json" ? jsonText(result) : String(result));
  }
}
