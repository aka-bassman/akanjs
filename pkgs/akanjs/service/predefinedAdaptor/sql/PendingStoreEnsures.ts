export class PendingStoreEnsures {
  readonly #pending = new Set<Promise<void>>();
  #closed = false;

  track(ensure: Promise<void>): void {
    const tracked = ensure
      .catch((error: unknown) => {
        if (this.#closed) return;
        throw error;
      })
      .finally(() => {
        this.#pending.delete(tracked);
      });
    this.#pending.add(tracked);
  }

  /** Let them finish against a live connection. Call before closing it. */
  async settle(): Promise<void> {
    this.#closed = true;
    await Promise.allSettled([...this.#pending]);
  }
}
