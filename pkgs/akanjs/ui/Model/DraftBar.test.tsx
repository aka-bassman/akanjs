import "../../test/registerDom";
import { beforeAll, describe, expect, mock, test } from "bun:test";
import type { ClientSignal } from "akanjs/fetch";
import { act, type ReactNode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { AgenticSurface, AgentProvider } from "use-agentic";

import type { AkanUiOverrides } from "../UiOverride";

let DraftBar: typeof import("./DraftBar").default;
let UiOverrideProvider: typeof import("../UiOverride").UiOverrideProvider;
let st: typeof import("akanjs/store").st;
let makeStore: () => void;

const slice = { refName: "draftBarItem", sliceName: "draftBarItem", argLength: 1 };
const l = Object.assign((key: string) => key, {
  _: (key: string) => key,
  rich: (key: string) => key,
  trans: (translation: Record<string, string>) => translation.en,
});
const SAVED_AT = new Date("2026-01-01T00:00:00.000Z");

/** Imported after the environment is set: `akanjs/store`'s baseSt reads the env while the module evaluates. */
beforeAll(async () => {
  process.env.AKAN_PUBLIC_APP_NAME = "draftbartest";
  process.env.AKAN_PUBLIC_REPO_NAME = "draftbartest";
  process.env.AKAN_PUBLIC_SERVE_DOMAIN = "localhost";
  process.env.AKAN_PUBLIC_ENV = "testing";
  const { Int, SLICE_META } = await import("akanjs/base");
  const { ConstantRegistry, via } = await import("akanjs/constant");
  const { registerClientRuntime } = await import("akanjs/client");
  const storeModule = await import("akanjs/store");
  const { store, StoreRegistry } = storeModule;
  st = storeModule.st;

  const Input = via((f) => ({ title: f(String) }));
  const Obj = via(Input, () => ({}));
  const Light = via(Obj, ["title"] as const, () => ({}));
  const Full = via(Obj, Light, () => ({}));
  const Insight = via(Full, (f) => ({ count: f(Int, { default: 0 }) }));
  const cnst = ConstantRegistry.buildModel("draftBarItem", Input, Obj, Full, Light, Insight, {});
  registerClientRuntime({
    usePage: () => ({ path: "/", lang: "en", l }),
    fetch: { sortKeyMap: new Map([["draftBarItem", ["latest"]]]) },
  } as never);
  const signal = {
    refName: "draftBarItem",
    _slice: { [SLICE_META]: {} },
    cnst,
    fetch: new Proxy({} as Record<string, unknown>, {
      get(target, key: string) {
        target[key] ??= mock(async () => null);
        return target[key];
      },
    }),
    serializedSignal: { prefix: "draftBarItem", endpoint: {}, slice: { "": { args: [] } } },
    slices: [],
  } as unknown as ClientSignal<"draftBarItem">;
  makeStore = () => {
    class ItemStore extends store(signal, () => ({})) {}
    StoreRegistry.register(ItemStore);
    StoreRegistry.build(StoreRegistry.merge("draftBarRoot", ItemStore));
  };
  ({ default: DraftBar } = await import("./DraftBar"));
  ({ UiOverrideProvider } = await import("../UiOverride"));
});

const mount = async (node: ReactNode) => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(<Suspense>{node}</Suspense>);
  });
  return { container, unmount: () => act(() => root.unmount()) };
};

/** The state an editor is in once a saved draft has been read: offered but not in the form. */
const setConflict = () =>
  st.set({
    draftBarItemFormDraft: {
      key: "akan.draft.draftbartest.anon.draftBarItem.new:scope-a",
      baseHash: "00000000",
      baseUpdatedAt: null,
      pending: { savedAt: SAVED_AT, form: { title: "half typed" } },
      appliedAt: null,
    },
  } as never);

describe("DraftBar", () => {
  test("renders the two draft actions under the names an agent calls them by", async () => {
    makeStore();
    const surface = new AgenticSurface();
    setConflict();
    const { container, unmount } = await mount(
      <AgentProvider surface={surface}>
        <DraftBar className="my-density-class" slice={slice} />
      </AgentProvider>,
    );
    expect(container.querySelector('[data-akan-action="restoreDraftBarItemFormDraft"]')).not.toBeNull();
    expect(container.querySelector('[data-akan-action="discardDraftBarItemFormDraft"]')).not.toBeNull();
    expect(container.querySelector(".my-density-class")).not.toBeNull();
    unmount();
  });

  test("an override takes the banner over, and the shell keeps publishing the tools", async () => {
    makeStore();
    const surface = new AgenticSurface();
    setConflict();
    const BrandDraftBar: AkanUiOverrides["DraftBar"] = ({ className, refName, state, savedAt, onDiscard }) => (
      <button type="button" className={className} data-skin="brand" data-state={state} onClick={() => onDiscard()}>
        {refName}:{savedAt.toISOString()}
      </button>
    );
    const { container, unmount } = await mount(
      <AgentProvider surface={surface}>
        <UiOverrideProvider value={{ DraftBar: BrandDraftBar }}>
          <DraftBar className="my-density-class" slice={slice} />
        </UiOverrideProvider>
      </AgentProvider>,
    );
    const brand = container.querySelector('[data-skin="brand"]');
    expect(brand?.getAttribute("data-state")).toBe("conflict");
    expect(brand?.getAttribute("class")).toBe("my-density-class");
    expect(brand?.textContent).toBe(`draftBarItem:${SAVED_AT.toISOString()}`);
    expect(surface.snapshot().tools.map((tool) => tool.name)).toContain("restoreDraftBarItemFormDraft");

    await act(async () => {
      (brand as HTMLButtonElement).click();
    });
    expect(container.querySelector('[data-skin="brand"]')).toBeNull();
    unmount();
  });
});
