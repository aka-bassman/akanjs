import { type Dayjs, dayjs } from "akanjs/base";
import { Logger } from "akanjs/common";

export interface RateCounter {
  incr(topic: string, key: string, by?: number, option?: { expireAt?: Dayjs }): Promise<number>;
}

export interface RateBudget {
  calls: number;
  windowMs: number;
}

export type RateVerdict = { ok: true } | { ok: false; retryAfterMs: number };

interface RateWindow {
  start: number;
  count: number;
  windowMs: number;
}

// With a shared counter, epoch-aligned windows make every instance draw on one budget; a counter that fails falls
// back to counting in this process rather than refusing every call.
export class RateLimiter {
  static readonly #logger = new Logger("RateLimiter");
  static readonly #sweepEveryMs = 60_000;

  readonly #topic: string;
  readonly #shared: RateCounter | null;
  readonly #windows = new Map<string, RateWindow>();
  #sweptAt = 0;
  #sharedFailed = false;

  constructor(shared: RateCounter | null = null, { topic = "rate" }: { topic?: string } = {}) {
    this.#shared = shared;
    this.#topic = topic;
  }

  get isShared() {
    return this.#shared !== null;
  }

  async consume(key: string, budget: RateBudget, now = Date.now()): Promise<RateVerdict> {
    const calls = Math.max(1, Math.floor(budget.calls));
    const windowMs = Math.max(1, Math.floor(budget.windowMs));
    this.#sweep(now);
    if (this.#shared) {
      const window = Math.floor(now / windowMs);
      const end = (window + 1) * windowMs;
      try {
        const count = await this.#shared.incr(this.#topic, `${key}:${windowMs}:${window}`, 1, {
          expireAt: dayjs(end + windowMs),
        });
        this.#sharedFailed = false;
        return count > calls ? { ok: false, retryAfterMs: Math.max(1, end - now) } : { ok: true };
      } catch (error) {
        if (!this.#sharedFailed)
          RateLimiter.#logger.warn(
            `Rate limit "${this.#topic}" cannot reach the cache, so each instance counts its own window until it can: ${String(error)}`,
          );
        this.#sharedFailed = true;
      }
    }
    const bucket = this.#windowOf(`${key}:${windowMs}`, windowMs, now);
    if (bucket.count >= calls) return { ok: false, retryAfterMs: Math.max(1, bucket.start + windowMs - now) };
    bucket.count += 1;
    return { ok: true };
  }

  #windowOf(key: string, windowMs: number, now: number) {
    const found = this.#windows.get(key);
    if (found && now - found.start < windowMs) return found;
    const bucket: RateWindow = { start: now, count: 0, windowMs };
    this.#windows.set(key, bucket);
    return bucket;
  }

  #sweep(now: number) {
    if (now - this.#sweptAt < RateLimiter.#sweepEveryMs) return;
    this.#sweptAt = now;
    for (const [key, bucket] of this.#windows) if (now - bucket.start >= bucket.windowMs) this.#windows.delete(key);
  }
}
