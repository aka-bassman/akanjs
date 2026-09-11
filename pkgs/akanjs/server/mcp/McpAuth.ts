import { createHash } from "node:crypto";
import type { PromiseOrObject } from "akanjs/base";
import { clientAddressFromHeaders } from "akanjs/common";
import type { HttpRoutes } from "../types";

export interface McpAuthOption {
  /**
   * Where a client may obtain a token, published in the metadata document for it to discover. Naming one also
   * makes a credential mandatory: an MCP client begins its OAuth flow only on a 401, so a server that let an
   * anonymous `initialize` succeed would leave it connected to the anonymous shelf and never asking.
   */
  authorizationServers?: string[];
  /** Scopes every call must carry. Declaring any turns `insufficient_scope` enforcement on. */
  scopes?: string[];
  /** Overrides the resource identifier when the public URL differs from what the request reports. */
  resource?: string;
  /**
   * Verifies a bearer token's signature and returns its claims, or `null` for one this server did not mint. The
   * framework holds no signing key, so the module that issues tokens supplies this through `option.setMcp`; without
   * it the claims are read unverified and a forged token degrades to an anonymous caller instead of being refused.
   */
  verify?: (token: string) => PromiseOrObject<Record<string, unknown> | null>;
}

export interface McpAuthProps extends McpAuthOption {
  /** Path the MCP endpoint is mounted at. Its absolute URL is this server's OAuth resource identifier. */
  path: string;
}

interface McpAuthFailure {
  status: 401 | 403;
  error: "invalid_token" | "insufficient_scope";
  description: string;
}

/**
 * The OAuth 2.1 protected-resource half of the MCP authorization spec: the RFC 9728 metadata document, the
 * `WWW-Authenticate` challenge that points at it, and the token checks that can be made without an issuer.
 *
 * The authorization server itself is a separate project. What lives here is what a resource server owes a
 * client regardless of who mints the tokens, so wiring one up later needs no change on this side.
 */
export class McpAuth {
  static readonly wellKnownPath = "/.well-known/oauth-protected-resource";

  readonly #props: McpAuthProps;

  constructor(props: McpAuthProps) {
    this.#props = props;
  }

  /**
   * Both spellings of the metadata path. RFC 9728 inserts the resource's path into the well-known URL, and MCP
   * clients try that form first and the bare one second; serving only one leaves half the clients at a 404.
   */
  createRoutes(): HttpRoutes {
    const handler = { GET: (req: Request) => this.#metadata(req) };
    return {
      [McpAuth.wellKnownPath]: handler,
      [`${McpAuth.wellKnownPath}${this.#props.path}`]: handler,
    };
  }

  /**
   * A request that carried no credential at all gets a challenge with no `error` code — RFC 6750 §3.1 reserves
   * the code for a credential that was presented and found wanting — so a client reads it as "authenticate",
   * not as "your token is bad".
   */
  unauthorized(req: Request, failure?: McpAuthFailure) {
    const status = failure?.status ?? 401;
    const description = failure?.description ?? "Authentication is required to use this MCP server.";
    return Response.json(
      { ...(failure ? { error: failure.error } : {}), error_description: description },
      { status, headers: { "WWW-Authenticate": this.#challenge(req, failure) } },
    );
  }

  /**
   * Refuses a bearer token that is already provably unusable, before the signal pipeline sees it.
   *
   * With a `verify` hook the token is checked end to end and one that fails is refused outright. Without one the
   * claims are read **without verifying the signature**, which is sound only because every branch below can deny
   * and none can grant: a forged token still has to pass the app's own middleware afterwards, so the worst a
   * crafted payload achieves is refusing itself. What this buys is the failure mode it removes — an expired or
   * foreign token otherwise degrades to an anonymous caller, and the agent is told a tool does not exist rather
   * than that it needs to authenticate.
   */
  async reject(req: Request): Promise<Response | null> {
    const token = McpAuth.#bearer(req);
    if (!token) return null;
    const claims = this.#props.verify ? await this.#verified(token) : McpAuth.#claims(token);
    if (!claims) {
      if (!this.#props.verify) return null;
      return this.unauthorized(req, {
        status: 401,
        error: "invalid_token",
        description: "The access token could not be verified.",
      });
    }
    const failure = this.#failureOf(claims, req);
    return failure ? this.unauthorized(req, failure) : null;
  }

  /**
   * The 401 a credential-less request gets once an authorization server is named. A server naming none keeps
   * anonymous access, which is what a public catalogue wants; the public tools of a server naming one are still
   * reachable, with the token the challenge sends the client off to obtain.
   */
  challengeAnonymous(req: Request): Response | null {
    if (!this.#props.authorizationServers?.length || McpAuth.#bearer(req)) return null;
    return this.unauthorized(req);
  }

  /** A verifier that throws has said no: the token is refused, never let through as an anonymous caller. */
  async #verified(token: string): Promise<Record<string, unknown> | null> {
    try {
      return (await this.#props.verify?.(token)) ?? null;
    } catch {
      return null;
    }
  }

  #failureOf(claims: Record<string, unknown>, req: Request): McpAuthFailure | null {
    const { exp, aud } = claims;
    if (typeof exp === "number" && exp * 1000 <= Date.now())
      return { status: 401, error: "invalid_token", description: "The access token has expired." };
    const audience = (Array.isArray(aud) ? aud : typeof aud === "string" ? [aud] : []).filter(
      (value): value is string => typeof value === "string",
    );
    // An absent `aud` is not a violation while this server mints its own tokens: those are bound to the app and
    // environment rather than to a resource URI, and refusing them would lock out every internal caller. Naming an
    // authorization server changes that — the same issuer mints tokens for its other resources, and one that
    // reaches this server carrying no audience at all is the confused-deputy case RFC 8707 is a MUST for.
    if (this.#props.authorizationServers?.length && !audience.length)
      return { status: 401, error: "invalid_token", description: "The access token names no resource." };
    if (audience.length && !audience.includes(this.#resource(req)))
      return { status: 401, error: "invalid_token", description: "The access token was issued for another resource." };
    const missing = this.#missingScopes(claims);
    // Every missing scope at once — a client that has to discover them one 403 at a time re-authorizes N times.
    if (missing.length)
      return { status: 403, error: "insufficient_scope", description: `Missing required scope: ${missing.join(" ")}.` };
    return null;
  }

  /**
   * Enforced only when `scopes` is configured, because this server's own tokens carry no scope claim at all —
   * declaring one is how a deployment says its issuer mints them.
   */
  #missingScopes(claims: Record<string, unknown>) {
    const required = this.#props.scopes ?? [];
    if (!required.length) return [];
    const raw = claims.scope ?? claims.scp;
    const granted = new Set(Array.isArray(raw) ? raw.map(String) : String(raw ?? "").split(/\s+/));
    return required.filter((scope) => !granted.has(scope));
  }

  #metadata(req: Request) {
    const { authorizationServers, scopes } = this.#props;
    return Response.json(
      {
        resource: this.#resource(req),
        ...(authorizationServers?.length ? { authorization_servers: authorizationServers } : {}),
        bearer_methods_supported: ["header"],
        ...(scopes?.length ? { scopes_supported: scopes } : {}),
      },
      {
        // Public metadata a browser-hosted client has to read cross-origin before it holds any credential.
        headers: { "access-control-allow-origin": "*", "cache-control": "public, max-age=3600" },
      },
    );
  }

  #challenge(req: Request, failure?: McpAuthFailure) {
    const scopes = this.#props.scopes ?? [];
    return [
      "Bearer",
      [
        `resource_metadata="${new URL(McpAuth.wellKnownPath + this.#props.path, this.publicOrigin(req)).href}"`,
        ...(failure ? [`error="${failure.error}"`, `error_description="${failure.description}"`] : []),
        ...(scopes.length ? [`scope="${scopes.join(" ")}"`] : []),
      ].join(", "),
    ].join(" ");
  }

  #resource(req: Request) {
    return this.#props.resource ?? new URL(this.#props.path, this.publicOrigin(req)).href;
  }

  /**
   * The origin this server is known by. A configured `resource` settles it — that URL is what an authorization
   * server issued `aud` for, so nothing a request says can be more authoritative — and only a server with none
   * falls back to what the request reports. Every place that names the server to a client reads this: the
   * resource identifier, the `resource_metadata` URL in the challenge, and `McpRouter`'s same-origin check.
   */
  publicOrigin(req: Request) {
    if (this.#props.resource) {
      try {
        return new URL(this.#props.resource).origin;
      } catch {
        // A resource that is not a URL is a misconfiguration the metadata document already exposes verbatim.
      }
    }
    return McpAuth.origin(req);
  }

  /**
   * The public origin as the request reports it, not the one the request arrived on. Behind a proxy `req.url`
   * names the internal host the proxy dialed, and publishing that as the resource identifier is not cosmetic: an
   * authorization server issues `aud` for the URL the *client* used, so every correctly-issued token would then
   * fail the audience check.
   *
   * `x-forwarded-host` is a request header, so this is exactly as trustworthy as the edge that overwrites it, and
   * a deployment whose edge merely appends leaves both the same-origin comparison and the audience a token is
   * checked against to the caller. A browser cannot reach it — a custom header is not on a preflight, and the
   * `OPTIONS` is judged on the real host — but a direct caller can. That is why `publicOrigin` prefers a
   * configured `resource` (`AKAN_MCP_RESOURCE`, or what `libs/shared` derives from its issuer) and reads this only
   * for a server that pinned nothing.
   */
  static origin(req: Request) {
    const url = new URL(req.url);
    const forwarded = (header: string) => req.headers.get(header)?.split(",")[0]?.trim();
    const host = forwarded("x-forwarded-host") ?? req.headers.get("host") ?? url.host;
    return `${forwarded("x-forwarded-proto") ?? url.protocol.replace(":", "")}://${host}`;
  }

  /**
   * Who a rate limit counts. A bearer token is one caller however many connections it opens: its session id,
   * failing that its token id or subject, failing that the token itself hashed — an opaque token has nothing else.
   * With no token the caller is the address a proxy recorded, and callers with no recorded address share one
   * bucket, which is the right shape for a server that nothing fronts and that admits anonymous calls.
   *
   * Read unverified on purpose: this runs after `reject`, so a token that reaches it has already passed whatever
   * verification the server has, and a key needs no more than that.
   */
  static callerKey(req: Request): string {
    const token = McpAuth.#bearer(req);
    if (!token) return `ip:${clientAddressFromHeaders(req.headers) ?? "anonymous"}`;
    const claims = McpAuth.#claims(token);
    const id = [claims?.sid, claims?.jti, claims?.sub].find((value) => typeof value === "string" && value);
    return typeof id === "string" ? `token:${id}` : `token:${createHash("sha256").update(token).digest("base64url")}`;
  }

  static #bearer(req: Request): string | null {
    const [scheme, token] = (req.headers.get("authorization") ?? "").split(" ");
    return scheme === "Bearer" && token ? token : null;
  }

  static #claims(token: string): Record<string, unknown> | null {
    const segments = token.split(".");
    // An opaque token carries nothing to read, and judging one on shape alone would lock out a deployment that
    // does not use JWTs at all.
    if (segments.length !== 3) return null;
    try {
      const claims: unknown = JSON.parse(Buffer.from(segments[1], "base64url").toString("utf8"));
      return claims && typeof claims === "object" ? (claims as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
}
