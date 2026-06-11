import { script, type Workspace } from "@akanjs/devkit";
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

  async mcpInstall(workspace: Workspace, target: string | null, { force = false }: { force?: boolean } = {}) {
    if (target && target !== "cursor") throw new Error(`Unknown MCP install target: ${target}. Use cursor.`);
    const written = await this.contextRunner.installMcp(workspace, "cursor", { force });
    Logger.rawLog(`Akan MCP server installed for Cursor:\n- ${written}`);
  }

  async mcp(workspace: Workspace) {
    await this.contextRunner.runMcp(workspace);
  }
}
