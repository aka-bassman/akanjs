import { type TunnelOpenFrame, tunnelWireContract } from "akanjs/common";
import { type TunnelStream, type TunnelStreamLink, tunnelResetCodeOf } from "./tunnelStream";

/**
 * Headers that describe how the agent's own `fetch` framed the body, not what the body is.
 *
 * Bun's `fetch` decompresses a response and leaves `content-encoding: gzip` with the *compressed*
 * `content-length` on the headers — forwarding those verbatim hands the browser plain bytes labelled gzip and
 * a length off by an order of magnitude, which fails at the first read rather than at the source.
 */
const reframedHeaders = new Set(["content-encoding", "content-length"]);

export class TunnelHttpStream implements TunnelStream {
  readonly #open: TunnelOpenFrame;
  readonly #link: TunnelStreamLink;
  readonly #origin: string;
  readonly #aborter = new AbortController();
  #body: ReadableStreamDefaultController<Uint8Array> | null = null;
  readonly #bodyStream: ReadableStream<Uint8Array> | null;

  constructor(open: TunnelOpenFrame, link: TunnelStreamLink, origin: string) {
    this.#open = open;
    this.#link = link;
    this.#origin = origin;
    this.#bodyStream = open.body
      ? new ReadableStream<Uint8Array>({
          start: (controller) => {
            this.#body = controller;
          },
        })
      : null;
  }

  async run() {
    const { streamId, method = "GET", path = "/", headers = [] } = this.#open;
    try {
      const response = await fetch(`${this.#origin}${path}`, {
        method,
        headers: tunnelWireContract.headersOf(headers),
        body: this.#bodyStream,
        signal: this.#aborter.signal,
        // The public caller follows its own redirects; a tunnel that followed them would rewrite the URL bar.
        redirect: "manual",
        // Required by the fetch spec for a streaming request body, so an upload is not buffered whole first.
        duplex: "half",
      } as RequestInit);
      const list = tunnelWireContract
        .headerList(response.headers)
        .filter(([name]) => !reframedHeaders.has(name.toLowerCase()));
      this.#link.sendFrame({
        type: "head",
        streamId,
        status: response.status,
        statusText: response.statusText,
        headers: list,
        body: !!response.body,
      });
      if (response.body) {
        for await (const chunk of response.body) {
          // An origin is free to hand back one huge chunk; a frame past `maxFrameBytes` is refused by the peer.
          for (let at = 0; at < chunk.byteLength; at += tunnelWireContract.chunkBytes)
            await this.#link.sendPayload(chunk.subarray(at, at + tunnelWireContract.chunkBytes));
        }
      }
      this.#link.sendFrame({ type: "end", streamId });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.#link.sendFrame({ type: "reset", streamId, code: tunnelResetCodeOf(error), message });
    }
  }

  push(data: Uint8Array) {
    try {
      this.#body?.enqueue(data);
    } catch {
      // The request was aborted under us, so there is nothing left to feed.
      this.#body = null;
    }
  }

  end() {
    try {
      this.#body?.close();
    } catch {
      // Same race as `push`: already aborted, already closed.
    }
    this.#body = null;
  }

  reset() {
    this.#body = null;
    this.#aborter.abort();
  }
}
