import { afterEach, beforeAll, describe, expect, mock, test } from "bun:test";
import type { InfiniteScrollProps } from "./InfiniteScroll";

type Effect = () => (() => void) | undefined;

const effectQueue: Effect[] = [];
const effectCleanups: Array<() => void> = [];
let hookIndex = 0;
const hookStates: unknown[] = [];
let latestObserver: FakeIntersectionObserver | undefined;
const originalIntersectionObserver = globalThis.IntersectionObserver;

const fakeElement = { nodeType: 1, nodeName: "DIV", parentElement: null } as unknown as Element;

interface FakeScroller {
  scrollHeight: number;
  clientHeight: number;
  scrollTop: number;
  overflowY: string;
  flexDirection: string;
  parentElement: FakeScroller | null;
}

const originalDocument = (globalThis as { document?: unknown }).document;
const originalGetComputedStyle = (globalThis as { getComputedStyle?: unknown }).getComputedStyle;

/**
 * The walk reads `parentElement`, `scrollHeight`/`clientHeight` and the computed `overflow-y`, so a chain of
 * plain objects plus a `getComputedStyle` that reads the one back off them is the whole DOM this needs.
 */
const stubDom = (chain: FakeScroller[], scrollingElement: unknown = null) => {
  let parent: FakeScroller | null = null;
  for (const link of chain) {
    link.parentElement = parent;
    parent = link;
  }
  (fakeElement as unknown as { parentElement: FakeScroller | null }).parentElement = parent;
  Object.defineProperty(globalThis, "document", {
    value: { body: {}, documentElement: {}, scrollingElement },
    configurable: true,
  });
  Object.defineProperty(globalThis, "getComputedStyle", {
    value: (el: FakeScroller) => ({ overflowY: el.overflowY, flexDirection: el.flexDirection }),
    configurable: true,
  });
};

const makeScroller = (over: Partial<FakeScroller> = {}): FakeScroller => ({
  scrollHeight: 1000,
  clientHeight: 400,
  scrollTop: 100,
  overflowY: "auto",
  flexDirection: "column",
  parentElement: null,
  ...over,
});

const resetHooks = () => {
  hookIndex = 0;
  hookStates.length = 0;
  effectQueue.length = 0;
};

const flushEffects = () => {
  for (const effect of effectQueue.splice(0)) {
    const cleanup = effect();
    if (cleanup) effectCleanups.push(cleanup);
  }
};

const tick = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

class FakeIntersectionObserver {
  observed: Element[] = [];

  constructor(
    private readonly callback: IntersectionObserverCallback,
    readonly options?: IntersectionObserverInit,
  ) {
    latestObserver = this;
  }

  observe = (element: Element) => {
    this.observed.push(element);
  };

  disconnect = () => {
    this.observed = [];
  };

  emit = (isIntersecting = true) => {
    this.callback(
      [{ isIntersecting, target: this.observed[0] ?? fakeElement } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  };
}

const assignRef = (ref: unknown) => {
  if (typeof ref === "function") {
    ref(fakeElement);
    return;
  }
  if (ref && typeof ref === "object" && "current" in ref) {
    (ref as { current: Element | null }).current = fakeElement;
  }
};

const createElement = (type: unknown, props: Record<string, unknown> = {}) => {
  assignRef(props.ref);
  return { type, props };
};

beforeAll(() => {
  mock.module("react", () => ({
    Fragment: ({ children }: { children: unknown }) => children,
    useEffect: (effect: Effect) => {
      effectQueue.push(effect);
    },
    useRef: <T,>(initial: T) => {
      const index = hookIndex++;
      if (!hookStates[index]) hookStates[index] = { current: initial };
      return hookStates[index] as { current: T };
    },
    useState: <T,>(initial: T) => {
      const index = hookIndex++;
      if (hookStates[index] === undefined)
        hookStates[index] = typeof initial === "function" ? (initial as () => T)() : initial;
      const setState = (next: T | ((prev: T) => T)) => {
        const prev = hookStates[index] as T;
        hookStates[index] = typeof next === "function" ? (next as (value: T) => T)(prev) : next;
      };
      return [hookStates[index] as T, setState] as const;
    },
  }));
  mock.module("react/jsx-dev-runtime", () => ({
    Fragment: ({ children }: { children: unknown }) => children,
    jsxDEV: createElement,
  }));
  mock.module("react/jsx-runtime", () => ({
    Fragment: ({ children }: { children: unknown }) => children,
    jsx: createElement,
    jsxs: createElement,
  }));
  mock.module("react-icons/bi", () => ({
    BiLoaderAlt: (props: Record<string, unknown>) => createElement("BiLoaderAlt", props),
  }));
});

afterEach(() => {
  for (const cleanup of effectCleanups.splice(0)) cleanup();
  latestObserver = undefined;
  resetHooks();
  (fakeElement as unknown as { parentElement: unknown }).parentElement = null;
  Object.defineProperty(globalThis, "document", { value: originalDocument, configurable: true });
  Object.defineProperty(globalThis, "getComputedStyle", { value: originalGetComputedStyle, configurable: true });
  Object.defineProperty(globalThis, "IntersectionObserver", {
    value: originalIntersectionObserver,
    configurable: true,
  });
});

const renderInfiniteScroll = async (props: InfiniteScrollProps) => {
  Object.defineProperty(globalThis, "IntersectionObserver", {
    value: FakeIntersectionObserver,
    configurable: true,
  });
  const { InfiniteScroll } = await import("./InfiniteScroll");
  hookIndex = 0;
  const result = InfiniteScroll(props);
  flushEffects();
  return result;
};

describe("InfiniteScroll", () => {
  test("loads more once when the sentinel intersects", async () => {
    let loadMoreCalls = 0;

    await renderInfiniteScroll({
      hasMore: true,
      onLoadMore: async () => {
        loadMoreCalls += 1;
      },
      children: "items",
    });

    expect(latestObserver?.observed).toHaveLength(1);

    latestObserver?.emit();
    await tick();

    expect(loadMoreCalls).toBe(1);
  });

  test("draws no sentinel once the server has nothing left", async () => {
    await renderInfiniteScroll({
      hasMore: false,
      onLoadMore: async () => {
        throw new Error("should not load");
      },
      children: "items",
    });

    expect(latestObserver?.observed).toHaveLength(0);
  });

  test("anchors reverse loads on the nearest scrolling ancestor, not the document", async () => {
    const timeline = makeScroller();
    const clipped = makeScroller({ overflowY: "hidden", scrollHeight: 1000, clientHeight: 1000 });
    const page = makeScroller({ scrollTop: 0 });
    stubDom([page, timeline, clipped], page);

    await renderInfiniteScroll({
      hasMore: true,
      reverse: true,
      onLoadMore: async () => {
        timeline.scrollHeight = 1600;
      },
      children: "items",
    });

    latestObserver?.emit();
    await tick();

    expect(timeline.scrollTop).toBe(700);
    expect(page.scrollTop).toBe(0);
  });

  test("scopes the trigger to the scrolling ancestor so it does not depend on page layout", async () => {
    const timeline = makeScroller();
    stubDom([makeScroller({ scrollTop: 0 }), timeline], makeScroller());

    await renderInfiniteScroll({
      hasMore: true,
      reverse: true,
      onLoadMore: async () => undefined,
      children: "items",
    });

    expect(latestObserver?.options?.root).toBe(timeline as unknown as Element);
  });

  test("says so once when a column-reverse parent puts the sentinel at the wrong end", async () => {
    const warnings: string[] = [];
    const originalWarn = console.warn;
    const originalEnv = process.env.AKAN_PUBLIC_ENV;
    console.warn = (message: string) => void warnings.push(message);
    process.env.AKAN_PUBLIC_ENV = "local";
    stubDom([makeScroller({ overflowY: "visible", scrollHeight: 400, clientHeight: 400 })]);
    (fakeElement as unknown as { parentElement: FakeScroller }).parentElement = makeScroller({
      flexDirection: "column-reverse",
      overflowY: "visible",
      scrollHeight: 400,
      clientHeight: 400,
    });

    try {
      await renderInfiniteScroll({ hasMore: true, reverse: true, onLoadMore: async () => undefined, children: "x" });
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain("flex-col-reverse");

      resetHooks();
      await renderInfiniteScroll({ hasMore: true, reverse: true, onLoadMore: async () => undefined, children: "x" });
      expect(warnings).toHaveLength(1);
    } finally {
      console.warn = originalWarn;
      process.env.AKAN_PUBLIC_ENV = originalEnv;
    }
  });

  test("leaves the observer root implicit when the document is the scroller", async () => {
    const scrollingElement = makeScroller();
    stubDom([makeScroller({ overflowY: "visible", scrollHeight: 400, clientHeight: 400 })], scrollingElement);

    await renderInfiniteScroll({
      hasMore: true,
      reverse: true,
      onLoadMore: async () => undefined,
      children: "items",
    });

    expect(latestObserver?.options?.root).toBeNull();
  });

  test("falls back to the document when no ancestor scrolls", async () => {
    const scrollingElement = makeScroller({ scrollTop: 100 });
    const plain = makeScroller({ overflowY: "visible", scrollHeight: 400, clientHeight: 400 });
    stubDom([plain], scrollingElement);

    await renderInfiniteScroll({
      hasMore: true,
      reverse: true,
      onLoadMore: async () => {
        scrollingElement.scrollHeight = 1600;
      },
      children: "items",
    });

    latestObserver?.emit();
    await tick();

    expect(scrollingElement.scrollTop).toBe(700);
  });
});
