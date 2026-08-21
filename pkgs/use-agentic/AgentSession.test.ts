import { describe, expect, test } from "bun:test";
import { AgenticSurface } from "./AgenticSurface";
import { AgentSession } from "./AgentSession";
import type { AgentRunner, RunnerEvent, RunnerRequest } from "./types";

const scripted = (...turns: RunnerEvent[][]): { runner: AgentRunner; requests: RunnerRequest[] } => {
  const requests: RunnerRequest[] = [];
  let index = 0;
  return {
    requests,
    runner: {
      async *run(request) {
        requests.push(request);
        const turn = turns[Math.min(index, turns.length - 1)];
        index += 1;
        yield* turn;
      },
    },
  };
};

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
const until = async (predicate: () => boolean) => {
  for (let i = 0; i < 200 && !predicate(); i += 1) await tick();
  if (!predicate()) throw new Error("condition never met");
};

describe("AgentSession", () => {
  test("a text-only turn lands as one streamed assistant message", async () => {
    const surface = new AgenticSurface();
    const { runner, requests } = scripted([
      { type: "text", delta: "Hello " },
      { type: "text", delta: "there" },
      { type: "done", stop: "end" },
    ]);
    const session = new AgentSession(surface, runner, { instructions: "Be brief" });
    await session.send("hi");
    expect(session.messages.map((message) => message.role)).toEqual(["user", "assistant"]);
    expect(session.messages[1].text).toBe("Hello there");
    expect(session.isRunning).toBe(false);
    expect(requests[0].instructions).toBe("Be brief");
    expect(requests[0].messages.map((message) => message.role)).toEqual(["user"]);
  });

  test("a tool turn executes, reports changes, and feeds results into the next turn", async () => {
    const surface = new AgenticSurface();
    let count = 0;
    surface.registerResource([], { name: "count", read: () => count });
    surface.registerTool([], {
      name: "bump",
      run: () => {
        count += 1;
      },
    });
    const { runner, requests } = scripted(
      [
        { type: "toolCall", id: "c1", name: "bump", args: {} },
        { type: "done", stop: "toolUse" },
      ],
      [
        { type: "text", delta: "Done" },
        { type: "done", stop: "end" },
      ],
    );
    const session = new AgentSession(surface, runner);
    await session.send("bump it");
    const toolMessage = session.messages.find((message) => message.role === "tool");
    expect(toolMessage?.toolResults).toEqual([{ id: "c1", name: "bump", changes: [{ name: "count", value: 1 }] }]);
    expect(requests).toHaveLength(2);
    expect(requests[1].messages.filter((message) => message.role === "tool")).toHaveLength(1);
    expect(requests[0].tools.map((tool) => tool.name)).toEqual(["bump"]);
    expect(session.messages[session.messages.length - 1].text).toBe("Done");
  });

  test("a guard refusal and an unknown tool are tool results, not crashes", async () => {
    const surface = new AgenticSurface();
    surface.registerTool([], { name: "gated", guard: () => "stale index", run: () => "never" });
    const { runner } = scripted(
      [
        { type: "toolCall", id: "c1", name: "gated", args: {} },
        { type: "toolCall", id: "c2", name: "missing", args: {} },
        { type: "done", stop: "toolUse" },
      ],
      [
        { type: "text", delta: "Understood" },
        { type: "done", stop: "end" },
      ],
    );
    const session = new AgentSession(surface, runner);
    await session.send("try");
    const results = session.messages.find((message) => message.role === "tool")?.toolResults;
    expect(results?.[0].error).toBe("stale index");
    expect(results?.[1].error).toBe("Unknown tool: missing");
    expect(session.messages[session.messages.length - 1].text).toBe("Understood");
  });

  test("a confirm tool pauses on pendingApproval and runs on approve", async () => {
    const surface = new AgenticSurface();
    let ran = 0;
    surface.registerTool([], {
      name: "render",
      confirm: "Render now? It spends credits.",
      run: () => {
        ran += 1;
      },
    });
    const { runner } = scripted(
      [
        { type: "toolCall", id: "c1", name: "render", args: {} },
        { type: "done", stop: "toolUse" },
      ],
      [
        { type: "text", delta: "Rendering" },
        { type: "done", stop: "end" },
      ],
    );
    const session = new AgentSession(surface, runner);
    const turn = session.send("render");
    await until(() => session.pendingApproval !== null);
    expect(session.pendingApproval?.message).toBe("Render now? It spends credits.");
    expect(ran).toBe(0);
    session.pendingApproval?.approve();
    await turn;
    expect(ran).toBe(1);
    expect(session.pendingApproval).toBeNull();
  });

  test("a rejected approval becomes the tool's error result", async () => {
    const surface = new AgenticSurface();
    let ran = 0;
    surface.registerTool([], {
      name: "render",
      confirm: true,
      run: () => {
        ran += 1;
      },
    });
    const { runner } = scripted(
      [
        { type: "toolCall", id: "c1", name: "render", args: {} },
        { type: "done", stop: "toolUse" },
      ],
      [
        { type: "text", delta: "Okay, skipped." },
        { type: "done", stop: "end" },
      ],
    );
    const session = new AgentSession(surface, runner);
    const turn = session.send("render");
    await until(() => session.pendingApproval !== null);
    expect(session.pendingApproval?.message).toBe("Run render?");
    session.pendingApproval?.reject("too expensive right now");
    await turn;
    expect(ran).toBe(0);
    const results = session.messages.find((message) => message.role === "tool")?.toolResults;
    expect(results?.[0].error).toBe("too expensive right now");
  });

  test("abort settles a pending approval and ends the loop without another turn", async () => {
    const surface = new AgenticSurface();
    let ran = 0;
    surface.registerTool([], {
      name: "render",
      confirm: true,
      run: () => {
        ran += 1;
      },
    });
    const { runner, requests } = scripted([
      { type: "toolCall", id: "c1", name: "render", args: {} },
      { type: "done", stop: "toolUse" },
    ]);
    const session = new AgentSession(surface, runner);
    const turn = session.send("render");
    await until(() => session.pendingApproval !== null);
    session.abort();
    await turn;
    expect(ran).toBe(0);
    expect(session.isRunning).toBe(false);
    expect(requests).toHaveLength(1);
  });

  test("the loop stops at maxTurns and records why", async () => {
    const surface = new AgenticSurface();
    surface.registerTool([], { name: "spin", run: () => null });
    const { runner, requests } = scripted([
      { type: "toolCall", id: "c", name: "spin", args: {} },
      { type: "done", stop: "toolUse" },
    ]);
    const session = new AgentSession(surface, runner, { maxTurns: 2 });
    await session.send("go");
    expect(requests).toHaveLength(2);
    expect(session.messages[session.messages.length - 1].error).toContain("Stopped after 2");
  });

  test("a runner error lands on the assistant draft", async () => {
    const surface = new AgenticSurface();
    const { runner } = scripted([{ type: "error", message: "upstream 500" }]);
    const session = new AgentSession(surface, runner);
    await session.send("hi");
    const last = session.messages[session.messages.length - 1];
    expect(last.role).toBe("assistant");
    expect(last.error).toBe("upstream 500");
    expect(session.isRunning).toBe(false);
  });

  test("surface guides fold into the turn's instructions after the session's own", async () => {
    const surface = new AgenticSurface();
    surface.registerGuide([], "This screen edits the draft.");
    const { runner, requests } = scripted([
      { type: "text", delta: "ok" },
      { type: "done", stop: "end" },
    ]);
    const session = new AgentSession(surface, runner, { instructions: "Be brief." });
    await session.send("hi");
    expect(requests[0].instructions).toBe("Be brief.\n\nThis screen edits the draft.");
  });

  test("prewritten messages ride as the user's turn, and report lands a host failure", async () => {
    const { runner, requests } = scripted([
      { type: "text", delta: "reviewed" },
      { type: "done", stop: "end" },
    ]);
    const session = new AgentSession(new AgenticSurface(), runner);
    await session.send([
      { role: "user", text: "Review this task." },
      { role: "user", text: "[resource akan://task/1]" },
    ]);
    expect(requests[0].messages).toHaveLength(2);
    expect(session.messages.at(-1)?.text).toBe("reviewed");
    session.report("/reviewTask failed: not permitted");
    expect(session.messages.at(-1)).toEqual({ role: "assistant", error: "/reviewTask failed: not permitted" });
  });

  test("send while a turn is running is refused", async () => {
    const surface = new AgenticSurface();
    surface.registerTool([], { name: "wait", confirm: true, run: () => null });
    const { runner } = scripted([
      { type: "toolCall", id: "c1", name: "wait", args: {} },
      { type: "done", stop: "toolUse" },
    ]);
    const session = new AgentSession(surface, runner);
    const turn = session.send("first");
    await until(() => session.pendingApproval !== null);
    await expect(session.send("second")).rejects.toThrow("A turn is already running.");
    session.abort();
    await turn;
  });

  test("the default context carries scopes and resources", async () => {
    const surface = new AgenticSurface();
    surface.openScope([], { id: "task-list", kind: "task" });
    surface.registerResource([], { name: "total", read: () => 3 });
    const { runner, requests } = scripted([{ type: "done", stop: "end" }]);
    await new AgentSession(surface, runner).send("ctx");
    expect(requests[0].context).toEqual([
      { kind: "screen", scopes: [{ path: "task-list", kind: "task" }] },
      { kind: "resources", resources: [{ name: "total", value: 3 }] },
    ]);
  });
});

describe("AgentSession history", () => {
  const memoryHistory = (initial: import("./types").ChatMessage[] | null = null) => {
    const state = { stored: initial, saves: 0, cleared: 0 };
    return {
      state,
      history: {
        load: () => state.stored,
        save: (messages: readonly import("./types").ChatMessage[]) => {
          state.stored = [...messages];
          state.saves += 1;
        },
        clear: () => {
          state.stored = null;
          state.cleared += 1;
        },
      },
    };
  };

  test("restores settled messages and drops an assistant draft a reload cut short", () => {
    const { history } = memoryHistory([
      { role: "user", text: "hi" },
      { role: "assistant", text: "hello" },
      { role: "assistant" },
    ]);
    const session = new AgentSession(new AgenticSurface(), scripted([]).runner, { history });
    expect(session.messages).toEqual([
      { role: "user", text: "hi" },
      { role: "assistant", text: "hello" },
    ]);
  });

  test("saves after a turn, debounced, and reset clears both transcript and storage", async () => {
    const { state, history } = memoryHistory();
    const { runner } = scripted([
      { type: "text", delta: "answer" },
      { type: "done", stop: "end" },
    ]);
    const session = new AgentSession(new AgenticSurface(), runner, { history });
    await session.send("question");
    await new Promise((resolve) => setTimeout(resolve, 350));
    expect(state.saves).toBe(1);
    expect(state.stored?.map((message) => message.text)).toEqual(["question", "answer"]);
    session.reset();
    expect(session.messages).toEqual([]);
    expect(state.cleared).toBe(1);
    await new Promise((resolve) => setTimeout(resolve, 350));
    expect(state.saves).toBe(1);
    expect(state.stored).toBeNull();
  });

  test("a history that throws never breaks the chat", async () => {
    const broken = {
      load: () => {
        throw new Error("quota");
      },
      save: () => {
        throw new Error("quota");
      },
      clear: () => {
        throw new Error("quota");
      },
    };
    const { runner } = scripted([
      { type: "text", delta: "fine" },
      { type: "done", stop: "end" },
    ]);
    const session = new AgentSession(new AgenticSurface(), runner, { history: broken });
    await session.send("hi");
    await new Promise((resolve) => setTimeout(resolve, 350));
    expect(session.messages.at(-1)?.text).toBe("fine");
    session.reset();
    expect(session.messages).toEqual([]);
  });
});
