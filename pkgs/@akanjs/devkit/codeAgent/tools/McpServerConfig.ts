import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { CodeAgentMcpServerRef } from "akanjs/common";
import { akanCodePaths } from "../agent/akanCodePaths";

interface ServerFileEntry {
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  type?: string;
  disabled?: boolean;
}

interface ServerFile {
  mcpServers?: Record<string, ServerFileEntry>;
  servers?: Record<string, ServerFileEntry>;
}

/**
 * The workspace's declared MCP servers, in the shape the editors already write.
 *
 * `.akan/code/mcp.json` holds an `mcpServers` map — the block a developer already has in their Claude, Cursor
 * or VS Code config — so the file can be pasted rather than translated. `servers` is read as well because VS
 * Code spells it that way, and whichever key the file already uses is the one a write goes back into:
 * rewriting it to our preferred spelling would silently break the editor sharing the file.
 */
export class McpServerConfig {
  static file(workspaceRoot: string) {
    return akanCodePaths.mcpFile(workspaceRoot);
  }

  static read(workspaceRoot: string): CodeAgentMcpServerRef[] {
    const entries = Object.entries(McpServerConfig.#parse(workspaceRoot).map);
    return entries.filter(([, entry]) => !entry.disabled).map(([name, entry]) => McpServerConfig.#refOf(name, entry));
  }

  /** Every declared server including the disabled ones, which is what a listing has to show. */
  static declared(workspaceRoot: string) {
    return Object.entries(McpServerConfig.#parse(workspaceRoot).map).map(([name, entry]) => ({
      ref: McpServerConfig.#refOf(name, entry),
      disabled: !!entry.disabled,
    }));
  }

  /**
   * Declares one server, replacing an entry of the same name.
   *
   * A url is an http server and anything else is a command with its argv, which is the whole of the guess: a
   * transport asked for as a third argument is a thing to get wrong, and the two shapes are already distinct.
   */
  static add(workspaceRoot: string, name: string, target: string[]) {
    const [head, ...rest] = target;
    if (!head) throw new Error("Give the server a command to run, or a url to reach.");
    const entry: ServerFileEntry = /^https?:\/\//.test(head) ? { url: head } : { command: head, args: rest };
    const { file, key, map } = McpServerConfig.#parse(workspaceRoot);
    const next = { ...map, [name]: entry };
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, `${JSON.stringify({ [key]: next }, null, 2)}\n`);
    return McpServerConfig.#refOf(name, entry);
  }

  static remove(workspaceRoot: string, name: string) {
    const { file, key, map } = McpServerConfig.#parse(workspaceRoot);
    if (!(name in map)) return false;
    const next = { ...map };
    delete next[name];
    writeFileSync(file, `${JSON.stringify({ [key]: next }, null, 2)}\n`);
    return true;
  }

  static #refOf(name: string, entry: ServerFileEntry): CodeAgentMcpServerRef {
    return {
      name,
      transport: entry.url ? "http" : "stdio",
      ...(entry.command ? { command: entry.command } : {}),
      ...(entry.args ? { args: entry.args } : {}),
      ...(entry.url ? { url: entry.url } : {}),
      ...(entry.env ? { env: entry.env } : {}),
    };
  }

  /** What a server is reached at, as one line: the argv or the url. */
  static targetOf(ref: CodeAgentMcpServerRef) {
    return ref.url ?? [ref.command, ...(ref.args ?? [])].filter(Boolean).join(" ");
  }

  /** Why the file yielded nothing, when it exists and yielded nothing — a listing has to say which. */
  static problem(workspaceRoot: string) {
    const file = McpServerConfig.file(workspaceRoot);
    if (!existsSync(file)) return undefined;
    try {
      JSON.parse(readFileSync(file, "utf8"));
      return undefined;
    } catch (error) {
      return `${file} is not valid JSON — ${String(error)}`;
    }
  }

  static #parse(workspaceRoot: string) {
    const file = McpServerConfig.file(workspaceRoot);
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
