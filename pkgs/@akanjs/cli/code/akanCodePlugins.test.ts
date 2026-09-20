import { afterEach, describe, expect, test } from "bun:test";
import path from "node:path";
import { codeAgentPresets } from "akanjs/common";
import { cleanupCliTempWorkspace, makeCliTempWorkspace, writeText } from "../testHelpers";
import { AkanEditScope } from "./AkanEditScope";
import { AkanEnvKeys } from "./AkanEnvKeys";
import { AkanVerifier } from "./AkanVerifier";
import { DevLogFeedback } from "./DevLogFeedback";
import { McpClient } from "./McpClient";
import { McpToolPack } from "./McpToolPack";
import { PreviewView } from "./PreviewView";
import { SessionToolPack } from "./SessionToolPack";
import { SubagentPool } from "./SubagentPool";
import { TurnFeedback, type TurnFeedbackSource } from "./TurnFeedback";
import { WebToolPack } from "./WebToolPack";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((root) => cleanupCliTempWorkspace(root)));
});

const source = (key: string, findings: (string | undefined)[]): TurnFeedbackSource => {
  let call = 0;
  return {
    key,
    begin: () => {},
    observe: () => {
      const finding = findings[Math.min(call, findings.length - 1)];
      call += 1;
      return finding;
    },
  };
};

describe("TurnFeedback", () => {
  test("reports a finding as one message the agent can act on", async () => {
    const feedback = new TurnFeedback([source("a", ["dev server died"])], { budget: 2 });
    const message = await feedback.collect();
    expect(message).toContain("dev server died");
    expect(message).toContain("Fix them, then stop.");
  });

  test("says nothing when every source is quiet", async () => {
    const feedback = new TurnFeedback([source("a", [undefined])], { budget: 2 });
    expect(await feedback.collect()).toBeUndefined();
  });

  test("stops after the budget so one unfixable error cannot loop forever", async () => {
    const notices: string[] = [];
    const feedback = new TurnFeedback([source("a", ["still broken"])], { budget: 2, onNotice: (m) => notices.push(m) });
    expect(await feedback.collect()).toContain("still broken");
    expect(await feedback.collect()).toContain("still broken");
    expect(await feedback.collect()).toBeUndefined();
    expect(notices[0]).toContain("still failing after 2 attempts");
  });

  test("a source that goes quiet gets its budget back", async () => {
    const feedback = new TurnFeedback([source("a", ["broken", undefined, "broken again"])], { budget: 1 });
    expect(await feedback.collect()).toContain("broken");
    expect(await feedback.collect()).toBeUndefined();
    expect(await feedback.collect()).toContain("broken again");
  });

  test("budgets are per source, so one stuck source does not silence another", async () => {
    const feedback = new TurnFeedback([source("a", ["stuck"]), source("b", [undefined, "new"])], { budget: 1 });
    expect(await feedback.collect()).toContain("stuck");
    expect(await feedback.collect()).toContain("new");
  });

  test("a source that throws is skipped rather than taking the turn down", async () => {
    const angry: TurnFeedbackSource = {
      key: "angry",
      begin: () => {},
      observe: () => {
        throw new Error("no dev server");
      },
    };
    const feedback = new TurnFeedback([angry, source("b", ["real finding"])], { budget: 2 });
    expect(await feedback.collect()).toContain("real finding");
  });

  test("attaches images only when a source supplies them", async () => {
    const withImage: TurnFeedbackSource = {
      key: "preview",
      begin: () => {},
      observe: () => ({ text: "page is blank", images: [{ data: "AAA", mimeType: "image/png" }] }),
    };
    const message = await new TurnFeedback([withImage], { budget: 2 }).collect();
    expect(Array.isArray(message)).toBe(true);
    expect(message).toEqual([
      { type: "text", text: expect.stringContaining("page is blank") },
      { type: "image", data: "AAA", mimeType: "image/png" },
    ]);
  });
});

describe("AkanVerifier.summarize", () => {
  const scope = { paths: ["apps/a/x.ts"], apps: ["a"], libs: [], needsSync: false, touchesTsx: false };

  test("names the failing step and keeps only its tail", () => {
    const output = [...Array(100).keys()].map((n) => `line ${n}`).join("\n");
    const text = AkanVerifier.summarize(
      {
        ok: false,
        scope,
        steps: [
          { command: "akan lint a", ok: true, exitCode: 0, output: "" },
          { command: "akan typecheck a", ok: false, exitCode: 1, output },
        ],
      },
      { tailLines: 5 },
    );
    expect(text).toContain("Verification failed: akan typecheck a");
    expect(text).toContain("Passed: akan lint a");
    expect(text).toContain("line 99");
    expect(text).not.toContain("line 10\n");
  });

  test("says so plainly when everything passed", () => {
    const text = AkanVerifier.summarize({
      ok: true,
      scope,
      steps: [{ command: "akan lint a", ok: true, exitCode: 0, output: "" }],
    });
    expect(text).toContain("Verification passed");
  });

  test("an untouched workspace is not a failure", () => {
    expect(AkanVerifier.summarize({ ok: true, scope, steps: [] })).toContain("nothing to verify");
  });
});

describe("AkanEditScope", () => {
  test("derives apps, libs, sync need and tsx from a git status diff", async () => {
    const { root } = await makeCliTempWorkspace();
    tempRoots.push(root);
    await Bun.spawn(["git", "init", "-q"], { cwd: root, stdout: "ignore", stderr: "ignore" }).exited;
    const baseline = await AkanEditScope.baseline(root);
    await writeText(path.join(root, "apps", "demo", "lib", "post", "post.service.ts"), "export {};\n");
    await writeText(path.join(root, "libs", "shared", "ui", "Card.tsx"), "export const Card = () => null;\n");
    const scope = await AkanEditScope.since(root, baseline);
    expect(scope.apps).toEqual(["demo"]);
    expect(scope.libs).toEqual(["shared"]);
    expect(scope.needsSync).toBe(true);
    expect(scope.touchesTsx).toBe(true);
  });

  test("an unchanged tree implicates no target", async () => {
    const { root } = await makeCliTempWorkspace();
    tempRoots.push(root);
    await Bun.spawn(["git", "init", "-q"], { cwd: root, stdout: "ignore", stderr: "ignore" }).exited;
    const baseline = await AkanEditScope.baseline(root);
    const scope = await AkanEditScope.since(root, baseline);
    expect(scope).toEqual({ paths: [], apps: [], libs: [], needsSync: false, touchesTsx: false });
  });
});

describe("DevLogFeedback", () => {
  const logPath = (root: string, app: string) => path.join(root, "local", "apps", app, "runtime", "dev.log");

  test("reports only the errors written after the watermark", async () => {
    const { root } = await makeCliTempWorkspace();
    tempRoots.push(root);
    await writeText(logPath(root, "demo"), "[demo] boot ok\n");
    const feedback = new DevLogFeedback({ workspaceRoot: root, apps: ["demo"], graceMs: 0 });
    feedback.begin();
    await writeText(logPath(root, "demo"), "[demo] boot ok\n[AkanApp]   ERROR  Port 8282 is already in use\n");
    const finding = await feedback.observe();
    expect(finding).toContain("Port 8282 is already in use");
    expect(finding).not.toContain("boot ok");
  });

  test("stays quiet when the new lines are only debug noise", async () => {
    const { root } = await makeCliTempWorkspace();
    tempRoots.push(root);
    await writeText(logPath(root, "demo"), "start\n");
    const feedback = new DevLogFeedback({ workspaceRoot: root, apps: ["demo"], graceMs: 0 });
    feedback.begin();
    await writeText(logPath(root, "demo"), "start\n[McpRouter]   DEBUG  MCP catalogue: tools=3\n");
    expect(await feedback.observe()).toBeUndefined();
  });

  test("no dev server means nothing to say, not an error", async () => {
    const { root } = await makeCliTempWorkspace();
    tempRoots.push(root);
    const feedback = new DevLogFeedback({ workspaceRoot: root, apps: ["demo"], graceMs: 0 });
    feedback.begin();
    expect(await feedback.observe()).toBeUndefined();
  });

  test("reads the dev server's allocated URL back out of its own log", async () => {
    const { root } = await makeCliTempWorkspace();
    tempRoots.push(root);
    await writeText(
      logPath(root, "demo"),
      "[demo] demo ready (pid=1) — http://localhost:3000\n[demo] demo ready (pid=2) — http://localhost:8282\n",
    );
    expect(await DevLogFeedback.previewUrl(root, "demo")).toBe("http://localhost:8282");
    expect(await DevLogFeedback.previewUrl(root, "absent")).toBeUndefined();
  });
});

describe("AkanEnvKeys", () => {
  test("maps <PROVIDER>_API_KEY onto the engine's provider id without persisting it", async () => {
    const { root } = await makeCliTempWorkspace();
    tempRoots.push(root);
    await writeText(path.join(root, ".env"), '# comment\nDEEPSEEK_API_KEY="sk-test"\nSOMETHING_ELSE=1\n');
    const applied: [string, string][] = [];
    const fake = { setRuntimeApiKey: (provider: string, key: string) => applied.push([provider, key]) };
    const providers = AkanEnvKeys.apply(fake as never, root);
    expect(providers).toContain("deepseek");
    expect(applied).toContainEqual(["deepseek", "sk-test"]);
  });
});

describe("PreviewView", () => {
  test("reports whether this Bun build can drive a headless page at all", () => {
    expect(typeof PreviewView.available).toBe("boolean");
  });

  test.skipIf(!PreviewView.available)("finds an empty body and a console error on a real page", async () => {
    const server = Bun.serve({
      port: 0,
      fetch: () =>
        new Response('<!doctype html><html><body></body><script>console.error("boom")</script></html>', {
          headers: { "content-type": "text/html" },
        }),
    });
    try {
      const probe = await PreviewView.probe(`http://localhost:${server.port}/`);
      expect(probe.pageErrors.join(" ")).toContain("rendered empty");
      expect(probe.consoleErrors.join(" ")).toContain("boom");
    } finally {
      server.stop(true);
    }
  });
});

describe("SubagentPool", () => {
  const workspace = { workspaceRoot: "/tmp/akan" } as never;

  test("is absent when the profile disables sub-agents", () => {
    const profile = codeAgentPresets.local("/tmp/akan");
    const off = { ...profile, tools: { ...profile.tools, subagent: false as const } };
    expect(SubagentPool.extensionFor({ workspace, cwd: "/tmp/akan", parent: off, depth: 0 })).toBeUndefined();
  });

  test("is absent once the depth limit is reached, so a task cannot recurse forever", () => {
    const parent = codeAgentPresets.local("/tmp/akan");
    expect(SubagentPool.extensionFor({ workspace, cwd: "/tmp/akan", parent, depth: 0 })).toBeDefined();
    expect(SubagentPool.extensionFor({ workspace, cwd: "/tmp/akan", parent, depth: 2 })).toBeUndefined();
  });

  test("review allows one level only", () => {
    const parent = codeAgentPresets.review("/tmp/akan");
    expect(SubagentPool.extensionFor({ workspace, cwd: "/tmp/akan", parent, depth: 0 })).toBeDefined();
    expect(SubagentPool.extensionFor({ workspace, cwd: "/tmp/akan", parent, depth: 1 })).toBeUndefined();
  });
});

describe("McpToolPack", () => {
  /** A minimal stdio MCP server, written at test time so the suite carries no extra source file. */
  const serverSource = `
const reply = (id, result) => process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, result }) + "\\n");
for await (const line of console) {
  if (!line.trim()) continue;
  const message = JSON.parse(line);
  if (message.method === "initialize") reply(message.id, { protocolVersion: "2025-06-18", capabilities: {}, serverInfo: { name: "echo", version: "1" } });
  if (message.method === "tools/list")
    reply(message.id, { tools: [{ name: "echo", description: "Echo the text back.", inputSchema: { type: "object", properties: { text: { type: "string" } }, required: ["text"] } }] });
  if (message.method === "tools/call")
    reply(message.id, { content: [{ type: "text", text: "echo: " + message.params.arguments.text }] });
}
`;

  const withServer = async () => {
    const { root } = await makeCliTempWorkspace();
    tempRoots.push(root);
    const script = path.join(root, "echo-mcp.ts");
    await writeText(script, serverSource);
    await writeText(
      path.join(root, ".akan", "code", "mcp.json"),
      JSON.stringify({ mcpServers: { echo: { command: process.execPath, args: [script] } } }),
    );
    return root;
  };

  test("connects a declared stdio server, lists its tools and calls one", async () => {
    const root = await withServer();
    const pack = await McpToolPack.connect({ workspaceRoot: root, profile: codeAgentPresets.local(root) });
    expect(pack).toBeDefined();
    try {
      expect(pack?.toolNames).toEqual(["mcp__echo__echo"]);
      const client = await new McpClient({
        name: "echo",
        transport: "stdio",
        command: process.execPath,
        args: [path.join(root, "echo-mcp.ts")],
      }).connect();
      try {
        expect(await client.callTool("echo", { text: "hi" })).toEqual({ text: "echo: hi", isError: false });
      } finally {
        client.close();
      }
    } finally {
      pack?.close();
    }
  });

  test("a server that cannot start costs its own tools and nothing else", async () => {
    const { root } = await makeCliTempWorkspace();
    tempRoots.push(root);
    await writeText(
      path.join(root, ".akan", "code", "mcp.json"),
      JSON.stringify({ mcpServers: { broken: { command: "/nonexistent/binary" } } }),
    );
    const notices: string[] = [];
    const pack = await McpToolPack.connect({
      workspaceRoot: root,
      profile: codeAgentPresets.local(root),
      onNotice: (message) => notices.push(message),
    });
    expect(pack).toBeUndefined();
    expect(notices.join(" ")).toContain("broken");
  });

  test("declares nothing when the profile turns MCP off", async () => {
    const root = await withServer();
    const pack = await McpToolPack.connect({ workspaceRoot: root, profile: codeAgentPresets.review(root) });
    expect(pack).toBeUndefined();
  });
});

describe("WebToolPack", () => {
  const root = "/tmp/akan-web";

  test("publishes only what the profile allows and the environment can serve", () => {
    const readOnly = codeAgentPresets.review(root);
    expect(new WebToolPack({ profile: readOnly }).names()).toEqual([]);
    expect(new WebToolPack({ profile: codeAgentPresets.local(root) }).names()).toContain("web_fetch");
  });

  test("registers web_search only when a provider key is present", () => {
    const profile = codeAgentPresets.local(root);
    const had = process.env.BRAVE_API_KEY;
    try {
      delete process.env.BRAVE_API_KEY;
      delete process.env.TAVILY_API_KEY;
      expect(new WebToolPack({ profile }).names()).not.toContain("web_search");
      process.env.BRAVE_API_KEY = "test";
      expect(new WebToolPack({ profile }).names()).toContain("web_search");
    } finally {
      if (had === undefined) delete process.env.BRAVE_API_KEY;
      else process.env.BRAVE_API_KEY = had;
    }
  });

  test("reads a page down to text and refuses a host the profile excludes", async () => {
    const server = Bun.serve({
      port: 0,
      fetch: () =>
        new Response(
          "<html><head><style>b{}</style></head><body><h1>Akan</h1><p>Hello &amp; welcome</p></body></html>",
          {
            headers: { "content-type": "text/html" },
          },
        ),
    });
    try {
      const profile = codeAgentPresets.local(root);
      const pack = new WebToolPack({ profile });
      const tools = new Map<
        string,
        (id: string, params: never) => Promise<{ content: { text: string }[]; isError?: boolean }>
      >();
      const factory = (pack.extension() as { factory: (pi: unknown) => void }).factory;
      factory({ registerTool: (tool: { name: string; execute: never }) => tools.set(tool.name, tool.execute) });
      const fetchTool = tools.get("web_fetch");
      const ok = await fetchTool?.("1", { url: `http://localhost:${server.port}/` } as never);
      expect(ok?.content[0]?.text).toContain("Akan");
      expect(ok?.content[0]?.text).toContain("Hello & welcome");
      expect(ok?.content[0]?.text).not.toContain("<h1>");

      const narrowed = new WebToolPack({ profile: { ...profile, network: { allowHosts: ["docs.akanjs.com"] } } });
      const narrowedTools = new Map<
        string,
        (id: string, params: never) => Promise<{ content: { text: string }[]; isError?: boolean }>
      >();
      (narrowed.extension() as { factory: (pi: unknown) => void }).factory({
        registerTool: (tool: { name: string; execute: never }) => narrowedTools.set(tool.name, tool.execute),
      });
      const refused = await narrowedTools.get("web_fetch")?.("1", { url: `http://localhost:${server.port}/` } as never);
      expect(refused?.isError).toBe(true);
      expect(refused?.content[0]?.text).toContain("docs.akanjs.com");
    } finally {
      server.stop(true);
    }
  });
});

describe("SessionToolPack", () => {
  const options = (root: string, profile = codeAgentPresets.local(root)) => ({
    workspaceRoot: root,
    cwd: root,
    profile,
    currentSessionId: () => "current",
  });

  test("is absent when the profile forbids reaching other sessions", () => {
    const pack = new SessionToolPack(options("/tmp/akan", codeAgentPresets.review("/tmp/akan")));
    expect(pack.names()).toEqual([]);
    expect(pack.extension()).toBeUndefined();
  });

  test("publishes both readers when cross-session is on", () => {
    expect(new SessionToolPack(options("/tmp/akan")).names()).toEqual(["session_search", "session_read"]);
  });

  test("says so plainly when nothing earlier matches", async () => {
    const { root } = await makeCliTempWorkspace();
    tempRoots.push(root);
    const tools = new Map<string, (id: string, params: never) => Promise<{ content: { text: string }[] }>>();
    (new SessionToolPack(options(root)).extension() as { factory: (pi: unknown) => void }).factory({
      registerTool: (tool: { name: string; execute: never }) => tools.set(tool.name, tool.execute),
    });
    const result = await tools.get("session_search")?.("1", { query: "tunnel wire" } as never);
    expect(result?.content[0]?.text).toContain("No earlier session");
  });
});
