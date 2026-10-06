import { describe, expect, test } from "bun:test";
import { type RateCounter, RateLimiter } from "./rateLimiter";

const makeCounter = () => {
  const counts = new Map<string, number>();
  return {
    counts,
    incr: async (topic: string, key: string, by = 1) => {
      const next = (counts.get(`${topic}|${key}`) ?? 0) + by;
      counts.set(`${topic}|${key}`, next);
      return next;
    },
  } satisfies RateCounter & { counts: Map<string, number> };
};

describe("RateLimiter", () => {
  test("keeps a window per key and per window length, and says when it ends", async () => {
    const limiter = new RateLimiter();
    const perSecond = { calls: 1, windowMs: 1_000 };

    expect(await limiter.consume("a", perSecond, 0)).toEqual({ ok: true });
    expect(await limiter.consume("a", perSecond, 10)).toEqual({ ok: false, retryAfterMs: 990 });
    expect(await limiter.consume("a", { calls: 1, windowMs: 5_000 }, 10)).toEqual({ ok: true });
    expect(await limiter.consume("b", perSecond, 10)).toEqual({ ok: true });
    expect(await limiter.consume("a", perSecond, 1_000)).toEqual({ ok: true });
  });

  test("instances sharing a counter draw on one budget, and each topic counts apart", async () => {
    const counter = makeCounter();
    const [one, two] = [0, 1].map(() => new RateLimiter(counter, { topic: "otp" }));
    const other = new RateLimiter(counter, { topic: "signin" });
    const budget = { calls: 2, windowMs: 60_000 };

    expect((await one.consume("phone", budget, 0)).ok).toBe(true);
    expect((await two.consume("phone", budget, 1)).ok).toBe(true);
    expect(await one.consume("phone", budget, 2)).toEqual({ ok: false, retryAfterMs: 59_998 });
    expect((await other.consume("phone", budget, 3)).ok).toBe(true);
  });
});
