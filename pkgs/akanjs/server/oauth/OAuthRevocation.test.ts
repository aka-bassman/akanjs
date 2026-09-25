import { describe, expect, test } from "bun:test";
import { OAuthRevocation } from "./OAuthRevocation";

const post = (form: Record<string, string>, headers: Record<string, string> = {}) =>
  new Request("https://app.example.com/oauth/revoke", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", ...headers },
    body: new URLSearchParams(form).toString(),
  });
const body = async (res: Response) => (await res.json()) as Record<string, unknown>;

describe("OAuthRevocation", () => {
  test("reads the token, an optional known hint, and the client the way the token endpoint does", async () => {
    const result = await OAuthRevocation.parse(
      post({ token: "r3fresh", token_type_hint: "refresh_token", client_id: "dcr_claude" }),
    );
    if (!result.ok) throw new Error("expected params");
    expect(result.params).toEqual({
      token: "r3fresh",
      tokenTypeHint: "refresh_token",
      client: { clientId: "dcr_claude", method: "none" },
    });
    const basic = `Basic ${Buffer.from("cursor:s3cret").toString("base64")}`;
    const confidential = await OAuthRevocation.parse(post({ token: "t" }, { authorization: basic }));
    if (!confidential.ok) throw new Error("expected params");
    expect(confidential.params.client).toEqual({ clientId: "cursor", clientSecret: "s3cret", method: "basic" });
  });

  test("ignores a hint it does not know rather than refusing the request", async () => {
    const result = await OAuthRevocation.parse(post({ token: "t", token_type_hint: "id_token", client_id: "c" }));
    if (!result.ok) throw new Error("expected params");
    expect(result.params.tokenTypeHint).toBeUndefined();
  });

  test("refuses a missing token, a non-form body and two client credentials as invalid_request", async () => {
    const missing = await OAuthRevocation.parse(post({ client_id: "c" }));
    if (missing.ok) throw new Error("expected a refusal");
    expect(missing.response.status).toBe(400);
    expect((await body(missing.response)).error).toBe("invalid_request");
    const json = await OAuthRevocation.parse(
      new Request("https://app.example.com/oauth/revoke", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: "t" }),
      }),
    );
    expect(json.ok).toBe(false);
    const doubled = await OAuthRevocation.parse(
      post({ token: "t", client_secret: "s" }, { authorization: `Basic ${Buffer.from("c:s").toString("base64")}` }),
    );
    expect(doubled.ok).toBe(false);
  });

  test("answers success as an empty, uncacheable 200", () => {
    const res = OAuthRevocation.success();
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
  });
});
