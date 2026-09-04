import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import type { Logger } from "akanjs/common";

import { ShutdownManager } from "./shutdownManager";

type ProcessEvent = "SIGTERM" | "SIGINT" | "uncaughtException" | "unhandledRejection";
const events: ProcessEvent[] = ["SIGTERM", "SIGINT", "uncaughtException", "unhandledRejection"];

const loggerStub = () => {
  const errors: string[] = [];
  const logger = {
    debug: () => {},
    error: (message: string) => errors.push(message),
  } as unknown as Logger;
  return { logger, errors };
};

/**
 * `register` installs process-wide listeners, so each test records what it added and removes exactly those —
 * leaving the test runner's own handlers in place. The added listener is then invoked directly rather than
 * through `process.emit`, which would also fire the runner's handler and fail the suite on a rejection the
 * test raised on purpose.
 */
describe("ShutdownManager", () => {
  let before: Map<ProcessEvent, unknown[]>;
  let exitCalls: number[];
  let realExit: typeof process.exit;

  const added = (event: ProcessEvent): ((reason: unknown) => void) => {
    const previous = before.get(event) ?? [];
    const listener = process.listeners(event).find((candidate) => !previous.includes(candidate));
    if (!listener) throw new Error(`no listener was added for ${event}`);
    return listener as (reason: unknown) => void;
  };

  beforeEach(() => {
    before = new Map(events.map((event) => [event, [...process.listeners(event)]]));
    exitCalls = [];
    realExit = process.exit;
    process.exit = ((code?: number) => {
      exitCalls.push(code ?? 0);
    }) as typeof process.exit;
  });

  afterEach(() => {
    process.exit = realExit;
    for (const event of events) {
      const previous = before.get(event) ?? [];
      for (const listener of process.listeners(event)) {
        if (!previous.includes(listener)) process.removeListener(event, listener as never);
      }
    }
    delete process.env.AKAN_FATAL_UNHANDLED_REJECTION;
  });

  test("logs an unhandled rejection and keeps the process alive", async () => {
    const { logger, errors } = loggerStub();
    let shutdowns = 0;
    ShutdownManager.register(logger, async () => {
      shutdowns += 1;
    });

    await added("unhandledRejection")(new Error("post-shell fatal"));

    expect(errors[0]).toContain("post-shell fatal");
    expect(shutdowns).toBe(0);
    expect(exitCalls).toEqual([]);
  });

  test("still exits when AKAN_FATAL_UNHANDLED_REJECTION is set", async () => {
    process.env.AKAN_FATAL_UNHANDLED_REJECTION = "1";
    const { logger } = loggerStub();
    let shutdowns = 0;
    ShutdownManager.register(logger, async () => {
      shutdowns += 1;
    });

    await added("unhandledRejection")(new Error("post-shell fatal"));

    expect(shutdowns).toBe(1);
    expect(exitCalls).toEqual([1]);
  });

  test("an uncaught exception stays fatal", async () => {
    const { logger, errors } = loggerStub();
    let shutdowns = 0;
    ShutdownManager.register(logger, async () => {
      shutdowns += 1;
    });

    await added("uncaughtException")(new Error("corrupt state"));

    expect(errors[0]).toContain("corrupt state");
    expect(shutdowns).toBe(1);
    expect(exitCalls).toEqual([1]);
  });
});
