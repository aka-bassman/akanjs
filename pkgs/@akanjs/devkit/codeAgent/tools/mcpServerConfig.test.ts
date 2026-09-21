import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { McpServerConfig } from "./McpServerConfig";

const roots: string[] = [];

const workspace = (file?: string) => {
  const root = mkdtempSync(path.join(tmpdir(), "akan-mcp-"));
  roots.push(root);
  if (file === undefined) return root;
  const target = McpServerConfig.file(root);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, file);
  return root;
};

const written = (root: string) =>
  JSON.parse(readFileSync(McpServerConfig.file(root), "utf8")) as Record<string, object>;

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("MCP server config", () => {
  test("an editor's own block is read as it is written", () => {
    const root = workspace(
      JSON.stringify({
        mcpServers: {
          github: { command: "npx", args: ["-y", "@modelcontextprotocol/server-github"] },
          linear: { url: "https://mcp.linear.app/sse" },
        },
      }),
    );
    expect(McpServerConfig.read(root)).toEqual([
      { name: "github", transport: "stdio", command: "npx", args: ["-y", "@modelcontextprotocol/server-github"] },
      { name: "linear", transport: "http", url: "https://mcp.linear.app/sse" },
    ]);
  });

  test("a disabled server is declared but never connected", () => {
    const root = workspace(JSON.stringify({ mcpServers: { off: { command: "x", disabled: true } } }));
    expect(McpServerConfig.read(root)).toEqual([]);
    expect(McpServerConfig.declared(root)).toEqual([
      { ref: { name: "off", transport: "stdio", command: "x" }, disabled: true },
    ]);
  });

  test("a url is an http server and anything else is a command with its argv", () => {
    const root = workspace();
    expect(McpServerConfig.add(root, "linear", ["https://mcp.linear.app/sse"])).toEqual({
      name: "linear",
      transport: "http",
      url: "https://mcp.linear.app/sse",
    });
    expect(McpServerConfig.add(root, "github", ["npx", "-y", "server-github"])).toEqual({
      name: "github",
      transport: "stdio",
      command: "npx",
      args: ["-y", "server-github"],
    });
    expect(Object.keys(written(root).mcpServers ?? {})).toEqual(["linear", "github"]);
  });

  /** The file is shared with whatever editor wrote it, so the key it already uses is the key a write goes into. */
  test("a VS Code file keeps its own spelling through a write", () => {
    const root = workspace(JSON.stringify({ servers: { a: { command: "a" } } }));
    McpServerConfig.add(root, "b", ["b"]);
    const file = written(root);
    expect(Object.keys(file)).toEqual(["servers"]);
    expect(Object.keys(file.servers ?? {})).toEqual(["a", "b"]);
  });

  test("adding the same name twice replaces the entry rather than doubling it", () => {
    const root = workspace();
    McpServerConfig.add(root, "a", ["old"]);
    McpServerConfig.add(root, "a", ["new", "--flag"]);
    expect(McpServerConfig.read(root)).toEqual([{ name: "a", transport: "stdio", command: "new", args: ["--flag"] }]);
  });

  test("removing says whether it removed anything", () => {
    const root = workspace(JSON.stringify({ mcpServers: { a: { command: "a" } } }));
    expect(McpServerConfig.remove(root, "nope")).toBe(false);
    expect(McpServerConfig.remove(root, "a")).toBe(true);
    expect(McpServerConfig.read(root)).toEqual([]);
  });

  test("a server with nothing to reach it by is refused", () => {
    expect(() => McpServerConfig.add(workspace(), "a", [])).toThrow();
  });

  test("a malformed file costs its servers and is named rather than thrown", () => {
    const root = workspace("{ not json");
    expect(McpServerConfig.read(root)).toEqual([]);
    expect(McpServerConfig.problem(root)).toContain("not valid JSON");
  });

  test("no file at all is not a problem", () => {
    const root = workspace();
    expect(McpServerConfig.read(root)).toEqual([]);
    expect(McpServerConfig.problem(root)).toBeUndefined();
  });

  test("a server reads back as the one line it is reached at", () => {
    expect(McpServerConfig.targetOf({ name: "a", transport: "stdio", command: "npx", args: ["-y", "x"] })).toBe(
      "npx -y x",
    );
    expect(McpServerConfig.targetOf({ name: "a", transport: "http", url: "https://x" })).toBe("https://x");
  });
});
