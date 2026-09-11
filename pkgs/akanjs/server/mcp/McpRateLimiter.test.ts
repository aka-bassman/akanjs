import { describe, expect, test } from "bun:test";
import { McpRateLimiter } from "./McpRateLimiter";

describe("McpRateLimiter", () => {
  test("counts calls per caller inside a fixed window and says when the window ends", () => {
    const limiter = new McpRateLimiter({ calls: 2, windowMs: 10_000, concurrent: 0 });
    const first = limiter.acquire("a", 1_000);
    const second = limiter.acquire("a", 2_000);
    expect(first.ok && second.ok).toBe(true);
    const third = limiter.acquire("a", 3_000);
    expect(third).toEqual({ ok: false, reason: "calls", retryAfterMs: 8_000 });
    // Another caller has a budget of its own.
    expect(limiter.acquire("b", 3_000).ok).toBe(true);
    // The window is fixed from the first call, so at its end the same caller starts over.
    expect(limiter.acquire("a", 11_000).ok).toBe(true);
  });

  test("caps calls in flight and frees a slot exactly once", () => {
    const limiter = new McpRateLimiter({ calls: 0, windowMs: 60_000, concurrent: 1 });
    const held = limiter.acquire("a");
    if (!held.ok) throw new Error("expected a slot");
    expect(limiter.acquire("a")).toMatchObject({ ok: false, reason: "concurrent" });
    held.release();
    held.release();
    const next = limiter.acquire("a");
    expect(next.ok).toBe(true);
    expect(limiter.acquire("a")).toMatchObject({ ok: false, reason: "concurrent" });
  });

  test("a slot held across the window boundary is still counted as in flight", () => {
    const limiter = new McpRateLimiter({ calls: 5, windowMs: 1_000, concurrent: 1 });
    const held = limiter.acquire("a", 0);
    expect(held.ok).toBe(true);
    expect(limiter.acquire("a", 5_000)).toMatchObject({ ok: false, reason: "concurrent" });
  });

  test("describes itself for the boot log", () => {
    expect(new McpRateLimiter().describe()).toBe("120 calls / 60s, 8 in flight, per caller");
    expect(new McpRateLimiter({ calls: 0, concurrent: 0 }).describe()).toBe(
      "unlimited calls, unlimited in flight, per caller",
    );
  });
});
