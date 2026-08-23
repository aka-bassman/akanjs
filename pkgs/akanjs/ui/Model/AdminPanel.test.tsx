import "../../test/registerDom";
import { beforeAll, describe, expect, mock, test } from "bun:test";
import type { ClientSignal } from "akanjs/fetch";
import { act, type ReactNode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { AgenticSurface, AgentProvider } from "use-agentic";

let AdminPanel: typeof import("./AdminPanel").default;
let makeStore: (state?: Record<string, unknown>) => void;
let calls: Record<string, ReturnType<typeof mock>>;

const slice = { refName: "adminTestItem", sliceName: "adminTestItem", argLength: 1 };
const components = { Template: {}, Unit: {}, View: {} };
const l = Object.assign((key: string) => key, {
  _: (key: string) => key,
  rich: (key: string) => key,
  trans: (translation: Record<string, string>) => translation.en,
});

/** Imported after the environment is set: `akanjs/store`'s baseSt reads the env while the module evaluates. */
beforeAll(async () => {
  process.env.AKAN_PUBLIC_APP_NAME = "adminpaneltest";
  process.env.AKAN_PUBLIC_REPO_NAME = "adminpaneltest";
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
  const cnst = ConstantRegistry.buildModel("adminTestItem", Input, Obj, Full, Light, Insight, {});
  calls = {
    adminTestItemList: mock(async () => [new Light({ id: "aaaaaaaaaaaaaaaaaaaaaaaa", title: "Ada" })]),
    adminTestItemInsight: mock(async () => new Insight({ count: 1 })),
  };
  const signalFetch = new Proxy(calls, {
    get(target, key: string) {
      target[key] ??= mock(async () => null);
      return target[key];
    },
  });
  registerClientRuntime({
    usePage: () => ({ path: "/", lang: "en", l }),
    fetch: { sortKeyMap: new Map([["adminTestItem", ["latest", "oldest", "titleAsc"]]]) },
  } as never);
  const signal = {
    refName: "adminTestItem",
    _slice: { [SLICE_META]: {} },
    cnst,
    fetch: signalFetch,
    serializedSignal: {
      prefix: "adminTestItem",
      endpoint: {},
      slice: { "": { args: [{ type: "search", name: "query", refName: "Any", nullable: true }] } },
    },
    slices: [],
  } as unknown as ClientSignal<"adminTestItem">;
  makeStore = (state: Record<string, unknown> = {}) => {
    for (const call of Object.values(calls)) call.mockClear();
    class ItemStore extends store(signal, () => state) {}
    StoreRegistry.register(ItemStore);
    StoreRegistry.build(StoreRegistry.merge("adminPanelRoot", ItemStore));
  };
  ({ default: AdminPanel } = await import("./AdminPanel"));
});

/** The Data barrel is a React.lazy over a real dynamic import, so the first paint is the suspense fallback. */
const waitFor = async (done: () => boolean) => {
  for (let i = 0; i < 200 && !done(); i += 1)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
};

const mount = async (node: ReactNode, ready: () => boolean) => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(<Suspense>{node}</Suspense>);
  });
  await waitFor(ready);
  return { container, unmount: () => act(() => root.unmount()) };
};

describe("Model.AdminPanel", () => {
  test("renders the list chrome on a store that has no app-level summary state", async () => {
    makeStore();
    const { container, unmount } = await mount(
      <AdminPanel slice={slice} components={components} />,
      () => calls.adminTestItemList.mock.calls.length > 0,
    );

    expect(container.textContent).toContain("Admin Test Item");
    // The dashboard reads `summary`, which only an app store declares — a panel without one still renders.
    expect(container.querySelector("[data-akan-error]")).toBeNull();
    expect(calls.adminTestItemList).toHaveBeenCalled();
    unmount();
  });

  test("fills every slice argument before the init form so the query is not read as the form", async () => {
    makeStore();
    const { unmount } = await mount(
      <AdminPanel slice={slice} components={components} query={{ title: "Ada" }} init={{ limit: 50 }} />,
      () => calls.adminTestItemList.mock.calls.length > 0,
    );

    expect(calls.adminTestItemList).toHaveBeenCalledWith({ title: "Ada" }, 0, 50, "latest", expect.any(Object));
    unmount();
  });

  test("offers every sort key the model's serialized signal carries", async () => {
    makeStore();
    const { container, unmount } = await mount(
      <AdminPanel slice={slice} components={components} />,
      () => calls.adminTestItemList.mock.calls.length > 0,
    );

    // Read off the document, not the panel: the sort Select portals its options to `document.body` so no
    // overflow ancestor clips them, and only the field itself is left inside the container.
    expect(container.textContent ?? "").toContain("Latest");
    expect(document.body.textContent ?? "").toContain("Title Asc");
    unmount();
  });

  test("publishes every toolbar control it draws, and withholds the name of one it does not", async () => {
    makeStore();
    const surface = new AgenticSurface();
    const { container, unmount } = await mount(
      <AgentProvider surface={surface}>
        <AdminPanel slice={slice} components={components} />
      </AgentProvider>,
      () => calls.adminTestItemList.mock.calls.length > 0,
    );

    // The same names reach `readScreen`, so the agent can tie a control it reads to the tool that works it.
    expect(container.querySelector('[data-akan-action="refreshAdminTestItem"]')).not.toBeNull();
    expect(container.querySelector('[data-akan-action="setSortOfAdminTestItem"]')).not.toBeNull();
    const tools = surface.snapshot().tools;
    expect(tools.map((tool) => tool.name).sort()).toEqual([
      "exportCsvOfAdminTestItem",
      "exportJsonOfAdminTestItem",
      "refreshAdminTestItem",
      "removeAdminTestItem",
      "setLimitOfAdminTestItem",
      "setSortOfAdminTestItem",
      "setViewOfAdminTestItem",
    ]);
    // No Template and no View component, so the panel draws neither editor nor detail and neither is published —
    // the row's remove button is the one action it does draw.
    expect(tools.some((tool) => tool.name.endsWith("AdminTestItem") && tool.name.startsWith("edit"))).toBe(false);
    // Row tools take an id, and this is where an agent reads one.
    expect(surface.read("adminTestItem.items")).toEqual({
      total: 1,
      items: [{ id: "aaaaaaaaaaaaaaaaaaaaaaaa", label: "Ada" }],
    });
    const sort = tools.find((tool) => tool.name === "setSortOfAdminTestItem");
    const sortProperties = sort?.parameters?.properties as { sortKey?: unknown } | undefined;
    expect(sortProperties?.sortKey).toEqual({ type: "string", enum: ["latest", "oldest", "titleAsc"] });
    await expect(surface.call("setLimitOfAdminTestItem", { limit: 33 })).rejects.toThrow(
      'Argument "limit" of setLimitOfAdminTestItem must be one of: 10, 20, 50, 100.',
    );
    unmount();
  });

  test("publishes the editor verbs once a template gives the panel a form to draw", async () => {
    makeStore();
    const surface = new AgenticSurface();
    const { unmount } = await mount(
      <AgentProvider surface={surface}>
        <AdminPanel slice={slice} components={{ ...components, Template: { General: () => null } }} />
      </AgentProvider>,
      () => calls.adminTestItemList.mock.calls.length > 0,
    );

    const names = () => surface.snapshot().tools.map((tool) => tool.name);
    expect(names()).toContain("newAdminTestItem");
    expect(names()).toContain("editAdminTestItem");
    // The editor owns its own verbs, and no editor is on screen until one is opened.
    expect(names()).not.toContain("submitAdminTestItem");
    expect(names()).not.toContain("cancelEditOfAdminTestItem");
    // Still no View component, so the detail verbs stay unpublished.
    expect(names()).not.toContain("viewAdminTestItem");
    expect(names()).not.toContain("closeViewOfAdminTestItem");

    await act(async () => {
      await surface.call("newAdminTestItem", {});
    });
    await waitFor(() => names().includes("submitAdminTestItem"));
    expect(names()).toContain("submitAdminTestItem");
    expect(names()).toContain("cancelEditOfAdminTestItem");
    unmount();
  });

  test("renders summary tiles from the app summary state, and links only the columns the query map names", async () => {
    makeStore({ summary: { totalItem: 7, pendingItem: 2 }, summaryLoading: false });
    const { container, unmount } = await mount(
      <AdminPanel
        slice={slice}
        components={components}
        summaryColumns={["totalItem", "pendingItem"]}
        queryMap={{ totalItem: {} }}
      />,
      () => calls.adminTestItemList.mock.calls.length > 0,
    );

    expect(container.textContent).toContain("Total Item");
    expect(container.textContent).toContain("7");
    // A csr Link renders an anchor with no href, so the tag is what says whether the tile navigates.
    const tileOf = (label: string) =>
      [...container.querySelectorAll("span")].find((span) => span.textContent === label)?.parentElement;
    expect(tileOf("Total Item")?.tagName).toBe("A");
    expect(tileOf("Pending Item")?.tagName).toBe("DIV");
    unmount();
  });
});
