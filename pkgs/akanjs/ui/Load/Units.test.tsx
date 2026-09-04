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
  const { store, StoreRegistry } = await import("akanjs/store");

  const Input = via((f) => ({ title: f(String) }));
  const Obj = via(Input, () => ({}));
  const Light = via(Obj, ["title"] as const, () => ({}));
  const Full = via(Obj, Light, () => ({}));
  const Insight = via(Full, (f) => ({ count: f(Int, { default: 0 }) }));
  const cnst = ConstantRegistry.buildModel("loadTestItem", Input, Obj, Full, Light, Insight, {});
  calls = {
    loadTestItemList: mock(async () => [new Light({ id: "aaaaaaaaaaaaaaaaaaaaaaaa", title: "Ada" })]),
    loadTestItemInsight: mock(async () => new Insight({ count: 1 })),
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

const serverInit = ({ insight = true }: { insight?: boolean } = {}): ServerInit<"loadTestItem", Item> => ({
  refName: "loadTestItem",
  sliceName: "loadTestItem",
  argLength: 0,
  loadTestItemObjList: [{ id: "aaaaaaaaaaaaaaaaaaaaaaaa", title: "Ada" }],
  loadTestItemObjInsight: insight ? { count: 1 } : null,
  pageOfLoadTestItem: 1,
  lastPageOfLoadTestItem: 1,
  limitOfLoadTestItem: 0,
  queryArgsOfLoadTestItem: [],
  sortOfLoadTestItem: "latest",
  loadTestItemInitAt: new Date(),
});

const serverView = (): ServerView<"loadTestItem", Item> => ({
  refName: "loadTestItem",
  loadTestItemObj: { id: "aaaaaaaaaaaaaaaaaaaaaaaa", title: "Ada" },
  loadTestItemViewAt: new Date(),
});

const wrap = (node: ReactNode) => (
  <AgentProvider surface={new AgenticSurface()}>
    <Suspense>{node}</Suspense>
  </AgentProvider>
);

const handleOf = (container: HTMLElement, root: ReturnType<typeof createRoot>) => ({
  container,
  flush: async () => {
    await act(async () => {});
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
  act(() => root.render(wrap(node)));
  return handleOf(container, root);
};

/** A suspending first render has to settle inside an awaited `act`, or React warns and commits nothing. */
const mountAsync = async (node: ReactNode) => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(wrap(node));
  });
  return handleOf(container, root);
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
});
