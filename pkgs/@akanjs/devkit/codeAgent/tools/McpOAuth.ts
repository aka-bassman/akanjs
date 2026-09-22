import { createHash, randomBytes } from "node:crypto";
import type { CodeAgentMcpServerRef } from "akanjs/common";
import type { McpStoredAuth } from "./McpTokenStore";

export interface McpOAuthServer {
  issuer: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  registrationEndpoint?: string;
  scopesSupported?: string[];
  /** RFC 8707: what the token is minted for, which is the MCP endpoint and not the authorization server. */
  resource: string;
  /** Scopes the resource asked for in its own metadata, which are the ones to request. */
  resourceScopes?: string[];
}

export interface McpOAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  scope?: string;
}

interface TokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  error?: string;
  error_description?: string;
}

/**
 * The client half of the MCP authorization spec: discovery, registration, and the authorization code flow.
 *
 * Every step is discovered rather than configured. A `401` names the resource metadata, that names the
 * authorization server, and its RFC 8414 document names the endpoints — so connecting to a server nobody has
 * described here needs no entry beyond its url. `pkgs/akanjs/server/mcp/McpAuth.ts` is the other half of the
 * same contract, and an akan app is therefore a server this can sign in to with nothing declared at all.
 *
 * **PKCE is mandatory and `S256` is the only method.** OAuth 2.1 drops `plain`, and the spec requires a client
 * to refuse a server whose metadata does not offer `S256` rather than fall back — a downgrade a network
 * attacker would otherwise choose on the client's behalf.
 */
export class McpOAuth {
  /** RFC 9728. A client tries the path-inserted spelling first and the bare one second. */
  static readonly resourceWellKnown = "/.well-known/oauth-protected-resource";
  static readonly serverWellKnown = "/.well-known/oauth-authorization-server";
  static readonly openidWellKnown = "/.well-known/openid-configuration";
  /**
   * Loopback ports tried in order, and why there is a fixed list rather than an ephemeral port.
   *
   * A registered client is bound to the exact `redirect_uri` it was registered with, so a port chosen afresh
   * every time would invalidate the registration on every sign-in. The port that was used is stored with the
   * client; this list is only what a first sign-in reaches for.
   */
  static readonly ports = [33418, 33419, 33420, 33421, 33422];
  static readonly callbackPath = "/callback";
  /** How long the browser half may take before the loopback server gives the port back. */
  static readonly timeoutMs = 300_000;

  static #json(response: Response) {
    return response.json() as Promise<Record<string, unknown>>;
  }

  /**
   * The `resource_metadata` a `WWW-Authenticate` challenge points at.
   *
   * Taken from the header when it is there rather than derived, because a resource served under a path has
   * its path inserted into the well-known url and only the server knows which spelling it published.
   */
  static resourceMetadataUrls(serverUrl: string, challenge?: string | null) {
    const named = challenge ? /resource_metadata="([^"]+)"/.exec(challenge)?.[1] : undefined;
    if (named) return [named];
    const url = new URL(serverUrl);
    const withPath = url.pathname === "/" ? "" : url.pathname.replace(/\/$/, "");
    return [
      new URL(`${McpOAuth.resourceWellKnown}${withPath}`, url.origin).href,
      new URL(McpOAuth.resourceWellKnown, url.origin).href,
    ];
  }

  /** RFC 8414 §3.1 inserts the issuer's path after the suffix; OpenID appends it. Both are tried. */
  static serverMetadataUrls(issuer: string) {
    const url = new URL(issuer);
    const withPath = url.pathname === "/" ? "" : url.pathname.replace(/\/$/, "");
    return [
      new URL(`${McpOAuth.serverWellKnown}${withPath}`, url.origin).href,
      new URL(`${withPath}${McpOAuth.openidWellKnown}`, url.origin).href,
      new URL(McpOAuth.serverWellKnown, url.origin).href,
    ];
  }

  /**
   * Everything needed to run the flow, from the server url and whatever its `401` said.
   *
   * A resource that publishes no metadata is not refused: plenty of servers implement the token half of the
   * spec and not the discovery half, and for those the server's own origin is the issuer to try.
   */
  static async discover(serverUrl: string, challenge?: string | null): Promise<McpOAuthServer> {
    const resourceDoc = await McpOAuth.#first(McpOAuth.resourceMetadataUrls(serverUrl, challenge));
    const resource = typeof resourceDoc?.resource === "string" ? resourceDoc.resource : serverUrl;
    const resourceScopes = McpOAuth.#strings(resourceDoc?.scopes_supported);
    const issuers = McpOAuth.#strings(resourceDoc?.authorization_servers);
    const candidates = issuers.length ? issuers : [new URL(serverUrl).origin];
    for (const issuer of candidates) {
      const doc = await McpOAuth.#first(McpOAuth.serverMetadataUrls(issuer));
      if (!doc) continue;
      const methods = McpOAuth.#strings(doc.code_challenge_methods_supported);
      // The spec says refuse rather than downgrade: a metadata document that omits S256 is either a server
      // too old for OAuth 2.1 or one a network attacker rewrote, and both answers are "do not send a code".
      if (methods.length && !methods.includes("S256"))
        throw new Error(`${issuer} does not offer PKCE S256, which is the only method this client will use.`);
      const authorizationEndpoint = typeof doc.authorization_endpoint === "string" ? doc.authorization_endpoint : "";
      const tokenEndpoint = typeof doc.token_endpoint === "string" ? doc.token_endpoint : "";
      if (!authorizationEndpoint || !tokenEndpoint) continue;
      return {
        issuer: typeof doc.issuer === "string" ? doc.issuer : issuer,
        authorizationEndpoint,
        tokenEndpoint,
        ...(typeof doc.registration_endpoint === "string" ? { registrationEndpoint: doc.registration_endpoint } : {}),
        ...(McpOAuth.#strings(doc.scopes_supported).length
          ? { scopesSupported: McpOAuth.#strings(doc.scopes_supported) }
          : {}),
        resource,
        ...(resourceScopes.length ? { resourceScopes } : {}),
      };
    }
    throw new Error(`No OAuth metadata was found for ${serverUrl}. Declare "oauth" for it in mcp.json.`);
  }

  /** RFC 7591. What lets a hosted server be reached with nothing declared but its url. */
  static async register(server: McpOAuthServer, redirectUri: string, name: string) {
    if (!server.registrationEndpoint)
      throw new Error(
        `${server.issuer} registers no clients on demand. Put its "oauth": { "clientId": "…" } in mcp.json.`,
      );
    const response = await fetch(server.registrationEndpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        client_name: `akan code (${name})`,
        redirect_uris: [redirectUri],
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
        // A CLI cannot keep a secret, so it says so and the server issues a public client.
        token_endpoint_auth_method: "none",
        application_type: "native",
      }),
      signal: AbortSignal.timeout(30_000),
    });
    const body = (await McpOAuth.#json(response)) as { client_id?: string; client_secret?: string; error?: string };
    if (!response.ok || !body.client_id)
      throw new Error(`${server.issuer} refused the client registration: ${body.error ?? response.status}`);
    return { clientId: body.client_id, ...(body.client_secret ? { clientSecret: body.client_secret } : {}) };
  }

  /**
   * The authorization code flow, start to finish, against a loopback redirect.
   *
   * The browser is opened by the caller: this module has no opinion about how a host reaches one, and a pod
   * has no browser at all. `state` is checked on the way back, and `iss` too whenever the server sends it —
   * without that check a response from one authorization server can be replayed at another.
   */
  static async authorize(options: {
    server: McpOAuthServer;
    clientId: string;
    clientSecret?: string;
    redirectUri: string;
    scope?: string;
    /** Receives the url to open. Nothing happens until somebody visits it. */
    open: (url: string) => void;
    /** The already-bound loopback that answers the redirect. */
    wait: () => Promise<URLSearchParams>;
  }): Promise<McpOAuthTokens> {
    const verifier = randomBytes(32).toString("base64url");
    const state = randomBytes(16).toString("base64url");
    const scope =
      options.scope ?? options.server.resourceScopes?.join(" ") ?? options.server.scopesSupported?.join(" ");
    const authorize = new URL(options.server.authorizationEndpoint);
    for (const [key, value] of Object.entries({
      response_type: "code",
      client_id: options.clientId,
      redirect_uri: options.redirectUri,
      code_challenge: createHash("sha256").update(verifier).digest("base64url"),
      code_challenge_method: "S256",
      state,
      resource: options.server.resource,
      ...(scope ? { scope } : {}),
    }))
      authorize.searchParams.set(key, value);
    options.open(authorize.href);
    const params = await options.wait();
    const error = params.get("error");
    if (error) throw new Error(`${error}: ${params.get("error_description") ?? "the authorization was refused"}`);
    if (params.get("state") !== state) throw new Error("The authorization response carried the wrong state.");
    const iss = params.get("iss");
    if (iss && iss !== options.server.issuer)
      throw new Error(`The authorization response came from ${iss}, not ${options.server.issuer}.`);
    const code = params.get("code");
    if (!code) throw new Error("The authorization response carried no code.");
    return await McpOAuth.#token(options.server, {
      grant_type: "authorization_code",
      code,
      redirect_uri: options.redirectUri,
      client_id: options.clientId,
      code_verifier: verifier,
      resource: options.server.resource,
      ...(options.clientSecret ? { client_secret: options.clientSecret } : {}),
    });
  }

  static async refresh(server: McpOAuthServer, auth: McpStoredAuth) {
    if (!auth.refreshToken) throw new Error("There is no refresh token for this server.");
    return await McpOAuth.#token(server, {
      grant_type: "refresh_token",
      refresh_token: auth.refreshToken,
      client_id: auth.clientId,
      resource: server.resource,
      ...(auth.clientSecret ? { client_secret: auth.clientSecret } : {}),
      ...(auth.scope ? { scope: auth.scope } : {}),
    });
  }

  /** The scope a server was signed in with, or what its metadata asks for, for a refresh that must restate it. */
  static scopeOf(ref: CodeAgentMcpServerRef, server: McpOAuthServer) {
    return ref.oauth?.scope ?? server.resourceScopes?.join(" ") ?? server.scopesSupported?.join(" ");
  }

  static async #token(server: McpOAuthServer, form: Record<string, string>): Promise<McpOAuthTokens> {
    const response = await fetch(server.tokenEndpoint, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
      body: new URLSearchParams(form).toString(),
      signal: AbortSignal.timeout(30_000),
    });
    const body = (await McpOAuth.#json(response)) as TokenResponse;
    if (!response.ok || !body.access_token)
      throw new Error(`${server.tokenEndpoint} refused the token request: ${body.error ?? response.status}`);
    return {
      accessToken: body.access_token,
      ...(body.refresh_token ? { refreshToken: body.refresh_token } : {}),
      ...(body.expires_in ? { expiresAt: Date.now() + body.expires_in * 1_000 } : {}),
      ...(body.scope ? { scope: body.scope } : {}),
    };
  }

  /** The first url that answers a JSON document; a 404 on one spelling is the normal case, not a failure. */
  static async #first(urls: string[]) {
    for (const url of urls) {
      try {
        const response = await fetch(url, {
          headers: { accept: "application/json", "mcp-protocol-version": "2025-06-18" },
          signal: AbortSignal.timeout(15_000),
        });
        if (!response.ok) continue;
        return await McpOAuth.#json(response);
      } catch {
        // A metadata url that does not resolve is one spelling out of several; the caller tries the next.
      }
    }
    return undefined;
  }

  static #strings(value: unknown) {
    return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
  }
}
