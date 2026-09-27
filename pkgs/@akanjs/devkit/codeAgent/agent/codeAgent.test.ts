import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import path from "node:path";
import { type CodeAgentEvent, type CodeAgentProfile, codeAgentPresets } from "akanjs/common";
import { WorkspaceExecutor } from "../../executors";
import { isolateEnv, tempDirs } from "../../testHelpers";
import { akanCodeDefaultModel } from "./akanCodeModel";
import { akanCodePaths } from "./akanCodePaths";
import { CodeAgent } from "./CodeAgent";
import { CodeAgentSuspended } from "./CodeAgentSuspended";

isolateEnv();
const makeTempRoot = tempDirs("akan-code-agent-");

const chunk = (delta: object, finish: string | null = null) =>
  `data: ${JSON.stringify({
    id: "c1",
    object: "chat.completion.chunk",
    created: 0,
    model: akanCodeDefaultModel.id,
    choices: [{ index: 0, delta, finish_reason: finish }],
  })}\n\n`;

let llm: ReturnType<typeof Bun.serve>;
beforeAll(() => {
  llm = Bun.serve({
    port: 0,
    fetch: () =>
      new Response(`${chunk({ role: "assistant", content: "ok" })}${chunk({}, "stop")}data: [DONE]\n\n`, {
        headers: { "content-type": "text/event-stream" },
      }),
  });
});
afterAll(() => llm.stop(true));

const createAgent = async (root: string) => {
  process.env.AKAN_CODE_HOME = path.join(root, "home");
  process.env.AKAN_CODE_PROXY_URL = `http://127.0.0.1:${llm.port}/llm/{provider}/v1`;
  process.env.AKAN_CODE_PROXY_TOKEN = "test-token";
  const web = codeAgentPresets.web(root);
  const profile: CodeAgentProfile = {
    ...web,
    tools: { builtin: [], akan: false, mcp: "off", subagent: false, web: { fetch: false, search: false } },
    context: { projectFiles: false, skills: false },
  };
  return await CodeAgent.create({
    workspace: new WorkspaceExecutor({ workspaceRoot: root, repoName: "repo" }),
    profile,
  });
};

describe("CodeAgent", () => {
  test("a prompt typed instead of an answer drops the parked asks", async () => {
    const root = await makeTempRoot();
    const agent = await createAgent(root);
    try {
      await agent.ask({ prompt: "Which app?", kind: "select", options: [{ key: "a", label: "akan" }] });
      const suspendedFile = CodeAgentSuspended.fileOf(akanCodePaths.sessionsDir(root), agent.sessionId) ?? "";
      expect(existsSync(suspendedFile)).toBe(true);

      await agent.prompt("Do something else instead.");

      const events: CodeAgentEvent[] = [];
      agent.on((event) => events.push(event));
      agent.announce();
      expect(events.filter((event) => event.type === "question")).toEqual([]);
      expect(existsSync(suspendedFile)).toBe(false);
    } finally {
      agent.dispose();
    }
  });
});
