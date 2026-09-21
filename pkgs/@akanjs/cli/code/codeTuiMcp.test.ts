import { describe, expect, test } from "bun:test";
import type { CodeAgentMcpServerRef, CodeAgentMcpStatus } from "akanjs/common";
import { CodeTuiMcp, type CodeTuiMcpView } from "./CodeTuiMcp";

const file = "/repo/.akan/code/mcp.json";

const ref = (name: string, patch: Partial<CodeAgentMcpServerRef> = {}): CodeAgentMcpServerRef => ({
  name,
  transport: "stdio",
  command: "npx",
  args: ["-y", `server-${name}`],
  ...patch,
});

const live = (name: string, patch: Partial<CodeAgentMcpStatus> = {}): CodeAgentMcpStatus => ({
  name,
  transport: "stdio",
  target: `npx -y server-${name}`,
  tools: [`mcp__${name}__search`, `mcp__${name}__read`],
  ...patch,
});

const view = (patch: Partial<CodeTuiMcpView> = {}): CodeTuiMcpView => ({
  status: [],
  declared: [],
  file,
  ...patch,
});

describe("/mcp", () => {
  test("nothing declared says where to declare one", () => {
    const text = CodeTuiMcp.list(view());
    expect(text).toContain("No MCP server is declared.");
    expect(text).toContain(file);
    expect(text).toContain("/mcp add");
  });

  test("a connected server reads as its transport, its target and its tool count", () => {
    const text = CodeTuiMcp.list(
      view({ status: [live("github")], declared: [{ ref: ref("github"), disabled: false }] }),
    );
    expect(text).toContain("1 server · /repo/.akan/code/mcp.json");
    expect(text).toMatch(/github\s+stdio\s+npx -y server-github\s+2 tools/);
  });

  test("one tool is not 'tools'", () => {
    const status = live("solo", { tools: ["mcp__solo__go"] });
    expect(CodeTuiMcp.list(view({ status: [status], declared: [{ ref: ref("solo"), disabled: false }] }))).toContain(
      "1 tool",
    );
  });

  test("an unreachable server says why rather than going missing", () => {
    const status = live("linear", { transport: "http", target: "https://x", tools: [], error: "fetch failed" });
    const text = CodeTuiMcp.list(view({ status: [status], declared: [{ ref: ref("linear"), disabled: false }] }));
    expect(text).toContain("unreachable — fetch failed");
  });

  /**
   * The session's tool allowlist is built once. A server added to the file afterwards is declared and not
   * connected at the same time, and calling that state "broken" would send someone debugging their server.
   */
  test("a server the file gained after this session started asks for a reload", () => {
    const text = CodeTuiMcp.list(view({ status: [live("github")], declared: [{ ref: ref("new"), disabled: false }] }));
    expect(text).toContain("declared · /mcp reload to connect");
    expect(text).toMatch(/github\s+stdio\s+npx -y server-github\s+2 tools/);
  });

  test("a server removed from the file is still the one this session is holding", () => {
    expect(CodeTuiMcp.list(view({ status: [live("github")] }))).toContain("removed from the file");
  });

  test("a disabled entry is neither connected nor a failure", () => {
    const text = CodeTuiMcp.list(view({ declared: [{ ref: ref("off"), disabled: true }] }));
    const row = text.split("\n").find((line) => line.startsWith("off"));
    expect(row).toContain("disabled in the file");
    // Not "declared · /mcp reload to connect": reloading would connect nothing, the file having turned it off.
    expect(row).not.toContain("reload");
  });

  test("a broken file is named above the list rather than read as an empty one", () => {
    expect(CodeTuiMcp.list(view({ problem: `${file} is not valid JSON — oops` }))).toContain("is not valid JSON");
  });

  test("servers are listed by name, so the order does not move between runs", () => {
    const text = CodeTuiMcp.list(
      view({
        status: [live("zulip"), live("github")],
        declared: [
          { ref: ref("zulip"), disabled: false },
          { ref: ref("github"), disabled: false },
        ],
      }),
    );
    expect(text.indexOf("github")).toBeLessThan(text.indexOf("zulip"));
  });

  test("one server's tools are named the way the model sees them", () => {
    expect(CodeTuiMcp.tools(live("github"))).toContain("mcp__github__search");
    expect(CodeTuiMcp.tools(live("x", { tools: [], error: "no" }))).toContain("unreachable");
    expect(CodeTuiMcp.tools(live("x", { tools: [] }))).toContain("published no tools");
  });

  test("a name that would collide inside a tool name is refused", () => {
    expect(CodeTuiMcp.namePattern.test("my-server_2")).toBe(true);
    for (const name of ["my server", "a.b", "a/b", ""]) expect(CodeTuiMcp.namePattern.test(name)).toBe(false);
  });
});
