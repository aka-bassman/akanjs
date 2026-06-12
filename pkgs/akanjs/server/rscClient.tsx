import { createElement, type ReactNode, startTransition, use, useLayoutEffect, useState } from "react";
import { hydrateRoot } from "react-dom/client";
import { createFromReadableStream } from "react-server-dom-webpack/client.browser";
import {
  type AkanRouterStateV1,
  appendAkanRouterStateRequestHeaders,
  readAkanRouterStateResponseHeader,
} from "./routeState";
import { getRscPayloadStream, guardRscRedirectRows, type RscRedirectRow } from "./rscHttp";
import {
  commitLatestRscNavigation,
  createRscNavigationCacheNode,
  deleteRscCacheEntryIfCurrent,
  observeRscNavigationNode,
  type RscNavigationCacheNode,
  rememberRscCacheNode,
} from "./rscNavigationState";

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

type RscThenable = Promise<ReactNode> & {
  status?: "pending" | "fulfilled" | "rejected";
  value?: ReactNode;
  reason?: unknown;
};
type RscCacheNode = RscNavigationCacheNode<RscThenable>;
type RscFetchResult = { type: "rsc"; node: RscCacheNode } | { type: "redirected"; status?: number };
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

/**
 * Mirror React's thenable protocol (status/value/reason) onto the Flight thenable.
 *
 * Without this, `use(thenable)` cannot tell an already-resolved native Promise apart
 * from a pending one: it suspends the root transition once and relies on React's
 * ping -> retry -> re-commit path. That path intermittently lost the re-commit when
 * sync store updates raced the suspended transition, leaving the previous page DOM
 * visible even though the navigation pipeline completed. With the status tracked,
 * `use()` returns the fulfilled payload synchronously and the committed transition
 * renders the new tree in a single pass.
 */
function trackRscThenable(thenable: RscThenable): RscThenable {
  if (thenable.status !== undefined) return thenable;
  thenable.status = "pending";
  thenable.then(
    (value) => {
      thenable.status = "fulfilled";
      thenable.value = value;
    },
    (reason) => {
      thenable.status = "rejected";
      thenable.reason = reason;
    },
  );
  return thenable;
}

function createRscThenable(stream: ReadableStream<Uint8Array>): RscThenable {
  return trackRscThenable(createFromReadableStream<ReactNode>(stream) as RscThenable);
}

function hardNavigateAfterRscFailure(target: string, replace = false, error?: unknown): void {
  if (documentNavigationFallbackInFlight) return;
  documentNavigationFallbackInFlight = true;
  console.warn(`[rscClient] RSC navigation failed, falling back to document navigation: ${String(error)}`);
  if (replace) window.location.replace(target);
  else window.location.assign(target);
}

function navigateAfterRscRedirect(target: string, replace = true): void {
  const error = new RscRedirectNavigationStarted(target);
  const navigate = globalThis.__AKAN_RSC_NAVIGATE__;
  if (!navigate) {
    hardNavigateAfterRscFailure(target, replace, error);
    return;
  }
  void navigate(target, { replace, scrollToTop: true }).catch((navError) => {
    hardNavigateAfterRscFailure(target, replace, navError);
  });
}

async function fetchRsc(
  href: string,
  options: { buildId?: number; replaceOnRedirect?: boolean; shouldApplyNavigation?: () => boolean } = {},
): Promise<RscFetchResult> {
  const shouldApplyNavigation = options.shouldApplyNavigation ?? (() => true);
  const endpoint = new URL("/__rsc", window.location.origin);
  endpoint.searchParams.set("url", href);
  if (options.buildId !== undefined) endpoint.searchParams.set("buildId", String(options.buildId));
  const headers = new Headers({ Accept: "text/x-component", "Cache-Control": "no-cache" });
  appendAkanRouterStateRequestHeaders(headers, currentRouterState);
  const res = await fetch(endpoint, {
    headers,
    credentials: "same-origin",
    cache: "no-store",
  });
  const redirect = res.headers.get("X-Akan-Redirect");
  if (redirect) {
    const method = res.headers.get("X-Akan-Redirect-Method");
    const statusHeader = res.headers.get("X-Akan-Redirect-Status");
    const status = statusHeader ? Number(statusHeader) : undefined;
    if (shouldApplyNavigation())
      await globalThis.__AKAN_RSC_NAVIGATE__?.(redirect, { replace: method !== "push", scrollToTop: true });
    return { type: "redirected", status };
  }
  const stream = getRscPayloadStream(res);
  if (!stream) throw new Error(`[rscClient] RSC fetch failed ${res.status} ${res.statusText}`);
  const nodeRef: { current?: RscCacheNode } = {};
  const handleRedirect = (redirect: RscRedirectRow) => {
    if (!shouldApplyNavigation()) return;
    const location = redirect.location ? normalizeHref(redirect.location) : href;
    if (nodeRef.current) deleteRscCacheEntryIfCurrent(rscCache, href, nodeRef.current);
    navigateAfterRscRedirect(
      location,
      redirect.method ? redirect.method !== "push" : (options.replaceOnRedirect ?? true),
    );
  };
  const guardedStream = guardRscRedirectRows(stream, {
    onRedirect: handleRedirect,
  });
  const thenable = createRscThenable(guardedStream);
  const node = createRscNavigationCacheNode({
    href,
    thenable,
    routerState: readAkanRouterStateResponseHeader(res.headers),
  });
  nodeRef.current = node;
  return {
    type: "rsc",
    node,
  };
}

const rscCache = new Map<string, RscCacheNode>();
const initialThenable = createRscThenable(createInitialRscStream());
const initialNode = createRscNavigationCacheNode({
  href: normalizeHref(window.location.href),
  thenable: initialThenable,
  routerState: null,
});
rscCache.set(initialNode.href, initialNode);
let currentRouterState: AkanRouterStateV1 | null = null;
let navigationSeq = 0;

function rememberCommittedRouteState(node: RscCacheNode): void {
  if (!node.routerState) return;
  currentRouterState = node.routerState;
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
    const href = normalizeHref(window.location.href);
    rscCache.set(
      href,
      createRscNavigationCacheNode({
        href,
        thenable,
        routerState: currentRouterState,
      }),
    );
  };

  globalThis.__AKAN_RSC_REFRESH__ = async (options = {}) => {
    const navId = ++navigationSeq;
    const target = normalizeHref(window.location.href);
    rscCache.delete(target);
    try {
      const next = await fetchRsc(target, {
        ...options,
        replaceOnRedirect: true,
        shouldApplyNavigation: () => navId === navigationSeq,
      });
      if (next.type === "redirected") return;
      observeRscNavigationNode({
        cache: rscCache,
        node: next.node,
        navId,
        getCurrentNavId: () => navigationSeq,
        isExpectedNavigationError: (error) => error instanceof RscRedirectNavigationStarted,
        onLatestError: (error) => hardNavigateAfterRscFailure(target, true, error),
      });
      // Commit only once the payload root is fulfilled so `use()` never suspends the
      // root transition (see trackRscThenable). Staleness is re-checked by navId below.
      await next.node.thenable;
      const committed = commitLatestRscNavigation({
        cache: rscCache,
        href: target,
        thenable: next.node,
        maxEntries: MAX_RSC_CACHE_ENTRIES,
        startTransition,
        commitThenable: (node) => setThenable(node.thenable),
        navId,
        getCurrentNavId: () => navigationSeq,
      });
      if (committed) rememberCommittedRouteState(next.node);
    } catch (error) {
      if (error instanceof RscRedirectNavigationStarted) return;
      if (navId === navigationSeq) hardNavigateAfterRscFailure(target, true, error);
    }
  };

  globalThis.__AKAN_RSC_NAVIGATE__ = async (href, options = {}) => {
    const navId = ++navigationSeq;
    const target = normalizeHref(href);
    const scrollToTop = options.scrollToTop ?? true;
    try {
      let nextNode = rscCache.get(target);
      if (!nextNode) {
        const fetched = await fetchRsc(target, {
          replaceOnRedirect: options.replace,
          shouldApplyNavigation: () => navId === navigationSeq,
        });
        if (fetched.type === "redirected") return;
        nextNode = fetched.node;
      } else {
        rememberRscCacheNode(rscCache, nextNode, MAX_RSC_CACHE_ENTRIES);
      }
      observeRscNavigationNode({
        cache: rscCache,
        node: nextNode,
        navId,
        getCurrentNavId: () => navigationSeq,
        isExpectedNavigationError: (error) => error instanceof RscRedirectNavigationStarted,
        onLatestError: (error) => hardNavigateAfterRscFailure(target, options.replace, error),
      });
      // Commit only once the payload root is fulfilled so `use()` never suspends the
      // root transition (see trackRscThenable). Staleness is re-checked by navId below.
      await nextNode.thenable;
      const committed = commitLatestRscNavigation({
        cache: rscCache,
        href: target,
        thenable: nextNode,
        maxEntries: MAX_RSC_CACHE_ENTRIES,
        startTransition,
        commitThenable: (node) => setThenable(node.thenable),
        updateHistory: () => {
          if (options.replace) window.history.replaceState(null, "", target);
          else window.history.pushState(null, "", target);
        },
        scrollToTop,
        bumpScrollToTop: () => setScrollToTopTick((tick) => tick + 1),
        navId,
        getCurrentNavId: () => navigationSeq,
      });
      if (committed) rememberCommittedRouteState(nextNode);
    } catch (error) {
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
