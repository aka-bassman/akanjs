import { createElement, type ReactNode, startTransition, use, useLayoutEffect, useState } from "react";
import { hydrateRoot } from "react-dom/client";
import { createFromReadableStream } from "react-server-dom-webpack/client.browser";

declare global {
  var __RSC_CHUNKS__: string[] | undefined;
  var __RSC_CLOSED__: boolean | undefined;
  var __RSC_PUSH__: ((b64: string) => void) | undefined;
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

type RscThenable = Promise<ReactNode>;
type RscFetchResult = { type: "rsc"; thenable: RscThenable } | { type: "redirected" };
const MAX_RSC_CACHE_ENTRIES = 32;

function createInitialRscStream(): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      const queued = globalThis.__RSC_CHUNKS__ ?? [];
      for (const b64 of queued) controller.enqueue(decodeBase64(b64));
      globalThis.__RSC_CHUNKS__ = [];

      if (globalThis.__RSC_CLOSED__) {
        controller.close();
        return;
      }

      globalThis.__RSC_PUSH__ = (b64: string) => controller.enqueue(decodeBase64(b64));
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

async function fetchRsc(href: string, options: { buildId?: number } = {}): Promise<RscFetchResult> {
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
    await globalThis.__AKAN_RSC_NAVIGATE__?.(redirect, { replace: method !== "push", scrollToTop: true });
    return { type: "redirected" };
  }
  if (!res.ok || !res.body) throw new Error(`[rscClient] RSC fetch failed ${res.status} ${res.statusText}`);
  // Buffer the entire Flight payload before constructing the thenable. The root
  // `use(thenable)` lives at the document root with no Suspense boundary above it
  // (see Root / ssrFromRscRenderer), so any mid-render suspension during a client
  // navigation transition has no fallback and can leave the transition stuck —
  // committing only when a later navigation flushes the pending lane. Materializing
  // the payload up front means all RSC rows are present and every referenced client
  // module `import()` starts immediately, so the committed render does not suspend.
  const buffer = await res.arrayBuffer();
  const completeStream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new Uint8Array(buffer));
      controller.close();
    },
  });
  return { type: "rsc", thenable: createRscThenable(completeStream) };
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
    const next = await fetchRsc(target, options);
    if (next.type === "redirected") return;
    rememberRsc(target, next.thenable);
    try {
      await next.thenable;
    } catch (error) {
      rscCache.delete(target);
      throw error;
    }
    startTransition(() => {
      setThenable(next.thenable);
    });
  };

  globalThis.__AKAN_RSC_NAVIGATE__ = async (href, options = {}) => {
    const navId = ++navigationSeq;
    const target = normalizeHref(href);
    const scrollToTop = options.scrollToTop ?? true;
    let next = rscCache.get(target);
    if (!next) {
      const fetched = await fetchRsc(target);
      if (fetched.type === "redirected") return;
      next = fetched.thenable;
      rememberRsc(target, next);
    } else {
      rememberRsc(target, next);
    }
    try {
      await next;
    } catch (error) {
      rscCache.delete(target);
      throw error;
    }
    if (navId !== navigationSeq) return;
    startTransition(() => {
      setThenable(next as RscThenable);
      if (options.replace) window.history.replaceState(null, "", target);
      else window.history.pushState(null, "", target);
      if (scrollToTop) setScrollToTopTick((tick) => tick + 1);
    });
  };

  return use(thenable);
}

window.addEventListener("popstate", () => {
  void globalThis.__AKAN_RSC_NAVIGATE__?.(window.location.href, { replace: true, scrollToTop: false });
});

const hydrate = () => hydrateRoot(document, createElement(Root));
void Promise.resolve(initialThenable).then(hydrate, hydrate);
