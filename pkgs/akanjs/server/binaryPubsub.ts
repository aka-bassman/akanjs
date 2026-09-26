import { Logger } from "akanjs/common";

// Bun's `Server.publish` returns -1 when backpressured, 0 with no subscriber, else bytes; drain is per socket.
export class BinaryPubsub {
  readonly #logger = new Logger("BinaryPubsub");
  readonly #pending = new Map<string, Uint8Array>();
  #servers: Bun.Server<unknown>[] = [];
  #coalescedCount = 0;

  get coalescedCount() {
    return this.#coalescedCount;
  }

  setServers(...servers: (Bun.Server<never> | null)[]) {
    this.#servers = servers.filter((server): server is Bun.Server<never> => !!server) as Bun.Server<unknown>[];
  }

  publish(roomId: string, frame: Uint8Array, { coalesce = false }: { coalesce?: boolean } = {}) {
    if (!this.#send(roomId, frame) || !coalesce) return;
    if (this.#pending.has(roomId)) this.#coalescedCount += 1;
    this.#pending.set(roomId, frame);
  }

  flush() {
    if (!this.#pending.size) return;
    for (const [roomId, frame] of [...this.#pending]) {
      this.#pending.delete(roomId);
      if (this.#send(roomId, frame)) this.#pending.set(roomId, frame);
    }
  }

  clear() {
    this.#pending.clear();
  }

  #send(roomId: string, frame: Uint8Array): boolean {
    let backpressured = false;
    for (const server of this.#servers) {
      try {
        if (server.publish(roomId, frame) === -1) backpressured = true;
      } catch (error) {
        this.#logger.warn(`Binary publish failed for ${roomId}: ${error instanceof Error ? error.message : error}`);
      }
    }
    return backpressured;
  }
}
