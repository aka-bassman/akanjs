import { describe, expect, test } from "bun:test";
import { DEFAULT_AKAN_I18N } from "akanjs/common";
import { createRequestStore } from "akanjs/fetch";
import type { RouteCacheRenderState } from "./cachePolicy";
import type { RscRenderResult } from "./rscWorkerHost";
import { SsrFromRscRenderer } from "./ssrFromRscRenderer";
import type { SsrLateRedirect } from "./ssrTypes";
import { type BaseBuildArtifact, defaultAkanImageConfig } from "./types";
import {
  cacheHtmlWhileStreaming,
  cancelStreamForHeadResponse,
  createRscNavigationStreamResponse,
  createRscNotFoundFallbackResponse,
  createRscRedirectResponse,
  createRscStreamResponse,
  isHtmlRouteCachePathAllowed,
  normalizeRscTargetUrlForHostBasePath,
  resolveHtmlRouteCacheStoreTtl,
  WebRouter,
} from "./webRouter";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type FullSsrHandler = (req: Request) => Response | Promise<Response>;

interface FakeRscWorker {
  renderCalls: Request[];
  invalidations: Array<string | undefined>;
  ready: Promise<void>;
  renderWithMeta(req: Request): Promise<RscRenderResult>;
  invalidateRouteResultCache(reason?: string): void;
  kill(): void;
  reload(): Promise<void>;
  getMetrics(): Record<string, unknown>;
}

function createFakeRscWorker(
  resolveRenderState: (
    req: Request,
    callIndex: number,
  ) => {
    cacheState?: RouteCacheRenderState;
    lateControl?: SsrLateRedirect | null;
    status?: number;
  } = () => ({ cacheState: { cacheable: true, revalidate: 5 } }),
): FakeRscWorker {
  return {
    renderCalls: [],
    invalidations: [],
    ready: Promise.resolve(),
    async renderWithMeta(req) {
      this.renderCalls.push(req);
      const state = resolveRenderState(req, this.renderCalls.length);
      return {
        type: "stream",
        stream: new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(encoder.encode("0:null\n"));
            controller.close();
          },
        }),
        status: state.status,
        lateControl: Promise.resolve(state.lateControl ?? null),
        cacheState: Promise.resolve(state.cacheState ?? { cacheable: true, revalidate: 5 }),
        cancel: () => {},
      };
    },
    invalidateRouteResultCache(reason) {
      this.invalidations.push(reason);
    },
    kill() {},
    async reload() {},
    getMetrics() {
      return {};
    },
  };
}

function createTestArtifact(): BaseBuildArtifact {
  return {
    rscClientUrl: "/_akan/rsc-client.js",
    vendorMap: {},
    pagesBundlePath: "/tmp/akan-test-pages.js",
    pagesBundleBuildId: 1,
    cssAssets: {},
    domains: [],
    subRoutes: {},
    basePaths: [],
    branches: [],
    i18n: DEFAULT_AKAN_I18N,
    imageConfig: defaultAkanImageConfig,
  };
}

async function withFullSsrCacheHarness<T>(
  run: (input: { fullSsr: FullSsrHandler; fakeWorker: FakeRscWorker; router: WebRouter }) => Promise<T>,
  options: {
    worker?: FakeRscWorker;
    htmlCachePaths?: string;
  } = {},
): Promise<T> {
  const envSnapshot = {
    NODE_ENV: process.env.NODE_ENV,
    AKAN_PUBLIC_APP_NAME: process.env.AKAN_PUBLIC_APP_NAME,
    AKAN_PUBLIC_REPO_NAME: process.env.AKAN_PUBLIC_REPO_NAME,
    AKAN_PUBLIC_SERVE_DOMAIN: process.env.AKAN_PUBLIC_SERVE_DOMAIN,
    AKAN_PUBLIC_OPERATION_MODE: process.env.AKAN_PUBLIC_OPERATION_MODE,
    AKAN_HTML_RESULT_CACHE: process.env.AKAN_HTML_RESULT_CACHE,
    AKAN_HTML_RESULT_CACHE_PATHS: process.env.AKAN_HTML_RESULT_CACHE_PATHS,
    AKAN_HTML_RESULT_CACHE_EXCLUDE_PATHS: process.env.AKAN_HTML_RESULT_CACHE_EXCLUDE_PATHS,
    AKAN_HTML_RESULT_CACHE_TTL: process.env.AKAN_HTML_RESULT_CACHE_TTL,
  };
  process.env.NODE_ENV = "production";
  process.env.AKAN_PUBLIC_APP_NAME = "akan-test";
  process.env.AKAN_PUBLIC_REPO_NAME = "akan";
  process.env.AKAN_PUBLIC_SERVE_DOMAIN = "example.test";
  process.env.AKAN_PUBLIC_OPERATION_MODE = "local";
  process.env.AKAN_HTML_RESULT_CACHE = "1";
  process.env.AKAN_HTML_RESULT_CACHE_PATHS = options.htmlCachePaths ?? "/docs";
  delete process.env.AKAN_HTML_RESULT_CACHE_EXCLUDE_PATHS;
  process.env.AKAN_HTML_RESULT_CACHE_TTL = "30";

  const originalRender = SsrFromRscRenderer.prototype.render;
  let renderCount = 0;
  SsrFromRscRenderer.prototype.render = async (
    input: Parameters<SsrFromRscRenderer["render"]>[0],
  ): Promise<ReadableStream<Uint8Array>> => {
    renderCount += 1;
    const pathname = input.request ? new URL(input.request.url).pathname : "/unknown";
    return new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(`<html><body>${pathname}:render-${renderCount}</body></html>`));
        controller.close();
      },
    });
  };

  const fakeWorker = options.worker ?? createFakeRscWorker();
  const router = new WebRouter({
    artifact: createTestArtifact(),
    cssBytesByUrl: {},
    rsc: fakeWorker as never,
    seedIndex: { entries: [], globalLayoutFiles: [] },
    upgradeHmrWs: () => false,
  });

  try {
    const { renderEnvRoutes } = await router.initializeRoute();
    const fullSsr = renderEnvRoutes["/*"] as unknown as FullSsrHandler;
    return await run({ fullSsr, fakeWorker, router });
  } finally {
    router.dispose();
    SsrFromRscRenderer.prototype.render = originalRender;
    for (const [key, value] of Object.entries(envSnapshot)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

describe("WebRouter RSC target normalization", () => {
  test("maps public host paths to the hidden basePath route for RSC navigation", () => {
    const target = new URL("https://akanjs.com/en/docs/intro/quickstart");

    const normalized = normalizeRscTargetUrlForHostBasePath(target, {
      basePath: "akanjs",
      i18n: DEFAULT_AKAN_I18N,
    });

    expect(normalized.url.href).toBe("https://akanjs.com/en/akanjs/docs/intro/quickstart");
    expect(normalized.basePath).toBe("akanjs");
  });

  test("maps debug public paths by matching configured basePath route seeds", () => {
    const target = new URL("https://akanjs-debug.akanjs.com/en/references/cli/overview");

    const normalized = normalizeRscTargetUrlForHostBasePath(target, {
      basePath: null,
      basePaths: ["office", "akanjs", "soft"],
      i18n: DEFAULT_AKAN_I18N,
      seedEntries: [
        {
          routeId: "/:lang/akanjs/references/cli/overview",
          pattern: "/:lang/akanjs/references/cli/overview",
          seeds: [],
        },
      ],
    });

    expect(normalized.url.href).toBe("https://akanjs-debug.akanjs.com/en/akanjs/references/cli/overview");
    expect(normalized.basePath).toBe("akanjs");
  });

  test("does not duplicate an already internal basePath route", () => {
    const target = new URL("https://akanjs.com/en/akanjs/docs/intro/quickstart");

    const normalized = normalizeRscTargetUrlForHostBasePath(target, {
      basePath: "akanjs",
      i18n: DEFAULT_AKAN_I18N,
    });

    expect(normalized.url.href).toBe("https://akanjs.com/en/akanjs/docs/intro/quickstart");
    expect(normalized.basePath).toBe("akanjs");
  });
});

describe("WebRouter RSC redirect response", () => {
  test("uses the Akan RSC redirect envelope with status metadata", async () => {
    const response = createRscRedirectResponse("/target", "push", 308);

    expect(response.status).toBe(200);
    expect(response.headers.get("X-Akan-Redirect")).toBe("/target");
    expect(response.headers.get("X-Akan-Redirect-Method")).toBe("push");
    expect(response.headers.get("X-Akan-Redirect-Status")).toBe("308");
    await expect(response.json()).resolves.toEqual({
      type: "redirect",
      location: "/target",
      method: "push",
      status: 308,
    });
  });
});

describe("WebRouter RSC stream response", () => {
  test("preserves 404 status for not-found Flight payloads", async () => {
    const response = createRscStreamResponse("flight", 404);

    expect(response.status).toBe(404);
    expect(response.headers.get("Content-Type")).toBe("text/x-component; charset=utf-8");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    await expect(response.text()).resolves.toBe("flight");
  });

  test("uses an RSC payload for the not-found fallback response", async () => {
    const response = createRscNotFoundFallbackResponse();

    expect(response.status).toBe(404);
    expect(response.headers.get("Content-Type")).toBe("text/x-component; charset=utf-8");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    await expect(response.text()).resolves.toBe("0:null\n");
  });

  test("leaves late redirects in the streamed Flight payload for client fallback", async () => {
    const response = await createRscNavigationStreamResponse({
      type: "stream",
      stream: new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('0:E{"digest":"AKAN_REDIRECT"}\n'));
          controller.close();
        },
      }),
      lateControl: Promise.resolve({ type: "redirect", location: "/target", method: "replace", status: 307 }),
      cacheState: Promise.resolve({ cacheable: false, reason: "late-redirect" }),
      cancel: () => {},
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/x-component; charset=utf-8");
    expect(response.headers.get("X-Akan-Redirect")).toBeNull();
    await expect(response.text()).resolves.toBe('0:E{"digest":"AKAN_REDIRECT"}\n');
  });

  test("streams RSC navigation Flight without waiting for completion", async () => {
    let releaseSecond!: () => void;
    const response = await createRscNavigationStreamResponse({
      type: "stream",
      stream: new ReadableStream<Uint8Array>({
        async start(controller) {
          controller.enqueue(encoder.encode("first"));
          await new Promise<void>((resolve) => {
            releaseSecond = resolve;
          });
          controller.enqueue(encoder.encode("second"));
          controller.close();
        },
      }),
      lateControl: new Promise(() => {}),
      cacheState: Promise.resolve({ cacheable: true }),
      cancel: () => {},
    });
    const reader = response.body?.getReader();
    expect(reader).toBeDefined();

    const first = await reader?.read();
    expect(first?.done).toBe(false);
    expect(decoder.decode(first?.value)).toBe("first");

    const secondRead = reader?.read();
    const pendingSecond = await Promise.race([secondRead, sleep(20).then(() => null)]);
    expect(pendingSecond).toBeNull();

    releaseSecond();
    const second = await secondRead;
    expect(second?.done).toBe(false);
    expect(decoder.decode(second?.value)).toBe("second");
    await reader?.cancel();
  });

  test("preserves RSC navigation status while streaming", async () => {
    const response = await createRscNavigationStreamResponse({
      type: "stream",
      stream: new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode("flight"));
          controller.close();
        },
      }),
      status: 404,
      lateControl: Promise.resolve(null),
      cacheState: Promise.resolve({ cacheable: false, reason: "not-found" }),
      cancel: () => {},
    });

    expect(response.status).toBe(404);
    expect(response.headers.get("Content-Type")).toBe("text/x-component; charset=utf-8");
    await expect(response.text()).resolves.toBe("flight");
  });
});

describe("WebRouter HTML cache streaming", () => {
  test("uses shared allow and deny semantics for HTML cache paths", () => {
    const env = {
      AKAN_HTML_RESULT_CACHE_PATHS: " /docs, /blog ",
      AKAN_HTML_RESULT_CACHE_EXCLUDE_PATHS: "/docs/private",
    };

    expect(isHtmlRouteCachePathAllowed("/docs", env)).toBe(true);
    expect(isHtmlRouteCachePathAllowed("/docs/intro", env)).toBe(true);
    expect(isHtmlRouteCachePathAllowed("/docs-private", env)).toBe(false);
    expect(isHtmlRouteCachePathAllowed("/docs/private", env)).toBe(false);
    expect(isHtmlRouteCachePathAllowed("/docs/private/child", env)).toBe(false);
    expect(isHtmlRouteCachePathAllowed("/docs/private-ish", env)).toBe(true);
    expect(isHtmlRouteCachePathAllowed("/other", env)).toBe(false);
  });

  test("passes through the first chunk before caching the completed HTML", async () => {
    let cachedHtml = "";
    const stream = cacheHtmlWhileStreaming(
      new ReadableStream<Uint8Array>({
        async start(controller) {
          controller.enqueue(encoder.encode("<html>first"));
          await sleep(20);
          controller.enqueue(encoder.encode("second</html>"));
          controller.close();
        },
      }),
      (html) => {
        cachedHtml = html;
      },
    );
    const reader = stream.getReader();

    const first = await reader.read();
    expect(first.done).toBe(false);
    expect(decoder.decode(first.value)).toBe("<html>first");
    expect(cachedHtml).toBe("");

    let rest = "";
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      rest += decoder.decode(next.value);
    }

    expect(rest).toBe("second</html>");
    expect(cachedHtml).toBe("<html>firstsecond</html>");
  });

  test("passes through completed HTML but skips caching when a late redirect is observed", async () => {
    let cachedHtml = "";
    const stream = cacheHtmlWhileStreaming(
      new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(encoder.encode("<html>redirect</html>"));
          controller.close();
        },
      }),
      (html) => {
        cachedHtml = html;
      },
      {
        shouldCache: () => Promise.resolve(false),
      },
    );

    await expect(new Response(stream).text()).resolves.toBe("<html>redirect</html>");
    expect(cachedHtml).toBe("");
  });

  test("waits for the cache decision before writing completed HTML", async () => {
    let cachedHtml = "";
    let storeTtl = 30;
    let observedStoreTtl = 0;
    const stream = cacheHtmlWhileStreaming(
      new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(encoder.encode("<html>cache</html>"));
          controller.close();
        },
      }),
      (html) => {
        cachedHtml = html;
        observedStoreTtl = storeTtl;
      },
      {
        shouldCache: async () => {
          await sleep(0);
          storeTtl = 5;
          return true;
        },
      },
    );

    await expect(new Response(stream).text()).resolves.toBe("<html>cache</html>");
    expect(cachedHtml).toBe("<html>cache</html>");
    expect(observedStoreTtl).toBe(5);
  });

  test("combines worker and host cache state before writing HTML", () => {
    const hostStore = createRequestStore(new Request("https://example.test/cache"));

    expect(
      resolveHtmlRouteCacheStoreTtl({
        baseTtl: 120,
        workerCacheState: { cacheable: true, revalidate: 60 },
        hostRequestStore: hostStore,
      }),
    ).toBe(60);

    hostStore.policy.revalidate = 30;
    expect(
      resolveHtmlRouteCacheStoreTtl({
        baseTtl: 120,
        workerCacheState: { cacheable: true, revalidate: 60 },
        hostRequestStore: hostStore,
      }),
    ).toBe(30);

    hostStore.dynamicUsage.headers = true;
    expect(
      resolveHtmlRouteCacheStoreTtl({
        baseTtl: 120,
        workerCacheState: { cacheable: true, revalidate: 60 },
        hostRequestStore: hostStore,
      }),
    ).toBeNull();
  });

  test("blocks HTML cache writes for worker controls and host dynamic usage", () => {
    const hostStore = createRequestStore(new Request("https://example.test/cache"));
    const notFoundTtl = resolveHtmlRouteCacheStoreTtl({
      baseTtl: 120,
      workerCacheState: { cacheable: false, reason: "render-not-found" },
      hostRequestStore: hostStore,
    });
    const errorTtl = resolveHtmlRouteCacheStoreTtl({
      baseTtl: 120,
      workerCacheState: { cacheable: false, reason: "render-error" },
      hostRequestStore: hostStore,
    });
    const lateRedirectTtl = resolveHtmlRouteCacheStoreTtl({
      baseTtl: 120,
      workerCacheState: { cacheable: true, revalidate: 60 },
      hostRequestStore: hostStore,
      lateControl: { type: "redirect" },
    });

    expect(notFoundTtl).toBeNull();
    expect(errorTtl).toBeNull();
    expect(lateRedirectTtl).toBeNull();

    const cookieDynamicStore = createRequestStore(new Request("https://example.test/cache"));
    cookieDynamicStore.dynamicUsage.cookies = true;
    const cookieDynamicTtl = resolveHtmlRouteCacheStoreTtl({
      baseTtl: 120,
      workerCacheState: { cacheable: true, revalidate: 60 },
      hostRequestStore: cookieDynamicStore,
    });

    expect(cookieDynamicTtl).toBeNull();
  });

  test("passes through completed HTML but skips caching when the body cap is exceeded", async () => {
    let cachedHtml = "";
    const stream = cacheHtmlWhileStreaming(
      new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(encoder.encode("<html>too-large</html>"));
          controller.close();
        },
      }),
      (html) => {
        cachedHtml = html;
      },
      {
        maxBodyBytes: 4,
      },
    );

    await expect(new Response(stream).text()).resolves.toBe("<html>too-large</html>");
    expect(cachedHtml).toBe("");
  });

  test("cancels the unused HTML stream for HEAD responses", async () => {
    let cancelledReason: unknown;
    const reason = new Error("HEAD response does not consume body");
    const stream = new ReadableStream<Uint8Array>({
      cancel(actualReason) {
        cancelledReason = actualReason;
      },
    });

    cancelStreamForHeadResponse(stream, reason);
    await sleep(0);

    expect(cancelledReason).toBe(reason);
  });
});

describe("WebRouter full SSR cache orchestration", () => {
  test("stores completed full SSR HTML and serves the next request from cache", async () => {
    await withFullSsrCacheHarness(async ({ fullSsr, fakeWorker }) => {
      const first = await fullSsr(new Request("https://example.test/docs"));
      expect(first.headers.get("X-Akan-Cache")).toBe("MISS");
      const firstHtml = await first.text();
      expect(firstHtml).toContain("/docs:render-1");
      expect(fakeWorker.renderCalls).toHaveLength(1);

      const second = await fullSsr(new Request("https://example.test/docs"));
      expect(second.headers.get("X-Akan-Cache")).toBe("HIT");
      await expect(second.text()).resolves.toBe(firstHtml);
      expect(fakeWorker.renderCalls).toHaveLength(1);
    });
  });

  test("does not store full SSR HTML when worker cache state is uncacheable", async () => {
    const fakeWorker = createFakeRscWorker(() => ({
      cacheState: { cacheable: false, reason: "dynamic-request-api" },
    }));

    await withFullSsrCacheHarness(
      async ({ fullSsr }) => {
        const first = await fullSsr(new Request("https://example.test/docs/dynamic"));
        expect(first.headers.get("X-Akan-Cache")).toBe("MISS");
        await expect(first.text()).resolves.toContain("/docs/dynamic:render-1");

        const second = await fullSsr(new Request("https://example.test/docs/dynamic"));
        expect(second.headers.get("X-Akan-Cache")).toBe("MISS");
        await expect(second.text()).resolves.toContain("/docs/dynamic:render-2");
        expect(fakeWorker.renderCalls).toHaveLength(2);
      },
      { worker: fakeWorker },
    );
  });

  test("does not store full SSR HTML when a late redirect is observed", async () => {
    const fakeWorker = createFakeRscWorker(() => ({
      cacheState: { cacheable: true, revalidate: 5 },
      lateControl: { type: "redirect", location: "/login", method: "replace", status: 307 },
    }));

    await withFullSsrCacheHarness(
      async ({ fullSsr }) => {
        const first = await fullSsr(new Request("https://example.test/docs/redirect"));
        expect(first.headers.get("X-Akan-Cache")).toBe("MISS");
        await expect(first.text()).resolves.toContain("/docs/redirect:render-1");

        const second = await fullSsr(new Request("https://example.test/docs/redirect"));
        expect(second.headers.get("X-Akan-Cache")).toBe("MISS");
        await expect(second.text()).resolves.toContain("/docs/redirect:render-2");
        expect(fakeWorker.renderCalls).toHaveLength(2);
      },
      { worker: fakeWorker },
    );
  });

  test("clears host HTML cache and forwards worker invalidation through the internal hook", async () => {
    await withFullSsrCacheHarness(async ({ fullSsr, fakeWorker, router }) => {
      const first = await fullSsr(new Request("https://example.test/docs/invalidate"));
      expect(first.headers.get("X-Akan-Cache")).toBe("MISS");
      await first.text();

      const second = await fullSsr(new Request("https://example.test/docs/invalidate"));
      expect(second.headers.get("X-Akan-Cache")).toBe("HIT");
      await second.text();
      expect(fakeWorker.renderCalls).toHaveLength(1);

      router.invalidateRouteCaches("manual");
      expect(fakeWorker.invalidations).toEqual(["manual"]);

      const third = await fullSsr(new Request("https://example.test/docs/invalidate"));
      expect(third.headers.get("X-Akan-Cache")).toBe("MISS");
      await expect(third.text()).resolves.toContain("/docs/invalidate:render-2");
      expect(fakeWorker.renderCalls).toHaveLength(2);
    });
  });
});
