import { timingSafeEqual } from "node:crypto";
import { OAuthErrors } from "./OAuthErrors";
import type { OAuthClientCredential, OAuthClientRecord, OAuthTokenParams } from "./oauthTypes";

export type OAuthTokenParseResult = { ok: true; params: OAuthTokenParams } | { ok: false; response: Response };

export interface OAuthTokenSuccess {
  accessToken: string;
  expiresIn: number;
  refreshToken?: string;
  scope?: string;
}

export class OAuthToken {
  // RFC 6749 §4.1.3/§6: form encoding only, and one credential channel — two on one request cannot be audited.
  static async parse(req: Request): Promise<OAuthTokenParseResult> {
    const type = req.headers.get("content-type")?.toLowerCase() ?? "";
    if (!type.startsWith("application/x-www-form-urlencoded"))
      return OAuthToken.#fail("invalid_request", "The token request must be application/x-www-form-urlencoded.");
    const form = new URLSearchParams(await req.text());
    const credential = OAuthToken.credentialOf(req, form);
    if (!credential) return OAuthToken.#fail("invalid_request", "Use one client authentication method, not two.");
    const grantType = form.get("grant_type");
    const field = (name: string) => form.get(name) ?? undefined;
    if (grantType === "authorization_code") {
      const code = form.get("code");
      if (!code) return OAuthToken.#fail("invalid_request", "`code` is required.");
      return {
        ok: true,
        params: {
          grantType,
          code,
          codeVerifier: field("code_verifier"),
          redirectUri: field("redirect_uri"),
          resource: field("resource"),
          client: credential,
        },
      };
    }
    if (grantType === "refresh_token") {
      const refreshToken = form.get("refresh_token");
      if (!refreshToken) return OAuthToken.#fail("invalid_request", "`refresh_token` is required.");
      return {
        ok: true,
        params: { grantType, refreshToken, resource: field("resource"), scope: field("scope"), client: credential },
      };
    }
    return OAuthToken.#fail("unsupported_grant_type", "Only authorization_code and refresh_token are supported.");
  }

  // OAuth 2.1 §2.3: a public client's stray secret is ignored, not refused.
  static authenticate(
    client: OAuthClientRecord,
    credential: OAuthClientCredential,
    hash: (secret: string) => string,
  ): boolean {
    if (client.tokenEndpointAuthMethod === "none") return true;
    if (!credential.clientSecret || !client.clientSecretHash) return false;
    const presented = Buffer.from(hash(credential.clientSecret));
    const known = Buffer.from(client.clientSecretHash);
    return presented.length === known.length && timingSafeEqual(presented, known);
  }

  /** RFC 6749 §5.1, with the caching headers it makes mandatory. */
  static success({ accessToken, expiresIn, refreshToken, scope }: OAuthTokenSuccess) {
    return Response.json(
      {
        access_token: accessToken,
        token_type: "Bearer",
        expires_in: expiresIn,
        ...(refreshToken ? { refresh_token: refreshToken } : {}),
        ...(scope ? { scope } : {}),
      },
      { headers: OAuthErrors.noStore },
    );
  }

  /** `null` when both channels carried a credential. Basic halves are form-encoded (RFC 6749 §2.3.1). */
  static credentialOf(req: Request, form: URLSearchParams): OAuthClientCredential | null {
    const header = req.headers.get("authorization");
    const bodySecret = form.get("client_secret") ?? undefined;
    if (header && /^Basic /i.test(header)) {
      if (bodySecret !== undefined) return null;
      const decoded = Buffer.from(header.slice("Basic ".length).trim(), "base64").toString("utf8");
      const separator = decoded.indexOf(":");
      const [id, secret] = separator < 0 ? [decoded, ""] : [decoded.slice(0, separator), decoded.slice(separator + 1)];
      return { clientId: OAuthToken.#decode(id), clientSecret: OAuthToken.#decode(secret), method: "basic" };
    }
    const clientId = form.get("client_id") ?? undefined;
    if (bodySecret !== undefined) return { clientId, clientSecret: bodySecret, method: "body" };
    return { clientId, method: "none" };
  }

  static #decode(value: string): string {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  static #fail(error: "invalid_request" | "unsupported_grant_type", description: string): OAuthTokenParseResult {
    return { ok: false, response: OAuthErrors.token(error, description) };
  }
}
