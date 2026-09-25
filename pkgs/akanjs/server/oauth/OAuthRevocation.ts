import { OAuthErrors } from "./OAuthErrors";
import { OAuthToken } from "./OAuthToken";
import type { OAuthClientCredential } from "./oauthTypes";

export type OAuthTokenTypeHint = "access_token" | "refresh_token";

export interface OAuthRevocationParams {
  token: string;
  /** The client's guess at what it is handing over; a server may ignore it, and an unknown hint reads as none. */
  tokenTypeHint?: OAuthTokenTypeHint;
  client: OAuthClientCredential;
}

export type OAuthRevocationParseResult =
  | { ok: true; params: OAuthRevocationParams }
  | { ok: false; response: Response };

/**
 * RFC 7009 Token Revocation — the request's shape and the two answers it allows. What a token *is* and whose it
 * is are the issuer's to decide, so the parse hands back the credential and the token and nothing more.
 */
export class OAuthRevocation {
  static readonly hints: readonly OAuthTokenTypeHint[] = ["access_token", "refresh_token"];

  /** §2.1: form-encoded like the token endpoint, with the same client authentication and `token` required. */
  static async parse(req: Request): Promise<OAuthRevocationParseResult> {
    const type = req.headers.get("content-type")?.toLowerCase() ?? "";
    if (!type.startsWith("application/x-www-form-urlencoded"))
      return OAuthRevocation.#fail("The revocation request must be application/x-www-form-urlencoded.");
    const form = new URLSearchParams(await req.text());
    const client = OAuthToken.credentialOf(req, form);
    if (!client) return OAuthRevocation.#fail("Use one client authentication method, not two.");
    const token = form.get("token");
    if (!token) return OAuthRevocation.#fail("`token` is required.");
    const hint = form.get("token_type_hint");
    return {
      ok: true,
      params: {
        token,
        ...(OAuthRevocation.hints.includes(hint as OAuthTokenTypeHint)
          ? { tokenTypeHint: hint as OAuthTokenTypeHint }
          : {}),
        client,
      },
    };
  }

  /**
   * §2.2: a revoked token and a token the server never knew get the same empty 200, so the endpoint cannot be used
   * to test whether a token exists. The only refusals are a malformed request and a client that failed to
   * authenticate, both answered as the token endpoint would.
   */
  static success() {
    return new Response(null, { status: 200, headers: OAuthErrors.noStore });
  }

  static #fail(description: string): OAuthRevocationParseResult {
    return { ok: false, response: OAuthErrors.token("invalid_request", description) };
  }
}
