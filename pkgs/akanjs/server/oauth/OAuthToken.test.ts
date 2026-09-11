import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { OAuthToken } from "./OAuthToken";
import type { OAuthClientRecord } from "./oauthTypes";

const post = (form: Record<string, string>, headers: Record<string, string> = {}) =>
  new Request("https://app.example.com/oauth/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", ...headers },
    body: new URLSearchParams(form).toString(),
  });
const hash = (secret: string) => createHash("sha256").update(secret).digest("hex");
const body = async (res: Response) => (await res.json()) as Record<string, unknown>;

describe("OAuthToken parse", () => {
  test("reads an authorization_code exchange from a public client", async () => {
    const result = await OAuthToken.parse(
      post({
        grant_type: "authorization_code",
        code: "c0de",
        code_verifier: "v".repeat(43),
        redirect_uri: "http://localhost:8080/callback",
        client_id: "dcr_claude",
        resource: "https://app.example.com/mcp",
      }),
    );
    if (!result.ok) throw new Error("expected params");
    expect(result.params).toEqual({
      grantType: "authorization_code",
      code: "c0de",
      codeVerifier: "v".repeat(43),
      redirectUri: "http://localhost:8080/callback",
      resource: "https://app.example.com/mcp",
      client: { clientId: "dcr_claude", method: "none" },
    });
  });

  test("reads a refresh and a Basic-authenticated confidential client, decoding RFC 6749 §2.3.1 escaping", async () => {
    const basic = `Basic ${Buffer.from("cursor%3Aapp:s%26cret").toString("base64")}`;
    const result = await OAuthToken.parse(
      post({ grant_type: "refresh_token", refresh_token: "r3fresh" }, { authorization: basic }),
    );
    if (!result.ok) throw new Error("expected params");
    expect(result.params.grantType).toBe("refresh_token");
    expect(result.params.client).toEqual({ clientId: "cursor:app", clientSecret: "s&cret", method: "basic" });
    const inBody = await OAuthToken.parse(
      post({ grant_type: "refresh_token", refresh_token: "r3fresh", client_id: "c", client_secret: "s" }),
    );
    if (!inBody.ok) throw new Error("expected params");
    expect(inBody.params.client.method).toBe("body");
  });

  test("refuses the shapes RFC 6749 rules out", async () => {
    const notForm = await OAuthToken.parse(
      new Request("https://app.example.com/oauth/token", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ grant_type: "authorization_code" }),
      }),
    );
    if (notForm.ok) throw new Error("expected a refusal");
    expect((await body(notForm.response)).error).toBe("invalid_request");
    const twoCredentials = await OAuthToken.parse(
      post({ grant_type: "refresh_token", refresh_token: "r", client_secret: "s" }, { authorization: "Basic YTpi" }),
    );
    if (twoCredentials.ok) throw new Error("expected a refusal");
    expect((await body(twoCredentials.response)).error_description).toContain("one client authentication method");
    const unsupported = await OAuthToken.parse(post({ grant_type: "client_credentials" }));
    if (unsupported.ok) throw new Error("expected a refusal");
    expect(unsupported.response.status).toBe(400);
    expect((await body(unsupported.response)).error).toBe("unsupported_grant_type");
    const noCode = await OAuthToken.parse(post({ grant_type: "authorization_code" }));
    if (noCode.ok) throw new Error("expected a refusal");
    expect((await body(noCode.response)).error).toBe("invalid_request");
  });
});

describe("OAuthToken authenticate", () => {
  const confidential: OAuthClientRecord = {
    clientId: "cursor",
    redirectUris: ["http://localhost:8787/callback"],
    grantTypes: ["authorization_code"],
    tokenEndpointAuthMethod: "client_secret_post",
    clientSecretHash: hash("s3cret"),
    source: "static",
  };

  test("lets a public client through and holds a confidential one to its secret", () => {
    const publicClient: OAuthClientRecord = {
      ...confidential,
      tokenEndpointAuthMethod: "none",
      clientSecretHash: undefined,
    };
    expect(OAuthToken.authenticate(publicClient, { clientId: "cursor", method: "none" }, hash)).toBe(true);
    expect(
      OAuthToken.authenticate(publicClient, { clientId: "cursor", clientSecret: "stray", method: "body" }, hash),
    ).toBe(true);
    expect(
      OAuthToken.authenticate(confidential, { clientId: "cursor", clientSecret: "s3cret", method: "body" }, hash),
    ).toBe(true);
    expect(
      OAuthToken.authenticate(confidential, { clientId: "cursor", clientSecret: "wrong", method: "body" }, hash),
    ).toBe(false);
    expect(OAuthToken.authenticate(confidential, { clientId: "cursor", method: "none" }, hash)).toBe(false);
  });
});

describe("OAuthToken success", () => {
  test("answers RFC 6749 §5.1 with the caching headers it makes mandatory", async () => {
    const res = OAuthToken.success({ accessToken: "a", expiresIn: 3600, refreshToken: "r" });
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(res.headers.get("pragma")).toBe("no-cache");
    expect(await body(res)).toEqual({ access_token: "a", token_type: "Bearer", expires_in: 3600, refresh_token: "r" });
  });
});
