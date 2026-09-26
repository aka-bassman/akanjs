export interface WebsocketHeartbeatRequest {
  key: string;
  data: [];
}

export interface WebsocketHeartbeatAckData {
  type: "pong";
}

// A browser cannot send a protocol ping, so an idle socket would be reaped by intermediaries; the ack matters because a
// half-open socket still accepts `send()`, leaving inbound traffic the only evidence the peer is there.
export const websocketHeartbeatContract = {
  key: "__ping",
  /** Under the 60s idle timeout nginx and most CDNs ship with. */
  intervalMs: 45_000,
  /** Without any inbound frame this long, the socket is assumed half-open and reconnected. */
  silenceMs: 45_000 * 3,
  makeRequest: (): WebsocketHeartbeatRequest => ({ key: "__ping", data: [] }),
  makeAck: (): WebsocketHeartbeatAckData => ({ type: "pong" }),
} as const;
