import { describe, expect, test } from "bun:test";
import {
  commitLatestRscNavigation,
  commitRscNavigation,
  createRscNavigationCacheNode,
  deleteRscCacheEntryIfCurrent,
  observeRscNavigation,
  observeRscNavigationNode,
  type RscNavigationCacheNode,
  rememberRscCacheEntry,
  rememberRscCacheNode,
} from "./rscNavigationState";

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
type TestCacheNode = RscNavigationCacheNode<Promise<string>>;

describe("RSC navigation state helpers", () => {
  test("commits a pending thenable immediately inside the transition", () => {
    const cache = new Map<string, Promise<string>>();
    const thenable = new Promise<string>(() => {});
    const calls: unknown[] = [];

    commitRscNavigation({
      cache,
      href: "https://example.test/next",
      thenable,
      maxEntries: 32,
      startTransition: (callback) => {
        calls.push("transition");
        callback();
      },
      commitThenable: (value) => calls.push(["commit", value]),
      updateHistory: () => calls.push("history"),
      scrollToTop: true,
      bumpScrollToTop: () => calls.push("scroll"),
    });

    expect(cache.get("https://example.test/next")).toBe(thenable);
    expect(calls).toEqual(["transition", ["commit", thenable], "history", "scroll"]);
  });

  test("does not commit stale navigation results", () => {
    const cache = new Map<string, Promise<string>>();
    const thenable = Promise.resolve("stale");
    const calls: unknown[] = [];

    const committed = commitLatestRscNavigation({
      cache,
      href: "https://example.test/stale",
      thenable,
      maxEntries: 32,
      navId: 1,
      getCurrentNavId: () => 2,
      startTransition: (callback) => {
        calls.push("transition");
        callback();
      },
      commitThenable: (value) => calls.push(["commit", value]),
      updateHistory: () => calls.push("history"),
      scrollToTop: true,
      bumpScrollToTop: () => calls.push("scroll"),
    });

    expect(committed).toBe(false);
    expect(cache.has("https://example.test/stale")).toBe(false);
    expect(calls).toEqual([]);
  });

  test("commits latest navigation results", () => {
    const cache = new Map<string, Promise<string>>();
    const thenable = Promise.resolve("latest");
    const calls: unknown[] = [];

    const committed = commitLatestRscNavigation({
      cache,
      href: "https://example.test/latest",
      thenable,
      maxEntries: 32,
      navId: 2,
      getCurrentNavId: () => 2,
      startTransition: (callback) => {
        calls.push("transition");
        callback();
      },
      commitThenable: (value) => calls.push(["commit", value]),
      updateHistory: () => calls.push("history"),
      scrollToTop: true,
      bumpScrollToTop: () => calls.push("scroll"),
    });

    expect(committed).toBe(true);
    expect(cache.get("https://example.test/latest")).toBe(thenable);
    expect(calls).toEqual(["transition", ["commit", thenable], "history", "scroll"]);
  });

  test("evicts the oldest cache entry when remembering a new thenable", () => {
    const cache = new Map<string, Promise<string>>();
    const first = Promise.resolve("first");
    const second = Promise.resolve("second");
    const third = Promise.resolve("third");

    rememberRscCacheEntry(cache, "/a", first, 2);
    rememberRscCacheEntry(cache, "/b", second, 2);
    rememberRscCacheEntry(cache, "/c", third, 2);

    expect(cache.has("/a")).toBe(false);
    expect(cache.get("/b")).toBe(second);
    expect(cache.get("/c")).toBe(third);
  });

  test("deletes cache entries only when the rejected thenable is current", async () => {
    const cache = new Map<string, Promise<string>>();
    const oldThenable = Promise.reject(new Error("old"));
    oldThenable.catch(() => {});
    const currentThenable = Promise.resolve("current");
    const errors: unknown[] = [];

    cache.set("/target", currentThenable);
    observeRscNavigation({
      cache,
      href: "/target",
      thenable: oldThenable,
      navId: 1,
      getCurrentNavId: () => 1,
      onLatestError: (error) => errors.push(error),
    });

    await tick();

    expect(cache.get("/target")).toBe(currentThenable);
    expect(errors).toHaveLength(1);
  });

  test("ignores stale navigation failures after cleaning up only the stale entry", async () => {
    const cache = new Map<string, Promise<string>>();
    const staleThenable = Promise.reject(new Error("stale"));
    staleThenable.catch(() => {});
    const errors: unknown[] = [];

    cache.set("/stale", staleThenable);
    observeRscNavigation({
      cache,
      href: "/stale",
      thenable: staleThenable,
      navId: 1,
      getCurrentNavId: () => 2,
      onLatestError: (error) => errors.push(error),
    });

    await tick();

    expect(cache.has("/stale")).toBe(false);
    expect(errors).toEqual([]);
  });

  test("does not remove a newer same-href navigation when a stale thenable rejects", async () => {
    const cache = new Map<string, Promise<string>>();
    const staleThenable = Promise.reject(new Error("stale"));
    staleThenable.catch(() => {});
    const latestThenable = Promise.resolve("latest");
    const errors: unknown[] = [];

    cache.set("/same", latestThenable);
    observeRscNavigation({
      cache,
      href: "/same",
      thenable: staleThenable,
      navId: 1,
      getCurrentNavId: () => 2,
      onLatestError: (error) => errors.push(error),
    });

    await tick();

    expect(cache.get("/same")).toBe(latestThenable);
    expect(errors).toEqual([]);
  });

  test("ignores expected redirect navigation errors", async () => {
    const cache = new Map<string, Promise<string>>();
    const redirectError = new Error("redirect started");
    const thenable = Promise.reject(redirectError);
    thenable.catch(() => {});
    const errors: unknown[] = [];

    cache.set("/redirect", thenable);
    observeRscNavigation({
      cache,
      href: "/redirect",
      thenable,
      navId: 1,
      getCurrentNavId: () => 1,
      isExpectedNavigationError: (error) => error === redirectError,
      onLatestError: (error) => errors.push(error),
    });

    await tick();

    expect(cache.has("/redirect")).toBe(false);
    expect(errors).toEqual([]);
  });

  test("does not delete a newer thenable explicitly", () => {
    const cache = new Map<string, Promise<string>>();
    const oldThenable = Promise.resolve("old");
    const newThenable = Promise.resolve("new");
    cache.set("/target", newThenable);

    expect(deleteRscCacheEntryIfCurrent(cache, "/target", oldThenable)).toBe(false);
    expect(cache.get("/target")).toBe(newThenable);
    expect(deleteRscCacheEntryIfCurrent(cache, "/target", newThenable)).toBe(true);
    expect(cache.has("/target")).toBe(false);
  });

  test("keeps thenable and route state together in navigation cache nodes", () => {
    const cache = new Map<string, TestCacheNode>();
    const thenable = Promise.resolve("node");
    const node = createRscNavigationCacheNode({
      href: "https://example.test/node",
      thenable,
      routerState: {
        version: 1,
        href: "https://example.test/node",
        routeId: "/node",
        segments: [{ kind: "page", path: "/node", key: "page:/node:0" }],
      },
    });

    rememberRscCacheNode(cache, node, 32);

    expect(cache.get("https://example.test/node")).toBe(node);
    expect(cache.get("https://example.test/node")?.thenable).toBe(thenable);
    expect(cache.get("https://example.test/node")?.routerState?.routeId).toBe("/node");
  });

  test("evicts the oldest navigation cache node", () => {
    const cache = new Map<string, TestCacheNode>();
    const first = createRscNavigationCacheNode({ href: "/a", thenable: Promise.resolve("a"), routerState: null });
    const second = createRscNavigationCacheNode({ href: "/b", thenable: Promise.resolve("b"), routerState: null });
    const third = createRscNavigationCacheNode({ href: "/c", thenable: Promise.resolve("c"), routerState: null });

    rememberRscCacheNode(cache, first, 2);
    rememberRscCacheNode(cache, second, 2);
    rememberRscCacheNode(cache, third, 2);

    expect(cache.has("/a")).toBe(false);
    expect(cache.get("/b")).toBe(second);
    expect(cache.get("/c")).toBe(third);
  });

  test("commits latest navigation cache nodes through the existing stale guard", () => {
    const cache = new Map<string, TestCacheNode>();
    const node = createRscNavigationCacheNode({
      href: "https://example.test/latest-node",
      thenable: Promise.resolve("latest-node"),
      routerState: null,
    });
    const calls: unknown[] = [];

    const committed = commitLatestRscNavigation({
      cache,
      href: node.href,
      thenable: node,
      maxEntries: 32,
      navId: 2,
      getCurrentNavId: () => 2,
      startTransition: (callback) => {
        calls.push("transition");
        callback();
      },
      commitThenable: (value) => calls.push(["commit", value.thenable]),
    });

    expect(committed).toBe(true);
    expect(cache.get(node.href)).toBe(node);
    expect(calls).toEqual(["transition", ["commit", node.thenable]]);
  });

  test("does not commit stale navigation cache nodes", () => {
    const cache = new Map<string, TestCacheNode>();
    const node = createRscNavigationCacheNode({
      href: "https://example.test/stale-node",
      thenable: Promise.resolve("stale-node"),
      routerState: null,
    });
    const calls: unknown[] = [];

    const committed = commitLatestRscNavigation({
      cache,
      href: node.href,
      thenable: node,
      maxEntries: 32,
      navId: 1,
      getCurrentNavId: () => 2,
      startTransition: (callback) => {
        calls.push("transition");
        callback();
      },
      commitThenable: (value) => calls.push(["commit", value.thenable]),
    });

    expect(committed).toBe(false);
    expect(cache.has(node.href)).toBe(false);
    expect(calls).toEqual([]);
  });

  test("does not remove a newer same-href navigation node when a stale node rejects", async () => {
    const cache = new Map<string, TestCacheNode>();
    const staleThenable: Promise<string> = Promise.reject(new Error("stale node"));
    staleThenable.catch(() => {});
    const staleNode = createRscNavigationCacheNode({ href: "/same-node", thenable: staleThenable, routerState: null });
    const latestNode = createRscNavigationCacheNode({
      href: "/same-node",
      thenable: Promise.resolve("latest node"),
      routerState: null,
    });
    const errors: unknown[] = [];

    cache.set("/same-node", latestNode);
    observeRscNavigationNode({
      cache,
      node: staleNode,
      navId: 1,
      getCurrentNavId: () => 2,
      onLatestError: (error) => errors.push(error),
    });

    await tick();

    expect(cache.get("/same-node")).toBe(latestNode);
    expect(errors).toEqual([]);
  });

  test("reuses navigation cache nodes without router state", () => {
    const cache = new Map<string, TestCacheNode>();
    const thenable = Promise.resolve("full fallback node");
    const node = createRscNavigationCacheNode({ href: "/no-state", thenable, routerState: null });

    rememberRscCacheNode(cache, node, 32);

    const cached = cache.get("/no-state");
    expect(cached).toBe(node);
    expect(cached?.thenable).toBe(thenable);
    expect(cached?.routerState).toBeNull();
  });
});
