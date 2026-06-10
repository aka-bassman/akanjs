import { describe, expect, test } from "bun:test";
import {
  commitLatestRscNavigation,
  commitRscNavigation,
  deleteRscCacheEntryIfCurrent,
  observeRscNavigation,
  rememberRscCacheEntry,
} from "./rscNavigationState";

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

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
});
