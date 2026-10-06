import { describe, expect, test } from "bun:test";
import { RateLimit } from "./rateLimit.adaptor";

describe("RateLimit", () => {
  test("counts a business key in the shared cache under its own topic", async () => {
    const keys: string[] = [];
    const counts = new Map<string, number>();
    const rateLimit = new RateLimit();
    Object.defineProperty(rateLimit, "cache", {
      value: {
        incr: async (topic: string, key: string) => {
          keys.push(`${topic}|${key}`);
          const next = (counts.get(key) ?? 0) + 1;
          counts.set(key, next);
          return next;
        },
      },
    });
    const budget = { calls: 1, windowMs: 3_600_000 };

    expect(await rateLimit.consume("otp:01012345678", budget)).toEqual({ ok: true });
    expect((await rateLimit.consume("otp:01012345678", budget)).ok).toBe(false);
    expect(keys.every((key) => key.startsWith("rateLimit|otp:01012345678:3600000:"))).toBe(true);
  });
});
