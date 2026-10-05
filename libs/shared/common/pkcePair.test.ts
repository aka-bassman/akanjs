import { describe, expect, test } from "bun:test";
import { OAuthPkce } from "akanjs/server";

import { pkcePair } from "./pkcePair";

describe("pkcePair", () => {
  test("makes an S256 pair the server's PKCE check accepts", async () => {
    const { verifier, challenge } = await pkcePair();
    expect(OAuthPkce.isVerifier(verifier)).toBe(true);
    expect(OAuthPkce.isChallenge(challenge)).toBe(true);
    expect(OAuthPkce.verify(verifier, challenge)).toBe(true);
  });

  test("never repeats a verifier", async () => {
    const [first, second] = await Promise.all([pkcePair(), pkcePair()]);
    expect(first.verifier).not.toBe(second.verifier);
  });
});
