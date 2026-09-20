import { existsSync, readFileSync } from "node:fs";
import type { ExtensionAPI, InlineExtension } from "@earendil-works/pi-coding-agent";
import { type CodeAgentMcpServerRef, type CodeAgentProfile, codeAgentClip, codeAgentOutputChars } from "akanjs/common";
import { Type } from "typebox";
import { akanCodePaths } from "./akanCodePaths";
import { McpClient, type McpToolInfo } from "./McpClient";

export interface McpToolPackOptions {
  workspaceRoot: string;
  profile: CodeAgentProfile;
  onNotice?: (message: string) => void;
}

interface ServerFileEntry {
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  type?: string;
  disabled?: boolean;
}

/**
 * Connects the workspace's MCP servers and publishes their tools.
 *
 * Servers are declared in `.akan/code/mcp.json` in the shape the editors already use (`mcpServers`), so a
 * developer can paste the block they already have rather than learn a second format.
 *
 * Tool names are prefixed with the server. Two servers offering `search` is the normal case, not the edge one,
 * and a collision that silently shadows one of them is invisible from the model's side.
 */
export class McpToolPack {
  readonly #options: McpToolPackOptions;
  readonly #clients: { client: McpClient; tools: McpToolInfo[] }[] = [];

  private constructor(options: McpToolPackOptions) {
    this.#options = options;
  }

  /**
   * Connects every declared server before the session exists, because the session's tool allowlist has to name
   * these tools and their names are only knowable from a live `tools/list`.
   */
  static async connect(options: McpToolPackOptions) {
    const refs = McpToolPack.#refs(options);
    if (!refs.length) return undefined;
    const pack = new McpToolPack(options);
    for (const ref of refs) {
      try {
        const client = await new McpClient(ref).connect();
        pack.#clients.push({ client, tools: await client.listTools() });
      } catch (error) {
        // One unreachable integration must not cost the agent its turn, so it costs only its own tools.
        options.onNotice?.(`MCP server "${ref.name}" is unavailable: ${String(error)}`);
      }
    }
    return pack.#clients.length ? pack : undefined;
  }

  get toolNames() {
    return this.#clients.flatMap(({ client, tools }) =>
      tools.map((tool) => McpToolPack.#nameOf(client.ref.name, tool.name)),
    );
  }

  extension(): InlineExtension {
    return { name: "akan-mcp", factory: (pi: ExtensionAPI) => this.#register(pi) };
  }

  close() {
    for (const { client } of this.#clients) client.close();
  }

  #register(pi: ExtensionAPI) {
    for (const { client, tools } of this.#clients)
      for (const tool of tools) {
        const name = McpToolPack.#nameOf(client.ref.name, tool.name);
        const description = tool.description ?? tool.name;
        pi.registerTool({
          name,
          label: `${client.ref.name}: ${tool.name}`,
          description,
          promptSnippet: `${name}: ${description.split(".")[0] ?? description}`,
          // The server's own schema goes through untouched; it is the party that validates the call.
          parameters: Type.Unsafe<Record<string, unknown>>(tool.inputSchema),
          execute: async (_id, params) => {
            const result = await client.callTool(tool.name, params ?? {});
            return {
              content: [{ type: "text", text: codeAgentClip(result.text, codeAgentOutputChars) }],
              details: undefined,
              isError: result.isError,
            };
          },
        });
      }
  }

  static #nameOf(server: string, tool: string) {
    return `mcp__${server.replace(/[^a-zA-Z0-9_]/g, "_")}__${tool}`;
  }

  static #refs(options: McpToolPackOptions): CodeAgentMcpServerRef[] {
    if (options.profile.tools.mcp === "off") return [];
    const declared = Array.isArray(options.profile.tools.mcp) ? options.profile.tools.mcp : [];
    return [...McpToolPack.#fromFile(options.workspaceRoot), ...declared];
  }

  static #fromFile(workspaceRoot: string): CodeAgentMcpServerRef[] {
    const file = akanCodePaths.mcpFile(workspaceRoot);
    if (!existsSync(file)) return [];
    try {
      const parsed = JSON.parse(readFileSync(file, "utf8")) as {
        mcpServers?: Record<string, ServerFileEntry>;
        servers?: Record<string, ServerFileEntry>;
      };
      const entries = Object.entries(parsed.mcpServers ?? parsed.servers ?? {});
      return entries
        .filter(([, entry]) => !entry.disabled)
        .map(([name, entry]): CodeAgentMcpServerRef => {
          const transport = entry.url ? "http" : "stdio";
          return {
            name,
            transport,
            ...(entry.command ? { command: entry.command } : {}),
            ...(entry.args ? { args: entry.args } : {}),
            ...(entry.url ? { url: entry.url } : {}),
            ...(entry.env ? { env: entry.env } : {}),
          };
        });
    } catch {
      return [];
    }
  }
}
