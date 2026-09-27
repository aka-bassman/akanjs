import { describe, expect, test } from "bun:test";
import { OAuthPkce } from "./OAuthPkce";

// RFC 7636 Appendix B.
const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
const challenge = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM";

describe("OAuthPkce", () => {
  test("derives the RFC 7636 test vector and verifies it", () => {
    expect(OAuthPkce.challengeOf(verifier)).toBe(challenge);
    expect(OAuthPkce.verify(verifier, challenge)).toBe(true);
    expect(OAuthPkce.verify(`${verifier.slice(0, -1)}x`, challenge)).toBe(false);
  });

  test("refuses a verifier outside the RFC 7636 alphabet or length", () => {
    expect(OAuthPkce.isVerifier("too-short")).toBe(false);
    expect(OAuthPkce.isVerifier("a".repeat(129))).toBe(false);
    expect(OAuthPkce.isVerifier(`${"a".repeat(42)}!`)).toBe(false);
    expect(OAuthPkce.isVerifier(undefined)).toBe(false);
    expect(OAuthPkce.verify(undefined, challenge)).toBe(false);
  });

  test("recognises only the shape an S256 challenge can have", () => {
    expect(OAuthPkce.isChallenge(challenge)).toBe(true);
    // A 43-character `plain` challenge fits this shape; `OAuthAuthorize` refuses it by its method instead.
    expect(OAuthPkce.isChallenge(`${challenge}=`)).toBe(false);
    expect(OAuthPkce.isChallenge("")).toBe(false);
  });
});
