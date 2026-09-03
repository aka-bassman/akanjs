/**
 * Method decorators for a server class: `@Transaction`, `@Try`, `@CacheMethod`. Kept because `libs/util`'s
 * storage adaptors use `@Try` on their remote calls; new code follows the adaptor rule instead
 * (`catch` → `logger.error` → `return null`).
 */

type DecoratedInstance = {
  logger?: { warn?: (message: string) => void; trace?: (message: string) => void };
  __database?: { transaction?: <T>(fn: () => Promise<T>) => Promise<T> };
  __databaseModel?: {
    __database?: { transaction?: <T>(fn: () => Promise<T>) => Promise<T> };
    __model?: { modelName: string };
    __cache?: {
      get: (key: string) => Promise<string | null>;
      set: (key: string, value: string, option: unknown) => unknown;
    };
  };
  database?: { transaction?: <T>(fn: () => Promise<T>) => Promise<T> };
  connection?: { transaction?: <T>(fn: () => Promise<T>) => Promise<T> };
  __model?: { modelName: string };
  __cache?: {
    get: (key: string) => Promise<string | null>;
    set: (key: string, value: string, option: unknown) => unknown;
  };
};

/** Method decorator that catches errors and logs a warning instead of throwing. */
export const Try = () => {
  return (_target: unknown, key: string, descriptor: PropertyDescriptor) => {
    const originMethod = descriptor.value as (this: unknown, ...args: unknown[]) => unknown;
    descriptor.value = async function (...args: unknown[]) {
      try {
        const result = await originMethod.apply(this, args);
        return result;
      } catch (e) {
        (this as DecoratedInstance).logger?.warn?.(`${key} action error return: ${e}`);
      }
    };
  };
};

/** Method decorator that runs the method inside the detected database transaction. */
export const Transaction = (): MethodDecorator => {
  return ((_target: unknown, key: string, descriptor: PropertyDescriptor) => {
    const originMethod = descriptor.value as (this: unknown, ...args: unknown[]) => unknown;
    descriptor.value = async function (...args: unknown[]) {
      const instance = this as DecoratedInstance;
      const database =
        instance.__database ?? instance.__databaseModel?.__database ?? instance.database ?? instance.connection;
      if (!database?.transaction) throw new Error(`No transactional database in function ${key}`);
      return await database.transaction(async () => await originMethod.apply(this, args));
    };
    return descriptor;
  }) as MethodDecorator;
};

/**
 * Method decorator that caches method results for the given timeout in milliseconds.
 *
 * Not `Cache` — `akanjs/signal` exports a `Cache` **middleware class**, and an app importing both barrels got
 * one name meaning two things.
 */
export const CacheMethod = (timeout = 1000, getCacheKey?: (...args: unknown[]) => string): MethodDecorator => {
  return ((_target: unknown, key: string, descriptor: PropertyDescriptor) => {
    const originMethod = descriptor.value as (this: unknown, ...args: unknown[]) => unknown;
    const cacheMap = new Map<string, unknown>();
    const timerMap = new Map<string, NodeJS.Timeout>();
    descriptor.value = async function (...args: unknown[]) {
      const instance = this as DecoratedInstance;
      const classType = instance.__model ? "doc" : instance.__databaseModel ? "service" : "class";
      const model = instance.__model ?? instance.__databaseModel?.__model;
      const cache = instance.__cache ?? instance.__databaseModel?.__cache;
      const cacheKeyValue = getCacheKey ? getCacheKey(...args) : JSON.stringify(args);
      const cacheKey = `${classType}:${model?.modelName ?? "unknown"}:${key}:${cacheKeyValue}`;
      const getCache = async (cacheKey: string) => {
        if (classType === "class") return cacheMap.get(cacheKey);
        const cached = (await cache?.get(cacheKey)) as string | null;
        if (cached) return JSON.parse(cached);
        return null;
      };
      const setCache = async (cacheKey: string, value: unknown) => {
        if (classType === "class") {
          const existingTimer = timerMap.get(cacheKey);
          if (existingTimer) clearTimeout(existingTimer);
          cacheMap.set(cacheKey, value);
          const timer = setTimeout(() => {
            cacheMap.delete(cacheKey);
            timerMap.delete(cacheKey);
          }, timeout);
          timerMap.set(cacheKey, timer);
        } else await cache?.set(cacheKey, JSON.stringify(value), { PX: timeout });
      };
      const cachedData = await getCache(cacheKey);
      if (cachedData) {
        instance.logger?.trace?.(`${model?.modelName ?? "unknown"} cache hit: ${cacheKey}`);
        return cachedData;
      }
      const result = await originMethod.apply(this, args);
      await setCache(cacheKey, result);
      instance.logger?.trace?.(`${model?.modelName ?? "unknown"} cache set: ${cacheKey}`);
      return result;
    };
  }) as MethodDecorator;
};
