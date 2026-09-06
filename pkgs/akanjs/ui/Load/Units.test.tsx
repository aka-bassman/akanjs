import "../../test/registerDom";
import { beforeAll, describe, expect, mock, test } from "bun:test";
import type { ClientSignal, ServerInit, ServerView } from "akanjs/fetch";
import { act, type ReactNode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { AgenticSurface, AgentProvider } from "use-agentic";

let Units: typeof import("./Units").default;
let View: typeof import("./View").default;
let makeStore: (state?: Record<string, unknown>) => void;
let calls: Record<string, ReturnType<typeof mock>>;
let sliceState: { get: () => Record<string, unknown>; set: (state: Record<string, unknown>) => void };

const l = Object.assign((key: string) => key, {
  _: (key: string) => key,
  rich: (key: string) => key,
  trans: (translation: Record<string, string>) => translation.en,
});

/** Imported after the environment is set: `akanjs/store`'s baseSt reads the env while the module evaluates. */
beforeAll(async () => {
  process.env.AKAN_PUBLIC_APP_NAME = "loadtest";
  process.env.AKAN_PUBLIC_REPO_NAME = "loadtest";
  process.env.AKAN_PUBLIC_SERVE_DOMAIN = "localhost";
  process.env.AKAN_PUBLIC_ENV = "testing";
  const { Int, SLICE_META } = await import("akanjs/base");
  const { ConstantRegistry, via } = await import("akanjs/constant");
  const { registerClientRuntime } = await import("akanjs/client");
  const { st, store, StoreRegistry } = await import("akanjs/store");
  sliceState = st as unknown as typeof sliceState;

  const Input = via((f) => ({ title: f(String) }));
  const Obj = via(Input, () => ({}));
  const Light = via(Obj, ["title"] as const, () => ({}));
  const Full = via(Obj, Light, () => ({}));
  const Insight = via(Full, (f) => ({ count: f(Int, { default: 0 }) }));
  const cnst = ConstantRegistry.buildModel("loadTestItem", Input, Obj, Full, Light, Insight, {});
  calls = {
    loadTestItemList: mock(async () => [new Light({ id: "aaaaaaaaaaaaaaaaaaaaaaaa", title: "Ada" })]),
    loadTestItemInsight: mock(async () => new Insight({ count: 1 })),
    loadTestItem: mock(async (id: string) => new Full({ id, title: "Fresh" })),
  };
  const signalFetch = new Proxy(calls, {
    get(target, key: string) {
      target[key] ??= mock(async () => null);
      return target[key];
    },
  });
  registerClientRuntime({
    usePage: () => ({ path: "/", lang: "en", l }),
    fetch: { sortKeyMap: new Map([["loadTestItem", ["latest"]]]), filterQueryMap: new Map([["loadTestItem", {}]]) },
  } as never);
  const signal = {
    refName: "loadTestItem",
    _slice: { [SLICE_META]: {} },
    cnst,
    fetch: signalFetch,
    serializedSignal: { prefix: "loadTestItem", endpoint: {}, slice: { "": { args: [] } } },
    slices: [],
  } as unknown as ClientSignal<"loadTestItem">;
  makeStore = (state: Record<string, unknown> = {}) => {
    for (const call of Object.values(calls)) call.mockClear();
    class ItemStore extends store(signal, () => state) {}
    StoreRegistry.register(ItemStore);
    StoreRegistry.build(StoreRegistry.merge("loadRoot", ItemStore));
  };
  ({ default: Units } = await import("./Units"));
  ({ default: View } = await import("./View"));
});

interface Item {
  id: string;
  title: string;
}

interface InitOptions {
  insight?: boolean;
  args?: unknown[];
  id?: string;
  title?: string;
  initAt?: Date;
}

const serverInit = ({
  insight = true,
  args = [],
  id = "aaaaaaaaaaaaaaaaaaaaaaaa",
  title = "Ada",
  initAt = new Date(),
}: InitOptions = {}): ServerInit<"loadTestItem", Item> => ({
  refName: "loadTestItem",
  sliceName: "loadTestItem",
  argLength: args.length,
  loadTestItemObjList: [{ id, title }],
  loadTestItemObjInsight: insight ? { count: 1 } : null,
  pageOfLoadTestItem: 1,
  lastPageOfLoadTestItem: 1,
  limitOfLoadTestItem: 0,
  queryArgsOfLoadTestItem: args,
  sortOfLoadTestItem: "latest",
  loadTestItemInitAt: initAt,
});

interface ViewOptions {
  id?: string;
  title?: string;
  viewAt?: Date;
}

const serverView = ({
  id = "aaaaaaaaaaaaaaaaaaaaaaaa",
  title = "Ada",
  viewAt = new Date(),
}: ViewOptions = {}): ServerView<"loadTestItem", Item> => ({
  refName: "loadTestItem",
  loadTestItemObj: { id, title },
  loadTestItemViewAt: viewAt,
});

const wrap = (node: ReactNode, surface: AgenticSurface) => (
  <AgentProvider surface={surface}>
    <Suspense>{node}</Suspense>
  </AgentProvider>
);

const handleOf = (container: HTMLElement, root: ReturnType<typeof createRoot>, surface: AgenticSurface) => ({
  container,
  flush: async () => {
    await act(async () => {});
  },
  /** Same root, same surface, same element position — so React updates the mounted instance instead of remounting it. */
  rerender: async (node: ReactNode) => {
    await act(async () => {
      root.render(wrap(node, surface));
    });
  },
  unmount: async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  },
});

/** Synchronous, so a fallback that appeared and was replaced within one flush would still fail the assertion. */
const mount = (node: ReactNode) => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const surface = new AgenticSurface();
  act(() => root.render(wrap(node, surface)));
  return handleOf(container, root, surface);
};

/** A suspending first render has to settle inside an awaited `act`, or React warns and commits nothing. */
const mountAsync = async (node: ReactNode) => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const surface = new AgenticSurface();
  await act(async () => {
    root.render(wrap(node, surface));
  });
  return handleOf(container, root, surface);
};

describe("Load.Units", () => {
  test("renders an awaited init in the first commit, with no fallback", async () => {
    makeStore();
    const { container, unmount } = mount(
      <Units<"loadTestItem", Item> init={serverInit()} renderItem={(item: Item) => <span>{item.title}</span>} />,
    );
    expect(container.textContent).toContain("Ada");
    await unmount();
  });

  test("renders the fallback for an unawaited init, then the items", async () => {
    makeStore();
    let release!: (value: ReturnType<typeof serverInit>) => void;
    const held = new Promise<ReturnType<typeof serverInit>>((resolve) => {
      release = resolve;
    });
    const { container, flush, unmount } = await mountAsync(
      <Units<"loadTestItem", Item>
        init={held}
        loading={<span>loading-units</span>}
        renderItem={(item: Item) => <span>{item.title}</span>}
      />,
    );
    expect(container.textContent).toBe("loading-units");

    release(serverInit());
    await flush();
    expect(container.textContent).toContain("Ada");
    await unmount();
  });

  test("renders an init whose caller opted out of the insight", async () => {
    makeStore();
    const { container, unmount } = mount(
      <Units init={serverInit({ insight: false })} renderItem={(item: Item) => <span>{item.title}</span>} />,
    );
    expect(container.textContent).toContain("Ada");
    await unmount();
  });

  test("rehydrates when a route change hands the mounted instance an init with different query args", async () => {
    makeStore();
    const renderItem = (item: Item) => <span>{item.title}</span>;
    const { container, rerender, unmount } = mount(
      <Units<"loadTestItem", Item> init={serverInit({ args: ["a"] })} renderItem={renderItem} />,
    );
    expect(container.textContent).toContain("Ada");

    await rerender(
      <Units<"loadTestItem", Item>
        init={serverInit({ args: ["b"], id: "bbbbbbbbbbbbbbbbbbbbbbbb", title: "Grace" })}
        renderItem={renderItem}
      />,
    );
    expect(container.textContent).toContain("Grace");
    expect(container.textContent).not.toContain("Ada");
    await unmount();
  });

  test("keeps client-side slice state when the same query args arrive again", async () => {
    makeStore();
    const renderItem = (item: Item) => <span>{item.title}</span>;
    const { container, rerender, unmount } = mount(
      <Units<"loadTestItem", Item> init={serverInit({ args: ["a"] })} renderItem={renderItem} />,
    );
    await act(async () => {
      sliceState.set({ pageOfLoadTestItem: 3 });
    });

    await rerender(<Units<"loadTestItem", Item> init={serverInit({ args: ["a"] })} renderItem={renderItem} />);
    expect(sliceState.get().pageOfLoadTestItem).toBe(3);
    expect(container.textContent).toContain("Ada");
    await unmount();
  });

  /** The RSC navigation cache replays the payload a route was first rendered with, mutation or no mutation. */
  test("refetches when it re-hydrates from a payload older than the last local write", async () => {
    makeStore();
    const renderItem = (item: Item) => <span>{item.title}</span>;
    const cachedInit = serverInit({ args: ["a"], initAt: new Date(Date.now() - 1000) });
    const { rerender, flush, unmount } = mount(
      <Units<"loadTestItem", Item> init={cachedInit} renderItem={renderItem} />,
    );
    expect(calls.loadTestItemList).not.toHaveBeenCalled();

    await act(async () => {
      sliceState.set({ loadTestItemStaleAt: new Date() });
    });
    await rerender(
      <Units<"loadTestItem", Item>
        init={serverInit({ args: ["b"], id: "bbbbbbbbbbbbbbbbbbbbbbbb", title: "Grace" })}
        renderItem={renderItem}
      />,
    );
    expect(calls.loadTestItemList).not.toHaveBeenCalled();

    await rerender(<Units<"loadTestItem", Item> init={cachedInit} renderItem={renderItem} />);
    await flush();
    expect(calls.loadTestItemList).toHaveBeenCalled();
    await unmount();
  });
});

describe("Load.View", () => {
  test("renders an awaited view in the first commit", async () => {
    makeStore();
    const { container, unmount } = mount(
      <View<"loadTestItem", Item> view={serverView()} renderView={(item: Item) => <span>{item.title}</span>} />,
    );
    expect(container.textContent).toContain("Ada");
    await unmount();
  });

  test("renders the fallback for an unawaited view, then the model", async () => {
    makeStore();
    let release!: (value: ReturnType<typeof serverView>) => void;
    const held = new Promise<ReturnType<typeof serverView>>((resolve) => {
      release = resolve;
    });
    const { container, flush, unmount } = await mountAsync(
      <View<"loadTestItem", Item>
        view={held}
        loading={<span>loading-view</span>}
        renderView={(item: Item) => <span>{item.title}</span>}
      />,
    );
    expect(container.textContent).toBe("loading-view");

    release(serverView());
    await flush();
    expect(container.textContent).toContain("Ada");
    await unmount();
  });

  test("refetches when it re-hydrates from a view payload older than the last local write", async () => {
    makeStore();
    const renderView = (item: Item) => <span>{item.title}</span>;
    const cachedView = serverView({ viewAt: new Date(Date.now() - 1000) });
    const { container, rerender, flush, unmount } = mount(
      <View<"loadTestItem", Item> view={cachedView} renderView={renderView} />,
    );
    expect(calls.loadTestItem).not.toHaveBeenCalled();

    await act(async () => {
      sliceState.set({ loadTestItemStaleAt: new Date() });
    });
    await rerender(
      <View<"loadTestItem", Item>
        view={serverView({ id: "bbbbbbbbbbbbbbbbbbbbbbbb", title: "Grace" })}
        renderView={renderView}
      />,
    );
    expect(calls.loadTestItem).not.toHaveBeenCalled();

    await rerender(<View<"loadTestItem", Item> view={cachedView} renderView={renderView} />);
    await flush();
    expect(calls.loadTestItem).toHaveBeenCalled();
    expect(container.textContent).toContain("Fresh");
    await unmount();
  });
});
