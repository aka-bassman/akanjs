import type { QueryOf } from "akanjs/constant";

type LoaderItem = Record<string, unknown>;
type LoaderModel = {
  find: (query: QueryOf<unknown>) => Promise<LoaderItem[]> | { then: Promise<LoaderItem[]>["then"] };
};
type ArrayElementLoaderItem = LoaderItem & { key: unknown };
type QueryRecord = Record<string, unknown>;
type BatchLoadFn<Key, Value> = (
  keys: readonly Key[],
) => PromiseLike<ReadonlyArray<Value | Error>> | ReadonlyArray<Value | Error>;

interface DataLoaderOptions<Key, CacheKey> {
  cache?: boolean;
  cacheKeyFn?: (key: Key) => CacheKey;
  batch?: boolean;
  batchScheduleFn?: (callback: () => void) => void;
  maxBatchSize?: number;
  name?: string;
}

interface BatchItem<Key, Value> {
  key: Key;
  resolve: (value: Value) => void;
  reject: (reason: unknown) => void;
}

/** Minimal DataLoader-compatible batch loader used by Akan document resolvers. */
export class DataLoader<Key, Value, CacheKey = Key> {
  readonly name?: string;
  readonly #batchLoadFn: BatchLoadFn<Key, Value>;
  readonly #cache: boolean;
  readonly #cacheKeyFn: (key: Key) => CacheKey;
  readonly #batch: boolean;
  readonly #batchScheduleFn: (callback: () => void) => void;
  readonly #maxBatchSize: number;
  readonly #promiseCache = new Map<CacheKey, Promise<Value>>();
  #queue: BatchItem<Key, Value>[] = [];
  #scheduled = false;

  constructor(batchLoadFn: BatchLoadFn<Key, Value>, options: DataLoaderOptions<Key, CacheKey> = {}) {
    this.#batchLoadFn = batchLoadFn;
    this.#cache = options.cache !== false;
    this.#cacheKeyFn = options.cacheKeyFn ?? ((key) => key as unknown as CacheKey);
    this.#batch = options.batch !== false;
    this.#batchScheduleFn = options.batchScheduleFn ?? ((callback) => queueMicrotask(callback));
    this.#maxBatchSize = options.maxBatchSize ?? Number.POSITIVE_INFINITY;
    this.name = options.name;
  }

  load(key: Key): Promise<Value> {
    const cacheKey = this.#cacheKeyFn(key);
    if (this.#cache) {
      const cached = this.#promiseCache.get(cacheKey);
      if (cached) return cached;
    }

    const promise = new Promise<Value>((resolve, reject) => {
      this.#queue.push({ key, resolve, reject });
      if (this.#batch) this.#schedule();
      else this.#dispatch();
    });
    if (this.#cache) this.#promiseCache.set(cacheKey, promise);
    return promise;
  }

  async loadMany(keys: readonly Key[]): Promise<Array<Value | Error>> {
    const results = await Promise.allSettled(keys.map((key) => this.load(key)));
    return results.map((result) => (result.status === "fulfilled" ? result.value : toError(result.reason)));
  }

  clear(key: Key): this {
    this.#promiseCache.delete(this.#cacheKeyFn(key));
    return this;
  }

  clearAll(): this {
    this.#promiseCache.clear();
    return this;
  }

  prime(key: Key, value: Value | Error): this {
    if (!this.#cache) return this;
    const cacheKey = this.#cacheKeyFn(key);
    if (this.#promiseCache.has(cacheKey)) return this;
    this.#promiseCache.set(cacheKey, value instanceof Error ? Promise.reject(value) : Promise.resolve(value));
    return this;
  }

  #schedule() {
    if (this.#scheduled) return;
    this.#scheduled = true;
    this.#batchScheduleFn(() => this.#dispatch());
  }

  #dispatch() {
    this.#scheduled = false;
    const batch = this.#queue.splice(0, this.#maxBatchSize);
    if (this.#queue.length > 0) this.#schedule();
    if (batch.length === 0) return;
    const keys = batch.map(({ key }) => key);
    Promise.resolve(this.#batchLoadFn(keys)).then(
      (values) => {
        if (values.length !== batch.length) {
          const error = new Error(`DataLoader expected ${batch.length} values, received ${values.length}`);
          batch.forEach(({ reject }) => {
            reject(error);
          });
          return;
        }
        values.forEach((value, index) => {
          if (value instanceof Error) batch[index]?.reject(value);
          else batch[index]?.resolve(value as Value);
        });
      },
      (error) => {
        batch.forEach(({ reject }) => {
          reject(error);
        });
      },
    );
  }
}

function toError(reason: unknown): Error {
  return reason instanceof Error ? reason : new Error(String(reason));
}

function keyBy<T>(items: T[], keyOrGetter: keyof T | ((item: T) => unknown)): Record<string, T> {
  const entries = items.map((item) => {
    const key = typeof keyOrGetter === "function" ? keyOrGetter(item) : item[keyOrGetter];
    return [String(key), item] as const;
  });
  return Object.fromEntries(entries);
}

function groupBy<T>(items: T[], getKey: (item: T) => unknown): Record<string, T[]> {
  const groups: Record<string, T[]> = {};
  for (const item of items) {
    const key = String(getKey(item));
    groups[key] ??= [];
    groups[key].push(item);
  }
  return groups;
}

const setQueryOperator = (query: QueryOf<unknown>, fieldName: string, op: "oneOf" | "has", value: unknown) => {
  (query as QueryRecord)[fieldName] = { kind: "op", op, value };
};

export const createLoader = <Key, Value>(model: LoaderModel, fieldName = "id", defaultQuery: QueryOf<unknown> = {}) => {
  return new DataLoader<Key, Value>(
    (fields) => {
      const query: QueryOf<unknown> = { ...defaultQuery };
      setQueryOperator(query, fieldName, "oneOf", fields);
      const data = Promise.resolve(model.find(query)).then((list) => {
        const listByKey = keyBy(list, fieldName);
        return fields.map((id: unknown) => listByKey[String(id)] ?? null);
      });
      return data as unknown as Promise<Value[]>;
    },
    { name: "dataloader", cache: false },
  );
};
export const createArrayLoader = <K, V>(model: LoaderModel, fieldName = "id", defaultQuery: QueryOf<unknown> = {}) => {
  return new DataLoader<K, V>((fields) => {
    const query: QueryOf<unknown> = { ...defaultQuery };
    setQueryOperator(query, fieldName, "has", fields);
    const data = Promise.resolve(model.find(query)).then((list) => {
      return fields.map((field) => list.filter((item) => field === item[fieldName]));
    });
    return data as unknown as Promise<V[]>;
  });
};
export const createArrayElementLoader = <K, V>(
  model: LoaderModel,
  fieldName = "id",
  defaultQuery: QueryOf<unknown> = {},
) => {
  return new DataLoader<K, V>(
    (fields) => {
      const query: QueryOf<unknown> = { ...defaultQuery };
      setQueryOperator(query, fieldName, "oneOf", fields);
      const data = Promise.resolve(model.find(query)).then((list) => {
        const flat: ArrayElementLoaderItem[] = list.flatMap((datum) => {
          const values = Array.isArray(datum[fieldName]) ? datum[fieldName] : [];
          return values.map((datField: unknown) => ({
            ...datum,
            key: datField,
          }));
        });
        const listByKey = groupBy(flat, (dat) => dat.key);
        return fields.map((id) => listByKey[String(id)] ?? null);
      });
      return data as unknown as Promise<V[]>;
    },
    { name: "dataloader", cache: false },
  );
};

export const createQueryLoader = <Key, Value>(
  model: LoaderModel,
  queryKeys: string[],
  defaultQuery: QueryOf<unknown> = {},
) => {
  return new DataLoader<Key, Value, Key>(
    (queries) => {
      const query = { kind: "all", queries: [{ kind: "any", queries }, defaultQuery] } as QueryOf<unknown>;
      const getQueryKey = (query: QueryOf<unknown>) =>
        queryKeys.map((key) => String((query as QueryRecord)[key])).join("");
      const data = Promise.resolve(model.find(query)).then((list) => {
        const listByKey = keyBy(list, getQueryKey);
        return queries.map((query: QueryOf<unknown>) => listByKey[getQueryKey(query)] ?? null);
      });
      return data as unknown as Promise<Value[]>;
    },
    { name: "dataloader", cache: false },
  );
};

export type Loader<Field, Value> = DataLoader<Field, Value | null>;
