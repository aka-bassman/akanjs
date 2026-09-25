import { describe, expect, test } from "bun:test";
import { Semaphore } from "./semaphore";

const track = (semaphore: Semaphore, count: number, task: (index: number) => Promise<unknown>) => {
  const state = { running: 0, peak: 0 };
  const runs = Array.from({ length: count }, (_, index) =>
    semaphore.run(async () => {
      state.running += 1;
      state.peak = Math.max(state.peak, state.running);
      try {
        return await task(index);
      } finally {
        state.running -= 1;
      }
    }),
  );
  return { state, runs };
};

describe("Semaphore", () => {
  test("never runs more than the limit at once", async () => {
    const { state, runs } = track(new Semaphore(2), 8, () => Bun.sleep(5));

    await Promise.all(runs);

    expect(state.peak).toBe(2);
    expect(state.running).toBe(0);
  });

  test("runs everything queued behind the limit", async () => {
    const done: number[] = [];
    const { runs } = track(new Semaphore(3), 12, async (index) => {
      await Bun.sleep(1);
      done.push(index);
    });

    await Promise.all(runs);

    expect(done.length).toBe(12);
    expect([...done].sort((a, b) => a - b)).toEqual([...Array(12).keys()]);
  });

  test("hands the slot on when a task throws", async () => {
    const semaphore = new Semaphore(1);
    const { state, runs } = track(semaphore, 4, async (index) => {
      await Bun.sleep(1);
      if (index % 2 === 0) throw new Error(`boom ${index}`);
      return index;
    });
    const results = await Promise.allSettled(runs);

    expect(results.map((result) => result.status)).toEqual(["rejected", "fulfilled", "rejected", "fulfilled"]);
    expect(state.peak).toBe(1);
    await expect(semaphore.run(async () => "still usable")).resolves.toBe("still usable");
  });

  test("treats a limit below one as one", async () => {
    const { state, runs } = track(new Semaphore(0), 4, () => Bun.sleep(2));

    await Promise.all(runs);

    expect(state.peak).toBe(1);
  });

  test("returns the task value", async () => {
    await expect(new Semaphore(2).run(async () => 41 + 1)).resolves.toBe(42);
  });
});
