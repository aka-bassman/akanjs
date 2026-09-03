import { TrustedProxy } from "akanjs/common";

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

/** What `Server.requestIP` reports for the socket this hop accepted. */
export interface ProxyClientPeer {
  address: string;
  port: number;
  family: string;
}

export function makeAkanChildProxyHeaders(req: Request, childIdx: number, peer?: ProxyClientPeer | null): Headers {
  const headers = new Headers(req.headers);
  for (const key of HOP_BY_HOP_HEADERS) headers.delete(key);
  const forwardedFor = headers.get("x-forwarded-for");
  // The child talks to the gateway over loopback or a unix socket, so its own peer is always the gateway —
  // this is the only hop that can still see who connected. An inbound `x-real-ip` is believed only when our
  // own peer is a proxy we put there: from an untrusted peer it is a header the client wrote about itself, and
  // taking it at face value let any caller forge the address every `.with(Ip)` guard and audit line reads.
  const clientAddress = TrustedProxy.clientAddress(headers, peer?.address);
  const host = headers.get("host");
  // Unset rather than a placeholder when genuinely unknown: a loopback-looking address for an unknown caller
  // is indistinguishable from a real local one, which is the confusion this whole header exists to avoid.
  if (clientAddress) {
    headers.set("x-real-ip", clientAddress);
    headers.set("x-forwarded-for", forwardedFor ? `${forwardedFor}, ${clientAddress}` : clientAddress);
  } else {
    headers.delete("x-real-ip");
    headers.delete("x-forwarded-for");
  }
  if (peer && !headers.has("x-forwarded-port")) headers.set("x-forwarded-port", String(peer.port));
  headers.set("x-forwarded-host", headers.get("x-forwarded-host") ?? host ?? new URL(req.url).host);
  headers.set(
    "x-forwarded-proto",
    headers.get("x-forwarded-proto") ?? (req.url.startsWith("https:") ? "https" : "http"),
  );
  headers.set("x-akan-child-idx", String(childIdx));
  // Bun's `fetch` decodes whatever `Content-Encoding` the child answers with, whatever this hop asked for, so a
  // compressed child body is only ever decompressed again here. The gateway compresses for the real client; the
  // child is told plainly not to bother. Set rather than deleted: `fetch` supplies its own default otherwise.
  headers.set("accept-encoding", "identity");
  if (!headers.has("x-request-id") && process.env.AKAN_BENCH_SKIP_REQUEST_ID !== "1") {
    headers.set("x-request-id", crypto.randomUUID());
  }
  headers.set("host", "akan-child");
  return headers;
}
