import type { CodeAgent, CodeSessionEntry } from "@akanjs/devkit/codeAgent";
import { SubagentPool } from "@akanjs/devkit/codeAgent/agent/SubagentPool";
import { McpServerConfig } from "@akanjs/devkit/codeAgent/tools/McpServerConfig";
import { McpSignIn } from "@akanjs/devkit/codeAgent/tools/McpSignIn";
import { McpTokenStore } from "@akanjs/devkit/codeAgent/tools/McpTokenStore";
import {
  type CodeAgentAnswer,
  type CodeAgentApprovalRequest,
  type CodeAgentEffort,
  type CodeAgentQuestion,
  CodeTranscript,
  codeAgentClip,
} from "akanjs/common";
import { render } from "ink";
import { openBrowser } from "../openBrowser";
import {
  CodeTuiApp,
  type CodeTuiEditKey,
  type CodeTuiOption,
  type CodeTuiSnapshot,
  promptMarkWidth,
} from "../ui/CodeTuiApp";
import { CodeTuiAgents } from "./CodeTuiAgents";
import { CodeTuiClipboard } from "./CodeTuiClipboard";
import { CodeTuiCommands } from "./CodeTuiCommands";
import { CodeTuiEditor } from "./CodeTuiEditor";
import { CodeTuiFiles } from "./CodeTuiFiles";
import { type CodeTuiLine, CodeTuiLines, type CodeTuiRow, type CodeTuiSpan } from "./CodeTuiLines";
import { CodeTuiMarkdown } from "./CodeTuiMarkdown";
import { CodeTuiMcp } from "./CodeTuiMcp";
import { CodeTuiModels } from "./CodeTuiModels";
import { CodeTuiMouse } from "./CodeTuiMouse";
import { CodeTuiParts } from "./CodeTuiParts";

export interface CodeTuiOptions {
  /** Draw the model's reasoning in full. Folded to one line otherwise, and `/thinking` flips it either way. */
  thinking?: boolean;
  /** What the session this one replaced wanted said here — see {@link CodeTuiExit}. */
  notice?: string;
  stdout?: NodeJS.WriteStream;
  stdin?: NodeJS.ReadStream;
}

/**
 * The session to open instead of this one, and the one line it should open with.
 *
 * Switching sessions tears the host down and builds another, so anything the leaving session wanted to say
 * has nowhere to be printed — the next frame clears the terminal. It travels with the id instead.
 */
export interface CodeTuiExit {
  id: string;
  notice?: string;
}

/** A slash command's answer, held open until it is dismissed instead of being written into the conversation. */
interface CodeTuiOverlay {
  title: string;
  text: string;
}

/**
 * The menu above the prompt, and the range of the buffer it completes.
 *
 * Commands and file mentions share it because they are the same gesture — a token under the caret, a list of
 * what it could become — and differ only in what enter means: a command runs, a path is inserted.
 */
interface CodeTuiMenu {
  kind: "command" | "file";
  from: number;
  to: number;
  options: CodeTuiOption[];
}

/** One of the two blocks that can occupy the bottom of the screen: the prompt, or a question. */
interface CodeTuiAskBlock {
  rows: number;
  /** Rows the block draws above the prompt's first line, which is what the caret's own row is counted from. */
  above: number;
  selected: number;
  /** Where the caret sits inside the block, when the block is one that has a caret. */
  caret: { row: number; col: number } | undefined;
  snapshot: Pick<CodeTuiSnapshot, "input" | "menu" | "menuSelected" | "options">;
}

/**
 * The terminal host: one agent, drawn from the akan wire and nothing else.
 *
 * It holds no engine type. Everything on screen comes from {@link CodeTranscript}, which reads the contract —
 * so a field the contract carries and this cannot draw is a hole in the contract, and a field this needs that
 * the contract lacks is the same hole from the other side. That is why the printer, this, and the web host are
 * three thin readers of one fold rather than three renderers of the engine.
 *
 * Ink repaints a whole frame per render and a streaming answer arrives token by token, so nothing here renders
 * per event: events land in the fold and a frame timer publishes.
 */
export class CodeTui {
  /** Ink throttles its own writes to `maxFps: 30`, so notifying faster only buys extra reconciles. */
  static readonly frameMs = 34;
  /** How often the clipboard is asked whether it holds a picture. The check is a flag, not a read. */
  static readonly clipboardMs = 2_000;
  static readonly noticeMs = 4_000;
  /** The hint row under the input. */
  static readonly chromeRows = 1;
  /** The rule above the prompt box, which the caret's row is measured from, and the matching one below it. */
  static readonly promptRuleRows = 1;
  /** The pane's header plus one line of conversation. */
  static readonly minBodyRows = 3;
  /** How tall the prompt may grow before it scrolls internally rather than eating the transcript. */
  static readonly maxInputRows = 8;
  /** What the session calls itself on the first screen. */
  static readonly title = "Akan — write one line, deploy every stack";
  /** How an attachment appears in the prompt, and the only place it can be removed from. */
  static readonly imageMark = /\[image #(\d+)] ?/g;
  /**
   * The extra choice a question with `freeText` grows, under the options the model wrote.
   *
   * Host-only: choosing it opens the prompt rather than answering, so the key never reaches the core. A list
   * of options is the model's guess at what the answers are, and the person is the one who knows when none of
   * them is it.
   */
  static readonly freeTextKey = "__free_text__";

  /**
   * Bracketed paste, which is what makes `cmd+v` reach us at all.
   *
   * A terminal in this mode wraps every paste in `ESC[200~` … `ESC[201~`, so a paste is distinguishable from
   * typing — and, decisively, a paste whose clipboard held no text still sends the two markers with nothing
   * between them. That empty paste is the only notice an application gets that the key was pressed. The mode
   * is off by default and the shell turns it off again before running a command, so it has to be asked for.
   */
  static readonly pasteOn = "\u001b[?2004h";
  static readonly pasteOff = "\u001b[?2004l";

  readonly #agent: CodeAgent;
  readonly #transcript = new CodeTranscript();
  readonly #editor = new CodeTuiEditor();
  readonly #files: CodeTuiFiles;
  readonly #listeners = new Set<() => void>();
  readonly #history: string[] = [];
  readonly #instance: ReturnType<typeof render>;
  readonly #stdout: NodeJS.WriteStream;
  #historyAt = -1;
  /** Index of the last visible transcript row, or null while following the tail. */
  #anchor: number | null = null;
  #selected = 0;
  /** Whether the open question is being answered in prose rather than from its list — see {@link freeTextKey}. */
  #typing = false;
  #menuAt = 0;
  #checked: string[] = [];
  #overlay: CodeTuiOverlay | null = null;
  #overlayAt = 0;
  #picker: { entries: CodeSessionEntry[]; at: number } | null = null;
  #images: string[] = [];
  #switchTo: CodeTuiExit | undefined;
  #offered = false;
  #clipboardTimer: ReturnType<typeof setInterval> | null = null;
  #notice = "";
  readonly #opening: string;
  #thinking: boolean;
  #noticeTimer: ReturnType<typeof setTimeout> | null = null;
  #frameTimer: ReturnType<typeof setTimeout> | null = null;
  #cached: CodeTuiSnapshot | null = null;
  #unsubscribe: (() => void) | undefined;
  #exiting = false;

  constructor(agent: CodeAgent, { thinking = false, notice, ...streams }: CodeTuiOptions = {}) {
    this.#agent = agent;
    this.#thinking = thinking;
    this.#opening = notice ?? "";
    this.#files = new CodeTuiFiles(agent.profile.paths.root);
    this.#stdout = streams.stdout ?? process.stdout;
    this.#stdout.on("resize", this.#onResize);
    this.#instance = render(
      <CodeTuiApp
        actions={{
          subscribe: this.#subscribe,
          snapshot: this.#snapshot,
          type: this.#type,
          edit: this.#edit,
          submit: this.#submit,
          newline: this.#newline,
          paste: this.#paste,
          pasted: this.#pasted,
          complete: this.#complete,
          vertical: this.#vertical,
          scroll: this.#scroll,
          move: this.#move,
          toggle: this.#toggle,
          answerConfirm: this.#answerConfirm,
          cancel: this.#cancel,
          interrupt: this.#interrupt,
        }}
      />,
      {
        // Ink's console patch replaces the console methods themselves, which is the only interception that
        // catches Bun — its `console.log` writes to fd 1 natively and never reaches `process.stdout.write`.
        // Without it, one engine log lands in the middle of a frame and the screen is corrupt until a resize.
        patchConsole: true,
        // Ink's own ctrl+c handler unmounts before a `useInput` handler sees the key, so with it on the host
        // never runs its exit at all: no interrupt of the turn in flight, and no chance to wipe the frame.
        exitOnCtrlC: false,
        // Enter and shift+enter are the same byte on a plain terminal; only the kitty keyboard protocol
        // distinguishes them. `auto` turns it on after the terminal answers a capability query, so one that
        // cannot report the key keeps exactly the handling it has today.
        kittyKeyboard: { mode: "auto" },
        ...streams,
      },
    );
  }

  /** Resolves to the session the person chose to continue, when they chose one, and undefined on a plain quit. */
  async run(seed?: string) {
    this.#stdout.write(`${CodeTui.pasteOn}${CodeTuiMouse.on}`);
    if (this.#opening) this.#say(this.#opening);
    this.#unsubscribe = this.#agent.on((event) => {
      this.#transcript.apply(event);
      if (event.type === "question") this.#openQuestion(event.question);
      this.#scheduleFrame();
    });
    this.#agent.announce();
    void this.#files.load().then(() => this.#renderNow());
    this.#watchClipboard();
    if (seed?.trim()) this.#send(seed.trim());
    await this.#instance.waitUntilExit();
    this.#close();
    return this.#switchTo;
  }

  /** Unmounts without going through a key, so a test does not leave Ink attached to a fake terminal. */
  close() {
    this.#quit();
  }

  /**
   * Offers the clipboard's picture, because the key a mac user reaches for cannot arrive.
   *
   * `cmd+v` is handled by the terminal emulator: it writes the clipboard's **text** to stdin and drops
   * everything else, so with an image on the clipboard the keystroke reaches no application at all. Nothing
   * can bind it. Saying what to press instead is the whole of what is left.
   */
  #watchClipboard() {
    if (!this.#agent.canSeeImages) return;
    this.#clipboardTimer = setInterval(() => {
      const offered = CodeTuiClipboard.has();
      if (offered === this.#offered) return;
      this.#offered = offered;
      this.#renderNow();
    }, CodeTui.clipboardMs);
  }

  #close() {
    if (this.#clipboardTimer) clearInterval(this.#clipboardTimer);
    this.#clipboardTimer = null;
    if (this.#frameTimer) clearTimeout(this.#frameTimer);
    if (this.#noticeTimer) clearTimeout(this.#noticeTimer);
    this.#frameTimer = null;
    this.#noticeTimer = null;
    this.#stdout.off("resize", this.#onResize);
    this.#unsubscribe?.();
    this.#farewell();
  }

  /**
   * The one line worth leaving behind.
   *
   * Only when there is something to come back to: a session nobody asked anything is a file with no
   * conversation in it, and an id printed for one is an invitation to resume nothing.
   */
  #farewell() {
    const info = this.#transcript.info;
    if (this.#switchTo || !info?.sessionId || !this.#agent.sessions().length) return;
    if (!this.#transcript.parts.some((part) => part.kind === "user")) return;
    const name = info.name ? ` (${info.name})` : "";
    this.#stdout.write(`Resume this session${name} with:\n  akan code --resume ${info.sessionId}\n`);
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

  /**
   * How the rows are divided.
   *
   * Ink does not clip an overflowing column, it overwrites — a prompt one row too tall prints through its own
   * first option — so the split has to be exact. A long question and a tall prompt are both windowed rather
   * than the transcript being squeezed below what it needs to show anything.
   */
  static layout(frameRows: number, askRows: number, railRows = 0) {
    const room = Math.max(1, frameRows - CodeTui.minBodyRows - CodeTui.chromeRows - railRows);
    const ask = Math.max(1, Math.min(askRows, room));
    return { ask, bodyHeight: Math.max(CodeTui.minBodyRows, frameRows - ask - CodeTui.chromeRows - railRows) };
  }

  /**
   * How tall the frame may be, which is one row short of the terminal.
   *
   * Ink calls a frame that fills the terminal fullscreen: it drops the trailing newline, repaints with
   * `clearTerminal` — `ESC[3J`, which erases the scrollback buffer, not just the screen — and its `useCursor`
   * arithmetic still assumes the newline is there, so every caret lands one row above the text it belongs to.
   * Leaving the last row to Ink's own newline takes all three away.
   */
  static frameRowsOf(terminalRows: number) {
    return Math.max(CodeTui.minBodyRows + CodeTui.chromeRows + 1, terminalRows - 1);
  }

  #snapshot = (): CodeTuiSnapshot => {
    if (this.#cached) return this.#cached;
    const columns = Math.max(40, this.#stdout.columns || 80);
    const frameRows = CodeTui.frameRowsOf(Math.max(10, this.#stdout.rows || 24));
    const question = this.#transcript.question;
    const approval = this.#transcript.approval;
    const mode = this.#typing ? "input" : CodeTui.#modeOf(question, approval);
    const subagents = this.#railRows(columns);
    // The prompt is measured against a frame the rail has already taken its rows out of: Ink draws a row that
    // runs past the frame over the one below it instead of dropping it, so the two cannot both assume the
    // whole height.
    const ask =
      mode === "input"
        ? this.#inputBlock(columns, frameRows - subagents.length)
        : this.#askBlock(question, frameRows - subagents.length);
    const { bodyHeight } = CodeTui.layout(frameRows, ask.rows, subagents.length);
    const width = columns - 2;
    const lines = this.#lines(width);
    const end = this.#anchor === null ? lines.length : Math.min(lines.length, Math.max(bodyHeight, this.#anchor));
    const start = Math.max(0, end - bodyHeight);
    const above = start;
    const below = lines.length - end;
    this.#cached = {
      topRule: CodeTui.rule(
        this.#anchor === null ? "" : `▲${above} ▼${below} paused`,
        this.#transcript.info?.name ?? this.#transcript.info?.sessionId.slice(0, 8) ?? "",
        columns,
      ),
      bottomRule: CodeTui.rule(this.#queueLabel(), this.#statusLabel(), columns),
      lines: lines.slice(start, end),
      above,
      below,
      following: this.#anchor === null,
      overlay: this.#overlayBlock(width, bodyHeight),
      status: this.#status(),
      subagents,
      mode,
      placeholder: this.#placeholder(),
      offered: this.#offered,
      prompt: CodeTui.#promptOf(question, approval),
      selected: ask.selected,
      checked: this.#checked,
      multiSelect: !!question?.multiSelect,
      notice: this.#notice,
      hint: this.#overlay ? "esc close · ↑↓ scroll" : this.#hint(mode, !!question?.multiSelect),
      columns,
      frameRows,
      bodyHeight,
      cursor: ask.caret ? { x: promptMarkWidth + ask.caret.col, y: bodyHeight + ask.above + ask.caret.row } : null,
      ...ask.snapshot,
    };
    return this.#cached;
  };

  /** The banner, then the conversation. The banner is not a transcript part, so `/clear` cannot take it. */
  #lines(width: number): CodeTuiLine[] {
    return [
      ...CodeTuiLines.rows(this.#banner(), width, "banner"),
      ...CodeTuiParts.lines(this.#transcript.parts, width, { thinking: this.#thinking }),
    ];
  }

  /**
   * The sub-agent rail, or nothing at all when the frame has no room for the whole of it.
   *
   * Dropped rather than windowed: it is a status, and half a list of running children reads as the whole one.
   * The room it is measured against leaves the prompt its rules and one row to type on.
   */
  #railRows(columns: number): CodeTuiLine[] {
    const agents = this.#transcript.subagents;
    if (!agents.length) return [];
    const rows = CodeTuiAgents.rows(agents, this.#transcript.info?.name ?? "main", columns);
    const room =
      CodeTui.frameRowsOf(Math.max(10, this.#stdout.rows || 24)) -
      CodeTui.minBodyRows -
      CodeTui.chromeRows -
      2 * CodeTui.promptRuleRows -
      1;
    return rows.length <= room ? rows : [];
  }

  #banner(): CodeTuiRow[] {
    const cwd = this.#transcript.info?.cwd;
    return [
      { prefix: { text: "✻ ", color: "cyan" }, spans: [{ text: CodeTui.title, bold: true }] },
      {
        prefix: { text: "  " },
        spans: [{ text: cwd ? `${cwd} · /help for commands` : "/help for commands", dim: true }],
      },
    ];
  }

  /**
   * A horizontal rule carrying a label at each end.
   *
   * The labels ride the prompt's own frame rather than a status row of their own: they are read a few times a
   * session and would otherwise cost a line of conversation on every screen. The left one goes first when the
   * terminal is too narrow for both, because the right one is the session's identity.
   */
  static rule(left: string, right: string, width: number): CodeTuiSpan[] {
    const room = (label: string) => (label ? 3 + CodeTuiLines.width(label) : 1);
    const tail = right ? codeAgentClip(right, Math.max(1, width - 4)) : "";
    const head = width - room(left) - room(tail) >= 0 ? left : "";
    const fill = Math.max(0, width - room(head) - room(tail));
    return [
      ...(head
        ? ([
            { text: "─ ", dim: true },
            { text: head, color: "cyan" },
            { text: " ", dim: true },
          ] satisfies CodeTuiSpan[])
        : ([{ text: "─", dim: true }] satisfies CodeTuiSpan[])),
      { text: "─".repeat(fill), dim: true },
      ...(tail
        ? ([
            { text: " ", dim: true },
            { text: tail, dim: true },
            { text: " ─", dim: true },
          ] satisfies CodeTuiSpan[])
        : ([{ text: "─", dim: true }] satisfies CodeTuiSpan[])),
    ];
  }

  #overlayBlock(width: number, height: number) {
    if (this.#picker) return this.#pickerBlock(width, height);
    const overlay = this.#overlay;
    if (!overlay) return null;
    // The box eats a border pair and its title row.
    const room = Math.max(1, height - 3);
    const body = Math.max(8, width - 4);
    const all = CodeTui.#overlayRows(overlay.text, body);
    const first = Math.max(0, Math.min(this.#overlayAt, all.length - room));
    return {
      title: overlay.title,
      lines: all.slice(first, first + room),
      above: first,
      below: Math.max(0, all.length - first - room),
      selectable: false,
    };
  }

  #pickerBlock(width: number, height: number) {
    const picker = this.#picker;
    if (!picker) return null;
    const room = Math.max(1, height - 3);
    const body = Math.max(8, width - 4);
    const first = Math.max(0, Math.min(picker.at - Math.floor(room / 2), picker.entries.length - room));
    const rows = picker.entries
      .slice(first, first + room)
      .map((entry, at) => CodeTui.#sessionRow(entry, first + at === picker.at));
    return {
      title: `sessions · ${picker.entries.length}`,
      // One line per session, whatever it opened with: a wrapped entry would push the list past the box, and
      // a list is scanned down its left edge — an entry that takes four rows is four rows of nothing to scan.
      lines: rows.flatMap((row, at) => CodeTuiLines.rows([row], body, `sessions:${first + at}`).slice(0, 1)),
      above: first,
      below: Math.max(0, picker.entries.length - first - room),
      selectable: true,
    };
  }

  static #sessionRow(entry: CodeSessionEntry, selected: boolean): CodeTuiRow {
    const label = entry.name ?? entry.id.slice(0, 8);
    return {
      prefix: { text: selected ? "❯ " : "  ", color: "cyan" },
      spans: [
        { text: label, bold: selected },
        { text: `  ${CodeTui.#ago(entry.updatedAt)} · ${entry.turns} turn${entry.turns === 1 ? "" : "s"}`, dim: true },
        ...(entry.opening ? ([{ text: `  ${entry.opening}`, dim: true }] satisfies CodeTuiSpan[]) : []),
      ],
    };
  }

  static #ago(at: number) {
    const minutes = Math.max(0, Math.round((Date.now() - at) / 60_000));
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 60 * 24) return `${Math.round(minutes / 60)}h ago`;
    return `${Math.round(minutes / (60 * 24))}d ago`;
  }

  /** The prompt block: the menu when a command is being typed, then the rules and the buffer's own rows. */
  #inputBlock(columns: number, frameRows: number): CodeTuiAskBlock {
    const all = this.#menu()?.options ?? [];
    const { rows, row, col } = this.#editor.layout(columns - promptMarkWidth - 1);
    // The attachment row and the clipboard offer are the same row; only one of them is ever drawn.
    const offered = this.#offered ? 1 : 0;
    const room = frameRows - CodeTui.minBodyRows - CodeTui.chromeRows - 2 * CodeTui.promptRuleRows - offered;
    // Windowed around the highlighted entry, because Ink overwrites what runs past the frame instead of
    // dropping it: a menu longer than the terminal does not scroll off, it draws over the prompt below it.
    const menuRows = Math.max(0, Math.min(all.length, room - 1));
    const menuFrom = Math.max(0, Math.min(this.#menuAt - Math.floor(menuRows / 2), all.length - menuRows));
    const menu = all.slice(menuFrom, menuFrom + menuRows);
    const above = menu.length + CodeTui.promptRuleRows + offered;
    const chrome = above + CodeTui.promptRuleRows;
    const budget = Math.max(1, Math.min(CodeTui.maxInputRows, room - menu.length));
    const first = Math.max(0, Math.min(row - budget + 1, rows.length - budget));
    const shown = rows.slice(first, first + budget);
    return {
      rows: chrome + shown.length,
      above,
      selected: 0,
      caret: { row: row - first, col },
      snapshot: {
        input: shown.map((entry) => entry.text),
        menu,
        menuSelected: this.#menuAt - menuFrom,
        options: [] as CodeTuiOption[],
      },
    };
  }

  #askBlock(question: CodeAgentQuestion | undefined, frameRows: number): CodeTuiAskBlock {
    const all = CodeTui.#optionsOf(question);
    const chrome = 1 + 2 * CodeTui.promptRuleRows;
    const budget = Math.max(1, frameRows - CodeTui.minBodyRows - CodeTui.chromeRows - chrome);
    const shown = Math.min(all.length, budget);
    const first = Math.max(0, Math.min(this.#selected - Math.floor(shown / 2), all.length - shown));
    return {
      rows: chrome + shown,
      above: CodeTui.promptRuleRows,
      selected: this.#selected - first,
      caret: undefined,
      snapshot: {
        input: [] as string[],
        menu: [] as CodeTuiOption[],
        menuSelected: 0,
        options: all.slice(first, first + shown),
      },
    };
  }

  #menu(): CodeTuiMenu | null {
    const prefix = CodeTuiCommands.prefixOf(this.#editor.text, this.#editor.caret);
    if (prefix !== undefined)
      return {
        kind: "command",
        from: 0,
        to: this.#editor.text.length,
        options: CodeTuiCommands.matches(prefix).map((command) => ({
          key: command.name,
          label: `/${command.name}${command.arg ? ` ${command.arg}` : ""}`,
          detail: command.desc,
        })),
      };
    const token = this.#editor.token();
    if (!token.text.startsWith("@")) return null;
    const options = this.#files.match(token.text.slice(1)).map((file) => ({ key: file, label: `@${file}` }));
    // An empty list while the listing is still in flight would read as "no such file"; one after it has
    // landed is the truth, and the menu closes.
    if (!options.length && this.#files.ready) return null;
    return { kind: "file", from: token.from, to: token.to, options };
  }

  /**
   * Line by line, so a hard break in a command's answer stays one.
   *
   * The markdown scanner folds consecutive lines into a paragraph, which is right for an answer written as
   * prose and wrong for a column of commands — the whole reason the overlay exists is to lay them out.
   */
  static #overlayRows(text: string, width: number): CodeTuiLine[] {
    return text.split("\n").flatMap((line, at) =>
      // A blank line keeps a space: a row with no spans renders as no element at all, and the gap it was
      // there to make disappears.
      CodeTuiLines.rows(
        line.trim() ? CodeTuiMarkdown.rows(line, width) : [{ spans: [{ text: " " }] }],
        width,
        `overlay:${at}`,
      ),
    );
  }

  #queueLabel() {
    const queue = this.#transcript.queue;
    const parts: string[] = [];
    if (queue.steering || queue.followUp) parts.push(`queued ${queue.steering + queue.followUp}`);
    if (this.#transcript.compacting) parts.push("compacting");
    return parts.join(" · ");
  }

  /**
   * Model, window, profile and effort — the line that makes a wrong model descriptor visible.
   *
   * The declared window stays on screen next to the share used: a descriptor that is wrong but
   * self-consistent — a 65k window declared for a provider that serves 1M — passes every programmatic check
   * there is, and the only thing that catches it is a person reading the number.
   */
  #statusLabel() {
    const info = this.#transcript.info;
    if (!info) return "starting…";
    const context = this.#transcript.context;
    const window = info.contextTokens ? `${Math.round(info.contextTokens / 1000)}k` : "";
    const used = context?.max ? `${Math.round((context.used / context.max) * 100)}% of ${window}` : "";
    return [info.model?.name ?? "no model", used || (window && `${window} ctx`), info.profile, info.effort]
      .filter((part) => !!part)
      .join(" · ");
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
    const options = (question?.options ?? []).map((option) => ({
      key: option.key,
      label: option.recommended ? `${option.label} (recommended)` : option.label,
      ...(option.detail ? { detail: option.detail } : {}),
    }));
    if (!options.length || !question?.freeText) return options;
    return [...options, { key: CodeTui.freeTextKey, label: "Something else…", detail: "answer in your own words" }];
  }

  static #promptOf(question: CodeAgentQuestion | undefined, approval: CodeAgentApprovalRequest | undefined) {
    if (approval) return `approve? ${approval.summary}  [y/n]`;
    return question ? `? ${question.prompt}` : "";
  }

  #hint(mode: CodeTuiSnapshot["mode"], multiSelect: boolean) {
    if (this.#typing) return "enter answer · esc back to the choices";
    if (mode === "confirm") return "y yes · n no · esc no";
    if (mode === "select")
      return `↑↓ choose${multiSelect ? " · space toggle" : ""} · enter answer · esc skip · pgup/pgdn scroll`;
    return "enter send · shift+enter newline · ↑↓ move · esc interrupt · pgup/pgdn scroll · ^c quit · /help";
  }

  #placeholder() {
    if (this.#typing) return "your answer";
    if (this.#transcript.question) return "type an answer, or esc to skip";
    return this.#transcript.streaming ? "type to steer, esc to interrupt" : "ask for something, / for commands";
  }

  #type = (text: string) => {
    const pasted = this.#agent.canSeeImages ? CodeTuiClipboard.imagePathsIn(text) : undefined;
    // Only when a path was actually found: otherwise the text goes in byte for byte, newlines and all.
    if (pasted?.images.length) {
      for (const file of pasted.images) this.#attach(file);
      if (pasted.rest) this.#editor.insert(pasted.rest);
    } else this.#editor.insert(text);
    this.#menuAt = 0;
    this.#historyAt = -1;
    this.#renderNow();
  };

  #newline = () => {
    this.#editor.newline();
    this.#historyAt = -1;
    this.#renderNow();
  };

  #edit = (action: CodeTuiEditKey) => {
    const width = this.#snapshot().columns - promptMarkWidth - 1;
    const run: { [key in CodeTuiEditKey]: () => void } = {
      backspace: () => this.#editor.backspace(),
      delete: () => this.#editor.deleteForward(),
      left: () => (this.#editor.caret ? this.#editor.left() : this.#openSessions()),
      right: () => this.#editor.right(),
      wordLeft: () => this.#editor.wordLeft(),
      wordRight: () => this.#editor.wordRight(),
      home: () => this.#editor.homeOfRow(width),
      end: () => this.#editor.endOfRow(width),
      deleteWord: () => this.#editor.deleteWord(),
      deleteToStart: () => this.#editor.deleteToLineStart(),
    };
    run[action]();
    // A caret move is not an edit, so it leaves a recalled entry recalled and the arrows on history.
    if (action.startsWith("delete") || action === "backspace") this.#historyAt = -1;
    this.#renderNow();
  };

  /**
   * Up and down move inside the prompt, and fall through to history at its edges.
   *
   * That order is what makes a multi-line prompt editable at all: binding the arrows to history outright would
   * leave no way to reach the line above the caret, and binding them to the buffer outright would lose the
   * one-line recall that is most of what the arrows are used for.
   */
  #vertical = (delta: -1 | 1) => {
    if (this.#picker) return this.#move(delta);
    if (this.#overlay) return this.#scroll(delta);
    const menu = this.#menu()?.options ?? [];
    if (menu.length) {
      this.#menuAt = (this.#menuAt + delta + menu.length) % menu.length;
      return this.#renderNow();
    }
    // While a recalled entry is on the prompt the arrows stay on history. One that wraps would otherwise
    // swallow them moving inside itself, and since the text does not change the key reads as dead — which is
    // the whole reason recall is a mode: an edit leaves it, and then the arrows move in the buffer again.
    if (this.#historyAt < 0 && this.#editor.move(delta, this.#snapshot().columns - promptMarkWidth - 1))
      return this.#renderNow();
    if (delta < 0) return this.#historyPrev();
    return this.#historyNext();
  };

  #complete = () => {
    const menu = this.#menu();
    const chosen = menu?.options[this.#menuAt];
    if (!menu || !chosen) return;
    // A command taking an argument is completed with the space already typed, because the next thing the user
    // means to do is type that argument. A path is followed by one for the same reason.
    const command = CodeTuiCommands.all.find((entry) => entry.name === chosen.key);
    const text = menu.kind === "command" ? `/${chosen.key}${command?.arg ? " " : ""}` : `@${chosen.key} `;
    this.#editor.replace(menu.from, menu.to, text);
    this.#menuAt = 0;
    this.#renderNow();
  };

  #historyPrev() {
    if (!this.#history.length) return;
    this.#historyAt = this.#historyAt < 0 ? this.#history.length - 1 : Math.max(0, this.#historyAt - 1);
    this.#editor.set(this.#history[this.#historyAt] ?? "");
    this.#renderNow();
  }

  #historyNext() {
    if (this.#historyAt < 0) return;
    this.#historyAt += 1;
    if (this.#historyAt >= this.#history.length) {
      this.#historyAt = -1;
      this.#editor.clear();
    } else this.#editor.set(this.#history[this.#historyAt] ?? "");
    this.#renderNow();
  }

  #scroll = (delta: number) => {
    if (this.#picker) return this.#move(Math.sign(delta));
    if (this.#overlay) {
      this.#overlayAt = Math.max(0, this.#overlayAt + Math.trunc(delta));
      return this.#renderNow();
    }
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
    const picker = this.#picker;
    if (picker) {
      picker.at = Math.max(0, Math.min(picker.entries.length - 1, picker.at + delta));
      return this.#renderNow();
    }
    const count = CodeTui.#optionsOf(this.#transcript.question).length;
    if (!count) return;
    this.#selected = (this.#selected + delta + count) % count;
    this.#renderNow();
  };

  #toggle = () => {
    const option = CodeTui.#optionsOf(this.#transcript.question)[this.#selected];
    if (!option) return;
    this.#checked = this.#checked.includes(option.key)
      ? this.#checked.filter((key) => key !== option.key)
      : [...this.#checked, option.key];
    this.#renderNow();
  };

  #answerConfirm = (value: boolean) => {
    const approval = this.#transcript.approval;
    if (approval) return void this.#agent.approve(approval.approvalId, value);
    const question = this.#transcript.question;
    if (question) void this.#answer(question.questionId, { text: value ? "yes" : "no" });
  };

  #cancel = () => {
    if (this.#overlay || this.#picker) return this.#dismiss();
    // Back to the choices, not out of the question: reaching the prompt was a keypress, and undoing it should
    // cost the same rather than throwing away a question the model is still waiting on.
    if (this.#typing && this.#transcript.question?.options?.length) {
      this.#typing = false;
      this.#editor.clear();
      return this.#renderNow();
    }
    const approval = this.#transcript.approval;
    if (approval) return void this.#agent.approve(approval.approvalId, false);
    const question = this.#transcript.question;
    if (question) return void this.#answer(question.questionId, {});
    if (this.#transcript.streaming) return void this.#agent.abort();
    if (!this.#editor.isEmpty) {
      this.#editor.clear();
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

  #quit() {
    if (this.#exiting) return;
    this.#exiting = true;
    this.#stdout.write(`${CodeTuiMouse.off}${CodeTui.pasteOff}`);
    // Cleared before the unmount, not after: `clear` erases the rows of the frame Ink last wrote, and
    // unmounting forgets how many that was — so afterwards it erases nothing and the whole session stays on
    // the terminal, which is the mess a quit is supposed to take with it.
    this.#instance.clear();
    this.#instance.unmount();
  }

  #submit = () => {
    if (this.#picker) return this.#resume(this.#picker.entries[this.#picker.at]?.id);
    const question = this.#transcript.question;
    if (question) return void this.#answerCurrent(question.questionId);
    // Enter runs the highlighted command rather than the prefix under the caret, so `/hel` sends `/help` and
    // a fully typed `/help` does not need a trailing space to close the menu first. Tab is the key that
    // completes without running, which is the only reason to have both. A file mention has nothing to run,
    // so there enter completes too.
    const menu = this.#menu();
    if (menu?.kind === "file") return this.#complete();
    const chosen = menu?.options[this.#menuAt];
    const raw = chosen ? `/${chosen.key}` : this.#editor.text;
    const pending = this.#pending(raw);
    if (!pending.text && !pending.images.length) return;
    this.#editor.clear();
    this.#historyAt = -1;
    if (pending.text) this.#history.push(pending.text);
    if (pending.text.startsWith("/")) return this.#command(pending.text);
    this.#send(pending.text, pending.images);
  };

  #send(text: string, images: { path: string }[] = []) {
    this.#images = [];
    this.#transcript.echo(text, images.length);
    this.#renderNow();
    void this.#agent.prompt(text, images).catch((error: unknown) => this.#fail(error));
  }

  /**
   * Pulls an image off the OS clipboard, because a paste never carries one.
   *
   * `ctrl+v` is handled by the terminal emulator: it writes the clipboard's **text** to stdin and has no way
   * to hand over bytes, so an image on the clipboard is invisible to a TUI that only reads keys.
   */
  #paste = () => {
    if (!this.#agent.canSeeImages) return this.#open("images", CodeTui.#imageHelp(this.#transcript.info?.model));
    void CodeTuiClipboard.image()
      .then((file) => (file ? this.#attach(file) : this.#say("nothing on the clipboard we can attach")))
      .catch((error: unknown) => this.#fail(error));
  };

  /**
   * One whole paste, and the one place `cmd+v` arrives.
   *
   * The terminal handles that key itself and writes the clipboard's **text** to stdin — so with a screenshot
   * on the clipboard there is no text to write and the paste comes through empty. Empty is therefore not
   * nothing: it is a paste that had a picture in it, and going to the OS for that picture is what the key was
   * asked to do. A clipboard that is genuinely empty asks for nothing, which is why the OS is consulted first.
   */
  #pasted = (text: string) => {
    // A terminal sends a newline inside a paste as a carriage return; the prompt stores newlines.
    if (text) return this.#type(text.replace(/\r\n?/g, "\n"));
    if (CodeTuiClipboard.has()) this.#paste();
  };

  /**
   * Attaches a picture and writes its marker into the prompt.
   *
   * The marker is the attachment: deleting `[image #1]` before pressing enter un-attaches it, and there is
   * nowhere else to go looking for what is about to be sent. A count in the corner cannot be edited.
   */
  #attach(file: string) {
    this.#images.push(file);
    this.#editor.insert(`[image #${this.#images.length}] `);
    this.#renderNow();
  }

  /** The images whose markers survived editing, and the text with the markers taken out. */
  #pending(text: string) {
    const marks = [...text.matchAll(CodeTui.imageMark)].map((match) => Number(match[1]));
    const images = marks
      .map((mark) => this.#images[mark - 1])
      .filter((file): file is string => !!file)
      .map((path) => ({ path }));
    // The marker takes its own trailing space with it; nothing else about the text is touched, because a
    // paste of a stack trace or a snippet is exactly where collapsing runs of spaces does damage.
    return { images, text: text.replace(CodeTui.imageMark, "").trim() };
  }

  /**
   * Why an image was refused, and what to do when the catalogue is the thing that is wrong.
   *
   * `input` is a claim in the model catalogue, not a fact we checked: sending a picture to a model the entry
   * calls text-only earns a provider error nobody can act on, and refusing with no way to disagree is the
   * other bad end of the same guess.
   */
  static #imageHelp(model: { provider: string; id: string } | undefined) {
    const provider = model?.provider ?? "<provider>";
    const id = model?.id ?? "<model>";
    return [
      `The model catalogue declares ${provider}/${id} text-only, so an image would go to a model that cannot read it.`,
      "",
      "If that is wrong, override the entry in ~/.akan/code/models.json:",
      "",
      `{"providers":{"${provider}":{"modelOverrides":{"${id}":{"input":["text","image"]}}}}}`,
    ].join("\n");
  }

  #openSessions = () => {
    const entries = this.#agent.sessions();
    if (!entries.length) return this.#say("no stored sessions yet");
    const current = this.#transcript.info?.sessionId;
    this.#picker = {
      entries,
      at: Math.max(
        0,
        entries.findIndex((entry) => entry.id === current),
      ),
    };
    this.#renderNow();
  };

  /** Leaves the host for the runner to rebuild against the chosen session — see `CodeRunner.tui`. */
  #resume(id: string | undefined) {
    if (!id) return this.#dismiss();
    if (id === this.#transcript.info?.sessionId) return this.#dismiss();
    this.#switchTo = { id };
    this.#quit();
  }

  /**
   * Continues this conversation twice: the copy takes over here, the original stays where it was left.
   *
   * Switching to the copy rather than opening it beside this one is what makes the gesture mean "branch from
   * right here" — the alternative leaves the person in the session they just decided not to continue.
   */
  #fork(argument: string) {
    if (!this.#transcript.parts.some((part) => part.kind === "user"))
      return this.#open("fork", "Nothing has been said in this session yet, so a fork of it is a new session.");
    const from = this.#transcript.info?.sessionId ?? "";
    try {
      const forked = this.#agent.fork(argument.trim() || undefined);
      this.#switchTo = { id: forked.id, notice: `forked — the original is akan code --resume ${from}` };
      this.#quit();
    } catch (error: unknown) {
      this.#fail(error);
    }
  }

  /**
   * A question arriving takes the cursor, and the recommendation takes the cursor inside it.
   *
   * Offered under the cursor rather than merely labelled: "you decide" is the most common answer there is, and
   * it should cost one keypress rather than a hunt down the list for the row that says so.
   */
  #openQuestion(question: CodeAgentQuestion) {
    this.#typing = false;
    this.#checked = [];
    this.#selected = Math.max(
      0,
      (question.options ?? []).findIndex((option) => option.recommended),
    );
  }

  #answerCurrent(questionId: string) {
    const question = this.#transcript.question;
    const shown = CodeTui.#optionsOf(question);
    if (this.#typing || !shown.length) {
      const text = this.#editor.text.trim();
      this.#editor.clear();
      this.#typing = false;
      return void this.#answer(questionId, { text });
    }
    if (shown[this.#selected]?.key === CodeTui.freeTextKey) {
      this.#typing = true;
      this.#editor.clear();
      return this.#renderNow();
    }
    // The synthetic choice is filtered rather than refused: it can be ticked in a multi-select, and what it
    // means there is the same thing it means alone — that the list did not have the answer.
    const keys = question?.multiSelect
      ? this.#checked.filter((key) => key !== CodeTui.freeTextKey)
      : [shown[this.#selected]?.key ?? ""];
    this.#editor.clear();
    void this.#answer(questionId, { keys });
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
        return this.#open("help", CodeTuiCommands.help());
      case "quit":
      case "exit":
        return this.#quit();
      case "abort":
        return void this.#agent.abort();
      case "clear":
        this.#anchor = null;
        this.#transcript.clear();
        return this.#say("screen cleared · the model still remembers · /compact shortens what it carries");
      case "compact":
        return void this.#agent.compact(argument || undefined).catch((error: unknown) => this.#fail(error));
      case "thinking":
        this.#thinking = !this.#thinking;
        return this.#say(this.#thinking ? "showing the model's reasoning" : "reasoning folded back to one line");
      case "tools": {
        const tools = this.#transcript.info?.tools ?? [];
        return this.#open("tools", `${tools.length} tools\n\n${tools.join(" · ")}`);
      }
      case "model":
        return this.#setModel(argument);
      case "effort":
        return this.#setEffort(argument);
      case "peers":
        return this.#open("peers", CodeTui.#peerList(this.#agent.peers()));
      case "msg":
        return this.#message(argument);
      case "fork":
        return this.#fork(argument);
      case "agents":
        return this.#open("agents", this.#agentList());
      case "mcp":
        return this.#mcp(argument);
      case "name":
        if (!argument) return this.#open("name", "Usage: /name <what this session is about>");
        this.#agent.setName(argument);
        return this.#say(`session named ${argument}`);
      default:
        return this.#open("unknown command", `There is no /${name}.\n\n${CodeTuiCommands.help()}`);
    }
  }

  /**
   * What the `task` tool can open, and the ceilings it opens them under.
   *
   * The budget is the part worth showing: a sub-agent spends tokens nobody watching the transcript sees spent,
   * so the number that stops it is the one a person needs in front of them before they ask for another.
   */
  #agentList() {
    const budget = this.#agent.profile.tools.subagent;
    if (!budget) return "Sub-agents are off in this profile.";
    const column = Math.max(...Object.keys(SubagentPool.kinds).map((kind) => kind.length)) + 2;
    const kinds = Object.entries(SubagentPool.kinds).map(([kind, spec]) => `${kind.padEnd(column)}${spec.desc}`);
    return [
      ...kinds,
      "",
      `At most ${budget.maxConcurrent} at once, ${budget.maxDepth} deep, ${budget.budget} tokens for the whole tree.`,
      "",
      "Ask for one in a sentence — the model calls the tool. Its reading never enters this conversation.",
    ].join("\n");
  }

  /**
   * The MCP servers, and the three things that can be done to them from here.
   *
   * `add` and `remove` write the file and stop there: the session's tool allowlist is fixed when the session
   * is created, so a server declared now is reachable only by the reload — which is the same gesture a session
   * switch already is, pointed back at this session.
   */
  #mcp(argument: string) {
    const words = argument.split(" ").filter(Boolean);
    // Anywhere in the line, because it reads as an adverb and nobody remembers which slot an adverb goes in.
    const local = words.includes("--local");
    const [verb, name, ...rest] = words.filter((word) => word !== "--local");
    const root = this.#agent.workspaceRoot;
    if (!verb) return this.#open("mcp", CodeTuiMcp.list(this.#mcpView()));
    if (verb === "reload") return this.#reload("reconnected the MCP servers");
    if (verb === "login" || verb === "logout") return this.#mcpAuth(verb, name);
    if (verb !== "add" && verb !== "remove") {
      const status = this.#agent.mcpServers().find((entry) => entry.name === verb);
      if (status) return this.#open(`mcp · ${verb}`, CodeTuiMcp.tools(status));
      return this.#open("mcp", [`There is no /mcp ${verb}.`, "", ...CodeTuiMcp.usage].join("\n"));
    }
    if (!name) return this.#open("mcp", [`Usage:`, "", ...CodeTuiMcp.usage].join("\n"));
    if (!CodeTuiMcp.namePattern.test(name))
      return this.#open("mcp", `"${name}" cannot name a server: letters, digits, dash and underscore only.`);
    try {
      if (verb === "remove") {
        const scope = McpServerConfig.remove(root, name);
        if (!scope) return this.#open("mcp", `No server named "${name}" is declared.`);
        return this.#reload(`removed ${name} from the ${scope} file`);
      }
      const scope = local ? "workspace" : "global";
      const ref = McpServerConfig.add(root, name, rest, scope);
      const where = scope === "global" ? "every repo" : "this repo";
      return this.#reload(`added ${name} · ${McpServerConfig.targetOf(ref)} · ${where}`);
    } catch (error: unknown) {
      this.#fail(error);
    }
  }

  /**
   * Signing a server in, or forgetting that it ever was.
   *
   * The sign-in is left running rather than awaited: it opens a browser and waits for a person, which is
   * minutes, and holding the command would freeze the prompt for all of them. The session reloads itself when
   * the token lands, because a token this session did not start with reaches no tool registry until it does.
   */
  #mcpAuth(verb: "login" | "logout", name: string | undefined) {
    const root = this.#agent.workspaceRoot;
    if (!name) return this.#open("mcp", [`Usage: /mcp ${verb} <name>`, "", ...CodeTuiMcp.usage].join("\n"));
    if (verb === "logout") {
      if (!McpTokenStore.clear(name)) return this.#open("mcp", `"${name}" is not signed in.`);
      return this.#reload(`signed out of ${name}`);
    }
    const ref = McpServerConfig.read(root).find((entry) => entry.name === name);
    if (!ref) return this.#open("mcp", `No server named "${name}" is declared.`);
    this.#say(`signing in to ${name} — finish in the browser`);
    void McpSignIn.run(ref, { open: (url) => void openBrowser(url), onNotice: (message) => this.#say(message) })
      .then(() => this.#reload(`signed in to ${name}`))
      .catch((error: unknown) => this.#fail(error));
  }

  #mcpView() {
    const root = this.#agent.workspaceRoot;
    const problem = McpServerConfig.problem(root);
    return {
      status: this.#agent.mcpServers(),
      declared: McpServerConfig.declared(root),
      files: McpServerConfig.files(root),
      ...(problem ? { problem } : {}),
    };
  }

  /**
   * Reopens this session against what is on disk now.
   *
   * The engine binds its tool registry at construction, so nothing declared afterwards can be reached without
   * building another agent — and the runner already rebuilds one around a session id. Pointing that at the
   * session already open keeps the conversation and takes the new assembly, which is what a reload is.
   */
  #reload(notice: string) {
    const id = this.#transcript.info?.sessionId;
    if (!id || !this.#agent.sessions().some((entry) => entry.id === id))
      return this.#open(
        "mcp",
        "This session is not on disk yet, so there is nothing to reopen. Say something first, or start a new `akan code`.",
      );
    this.#switchTo = { id, notice };
    this.#quit();
  }

  static #peerList(peers: { id: string; name: string; cwd: string }[]) {
    if (!peers.length) return "No other akan code session is running in this workspace.";
    const column = Math.max(...peers.map((peer) => peer.name.length)) + 2;
    const rows = peers.map((peer) => `${peer.name.padEnd(column)}${peer.id.slice(0, 8)}  ${peer.cwd}`);
    return [...rows, "", "/msg <peer> <text> hands one of them a message."].join("\n");
  }

  #message(argument: string) {
    const [target, ...rest] = argument.split(" ");
    const text = rest.join(" ").trim();
    if (!target || !text)
      return this.#open("msg", `Usage: /msg <peer> <text>\n\n${CodeTui.#peerList(this.#agent.peers())}`);
    try {
      const peer = this.#agent.send(target, text);
      this.#say(`sent to ${peer.name}`);
    } catch (error: unknown) {
      this.#fail(error);
    }
  }

  #setEffort(argument: string) {
    const levels = this.#agent.efforts();
    if (!levels.length) return this.#open("effort", "This model does no reasoning, so it has no effort to set.");
    const wanted = argument.trim().toLowerCase();
    if (!levels.includes(wanted as CodeAgentEffort))
      return this.#open(
        "effort",
        `Usage: /effort <level>\n\nnow: ${this.#transcript.info?.effort ?? "unknown"}\n${levels.join(" · ")}`,
      );
    try {
      this.#agent.setEffort(wanted as CodeAgentEffort);
      // The engine clamps to what the provider serves, so the frame that came back is what actually took.
      this.#say(`effort ${this.#transcript.info?.effort ?? wanted}`);
    } catch (error: unknown) {
      this.#fail(error);
    }
  }

  /**
   * Switching model, and the three listings that answer "to what".
   *
   * A bare `/model` lists rather than prints a usage line: the id it wants is one of ~1,700 the catalogue
   * carries, and nothing on screen anywhere else names even one of them.
   */
  #setModel(argument: string) {
    const wanted = argument.trim();
    const [provider, ...rest] = wanted.split("/");
    if (provider && rest.length)
      return void this.#agent.setModel({ provider, id: rest.join("/") }).catch((error: unknown) => this.#fail(error));
    const catalogue = this.#agent.catalogue();
    if (wanted === "providers") return this.#open("model · providers", CodeTuiModels.providers(catalogue));
    if (!provider) return this.#open("model", CodeTuiModels.list(catalogue));
    const listing = CodeTuiModels.ofProvider(catalogue, provider);
    if (listing) return this.#open(`model · ${provider}`, listing);
    return this.#open("model", [`There is no provider called "${provider}".`, "", ...CodeTuiModels.usage].join("\n"));
  }

  /**
   * A command's answer, over the transcript rather than in it.
   *
   * A slash command asks the host something; the conversation is what the model and the person said to each
   * other. Writing the answer into the transcript makes every `/help` a permanent row — and, on a profile
   * that persists, part of what the next session reloads.
   */
  #open(title: string, text: string) {
    this.#overlay = { title, text };
    this.#overlayAt = 0;
    this.#renderNow();
  }

  #dismiss() {
    this.#overlay = null;
    this.#overlayAt = 0;
    this.#picker = null;
    this.#renderNow();
  }

  #fail(error: unknown) {
    this.#transcript.note("error", String(error));
    this.#renderNow();
  }

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
