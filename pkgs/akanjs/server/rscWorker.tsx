import type { AkanNotFoundError, AkanRedirectError, PathRoute } from "akanjs/client";
import { type AkanI18nConfig, DEFAULT_AKAN_I18N, getBasePathFromPathname, Logger } from "akanjs/common";
import { cookies, getRequest, getRequestTheme, requestStorage } from "akanjs/fetch";
import type { ReactNode } from "react";
import { renderToReadableStream } from "react-server-dom-webpack/server.node";
import type { ClientManifest } from "./artifact";
import { ProcessMetricsCollector } from "./processMetricsCollector";
import { RouteElementComposer } from "./routeElementComposer";
import { type PagesContext, RouteTreeBuilder } from "./routeTreeBuilder";
import { createSystemPageDocument, getSystemPageHomeHref } from "./systemPages";

interface InitMsg {
  type: "init";
  clientManifest: ClientManifest;
  pagesBundlePath: string;
  pagesBundleBuildId: number;
  cssAssets?: Record<string, { cssUrl: string; cssRelPath: string }>;
  basePaths?: string[];
  i18n?: AkanI18nConfig;
}
interface RenderMsg {
  type: "render";
  requestId: string;
  url: string;
  method?: string;
  headers?: Record<string, string>;
  clientManifest?: ClientManifest;
}
interface ReloadMsg {
  type: "reload";
  clientManifest: ClientManifest;
  cssAssets?: Record<string, { cssUrl: string; cssRelPath: string }>;
  buildId: number;
  /** Optional new bundle path — when the builder rebundled user code. */
  pagesBundlePath?: string;
}
interface UpdateCssAssetsMsg {
  type: "updateCssAssets";
  cssAssets: Record<string, { cssUrl: string; cssRelPath: string }>;
}
type InMsg = InitMsg | RenderMsg | ReloadMsg | UpdateCssAssetsMsg;
type RenderControl = { type: "redirect"; location: string; method: "replace" | "push" } | { type: "not-found" };

interface RscRendererStats {
  renderCount: number;
  inFlightRenderCount: number;
  lastRenderedPath?: string;
  lastRenderKind?: string;
  lastRenderRouteId?: string;
  lastRenderDurationMs?: number;
  lastRenderLoadedModuleDelta: number;
  lastRenderLoadedModules: string[];
  lastFlightBytes: number;
  lastFlightChunks: number;
  totalFlightBytes: number;
  totalFlightChunks: number;
  pagesBundleBuildId: number;
}

interface RouteRenderStats {
  routeId: string;
  count: number;
  flightBytes: number;
  totalDurationMs: number;
}

interface CachedRscResult {
  expiresAt: number;
  chunks: Uint8Array[];
  bytes: number;
  chunksCount: number;
  theme?: string;
}

export function isAkanRedirectError(error: unknown): error is AkanRedirectError {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    (error as { digest?: unknown }).digest === "AKAN_REDIRECT" &&
    "location" in error &&
    typeof (error as { location?: unknown }).location === "string"
  );
}

export function isAkanNotFoundError(error: unknown): error is AkanNotFoundError {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    (error as { digest?: unknown }).digest === "AKAN_NOT_FOUND"
  );
}

class RscRenderer {
  readonly #logger = new Logger("scWorker");
  #clientManifest: ClientManifest = {};
  #pathRoutes: PathRoute[] = [];
  #cssAssets: Record<string, { cssUrl: string; cssRelPath: string }> = {};
  #basePaths: string[] = [];
  #i18n: AkanI18nConfig = DEFAULT_AKAN_I18N;
  #pagesBundlePath = "";
  #pagesBundleBuildId = 0;
  #reloadSeq = 0;
  #metricsTimer: Timer | null = null;
  #stats: RscRendererStats = {
    renderCount: 0,
    inFlightRenderCount: 0,
    lastRenderLoadedModuleDelta: 0,
    lastRenderLoadedModules: [],
    lastFlightBytes: 0,
    lastFlightChunks: 0,
    totalFlightBytes: 0,
    totalFlightChunks: 0,
    pagesBundleBuildId: 0,
  };
  readonly #routeStats = new Map<string, RouteRenderStats>();
  readonly #resultCache = new Map<string, CachedRscResult>();
  #resultCacheHits = 0;
  #resultCacheMisses = 0;
  #resultCacheBypass = 0;
  readonly #send: (message: unknown) => void;

  constructor() {
    if (typeof process.send !== "function") {
      throw new Error("rscWorker must be run as a Bun subprocess with ipc enabled");
    }
    this.#send = process.send.bind(process) as (message: unknown) => void;
    process.on("message", (msg: InMsg) => this.#handleMessage(msg));
    this.#logger.verbose(`constructed (pid=${process.pid})`);
  }

  start(): void {
    this.#logger.verbose("sending hello to host");
    this.#startMetricsReporting();
    this.#send({ type: "hello" });
  }

  #handleMessage(msg: InMsg): void {
    switch (msg.type) {
      case "init":
        this.#logger.verbose("received init message");
        void this.#handleInit(msg);
        return;
      case "render":
        this.#logger.verbose(`received render requestId=${msg.requestId} url=${msg.url} method=${msg.method ?? "GET"}`);
        void this.#handleRender(msg);
        return;
      case "reload":
        this.#logger.verbose(`received reload buildId=${msg.buildId}`);
        void this.#handleReload(msg);
        return;
      case "updateCssAssets":
        this.#logger.verbose(`received updateCssAssets count=${Object.keys(msg.cssAssets).length}`);
        this.#cssAssets = msg.cssAssets;
        return;
    }
  }

  async #handleInit(msg: InitMsg): Promise<void> {
    const startedAt = Date.now();
    try {
      this.#clientManifest = msg.clientManifest;
      this.#cssAssets = msg.cssAssets ?? {};
      this.#basePaths = msg.basePaths ?? Object.keys(this.#cssAssets);
      this.#i18n = msg.i18n ?? DEFAULT_AKAN_I18N;
      this.#pagesBundlePath = msg.pagesBundlePath;
      this.#pagesBundleBuildId = msg.pagesBundleBuildId;
      this.#stats.pagesBundleBuildId = msg.pagesBundleBuildId;
      this.#routeStats.clear();
      this.#resultCache.clear();
      this.#logger.verbose(
        `init state pagesBundlePath=${msg.pagesBundlePath} buildId=${msg.pagesBundleBuildId} cssAssets=${Object.keys(this.#cssAssets).length} clientEntries=${Object.keys(msg.clientManifest).length}`,
      );
      this.#pathRoutes = await this.#importPages(msg.pagesBundlePath, msg.pagesBundleBuildId);
      this.#logger.verbose(`init complete in ${Date.now() - startedAt}ms`);
      this.#send({ type: "ready" });
    } catch (error) {
      this.#logger.error(`init failed: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`);
      this.#send({
        type: "error",
        requestId: "__init__",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async #handleReload(msg: ReloadMsg): Promise<void> {
    const startedAt = Date.now();
    const seq = ++this.#reloadSeq;
    try {
      const nextCssAssets = msg.cssAssets ?? this.#cssAssets;
      const nextPagesBundlePath =
        msg.pagesBundlePath && msg.pagesBundlePath !== this.#pagesBundlePath
          ? msg.pagesBundlePath
          : this.#pagesBundlePath;
      this.#logger.verbose(
        `reload state buildId=${msg.buildId} bundlePath=${nextPagesBundlePath} cssAssets=${Object.keys(nextCssAssets).length} clientEntries=${Object.keys(msg.clientManifest).length}`,
      );
      const pathRoutes = await this.#importPages(nextPagesBundlePath, msg.buildId);
      if (seq !== this.#reloadSeq) {
        this.#logger.verbose(`reload stale buildId=${msg.buildId} seq=${seq} latest=${this.#reloadSeq}`);
        return;
      }
      this.#clientManifest = msg.clientManifest;
      this.#cssAssets = nextCssAssets;
      this.#pagesBundlePath = nextPagesBundlePath;
      this.#pagesBundleBuildId = msg.buildId;
      this.#stats.pagesBundleBuildId = msg.buildId;
      this.#pathRoutes = pathRoutes;
      this.#routeStats.clear();
      this.#resultCache.clear();
      this.#logger.verbose(`reload complete buildId=${msg.buildId} in ${Date.now() - startedAt}ms`);
      this.#send({ type: "reloaded", buildId: msg.buildId });
    } catch (error) {
      this.#logger.error(
        `reload failed buildId=${msg.buildId}: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`,
      );
      this.#send({
        type: "error",
        requestId: "__reload__",
        buildId: msg.buildId,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async #importPages(bundlePath: string, buildId: number): Promise<PathRoute[]> {
    const specifier = `${bundlePath}?v=${buildId}`;
    this.#logger.verbose(`importing pages bundle ${specifier}`);
    const importStart = Date.now();
    const mod = (await import(specifier)) as { pages?: PagesContext; default?: PagesContext };
    const importedAt = Date.now();
    const pages = mod.pages ?? mod.default;
    if (!pages) throw new Error(`pages export not found in ${specifier}`);

    const routeBuildStart = Date.now();
    const pathRoutes = new RouteTreeBuilder(pages).build();
    const routeBuildMs = Date.now() - routeBuildStart;
    this.#logger.verbose(
      `pages imported in ${Date.now() - importStart}ms import=${importedAt - importStart}ms routeBuild=${routeBuildMs}ms routes=${pathRoutes.length} specifier=${specifier}`,
    );
    return pathRoutes;
  }

  async #handleRender(msg: RenderMsg): Promise<void> {
    const { requestId, url, method = "GET", headers = {} } = msg;
    const startedAt = Date.now();
    this.#stats.renderCount += 1;
    this.#stats.inFlightRenderCount += 1;
    try {
      const request = new Request(url, { method, headers });
      await this.#runWithRequest(request, async () => {
        const urlObj = new URL(url);
        this.#stats.lastRenderedPath = urlObj.pathname;
        const match = RouteTreeBuilder.match(urlObj.pathname, this.#pathRoutes);
        const routeId = match?.pathRoute.path ?? "__not_found__";
        this.#stats.lastRenderRouteId = routeId;
        this.#stats.lastRenderKind = match ? "route" : "not-found";
        if (match)
          this.#logger.verbose(
            `render[${requestId}] matched route pathname=${urlObj.pathname} params=${JSON.stringify(match.params)}`,
          );
        else this.#logger.verbose(`render[${requestId}] no route matched pathname=${urlObj.pathname} — rendering 404`);
        const beforeLoadedKeys = RouteTreeBuilder.getCacheStats().loadedModuleKeys;
        const cacheKey = match ? await this.#getResultCacheKey(request, urlObj, match.pathRoute) : null;
        const cached = cacheKey ? this.#getCachedResult(cacheKey) : null;
        if (cached) {
          this.#stats.lastRenderDurationMs = Date.now() - startedAt;
          this.#stats.lastRenderLoadedModuleDelta = 0;
          this.#stats.lastRenderLoadedModules = [];
          this.#stats.lastFlightBytes = cached.bytes;
          this.#stats.lastFlightChunks = cached.chunksCount;
          this.#stats.totalFlightBytes += cached.bytes;
          this.#stats.totalFlightChunks += cached.chunksCount;
          this.#recordRouteStats(routeId, cached.bytes, this.#stats.lastRenderDurationMs);
          this.#send({ type: "meta", requestId, theme: cached.theme });
          for (const chunk of cached.chunks) this.#send({ type: "chunk", requestId, data: chunk });
          this.#send({ type: "end", requestId });
          return;
        }
        const theme = cookies().get("theme")?.value;
        const element = match ? await this.#renderMatched(urlObj, match, theme) : this.#renderNotFound(urlObj);
        this.#logger.verbose(`render[${requestId}] starting Flight stream`);
        const controlRef: { current: RenderControl | null } = { current: null };
        const stream = await renderToReadableStream(element, msg.clientManifest ?? this.#clientManifest, {
          onError: (error) => {
            if (isAkanRedirectError(error)) {
              controlRef.current = { type: "redirect", location: error.location, method: error.method };
              return error.digest;
            }
            if (isAkanNotFoundError(error)) {
              controlRef.current = { type: "not-found" };
              return error.digest;
            }
            return error instanceof Error ? error.message : String(error);
          },
        });
        const reader = stream.getReader();
        let chunks = 0;
        let bytes = 0;
        const buffered: Uint8Array[] = [];
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          if (controlRef.current) {
            await reader.cancel();
            break;
          }
          const chunk = value instanceof Uint8Array ? value : new Uint8Array(value as ArrayBufferLike);
          chunks += 1;
          bytes += chunk.byteLength;
          buffered.push(chunk);
        }
        const control = controlRef.current;
        if (control) {
          this.#stats.lastRenderKind = control.type;
          this.#sendRenderControl(requestId, control);
          return;
        }
        this.#stats.lastFlightBytes = bytes;
        this.#stats.lastFlightChunks = chunks;
        this.#stats.totalFlightBytes += bytes;
        this.#stats.totalFlightChunks += chunks;
        this.#stats.lastRenderDurationMs = Date.now() - startedAt;
        const afterLoadedKeys = RouteTreeBuilder.getCacheStats().loadedModuleKeys;
        this.#stats.lastRenderLoadedModules = afterLoadedKeys.filter((key) => !beforeLoadedKeys.includes(key));
        this.#stats.lastRenderLoadedModuleDelta = this.#stats.lastRenderLoadedModules.length;
        this.#recordRouteStats(routeId, bytes, this.#stats.lastRenderDurationMs);
        const responseTheme = getRequestTheme();
        if (cacheKey)
          this.#setCachedResult(cacheKey, { chunks: buffered, bytes, chunksCount: chunks, theme: responseTheme });
        this.#send({ type: "meta", requestId, theme: responseTheme, status: match ? undefined : 404 });
        for (const chunk of buffered) {
          this.#send({ type: "chunk", requestId, data: chunk });
        }
        this.#logger.verbose(
          `render[${requestId}] done chunks=${chunks} bytes=${bytes} in ${Date.now() - startedAt}ms`,
        );
        this.#send({ type: "end", requestId });
      });
    } catch (error) {
      if (isAkanRedirectError(error)) {
        this.#stats.lastRenderKind = "redirect";
        this.#logger.verbose(`render[${requestId}] redirect ${error.location}`);
        this.#send({ type: "redirect", requestId, location: error.location, method: error.method });
        return;
      }
      if (isAkanNotFoundError(error)) {
        this.#stats.lastRenderKind = "not-found";
        this.#logger.verbose(`render[${requestId}] not-found`);
        this.#send({ type: "not-found", requestId });
        return;
      }
      this.#logger.error(
        `render[${requestId}] failed url=${url}: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`,
      );
      this.#send({
        type: "error",
        requestId,
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      this.#stats.inFlightRenderCount = Math.max(0, this.#stats.inFlightRenderCount - 1);
    }
  }

  #startMetricsReporting() {
    if (this.#metricsTimer) return;
    const report = () => {
      void this.#sendMetricsReport();
    };
    report();
    this.#metricsTimer = setInterval(report, ProcessMetricsCollector.parseMemoryLogIntervalMs());
  }

  async #sendMetricsReport() {
    const routeStats = RouteTreeBuilder.getCacheStats();
    const metrics = await ProcessMetricsCollector.collect({
      role: "rsc-worker",
      rscRenderCount: this.#stats.renderCount,
      rscInFlightRenderCount: this.#stats.inFlightRenderCount,
      rscLastRenderedPath: this.#stats.lastRenderedPath,
      rscLastRenderKind: this.#stats.lastRenderKind,
      rscLastRenderRouteId: this.#stats.lastRenderRouteId,
      rscLastRenderDurationMs: this.#stats.lastRenderDurationMs,
      rscLastRenderLoadedModuleDelta: this.#stats.lastRenderLoadedModuleDelta,
      rscLastRenderLoadedModules: this.#stats.lastRenderLoadedModules,
      rscLastFlightBytes: this.#stats.lastFlightBytes,
      rscLastFlightChunks: this.#stats.lastFlightChunks,
      rscTotalFlightBytes: this.#stats.totalFlightBytes,
      rscTotalFlightChunks: this.#stats.totalFlightChunks,
      rscPagesBundleBuildId: this.#pagesBundleBuildId,
      rscRouteModuleCount: routeStats.moduleCount,
      rscLoadedRouteModuleCount: routeStats.loadedModuleCount,
      rscRouteModuleCacheHits: routeStats.cacheHits,
      rscRouteModuleCacheMisses: routeStats.cacheMisses,
      rscRouteModuleCacheDisabled: routeStats.cacheDisabled,
      rscLoadedRouteModuleKeys: routeStats.loadedModuleKeys,
      rscTopRoutesByRenderCount: this.#topRoutes((route) => route.count),
      rscTopRoutesByFlightBytes: this.#topRoutes((route) => route.flightBytes),
      rscResultCacheEntries: this.#resultCache.size,
      rscResultCacheHits: this.#resultCacheHits,
      rscResultCacheMisses: this.#resultCacheMisses,
      rscResultCacheBypass: this.#resultCacheBypass,
    });
    this.#send({ type: "metrics", metrics });
  }

  #sendRenderControl(requestId: string, control: RenderControl): void {
    if (control.type === "redirect") {
      this.#logger.verbose(`render[${requestId}] redirect ${control.location}`);
      this.#send({ type: "redirect", requestId, location: control.location, method: control.method });
      return;
    }
    this.#logger.verbose(`render[${requestId}] not-found`);
    this.#send({ type: "not-found", requestId });
  }

  #recordRouteStats(routeId: string, flightBytes: number, durationMs: number): void {
    const current = this.#routeStats.get(routeId) ?? { routeId, count: 0, flightBytes: 0, totalDurationMs: 0 };
    current.count += 1;
    current.flightBytes += flightBytes;
    current.totalDurationMs += durationMs;
    this.#routeStats.set(routeId, current);
  }

  #topRoutes(sortBy: (route: RouteRenderStats) => number) {
    return [...this.#routeStats.values()]
      .sort((a, b) => sortBy(b) - sortBy(a))
      .slice(0, 10)
      .map((route) => ({
        routeId: route.routeId,
        count: route.count,
        flightBytes: route.flightBytes,
        avgDurationMs: route.count > 0 ? Math.round(route.totalDurationMs / route.count) : 0,
      }));
  }

  async #getResultCacheKey(request: Request, url: URL, pathRoute: PathRoute): Promise<string | null> {
    const config = await pathRoute.renderPage.getPageConfig?.();
    const ttl = RscRenderer.#normalizeCacheTtl(config?.rscCacheTtl);
    if (config?.rscCache !== "public" && ttl === null) {
      this.#resultCacheBypass += 1;
      return null;
    }
    if (ttl === 0) {
      this.#resultCacheBypass += 1;
      return null;
    }
    if (!RscRenderer.#isPublicCacheableRequest(request)) {
      this.#resultCacheBypass += 1;
      return null;
    }
    return [
      request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? url.host,
      request.headers.get("x-base-path") ?? "",
      url.pathname,
      url.search,
      request.headers.get("accept-language") ?? "",
      cookies().get("theme")?.value ?? "",
      ttl ?? 30,
    ].join("\n");
  }

  #getCachedResult(cacheKey: string): CachedRscResult | null {
    const cached = this.#resultCache.get(cacheKey);
    if (!cached) {
      this.#resultCacheMisses += 1;
      return null;
    }
    if (cached.expiresAt <= Date.now()) {
      this.#resultCache.delete(cacheKey);
      this.#resultCacheMisses += 1;
      return null;
    }
    this.#resultCacheHits += 1;
    return cached;
  }

  #setCachedResult(
    cacheKey: string,
    result: { chunks: Uint8Array[]; bytes: number; chunksCount: number; theme?: string },
  ): void {
    const ttl = Number.parseInt(cacheKey.split("\n").at(-1) ?? "30", 10);
    const maxEntries = RscRenderer.#parsePositiveIntEnv("AKAN_RSC_RESULT_CACHE_MAX_ENTRIES") ?? 100;
    while (this.#resultCache.size >= maxEntries) {
      const firstKey = this.#resultCache.keys().next().value;
      if (!firstKey) break;
      this.#resultCache.delete(firstKey);
    }
    this.#resultCache.set(cacheKey, { ...result, expiresAt: Date.now() + ttl * 1000 });
  }

  #runWithRequest<T>(request: Request, fn: () => Promise<T>): Promise<T> {
    if (requestStorage) return Promise.resolve(requestStorage.run(request, fn));
    return fn();
  }

  async #renderMatched(
    url: URL,
    match: { pathRoute: PathRoute; params: Record<string, string> },
    theme?: string,
  ): Promise<ReactNode> {
    const searchParams = RouteTreeBuilder.parseSearchParams(url.search);
    this.#logger.verbose(
      `composing route element pathname=${url.pathname} search=${url.search || "(none)"} params=${JSON.stringify(match.params)}`,
    );
    const routeHead = await RouteElementComposer.resolveHead({
      pathRoute: match.pathRoute,
      params: match.params,
      searchParams,
    });
    const body = RouteElementComposer.compose({ pathRoute: match.pathRoute, params: match.params, searchParams });
    return (
      <html
        lang={match.params.lang ?? this.#i18n.defaultLocale}
        {...(theme ? { "data-theme": theme } : { suppressHydrationWarning: true })}
      >
        <head key="head">
          <meta key="charset" charSet="utf-8" />
          <meta key="viewport" name="viewport" content="width=device-width, initial-scale=1" />
          {routeHead ?? this.#renderDefaultHead()}
          {match.pathRoute.isSpecialRoute ? null : this.#renderLocaleAlternates(url)}
          {this.#renderStylesheet(url.pathname)}
        </head>
        <body key="body">{body}</body>
      </html>
    );
  }

  #renderNotFound(url: URL): ReactNode {
    return createSystemPageDocument({
      kind: "not-found",
      pathname: url.pathname,
      lang: RscRenderer.#getLocale(url.pathname, this.#i18n),
      homeHref: getSystemPageHomeHref({
        pathname: url.pathname,
        i18n: this.#i18n,
        basePaths: this.#basePaths,
        headerBasePath: getRequest()?.headers.get("x-base-path"),
      }),
      stylesheetHref: this.#getStylesheetHref(url.pathname),
    });
  }

  #renderDefaultHead(): ReactNode {
    return <title key="title">{process.env.AKAN_PUBLIC_APP_NAME ?? "Akan App"}</title>;
  }

  #renderLocaleAlternates(url: URL): ReactNode {
    const languages: Record<string, string> = {};
    const publicUrl = RscRenderer.#getPublicRequestUrl(url);
    for (const lang of this.#i18n.locales) {
      const alternateUrl = new URL(publicUrl);
      alternateUrl.pathname = RscRenderer.#replaceLocalePathSegment(publicUrl.pathname, lang);
      languages[lang] = alternateUrl.href;
    }
    const xDefaultUrl = new URL(publicUrl);
    xDefaultUrl.pathname = "/";
    xDefaultUrl.search = "";
    xDefaultUrl.hash = "";
    languages["x-default"] = xDefaultUrl.href;
    return Object.entries(languages).map(([lang, href]) => (
      <link key={`alternate:${lang}`} rel="alternate" hrefLang={lang} href={href} />
    ));
  }

  #renderStylesheet(pathname: string): ReactNode {
    const cssUrl = this.#getStylesheetHref(pathname);
    if (!cssUrl) return null;
    return <link key="stylesheet" rel="stylesheet" href={cssUrl} precedence="default" data-akan-css="active" />;
  }

  #getStylesheetHref(pathname: string): string | null {
    const basePath = getBasePathFromPathname(pathname, {
      basePaths: Object.keys(this.#cssAssets),
      i18n: this.#i18n,
      headerBasePath: getRequest()?.headers.get("x-base-path"),
    });
    return this.#cssAssets[basePath ?? ""]?.cssUrl ?? null;
  }

  static #getLocale(pathname: string, i18n: AkanI18nConfig): string {
    const [segment] = pathname.split("/").filter(Boolean);
    return segment && i18n.locales.includes(segment) ? segment : i18n.defaultLocale;
  }

  static #parsePositiveIntEnv(name: string): number | null {
    const parsed = Number.parseInt(process.env[name] ?? "", 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  static #normalizeCacheTtl(value: unknown): number | null {
    if (value === undefined || value === null) return null;
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return null;
    return Math.floor(value);
  }

  static #isPublicCacheableRequest(request: Request): boolean {
    if (request.method !== "GET") return false;
    if (request.headers.has("authorization")) return false;
    const cookie = request.headers.get("cookie");
    if (!cookie) return true;
    return cookie
      .split(";")
      .map((part) => part.trim().split("=")[0])
      .filter(Boolean)
      .every((name) => name === "theme" || name.startsWith("akan_public_"));
  }

  static #getPublicRequestUrl(url: URL): URL {
    const publicUrl = new URL(url);
    const req = getRequest();
    const headers = req?.headers;
    const host = headers?.get("x-forwarded-host") ?? headers?.get("host");
    const proto = headers?.get("x-forwarded-proto");
    if (host) publicUrl.host = host;
    if (host && !host.includes(":")) publicUrl.port = "";
    if (proto) publicUrl.protocol = proto.endsWith(":") ? proto : `${proto}:`;

    const basePath = headers?.get("x-base-path");
    const parts = publicUrl.pathname.split("/").filter(Boolean);
    if (basePath && parts[1] === basePath) {
      publicUrl.pathname = `/${[parts[0], ...parts.slice(2)].filter(Boolean).join("/")}`;
    }
    return publicUrl;
  }

  static #replaceLocalePathSegment(pathname: string, lang: string): string {
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length === 0) return `/${lang}`;
    return `/${[lang, ...parts.slice(1)].join("/")}`;
  }
}

new RscRenderer().start();
