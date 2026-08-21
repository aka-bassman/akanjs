import type {
  AgentRunner,
  ChatMessage,
  ContextBlock,
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

/** Where a session keeps its transcript across page loads. Storage-neutral: the host decides what backs it. */
export interface SessionHistory {
  load(): ChatMessage[] | null;
  save(messages: readonly ChatMessage[]): void;
  clear(): void;
}

export interface AgentSessionOptions {
  instructions?: string;
  buildContext?: (surface: SurfaceView) => ContextBlock[];
  /** Assistant turns per send before the session stops the loop. */
  maxTurns?: number;
  /** Restores settled messages at construction and saves after every change, debounced. Failures are silent. */
  history?: SessionHistory;
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
  readonly #surface: SurfaceView;
  readonly #runner: AgentRunner;
  readonly #options: AgentSessionOptions;
  #messages: ChatMessage[] = [];
  #running = false;
  #pending: PendingApproval | null = null;
  #controller: AbortController | null = null;
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
    const controller = new AbortController();
    this.#controller = controller;
    if (typeof input === "string") this.#append({ role: "user", text: input });
    else for (const message of input) this.#append(message);
    const maxTurns = this.#options.maxTurns ?? 8;
    try {
      for (let turn = 0; turn < maxTurns; turn += 1) {
        if (controller.signal.aborted) return;
        const { toolCalls, stop } = await this.#assistantTurn(controller.signal);
        if (controller.signal.aborted || stop !== "toolUse" || !toolCalls.length) return;
        const toolResults: ToolCallResult[] = [];
        for (const call of toolCalls) {
          if (controller.signal.aborted) break;
          toolResults.push(await this.#execute(call, controller.signal));
        }
        this.#append({ role: "tool", toolResults });
      }
      this.#fail(`Stopped after ${maxTurns} assistant turns without a final answer.`);
    } catch (error) {
      if (!controller.signal.aborted) this.#fail(error instanceof Error ? error.message : String(error));
    } finally {
      this.#running = false;
      this.#controller = null;
      this.#pending = null;
      this.#notify();
    }
  };

  abort = () => {
    this.#controller?.abort();
  };

  /** Empties the transcript and the persisted history. A running turn keeps its transcript. */
  reset = () => {
    if (this.#running) return;
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

  /** Records a host-side failure (a prompt fetch, an upload) in the transcript, where every other failure lands. */
  report = (error: string) => {
    this.#append({ role: "assistant", error });
  };

  async #assistantTurn(signal: AbortSignal): Promise<{ toolCalls: ToolCallRequest[]; stop: "end" | "toolUse" }> {
    const { tools, guides } = this.#surface.snapshot();
    const instructions = [this.#options.instructions, ...guides].filter(Boolean).join("\n\n");
    const request: RunnerRequest = {
      messages: this.#messages,
      tools,
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
    if (!entry) return { ...base, error: `Unknown tool: ${call.name}` };
    const message = AgentSession.#confirmMessage(call.name, entry, call.args);
    if (message) {
      const approved = await this.#awaitApproval(call, message, signal);
      if (approved !== true) return { ...base, error: approved };
    }
    const before = this.#surface.snapshot();
    try {
      const result = await this.#surface.call(call.name, call.args);
      const changes = this.#surface.diffSince(before);
      return {
        ...base,
        ...(result !== undefined ? { result } : {}),
        ...(changes.length ? { changes } : {}),
      };
    } catch (error) {
      return { ...base, error: error instanceof Error ? error.message : String(error) };
    }
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
