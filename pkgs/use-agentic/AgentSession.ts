import { AgentProgress, type AgentProgressReport } from "./AgentProgress";
import type {
  AgentRunner,
  ChatMessage,
  ContextBlock,
  PublishedTool,
  RunnerRequest,
  SurfaceView,
  ToolCallRequest,
  ToolCallResult,
  ToolEntry,
} from "./types";

export interface PendingApproval {
  callId: string;
  name: string;
  args: Record<string, unknown>;
  message: string;
  approve: () => void;
  reject: (reason?: string) => void;
}

/**
 * A decision the agent handed back to the user mid-turn. The loop is parked on it until it settles, exactly as it
 * parks on an approval. `choices` is empty for a free-text ask, and `multiple` never accompanies an empty one.
 */
export interface PendingQuestion {
  callId: string;
  question: string;
  choices: string[];
  multiple: boolean;
  answer: (value: string | string[]) => void;
  dismiss: (reason?: string) => void;
}

/** Where a session keeps its transcript across page loads. Storage-neutral: the host decides what backs it. */
export interface SessionHistory {
  load(): ChatMessage[] | null;
  save(messages: readonly ChatMessage[]): void;
  clear(): void;
}

export interface AgentSessionOptions {
  instructions?: string;
  buildContext?: (surface: SurfaceView) => ContextBlock[];
  /** Assistant turns per send before the session asks whether to keep going, or stops. */
  maxTurns?: number;
  /** Restores settled messages at construction and saves after every change, debounced. Failures are silent. */
  history?: SessionHistory;
  /**
   * Awaited after a tool that changed something and before its change report is taken. A surface is read
   * synchronously and a screen does not settle synchronously, so without this the report describes the moment
   * before the change landed. `ScreenSettle.wait` is what an akan app passes.
   */
  settle?: () => Promise<void> | void;
  /**
   * Turns the turn cap into a question instead of a dead end. Omitted, the cap fails as before — a host that
   * renders no `pendingQuestion` would otherwise wait forever for an answer nobody can give.
   */
  continueAsk?: { question: string; keep: string };
}

/**
 * The client-side conversation loop: send → model turn → tool calls → approval gate → execute → report diffs → next
 * turn. The loop lives here rather than on a server because the tools do — the runner is one stateless model turn,
 * so any backend that answers it works and none has to hold a session.
 *
 * Failures land in the transcript instead of being thrown past it: a refused guard, a rejected approval, and an
 * unknown tool are all things the agent did, and the model reads them as tool results the same way a person reads
 * them in the chat.
 */
export class AgentSession {
  /**
   * The one built-in the session owns instead of the surface: the answer comes from the conversation, not the
   * screen, so every host that renders `pendingQuestion` gets it and a zone agent asks inside its own transcript.
   * A surface tool of this name shadows it, like any other built-in.
   */
  static readonly askUserTool: PublishedTool = {
    name: "askUser",
    description:
      "Ask the user to decide something that is theirs to decide — an ambiguous request, a missing value, a choice between paths. Use it instead of guessing. Pass `choices` to offer options, or omit them for a free-text answer; the user may answer off-list either way. Returns what they chose or wrote, and errors if they dismiss it.",
    parameters: {
      type: "object",
      properties: {
        question: { type: "string", description: "What to ask, in one sentence." },
        choices: { type: "array", items: { type: "string" }, description: "The options to offer, as short labels." },
        multiple: { type: "boolean", description: "Let the user pick several choices. Ignored without choices." },
      },
      required: ["question"],
      additionalProperties: false,
    },
    effect: "query",
    needsConfirm: false,
  };

  readonly #surface: SurfaceView;
  readonly #runner: AgentRunner;
  readonly #options: AgentSessionOptions;
  #messages: ChatMessage[] = [];
  #running = false;
  #pending: PendingApproval | null = null;
  #question: PendingQuestion | null = null;
  #progress: (AgentProgressReport & { callId: string }) | null = null;
  #controller: AbortController | null = null;
  #active: Promise<void> | null = null;
  #version = 0;
  #listeners = new Set<() => void>();
  #saveTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(surface: SurfaceView, runner: AgentRunner, options: AgentSessionOptions = {}) {
    this.#surface = surface;
    this.#runner = runner;
    this.#options = options;
    this.#messages = AgentSession.#restored(options.history);
  }

  get surface(): SurfaceView {
    return this.#surface;
  }

  get messages(): readonly ChatMessage[] {
    return this.#messages;
  }

  get isRunning() {
    return this.#running;
  }

  get pendingApproval(): PendingApproval | null {
    return this.#pending;
  }

  get pendingQuestion(): PendingQuestion | null {
    return this.#question;
  }

  /** What the tool running now last said about its own progress, for the row that is still spinning. */
  get progress(): (AgentProgressReport & { callId: string }) | null {
    return this.#progress;
  }

  /** Bumped on every change, so a store binding can use it as the snapshot. */
  get version() {
    return this.#version;
  }

  subscribe = (listener: () => void) => {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  };

  /** A user's text, or prewritten messages — how a host injects a prompt's result as the user's turn. */
  send = async (input: string | ChatMessage[]) => {
    if (this.#running) throw new Error("A turn is already running.");
    this.#running = true;
    const run = this.#turn(input);
    this.#active = run;
    await run;
  };

  async #turn(input: string | ChatMessage[]) {
    const controller = new AbortController();
    this.#controller = controller;
    if (typeof input === "string") this.#append({ role: "user", text: input });
    else for (const message of input) this.#append(message);
    const maxTurns = this.#options.maxTurns ?? 8;
    try {
      let budget = maxTurns;
      for (let turn = 0; ; turn += 1) {
        if (controller.signal.aborted) return;
        if (turn >= budget) {
          // The cap is a guess about when a loop has gone wrong, and the user is the one who can tell. The answer
          // rides as a user message, so a steer typed instead of the keep-going choice reaches the model as one.
          const answer = await this.#askToContinue(turn, controller.signal);
          if (answer === null) {
            this.#fail(`Stopped after ${turn} assistant turns without a final answer.`);
            return;
          }
          this.#append({ role: "user", text: answer });
          budget = turn + maxTurns;
        }
        const { toolCalls, stop } = await this.#assistantTurn(controller.signal);
        if (controller.signal.aborted || stop !== "toolUse" || !toolCalls.length) return;
        const toolResults: ToolCallResult[] = [];
        for (const call of toolCalls) {
          if (controller.signal.aborted) break;
          toolResults.push(await this.#execute(call, controller.signal));
        }
        this.#append({ role: "tool", toolResults });
      }
    } catch (error) {
      if (!controller.signal.aborted) this.#fail(error instanceof Error ? error.message : String(error));
    } finally {
      this.#running = false;
      this.#controller = null;
      this.#active = null;
      this.#pending = null;
      this.#question = null;
      this.#progress = null;
      this.#notify();
    }
  }

  abort = () => {
    this.#controller?.abort();
  };

  /**
   * Empties the transcript and the persisted history, ending a turn that is still running. Awaiting the abort
   * matters: the loop settles in its own `finally`, a microtask later, and a transcript emptied before that lands
   * is one the winding-down turn appends onto.
   */
  reset = async () => {
    if (this.#active) {
      this.#controller?.abort();
      await this.#active;
    }
    this.#messages = [];
    // The pending debounced save would re-create the entry clear() just removed.
    if (this.#saveTimer) {
      clearTimeout(this.#saveTimer);
      this.#saveTimer = null;
    }
    try {
      this.#options.history?.clear();
    } catch {
      // History is best-effort; a full or blocked storage never breaks the chat.
    }
    this.#version += 1;
    for (const listener of this.#listeners) listener();
  };

  /**
   * Re-runs the last user message, dropping what the previous attempt produced. Turns fail for reasons that have
   * nothing to do with what was asked — a refused relay, a model that is unavailable — and retyping is otherwise the
   * only way back. Only the trailing message is replayed, so a prompt's own preamble stays where it is.
   */
  retry = async (): Promise<boolean> => {
    if (this.#active) return false;
    const at = this.#messages.findLastIndex((message) => message.role === "user" && !!message.text);
    if (at < 0) return false;
    const again = this.#messages[at];
    this.#messages = this.#messages.slice(0, at);
    await this.send([again]);
    return true;
  };

  /** Records a host-side failure (a prompt fetch, an upload) in the transcript, where every other failure lands. */
  report = (error: string) => {
    this.#append({ role: "assistant", error });
  };

  /** A line the host wrote — a command's own output. Rendered in the transcript, withheld from the model. */
  note = (text: string) => {
    this.#append({ role: "assistant", text, local: true });
  };

  async #assistantTurn(signal: AbortSignal): Promise<{ toolCalls: ToolCallRequest[]; stop: "end" | "toolUse" }> {
    const { tools, guides } = this.#surface.snapshot();
    const instructions = [this.#options.instructions, ...guides].filter(Boolean).join("\n\n");
    const request: RunnerRequest = {
      messages: this.#messages.filter((message) => !message.local),
      tools: tools.some((tool) => tool.name === AgentSession.askUserTool.name)
        ? tools
        : [...tools, AgentSession.askUserTool],
      context: this.#options.buildContext?.(this.#surface) ?? AgentSession.#defaultContext(this.#surface),
      ...(instructions ? { instructions } : {}),
      signal,
    };
    this.#append({ role: "assistant" });
    let text = "";
    const toolCalls: ToolCallRequest[] = [];
    let stop: "end" | "toolUse" = "end";
    for await (const event of this.#runner.run(request)) {
      if (signal.aborted) break;
      if (event.type === "text") {
        text += event.delta;
        this.#patchLast({ text });
      } else if (event.type === "toolCall") toolCalls.push({ id: event.id, name: event.name, args: event.args });
      else if (event.type === "done") stop = event.stop;
      else throw new Error(event.message);
    }
    if (toolCalls.length) this.#patchLast({ toolCalls });
    return { toolCalls, stop };
  }

  async #execute(call: ToolCallRequest, signal: AbortSignal): Promise<ToolCallResult> {
    const base = { id: call.id, name: call.name };
    const entry = this.#surface.tool(call.name);
    if (!entry) {
      if (call.name === AgentSession.askUserTool.name) return await this.#ask(call, signal);
      return { ...base, error: `Unknown tool: ${call.name}` };
    }
    const message = AgentSession.#confirmMessage(call.name, entry, call.args);
    if (message) {
      const approved = await this.#awaitApproval(call, message, signal);
      if (approved !== true) return { ...base, error: approved };
    }
    const before = this.#surface.snapshot();
    try {
      const result = await AgentProgress.run(
        (report) => {
          this.#progress = { ...report, callId: call.id };
          this.#notify();
        },
        () => this.#surface.call(call.name, call.args),
      );
      // A query reads and returns; anything else may still be landing, and a report taken now would describe the
      // screen as it was one tick before the call.
      if (entry.effect !== "query") await this.#options.settle?.();
      const changes = this.#surface.diffSince(before);
      return {
        ...base,
        ...(result !== undefined ? { result } : {}),
        ...(changes.length ? { changes } : {}),
      };
    } catch (error) {
      return { ...base, error: error instanceof Error ? error.message : String(error) };
    } finally {
      if (this.#progress?.callId === call.id) {
        this.#progress = null;
        this.#notify();
      }
    }
  }

  /** `null` when the user declined or no ask is configured: both mean stop and record why. */
  async #askToContinue(turns: number, signal: AbortSignal): Promise<string | null> {
    const ask = this.#options.continueAsk;
    if (!ask) return null;
    const settled = await this.#awaitAnswer(`continue-${turns}`, ask.question, [ask.keep], false, signal);
    if ("error" in settled) return null;
    return Array.isArray(settled.result) ? settled.result.join(", ") : settled.result;
  }

  /** No surface call and so no diff to report: the only thing this changes is what the model knows. */
  async #ask(call: ToolCallRequest, signal: AbortSignal): Promise<ToolCallResult> {
    const base = { id: call.id, name: call.name };
    const question = typeof call.args.question === "string" ? call.args.question.trim() : "";
    if (!question) return { ...base, error: "askUser needs a question to ask." };
    // Deduped and trimmed because the answer is the choice's own text — two identical options cannot be told apart.
    const choices = [
      ...new Set(
        (Array.isArray(call.args.choices) ? call.args.choices : [])
          .filter((choice): choice is string => typeof choice === "string")
          .map((choice) => choice.trim())
          .filter(Boolean),
      ),
    ];
    const multiple = call.args.multiple === true && choices.length > 1;
    return { ...base, ...(await this.#awaitAnswer(call.id, question, choices, multiple, signal)) };
  }

  #awaitAnswer(
    callId: string,
    question: string,
    choices: string[],
    multiple: boolean,
    signal: AbortSignal,
  ): Promise<{ result: string | string[] } | { error: string }> {
    return new Promise((resolve) => {
      const settle = (value: { result: string | string[] } | { error: string }) => {
        this.#question = null;
        signal.removeEventListener("abort", onAbort);
        this.#notify();
        resolve(value);
      };
      const onAbort = () => settle({ error: "The user aborted the turn." });
      signal.addEventListener("abort", onAbort);
      this.#question = {
        callId,
        question,
        choices,
        multiple,
        answer: (value) => settle({ result: value }),
        dismiss: (reason) => settle({ error: reason ?? "The user dismissed the question without answering it." }),
      };
      this.#notify();
    });
  }

  #awaitApproval(call: ToolCallRequest, message: string, signal: AbortSignal): Promise<true | string> {
    return new Promise((resolve) => {
      const settle = (value: true | string) => {
        this.#pending = null;
        signal.removeEventListener("abort", onAbort);
        this.#notify();
        resolve(value);
      };
      const onAbort = () => settle("The user aborted the turn.");
      signal.addEventListener("abort", onAbort);
      this.#pending = {
        callId: call.id,
        name: call.name,
        args: call.args,
        message,
        approve: () => settle(true),
        reject: (reason) => settle(reason ?? "The user declined."),
      };
      this.#notify();
    });
  }

  static #confirmMessage(name: string, entry: ToolEntry, args: Record<string, unknown>): string | null {
    const confirm = entry.confirm;
    if (confirm === undefined || confirm === false) return null;
    if (typeof confirm === "string") return confirm;
    const verdict = confirm === true ? true : confirm(args);
    if (verdict === false) return null;
    return verdict === true ? `Run ${name}?` : verdict;
  }

  static #defaultContext(surface: SurfaceView): ContextBlock[] {
    const { resources, scopes } = surface.snapshot();
    return [
      ...(scopes.length ? [{ kind: "screen", scopes }] : []),
      ...(resources.length ? [{ kind: "resources", resources }] : []),
    ];
  }

  /** Recorded on the open assistant draft when there is one, so a failed turn reads as that turn failing. */
  #fail(message: string) {
    const last = this.#messages[this.#messages.length - 1];
    if (last?.role === "assistant" && !last.error) this.#patchLast({ error: message });
    else this.#append({ role: "assistant", error: message });
  }

  #append(message: ChatMessage) {
    this.#messages = [...this.#messages, message];
    this.#notify();
  }

  #patchLast(patch: Partial<ChatMessage>) {
    const last = this.#messages[this.#messages.length - 1];
    if (!last) return;
    this.#messages = [...this.#messages.slice(0, -1), { ...last, ...patch }];
    this.#notify();
  }

  #notify() {
    this.#version += 1;
    for (const listener of this.#listeners) listener();
    this.#schedulePersist();
  }

  /** Debounced: streaming patches the last message on every delta, and a save per delta would thrash storage. */
  #schedulePersist() {
    const history = this.#options.history;
    if (!history) return;
    if (this.#saveTimer) clearTimeout(this.#saveTimer);
    this.#saveTimer = setTimeout(() => {
      this.#saveTimer = null;
      try {
        history.save(this.#messages);
      } catch {
        // History is best-effort; a full or blocked storage never breaks the chat.
      }
    }, 300);
  }

  static #restored(history: SessionHistory | undefined): ChatMessage[] {
    if (!history) return [];
    try {
      const messages = history.load();
      if (!Array.isArray(messages)) return [];
      // An assistant draft that never settled (a reload mid-turn) carries nothing worth replaying.
      return messages.filter(
        (message) => message.role !== "assistant" || !!message.text || !!message.toolCalls?.length || !!message.error,
      );
    } catch {
      return [];
    }
  }
}
