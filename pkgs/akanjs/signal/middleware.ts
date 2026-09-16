import type { BackendEnv, Cls, PromiseOrObject } from "akanjs/base";
import { Logger } from "akanjs/common";
import { type CacheAdaptor, CacheAdaptorRole } from "akanjs/service";
import dayjs from "dayjs";
import { Exception } from "./exception";
import type { SignalContext } from "./signalContext";
import { traceCache } from "./trace";

export interface Middleware<Env extends BackendEnv = BackendEnv> {
  use(env: Env): PromiseOrObject<(context: SignalContext, next: () => Promise<unknown>) => PromiseOrObject<unknown>>;
}

export type MiddlewareCls = Cls<Middleware, { readonly refName: string }>;

export const middleware = (refName: string) => {
  return class Middleware {
    static refName = refName;
    async use(env: BackendEnv) {
      return async (context: SignalContext, next: () => Promise<unknown>) => {
        return await next();
      };
    }
  };
};

export class Logging extends middleware("logging") {
  override async use() {
    return async (context: SignalContext, next: () => Promise<unknown>) => {
      const start = Date.now();
      // This middleware is registered by default, so its two messages are built on every request the server
      // serves — and discarded unbuilt at the default `log` level. The level is re-read per call because
      // `Logger.setLevel` can move it at runtime.
      const debug = Logger.shouldLog("debug");
      if (debug) context.adaptor.logger.debug(`Before ${context.endpointInfo.type}-${context.key} / ${start}`);
      try {
        const result = await next();
        if (debug) {
          context.adaptor.logger.debug(`After ${context.endpointInfo.type}-${context.key} / ${Date.now() - start}ms`);
        }
        return result;
      } catch (error) {
        const duration = Date.now() - start;
        context.adaptor.logger.error(
          `Error ${context.endpointInfo.type}-${context.key} / ${duration}ms: ${String(error)}`,
        );
        throw error;
      }
    };
  }
}

/**
 * Serves an endpoint's own answer back for as long as its declared `cache` allows, and stands aside for every
 * endpoint that declared none — this is registered by default, so a TTL of its own would put a stale window on
 * every call in the app.
 *
 * A cached answer is **shared**, which is why only a `query` taking no internal argument can carry one: internal
 * arguments are how a call learns who is asking (`.with(Self)`), so an endpoint that has them answers per caller
 * and one entry would be one caller's answer handed to the next. Guards are re-run on every hit regardless —
 * shared is not public, and `next()`, which is what runs them, is exactly what a hit skips.
 */
export class Cache extends middleware("cache") {
  static #topic = "cache";
  static #refused = new Set<string>();

  override async use() {
    return async (context: SignalContext, next: () => Promise<unknown>) => {
      const ttl = context.endpointInfo.signalOption.cache;
      if (!ttl || !Number.isFinite(ttl) || ttl <= 0) return await next();
      if (!Cache.#cacheable(context)) return await next();
      const cache = context.getAdaptor(CacheAdaptorRole) as unknown as CacheAdaptor;
      const key = `${context.key}:${JSON.stringify(context.args)}`;
      const cached = await Cache.#read(context, cache, key);
      if (cached !== undefined) {
        await context.checkGuards();
        traceCache(true);
        return cached;
      }
      traceCache(false);
      const result = await next();
      await Cache.#write(context, cache, key, result, ttl);
      return result;
    };
  }
  /**
   * The handler's inputs are its declared arguments and its internal arguments, so an endpoint with none of the
   * latter answers the same thing to everyone who may read it — which is the only answer a shared entry can hold.
   * A `cache` declared anywhere else is named once rather than silently ignored.
   */
  static #cacheable(context: SignalContext) {
    if (context.endpointInfo.type === "query" && context.endpointInfo.internalArgs.length === 0) return true;
    if (Cache.#refused.has(context.key)) return false;
    Cache.#refused.add(context.key);
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
      const cached = await cache.get<string>(Cache.#topic, key);
      if (cached == null) return undefined;
      return JSON.parse(cached) as unknown;
    } catch (error) {
      context.adaptor.logger.warn(`Cache read failed for ${context.key}: ${String(error)}`);
      // A value that parsed as nothing is a value nobody can use — including the next caller.
      await cache.delete(Cache.#topic, key).catch(() => undefined);
      return undefined;
    }
  }
  static async #write(context: SignalContext, cache: CacheAdaptor, key: string, result: unknown, ttl: number) {
    const serialized = JSON.stringify(result);
    // `undefined` has no JSON spelling, and an entry holding the string "undefined" would parse back as garbage.
    if (serialized === undefined) return;
    try {
      await cache.set(Cache.#topic, key, serialized, { expireAt: dayjs().add(ttl, "millisecond") });
    } catch (error) {
      context.adaptor.logger.warn(`Cache write failed for ${context.key}: ${String(error)}`);
    }
  }
}

/**
 * Bounds an endpoint that declared a `timeout`, and nothing else — this is registered by default, so a default
 * of its own would put a deadline on every endpoint in the app that nobody asked for.
 *
 * XXX losing the race does not cancel the work: `next()` keeps running with nobody holding its result, so a
 * handler that writes is still going to write. The deadline answers the caller; it does not undo the call.
 */
export class Timeout extends middleware("timeout") {
  override async use() {
    return async (context: SignalContext, next: () => Promise<unknown>) => {
      const timeout = context.endpointInfo.signalOption.timeout;
      if (!timeout || !Number.isFinite(timeout) || timeout <= 0) return await next();
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        return await Promise.race([
          next(),
          // The key rather than prose: this is the same answer the client gives when its own budget runs out,
          // and the caller reads it out of the dictionary in their own language either way.
          new Promise((_, reject) => {
            timer = setTimeout(() => reject(new Exception(504, "base.error.gatewayTimeout")), timeout);
          }),
        ]);
      } finally {
        // Not clearing it held the event loop for the whole budget on every call that answered in time.
        clearTimeout(timer);
      }
    };
  }
}
