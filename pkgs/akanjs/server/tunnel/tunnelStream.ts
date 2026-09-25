import type { TunnelDataFromAgent, TunnelResetCode } from "akanjs/common";

/** What a stream may do to the data socket carrying it. `sendPayload` resolves once the socket has drained. */
export interface TunnelStreamLink {
  sendFrame: (frame: TunnelDataFromAgent) => void;
  sendPayload: (data: Uint8Array) => Promise<void>;
  closeSocket: () => void;
}

export interface TunnelStream {
  /** Dials the local origin and answers with a `head`, then pumps until the origin is done. */
  run: () => Promise<void>;
  /** A payload frame from the gateway — a request body chunk, or an inner websocket/tcp message. */
  push: (data: Uint8Array) => void;
  /** The gateway has no more to send in its direction. */
  end: () => void;
  /** The gateway gave up, or the socket died under the stream. */
  reset: () => void;
}

/**
 * lib.dom narrows `BufferSource` to `ArrayBuffer`-backed views, so a `Uint8Array<ArrayBufferLike>` — which is
 * what both a stream chunk and a `subarray` are — is refused by `WebSocket.send` although nothing here is ever
 * backed by a `SharedArrayBuffer`.
 */
export const wsBytes = (data: Uint8Array) => data as unknown as Uint8Array<ArrayBuffer>;

const abortNames = new Set(["AbortError", "TimeoutError"]);
const refusedCodes = new Set(["ConnectionRefused", "ECONNREFUSED"]);

/**
 * Bun reports a failed dial through `error.name` and `error.code` rather than a type, and the message is
 * prose ("Unable to connect. Is the computer able to access the url?"), so those two fields are what can be
 * read. The distinction is worth keeping: `originRefused` means the app is not running, which is the one a
 * developer can act on.
 */
export const tunnelResetCodeOf = (error: unknown): TunnelResetCode => {
  const { name, code } = (error ?? {}) as { name?: string; code?: string | number };
  if (name === "TimeoutError") return "originTimeout";
  if (name && abortNames.has(name)) return "canceled";
  if (typeof code === "string" && refusedCodes.has(code)) return "originRefused";
  if (typeof code === "string" && code.startsWith("E")) return "originUnreachable";
  return "internal";
};
