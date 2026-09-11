import { afterEach, beforeAll, describe, expect, test } from "bun:test";

import { resolveOAuthOptions } from "./oauthServer";

type Options = Parameters<typeof resolveOAuthOptions>[0];

const resolve = (consentPath: string) => resolveOAuthOptions({ oauth: { consentPath } } as unknown as Options);
const initialBasePaths = process.env.AKAN_PUBLIC_BASE_PATHS;

describe("resolveOAuthOptions", () => {
  beforeAll(() => {
    process.env.AKAN_PUBLIC_APP_NAME ??= "shared";
    process.env.AKAN_PUBLIC_REPO_NAME ??= "akanjs";
    process.env.AKAN_PUBLIC_SERVE_DOMAIN ??= "akanjs.com";
    process.env.AKAN_PUBLIC_ENV ??= "local";
  });
  afterEach(() => {
    if (initialBasePaths === undefined) delete process.env.AKAN_PUBLIC_BASE_PATHS;
    else process.env.AKAN_PUBLIC_BASE_PATHS = initialBasePaths;
  });

  test("hands the sign-in page the consent route without the basePath the browser sees", () => {
    process.env.AKAN_PUBLIC_BASE_PATHS = "soft,office";
    const resolved = resolve("/office/oauth/consent");
    expect(resolved.consentPath).toBe("/office/oauth/consent");
    expect(resolved.consentRoute).toBe("/oauth/consent");
  });

  test("leaves the route alone when its first segment is no configured basePath", () => {
    process.env.AKAN_PUBLIC_BASE_PATHS = "soft,office";
    expect(resolve("/oauth/consent").consentRoute).toBe("/oauth/consent");
    expect(resolve("/auth/oauth/consent").consentRoute).toBe("/auth/oauth/consent");
  });

  test("keeps the whole path for an app that declares no basePath", () => {
    delete process.env.AKAN_PUBLIC_BASE_PATHS;
    expect(resolve("/office/oauth/consent").consentRoute).toBe("/office/oauth/consent");
    expect(resolve("/oauth/consent").consentRoute).toBe("/oauth/consent");
  });
});
