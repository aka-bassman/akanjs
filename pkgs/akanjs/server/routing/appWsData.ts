import {
  clientAddressFromHeaders,
  clientPortFromHeaders,
  forwardedHeaders,
  isAuthTokenKey,
  TrustedProxy,
} from "akanjs/common";

const CREDENTIAL_HEADERS = ["authorization", "cookie", "user-agent"] as const;

// Copies only the needed headers: retaining the whole Request would pin it for the socket's life.
export class AppWsData {
  static fromRequest(req: Request): AppWsData {
    const headers = new Headers();
    // Forwarded headers exist only at the handshake; behind the gateway `ws.remoteAddress` is the gateway.
    for (const key of [...CREDENTIAL_HEADERS, ...forwardedHeaders]) {
      const value = req.headers.get(key);
      if (value) headers.set(key, value);
    }
    return new AppWsData(headers);
  }
  static of(ws: Bun.ServerWebSocket<unknown>): AppWsData {
    return ws.data as AppWsData;
  }
  static applyCredential(data: AppWsData, jwt: string | null) {
    if (jwt) data.headers.set("authorization", `Bearer ${jwt}`);
    else {
      data.headers.delete("authorization");
      // Swept by key shape, not this app's key: the copied jar is the host's and may hold the legacy global key.
      for (const name of [...data.cookies].map(([name]) => name)) {
        if (isAuthTokenKey(name)) data.cookies.delete(name);
      }
      const cookie = [...data.cookies].map(([name, value]) => `${name}=${value}`).join("; ");
      if (cookie) data.headers.set("cookie", cookie);
      else data.headers.delete("cookie");
    }
    data.account = undefined;
  }
  createdAt: number;
  headers: Headers;
  cookies: Bun.CookieMap;
  account?: unknown;
  // Per-connection, process-local (a reconnect gets a new one): never a caller identity; survives credential swaps.
  socketId: string;
  // Trusts the handshake headers blindly (a child's socket came through the gateway, which settled trust);
  // endpoints read `ipOf`, which has the peer and can decide.
  get ip(): string | null {
    return clientAddressFromHeaders(this.headers);
  }
  get port(): number | null {
    return clientPortFromHeaders(this.headers);
  }
  ipOf(ws: Bun.ServerWebSocket<unknown>): string | null {
    return TrustedProxy.clientAddress(this.headers, ws.remoteAddress);
  }
  constructor(headers: Headers) {
    this.createdAt = Date.now();
    this.headers = headers;
    this.cookies = new Bun.CookieMap(headers.get("cookie") ?? "");
    this.socketId = Bun.randomUUIDv7();
  }
}
