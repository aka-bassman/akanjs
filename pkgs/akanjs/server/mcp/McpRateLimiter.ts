export interface McpRateLimitOption {
  /** Calls one caller may make per window. `0` turns the counter off. */
  calls?: number;
  windowMs?: number;
  /** Calls one caller may have running at the same time. `0` turns the cap off. */
  concurrent?: number;
}

export type McpRateLimitVerdict =
  | { ok: true; release: () => void }
  | { ok: false; reason: "calls" | "concurrent"; retryAfterMs: number };

interface McpRateBucket {
  windowStart: number;
  count: number;
  inFlight: number;
}

/**
 * Per-caller budget for the MCP methods that execute an endpoint.
 *
 * Two limits because they stop two different loops. A fixed window of `calls` stops a model that re-reads a list
 * slice as fast as the client lets it; a cap on `concurrent` calls stops one that fans out a ten-second query in
 * parallel, which the window alone would admit until the window filled. Counted in this process only — a
 * deployment with N replicas grants N budgets — and keyed by the caller the router derives, so a reset is a
 * restart and nothing else.
 */
export class McpRateLimiter {
  static readonly defaults = { calls: 120, windowMs: 60_000, concurrent: 8 } as const;

  readonly calls: number;
  readonly windowMs: number;
  readonly concurrent: number;
  readonly #buckets = new Map<string, McpRateBucket>();
  #sweptAt = 0;

  constructor({
    calls = McpRateLimiter.defaults.calls,
    windowMs = McpRateLimiter.defaults.windowMs,
    concurrent = McpRateLimiter.defaults.concurrent,
  }: McpRateLimitOption = {}) {
    this.calls = Math.max(0, Math.floor(calls));
    this.windowMs = Math.max(1, Math.floor(windowMs));
    this.concurrent = Math.max(0, Math.floor(concurrent));
  }

  acquire(key: string, now = Date.now()): McpRateLimitVerdict {
    this.#sweep(now);
    const bucket = this.#bucketOf(key, now);
    if (this.concurrent && bucket.inFlight >= this.concurrent)
      return { ok: false, reason: "concurrent", retryAfterMs: 1_000 };
    if (this.calls && bucket.count >= this.calls)
      return { ok: false, reason: "calls", retryAfterMs: Math.max(1, bucket.windowStart + this.windowMs - now) };
    bucket.count += 1;
    bucket.inFlight += 1;
    let released = false;
    return {
      ok: true,
      release: () => {
        if (released) return;
        released = true;
        bucket.inFlight = Math.max(0, bucket.inFlight - 1);
      },
    };
  }

  describe() {
    const window = this.calls ? `${this.calls} calls / ${Math.round(this.windowMs / 1000)}s` : "unlimited calls";
    const inFlight = this.concurrent ? `${this.concurrent} in flight` : "unlimited in flight";
    return `${window}, ${inFlight}, per caller`;
  }

  #bucketOf(key: string, now: number) {
    const found = this.#buckets.get(key);
    if (found && now - found.windowStart < this.windowMs) return found;
    const bucket: McpRateBucket = { windowStart: now, count: 0, inFlight: found?.inFlight ?? 0 };
    this.#buckets.set(key, bucket);
    return bucket;
  }

  /** Buckets are dropped once idle for a window, so the map is bounded by the callers of the last window, not ever. */
  #sweep(now: number) {
    if (now - this.#sweptAt < this.windowMs) return;
    this.#sweptAt = now;
    for (const [key, bucket] of this.#buckets)
      if (!bucket.inFlight && now - bucket.windowStart >= this.windowMs) this.#buckets.delete(key);
  }
}
