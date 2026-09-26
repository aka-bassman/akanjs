import { AsyncLocalStorage } from "node:async_hooks";

export interface McpProgressOption {
  /** Omit when the amount of work is not known up front. */
  total?: number;
  /** Shown to the user, so write prose rather than a status code. */
  message?: string;
}

export interface McpProgressReport extends McpProgressOption {
  progress: number;
}

/**
 * Reached through `AsyncLocalStorage` so any frame of the work can report; outside a streamed call `report` is a
 * no-op, so the same endpoint runs unchanged over HTTP, a websocket or a test.
 */
export class McpProgress {
  static readonly #storage = new AsyncLocalStorage<McpProgress>();

  static report(progress: number, option: McpProgressOption = {}) {
    const channel = McpProgress.#storage.getStore();
    if (channel) channel.#push(progress, option);
  }

  static get streaming() {
    return !!McpProgress.#storage.getStore();
  }

  static async run<T>(channel: McpProgress, exec: () => Promise<T>): Promise<T> {
    return await McpProgress.#storage.run(channel, exec);
  }

  readonly #queue: McpProgressReport[] = [];
  readonly #abort = new AbortController();
  #wake: (() => void) | null = null;
  #start: (() => void) | null = null;
  #ended = false;

  /** Resolves on the first report, and never for a call that reports nothing. */
  readonly started: Promise<void>;

  constructor() {
    this.started = new Promise<void>((resolve) => {
      this.#start = resolve;
    });
  }

  /** Aborted when the client closes the response stream; an `exec` already in flight is not forced to stop. */
  get signal() {
    return this.#abort.signal;
  }

  async *reports(): AsyncGenerator<McpProgressReport> {
    // A report pushed in the same tick the call finished is still owed, so the queue keeps the loop alive past `end()`.
    // biome-ignore lint/suspicious/noUnnecessaryConditions: `end()` flips `#ended` from outside this generator while it is suspended in `yield`, which the analysis cannot see.
    while (!this.#ended || this.#queue.length) {
      for (const report of this.#queue.splice(0)) yield report;
      // Re-checked before parking: a report pushed while the consumer sat in `yield` found no `#wake` to call.
      // biome-ignore lint/suspicious/noUnnecessaryConditions: same as above — both operands change while this generator is suspended.
      if (this.#ended || this.#queue.length) continue;
      await new Promise<void>((resolve) => {
        this.#wake = resolve;
      });
    }
  }

  end() {
    this.#ended = true;
    this.#release();
  }

  abort() {
    this.#abort.abort();
    this.end();
  }

  #push(progress: number, { total, message }: McpProgressOption) {
    // biome-ignore lint/suspicious/noUnnecessaryConditions: a report can arrive after `end()`; dropping it is the point.
    if (this.#ended) return;
    this.#queue.push({
      progress,
      ...(total === undefined ? {} : { total }),
      ...(message ? { message } : {}),
    });
    this.#start?.();
    this.#start = null;
    this.#release();
  }

  #release() {
    this.#wake?.();
    this.#wake = null;
  }
}
