import { createHash } from "node:crypto";
import type { PromiseOrObject } from "akanjs/base";
import { clientAddressFromHeaders } from "akanjs/common";
import type { HttpRoutes } from "../types";

export interface McpAuthOption {
  /** Naming any makes a credential mandatory: an MCP client starts its OAuth flow only on a 401. */
  authorizationServers?: string[];
  /** Declaring any turns `insufficient_scope` enforcement on. */
  scopes?: string[];
  /** Overrides the resource identifier when the public URL differs from what the request reports. */
  resource?: string;
  /** Claims, or `null` to refuse. Unset: claims are read unverified, so a forged token degrades to anonymous. */
  verify?: (token: string) => PromiseOrObject<Record<string, unknown> | null>;
}

export interface McpAuthProps extends McpAuthOption {
  path: string;
}

interface McpAuthFailure {
  status: 401 | 403;
  error: "invalid_token" | "insufficient_scope";
  description: string;
}

// The OAuth 2.1 protected-resource half of MCP auth (RFC 9728); the authorization server lives elsewhere.
export class McpAuth {
  static readonly wellKnownPath = "/.well-known/oauth-protected-resource";

  readonly #props: McpAuthProps;

  constructor(props: McpAuthProps) {
    this.#props = props;
  }

  // RFC 9728 inserts the resource path into the well-known URL; clients try that form first, then the bare one.
  createRoutes(): HttpRoutes {
    const handler = { GET: (req: Request) => this.#metadata(req) };
    return {
      [McpAuth.wellKnownPath]: handler,
      [`${McpAuth.wellKnownPath}${this.#props.path}`]: handler,
    };
  }

  // No credential, no `error` code: RFC 6750 §3.1 reserves it for a presented credential found wanting.
  unauthorized(req: Request, failure?: McpAuthFailure) {
    const status = failure?.status ?? 401;
    const description = failure?.description ?? "Authentication is required to use this MCP server.";
    return Response.json(
      { ...(failure ? { error: failure.error } : {}), error_description: description },
      { status, headers: { "WWW-Authenticate": this.#challenge(req, failure) } },
    );
  }

  // Without `verify` the claims are read unverified — sound only because every branch here can deny and none grant;
  // it turns an expired or foreign token into a challenge instead of an anonymous caller.
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

  challengeAnonymous(req: Request): Response | null {
    if (!this.#props.authorizationServers?.length || McpAuth.#bearer(req)) return null;
    return this.unauthorized(req);
  }

  // A verifier that throws has said no: the token is refused, never let through as an anonymous caller.
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
    // Own tokens bind app and environment, not a resource URI, so no `aud` passes — until an authorization server is
    // named: its tokens for other resources could then arrive audience-less (RFC 8707 confused deputy).
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

  // Only when `scopes` is configured: this server's own tokens carry no scope claim at all.
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

  // A configured `resource` wins: it is what the authorization server issued `aud` for, so no request outranks it.
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

  // Behind a proxy `req.url` is the internal host, while `aud` names the URL the client used. `x-forwarded-host` is
  // only as trustworthy as the edge (a direct caller can forge it), hence `publicOrigin` prefers a pinned resource.
  static origin(req: Request) {
    const url = new URL(req.url);
    const forwarded = (header: string) => req.headers.get(header)?.split(",")[0]?.trim();
    const host = forwarded("x-forwarded-host") ?? req.headers.get("host") ?? url.host;
    return `${forwarded("x-forwarded-proto") ?? url.protocol.replace(":", "")}://${host}`;
  }

  // Read unverified on purpose: this runs after `reject`, so the token already passed whatever verification exists.
  static callerKey(req: Request): string {
    const token = McpAuth.#bearer(req);
    if (!token) return `ip:${clientAddressFromHeaders(req.headers) ?? "anonymous"}`;
    const claims = McpAuth.#claims(token);
    const id = [claims?.sid, claims?.jti, claims?.sub].find((value) => typeof value === "string" && value);
    return typeof id === "string" ? `token:${id}` : `token:${createHash("sha256").update(token).digest("base64url")}`;
  }

  // Case-insensitive (RFC 7235), split on spaces and unanchored like the account layer's own parse: a token that
  // layer accepts but this one missed would skip the expiry, audience and scope checks.
  static #bearer(req: Request): string | null {
    return /^Bearer +([^ ]+)/i.exec(req.headers.get("authorization") ?? "")?.[1] ?? null;
  }

  static #claims(token: string): Record<string, unknown> | null {
    const segments = token.split(".");
    // Opaque tokens carry nothing to read; judging them on shape would lock out deployments without JWTs.
    if (segments.length !== 3) return null;
    try {
      const claims: unknown = JSON.parse(Buffer.from(segments[1], "base64url").toString("utf8"));
      return claims && typeof claims === "object" ? (claims as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
}
