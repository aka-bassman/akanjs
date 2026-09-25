import type { Logger } from "akanjs/common";

export class ShutdownManager {
  /**
   * Registers process-level handlers that drive `onShutdown` on:
   *   - SIGTERM / SIGINT (graceful stop → exit(0) on success, exit(1) on error)
   *   - uncaughtException (best-effort stop → exit(1))
   *   - unhandledRejection (logged at error, process kept alive; see `#isFatalUnhandledRejection`)
   *
   * Kept separate from `AkanServer` so the server class doesn't have to know about
   * Node-level process events, and so tests can opt out by not calling it.
   */
  static register(logger: Logger, onShutdown: () => Promise<void>): void {
    const signals: NodeJS.Signals[] = ["SIGTERM", "SIGINT"];

    for (const signal of signals) {
      process.on(signal, async () => {
        logger.debug(`Received ${signal}, starting graceful shutdown...`);
        try {
          await onShutdown();
          process.exit(0);
        } catch (error) {
          logger.error(`Failed to shutdown gracefully: ${error instanceof Error ? error.message : String(error)}`);
          process.exit(1);
        }
      });
    }

    process.on("uncaughtException", async (error) => {
      logger.error(`Uncaught exception: ${ShutdownManager.#formatError(error)}`);
      try {
        await onShutdown();
        process.exit(1);
      } catch {
        process.exit(1);
      }
    });

    process.on("unhandledRejection", async (reason) => {
      logger.error(`Unhandled rejection: ${ShutdownManager.#formatError(reason)}`);
      if (!ShutdownManager.#isFatalUnhandledRejection()) return;
      try {
        await onShutdown();
        process.exit(1);
      } catch {
        process.exit(1);
      }
    });
  }

  /**
   * A rejected promise nobody awaited is scoped to whatever built it, so it cannot leave the process in the
   * unknown state an `uncaughtException` does — while exiting over one drops every other in-flight request,
   * every websocket, and (under federation) restarts the replica. React's streaming SSR is the case that forced
   * this: it rejects `stream.allReady` for a post-shell render failure and holds no handler of its own, so one
   * page's boundary error used to kill a whole child. Set `AKAN_FATAL_UNHANDLED_REJECTION=1` to restore the
   * exit for a deployment that would rather crash than serve on.
   */
  static #isFatalUnhandledRejection(): boolean {
    const flag = process.env.AKAN_FATAL_UNHANDLED_REJECTION;
    return flag === "1" || flag === "true";
  }

  static #formatError(error: unknown): string {
    return error instanceof Error ? (error.stack ?? error.message) : String(error);
  }
}
