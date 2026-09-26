import { SLICE_META } from "akanjs/base";
import type { ClientSignal } from "akanjs/fetch";
import type { SerializedSignal } from "akanjs/signal";

export class MemoryStorage implements Storage {
  #values = new Map<string, string>();
  get length() {
    return this.#values.size;
  }
  clear() {
    this.#values.clear();
  }
  getItem(key: string) {
    return this.#values.get(key) ?? null;
  }
  key(index: number) {
    return [...this.#values.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.#values.delete(key);
  }
  setItem(key: string, value: string) {
    this.#values.set(key, value);
  }
}

export const stubSignal = <RefName extends string>(
  refName: RefName,
  cnst: unknown,
  serializedSignal: SerializedSignal,
) => {
  const handlers: Record<string, unknown> = {};
  return {
    refName,
    _slice: { [SLICE_META]: {} },
    cnst,
    fetch: new Proxy(handlers, { get: (target, key: string) => (target[key] ??= async () => null) }),
    serializedSignal,
    slices: [],
  } as unknown as ClientSignal<RefName>;
};
