// Duck-typed, not `instanceof Promise`, so a thenable from another realm or promise library still counts.
export const isThenable = (value: unknown): value is PromiseLike<unknown> =>
  !!value &&
  (typeof value === "object" || typeof value === "function") &&
  typeof Reflect.get(value, "then") === "function";
