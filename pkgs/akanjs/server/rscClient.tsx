import { createElement, type ReactNode, startTransition, use, useLayoutEffect, useState } from "react";
import { hydrateRoot } from "react-dom/client";
import { createFromReadableStream } from "react-server-dom-webpack/client.browser";
import { getRscPayloadStream, guardRscRedirectRows, type RscRedirectRow } from "./rscHttp";

type InlineRscChunk = [1, string] | [3, string];

declare global {
  var __RSC_CHUNKS__: InlineRscChunk[] | undefined;
  var __RSC_CLOSED__: boolean | undefined;
  var __RSC_PUSH__: ((type: InlineRscChunk[0], data: string) => void) | undefined;
  var __RSC_CLOSE__: (() => void) | undefined;
  var __AKAN_RSC_NAVIGATE__:
    | ((href: string, options?: { replace?: boolean; scrollToTop?: boolean }) => Promise<void>)
    | undefined;
  var __AKAN_RSC_REFRESH__: ((options?: { buildId?: number }) => Promise<void>) | undefined;
  var __AKAN_RSC_CLEAR_CACHE__: (() => void) | undefined;
}

function decodeBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function decodeInlineRscChunk([type, data]: InlineRscChunk): Uint8Array {
  if (type === 1) return new TextEncoder().encode(data);
  return decodeBase64(data);
}

type RscThenable = Promise<ReactNode>;
type RscFetchResult = { type: "rsc"; thenable: RscThenable } | { type: "redirected"; status?: number };
const MAX_RSC_CACHE_ENTRIES = 32;
let documentNavigationFallbackInFlight = false;

class RscRedirectNavigationStarted extends Error {
  constructor(readonly location: string) {
    super("[rscClient] RSC redirect navigation started");
    this.name = "RscRedirectNavigationStarted";
  }
}

function createInitialRscStream(): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      const queued = globalThis.__RSC_CHUNKS__ ?? [];
      for (const chunk of queued) controller.enqueue(decodeInlineRscChunk(chunk));
      globalThis.__RSC_CHUNKS__ = [];

      if (globalThis.__RSC_CLOSED__) {
        controller.close();
        return;
      }

      globalThis.__RSC_PUSH__ = (type, data) => controller.enqueue(decodeInlineRscChunk([type, data]));
      globalThis.__RSC_CLOSE__ = () => controller.close();
    },
  });
}

function normalizeHref(href: string): string {
  return new URL(href, window.location.origin).href;
}

function createRscThenable(stream: ReadableStream<Uint8Array>): RscThenable {
  return createFromReadableStream<ReactNode>(stream) as RscThenable;
}

function hardNavigateAfterRscFailure(target: string, replace = false, error?: unknown): void {
  if (documentNavigationFallbackInFlight) return;
  documentNavigationFallbackInFlight = true;
  console.warn(`[rscClient] RSC navigation failed, falling back to document navigation: ${String(error)}`);
  if (replace) window.location.replace(target);
  else window.location.assign(target);
}

function navigateAfterRscRedirect(target: string, replace = true): Error {
  const error = new RscRedirectNavigationStarted(target);
  const navigate = globalThis.__AKAN_RSC_NAVIGATE__;
  if (!navigate) {
    hardNavigateAfterRscFailure(target, replace, error);
    return error;
  }
  void navigate(target, { replace, scrollToTop: true }).catch((navError) => {
    hardNavigateAfterRscFailure(target, replace, navError);
  });
  return error;
}

async function fetchRsc(
  href: string,
  options: { buildId?: number; replaceOnRedirect?: boolean } = {},
): Promise<RscFetchResult> {
  const endpoint = new URL("/__rsc", window.location.origin);
  endpoint.searchParams.set("url", href);
  if (options.buildId !== undefined) endpoint.searchParams.set("buildId", String(options.buildId));
  const res = await fetch(endpoint, {
    headers: { Accept: "text/x-component", "Cache-Control": "no-cache" },
    credentials: "same-origin",
    cache: "no-store",
  });
  const redirect = res.headers.get("X-Akan-Redirect");
  if (redirect) {
    const method = res.headers.get("X-Akan-Redirect-Method");
    const statusHeader = res.headers.get("X-Akan-Redirect-Status");
    const status = statusHeader ? Number(statusHeader) : undefined;
    await globalThis.__AKAN_RSC_NAVIGATE__?.(redirect, { replace: method !== "push", scrollToTop: true });
    return { type: "redirected", status };
  }
  const stream = getRscPayloadStream(res);
  if (!stream) throw new Error(`[rscClient] RSC fetch failed ${res.status} ${res.statusText}`);
  let rejectRedirect!: (error: Error) => void;
  const redirectThenable = new Promise<never>((_, reject) => {
    rejectRedirect = reject;
  });
  const handleRedirect = (redirect: RscRedirectRow) => {
    const location = redirect.location ? normalizeHref(redirect.location) : href;
    const error = navigateAfterRscRedirect(location, true);
    rejectRedirect(error);
  };
  const guardedStream = guardRscRedirectRows(stream, {
    onRedirect: handleRedirect,
  });
  const thenable = Promise.race([createRscThenable(guardedStream), redirectThenable]);
  return {
    type: "rsc",
    thenable,
  };
}

const rscCache = new Map<string, RscThenable>();
const initialThenable = createRscThenable(createInitialRscStream());
rscCache.set(normalizeHref(window.location.href), initialThenable);
let navigationSeq = 0;

function rememberRsc(href: string, thenable: RscThenable): void {
  rscCache.delete(href);
  rscCache.set(href, thenable);
  while (rscCache.size > MAX_RSC_CACHE_ENTRIES) {
    const oldest = rscCache.keys().next().value;
    if (!oldest) break;
    rscCache.delete(oldest);
  }
}

function Root(): ReactNode {
  const [thenable, setThenable] = useState<RscThenable>(initialThenable);
  const [scrollToTopTick, setScrollToTopTick] = useState(0);

  useLayoutEffect(() => {
    if (!scrollToTopTick) return;
    window.scrollTo(0, 0);
  }, [scrollToTopTick]);

  globalThis.__AKAN_RSC_CLEAR_CACHE__ = () => {
    rscCache.clear();
    rscCache.set(normalizeHref(window.location.href), thenable);
  };

  globalThis.__AKAN_RSC_REFRESH__ = async (options = {}) => {
    const target = normalizeHref(window.location.href);
    rscCache.delete(target);
    try {
      const next = await fetchRsc(target, { ...options, replaceOnRedirect: true });
      if (next.type === "redirected") return;
      rememberRsc(target, next.thenable);
      await next.thenable;
      startTransition(() => {
        setThenable(next.thenable);
      });
    } catch (error) {
      rscCache.delete(target);
      if (error instanceof RscRedirectNavigationStarted) return;
      hardNavigateAfterRscFailure(target, true, error);
    }
  };

  globalThis.__AKAN_RSC_NAVIGATE__ = async (href, options = {}) => {
    const navId = ++navigationSeq;
    const target = normalizeHref(href);
    const scrollToTop = options.scrollToTop ?? true;
    try {
      let next = rscCache.get(target);
      if (!next) {
        const fetched = await fetchRsc(target, { replaceOnRedirect: options.replace });
        if (fetched.type === "redirected") return;
        next = fetched.thenable;
        rememberRsc(target, next);
      } else {
        rememberRsc(target, next);
      }
      await next;
      if (navId !== navigationSeq) return;
      startTransition(() => {
        setThenable(next as RscThenable);
        if (options.replace) window.history.replaceState(null, "", target);
        else window.history.pushState(null, "", target);
        if (scrollToTop) setScrollToTopTick((tick) => tick + 1);
      });
    } catch (error) {
      rscCache.delete(target);
      if (error instanceof RscRedirectNavigationStarted) return;
      if (navId === navigationSeq) hardNavigateAfterRscFailure(target, options.replace, error);
    }
  };

  return use(thenable);
}

window.addEventListener("popstate", () => {
  void globalThis.__AKAN_RSC_NAVIGATE__?.(window.location.href, { replace: true, scrollToTop: false });
});

const hydrate = () => hydrateRoot(document, createElement(Root));
void Promise.resolve(initialThenable).then(hydrate, hydrate);
