import { createHash, timingSafeEqual } from "node:crypto";

/** RFC 7636 with `S256` only: OAuth 2.1 drops `plain`, and an MCP client refuses a server whose metadata offers nothing else. */
export class OAuthPkce {
  static readonly method = "S256";
  // RFC 7636 §4.1: 43–128 characters from the unreserved set.
  static readonly #verifier = /^[A-Za-z0-9\-._~]{43,128}$/;
  // base64url of a 32-byte digest, which is the only shape an S256 challenge can have.
  static readonly #challenge = /^[A-Za-z0-9\-_]{43}$/;

  static isVerifier(value: unknown): value is string {
    return typeof value === "string" && OAuthPkce.#verifier.test(value);
  }

  static isChallenge(value: unknown): value is string {
    return typeof value === "string" && OAuthPkce.#challenge.test(value);
  }

  static challengeOf(verifier: string): string {
    return createHash("sha256").update(verifier).digest("base64url");
  }

  static verify(verifier: unknown, challenge: string): boolean {
    if (!OAuthPkce.isVerifier(verifier)) return false;
    const expected = Buffer.from(OAuthPkce.challengeOf(verifier));
    const presented = Buffer.from(challenge);
    return expected.length === presented.length && timingSafeEqual(expected, presented);
  }
}
