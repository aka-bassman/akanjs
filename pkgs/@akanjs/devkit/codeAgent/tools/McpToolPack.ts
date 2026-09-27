import type { ExtensionAPI, InlineExtension } from "@earendil-works/pi-coding-agent";
import {
  type CodeAgentMcpServerRef,
  type CodeAgentMcpStatus,
  type CodeAgentProfile,
  codeAgentClip,
  codeAgentOutputChars,
} from "akanjs/common";
import { Type } from "typebox";
import { McpClient, type McpToolInfo, McpUnauthorized } from "./McpClient";
import { McpServerConfig } from "./McpServerConfig";
import { McpSignIn } from "./McpSignIn";

export interface McpToolPackOptions {
  workspaceRoot: string;
  profile: CodeAgentProfile;
  onNotice?: (message: string) => void;
}

// Tool names carry the server prefix: two servers offering `search` is the normal case, and a shadow is invisible.
export class McpToolPack {
  readonly #clients: { client: McpClient; tools: McpToolInfo[] }[] = [];
  readonly #status: CodeAgentMcpStatus[] = [];

  private constructor() {}

  /** Undefined only when nothing is declared; a pack whose every server failed still comes back to say why. */
  static async connect(options: McpToolPackOptions) {
    const refs = McpToolPack.#refs(options);
    if (!refs.length) return undefined;
    const pack = new McpToolPack();
    for (const ref of refs) {
      const base = { name: ref.name, transport: ref.transport, target: McpServerConfig.targetOf(ref) };
      // Never an interactive sign-in: connect runs inside `CodeAgent.create`, before any screen is drawn.
      const token = ref.transport === "http" ? await McpSignIn.token(ref, options.onNotice) : undefined;
      try {
        const opened = await McpToolPack.#openRefreshing(ref, token, options.onNotice);
        pack.#clients.push({ client: opened.client, tools: opened.tools });
        pack.#status.push({
          ...base,
          tools: opened.tools.map((tool) => McpToolPack.#nameOf(ref.name, tool.name)),
          auth: opened.token ? "authorized" : "none",
        });
      } catch (error) {
        if (error instanceof McpUnauthorized) {
          options.onNotice?.(`MCP server "${ref.name}" needs signing in — /mcp login ${ref.name}`);
          pack.#status.push({ ...base, tools: [], auth: "required" });
          continue;
        }
        // One unreachable integration must not cost the agent its turn, so it costs only its own tools.
        options.onNotice?.(`MCP server "${ref.name}" is unavailable: ${String(error)}`);
        pack.#status.push({ ...base, tools: [], error: String(error) });
      }
    }
    return pack;
  }

  // A token refused before its stated expiry, or issued with none, gets one refresh before a sign-in is asked for.
  static async #openRefreshing(
    ref: CodeAgentMcpServerRef,
    token: string | undefined,
    onNotice: ((message: string) => void) | undefined,
  ) {
    try {
      return await McpToolPack.#open(ref, token);
    } catch (error) {
      if (!(error instanceof McpUnauthorized) || !token) throw error;
      const retry = await McpSignIn.retryToken(ref, token, onNotice);
      if (!retry) throw error;
      return await McpToolPack.#open(ref, retry);
    }
  }

  static async #open(ref: CodeAgentMcpServerRef, token: string | undefined) {
    const client = await new McpClient(ref, token).connect();
    return { client, tools: await client.listTools(), token };
  }

  get toolNames() {
    return this.#clients.flatMap(({ client, tools }) =>
      tools.map((tool) => McpToolPack.#nameOf(client.ref.name, tool.name)),
    );
  }

  get status(): CodeAgentMcpStatus[] {
    return this.#status;
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
    return [...McpServerConfig.read(options.workspaceRoot), ...declared];
  }
}
