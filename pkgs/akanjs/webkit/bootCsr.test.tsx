import { afterEach, beforeAll, describe, expect, mock, test } from "bun:test";

const originalWindow = globalThis.window;
const originalDocument = globalThis.document;
const originalEnv = { ...process.env };

const deviceState = {
  lang: "en",
  platform: "web",
};
const storageState = {
  jwt: null as string | null,
};

beforeAll(() => {
  mock.module("akanjs/client", () => ({
    DEFAULT_BOTTOM_INSET: 34,
    DEFAULT_TOP_INSET: 44,
    csrContext: { Provider: ({ children }: { children: unknown }) => children },
    defaultPageState: {
      transition: "none",
      topSafeArea: 0,
      bottomSafeArea: 0,
      topInset: 0,
      bottomInset: 0,
      gesture: true,
      cache: false,
    },
    router: {
      state: {},
      set: () => undefined,
      emit: () => undefined,
      on: () => undefined,
      off: () => undefined,
    },
    Device: {
      load: async () => ({
        lang: deviceState.lang,
        info: { platform: deviceState.platform },
        topSafeArea: 11,
        bottomSafeArea: 22,
      }),
      getDevice: () => ({
        info: { platform: deviceState.platform },
      }),
    },
    initAuth: () => undefined,
    storage: {
      getItem: async (key: string) => (key === "jwt" ? storageState.jwt : null),
    },
  }));
  mock.module("react-dom/client", () => ({
    createRoot: () => ({ render: () => undefined }),
  }));
  mock.module("@capacitor/app", () => ({
    App: {
      addListener: () => ({ remove: () => undefined }),
    },
  }));
  mock.module("@react-spring/web", () => ({
    useSpringValue: () => ({ to: () => 0, start: async () => undefined }),
  }));
  mock.module("@use-gesture/react", () => ({
    useDrag: () => () => ({}),
  }));
});

const installWindow = ({
  href,
  replace,
  root = true,
}: {
  href: string;
  replace?: (href: string) => void;
  root?: boolean;
}) => {
  const url = new URL(href);
  const body = { style: {} } as HTMLBodyElement;
  const document = {
    body,
    getElementById: (id: string) => (root && id === "root" ? ({ nodeType: 1 } as HTMLElement) : null),
  } as unknown as Document;
  const window = {
    document,
    location: {
      href,
      origin: url.origin,
      pathname: url.pathname,
      search: url.search,
      hash: url.hash,
      replace: replace ?? (() => undefined),
    },
  } as unknown as Window & typeof globalThis;
  Object.defineProperty(globalThis, "window", { value: window, configurable: true });
  Object.defineProperty(globalThis, "document", { value: document, configurable: true });
  Object.defineProperty(globalThis, "location", { value: window.location, configurable: true });
};

afterEach(() => {
  Object.defineProperty(globalThis, "window", { value: originalWindow, configurable: true });
  Object.defineProperty(globalThis, "document", { value: originalDocument, configurable: true });
  Object.defineProperty(globalThis, "location", { value: originalWindow?.location, configurable: true });
  process.env = { ...originalEnv };
  deviceState.lang = "en";
  deviceState.platform = "web";
  storageState.jwt = null;
});

describe("bootCsr", () => {
  test("exits early on 404 before route loading", async () => {
    installWindow({ href: "https://example.test/404" });
    let loaded = false;
    const { bootCsr } = await import("./bootCsr");

    await bootCsr({
      "./_index.tsx": async () => {
        loaded = true;
        return { default: () => null };
      },
    });

    expect(loaded).toBe(false);
    expect(document.body.style.overflow).toBe("hidden");
  });

  test("redirects to language-prefixed path when missing language prefix", async () => {
    const replacements: string[] = [];
    installWindow({ href: "https://example.test/home?a=1#top", replace: (href) => replacements.push(href) });
    const { bootCsr } = await import("./bootCsr");

    await bootCsr({
      "./_index.tsx": async () => ({ default: () => null }),
    });

    expect(replacements).toEqual(["/en/home?a=1#top"]);
  });

  test("initializes mobile target from local Capacitor CSR URL", async () => {
    const replacements: string[] = [];
    installWindow({
      href: "https://example.test/en/?csr=true&akanMobileTarget=default&akanMobileBasePath=minimal",
      replace: (href) => replacements.push(href),
    });
    const { bootCsr } = await import("./bootCsr");

    await bootCsr({
      "./_index.tsx": async () => ({ default: () => null }),
    });

    expect(window.__AKAN_MOBILE_TARGET__).toEqual({ name: "default", basePath: "minimal" });
    expect(replacements).toEqual([]);
  });
});
