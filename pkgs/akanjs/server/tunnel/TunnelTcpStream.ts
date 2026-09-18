import { type TunnelOpenFrame, tunnelWireContract } from "akanjs/common";
import { type TunnelStream, type TunnelStreamLink, tunnelResetCodeOf } from "./tunnelStream";

/**
 * A raw TCP stream to a local port — what SSH through the tunnel rides. The provider side only: what opens one
 * is undefined in wire version 1, so nothing in the framework calls this yet.
 */
export class TunnelTcpStream implements TunnelStream {
  readonly #open: TunnelOpenFrame;
  readonly #link: TunnelStreamLink;
  readonly #hostname: string;
  #socket: Bun.Socket | null = null;
  #pending: Uint8Array[] = [];
  #closed = false;

  constructor(open: TunnelOpenFrame, link: TunnelStreamLink, hostname: string) {
    this.#open = open;
    this.#link = link;
    this.#hostname = hostname;
  }

  async run() {
    const { streamId, port } = this.#open;
    if (!port) {
      this.#link.sendFrame({ type: "reset", streamId, code: "protocol", message: "tcp open carries no port" });
      this.#link.closeSocket();
      return;
    }
    try {
      await new Promise<void>((resolve, reject) => {
        void Bun.connect({
          hostname: this.#hostname,
          port,
          socket: {
            open: () => {
              this.#link.sendFrame({ type: "head", streamId, status: 200, headers: [], body: true });
            },
            data: (_socket, data) => {
              for (let at = 0; at < data.byteLength; at += tunnelWireContract.chunkBytes)
                void this.#link.sendPayload(data.subarray(at, at + tunnelWireContract.chunkBytes));
            },
            // Everything `write` could not take is held here and retried, in order, when the kernel buffer frees.
            drain: (socket) => this.#flush(socket),
            close: () => {
              if (!this.#closed) this.#link.sendFrame({ type: "end", streamId });
              this.#finish();
              resolve();
            },
            error: (_socket, error) => reject(error),
          },
        }).then((socket) => {
          this.#socket = socket;
        }, reject);
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.#link.sendFrame({ type: "reset", streamId, code: tunnelResetCodeOf(error), message });
      this.#finish();
    }
  }

  push(data: Uint8Array) {
    const socket = this.#socket;
    if (!socket || this.#closed) return;
    this.#pending.push(data);
    this.#flush(socket);
  }

  end() {
    this.#socket?.end();
  }

  reset() {
    this.#closed = true;
    this.#socket?.end();
    this.#finish();
  }

  #flush(socket: Bun.Socket) {
    while (this.#pending.length) {
      const chunk = this.#pending[0];
      if (!chunk) break;
      const written = socket.write(chunk);
      if (written < chunk.byteLength) {
        // Partial writes are normal once the kernel buffer fills; the remainder waits for `drain`.
        this.#pending[0] = chunk.subarray(Math.max(written, 0));
        return;
      }
      this.#pending.shift();
    }
  }

  #finish() {
    this.#closed = true;
    this.#pending = [];
    this.#socket = null;
    // A raw stream owns its data socket for its whole life, so the socket goes with it rather than being pooled.
    this.#link.closeSocket();
  }
}
