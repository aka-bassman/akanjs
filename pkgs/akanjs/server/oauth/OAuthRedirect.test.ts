import { describe, expect, test } from "bun:test";
import { OAuthRedirect } from "./OAuthRedirect";

describe("OAuthRedirect registrability", () => {
  test("accepts HTTPS and loopback HTTP, refuses plain HTTP and fragments", () => {
    expect(OAuthRedirect.isRegistrable("https://claude.ai/api/mcp/auth_callback")).toBe(true);
    expect(OAuthRedirect.isRegistrable("http://localhost:8080/callback")).toBe(true);
    expect(OAuthRedirect.isRegistrable("http://127.0.0.1:8787/callback")).toBe(true);
    expect(OAuthRedirect.isRegistrable("http://[::1]:9000/cb")).toBe(true);
    expect(OAuthRedirect.isRegistrable("http://app.example.com/callback")).toBe(false);
    expect(OAuthRedirect.isRegistrable("https://app.example.com/callback#frag")).toBe(false);
    expect(OAuthRedirect.isRegistrable("not a uri")).toBe(false);
  });

  test("accepts a private-use scheme only when the deployment named it", () => {
    const cursor = "cursor://anysphere.cursor-mcp/oauth/callback";
    expect(OAuthRedirect.isRegistrable(cursor)).toBe(false);
    expect(OAuthRedirect.isRegistrable(cursor, { allowedSchemes: ["cursor"] })).toBe(true);
    expect(OAuthRedirect.isRegistrable("evil://x/y", { allowedSchemes: ["cursor"] })).toBe(false);
  });
});

describe("OAuthRedirect matching", () => {
  const registered = ["http://localhost:8080/callback", "https://claude.ai/api/mcp/auth_callback"];

  test("matches exactly, and lets a loopback redirect vary its port", () => {
    expect(OAuthRedirect.matches(registered, "https://claude.ai/api/mcp/auth_callback")).toBe(true);
    expect(OAuthRedirect.matches(registered, "http://localhost:51234/callback")).toBe(true);
    expect(OAuthRedirect.matches(registered, "http://localhost:51234/other")).toBe(false);
    expect(OAuthRedirect.matches(registered, "http://127.0.0.1:8080/callback")).toBe(false);
  });

  test("never relaxes a non-loopback redirect", () => {
    expect(OAuthRedirect.matches(registered, "https://claude.ai:8443/api/mcp/auth_callback")).toBe(false);
    expect(OAuthRedirect.matches(registered, "https://claude.ai/api/mcp/auth_callback?x=1")).toBe(false);
    expect(OAuthRedirect.matches(registered, "https://claude.ai.evil.example/api/mcp/auth_callback")).toBe(false);
  });

  test("names the host a consent page should show", () => {
    expect(OAuthRedirect.hostOf("http://localhost:8080/callback")).toBe("localhost:8080");
    expect(OAuthRedirect.hostOf("cursor://anysphere.cursor-mcp/oauth/callback")).toBe("anysphere.cursor-mcp");
  });
});
