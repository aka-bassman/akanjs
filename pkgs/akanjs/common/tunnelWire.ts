import { forwardedHeaders } from "./clientAddress";

/**
 * The wire between a tunnel agent (inside the `akan` CLI, on a private machine) and the tunnel gateway (public,
 * in the cluster). It is the only thing the two sides share, so it lives here rather than in either of them.
 *
 * **Shape: one control socket plus a pool of data sockets, one stream per data socket.** No multiplexing and no
 * hand-written flow control — the runtime already does per-socket flow control, and a single multiplexed socket
 * would have to re-implement windowing to keep one large download from starving every other stream. The cost is
 * a socket per concurrent stream, which pooling amortizes.
 *
 * **Framing is the WebSocket frame type.** A text frame is always one JSON control message of this module; a
 * binary frame is always payload. Nothing else needs a header, a length prefix, or a stream id on the hot path,
 * because a data socket carries exactly one stream at a time.
 *
 * Every socket is dialled by the agent — the gateway can never reach in. That is the whole reason a tunnel needs
 * no public IP, no inbound port, and no NAT traversal.
 */

/**
 * `http` and `tcp` bodies are raw binary frames; a `websocket` stream prefixes each one — see `tunnelWsPayload`.
 *
 * `tcp` describes the **provider** side only: an agent dialling a local port. What opens a `tcp` stream in the
 * first place — a local listener somewhere else that a person points `ssh` at — is undefined in version 1, and
 * naming that role is a version 1 addition rather than a breaking change.
 */
export type TunnelStreamKind = "http" | "websocket" | "tcp";

export type TunnelResetCode =
  | "originUnreachable"
  | "originTimeout"
  | "originRefused"
  | "protocol"
  | "canceled"
  | "tooLarge"
  | "internal";

/**
 * Pairs rather than a record: `set-cookie` legitimately repeats, and a record keyed by name keeps only the last
 * one — which silently drops every session cookie but one on a sign-in response.
 */
export type TunnelHeaderList = [string, string][];

export interface TunnelAgentIdentity {
  /** What the operator called this share, for the gateway's log and the control plane's UI. */
  name: string;
  version: string;
  platform: string;
}

export interface TunnelHelloFrame {
  type: "hello";
  version: number;
  /** What the agent intends to serve. The gateway answers with what the token actually grants. */
  hostnames: string[];
  agent: TunnelAgentIdentity;
}

export interface TunnelReadyFrame {
  type: "ready";
  version: number;
  sessionId: string;
  /** Authoritative — the agent serves these and nothing else, whatever it asked for. */
  hostnames: string[];
  /** The public URLs, already assembled, so the CLI prints what the gateway believes rather than guessing. */
  urls: string[];
  /** How many idle data sockets to hold, and the ceiling past which the agent refuses to grow the pool. */
  idle: number;
  maxSockets: number;
  heartbeatMs: number;
  /** Epoch ms, when the control plane put a TTL on this share. */
  expiresAt?: number;
}

export interface TunnelPingFrame {
  type: "ping";
  at: number;
}

export interface TunnelPongFrame {
  type: "pong";
  at: number;
}

/** The gateway noticed the idle pool running short; the agent grows it to `idle`, capped by `maxSockets`. */
export interface TunnelDemandFrame {
  type: "demand";
  idle: number;
}

/** A graceful goodbye from either side, so the peer stops reconnecting instead of treating it as a drop. */
export interface TunnelByeFrame {
  type: "bye";
  reason?: string;
}

export type TunnelControlFromAgent = TunnelHelloFrame | TunnelPingFrame | TunnelPongFrame | TunnelByeFrame;
export type TunnelControlFromGateway =
  | TunnelReadyFrame
  | TunnelPingFrame
  | TunnelPongFrame
  | TunnelDemandFrame
  | TunnelByeFrame;

/** First frame on a data socket. The session id names which agent connection this socket belongs to. */
export interface TunnelAttachFrame {
  type: "attach";
  version: number;
  sessionId: string;
}

/** The socket joined the idle pool. Until this arrives the agent must not count it toward `idle`. */
export interface TunnelAttachedFrame {
  type: "attached";
}

export interface TunnelOpenFrame {
  type: "open";
  streamId: string;
  kind: TunnelStreamKind;
  /** Which tunnel host the public caller addressed, for an agent serving more than one. */
  hostname: string;
  /** `http` and `websocket`. */
  method?: string;
  /** `http` and `websocket`: path plus query, already percent-encoded. */
  path?: string;
  /**
   * `http` and `websocket`. The agent replays this list verbatim, so the gateway owes it two things.
   *
   * **Strip every name in `forwardedHeaderNames` from what the public caller sent, then write its own.** Not
   * append — `hostFromRequest` reads `x-forwarded-host?.split(",")[0]`, so a caller-supplied value placed ahead
   * of the gateway's wins, and the app computes its own origin from a host the caller chose. That is Host header
   * injection: every absolute URL the app builds — a redirect, a password-reset link, an OAuth callback — points
   * at the attacker's host.
   *
   * **Write `x-forwarded-host` as the tunnel hostname.** It is what `hostFromRequest` reads, so the app behind
   * the tunnel resolves its own origin as the public URL and `CrossSiteGuard` compares the host the browser
   * actually addressed. Leave it off and every mutation from a tunnelled page is refused.
   *
   * Hop-by-hop names are stripped by both ends independently (`isHopByHop`); these cannot be, because only the
   * gateway knows who the public caller was.
   */
  headers?: TunnelHeaderList;
  /** `tcp`: the port on the local origin to dial. */
  port?: number;
  /** Whether payload frames follow this one. Absent or false means the request is complete as sent. */
  body?: boolean;
}

export interface TunnelHeadFrame {
  type: "head";
  streamId: string;
  /**
   * `101` accepts a `websocket` open and `200` accepts a `tcp` one; any other status is the agent declining, and
   * the gateway answers the public caller with it rather than upgrading.
   */
  status: number;
  statusText?: string;
  headers: TunnelHeaderList;
  body?: boolean;
}

/** No more payload in the direction this was sent. Each direction ends independently. */
export interface TunnelEndFrame {
  type: "end";
  streamId: string;
}

/** The stream failed. The socket is not reusable after one and is closed rather than returned to the pool. */
export interface TunnelResetFrame {
  type: "reset";
  streamId: string;
  code: TunnelResetCode;
  message?: string;
}

/**
 * Gateway → agent, after both directions have ended: the socket is idle again.
 *
 * Only `http` streams are released. A `websocket` or `tcp` stream owns its socket for its whole life and the
 * socket closes with it — resynchronizing a raw byte stream back to an idle pool buys nothing and is a place
 * for a desync to hide.
 */
export interface TunnelReleaseFrame {
  type: "release";
  streamId: string;
}

/**
 * A payload frame carries no stream id — a data socket holds one stream at a time, which is what keeps the hot
 * path free of a header. Three invariants are what make that safe, and an optimization that breaks any one of
 * them desynchronizes the socket silently:
 *
 * 1. Neither side sends a payload frame after its own `end` for that stream.
 * 2. `release` goes out only once *both* directions have ended.
 * 3. A JSON frame naming a `streamId` other than the current one is dropped — that is what the id is for.
 */
export type TunnelDataFromAgent = TunnelAttachFrame | TunnelHeadFrame | TunnelEndFrame | TunnelResetFrame;
export type TunnelDataFromGateway =
  | TunnelAttachedFrame
  | TunnelOpenFrame
  | TunnelEndFrame
  | TunnelResetFrame
  | TunnelReleaseFrame;

export type TunnelFrame =
  | TunnelControlFromAgent
  | TunnelControlFromGateway
  | TunnelDataFromAgent
  | TunnelDataFromGateway;

/**
 * A tunnelled WebSocket's own text/binary distinction cannot ride the tunnel socket's, which is already spoken
 * for by the control/payload split — so a `websocket` stream prefixes every payload frame with one byte. `http`
 * and `tcp` payload frames carry no prefix; their bytes are a stream with nothing to distinguish.
 */
export const tunnelWsPayload = {
  text: 0,
  binary: 1,
  /** Remainder is UTF-8 JSON `{ code, reason }` — the inner close, which is not the tunnel socket closing. */
  close: 2,
} as const;

export type TunnelWsPayloadKind = (typeof tunnelWsPayload)[keyof typeof tunnelWsPayload];

/**
 * Hop-by-hop headers, which describe one connection and are meaningless on the next. The gateway strips them
 * from what it forwards and the agent strips them from what it sends back, so neither end has to trust the other
 * to have done it.
 */
export const tunnelHopByHopHeaders = [
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "proxy-connection",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
] as const;

/**
 * Close codes, and the **only** way a refusal reaches the agent. The 4000 range is the application range every
 * WebSocket implementation passes through verbatim; an HTTP status does not survive the upgrade, because a
 * refused upgrade reaches the client as a bare `1006` with no code and no reason. The agent treats these codes
 * as final and every other close as a dropped link to retry — so a gateway that answers `401` at the upgrade
 * instead of accepting it and closing with `unauthorized` makes an agent retry a revoked token forever.
 *
 * **Accept the upgrade, then close on a later tick.** Closing inside the socket's own `open` handler races the
 * handshake the runtime is still finishing, and the client sees `1006` again with the code discarded.
 */
export const tunnelCloseCode = {
  unauthorized: 4001,
  unsupportedVersion: 4002,
  hostnameNotGranted: 4003,
  unknownSession: 4004,
  /** A newer session for the same tunnel took over; this one must not reconnect. */
  superseded: 4005,
  streamLimit: 4008,
  goingAway: 4009,
} as const;

export type TunnelCloseCode = (typeof tunnelCloseCode)[keyof typeof tunnelCloseCode];

/**
 * Headers naming the original caller. The gateway deletes these from what arrived before writing its own — see
 * `TunnelOpenFrame.headers`. `forwarded` is RFC 7239's single-header form of the same claim, and omitting it
 * would leave one spelling of the injection open.
 */
export const tunnelForwardedHeaders = [...forwardedHeaders, "forwarded"] as const;

const hopByHop = new Set<string>(tunnelHopByHopHeaders);

export const tunnelWireContract = {
  version: 1,
  controlPath: "/_tunnel/control",
  dataPath: "/_tunnel/data",
  /**
   * Both upgrades carry `Authorization: Bearer <connectorToken>` and nothing else — no code in the path, no
   * query, no second header. Keeping the URL bare is what keeps the tunnel's identity out of every access log
   * between here and the gateway, so the token is also the *only* thing the gateway can resolve a tunnel from:
   * it owns a `token -> { code, hostnames }` lookup, and the agent never names which tunnel it is.
   */
  authScheme: "Bearer",
  defaultIdleSockets: 4,
  defaultMaxSockets: 128,
  defaultHeartbeatMs: 30_000,

  /** What a sender splits an `http` or `tcp` payload to. A boundary means nothing in a byte stream. */
  chunkBytes: 64 * 1024,
  /**
   * What both ends must accept — `maxPayloadLength` on every tunnel socket is set to at least this.
   *
   * It clears 16 MB because an inner websocket message is a **message**: splitting it loses the boundary the
   * receiver needs, so it rides as one frame, and `akanApp` lets an app's own sockets carry 16 MB. The default
   * `maxPayloadLength` is 16 MB, which the largest legal inner message plus its one-byte prefix exceeds by
   * exactly the amount that makes a 100 MB upload fail on the frame that carries its last kilobyte.
   */
  maxFrameBytes: 16 * 1024 * 1024 + 4096,

  /** Deletes every `forwardedHeaderNames` entry, so the gateway writes its own onto a clean slate. */
  stripForwarded: (headers: Headers): Headers => {
    for (const name of tunnelForwardedHeaders) headers.delete(name);
    return headers;
  },

  forwardedHeaderNames: tunnelForwardedHeaders,

  isHopByHop: (name: string): boolean => hopByHop.has(name.toLowerCase()),

  /** `Headers.forEach` combines repeats into one comma-joined value — except `set-cookie`, which it yields one
   * at a time. That exception is what makes this lossless. */
  headerList: (headers: Headers): TunnelHeaderList => {
    const list: TunnelHeaderList = [];
    headers.forEach((value, name) => {
      if (!hopByHop.has(name.toLowerCase())) list.push([name, value]);
    });
    return list;
  },

  headersOf: (list: TunnelHeaderList): Headers => {
    const headers = new Headers();
    for (const [name, value] of list) {
      if (!hopByHop.has(name.toLowerCase())) headers.append(name, value);
    }
    return headers;
  },

  encodeWsPayload: (kind: TunnelWsPayloadKind, data: Uint8Array): Uint8Array => {
    const framed = new Uint8Array(data.byteLength + 1);
    framed[0] = kind;
    framed.set(data, 1);
    return framed;
  },

  decodeWsPayload: (frame: Uint8Array): { kind: TunnelWsPayloadKind; data: Uint8Array } | null => {
    if (!frame.byteLength) return null;
    const kind = frame[0] as TunnelWsPayloadKind;
    if (kind !== tunnelWsPayload.text && kind !== tunnelWsPayload.binary && kind !== tunnelWsPayload.close) return null;
    return { kind, data: frame.subarray(1) };
  },

  /** A frame that does not parse is a protocol error, never something to guess at — hence `null`, not a throw. */
  parseFrame: (raw: string): TunnelFrame | null => {
    try {
      const frame = JSON.parse(raw) as TunnelFrame;
      return frame && typeof frame === "object" && typeof (frame as { type?: unknown }).type === "string"
        ? frame
        : null;
    } catch {
      return null;
    }
  },
} as const;
