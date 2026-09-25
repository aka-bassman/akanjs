import { afterEach, beforeAll, describe, expect, test } from "bun:test";
import { EventEmitter } from "node:events";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { PassThrough } from "node:stream";
import type { CodeAgent } from "@akanjs/devkit/codeAgent";
import { akanCodePaths } from "@akanjs/devkit/codeAgent/agent/akanCodePaths";
import type {
  CodeAgentAnswer,
  CodeAgentEvent,
  CodeAgentEventBody,
  CodeAgentMcpStatus,
  CodeAgentSessionInfo,
} from "akanjs/common";
import { CodeTui, type CodeTuiExit } from "./CodeTui";
import { CodeTuiClipboard } from "./CodeTuiClipboard";
import { CodeTuiMouse } from "./CodeTuiMouse";

class FakeStdout extends EventEmitter {
  columns = 90;
  rows = 20;
  /**
   * A terminal, because Ink's cursor arithmetic branches on it.
   *
   * A frame as tall as the terminal is "fullscreen" to Ink: it writes no trailing newline and then positions
   * the cursor as though it had. Only a tty reaches that branch, so a fake without this flag cannot tell the
   * two layouts apart and every caret assertion below would pass either way.
   */
  isTTY = true;
  readonly frames: string[] = [];
  write = (frame: string) => {
    this.frames.push(frame);
    return true;
  };
  /**
   * The last frame that drew something.
   *
   * With a cursor position set, Ink follows a content frame with a cursor-only write, so the literal last
   * frame is a move sequence and nothing else.
   */
  get lastFrame() {
    const csi = new RegExp(`${String.fromCharCode(27)}\\[[0-9;?]*[a-zA-Z]`, "g");
    for (let at = this.frames.length - 1; at >= 0; at -= 1) {
      const text = (this.frames[at] ?? "").replace(csi, "");
      if (text.trim()) return text;
    }
    return "";
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
  effort: "medium",
  name: undefined,
  interaction: { question: "await", approval: "await" },
};

/** A stand-in for the core that records what the host asked of it and replays frames back. */
class FakeAgent {
  readonly calls: string[] = [];
  readonly profile: CodeAgent["profile"];
  canSeeImages = true;
  stored: { id: string; name?: string; opening: string; updatedAt: number; turns: number }[] = [];
  mcp: CodeAgentMcpStatus[] = [];
  readonly workspaceRoot: string;
  #listener: ((event: CodeAgentEvent) => void) | undefined;
  #seq = 0;
  streaming = false;

  constructor(root: string) {
    this.profile = { paths: { root } } as CodeAgent["profile"];
    this.workspaceRoot = root;
  }

  sessions() {
    return this.stored;
  }

  mcpServers() {
    return this.mcp;
  }

  catalogue() {
    return [
      {
        id: "deepseek",
        name: "DeepSeek",
        authorized: true,
        models: [{ id: "deepseek-v4-flash", name: "DeepSeek V4 Flash", contextWindow: 1_000_000, current: true }],
      },
      { id: "anthropic", name: "Anthropic", authorized: false, models: [{ id: "opus", name: "Opus", current: false }] },
    ];
  }

  setName(name: string) {
    this.calls.push(`setName:${name}`);
  }

  efforts() {
    return ["low", "medium", "high"];
  }

  setEffort(effort: string) {
    this.calls.push(`setEffort:${effort}`);
  }

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

  async prompt(message: string, images?: { path: string }[]) {
    const attached = (images ?? []).map((image) => `:${image.path}`).join("");
    this.calls.push(`prompt:${message}${attached}`);
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
const keys = { backspace: String.fromCharCode(127) };
const csi = new RegExp(`${esc}\\[[0-9;?]*[a-zA-Z]`, "g");

/**
 * Where Ink was told to leave the terminal cursor, as a position in the frame it was drawn on.
 *
 * Ink emits the move as "up N from the line after the last one", so the row is only meaningful together with
 * the frame it counts back through — which is why both are read out of the same write.
 */
const caretOf = (stdout: FakeStdout) => {
  const suffix = new RegExp(`(?:${esc}\\[(\\d+)A)?${esc}\\[(\\d+)G${esc}\\[\\?25h`);
  for (let at = stdout.frames.length - 1; at >= 0; at -= 1) {
    const frame = stdout.frames[at] ?? "";
    const match = suffix.exec(frame);
    const text = frame.replace(csi, "");
    if (!match || !text.trim()) continue;
    const lines = text.split("\n");
    return {
      row: (text.endsWith("\n") ? lines.length - 1 : lines.length) - Number(match[1] ?? 0),
      column: Number(match[2] ?? 1) - 1,
      lines,
    };
  }
  return undefined;
};

/** Ink throttles frame writes to `maxFps: 30`, and the host adds its own 34ms frame timer on top. */
const settle = () => Bun.sleep(140);

/**
 * The home half of the config, moved somewhere disposable.
 *
 * `/mcp add` writes to `~/.akan/code/mcp.json` by default — that is the point of it — so without this the
 * suite declares its fixtures as real servers for whoever runs it.
 */
beforeAll(() => {
  const home = mkdtempSync(path.join(tmpdir(), "akan-tui-home-"));
  process.env.AKAN_CODE_HOME = home;
  expect(akanCodePaths.globalMcpFile().startsWith(home)).toBe(true);
});

const running: { tui: CodeTui; done: Promise<CodeTuiExit | undefined> }[] = [];

const mount = (root = "/repo") => {
  const stdout = new FakeStdout();
  const stdin = makeStdin();
  const agent = new FakeAgent(root);
  const tui = new CodeTui(agent as unknown as CodeAgent, {
    stdout: stdout as unknown as NodeJS.WriteStream,
    stdin: stdin as unknown as NodeJS.ReadStream,
  });
  const done = tui.run();
  running.push({ tui, done });
  return {
    agent,
    stdout,
    done,
    tui,
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

  /**
   * The one thing a turn does that the transcript cannot show: a `task` call is one tool row that stays open
   * for minutes, so what moves — how long each child has run and what it has spent — has to be somewhere that
   * does not scroll.
   */
  test("a running sub-agent draws a rail under the prompt and leaves with the turn", async () => {
    const harness = mount();
    await settle();
    const rows = harness.stdout.lastFrame.split("\n").length;
    await harness.emit({
      type: "subagent",
      agents: [
        { id: "c0", kind: "explore", description: "Counting desc strings", startedAt: Date.now(), tokens: 12_400 },
      ],
    });
    expect(harness.stdout.lastFrame).toContain("◯ explore  Counting desc strings");
    expect(harness.stdout.lastFrame).toContain("↓ 12.4k tokens");
    // The rail takes its rows from the transcript rather than adding them, or Ink draws over the rule below.
    expect(harness.stdout.lastFrame.split("\n").length).toBe(rows);
    await harness.emit({ type: "idle" });
    expect(harness.stdout.lastFrame).not.toContain("◯ explore");
  });

  /**
   * With tracking off the wheel scrolls the terminal's own scrollback, and a frame repainted in place puts
   * nothing of the session there — so what slides over it is whatever the shell printed before it started.
   */
  test("the wheel scrolls the transcript, and the terminal is asked for it and released again", async () => {
    const harness = mount();
    await settle();
    expect(harness.stdout.frames.join("")).toContain(CodeTuiMouse.on);
    for (let at = 0; at < 40; at += 1)
      harness.agent.emit({ type: "message", turnId: `t${at}`, role: "assistant", text: `line ${at}` });
    await settle();
    expect(harness.stdout.lastFrame).not.toContain("paused");
    await harness.press("\u001b[<64;10;5M");
    expect(harness.stdout.lastFrame).toContain("paused");
    // The report reaches the prompt as a keystroke unless it is decoded, which is the failure it replaces.
    expect(harness.stdout.lastFrame).not.toContain("64;10;5");
    await harness.press("\u001b[<65;10;5M");
    await harness.press("\u001b[<65;10;5M");
    expect(harness.stdout.lastFrame).not.toContain("paused");
    harness.tui.close();
    expect(harness.stdout.frames.join("")).toContain(CodeTuiMouse.off);
  });

  test("/mcp lists the servers this session reached, and says where they are declared", async () => {
    const harness = mount();
    harness.agent.mcp = [
      { name: "github", transport: "stdio", target: "npx -y server-github", tools: ["mcp__github__search"] },
    ];
    await settle();
    await harness.press("/mcp");
    await harness.press("\r");
    expect(harness.stdout.lastFrame).toContain("github");
    expect(harness.stdout.lastFrame).toContain("1 tool");
  });

  /**
   * The engine binds its tool registry when the session is created, so a server declared now is reachable
   * only through another assembly — which is the session switch the runner already performs.
   */
  test("/mcp add writes the home file and reopens this session to pick it up", async () => {
    const root = mkdtempSync(path.join(tmpdir(), "akan-tui-mcp-"));
    const harness = mount(root);
    harness.agent.stored = [{ id: "s1", opening: "hi", updatedAt: Date.now(), turns: 1 }];
    await settle();
    await harness.press("/mcp add github npx -y server-github");
    await harness.press("\r");
    expect(await harness.done).toEqual({ id: "s1", notice: "added github · npx -y server-github · every repo" });
    // The home file, because a server is an integration with an account and not one checkout's business.
    const file = JSON.parse(readFileSync(akanCodePaths.globalMcpFile(), "utf8")) as {
      mcpServers: Record<string, unknown>;
    };
    expect(file.mcpServers.github).toEqual({ command: "npx", args: ["-y", "server-github"] });
    rmSync(akanCodePaths.globalMcpFile(), { force: true });
    rmSync(root, { recursive: true, force: true });
  });

  /** A server this repo starts for itself belongs to this repo, so the narrower scope has to be reachable. */
  test("/mcp add --local writes the workspace file instead", async () => {
    const root = mkdtempSync(path.join(tmpdir(), "akan-tui-mcp-"));
    const harness = mount(root);
    harness.agent.stored = [{ id: "s1", opening: "hi", updatedAt: Date.now(), turns: 1 }];
    await settle();
    await harness.press("/mcp add --local repobot bun run bot.ts");
    await harness.press("\r");
    expect(await harness.done).toEqual({ id: "s1", notice: "added repobot · bun run bot.ts · this repo" });
    const file = JSON.parse(readFileSync(path.join(root, ".akan", "code", "mcp.json"), "utf8")) as {
      mcpServers: Record<string, unknown>;
    };
    expect(file.mcpServers.repobot).toEqual({ command: "bun", args: ["run", "bot.ts"] });
    expect(existsSync(akanCodePaths.globalMcpFile())).toBe(false);
    rmSync(root, { recursive: true, force: true });
  });

  test("a session with nothing on disk is told a reload has nothing to reopen", async () => {
    const harness = mount();
    await settle();
    await harness.press("/mcp reload");
    await harness.press("\r");
    expect(harness.stdout.lastFrame).toContain("not on disk yet");
  });

  const question = {
    questionId: "q1",
    prompt: "Which database?",
    kind: "select" as const,
    options: [
      { key: "0", label: "Postgres" },
      { key: "1", label: "SQLite", recommended: true },
    ],
    freeText: true,
  };

  /** "You decide" is the most common answer there is, so it should cost one keypress and not a hunt. */
  test("a recommended option is labelled and waiting under the cursor", async () => {
    const harness = mount();
    await settle();
    await harness.emit({ type: "question", question });
    expect(harness.stdout.lastFrame).toContain("SQLite (recommended)");
    await harness.press("\r");
    expect(harness.agent.calls).toEqual(['answer:q1:{"keys":["1"]}']);
  });

  test("a question offering free text grows a choice that opens the prompt", async () => {
    const harness = mount();
    await settle();
    await harness.emit({ type: "question", question });
    expect(harness.stdout.lastFrame).toContain("Something else…");
    // Past SQLite, onto the synthetic entry, which answers nothing and starts typing instead.
    await harness.press("\u001b[B");
    await harness.press("\r");
    expect(harness.agent.calls).toEqual([]);
    expect(harness.stdout.lastFrame).toContain("esc back to the choices");
    await harness.press("mysql, actually");
    await harness.press("\r");
    expect(harness.agent.calls).toEqual(['answer:q1:{"text":"mysql, actually"}']);
  });

  test("escape out of typing goes back to the choices rather than skipping the question", async () => {
    const harness = mount();
    await settle();
    await harness.emit({ type: "question", question });
    await harness.press("\u001b[B");
    await harness.press("\r");
    await harness.press("\u001b");
    expect(harness.agent.calls).toEqual([]);
    expect(harness.stdout.lastFrame).toContain("SQLite (recommended)");
    // The cursor is where it was left — on the choice that opened the prompt — so getting back to an option
    // is the same arrow it took to leave.
    await harness.press("\u001b[A");
    await harness.press("\r");
    expect(harness.agent.calls).toEqual(['answer:q1:{"keys":["1"]}']);
  });

  test("a question with no options is answered in prose", async () => {
    const harness = mount();
    await settle();
    await harness.emit({
      type: "question",
      question: { questionId: "q2", prompt: "Why is it slow?", kind: "text", freeText: true },
    });
    await harness.press("the index is missing");
    await harness.press("\r");
    expect(harness.agent.calls).toEqual(['answer:q2:{"text":"the index is missing"}']);
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

  /**
   * A command's answer opens over the transcript and leaves nothing behind.
   *
   * The conversation is what the model and the person said to each other; a `/help` written into it is a row
   * that rides every later screen, and on a profile that persists, part of what the next session reloads.
   */
  test("an unknown slash command answers in an overlay and leaves the transcript alone", async () => {
    const harness = mount();
    await settle();
    await harness.press("hello there");
    await harness.press("\r");
    await harness.press("/nope");
    await harness.press("\r");
    expect(harness.agent.calls).toEqual(["prompt:hello there"]);
    expect(harness.stdout.lastFrame).toContain("There is no /nope");
    // The transcript is behind it, not scrolled away by it.
    expect(harness.stdout.lastFrame).not.toContain("› hello there");
    await harness.press(esc);
    expect(harness.stdout.lastFrame).toContain("› hello there");
    expect(harness.stdout.lastFrame).not.toContain("There is no /nope");
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
    expect(frame).toContain("⏺ read(a.ts)");
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
    // All three lines are on screen and editable, not folded behind a count.
    expect(harness.stdout.lastFrame).toContain("fix this:");
    expect(harness.stdout.lastFrame).toContain("at foo (a.ts:1)");
    expect(harness.stdout.lastFrame).toContain("at bar (b.ts:2)");
    await harness.press("\r");
    expect(harness.agent.calls).toEqual(["prompt:fix this:\n  at foo (a.ts:1)\n  at bar (b.ts:2)"]);
  });

  test("typing a slash opens a menu of commands above the input", async () => {
    const harness = mount();
    await settle();
    await harness.press("/");
    expect(harness.stdout.lastFrame).toContain("/compact");
    expect(harness.stdout.lastFrame).toContain("/model");
    await harness.press("mo");
    const frame = harness.stdout.lastFrame;
    expect(frame).toContain("/model");
    expect(frame).not.toContain("/compact");
  });

  test("tab completes the highlighted command, with the space its argument needs", async () => {
    const harness = mount();
    await settle();
    await harness.press("/mo");
    await harness.press("\t");
    const frame = harness.stdout.lastFrame;
    expect(frame).toContain("› /model");
    // The space is typed too, which closes the menu — the caret is now in the argument.
    expect(frame).not.toContain("switch model");
    expect(harness.agent.calls).toEqual([]);
  });

  test("the arrows walk the menu while it is open, not the history", async () => {
    const harness = mount();
    await settle();
    await harness.press("/");
    await harness.press(`${esc}[B`);
    await harness.press("\t");
    // The second entry, because the menu took the arrow.
    expect(harness.stdout.lastFrame).toContain("› /tools");
  });

  /** The byte a bare line feed carries is the byte ^j sends, and the one a terminal keybinding for shift+enter
   * is usually written to send. */
  test("a line feed opens a second line and enter still sends the whole buffer", async () => {
    const harness = mount();
    await settle();
    await harness.press("first");
    await harness.press(String.fromCharCode(10));
    await harness.press("second");
    const frame = harness.stdout.lastFrame;
    expect(frame).toContain("› first");
    expect(frame).toContain("second");
    await harness.press("\r");
    expect(harness.agent.calls).toEqual(["prompt:first\nsecond"]);
  });

  /**
   * The two spellings of the same key binding, which arrive at the handler as different shapes.
   *
   * `\` + return is one event carrying both characters, because the backslash stops Ink parsing it as a
   * return; `\` + ESC + return is two, the backslash typed and then a `meta+return`. Either way the backslash
   * is the shell's line continuation and not something the person typed.
   */
  test("a shift+enter binding breaks the line without leaving its backslash behind", async () => {
    for (const ending of [String.fromCharCode(13), String.fromCharCode(10), `${esc}${String.fromCharCode(13)}`]) {
      const harness = mount();
      await settle();
      await harness.press("first");
      await harness.press(`\\${ending}`);
      await harness.press("second");
      expect(harness.stdout.lastFrame).not.toContain("\\");
      await harness.press("\r");
      expect(harness.agent.calls).toEqual(["prompt:first\nsecond"]);
    }
  });

  /** One backslash is the binding's; a second is the one that was typed, and it stays. */
  test("a backslash the user typed survives the line break after it", async () => {
    const harness = mount();
    await settle();
    await harness.press("a\\");
    await harness.press(`\\${String.fromCharCode(13)}`);
    await harness.press("b");
    await harness.press("\r");
    expect(harness.agent.calls).toEqual(["prompt:a\\\nb"]);
  });

  test("the arrows move inside a multi-line prompt before they reach history", async () => {
    const harness = mount();
    await settle();
    await harness.press("sent");
    await harness.press("\r");
    await harness.press("one");
    await harness.press(String.fromCharCode(10));
    await harness.press("two");
    // Up moves onto the first line of the prompt; only a second up, from its top, recalls history.
    await harness.press(`${esc}[A`);
    expect(harness.stdout.lastFrame).toContain("one");
    await harness.press(`${esc}[A`);
    expect(harness.stdout.lastFrame).toContain("› sent");
  });

  /**
   * The caret has to land on the row the prompt is drawn on.
   *
   * It is read back out of the escape sequence rather than asserted as a number: the position is composed from
   * the transcript height, the menu, the prompt's own rule and the row inside the buffer, and any one of those
   * changing silently is exactly the bug — the cursor drawn one row above the text, where an IME then paints
   * the syllable being composed.
   */
  test("the terminal cursor lands on the prompt row, after what has been typed", async () => {
    const harness = mount();
    await settle();
    await harness.press("hello");
    const caret = caretOf(harness.stdout);
    expect(caret).toBeDefined();
    expect(caret?.lines[caret.row]).toContain("› hello");
    expect(caret?.column).toBe("› hello".length);
  });

  test("the prompt sits between two rules", async () => {
    const harness = mount();
    await settle();
    // Top and bottom, and nothing down the sides — the prompt is as wide as the screen.
    expect(harness.stdout.lastFrame.split("─").length - 1).toBeGreaterThan(2);
    expect(harness.stdout.lastFrame).not.toContain("│");
  });

  /** Enter on a command that is fully typed used to complete it to itself, so it took a space and a second enter. */
  test("enter runs the highlighted command, whether or not it was typed out in full", async () => {
    const harness = mount();
    await settle();
    await harness.press("/help");
    await harness.press("\r");
    expect(harness.stdout.lastFrame).toContain("list these commands and the keys");
    expect(harness.agent.calls).toEqual([]);
    await harness.press(esc);
    await harness.press("/ab");
    await harness.press("\r");
    expect(harness.agent.calls).toEqual(["abort"]);
  });

  test("reasoning is folded to one line until it is asked for", async () => {
    const harness = mount();
    await settle();
    await harness.emit({ type: "turn_start", turnId: "t1" });
    await harness.emit({ type: "thinking_delta", turnId: "t1", text: "the user said hi\nkeep it short" });
    expect(harness.stdout.lastFrame).toContain("thinking · 2 lines");
    expect(harness.stdout.lastFrame).not.toContain("keep it short");
    await harness.press("/thinking");
    await harness.press("\r");
    expect(harness.stdout.lastFrame).toContain("keep it short");
  });

  test("ZZ down walks history back", async () => {
    const log: string[] = [];
    const harness = mount();
    await settle();
    await harness.press("one");
    await harness.press("\r");
    await harness.press("two");
    await harness.press("\r");
    await harness.press(`${esc}[A`);
    log.push(JSON.stringify(harness.stdout.lastFrame.split("\n").filter((l) => l.includes("›"))));
    await harness.press(`${esc}[A`);
    log.push(JSON.stringify(harness.stdout.lastFrame.split("\n").filter((l) => l.includes("›"))));
    await harness.press(`${esc}[B`);
    log.push(JSON.stringify(harness.stdout.lastFrame.split("\n").filter((l) => l.includes("›"))));
    await harness.press(`${esc}[B`);
    log.push(JSON.stringify(harness.stdout.lastFrame.split("\n").filter((l) => l.includes("›"))));
    await Bun.write("/tmp/hist.json", log.join("\n"));
  });

  /** The declared window stays beside the share used: a wrong but self-consistent descriptor passes every
   * programmatic check there is, and only a person reading the number catches it. */
  test("model, window, profile and effort ride the prompt's lower rule", async () => {
    const harness = mount();
    await settle();
    await harness.emit({ type: "context", used: 250_000, max: 1_000_000 });
    expect(harness.stdout.lastFrame).toContain("DeepSeek V4 Flash · 25% of 1000k · local · medium");
    // And the session is on the upper one.
    expect(harness.stdout.lastFrame).toContain("s1 ─");
  });

  test("/effort lists what the model offers when it is given nothing it knows", async () => {
    const harness = mount();
    await settle();
    await harness.press("/effort");
    await harness.press("\r");
    expect(harness.stdout.lastFrame).toContain("low · medium · high");
    expect(harness.agent.calls).toEqual([]);
    await harness.press(esc);
    await harness.press("/effort high");
    await harness.press("\r");
    expect(harness.agent.calls).toEqual(["setEffort:high"]);
  });

  test("a session takes a name from what it was first asked, and /name replaces it", async () => {
    const harness = mount();
    await settle();
    await harness.press("/name refactor the store layer");
    await harness.press("\r");
    expect(harness.agent.calls).toEqual(["setName:refactor the store layer"]);
    // The engine answers with a fresh session frame; the host draws whatever that frame says.
    await harness.emit({ type: "session", info: { ...info, name: "refactor-the-store-layer" } });
    expect(harness.stdout.lastFrame).toContain("refactor-the-store-layer");
  });

  /**
   * Left at the start of the prompt is otherwise a dead key, and resuming is the one thing a session list is
   * opened for — so the list is a picker, not a report.
   */
  test("left at the start lists stored sessions, and enter leaves for the one chosen", async () => {
    const harness = mount();
    harness.agent.stored = [
      { id: "s1", name: "current-one", opening: "fix the gateway", updatedAt: Date.now(), turns: 2 },
      { id: "s2", name: "older-one", opening: "add a comment module", updatedAt: Date.now() - 7_200_000, turns: 9 },
    ];
    await settle();
    await harness.press(`${esc}[D`);
    expect(harness.stdout.lastFrame).toContain("older-one");
    expect(harness.stdout.lastFrame).toContain("add a comment module");
    expect(harness.stdout.lastFrame).toContain("2h ago");
    // s1 is the session already open, so the cursor starts there and enter on it just closes the list.
    await harness.press(`${esc}[B`);
    await harness.press("\r");
    expect((await harness.done)?.id).toBe("s2");
  });

  /** The terminal pastes text on its own; the only thing it cannot hand over is bytes, so that is all ^v does. */
  test("ctrl+v says so rather than attaching when the model cannot read images", async () => {
    const harness = mount();
    harness.agent.canSeeImages = false;
    await settle();
    await harness.press(String.fromCharCode(22));
    const frame = harness.stdout.lastFrame;
    expect(frame).toContain("declares deepseek/deepseek-v4-flash text-only");
    // A refusal with no way to disagree is as bad a guess as sending the picture anyway.
    expect(frame).toContain("modelOverrides");
  });

  /**
   * The keystroke a mac user reaches for, and the whole of what arrives when they press it.
   *
   * `cmd+v` is handled by the terminal, which writes the clipboard's **text** to stdin — and a screenshot has
   * none, so a terminal in bracketed-paste mode sends the two markers with nothing between them. An empty
   * paste is therefore not nothing: it is a paste that had a picture in it.
   */
  test("an empty bracketed paste attaches the picture the clipboard was holding", async () => {
    const harness = mount();
    await settle();
    const file = path.join(tmpdir(), "clipboard.png");
    await Bun.write(file, new Uint8Array([0x89, 0x50, 0x4e, 0x47]));
    const had = { has: CodeTuiClipboard.has, image: CodeTuiClipboard.image };
    CodeTuiClipboard.has = () => true;
    CodeTuiClipboard.image = () => Promise.resolve(file);
    try {
      await harness.press(`${esc}[200~${esc}[201~`);
      await settle();
      expect(harness.stdout.lastFrame).toContain("[image #1]");
    } finally {
      Object.assign(CodeTuiClipboard, had);
    }
  });

  /** An empty clipboard asks for nothing, so an empty paste from one has to leave the prompt alone. */
  test("an empty bracketed paste with an empty clipboard does nothing at all", async () => {
    const harness = mount();
    await settle();
    const had = CodeTuiClipboard.has;
    CodeTuiClipboard.has = () => false;
    try {
      await harness.press(`${esc}[200~${esc}[201~`);
      await settle();
      expect(harness.stdout.lastFrame).toContain("ask for something");
      expect(harness.stdout.lastFrame).not.toContain("[image");
    } finally {
      CodeTuiClipboard.has = had;
    }
  });

  /** Between the markers is text nobody typed, so the newlines in it are content and not the send key. */
  test("a bracketed paste keeps its newlines instead of sending the prompt", async () => {
    const harness = mount();
    await settle();
    await harness.press(`${esc}[200~fix this:\rat foo (a.ts:1)\r${esc}[201~`);
    expect(harness.agent.calls).toEqual([]);
    expect(harness.stdout.lastFrame).toContain("at foo (a.ts:1)");
    await harness.press("\r");
    expect(harness.agent.calls).toEqual(["prompt:fix this:\nat foo (a.ts:1)"]);
  });

  /** A paste that happens to end in a newline is still a paste, and running it as a command is not editing. */
  test("a bracketed paste ending in a newline runs nothing", async () => {
    const harness = mount();
    await settle();
    await harness.press(`${esc}[200~/help\r${esc}[201~`);
    const frame = harness.stdout.lastFrame;
    expect(frame).toContain("/help");
    expect(frame).not.toContain("list these commands");
    expect(frame).not.toContain("200~");
  });

  /**
   * The only way an image reaches a terminal app: a paste of the file's **path**. A macOS clipboard
   * screenshot leaves one under `…/TemporaryItems/…`, and `cmd+v` hands that path over — which is why the
   * key appears to attach a picture in an app that can never receive one.
   */
  test("a pasted image path becomes a marker in the prompt, and the marker is the attachment", async () => {
    const harness = mount();
    await settle();
    const file = path.join(tmpdir(), "Screenshot at 20.11.02.png");
    await Bun.write(file, new Uint8Array([0x89, 0x50, 0x4e, 0x47]));
    // Escaped spaces, the way a terminal writes a dragged or pasted path.
    await harness.press(file.replace(/ /g, "\\ "));
    expect(harness.stdout.lastFrame).toContain("[image #1]");
    expect(harness.stdout.lastFrame).not.toContain("Screenshot at");
    await harness.press("look at this");
    await harness.press("\r");
    expect(harness.agent.calls).toEqual([`prompt:look at this:${file}`]);
    // The bubble says an image went with it, and the engine's own echo of the same words stays one bubble.
    expect(harness.stdout.lastFrame).toContain("⧉ 1 image");
    await harness.emit({ type: "message", turnId: "t1", role: "user", text: "look at this" });
    expect(harness.stdout.lastFrame.split("› look at this").length - 1).toBe(1);
  });

  test("deleting the marker before sending un-attaches the image", async () => {
    const harness = mount();
    await settle();
    const file = path.join(tmpdir(), "akan-paste.png");
    await Bun.write(file, new Uint8Array([0x89, 0x50, 0x4e, 0x47]));
    await harness.press(file);
    await harness.press("never mind");
    // Back over "never mind" and the marker: nothing is left to attach.
    for (let at = 0; at < "never mind".length + "[image #1] ".length; at += 1) await harness.press(keys.backspace);
    await harness.press("just text");
    await harness.press("\r");
    expect(harness.agent.calls).toEqual(["prompt:just text"]);
  });

  test("an @ token completes a file in the repo", async () => {
    const harness = mount(`${import.meta.dir}/../../../..`);
    await settle();
    await harness.press("read @codeTuiFiles");
    await settle();
    const frame = harness.stdout.lastFrame;
    expect(frame).toContain("@pkgs/@akanjs/cli/code/CodeTuiFiles.ts");
    await harness.press("\t");
    expect(harness.stdout.lastFrame).toContain("› read @pkgs/@akanjs/cli/code/CodeTuiFiles.ts");
  });

  test("the banner names the session at the top and survives what clears the conversation", async () => {
    const harness = mount();
    await settle();
    expect(harness.stdout.lastFrame).toContain("Akan — write one line, deploy every stack");
    await harness.press("remember this");
    await harness.press("\r");
    expect(harness.stdout.lastFrame).toContain("› remember this");
    await harness.press("/clear");
    await harness.press("\r");
    expect(harness.stdout.lastFrame).not.toContain("› remember this");
    expect(harness.stdout.lastFrame).toContain("Akan — write one line, deploy every stack");
    // The screen is not the model's memory, and a host that clears one says which it cleared.
    expect(harness.stdout.lastFrame).toContain("the model still remembers");
  });

  /**
   * A recalled entry that wraps used to swallow the arrows moving inside itself, and since the text does not
   * change on those moves, down read as a dead key.
   */
  test("down walks back through history, whatever the recalled entry's height", async () => {
    const harness = mount();
    await settle();
    await harness.press(`one ${"long ".repeat(30)}`);
    await harness.press("\r");
    await harness.press("two");
    await harness.press("\r");
    await harness.press(`${esc}[A`);
    await harness.press(`${esc}[A`);
    expect(harness.stdout.lastFrame).toContain("one long");
    await harness.press(`${esc}[B`);
    expect(harness.stdout.lastFrame).toContain("› two");
    await harness.press(`${esc}[B`);
    expect(harness.stdout.lastFrame).toContain("ask for something");
  });
});
