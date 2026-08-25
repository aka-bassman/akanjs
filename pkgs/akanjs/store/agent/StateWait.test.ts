import { describe, expect, test } from "bun:test";
import { AgentAbort } from "use-agentic";
import { type StateSource, StateWait } from "./StateWait";

const sourceOf = (initial: unknown) => {
  const listeners = new Set<() => void>();
  let value = initial;
  let failure: Error | null = null;
  return {
    get watchers() {
      return listeners.size;
    },
    set(next: unknown) {
      value = next;
      for (const listener of [...listeners]) listener();
    },
    fail(error: Error) {
      failure = error;
      for (const listener of [...listeners]) listener();
    },
    source: {
      read: () => {
        if (failure) throw failure;
        return value;
      },
      subscribe: (listener: () => void) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    } satisfies StateSource,
  };
};

describe("StateWait", () => {
  test("settles the moment the key changes, and lets go of the store", async () => {
    const held = sourceOf("generating");
    const waiting = new StateWait(held.source, { key: "videoStatus" }).run();
    expect(held.watchers).toBe(1);
    held.set("ready");
    expect(await waiting).toBe("videoStatus is now ready.");
    expect(held.watchers).toBe(0);
  });

  test("equals waits for that one value and is not fooled by a change to another", async () => {
    const held = sourceOf("queued");
    const waiting = new StateWait(held.source, { key: "videoStatus", equals: "ready" }).run();
    held.set("generating");
    await Promise.resolve();
    expect(held.watchers).toBe(1);
    held.set("ready");
    expect(await waiting).toBe("videoStatus is now ready.");
  });

  test("a key that already reads the value answers without waiting at all", async () => {
    const held = sourceOf("ready");
    expect(await new StateWait(held.source, { key: "videoStatus", equals: "ready" }).run()).toBe(
      "videoStatus is already ready.",
    );
    expect(held.watchers).toBe(0);
  });

  test("non-strings compare as they are written, so a number and a boolean are reachable", async () => {
    const held = sourceOf(0);
    const waiting = new StateWait(held.source, { key: "progress", equals: "100" }).run();
    held.set(100);
    expect(await waiting).toBe("progress is now 100.");
  });

  test("a key that stops being readable ends the wait rather than holding the turn", async () => {
    const held = sourceOf("generating");
    const waiting = new StateWait(held.source, { key: "videoStatus" }).run();
    held.fail(new Error('State key "videoStatus" is not read by this screen.'));
    expect(await waiting).toBe('Stopped waiting: State key "videoStatus" is not read by this screen.');
    expect(held.watchers).toBe(0);
  });

  test("running out reports what the key holds now, and says it is not a failure", async () => {
    const held = sourceOf("queued");
    const waiting = new StateWait(held.source, { key: "videoStatus", equals: "ready", seconds: 1 }).run();
    held.set("generating");
    const answer = await waiting;
    expect(answer).toContain("videoStatus is still generating after 1s.");
    expect(answer).toContain("Call waitFor again");
    expect(held.watchers).toBe(0);
  });

  test("an abort mid-wait rejects and drops the timer with it", async () => {
    const held = sourceOf("generating");
    const controller = new AbortController();
    const waiting = AgentAbort.run(controller.signal, () => new StateWait(held.source, { key: "videoStatus" }).run());
    expect(held.watchers).toBe(1);
    controller.abort();
    await expect(waiting).rejects.toThrow("The user aborted the turn.");
    expect(held.watchers).toBe(0);
  });

  test("the timeout is clamped rather than refused, so no wait outlives the maximum", () => {
    expect(StateWait.seconds(undefined)).toBe(StateWait.defaultSeconds);
    expect(StateWait.seconds("soon")).toBe(StateWait.defaultSeconds);
    expect(StateWait.seconds(0)).toBe(1);
    expect(StateWait.seconds(3600)).toBe(StateWait.maxSeconds);
    expect(StateWait.seconds(30.4)).toBe(30);
  });
});
