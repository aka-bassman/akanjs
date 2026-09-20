import type { CodeAgentAnswer, CodeAgentApprovalRequest, CodeAgentQuestion } from "akanjs/common";
import { render } from "ink";
import { CodeTuiApp, type CodeTuiOption, type CodeTuiSnapshot } from "../ui/CodeTuiApp";
import type { CodeAgent } from "./CodeAgent";
import { CodeTranscript } from "./CodeTranscript";
import { CodeTuiLines } from "./CodeTuiLines";

/**
 * The terminal host: one agent, drawn from the akan wire and nothing else.
 *
 * It holds no engine type. Everything on screen comes from {@link CodeTranscript}, which reads the contract —
 * so a field the contract carries and this cannot draw is a hole in the contract, and a field this needs that
 * the contract lacks is the same hole seen from the other side. That is the whole reason the printer, this,
 * and the web host are three thin readers of one fold instead of three renderers of the engine.
 *
 * Ink repaints a whole frame per render and a streaming answer arrives token by token, so nothing here renders
 * per event: events land in the fold and a frame timer publishes.
 */
export class CodeTui {
  /** Ink throttles its own writes to `maxFps: 30`, so notifying faster only buys extra reconciles. */
  static readonly frameMs = 34;
  static readonly noticeMs = 4_000;
  /** The input row plus the hint row. */
  static readonly chromeRows = 2;
  /** The transcript pane's border pair, its header, and one line of conversation. */
  static readonly minBodyRows = 4;

  readonly #agent: CodeAgent;
  readonly #transcript = new CodeTranscript();
  readonly #listeners = new Set<() => void>();
  readonly #history: string[] = [];
  readonly #instance: ReturnType<typeof render>;
  readonly #stdout: NodeJS.WriteStream;
  #input = "";
  #historyAt = -1;
  /** Index of the last visible row, or null while following the tail. */
  #anchor: number | null = null;
  #selected = 0;
  #checked: string[] = [];
  #notice = "";
  #noticeTimer: ReturnType<typeof setTimeout> | null = null;
  #frameTimer: ReturnType<typeof setTimeout> | null = null;
  #cached: CodeTuiSnapshot | null = null;
  #unsubscribe: (() => void) | undefined;
  #exiting = false;

  constructor(agent: CodeAgent, streams: { stdout?: NodeJS.WriteStream; stdin?: NodeJS.ReadStream } = {}) {
    this.#agent = agent;
    this.#stdout = streams.stdout ?? process.stdout;
    this.#stdout.on("resize", this.#onResize);
    this.#instance = render(
      <CodeTuiApp
        actions={{
          subscribe: this.#subscribe,
          snapshot: this.#snapshot,
          type: this.#type,
          backspace: this.#backspace,
          submit: this.#submit,
          historyPrev: this.#historyPrev,
          historyNext: this.#historyNext,
          scroll: this.#scroll,
          move: this.#move,
          toggle: this.#toggle,
          answerConfirm: this.#answerConfirm,
          cancel: this.#cancel,
          interrupt: this.#interrupt,
        }}
      />,
      // Ink's console patch replaces the console methods themselves, which is the only interception that
      // catches Bun — its `console.log` writes to fd 1 natively and never reaches `process.stdout.write`.
      // Without it, one engine log lands in the middle of a frame and the screen is corrupt until a resize.
      { patchConsole: true, ...streams },
    );
  }

  async run(seed?: string) {
    this.#unsubscribe = this.#agent.on((event) => {
      this.#transcript.apply(event);
      this.#scheduleFrame();
    });
    this.#agent.announce();
    if (seed?.trim()) {
      this.#transcript.echo(seed.trim());
      this.#renderNow();
      void this.#agent.prompt(seed.trim()).catch((error: unknown) => this.#transcript.note("error", String(error)));
    }
    await this.#instance.waitUntilExit();
    this.#close();
  }

  #close() {
    if (this.#frameTimer) clearTimeout(this.#frameTimer);
    if (this.#noticeTimer) clearTimeout(this.#noticeTimer);
    this.#frameTimer = null;
    this.#noticeTimer = null;
    this.#stdout.off("resize", this.#onResize);
    this.#unsubscribe?.();
  }

  #onResize = () => this.#renderNow();

  #subscribe = (listener: () => void) => {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  };

  #scheduleFrame() {
    if (this.#frameTimer) return;
    this.#frameTimer = setTimeout(() => {
      this.#frameTimer = null;
      this.#renderNow();
    }, CodeTui.frameMs);
  }

  #renderNow() {
    this.#cached = null;
    for (const listener of this.#listeners) listener();
  }

  #snapshot = (): CodeTuiSnapshot => {
    if (this.#cached) return this.#cached;
    const columns = Math.max(40, this.#stdout.columns || 80);
    const terminalRows = Math.max(10, this.#stdout.rows || 24);
    const question = this.#transcript.question;
    const approval = this.#transcript.approval;
    const all = CodeTui.#optionsOf(question);
    const { first, shown, bodyHeight } = CodeTui.layout(terminalRows, all.length, this.#selected);
    const options = all.slice(first, first + shown);
    // The pane's own border pair and its header row are not transcript rows.
    const paneRows = Math.max(1, bodyHeight - 3);
    const lines = CodeTuiLines.of(this.#transcript.parts, columns - 4);
    const end = this.#anchor === null ? lines.length : Math.min(lines.length, Math.max(paneRows, this.#anchor));
    const start = Math.max(0, end - paneRows);
    const mode = CodeTui.#modeOf(question, approval);
    const rows = this.#input.split("\n");
    this.#cached = {
      header: this.#transcript.headline,
      headerDetail: this.#headerDetail(),
      lines: lines.slice(start, end),
      above: start,
      below: lines.length - end,
      following: this.#anchor === null,
      status: this.#status(),
      mode,
      input: rows.at(-1) ?? "",
      inputExtra: rows.length - 1,
      placeholder: this.#transcript.streaming ? "type to steer, esc to interrupt" : "ask for something, / for commands",
      prompt: CodeTui.#promptOf(question, approval),
      options,
      selected: this.#selected - first,
      checked: this.#checked,
      multiSelect: !!question?.multiSelect,
      notice: this.#notice,
      hint: CodeTui.#hintOf(mode, !!question?.multiSelect),
      columns,
      terminalRows,
      bodyHeight,
    };
    return this.#cached;
  };

  /**
   * How the rows are divided, given a terminal height and how many choices are on offer.
   *
   * A long question on a short terminal is the case that forces the arithmetic to be exact: Ink does not clip
   * an overflowing column, it overwrites, so the prompt ends up printed through its own first option. The
   * option list is windowed around the cursor rather than the pane being squeezed past its floor.
   */
  static layout(terminalRows: number, optionCount: number, selected: number) {
    const shown = optionCount
      ? Math.max(1, Math.min(optionCount, terminalRows - CodeTui.minBodyRows - CodeTui.chromeRows))
      : 0;
    const first = Math.max(0, Math.min(selected - Math.floor(shown / 2), optionCount - shown));
    const askRows = shown ? 1 + shown : 1;
    const bodyHeight = Math.max(CodeTui.minBodyRows, terminalRows - askRows - CodeTui.chromeRows + 1);
    return { first, shown, askRows, bodyHeight };
  }

  #headerDetail() {
    const parts: string[] = [];
    const context = this.#transcript.context;
    if (context)
      parts.push(
        context.max
          ? `${Math.round((context.used / context.max) * 100)}% ctx (${Math.round(context.used / 1000)}k)`
          : `${Math.round(context.used / 1000)}k ctx`,
      );
    const queue = this.#transcript.queue;
    if (queue.steering || queue.followUp) parts.push(`queued ${queue.steering + queue.followUp}`);
    if (this.#transcript.compacting) parts.push("compacting");
    return parts.join(" · ");
  }

  #status() {
    if (this.#transcript.compacting) return "compacting";
    return this.#transcript.streaming ? "working" : "";
  }

  static #modeOf(
    question: CodeAgentQuestion | undefined,
    approval: CodeAgentApprovalRequest | undefined,
  ): CodeTuiSnapshot["mode"] {
    if (approval) return "confirm";
    if (!question) return "input";
    if (question.kind === "confirm") return "confirm";
    if (question.kind === "select" && question.options?.length) return "select";
    return "input";
  }

  static #optionsOf(question: CodeAgentQuestion | undefined): CodeTuiOption[] {
    return (question?.options ?? []).map((option) => ({
      key: option.key,
      label: option.label,
      ...(option.detail ? { detail: option.detail } : {}),
    }));
  }

  static #promptOf(question: CodeAgentQuestion | undefined, approval: CodeAgentApprovalRequest | undefined) {
    if (approval) return `approve? ${approval.summary}  [y/n]`;
    return question ? `? ${question.prompt}` : "";
  }

  static #hintOf(mode: CodeTuiSnapshot["mode"], multiSelect: boolean) {
    if (mode === "confirm") return "y yes · n no · esc no";
    if (mode === "select")
      return `↑↓ choose${multiSelect ? " · space toggle" : ""} · enter answer · esc skip · pgup/pgdn scroll`;
    return "enter send · ↑↓ history · esc interrupt · pgup/pgdn scroll · ^c quit · /help";
  }

  /**
   * A keystroke, or a whole paste — the terminal hands both to the same handler as one chunk.
   *
   * Its newlines are kept in the prompt rather than read as an enter nobody pressed: a pasted stack trace or
   * snippet is the common reason to paste at all, and submitting on the first of its line breaks would send a
   * fragment and leave the rest typed into the next turn.
   */
  #type = (text: string) => {
    this.#input += text.replace(/\r\n?/g, "\n");
    this.#renderNow();
  };

  #backspace = () => {
    this.#input = this.#input.slice(0, -1);
    this.#renderNow();
  };

  #historyPrev = () => {
    if (!this.#history.length) return;
    this.#historyAt = this.#historyAt < 0 ? this.#history.length - 1 : Math.max(0, this.#historyAt - 1);
    this.#input = this.#history[this.#historyAt] ?? "";
    this.#renderNow();
  };

  #historyNext = () => {
    if (this.#historyAt < 0) return;
    this.#historyAt += 1;
    if (this.#historyAt >= this.#history.length) {
      this.#historyAt = -1;
      this.#input = "";
    } else this.#input = this.#history[this.#historyAt] ?? "";
    this.#renderNow();
  };

  #scroll = (delta: number) => {
    const snapshot = this.#snapshot();
    const total = snapshot.above + snapshot.lines.length + snapshot.below;
    const rows = Math.max(1, snapshot.lines.length);
    if (total <= rows) return;
    const end = this.#anchor === null ? total : this.#anchor;
    const next = Math.min(total, Math.max(rows, end + Math.trunc(delta)));
    this.#anchor = next >= total ? null : next;
    this.#renderNow();
  };

  #move = (delta: number) => {
    const count = this.#snapshot().options.length;
    if (!count) return;
    this.#selected = (this.#selected + delta + count) % count;
    this.#renderNow();
  };

  #toggle = () => {
    const option = this.#snapshot().options[this.#selected];
    if (!option) return;
    this.#checked = this.#checked.includes(option.key)
      ? this.#checked.filter((key) => key !== option.key)
      : [...this.#checked, option.key];
    this.#renderNow();
  };

  #answerConfirm = (value: boolean) => {
    const approval = this.#transcript.approval;
    if (approval) {
      void this.#agent.approve(approval.approvalId, value);
      return;
    }
    const question = this.#transcript.question;
    if (question) void this.#answer(question.questionId, { text: value ? "yes" : "no" });
  };

  #cancel = () => {
    const approval = this.#transcript.approval;
    if (approval) return void this.#agent.approve(approval.approvalId, false);
    const question = this.#transcript.question;
    if (question) return void this.#answer(question.questionId, {});
    if (this.#transcript.streaming) return void this.#agent.abort();
    if (this.#input) {
      this.#input = "";
      this.#renderNow();
    }
  };

  /** Ctrl+C stops the turn first and quits second, so one reflex never costs an unfinished answer. */
  #interrupt = () => {
    if (this.#transcript.streaming) {
      void this.#agent.abort();
      this.#say("interrupted — ^c again to quit");
      return;
    }
    this.#quit();
  };

  /** Unmounts without going through a key, so a test does not leave Ink attached to a fake terminal. */
  close() {
    this.#quit();
  }

  #quit() {
    if (this.#exiting) return;
    this.#exiting = true;
    this.#instance.unmount();
  }

  #submit = () => {
    const question = this.#transcript.question;
    if (question) return void this.#answerCurrent(question.questionId);
    const text = this.#input.trim();
    if (!text) return;
    this.#input = "";
    this.#historyAt = -1;
    this.#history.push(text);
    if (text.startsWith("/")) return this.#command(text);
    this.#transcript.echo(text);
    this.#renderNow();
    void this.#agent.prompt(text).catch((error: unknown) => this.#transcript.note("error", String(error)));
  };

  #answerCurrent(questionId: string) {
    const snapshot = this.#snapshot();
    const answer: CodeAgentAnswer = snapshot.options.length
      ? { keys: snapshot.multiSelect ? this.#checked : [snapshot.options[this.#selected]?.key ?? ""] }
      : { text: this.#input.trim() };
    this.#input = "";
    void this.#answer(questionId, answer);
  }

  async #answer(questionId: string, answer: CodeAgentAnswer) {
    this.#selected = 0;
    this.#checked = [];
    this.#renderNow();
    await this.#agent.answer(questionId, answer);
  }

  #command(line: string) {
    const [name, ...rest] = line.slice(1).split(" ");
    const argument = rest.join(" ").trim();
    switch (name) {
      case "help":
        return this.#note(CodeTui.help);
      case "quit":
      case "exit":
        return this.#quit();
      case "abort":
        return void this.#agent.abort();
      case "clear":
        this.#anchor = null;
        return this.#note(
          "The screen scrolls; the conversation is unchanged. /compact shortens what the model carries.",
        );
      case "compact":
        return void this.#agent
          .compact(argument || undefined)
          .catch((error: unknown) => this.#transcript.note("error", String(error)));
      case "tools":
        return this.#note(
          `${this.#transcript.info?.tools.length ?? 0} tools: ${(this.#transcript.info?.tools ?? []).join(", ")}`,
        );
      case "model":
        return this.#setModel(argument);
      default:
        return this.#note(`Unknown command /${name}. ${CodeTui.help}`);
    }
  }

  #setModel(argument: string) {
    const [provider, ...rest] = argument.split("/");
    if (!provider || !rest.length)
      return this.#note("Usage: /model <provider>/<id>, e.g. /model deepseek/deepseek-v4-pro");
    void this.#agent
      .setModel({ provider, id: rest.join("/") })
      .catch((error: unknown) => this.#transcript.note("error", String(error)));
  }

  static readonly help =
    "/compact [notes] · /model <provider>/<id> · /tools · /abort · /clear · /quit. Keys: enter send, ↑↓ history, esc interrupt, pgup/pgdn scroll, ^c quit.";

  #note(text: string) {
    this.#transcript.note("info", text);
    this.#renderNow();
  }

  #say(text: string) {
    this.#notice = text;
    if (this.#noticeTimer) clearTimeout(this.#noticeTimer);
    this.#noticeTimer = setTimeout(() => {
      this.#notice = "";
      this.#renderNow();
    }, CodeTui.noticeMs);
    this.#renderNow();
  }
}
