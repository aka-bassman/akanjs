import type { OAuthRedirectPolicy } from "./oauthTypes";

export class OAuthRedirect {
  // RFC 8252 §7.3 discourages `localhost`, but Claude Code redirects to it, so it counts as loopback.
  static readonly loopbackHosts: ReadonlySet<string> = new Set(["localhost", "127.0.0.1", "[::1]"]);

  /** A parsed redirect URI, or `null` for one that does not parse or carries a fragment (RFC 6749 §3.1.2). */
  static parse(uri: string): URL | null {
    try {
      const url = new URL(uri);
      return url.hash ? null : url;
    } catch {
      return null;
    }
  }

  static isLoopback(url: URL): boolean {
    return url.protocol === "http:" && OAuthRedirect.loopbackHosts.has(url.hostname);
  }

  // MCP allows only HTTPS and loopback HTTP; named private-use schemes exist for Cursor, which registers `cursor://…`.
  static isRegistrable(uri: string, { allowedSchemes = [] }: OAuthRedirectPolicy = {}): boolean {
    const url = OAuthRedirect.parse(uri);
    if (!url) return false;
    if (url.protocol === "https:" || OAuthRedirect.isLoopback(url)) return true;
    return allowedSchemes.includes(url.protocol.slice(0, -1));
  }

  // Exact match, except a loopback redirect may vary its port (RFC 8252 §7.3): native clients bind any free port.
  static matches(registered: readonly string[], presented: string): boolean {
    if (registered.includes(presented)) return true;
    const url = OAuthRedirect.parse(presented);
    if (!url || !OAuthRedirect.isLoopback(url)) return false;
    return registered.some((candidate) => {
      const known = OAuthRedirect.parse(candidate);
      return (
        !!known &&
        OAuthRedirect.isLoopback(known) &&
        known.hostname === url.hostname &&
        known.pathname === url.pathname &&
        known.search === url.search
      );
    });
  }

  /** The host a consent page shows the user — the one thing that tells a real client's redirect from an impostor's. */
  static hostOf(uri: string): string {
    return OAuthRedirect.parse(uri)?.host || uri;
  }
}
