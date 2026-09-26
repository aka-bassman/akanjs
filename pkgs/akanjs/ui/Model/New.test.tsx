import "../../test/registerDom";
import { beforeAll, describe, expect, mock, test } from "bun:test";
import type { ClientSignal } from "akanjs/fetch";
import { act } from "react";
import { AgenticSurface, AgentProvider } from "use-agentic";
import { l, mountSuspense, setTestEnv, waitFor } from "../testHelpers";

let New: typeof import("./New").default;
let makeStore: () => void;

const slice = { refName: "newTestItem", sliceName: "newTestItem", argLength: 1 };

beforeAll(async () => {
  setTestEnv("newwrappertest");
  const { Int, SLICE_META } = await import("akanjs/base");
  const { ConstantRegistry, via } = await import("akanjs/constant");
  const { registerClientRuntime } = await import("akanjs/client");
  const { store, StoreRegistry } = await import("akanjs/store");

  const Input = via((f) => ({ title: f(String) }));
  const Obj = via(Input, () => ({}));
  const Light = via(Obj, ["title"] as const, () => ({}));
  const Full = via(Obj, Light, () => ({}));
  const Insight = via(Full, (f) => ({ count: f(Int, { default: 0 }) }));
  const cnst = ConstantRegistry.buildModel("newTestItem", Input, Obj, Full, Light, Insight, {});
  registerClientRuntime({
    usePage: () => ({ path: "/", lang: "en", l }),
    fetch: { sortKeyMap: new Map([["newTestItem", ["latest"]]]) },
  } as never);
  const signal = {
    refName: "newTestItem",
    _slice: { [SLICE_META]: {} },
    cnst,
    fetch: new Proxy({} as Record<string, unknown>, {
      get(target, key: string) {
        target[key] ??= mock(async () => null);
        return target[key];
      },
    }),
    serializedSignal: { prefix: "newTestItem", endpoint: {}, slice: { "": { args: [] } } },
    slices: [],
  } as unknown as ClientSignal<"newTestItem">;
  makeStore = () => {
    class ItemStore extends store(signal, () => ({})) {}
    StoreRegistry.register(ItemStore);
    StoreRegistry.build(StoreRegistry.merge("newWrapperRoot", ItemStore));
  };
  ({ default: New } = await import("./New"));
});

describe("Model.New", () => {
  test("publishes the create trigger, and the editor's verbs once the form it opens is on screen", async () => {
    makeStore();
    const surface = new AgenticSurface();
    const { container, unmount } = await mountSuspense(
      <AgentProvider surface={surface}>
        <New slice={slice}>
          <div>form</div>
        </New>
      </AgentProvider>,
    );
    const names = () => surface.snapshot().tools.map((tool) => tool.name);
    await waitFor(() => names().includes("newNewTestItem"));

    expect(container.querySelector('[data-akan-action="newNewTestItem"]')).not.toBeNull();
    expect(names()).not.toContain("submitNewTestItem");

    await act(async () => {
      await surface.call("newNewTestItem", {});
    });
    await waitFor(() => names().includes("submitNewTestItem"));
    expect(names()).toContain("cancelEditOfNewTestItem");
    expect(names()).toContain("fillNewTestItemForm");

    await act(async () => {
      await surface.call("cancelEditOfNewTestItem", {});
    });
    await waitFor(() => !names().includes("submitNewTestItem"));
    expect(names()).not.toContain("submitNewTestItem");
    unmount();
  });

  test("suffixes the tool name so a second create trigger on one screen is reachable too", async () => {
    makeStore();
    const surface = new AgenticSurface();
    const { unmount } = await mountSuspense(
      <AgentProvider surface={surface}>
        <New slice={slice} namespace="draft">
          <div>form</div>
        </New>
      </AgentProvider>,
    );
    const names = () => surface.snapshot().tools.map((tool) => tool.name);
    await waitFor(() => names().includes("newNewTestItemInDraft"));

    expect(names()).toContain("newNewTestItemInDraft");
    expect(names()).not.toContain("newNewTestItem");
    unmount();
  });
});
