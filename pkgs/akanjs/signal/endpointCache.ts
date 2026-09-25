import { type CacheAdaptor, CacheAdaptorRole } from "akanjs/service";
import dayjs from "dayjs";
import type { SignalContext } from "./signalContext";
import { traceCache } from "./trace";

/**
 * Serves an endpoint's own answer back for as long as its declared `cache` allows, and stands aside for every
 * endpoint that declared none — every call passes through here, so a TTL of its own would put a stale window on
 * every call in the app.
 *
 * It runs inside the call, after the guards and the internal arguments, never as a middleware: a middleware sits
 * ahead of the ones a lib registers (the account resolution among them), so a hit served there was judged by
 * guards that could not yet see who was asking. Here a hit reaches only a caller the guards already admitted, and
 * it stays inside the `timeout` deadline, so a cache backend that hangs is bounded like the handler it stands in for.
 *
 * A cached answer is **shared**, which is why only a `query` taking no internal argument can carry one: internal
 * arguments are how a call learns who is asking (`.with(Self)`), so an endpoint that has them answers per caller
 * and one entry would be one caller's answer handed to the next.
 */
export class EndpointCache {
  static #topic = "cache";
  static #refused = new Set<string>();

  static async through(context: SignalContext, run: () => Promise<unknown>) {
    const ttl = context.endpointInfo.signalOption.cache;
    if (!ttl || !Number.isFinite(ttl) || ttl <= 0) return await run();
    if (!EndpointCache.#cacheable(context)) return await run();
    const cache = context.getAdaptor(CacheAdaptorRole) as unknown as CacheAdaptor;
    const key = `${context.key}:${JSON.stringify(context.args)}`;
    const cached = await EndpointCache.#read(context, cache, key);
    if (cached !== undefined) {
      traceCache(true);
      return cached;
    }
    traceCache(false);
    const result = await run();
    await EndpointCache.#write(context, cache, key, result, ttl);
    return result;
  }
  /** A `cache` declared where a shared answer would be wrong is named once rather than silently ignored. */
  static #cacheable(context: SignalContext) {
    if (context.endpointInfo.type === "query" && context.endpointInfo.internalArgs.length === 0) return true;
    if (EndpointCache.#refused.has(context.key)) return false;
    EndpointCache.#refused.add(context.key);
    const reason =
      context.endpointInfo.type === "query"
        ? "it takes an internal argument, so its answer is the caller's and not a shared one"
        : `a ${context.endpointInfo.type} is never cached`;
    context.adaptor.logger.warn(`"${context.key}" declares \`cache\` and cannot take one: ${reason}.`);
    return false;
  }
  /** A cache backend that is down must not take the endpoint down with it: the call runs uncached instead. */
  static async #read(context: SignalContext, cache: CacheAdaptor, key: string) {
    try {
      const cached = await cache.get<string>(EndpointCache.#topic, key);
      if (cached == null) return undefined;
      return JSON.parse(cached) as unknown;
    } catch (error) {
      context.adaptor.logger.warn(`Cache read failed for ${context.key}: ${String(error)}`);
      // A value that parsed as nothing is a value nobody can use — including the next caller.
      await cache.delete(EndpointCache.#topic, key).catch(() => undefined);
      return undefined;
    }
  }
  static async #write(context: SignalContext, cache: CacheAdaptor, key: string, result: unknown, ttl: number) {
    const serialized = JSON.stringify(result);
    // `undefined` has no JSON spelling, and an entry holding the string "undefined" would parse back as garbage.
    if (serialized === undefined) return;
    try {
      await cache.set(EndpointCache.#topic, key, serialized, { expireAt: dayjs().add(ttl, "millisecond") });
    } catch (error) {
      context.adaptor.logger.warn(`Cache write failed for ${context.key}: ${String(error)}`);
    }
  }
}
