import "../../test/registerDom";
import { beforeAll, describe, expect, test } from "bun:test";
import { act } from "react";
import { createRoot } from "react-dom/client";
import type { AgentRunner, AgentSession, RunnerRequest } from "use-agentic";

let Zone: typeof import("./Zone").Zone;
let st: typeof import("akanjs/store").st;
let useAgent: typeof import("use-agentic").useAgent;

/** Imported after the environment is set: `akanjs/store`'s baseSt reads the env while the module evaluates. */
beforeAll(async () => {
  process.env.AKAN_PUBLIC_APP_NAME = "zonetest";
  process.env.AKAN_PUBLIC_REPO_NAME = "zonetest";
  process.env.AKAN_PUBLIC_SERVE_DOMAIN = "localhost";
  process.env.AKAN_PUBLIC_ENV = "testing";
  ({ Zone } = await import("./Zone"));
  ({ st } = await import("akanjs/store"));
  ({ useAgent } = await import("use-agentic"));
});

const runnerOf = (reply: string, seen: RunnerRequest[]): AgentRunner => ({
  async *run(request) {
    seen.push(request);
    yield { type: "text", delta: reply };
    yield { type: "done", stop: "end" };
  },
});

describe("Agent.Zone", () => {
  test("two zones run parallel sessions, each reading only its own subtree", async () => {
    const seenA: RunnerRequest[] = [];
    const seenB: RunnerRequest[] = [];
    const sessions: Record<string, AgentSession> = {};
    const Probe = ({ name }: { name: string }) => {
      sessions[name] = useAgent();
      return null;
    };
    const ApproveTool = () => {
      st.tool("approveComment", { desc: "Approve one comment." }).exec(() => undefined);
      return <p>comment queue text</p>;
    };
    const PublishTool = () => {
      st.tool("publishPost", { desc: "Publish one post." }).exec(() => undefined);
      return <p>post editor text</p>;
    };
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() =>
      root.render(
        <>
          <Zone id="comments" instructions="Comment zone rules." runner={runnerOf("A", seenA)}>
            <ApproveTool />
            <Probe name="comments" />
          </Zone>
          <Zone id="posts" runner={runnerOf("B", seenB)}>
            <PublishTool />
            <Probe name="posts" />
          </Zone>
        </>,
      ),
    );
    expect(sessions.comments).toBeDefined();
    expect(sessions.posts).toBeDefined();
    expect(sessions.comments).not.toBe(sessions.posts);

    await act(async () => {
      await Promise.all([sessions.comments.send("check the queue"), sessions.posts.send("draft status?")]);
    });
    const toolsA = seenA[0].tools.map((tool) => tool.name);
    const toolsB = seenB[0].tools.map((tool) => tool.name);
    expect(toolsA).toContain("comments.approveComment");
    expect(toolsA).not.toContain("posts.publishPost");
    expect(toolsB).toContain("posts.publishPost");
    expect(toolsB).not.toContain("comments.approveComment");
    expect(seenA[0].instructions).toContain("Comment zone rules.");
    expect(seenB[0].instructions ?? "").not.toContain("Comment zone rules.");
    expect(sessions.comments.messages.at(-1)?.text).toBe("A");
    expect(sessions.posts.messages.at(-1)?.text).toBe("B");

    const screenA = (await sessions.comments.surface.call("readScreen")) as string;
    expect(screenA).toContain("comment queue text");
    expect(screenA).not.toContain("post editor text");
    act(() => root.unmount());
  });
});
