export interface WebsocketHeartbeatRequest {
  key: string;
  data: [];
}

export interface WebsocketHeartbeatAckData {
  type: "pong";
}

/**
 * Framework-owned websocket keep-alive. A browser cannot send a protocol-level ping frame — `WebSocket` exposes
 * no API for one — so a socket that nobody publishes to carries no bytes at all, and every intermediary with an
 * idle timeout (nginx `proxy_read_timeout` 60s, most CDNs, a tunnel gateway) reaps it. The server's own
 * `idleTimeout` is 0, so this exists for what sits between.
 *
 * The ack matters as much as the ping: a half-open socket still accepts `send()` without error, so inbound
 * traffic is the only evidence the peer is still there.
 */
export const websocketHeartbeatContract = {
  key: "__ping",
  /** Under the 60s idle timeout nginx and most CDNs ship with. */
  intervalMs: 45_000,
  /** How long without any inbound frame before the socket is assumed half-open and reconnected. */
  silenceMs: 45_000 * 3,
  makeRequest: (): WebsocketHeartbeatRequest => ({ key: "__ping", data: [] }),
  makeAck: (): WebsocketHeartbeatAckData => ({ type: "pong" }),
} as const;
