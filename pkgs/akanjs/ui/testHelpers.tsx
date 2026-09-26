import { mock } from "bun:test";
import type { ClientSignal } from "akanjs/fetch";
import { act, type ReactNode, Suspense } from "react";
import { createRoot } from "react-dom/client";

/** Call before importing `akanjs/client` or `akanjs/store`: both read the env while the module evaluates. */
export const setTestEnv = (appName: string) => {
  process.env.AKAN_PUBLIC_APP_NAME = appName;
  process.env.AKAN_PUBLIC_REPO_NAME = appName;
  process.env.AKAN_PUBLIC_SERVE_DOMAIN = "localhost";
  process.env.AKAN_PUBLIC_ENV = "testing";
};

export const l = Object.assign((key: string) => key, {
  _: (key: string) => key,
  rich: (key: string) => key,
  trans: (translation: Record<string, string>) => translation.en,
});

export const mountSuspense = async (node: ReactNode) => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(<Suspense>{node}</Suspense>);
  });
  return { container, unmount: () => act(() => root.unmount()) };
};

export const waitFor = async (done: () => boolean) => {
  for (let i = 0; i < 200 && !done(); i += 1)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
};

export const rootSliceArgs = [
  { type: "search", name: "queryKey", refName: "String", nullable: true },
  { type: "search", name: "args", refName: "Any", nullable: true },
];

interface StoreMakerOptions {
  root: string;
  calls?: Record<string, ReturnType<typeof mock>>;
  sliceArgs?: unknown[];
}

/** A `title` model for `refName`, and stores over a minimal signal whose fetch answers `calls` or `null`. */
export const itemFixtureOf = async <RefName extends string>(refName: RefName) => {
  const { Int, SLICE_META } = await import("akanjs/base");
  const { ConstantRegistry, via } = await import("akanjs/constant");
  await import("akanjs/client");
  const { store, StoreRegistry } = await import("akanjs/store");
  const Input = via((f) => ({ title: f(String) }));
  const Obj = via(Input, () => ({}));
  const Light = via(Obj, ["title"] as const, () => ({}));
  const Full = via(Obj, Light, () => ({}));
  const Insight = via(Full, (f) => ({ count: f(Int, { default: 0 }) }));
  const cnst = ConstantRegistry.buildModel(refName, Input, Obj, Full, Light, Insight, {});
  const storeMaker = ({ root, calls = {}, sliceArgs = [] }: StoreMakerOptions) => {
    const signal = {
      refName,
      _slice: { [SLICE_META]: {} },
      cnst,
      fetch: new Proxy(calls, {
        get(target, key: string) {
          target[key] ??= mock(async () => null);
          return target[key];
        },
      }),
      serializedSignal: { prefix: refName, endpoint: {}, slice: { "": { args: sliceArgs } } },
      slices: [],
    } as unknown as ClientSignal<RefName>;
    return (state: Record<string, unknown> = {}) => {
      for (const call of Object.values(calls)) call.mockClear();
      class ItemStore extends store(signal, () => state) {}
      StoreRegistry.register(ItemStore);
      StoreRegistry.build(StoreRegistry.merge(root, ItemStore));
    };
  };
  return { Light, Full, Insight, storeMaker };
};
