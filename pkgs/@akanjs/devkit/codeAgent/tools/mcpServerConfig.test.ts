import { afterEach, beforeAll, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { akanCodePaths } from "../agent/akanCodePaths";
import { McpServerConfig, type McpServerScope } from "./McpServerConfig";

const roots: string[] = [];

/**
 * The home half of the config, moved somewhere disposable.
 *
 * Without it every `add` in this file writes into whoever runs it — `~/.akan/code/mcp.json` is now a real
 * default, and a test that declares `github` would declare it for their every session.
 */
beforeAll(() => {
  const home = mkdtempSync(path.join(tmpdir(), "akan-home-"));
  roots.push(home);
  process.env.AKAN_CODE_HOME = home;
  expect(akanCodePaths.globalMcpFile().startsWith(home)).toBe(true);
});

const globalFile = (file: string) => {
  const target = akanCodePaths.globalMcpFile();
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, file);
};

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
  rmSync(akanCodePaths.globalMcpFile(), { force: true });
  for (const root of roots.slice(1)) rmSync(root, { recursive: true, force: true });
  roots.splice(1);
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

  /** Both are what a server that discovery cannot finish for is reached with, so the file has to carry them. */
  test("a static token and a hand-issued oauth client travel from the file", () => {
    const root = workspace(
      JSON.stringify({
        mcpServers: {
          sentry: {
            url: "https://mcp.sentry.dev/mcp",
            headers: { "x-api-key": "from-the-file" },
            oauth: { clientId: "abc", scope: "project:read" },
          },
        },
      }),
    );
    expect(McpServerConfig.read(root)[0]).toMatchObject({
      headers: { "x-api-key": "from-the-file" },
      oauth: { clientId: "abc", scope: "project:read" },
    });
  });

  test("a disabled server is declared but never connected", () => {
    const root = workspace(JSON.stringify({ mcpServers: { off: { command: "x", disabled: true } } }));
    expect(McpServerConfig.read(root)).toEqual([]);
    expect(McpServerConfig.declared(root)).toEqual([
      { ref: { name: "off", transport: "stdio", command: "x" }, disabled: true, scope: "workspace" },
    ]);
  });

  test("a url is an http server and anything else is a command with its argv", () => {
    const root = workspace();
    expect(McpServerConfig.add(root, "linear", ["https://mcp.linear.app/sse"], "workspace")).toEqual({
      name: "linear",
      transport: "http",
      url: "https://mcp.linear.app/sse",
    });
    expect(McpServerConfig.add(root, "github", ["npx", "-y", "server-github"], "workspace")).toEqual({
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
    McpServerConfig.add(root, "b", ["b"], "workspace");
    const file = written(root);
    expect(Object.keys(file)).toEqual(["servers"]);
    expect(Object.keys(file.servers ?? {})).toEqual(["a", "b"]);
  });

  test("adding the same name twice replaces the entry rather than doubling it", () => {
    const root = workspace();
    McpServerConfig.add(root, "a", ["old"], "workspace");
    McpServerConfig.add(root, "a", ["new", "--flag"], "workspace");
    expect(McpServerConfig.read(root)).toEqual([{ name: "a", transport: "stdio", command: "new", args: ["--flag"] }]);
  });

  test("removing says whether it removed anything", () => {
    const root = workspace(JSON.stringify({ mcpServers: { a: { command: "a" } } }));
    expect(McpServerConfig.remove(root, "nope")).toBe(false);
    expect(McpServerConfig.remove(root, "a")).toBe("workspace");
    expect(McpServerConfig.read(root)).toEqual([]);
  });

  test("a server with nothing to reach it by is refused", () => {
    expect(() => McpServerConfig.add(workspace(), "a", [], "workspace")).toThrow();
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

  /**
   * The whole point of the home file: one declaration, every checkout.
   *
   * A server is an integration with an account and its token already lives in the home directory, so making
   * the declaration per repo means declaring and signing in again in each one.
   */
  test("a server declared in the home file is read from a workspace that declares nothing", () => {
    globalFile(JSON.stringify({ mcpServers: { office: { url: "https://office.example/mcp" } } }));
    const root = workspace();
    expect(McpServerConfig.read(root)).toEqual([
      { name: "office", transport: "http", url: "https://office.example/mcp" },
    ]);
    expect(McpServerConfig.declared(root)[0]?.scope).toBe("global");
  });

  test("both files are merged, and the workspace wins the name they share", () => {
    globalFile(JSON.stringify({ mcpServers: { office: { url: "https://home/mcp" }, shared: { command: "home" } } }));
    const root = workspace(JSON.stringify({ mcpServers: { shared: { command: "repo" } } }));
    expect(McpServerConfig.declared(root).map((entry) => [entry.ref.name, entry.scope])).toEqual([
      ["office", "global"],
      ["shared", "workspace"],
    ]);
    expect(McpServerConfig.read(root).find((ref) => ref.name === "shared")?.command).toBe("repo");
  });

  test("a write goes to the scope it was asked for, and leaves the other file alone", () => {
    const root = workspace();
    McpServerConfig.add(root, "office", ["https://office.example/mcp"]);
    expect(McpServerConfig.declared(root)).toEqual([
      {
        ref: { name: "office", transport: "http", url: "https://office.example/mcp" },
        disabled: false,
        scope: "global",
      },
    ]);
    expect(existsSync(McpServerConfig.file(root, "workspace"))).toBe(false);
  });

  test("removing finds the file the server is actually in", () => {
    globalFile(JSON.stringify({ mcpServers: { office: { command: "x" } } }));
    const root = workspace(JSON.stringify({ mcpServers: { repobot: { command: "y" } } }));
    expect(McpServerConfig.remove(root, "office")).toBe("global");
    expect(McpServerConfig.remove(root, "repobot")).toBe("workspace");
    expect(McpServerConfig.read(root)).toEqual([]);
  });

  test("a scope is what a caller names, never guessed from the shape", () => {
    const root = workspace();
    const scopes: McpServerScope[] = ["global", "workspace"];
    for (const scope of scopes) McpServerConfig.add(root, `in-${scope}`, ["x"], scope);
    expect(McpServerConfig.declared(root).map((entry) => entry.scope)).toEqual(["global", "workspace"]);
  });

  test("a server reads back as the one line it is reached at", () => {
    expect(McpServerConfig.targetOf({ name: "a", transport: "stdio", command: "npx", args: ["-y", "x"] })).toBe(
      "npx -y x",
    );
    expect(McpServerConfig.targetOf({ name: "a", transport: "http", url: "https://x" })).toBe("https://x");
  });
});
