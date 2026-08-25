import { AgentAbort, AgentProgress } from "use-agentic";

/** The reading half of the store an in-page wait needs. `AgentBridge` is one; a test can be another. */
export interface StateSource {
  read(key: string, viewKey?: string): unknown;
  subscribe(listener: () => void): () => void;
}

export interface StateWaitOptions {
  key: string;
  viewKey?: string;
  /** Settle when the key reads exactly this. Null waits for it to change from whatever it holds now. */
  equals?: string | null;
  /** Straight off the tool argument, so it may be anything; `StateWait.seconds` is what makes it a number. */
  seconds?: unknown;
}

/**
 * One `waitFor` call: park until a published state key settles, or until the timeout says how it is going.
 *
 * Two clocks, because neither covers the other. The store's own subscription catches the value changing, which is
 * the whole point of the tool and has to land immediately. The tick catches what the store never announces —
 * `retainLive` / `releaseLive` mutate the live-key map without notifying any listener, so a page navigated away
 * from mid-wait would otherwise hold the turn until the timeout — and the countdown row needs a tick anyway.
 *
 * Nothing here throws on a wait that ran out. A key still reading `generating` after two minutes is an answer, not
 * a failure, and the model is the one that decides whether to wait again.
 */
export class StateWait {
  static readonly tickMs = 1000;
  static readonly defaultSeconds = 120;
  static readonly maxSeconds = 600;

  /** Clamped rather than refused: a model that asks for an hour gets the longest wait on offer and reads how long. */
  static seconds(value: unknown): number {
    if (typeof value !== "number" || !Number.isFinite(value)) return StateWait.defaultSeconds;
    return Math.min(Math.max(Math.round(value), 1), StateWait.maxSeconds);
  }

  /** A string is itself; everything else is JSON, so a number, a boolean and null each compare as they are written. */
  static print(value: unknown): string {
    if (typeof value === "string") return value;
    try {
      return JSON.stringify(value) ?? String(value);
    } catch {
      return String(value);
    }
  }

  readonly #source: StateSource;
  readonly #key: string;
  readonly #viewKey: string;
  readonly #equals: string | null;
  readonly #seconds: number;
  #was = "";
  #now = "";
  #elapsed = 0;
  #settled: boolean = false;
  #ticker: ReturnType<typeof setInterval> | undefined;
  #unsubscribe: (() => void) | undefined;
  #signal: AbortSignal | null = null;
  #resolve: ((message: string) => void) | null = null;
  #reject: ((error: Error) => void) | null = null;

  constructor(source: StateSource, { key, viewKey = "", equals = null, seconds }: StateWaitOptions) {
    this.#source = source;
    this.#key = key;
    this.#viewKey = viewKey;
    this.#equals = equals;
    this.#seconds = StateWait.seconds(seconds);
  }

  run(): Promise<string> {
    this.#was = StateWait.print(this.#source.read(this.#key, this.#viewKey));
    this.#now = this.#was;
    if (this.#equals !== null && this.#was === this.#equals)
      return Promise.resolve(`${this.#key} is already ${this.#was}.`);
    return new Promise<string>((resolve, reject) => {
      this.#resolve = resolve;
      this.#reject = reject;
      this.#signal = AgentAbort.current;
      if (this.#signal?.aborted) {
        this.#abort();
        return;
      }
      this.#signal?.addEventListener("abort", this.#abort);
      this.#unsubscribe = this.#source.subscribe(this.#check);
      this.#ticker = setInterval(this.#tick, StateWait.tickMs);
      AgentProgress.report("", { done: 0, total: this.#seconds });
    });
  }

  /** The session races every call against the same signal; honouring it here is what stops the timer. */
  #abort = () => {
    this.#stop();
    this.#reject?.(new Error("The user aborted the turn."));
  };

  #check = () => {
    if (this.#settled) return;
    let now: string;
    try {
      now = StateWait.print(this.#source.read(this.#key, this.#viewKey));
    } catch (error) {
      // The key stopped being part of the surface — an unmount, a navigation. Waiting on it can never end well.
      this.#end(`Stopped waiting: ${error instanceof Error ? error.message : String(error)}`);
      return;
    }
    this.#now = now;
    if (this.#equals === null ? now !== this.#was : now === this.#equals) this.#end(`${this.#key} is now ${now}.`);
  };

  #tick = () => {
    this.#check();
    if (this.#settled) return;
    this.#elapsed += 1;
    if (this.#elapsed >= this.#seconds) {
      this.#end(
        `${this.#key} is still ${this.#now} after ${this.#seconds}s. Call waitFor again to keep waiting, or tell the user it is taking longer than expected.`,
      );
      return;
    }
    AgentProgress.report("", { done: this.#elapsed, total: this.#seconds });
  };

  #end(message: string) {
    this.#stop();
    this.#resolve?.(message);
  }

  #stop() {
    this.#settled = true;
    clearInterval(this.#ticker);
    this.#ticker = undefined;
    this.#unsubscribe?.();
    this.#unsubscribe = undefined;
    this.#signal?.removeEventListener("abort", this.#abort);
  }
}
