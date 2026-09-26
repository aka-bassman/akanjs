import { Logger } from "akanjs/common";

export interface InterruptTeardownHooks {
  exit?: (code: number) => void;
  listen?: (onSignal: () => void) => void;
  report?: (message: string) => void;
}

// The session's only SIGINT listener: a listener replaces Ctrl+C's default exit, and two that each exit cut one
// another short, so teardowns collect here and the exit runs once, after all of them.
export class InterruptTeardown {
  readonly #teardowns: { run: () => Promise<void>; abandoned: string; running: boolean }[] = [];
  readonly #exit: (code: number) => void;
  readonly #listen: (onSignal: () => void) => void;
  readonly #report: (message: string) => void;
  #interrupted: boolean = false;
  /** False when a supervised session's `DevSupervisor` drives the shutdown on this same signal. */
  ownsExit: boolean = true;

  constructor({ exit, listen, report }: InterruptTeardownHooks = {}) {
    this.#exit = exit ?? ((code) => process.exit(code));
    this.#listen =
      listen ??
      ((onSignal) => {
        process.on("SIGINT", onSignal);
      });
    this.#report = report ?? ((message) => Logger.rawLog(message, undefined, "error"));
  }

  add(run: () => Promise<void>, abandoned: string) {
    this.#teardowns.push({ run, abandoned, running: false });
    if (this.#teardowns.length === 1) this.#listen(() => this.#onSignal());
  }

  #onSignal() {
    if (this.#interrupted) {
      for (const one of this.#teardowns) if (one.running) this.#report(one.abandoned);
      this.#exit(130);
      return;
    }
    this.#interrupted = true;
    void Promise.all(
      // Caught per teardown: `Promise.all` rejects on the first failure and would exit mid-teardown.
      this.#teardowns.map(async (one) => {
        one.running = true;
        await one.run().catch(() => undefined);
        one.running = false;
      }),
    ).finally(() => {
      if (this.ownsExit) this.#exit(0);
    });
  }
}
