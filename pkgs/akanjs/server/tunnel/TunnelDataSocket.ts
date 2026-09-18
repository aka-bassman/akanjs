import { type Logger, sleep, type TunnelDataFromAgent, type TunnelOpenFrame, tunnelWireContract } from "akanjs/common";
import { TunnelHttpStream } from "./TunnelHttpStream";
import { TunnelTcpStream } from "./TunnelTcpStream";
import { TunnelWebsocketStream } from "./TunnelWebsocketStream";
import { type TunnelStream, type TunnelStreamLink, wsBytes } from "./tunnelStream";

export interface TunnelDataSocketOptions {
  gatewayUrl: string;
  token: string;
  sessionId: string;
  /** Where an `http` or `websocket` stream is replayed, as an http(s) URL with no trailing slash. */
  origin: string;
  /** Where a `tcp` stream dials; the port comes from the open frame. */
  tcpHost: string;
  logger: Logger;
  onIdle: (socket: TunnelDataSocket) => void;
  onBusy: (socket: TunnelDataSocket) => void;
  onGone: (socket: TunnelDataSocket) => void;
}

/** Enough in flight to keep the link busy, little enough that a slow reader cannot grow the agent's heap. */
const highWaterMark = tunnelWireContract.chunkBytes * 8;

/**
 * One socket of the pool. It carries exactly one stream at a time, which is what lets a payload frame be bare
 * bytes with no stream id — see the invariants on `TunnelDataFromAgent`.
 */
export class TunnelDataSocket {
  readonly #options: TunnelDataSocketOptions;
  #ws: WebSocket | null = null;
  #stream: TunnelStream | null = null;
  #streamId: string | null = null;
  #gone = false;

  constructor(options: TunnelDataSocketOptions) {
    this.#options = options;
  }

  get busy() {
    return this.#stream !== null;
  }

  open() {
    const { gatewayUrl, token, sessionId, logger } = this.#options;
    const ws = new WebSocket(`${gatewayUrl}${tunnelWireContract.dataPath}`, {
      headers: { authorization: `${tunnelWireContract.authScheme} ${token}` },
    } as unknown as string[]);
    ws.binaryType = "arraybuffer";
    this.#ws = ws;
    ws.onopen = () => this.#send({ type: "attach", version: tunnelWireContract.version, sessionId });
    ws.onmessage = (event) => this.#receive(event.data);
    ws.onerror = () => logger.verbose(`Tunnel data socket error`);
    ws.onclose = () => this.#drop();
  }

  close() {
    this.#gone = true;
    this.#stream?.reset();
    this.#stream = null;
    this.#ws?.close();
    this.#ws = null;
  }

  #drop() {
    if (this.#gone) return;
    this.#gone = true;
    this.#stream?.reset();
    this.#stream = null;
    this.#ws = null;
    this.#options.onGone(this);
  }

  #receive(data: unknown) {
    if (typeof data !== "string") {
      this.#stream?.push(new Uint8Array(data as ArrayBuffer));
      return;
    }
    const frame = tunnelWireContract.parseFrame(data);
    if (!frame) {
      this.#options.logger.warn(`Tunnel data socket received an unparseable frame`);
      return;
    }
    // A frame naming a stream this socket is not carrying is the desync guard, not a case to handle.
    if ("streamId" in frame && this.#streamId && frame.streamId !== this.#streamId) return;
    switch (frame.type) {
      case "attached":
        this.#options.onIdle(this);
        return;
      case "open":
        this.#start(frame);
        return;
      case "end":
        this.#stream?.end();
        return;
      case "reset":
        this.#stream?.reset();
        this.#stream = null;
        this.#streamId = null;
        return;
      case "release":
        this.#stream = null;
        this.#streamId = null;
        this.#options.onIdle(this);
        return;
      default:
        this.#options.logger.warn(`Tunnel data socket received an unexpected frame: ${frame.type}`);
    }
  }

  #start(open: TunnelOpenFrame) {
    const { origin, tcpHost } = this.#options;
    const link: TunnelStreamLink = {
      sendFrame: (frame) => this.#send(frame),
      sendPayload: (payload) => this.#sendPayload(payload),
      closeSocket: () => this.close(),
    };
    this.#streamId = open.streamId;
    this.#stream =
      open.kind === "websocket"
        ? new TunnelWebsocketStream(open, link, origin)
        : open.kind === "tcp"
          ? new TunnelTcpStream(open, link, tcpHost)
          : new TunnelHttpStream(open, link, origin);
    this.#options.onBusy(this);
    void this.#stream.run();
  }

  #send(frame: TunnelDataFromAgent) {
    if (this.#ws?.readyState !== WebSocket.OPEN) return;
    this.#ws.send(JSON.stringify(frame));
  }

  async #sendPayload(payload: Uint8Array) {
    const ws = this.#ws;
    if (ws?.readyState !== WebSocket.OPEN) return;
    ws.send(wsBytes(payload));
    // A client `WebSocket` has no `drain` event, so `bufferedAmount` is the only signal that the link caught up.
    // Without this an origin faster than the tunnel is buffered in the agent's heap rather than being paced.
    while (ws.readyState === WebSocket.OPEN && ws.bufferedAmount > highWaterMark) await sleep(1);
  }
}
