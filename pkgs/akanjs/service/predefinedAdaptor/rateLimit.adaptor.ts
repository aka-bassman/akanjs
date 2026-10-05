import { adapt } from "../adapt";
import { type RateBudget, RateLimiter, type RateVerdict } from "../rateLimiter";
import { CacheAdaptorRole } from "./role.adaptor";

/** Counts a business key (a phone number, an email) across instances; unlike an endpoint's budget, no env turns it off. */
export class RateLimit extends adapt("rateLimit", ({ plug }) => ({
  cache: plug(CacheAdaptorRole),
})) {
  #limiter: RateLimiter | null = null;

  async consume(key: string, budget: RateBudget): Promise<RateVerdict> {
    this.#limiter ??= new RateLimiter(this.cache, { topic: "rateLimit" });
    return await this.#limiter.consume(key, budget);
  }
}
