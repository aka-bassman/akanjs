export class Semaphore {
  readonly #limit: number;
  readonly #waiters: (() => void)[] = [];
  #running = 0;

  constructor(limit: number) {
    this.#limit = Math.max(1, Math.floor(limit));
  }

  async run<T>(task: () => Promise<T>): Promise<T> {
    if (this.#running >= this.#limit) await new Promise<void>((resolve) => this.#waiters.push(resolve));
    else this.#running += 1;
    try {
      return await task();
    } finally {
      // Hand the slot over directly: release + re-take lets a caller in the microtask gap take it too.
      const next = this.#waiters.shift();
      if (next) next();
      else this.#running -= 1;
    }
  }
}
