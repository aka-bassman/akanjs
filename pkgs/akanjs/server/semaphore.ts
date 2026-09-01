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
      // The slot passes straight to the next waiter instead of being released and re-taken: a caller
      // arriving in the microtask gap between a release and the waiter waking would see a free slot too.
      const next = this.#waiters.shift();
      if (next) next();
      else this.#running -= 1;
    }
  }
}
