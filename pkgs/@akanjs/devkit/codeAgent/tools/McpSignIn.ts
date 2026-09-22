import type { CodeAgentMcpServerRef } from "akanjs/common";
import { McpOAuth, type McpOAuthServer } from "./McpOAuth";
import { McpOAuthLoopback } from "./McpOAuthLoopback";
import { type McpStoredAuth, McpTokenStore } from "./McpTokenStore";

export interface McpSignInOptions {
  /** How the host reaches a browser. A host with none must not call {@link McpSignIn.run}. */
  open: (url: string) => void;
  onNotice?: (message: string) => void;
}

/**
 * Signing one MCP server in, and keeping it signed in.
 *
 * The two halves are deliberately apart. {@link token} runs at connect and is allowed to do anything that
 * needs no person — read a stored token, refresh an expired one — while {@link run} opens a browser and is
 * only ever called by a host that has somebody in front of it.
 *
 * Connecting must never block on a sign-in. `McpToolPack.connect` happens inside `CodeAgent.create`, before
 * the first frame is drawn, so a browser round trip there would hold the whole session on a screen that does
 * not exist yet. A server that needs a credential and has none is reported, not waited for.
 */
export class McpSignIn {
  /**
   * The bearer token to connect with, or undefined when there is none to be had without asking.
   *
   * A refresh that fails is not an error here: the stored grant was revoked or expired past refreshing, and
   * the answer is the same as having no token at all — the server will say so, and the host will offer a
   * sign-in. Throwing would cost the session every other server's tools.
   */
  static async token(ref: CodeAgentMcpServerRef, onNotice?: (message: string) => void) {
    const stored = McpTokenStore.read(ref.name);
    if (!stored) return undefined;
    if (!McpTokenStore.isExpired(stored)) return stored.accessToken;
    if (!stored.refreshToken) return undefined;
    try {
      const server: McpOAuthServer = {
        issuer: stored.issuer,
        authorizationEndpoint: "",
        tokenEndpoint: stored.tokenEndpoint,
        resource: stored.resource,
      };
      const tokens = await McpOAuth.refresh(server, stored);
      McpTokenStore.write(ref.name, {
        ...stored,
        accessToken: tokens.accessToken,
        // A server that rotates refresh tokens invalidates the old one, so keeping it would sign us out.
        ...(tokens.refreshToken ? { refreshToken: tokens.refreshToken } : {}),
        ...(tokens.expiresAt ? { expiresAt: tokens.expiresAt } : {}),
        ...(tokens.scope ? { scope: tokens.scope } : {}),
      });
      return tokens.accessToken;
    } catch (error) {
      onNotice?.(`MCP server "${ref.name}" needs signing in again — ${String(error)}`);
      return undefined;
    }
  }

  /**
   * The whole interactive flow: discover, register if needed, open a browser, store the token.
   *
   * The client registration is reused across sign-ins when the server it was made against has not moved, so a
   * second sign-in to the same provider creates no second client entry in whatever account page lists them.
   */
  static async run(ref: CodeAgentMcpServerRef, options: McpSignInOptions): Promise<McpStoredAuth> {
    if (!ref.url) throw new Error(`"${ref.name}" is a stdio server: give it its credential through "env".`);
    const challenge = await McpSignIn.challenge(ref);
    const server = await McpOAuth.discover(ref.url, challenge);
    const stored = McpTokenStore.read(ref.name);
    const reusable = stored && stored.issuer === server.issuer && !ref.oauth?.clientId ? stored : undefined;
    const loopback = McpOAuthLoopback.bind(McpSignIn.#portOf(reusable?.redirectUri));
    try {
      const redirectUri = loopback.redirectUri;
      const client = await McpSignIn.#client(ref, server, redirectUri, reusable);
      options.onNotice?.(`Opening a browser to sign in to "${ref.name}"…`);
      const scope = McpOAuth.scopeOf(ref, server);
      const tokens = await McpOAuth.authorize({
        server,
        clientId: client.clientId,
        ...(client.clientSecret ? { clientSecret: client.clientSecret } : {}),
        redirectUri,
        ...(scope ? { scope } : {}),
        open: options.open,
        wait: () => loopback.wait(),
      });
      const auth: McpStoredAuth = {
        issuer: server.issuer,
        tokenEndpoint: server.tokenEndpoint,
        resource: server.resource,
        clientId: client.clientId,
        ...(client.clientSecret ? { clientSecret: client.clientSecret } : {}),
        redirectUri,
        accessToken: tokens.accessToken,
        ...(tokens.refreshToken ? { refreshToken: tokens.refreshToken } : {}),
        ...(tokens.expiresAt ? { expiresAt: tokens.expiresAt } : {}),
        ...(tokens.scope ? { scope: tokens.scope } : {}),
      };
      McpTokenStore.write(ref.name, auth);
      return auth;
    } finally {
      loopback.close();
    }
  }

  /**
   * What the server answers an unauthenticated `initialize` with, or null when it wants no credential.
   *
   * Asked before discovery because the challenge names the resource metadata, and a server serving it under a
   * path publishes a url no client can derive. A server that answers anything but `401` is one that does not
   * need signing in, which is worth saying rather than running a flow against.
   */
  static async challenge(ref: CodeAgentMcpServerRef) {
    if (!ref.url) return null;
    try {
      const response = await fetch(ref.url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json, text/event-stream",
          ...ref.headers,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 0,
          method: "initialize",
          params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "akan-code", version: "1" } },
        }),
        signal: AbortSignal.timeout(15_000),
      });
      return response.status === 401 ? (response.headers.get("www-authenticate") ?? "") : null;
    } catch {
      // Unreachable is not unauthenticated. Discovery will try the well-known urls and report its own failure.
      return null;
    }
  }

  static async #client(
    ref: CodeAgentMcpServerRef,
    server: McpOAuthServer,
    redirectUri: string,
    reusable: McpStoredAuth | undefined,
  ) {
    if (ref.oauth?.clientId)
      return {
        clientId: ref.oauth.clientId,
        ...(ref.oauth.clientSecret ? { clientSecret: ref.oauth.clientSecret } : {}),
      };
    if (reusable && reusable.redirectUri === redirectUri)
      return {
        clientId: reusable.clientId,
        ...(reusable.clientSecret ? { clientSecret: reusable.clientSecret } : {}),
      };
    return await McpOAuth.register(server, redirectUri, ref.name);
  }

  static #portOf(redirectUri: string | undefined) {
    if (!redirectUri) return undefined;
    const port = Number(new URL(redirectUri).port);
    return Number.isFinite(port) && port > 0 ? port : undefined;
  }
}
