import type { BuilderCsrRes, BuilderRes } from "akanjs/server";

/**
 * Sends a builder's answer to a backend request and reports when it has actually left the process.
 *
 * `process.exit` truncates an ipc write that has not flushed yet, and anything past the pipe buffer
 * (~64KiB) needs the sender to stay alive to drain it — a `build-route-res` carrying a manifest delta is
 * routinely larger than that. Measured on bun 1.3: a 100KB reply sent immediately before
 * `process.exit(0)` was lost 20/20 times, and arrived 20/20 times when the exit waited for the flush
 * callback. That made the recycle drain, which exists to release bundler memory, eat the answer of
 * whatever route build it happened to be draining.
 */
export class BuilderReply {
  /** Bound so a runtime that ever stops invoking the callback costs one late reply instead of wedging
   * the shutdown drain until the host's kill watchdog fires. */
  static readonly #flushTimeoutMs = 5_000;

  static async send(res: BuilderRes | BuilderCsrRes): Promise<void> {
    const send = process.send;
    if (!send) return;
    await new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, BuilderReply.#flushTimeoutMs);
      // A failed send has nothing to retry — the host answers the id itself when this process exits.
      send.call(process, res, undefined, undefined, () => {
        clearTimeout(timer);
        resolve();
      });
    });
  }
}
