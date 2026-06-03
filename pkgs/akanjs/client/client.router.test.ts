import { afterEach, beforeAll, describe, expect, mock, test } from "bun:test";

type Side = "server" | "client";

const envState = {
  side: "client" as Side,
  operationMode: "local",
  basePaths: "admin,console",
};
const requestState = {
  request: undefined as Request | undefined,
  headers: new Map<string, string>(),
};
const messages: unknown[] = [];
const timeoutCallbacks: Array<() => void> = [];

beforeAll(() => {
  mock.module("akanjs/base", () => ({
    getEnv: () => ({
      side: envState.side,
      renderMode: "csr",
      appName: "test-app",
      environment: "debug",
      operationMode: envState.operationMode,
    }),
  }));
  mock.module("akanjs/common", () => ({
    Logger: { log: () => undefined, verbose: () => undefined },
    parseAkanI18nEnv: () => ({ locales: ["en", "ko"], defaultLocale: "en" }),
    parseBasePaths: (value?: string) => (value ? value.split(",").filter(Boolean) : []),
    pathGet: (path: string, obj: Record<string, unknown>, separator = ".", fallback?: unknown) =>
      path.split(separator).reduce<unknown>((acc, key) => {
        if (!acc || typeof acc !== "object") return fallback;
        return (acc as Record<string, unknown>)[key] ?? fallback;
      }, obj),
    getBasePathFromPathname: (
      pathname: string,
      opts: { basePaths: Set<string>; i18n: { locales: string[] }; headerBasePath?: string },
    ) => {
      if (opts.headerBasePath) return opts.headerBasePath;
      const [, lang, base] = pathname.split("/");
      return opts.i18n.locales.includes(lang ?? "") && base && opts.basePaths.has(base) ? base : null;
    },
  }));
  mock.module("akanjs/fetch", () => ({
    FetchClient: {
      build: () => ({ fetch: { setJwt: () => undefined }, sig: {} }),
    },
    defaultAccount: { appName: "test-app", environment: "debug" },
    requestStorage: {
      getStore: () => requestState.request,
    },
    getRequest: () => requestState.request,
    headers: () => requestState.headers,
  }));
});

const installClientWindow = (pathname = "/en/admin/current", search = "", hash = "") => {
  Object.defineProperty(globalThis, "window", {
    value: {
      location: { pathname, search, hash },
      parent: { postMessage: (message: unknown) => messages.push(message) },
    },
    configurable: true,
  });
  Object.defineProperty(globalThis, "document", {
    value: { referrer: "https://example.test/en/admin/previous" },
    configurable: true,
  });
  Object.defineProperty(globalThis, "location", {
    value: { pathname, search, hash },
    configurable: true,
  });
};

afterEach(() => {
  envState.side = "client";
  envState.operationMode = "local";
  envState.basePaths = "admin,console";
  process.env.AKAN_PUBLIC_BASE_PATHS = envState.basePaths;
  requestState.request = undefined;
  requestState.headers = new Map();
  messages.length = 0;
  timeoutCallbacks.length = 0;
  globalThis.__AKAN_ROUTER__ = undefined;
  Object.defineProperty(globalThis, "window", { value: undefined, configurable: true });
  Object.defineProperty(globalThis, "document", { value: undefined, configurable: true });
  Object.defineProperty(globalThis, "location", { value: undefined, configurable: true });
});

describe("router", () => {
  test("normalizes paths with language, prefix, query, hash, root, and absolute hrefs", async () => {
    const { getPathInfo } = await import("./router");

    expect(getPathInfo("/en/admin/users?tab=a#bio", "en", "admin")).toEqual({
      path: "/users",
      pathname: "/en/admin/users",
      search: "tab=a",
      hash: "bio",
      href: "/en/admin/users?tab=a#bio",
    });
    expect(getPathInfo("/en/admin", "en", "admin").path).toBe("/");
    expect(getPathInfo("/users", "ko", "").href).toBe("/ko/users");
    expect(getPathInfo("https://external.test/path", "en", "admin").pathname).toBe("https://external.test/path");
  });

  test("client router init wraps push, replace, back, refresh, and path helpers", async () => {
    envState.side = "client";
    installClientWindow();
    const originalSetTimeout = globalThis.setTimeout;
    const mockSetTimeout = ((handler: TimerHandler) => {
      timeoutCallbacks.push(() => {
        if (typeof handler === "function") handler();
      });
      return timeoutCallbacks.length as unknown as ReturnType<typeof setTimeout>;
    }) as unknown as typeof setTimeout;
    globalThis.setTimeout = mockSetTimeout;
    const calls: unknown[] = [];
    const { router } = await import("./router");

    router.init({
      type: "csr",
      lang: "en",
      prefix: "admin",
      router: {
        push: (href, options) => calls.push(["push", href, options]),
        replace: (href, options) => calls.push(["replace", href, options]),
        back: (options) => calls.push(["back", options]),
        refresh: () => calls.push(["refresh"]),
      },
    });

    router.push("/users", { scrollToTop: true });
    router.replace("/settings");
    expect(calls).toEqual([["push", "/en/admin/users", { scrollToTop: true }]]);
    timeoutCallbacks.splice(0).forEach((callback) => {
      callback();
    });
    expect(calls).toEqual([
      ["push", "/en/admin/users", { scrollToTop: true }],
      ["replace", "/en/admin/settings", undefined],
    ]);
    router.back({ scrollToTop: false });
    router.refresh();
    expect(calls.at(-2)).toEqual(["back", { scrollToTop: false }]);
    expect(calls.at(-1)).toEqual(["refresh"]);
    expect(messages[0]).toMatchObject({ type: "pathChange", path: "/users", pathname: "/en/admin/users" });
    expect(router.getPath("/en/admin/current")).toBe("/current");
    expect(router.getFullPath()).toBe("/en/admin/current");
    expect(router.getPrefixedPath("/next")).toBe("/en/admin/next");

    router.setLang("ko");
    timeoutCallbacks.splice(0).forEach((callback) => {
      callback();
    });
    expect(calls.at(-1)).toEqual(["replace", "/ko/admin/current", undefined]);
    globalThis.setTimeout = originalSetTimeout;
  });

  test("csr navigation preserves csr runtime search params", async () => {
    envState.side = "client";
    installClientWindow("/en/admin/current", "?csr=true&akanMobileTarget=default&akanMobileBasePath=admin");
    const originalSetTimeout = globalThis.setTimeout;
    const mockSetTimeout = ((handler: TimerHandler) => {
      timeoutCallbacks.push(() => {
        if (typeof handler === "function") handler();
      });
      return timeoutCallbacks.length as unknown as ReturnType<typeof setTimeout>;
    }) as unknown as typeof setTimeout;
    globalThis.setTimeout = mockSetTimeout;
    const calls: unknown[] = [];
    const { router } = await import("./router");

    router.init({
      type: "csr",
      lang: "en",
      prefix: "admin",
      router: {
        push: (href, options) => calls.push(["push", href, options]),
        replace: (href, options) => calls.push(["replace", href, options]),
        back: (options) => calls.push(["back", options]),
        refresh: () => calls.push(["refresh"]),
      },
    });

    router.push("/users?tab=a#bio");
    router.replace("/settings?csr=false");
    timeoutCallbacks.splice(0).forEach((callback) => {
      callback();
    });

    expect(calls).toEqual([
      ["push", "/en/admin/users?tab=a&csr=true&akanMobileTarget=default&akanMobileBasePath=admin#bio", undefined],
      ["replace", "/en/admin/settings?csr=false&akanMobileTarget=default&akanMobileBasePath=admin", undefined],
    ]);
    globalThis.setTimeout = originalSetTimeout;
  });

  test("ssr client navigation hides base path outside local mode", async () => {
    envState.side = "client";
    envState.operationMode = "main";
    installClientWindow("/en/current");
    const calls: unknown[] = [];
    const { router } = await import("./router");

    router.init({
      type: "ssr",
      side: "client",
      lang: "en",
      prefix: "admin",
      router: {
        push: (href, options) => calls.push(["push", href, options]),
        replace: (href, options) => calls.push(["replace", href, options]),
        back: (options) => calls.push(["back", options]),
        refresh: () => calls.push(["refresh"]),
      },
    });

    router.push("/", { scrollToTop: true });
    router.replace("/users?tab=a#bio");

    expect(calls).toEqual([
      ["push", "/en", { scrollToTop: true }],
      ["replace", "/en/users?tab=a#bio", undefined],
    ]);
    expect(messages[0]).toMatchObject({ type: "pathChange", path: "/", pathname: "/en/admin" });
  });

  test("ssr setLang preserves production public paths while switching locale", async () => {
    envState.side = "client";
    envState.operationMode = "main";
    installClientWindow("/ko/docs/intro/fundamentals", "?from=nav", "#section");
    const calls: unknown[] = [];
    const { router } = await import("./router");

    router.init({
      type: "ssr",
      side: "client",
      lang: "en",
      prefix: "akanjs",
      router: {
        push: (href, options) => calls.push(["push", href, options]),
        replace: (href, options) => calls.push(["replace", href, options]),
        back: (options) => calls.push(["back", options]),
        refresh: () => calls.push(["refresh"]),
      },
    });

    router.setLang("ko");

    expect(calls).toEqual([["replace", "/ko/docs/intro/fundamentals?from=nav#section", undefined]]);
    expect(messages[0]).toMatchObject({
      type: "pathChange",
      path: "/docs/intro/fundamentals",
      pathname: "/ko/akanjs/docs/intro/fundamentals",
      hash: "section",
    });
  });

  test("throws initialized guard before init and server redirect/notFound errors", async () => {
    envState.side = "client";
    installClientWindow();
    const { AkanNotFoundError, AkanRedirectError, router } = await import("./router");

    envState.side = "server";
    process.env.AKAN_PUBLIC_BASE_PATHS = "admin,console";
    requestState.request = new Request("https://example.test/en/admin/current");
    requestState.headers = new Map([
      ["x-locale", "en"],
      ["x-base-path", "admin"],
    ]);
    expect(() => router.redirect("/users?tab=a")).toThrow(AkanRedirectError);
    try {
      router.redirect("/users?tab=a");
    } catch (error) {
      expect(error).toBeInstanceOf(AkanRedirectError);
      expect((error as Error & { location: string; method: string }).location).toBe("/en/admin/users?tab=a");
      expect((error as Error & { method: string }).method).toBe("replace");
    }
    envState.operationMode = "main";
    expect(() => router.redirect("/users?tab=a")).toThrow(AkanRedirectError);
    try {
      router.redirect("/users?tab=a");
    } catch (error) {
      expect(error).toBeInstanceOf(AkanRedirectError);
      expect((error as Error & { location: string; method: string }).location).toBe("/en/users?tab=a");
    }
    expect(() => router.notFound()).toThrow(AkanNotFoundError);
  });
});
