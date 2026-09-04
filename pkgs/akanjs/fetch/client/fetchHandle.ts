type FieldFactories<Handle> = { [Key in keyof Handle]: () => Handle[Key] };

/**
 * A fetch result that is both awaitable and destructurable.
 *
 * `await` gives the object the helper has always given, so every existing call site reads unchanged. Reading a
 * field off the un-awaited result gives that field's own promise instead, so a route can hand each one to the
 * section that renders it and let the slowest arrive last rather than holding the whole page.
 */
export class FetchHandle {
  /**
   * @param requests the calls already in flight. Each gets a swallowing handler so a field nobody reads cannot
   *   surface as an unhandled rejection; the handle's own `then` is what reports one.
   * @param settle builds the awaited shape — its own fields stay lazy, so awaiting costs nothing extra.
   * @param fields one factory per field of the un-awaited shape, memoized on first read.
   */
  static of<Awaited extends object, Handle extends object>(
    requests: Promise<unknown>[],
    settle: () => Promise<Awaited>,
    fields: FieldFactories<Handle>,
  ): PromiseLike<Awaited> & Handle {
    for (const request of requests) void request.catch(() => undefined);
    let settled: Promise<Awaited> | undefined;
    const resolve = () => {
      if (settled) return settled;
      settled = settle();
      void settled.catch(() => undefined);
      return settled;
    };
    const read = new Map<string, unknown>();
    const factories = fields as { [key: string]: () => unknown };
    const handle = {} as { [key: string]: unknown };
    for (const key of Object.keys(factories)) {
      Object.defineProperty(handle, key, {
        enumerable: true,
        get: () => {
          if (!read.has(key)) read.set(key, factories[key]());
          return read.get(key);
        },
      });
    }
    // Non-enumerable so spreading the handle yields its fields and not a stray `then` that would make the copy
    // look awaitable while resolving to nothing. Being awaitable at all is the point: `await fetch.initX()` has
    // to keep giving the shape it always gave while the same object also hands out its fields.
    return Object.defineProperties(handle, {
      // biome-ignore lint/suspicious/noThenProperty: awaitable by design, see above
      then: { value: (...args: unknown[]) => Reflect.apply(resolve().then, resolve(), args) },
      catch: { value: (...args: unknown[]) => Reflect.apply(resolve().catch, resolve(), args) },
      finally: { value: (...args: unknown[]) => Reflect.apply(resolve().finally, resolve(), args) },
    }) as PromiseLike<Awaited> & Handle;
  }

  /** The awaited shape's fields stay lazy for the same reason the handle's do: a caller reads one, not all. */
  static lazy<Target extends object>(target: Target, fields: { [key: string]: () => unknown }): Target {
    for (const [key, factory] of Object.entries(fields))
      Object.defineProperty(target, key, { enumerable: true, get: factory });
    return target;
  }
}
