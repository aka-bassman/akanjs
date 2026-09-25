import { Logger } from "akanjs/common";

export interface InterruptTeardownHooks {
  exit?: (code: number) => void;
  listen?: (onSignal: () => void) => void;
  report?: (message: string) => void;
}

/**
 * The session's only SIGINT listener, installed by whichever teardown registers first.
 *
 * Registering any listener replaces the kernel's "terminate now" with the callback, so a teardown that forgets
 * to exit leaves Ctrl+C doing nothing at all, and two that each exit cut one another short — whichever finishes
 * first takes the process with it. Both failures are silent, and both are why the teardowns collect here
 * instead of taking a listener each: they run together, and the exit happens once, after all of them.
 */
export class InterruptTeardown {
  readonly #teardowns: { run: () => Promise<void>; abandoned: string; running: boolean }[] = [];
  readonly #exit: (code: number) => void;
  readonly #listen: (onSignal: () => void) => void;
  readonly #report: (message: string) => void;
  #interrupted: boolean = false;
  /**
   * False when something else drives the shutdown — a supervised session's `DevSupervisor` resolves on this
   * same signal and stops the children and the database itself, so exiting here would abandon both.
   */
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
      // Caught per teardown rather than across them: `Promise.all` rejects on the first failure, and the exit
      // would then run while the others are still tearing down.
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
