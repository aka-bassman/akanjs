import { type TunnelHeaderList, type TunnelOpenFrame, tunnelWireContract, tunnelWsPayload } from "akanjs/common";
import { type TunnelStream, type TunnelStreamLink, tunnelResetCodeOf, wsBytes } from "./tunnelStream";

/**
 * Handshake headers that belong to the public caller's upgrade and not to this one: the key, the version and
 * the extension list are negotiated per connection, and replaying them makes the local server answer a
 * handshake that was never asked of it. The subprotocol is the exception — it is the caller's choice and
 * travels as `protocols` instead.
 */
const handshakeHeaders = new Set([
  "sec-websocket-key",
  "sec-websocket-version",
  "sec-websocket-extensions",
  "sec-websocket-accept",
  "sec-websocket-protocol",
]);

export class TunnelWebsocketStream implements TunnelStream {
  readonly #open: TunnelOpenFrame;
  readonly #link: TunnelStreamLink;
  readonly #origin: string;
  #ws: WebSocket | null = null;
  #closed = false;

  constructor(open: TunnelOpenFrame, link: TunnelStreamLink, origin: string) {
    this.#open = open;
    this.#link = link;
    this.#origin = origin;
  }

  async run() {
    const { streamId, path = "/", headers = [] } = this.#open;
    const url = `${this.#origin.replace(/^http/, "ws")}${path}`;
    const protocols = headers.find(([name]) => name.toLowerCase() === "sec-websocket-protocol")?.[1];
    const dialHeaders: Record<string, string> = {};
    for (const [name, value] of headers) {
      if (!handshakeHeaders.has(name.toLowerCase())) dialHeaders[name] = value;
    }
    await new Promise<void>((resolve) => {
      const ws = new WebSocket(url, {
        headers: dialHeaders,
        ...(protocols ? { protocols: protocols.split(",").map((one) => one.trim()) } : {}),
      } as unknown as string[]);
      ws.binaryType = "arraybuffer";
      this.#ws = ws;
      ws.onopen = () => {
        const accepted: TunnelHeaderList = ws.protocol ? [["sec-websocket-protocol", ws.protocol]] : [];
        this.#link.sendFrame({ type: "head", streamId, status: 101, headers: accepted });
      };
      ws.onmessage = (event) => {
        void this.#forward(event.data);
      };
      ws.onerror = (event) => {
        // A failed dial never opens, so this is the only place a refused local origin is reported.
        if (!this.#ws || this.#closed) return;
        const error = (event as unknown as { error?: unknown }).error;
        this.#link.sendFrame({ type: "reset", streamId, code: tunnelResetCodeOf(error), message: "origin websocket" });
        this.#finish(resolve);
      };
      ws.onclose = (event) => {
        if (this.#closed) return;
        const payload = new TextEncoder().encode(JSON.stringify({ code: event.code, reason: event.reason }));
        void this.#link.sendPayload(tunnelWireContract.encodeWsPayload(tunnelWsPayload.close, payload));
        this.#link.sendFrame({ type: "end", streamId });
        this.#finish(resolve);
      };
    });
  }

  async #forward(data: unknown) {
    if (typeof data === "string") {
      const payload = new TextEncoder().encode(data);
      await this.#link.sendPayload(tunnelWireContract.encodeWsPayload(tunnelWsPayload.text, payload));
      return;
    }
    const bytes = new Uint8Array(data as ArrayBuffer);
    await this.#link.sendPayload(tunnelWireContract.encodeWsPayload(tunnelWsPayload.binary, bytes));
  }

  push(data: Uint8Array) {
    const decoded = tunnelWireContract.decodeWsPayload(data);
    const ws = this.#ws;
    if (!decoded || ws?.readyState !== WebSocket.OPEN) return;
    if (decoded.kind === tunnelWsPayload.text) {
      ws.send(new TextDecoder().decode(decoded.data));
      return;
    }
    if (decoded.kind === tunnelWsPayload.binary) {
      ws.send(wsBytes(decoded.data));
      return;
    }
    const { code, reason } = JSON.parse(new TextDecoder().decode(decoded.data) || "{}") as {
      code?: number;
      reason?: string;
    };
    // 1005 is "no status received", which a close frame may not carry on the wire.
    ws.close(code && code !== 1005 ? code : undefined, reason);
  }

  end() {
    this.#ws?.close();
  }

  reset() {
    this.#closed = true;
    this.#ws?.close();
  }

  #finish(resolve: () => void) {
    this.#closed = true;
    // A raw stream owns its data socket for its whole life, so the socket goes with it rather than being pooled.
    this.#link.closeSocket();
    resolve();
  }
}
