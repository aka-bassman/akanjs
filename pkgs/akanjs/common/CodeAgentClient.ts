import {
  type CodeAgentCommand,
  type CodeAgentEvent,
  type CodeAgentFrame,
  type CodeAgentRequest,
  isCodeAgentReply,
} from "./codeAgentWire";

export interface CodeAgentTransport {
  send(line: string): void | Promise<void>;
  /** Called once with a handler that receives whole lines. */
  onLine(handler: (line: string) => void): void;
  close?(): void | Promise<void>;
}

interface PendingReply {
  resolve: (data: unknown) => void;
  reject: (error: Error) => void;
}

/**
 * Speaks the code-agent wire over any line transport — a child process's stdio, a websocket, an in-process pair.
 *
 * It has no dependencies because the browser holds one too. Everything host-specific (spawning, reconnecting,
 * authenticating) belongs to whoever builds the transport.
 */
export class CodeAgentClient {
  readonly #transport: CodeAgentTransport;
  readonly #pending = new Map<string, PendingReply>();
  readonly #listeners = new Set<(event: CodeAgentEvent) => void>();
  #nextId = 0;
  #lastSeq = 0;
  #buffer = "";

  constructor(transport: CodeAgentTransport) {
    this.#transport = transport;
    this.#transport.onLine((line) => this.#receive(line));
  }

  /** The highest sequence accepted. A reconnecting host replays from here. */
  get lastSeq() {
    return this.#lastSeq;
  }

  /** A new session restarts the sequence, so the watermark has to go with it or every frame reads as a duplicate. */
  resetSeq() {
    this.#lastSeq = 0;
  }

  on(listener: (event: CodeAgentEvent) => void) {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  async send(command: CodeAgentCommand): Promise<unknown> {
    this.#nextId += 1;
    const id = `c${this.#nextId}`;
    const request: CodeAgentRequest = { id, command };
    const promise = new Promise<unknown>((resolve, reject) => this.#pending.set(id, { resolve, reject }));
    await this.#transport.send(`${JSON.stringify(request)}\n`);
    return await promise;
  }

  async close() {
    for (const pending of this.#pending.values()) pending.reject(new Error("code agent transport closed"));
    this.#pending.clear();
    await this.#transport.close?.();
  }

  /** Feed raw chunks when the transport is byte-oriented rather than line-oriented. */
  push(chunk: string) {
    this.#buffer += chunk;
    let index = this.#buffer.indexOf("\n");
    while (index >= 0) {
      const line = this.#buffer.slice(0, index);
      this.#buffer = this.#buffer.slice(index + 1);
      if (line.trim()) this.#receive(line);
      index = this.#buffer.indexOf("\n");
    }
  }

  #receive(line: string) {
    let frame: CodeAgentFrame;
    try {
      frame = JSON.parse(line) as CodeAgentFrame;
    } catch {
      return;
    }
    if (isCodeAgentReply(frame)) {
      const pending = this.#pending.get(frame.id);
      if (!pending) return;
      this.#pending.delete(frame.id);
      if (frame.ok) pending.resolve(frame.data);
      else pending.reject(new Error(frame.error ?? "code agent command failed"));
      return;
    }
    if (frame.type !== "event") return;
    if (frame.event.seq <= this.#lastSeq) return;
    this.#lastSeq = frame.event.seq;
    for (const listener of this.#listeners) listener(frame.event);
  }
}
