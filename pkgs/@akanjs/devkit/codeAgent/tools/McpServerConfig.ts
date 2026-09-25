import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { CodeAgentMcpServerRef } from "akanjs/common";
import { akanCodePaths } from "../agent/akanCodePaths";

/** Which of the two files a server is declared in — see {@link McpServerConfig}. */
export type McpServerScope = "global" | "workspace";

export interface McpDeclaredServer {
  ref: CodeAgentMcpServerRef;
  disabled: boolean;
  scope: McpServerScope;
}

interface ServerFileEntry {
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  type?: string;
  disabled?: boolean;
  headers?: Record<string, string>;
  oauth?: { clientId?: string; clientSecret?: string; scope?: string };
}

interface ServerFile {
  mcpServers?: Record<string, ServerFileEntry>;
  servers?: Record<string, ServerFileEntry>;
}

/**
 * The declared MCP servers, in the shape the editors already write, from two files.
 *
 * `~/.akan/code/mcp.json` is the person's, and `<repo>/.akan/code/mcp.json` is the checkout's. **The global
 * file is where a server normally goes**: a server is an integration with an account, the token for it
 * already lives in the home directory, and declaring it per repo means declaring and signing in again in
 * every checkout. The workspace file is for a server that is genuinely this repo's — one it starts itself, or
 * one only its team reaches — and a name declared in both resolves to the workspace's, because the more
 * specific declaration is the one that knew about the other.
 *
 * Both hold an `mcpServers` map — the block a developer already has in their Claude, Cursor or VS Code config
 * — so the file can be pasted rather than translated. `servers` is read as well because VS Code spells it
 * that way, and whichever key a file already uses is the one a write goes back into: rewriting it to our
 * preferred spelling would silently break the editor sharing the file.
 */
export class McpServerConfig {
  static file(workspaceRoot: string, scope: McpServerScope = "workspace") {
    return scope === "global" ? akanCodePaths.globalMcpFile() : akanCodePaths.mcpFile(workspaceRoot);
  }

  /** Both files, in the order they are merged — global first, so the workspace's entry lands on top of it. */
  static files(workspaceRoot: string): { scope: McpServerScope; file: string }[] {
    return [
      { scope: "global", file: McpServerConfig.file(workspaceRoot, "global") },
      { scope: "workspace", file: McpServerConfig.file(workspaceRoot, "workspace") },
    ];
  }

  static read(workspaceRoot: string): CodeAgentMcpServerRef[] {
    return McpServerConfig.declared(workspaceRoot)
      .filter((entry) => !entry.disabled)
      .map((entry) => entry.ref);
  }

  /** Every declared server including the disabled ones, which is what a listing has to show. */
  static declared(workspaceRoot: string): McpDeclaredServer[] {
    const byName = new Map<string, McpDeclaredServer>();
    for (const { scope } of McpServerConfig.files(workspaceRoot))
      for (const [name, entry] of Object.entries(McpServerConfig.#parse(workspaceRoot, scope).map))
        byName.set(name, { ref: McpServerConfig.#refOf(name, entry), disabled: !!entry.disabled, scope });
    return [...byName.values()];
  }

  /**
   * Declares one server, replacing an entry of the same name in the file it is written to.
   *
   * A url is an http server and anything else is a command with its argv, which is the whole of the guess: a
   * transport asked for as a third argument is a thing to get wrong, and the two shapes are already distinct.
   */
  static add(workspaceRoot: string, name: string, target: string[], scope: McpServerScope = "global") {
    const [head, ...rest] = target;
    if (!head) throw new Error("Give the server a command to run, or a url to reach.");
    const entry: ServerFileEntry = /^https?:\/\//.test(head) ? { url: head } : { command: head, args: rest };
    const { file, key, map } = McpServerConfig.#parse(workspaceRoot, scope);
    const next = { ...map, [name]: entry };
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, `${JSON.stringify({ [key]: next }, null, 2)}\n`);
    return McpServerConfig.#refOf(name, entry);
  }

  /** Removes it from whichever file declares it, and says which — a name can only be in one at a time. */
  static remove(workspaceRoot: string, name: string): McpServerScope | false {
    for (const { scope } of [...McpServerConfig.files(workspaceRoot)].reverse()) {
      const { file, key, map } = McpServerConfig.#parse(workspaceRoot, scope);
      if (!(name in map)) continue;
      const next = { ...map };
      delete next[name];
      writeFileSync(file, `${JSON.stringify({ [key]: next }, null, 2)}\n`);
      return scope;
    }
    return false;
  }

  static #refOf(name: string, entry: ServerFileEntry): CodeAgentMcpServerRef {
    return {
      name,
      transport: entry.url ? "http" : "stdio",
      ...(entry.command ? { command: entry.command } : {}),
      ...(entry.args ? { args: entry.args } : {}),
      ...(entry.url ? { url: entry.url } : {}),
      ...(entry.env ? { env: entry.env } : {}),
      ...(entry.headers ? { headers: entry.headers } : {}),
      ...(entry.oauth ? { oauth: entry.oauth } : {}),
    };
  }

  /** What a server is reached at, as one line: the argv or the url. */
  static targetOf(ref: CodeAgentMcpServerRef) {
    return ref.url ?? [ref.command, ...(ref.args ?? [])].filter(Boolean).join(" ");
  }

  /** Why a file yielded nothing, when it exists and yielded nothing — a listing has to say which. */
  static problem(workspaceRoot: string) {
    for (const { file } of McpServerConfig.files(workspaceRoot)) {
      if (!existsSync(file)) continue;
      try {
        JSON.parse(readFileSync(file, "utf8"));
      } catch (error) {
        return `${file} is not valid JSON — ${String(error)}`;
      }
    }
    return undefined;
  }

  static #parse(workspaceRoot: string, scope: McpServerScope) {
    const file = McpServerConfig.file(workspaceRoot, scope);
    const empty = { file, key: "mcpServers" as const, map: {} as Record<string, ServerFileEntry> };
    if (!existsSync(file)) return empty;
    try {
      const parsed = JSON.parse(readFileSync(file, "utf8")) as ServerFile;
      if (parsed.servers && !parsed.mcpServers) return { file, key: "servers" as const, map: parsed.servers };
      return { ...empty, map: parsed.mcpServers ?? {} };
    } catch {
      // A malformed file costs its servers, not the session; `problem` is what says so on the listing.
      return empty;
    }
  }
}
