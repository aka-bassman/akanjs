import { describe, expect, test } from "bun:test";
import { getEnv } from "akanjs/base";
import { authTokenKey } from "akanjs/common";
import {
  adminRefreshTokenKey,
  makeAccessTokenResponse,
  makeSignoutResponse,
  makeSsoRedirectResponse,
  readRefreshTokenCookie,
  ssoSessionCookies,
  userRefreshTokenKey,
} from "./ssoHelper";

process.env.AKAN_PUBLIC_APP_NAME ??= "shared";
process.env.AKAN_PUBLIC_REPO_NAME ??= "soft-s2";
process.env.AKAN_PUBLIC_SERVE_DOMAIN ??= "localhost";

const cookieValues = (response: Response) => response.headers.getSetCookie();

describe("ssoHelper auth cookies", () => {
  test("session cookie names follow the app-scoped jwt key", () => {
    const cookies = ssoSessionCookies("token", "refresh", "user");
    expect(Object.keys(cookies)).toEqual([authTokenKey(), userRefreshTokenKey()]);
    expect(userRefreshTokenKey()).toBe(`userRefreshToken:${getEnv().appName}`);
    expect(adminRefreshTokenKey()).toBe(`adminRefreshToken:${getEnv().appName}`);
  });

  test("reads the scoped refresh cookie before the legacy name", () => {
    const cookies = new Map([
      ["userRefreshToken", "legacy"],
      [userRefreshTokenKey(), "scoped"],
    ]);
    expect(readRefreshTokenCookie({ get: (key) => cookies.get(key) }, "user")).toBe("scoped");
  });

  test("falls back to the legacy refresh cookie", () => {
    expect(readRefreshTokenCookie({ get: (key) => (key === "userRefreshToken" ? "legacy" : undefined) }, "user")).toBe(
      "legacy",
    );
  });

  test("access-token response writes the scoped refresh cookie and expires the legacy one", () => {
    const cookies = cookieValues(makeAccessTokenResponse({ jwt: "token", refreshToken: "refresh" }));
    expect(cookies.some((cookie) => cookie.startsWith(`${userRefreshTokenKey()}=refresh;`))).toBe(true);
    expect(cookies.some((cookie) => cookie.startsWith("userRefreshToken=;") && cookie.includes("Max-Age=0"))).toBe(
      true,
    );
  });

  test("signout expires both the scoped and legacy refresh cookies", () => {
    const cookies = cookieValues(makeSignoutResponse({ jwt: "" }));
    expect(
      cookies.some((cookie) => cookie.startsWith(`${userRefreshTokenKey()}=;`) && cookie.includes("Max-Age=0")),
    ).toBe(true);
    expect(cookies.some((cookie) => cookie.startsWith("userRefreshToken=;") && cookie.includes("Max-Age=0"))).toBe(
      true,
    );
  });

  test("SSO redirect writes the app-scoped jwt cookie and expires the global jwt", () => {
    const cookies = cookieValues(makeSsoRedirectResponse("/home", ssoSessionCookies("token", "refresh", "user")));
    expect(cookies.some((cookie) => cookie.startsWith(`${authTokenKey()}=token;`))).toBe(true);
    expect(cookies.some((cookie) => cookie.startsWith("jwt=;") && cookie.includes("Max-Age=0"))).toBe(true);
  });
});
