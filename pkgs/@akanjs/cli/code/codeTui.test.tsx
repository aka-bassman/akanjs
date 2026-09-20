import { afterEach, describe, expect, test } from "bun:test";
import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import type { CodeAgentAnswer, CodeAgentEvent, CodeAgentEventBody, CodeAgentSessionInfo } from "akanjs/common";
import type { CodeAgent } from "./CodeAgent";
import { CodeTui } from "./CodeTui";

class FakeStdout extends EventEmitter {
  columns = 90;
  rows = 20;
  readonly frames: string[] = [];
  write = (frame: string) => {
    this.frames.push(frame);
    return true;
  };
  get lastFrame() {
    return (this.frames.at(-1) ?? "").replace(new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, "g"), "");
  }
}

const makeStdin = () => {
  const stdin = new PassThrough() as PassThrough & {
    isTTY: boolean;
    setRawMode: (raw: boolean) => void;
    ref: () => void;
    unref: () => void;
  };
  stdin.isTTY = true;
  stdin.setRawMode = () => undefined;
  stdin.ref = () => undefined;
  stdin.unref = () => undefined;
  return stdin;
};

const info: CodeAgentSessionInfo = {
  sessionId: "s1",
  cwd: "/repo",
  profile: "local",
  model: { provider: "deepseek", id: "deepseek-v4-flash", name: "DeepSeek V4 Flash" },
  tools: ["read", "bash"],
  contextTokens: 1_000_000,
  interaction: { question: "await", approval: "await" },
};

/** A stand-in for the core that records what the host asked of it and replays frames back. */
class FakeAgent {
  readonly calls: string[] = [];
  #listener: ((event: CodeAgentEvent) => void) | undefined;
  #seq = 0;
  streaming = false;

  on(listener: (event: CodeAgentEvent) => void) {
    this.#listener = listener;
    return () => {
      this.#listener = undefined;
    };
  }

  announce() {
    this.emit({ type: "session", info });
  }

  emit(body: CodeAgentEventBody) {
    this.#seq += 1;
    this.#listener?.({ ...body, seq: this.#seq } as CodeAgentEvent);
  }

  async prompt(message: string) {
    this.calls.push(`prompt:${message}`);
  }

  async abort() {
    this.calls.push("abort");
  }

  async compact(instructions?: string) {
    this.calls.push(`compact:${instructions ?? ""}`);
  }

  async setModel(ref: { provider: string; id: string }) {
    this.calls.push(`setModel:${ref.provider}/${ref.id}`);
  }

  async answer(questionId: string, answer: CodeAgentAnswer) {
    this.calls.push(`answer:${questionId}:${JSON.stringify(answer)}`);
    return true;
  }

  async approve(approvalId: string, approved: boolean) {
    this.calls.push(`approve:${approvalId}:${approved}`);
    return true;
  }
}

const esc = String.fromCharCode(27);
/** Ink throttles frame writes to `maxFps: 30`, and the host adds its own 34ms frame timer on top. */
const settle = () => Bun.sleep(140);

const running: { tui: CodeTui; done: Promise<void> }[] = [];

const mount = () => {
  const stdout = new FakeStdout();
  const stdin = makeStdin();
  const agent = new FakeAgent();
  const tui = new CodeTui(agent as unknown as CodeAgent, {
    stdout: stdout as unknown as NodeJS.WriteStream,
    stdin: stdin as unknown as NodeJS.ReadStream,
  });
  const done = tui.run();
  running.push({ tui, done });
  return {
    agent,
    stdout,
    press: async (input: string) => {
      stdin.write(input);
      await settle();
    },
    emit: async (body: CodeAgentEventBody) => {
      agent.emit(body);
      await settle();
    },
  };
};

afterEach(async () => {
  for (const entry of running.splice(0)) {
    entry.tui.close();
    await entry.done;
  }
});

describe("CodeTui", () => {
  test("announces the session and draws its line", async () => {
    const { stdout } = mount();
    await settle();
    expect(stdout.lastFrame).toContain("DeepSeek V4 Flash");
    expect(stdout.lastFrame).toContain("1000k ctx");
  });

  test("a typed prompt is echoed locally and sent once", async () => {
    const harness = mount();
    await settle();
    await harness.press("hi there");
    await harness.press("\r");
    expect(harness.agent.calls).toEqual(["prompt:hi there"]);
    expect(harness.stdout.lastFrame).toContain("› hi there");
    // The engine's echo of the same text must not draw a second bubble.
    await harness.emit({ type: "message", turnId: "t1", role: "user", text: "hi there" });
    expect(harness.stdout.lastFrame.split("› hi there").length - 1).toBe(1);
  });

  test("a streamed answer appears as it arrives and keeps one bubble", async () => {
    const harness = mount();
    await settle();
    await harness.emit({ type: "turn_start", turnId: "t1" });
    await harness.emit({ type: "text_delta", turnId: "t1", text: "the answer" });
    expect(harness.stdout.lastFrame).toContain("the answer");
    expect(harness.stdout.lastFrame).toContain("◐");
    await harness.emit({ type: "message", turnId: "t1", role: "assistant", text: "the whole answer" });
    await harness.emit({ type: "turn_end", turnId: "t1", stopReason: "done" });
    expect(harness.stdout.lastFrame).toContain("the whole answer");
    expect(harness.stdout.lastFrame).not.toContain("◐");
  });

  test("escape interrupts a running turn instead of clearing the line", async () => {
    const harness = mount();
    await settle();
    await harness.emit({ type: "turn_start", turnId: "t1" });
    await harness.press(esc);
    expect(harness.agent.calls).toEqual(["abort"]);
  });

  test("a select question is answered by key, not by the label a host happened to draw", async () => {
    const harness = mount();
    await settle();
    await harness.emit({
      type: "question",
      question: {
        questionId: "q1",
        prompt: "Which app?",
        kind: "select",
        options: [
          { key: "akan", label: "akan" },
          { key: "minimal", label: "minimal" },
        ],
      },
    });
    expect(harness.stdout.lastFrame).toContain("Which app?");
    await harness.press(`${esc}[B`);
    await harness.press("\r");
    expect(harness.agent.calls).toEqual(['answer:q1:{"keys":["minimal"]}']);
  });

  test("a multi-select keeps every ticked key, which is what a reconnecting client restores from", async () => {
    const harness = mount();
    await settle();
    await harness.emit({
      type: "question",
      question: {
        questionId: "q1",
        prompt: "Which apps?",
        kind: "select",
        multiSelect: true,
        options: [
          { key: "akan", label: "akan" },
          { key: "minimal", label: "minimal" },
        ],
      },
    });
    await harness.press(" ");
    await harness.press(`${esc}[B`);
    await harness.press(" ");
    await harness.press("\r");
    expect(harness.agent.calls).toEqual(['answer:q1:{"keys":["akan","minimal"]}']);
  });

  test("an approval takes y or n and nothing else", async () => {
    const harness = mount();
    await settle();
    await harness.emit({
      type: "approval",
      request: { approvalId: "a1", toolCallId: "c0", name: "write", summary: "write a.ts", policy: "writes" },
    });
    expect(harness.stdout.lastFrame).toContain("approve? write a.ts");
    await harness.press("q");
    expect(harness.agent.calls).toEqual([]);
    await harness.press("n");
    expect(harness.agent.calls).toEqual(["approve:a1:false"]);
  });

  test("slash commands reach the core rather than the model", async () => {
    const harness = mount();
    await settle();
    await harness.press("/compact keep the plan");
    await harness.press("\r");
    await harness.press("/model deepseek/deepseek-v4-pro");
    await harness.press("\r");
    expect(harness.agent.calls).toEqual(["compact:keep the plan", "setModel:deepseek/deepseek-v4-pro"]);
  });

  test("an unknown slash command answers in the transcript instead of being sent as a prompt", async () => {
    const harness = mount();
    await settle();
    await harness.press("/nope");
    await harness.press("\r");
    expect(harness.agent.calls).toEqual([]);
    expect(harness.stdout.lastFrame).toContain("Unknown command /nope");
  });

  test("the arrows replay what was already sent", async () => {
    const harness = mount();
    await settle();
    await harness.press("first");
    await harness.press("\r");
    await harness.press(`${esc}[A`);
    expect(harness.stdout.lastFrame).toContain("› first");
    await harness.press("\r");
    expect(harness.agent.calls).toEqual(["prompt:first", "prompt:first"]);
  });

  test("a tool call is one row from start to end", async () => {
    const harness = mount();
    await settle();
    const tool = { toolCallId: "c0", name: "read", op: "read" as const, title: "read(a.ts)" };
    await harness.emit({ type: "tool_start", turnId: "t1", tool });
    await harness.emit({ type: "tool_end", turnId: "t1", tool, outcome: "ok", output: "", truncated: false });
    const frame = harness.stdout.lastFrame;
    expect(frame.split("read(a.ts)").length - 1).toBe(1);
    expect(frame).toContain("✓ read(a.ts)");
  });

  /**
   * A paste arrives as one chunk with its newlines inside, and the terminal gives no signal that it was a
   * paste rather than typing. Treating the first newline as enter sends a fragment and types the rest into
   * the next turn.
   */
  test("a pasted block keeps its newlines instead of sending a fragment", async () => {
    const harness = mount();
    await settle();
    await harness.press("fix this:\r  at foo (a.ts:1)\r  at bar (b.ts:2)");
    expect(harness.agent.calls).toEqual([]);
    expect(harness.stdout.lastFrame).toContain("+2 lines");
    await harness.press("\r");
    expect(harness.agent.calls).toEqual(["prompt:fix this:\n  at foo (a.ts:1)\n  at bar (b.ts:2)"]);
  });

  test("a context frame becomes the gauge in the header", async () => {
    const harness = mount();
    await settle();
    await harness.emit({ type: "context", used: 250_000, max: 1_000_000 });
    expect(harness.stdout.lastFrame).toContain("25% ctx");
  });
});
