import type { BackendEnv, Cls, PromiseOrObject } from "akanjs/base";
import { Logger } from "akanjs/common";
import { Exception } from "./exception";
import type { SignalContext } from "./signalContext";

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
