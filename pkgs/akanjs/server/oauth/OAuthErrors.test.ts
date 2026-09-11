import { describe, expect, test } from "bun:test";
import { OAuthErrors } from "./OAuthErrors";

describe("OAuthErrors", () => {
  test("answers invalid_client with 401 and names the scheme only when a header carried the credential", async () => {
    const basic = OAuthErrors.token("invalid_client", "Unknown client.", { method: "basic" });
    expect(basic.status).toBe(401);
    expect(basic.headers.get("www-authenticate")).toContain("Basic");
    const body = OAuthErrors.token("invalid_client", "Unknown client.", { method: "body" });
    expect(body.status).toBe(401);
    expect(body.headers.get("www-authenticate")).toBeNull();
    const grant = OAuthErrors.token("invalid_grant", "The code was already used.");
    expect(grant.status).toBe(400);
    expect(grant.headers.get("cache-control")).toBe("no-store");
    expect(await grant.json()).toEqual({ error: "invalid_grant", error_description: "The code was already used." });
  });

  test("redirects with code, state and iss, keeping the client's own query and a private-use scheme intact", () => {
    const res = OAuthErrors.redirectWithCode("http://localhost:8080/callback?app=1", {
      code: "c0de",
      state: "xyz",
      iss: "https://app.example.com",
    });
    expect(res.status).toBe(302);
    const target = new URL(res.headers.get("location") ?? "");
    expect(target.searchParams.get("app")).toBe("1");
    expect(target.searchParams.get("code")).toBe("c0de");
    expect(target.searchParams.get("state")).toBe("xyz");
    expect(target.searchParams.get("iss")).toBe("https://app.example.com");
    const cursor = OAuthErrors.redirect("cursor://anysphere.cursor-mcp/oauth/callback", {
      error: "access_denied",
      iss: "https://app.example.com",
    });
    const location = cursor.headers.get("location") ?? "";
    expect(location.startsWith("cursor://anysphere.cursor-mcp/oauth/callback?")).toBe(true);
    expect(location).toContain("error=access_denied");
    expect(location).not.toContain("state=");
  });

  test("renders a page with the detail escaped", async () => {
    const res = OAuthErrors.page(400, "Unknown client", 'No client "<img onerror=x>" is registered.');
    expect(res.status).toBe(400);
    const html = await res.text();
    expect(html).not.toContain("<img");
    expect(html).toContain("&#60;img");
  });
});
