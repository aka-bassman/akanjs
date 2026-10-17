import "../../test/registerDom";
import { beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { DataList } from "akanjs/base";
import { act, useState } from "react";
import { mountAsync, setTestEnv } from "../testHelpers.fixture";

interface Row {
  id: string;
  name: string;
}

const slice = { refName: "relFieldItem", sliceName: "relFieldItemInOwner", argLength: 1 };
const refreshes: unknown[] = [];
const lightCalls: string[] = [];
const lightRows = new Map<string, Row>();
const listCalls: unknown[][] = [];
let listed: Row[] = [];
let windowed: Row[] = [];

let Field: typeof import("./Relation");
let LightRefCache: typeof import("./lightRefCache").LightRefCache;
let seed: (rows: Row[]) => void;
let storeState: () => Record<string, unknown>;
let setStore: (state: Record<string, unknown>) => void;

beforeAll(async () => {
  setTestEnv("relationtest");
  const { registerClientRuntime } = await import("akanjs/client");
  registerClientRuntime({
    usePage: () => ({ path: "/", lang: "en", l: Object.assign((key: string) => key, { _: (key: string) => key }) }),
    fetch: {
      sortKeyMap: new Map(),
      lightRelFieldItem: (id: string) => {
        lightCalls.push(id);
        const row = lightRows.get(id);
        return row ? Promise.resolve(row) : Promise.reject(new Error("relFieldItem.error.notFound"));
      },
      relFieldItemListInOwner: (...args: unknown[]) => {
        listCalls.push(args);
        return Promise.resolve(windowed);
      },
    },
  } as never);

  const { store, StoreRegistry } = await import("akanjs/store");
  seed = (rows) => {
    act(() => StoreRegistry.instance.set({ relFieldItemListInOwner: new DataList<Row>(rows) }));
  };
  storeState = () => StoreRegistry.instance.get();
  setStore = (state) => {
    act(() => StoreRegistry.instance.set(state));
  };
  class RelFieldStore extends store("relField" as const, () => ({
    relFieldItemListInOwner: new DataList<Row>([]),
    relFieldItemListLoadingInOwner: false,
    queryArgsOfRelFieldItemInOwner: [] as unknown[],
    limitOfRelFieldItemInOwner: 20,
    sortOfRelFieldItemInOwner: "latest",
  })) {
    refreshRelFieldItemInOwner(form: unknown) {
      refreshes.push(form);
      this.set({ relFieldItemListInOwner: new DataList<Row>(listed) });
    }
  }
  StoreRegistry.register(RelFieldStore);
  StoreRegistry.build(StoreRegistry.merge("relFieldRoot", RelFieldStore));

  Field = await import("./Relation");
  ({ LightRefCache } = await import("./lightRefCache"));
});

beforeEach(async () => {
  // Drains a read the previous test left in flight: `reset` forgets the answers, not the promises carrying them.
  await new Promise((resolve) => setTimeout(resolve, 0));
  seed([]);
  setStore({ queryArgsOfRelFieldItemInOwner: [], limitOfRelFieldItemInOwner: 20, sortOfRelFieldItemInOwner: "latest" });
  refreshes.length = 0;
  lightCalls.length = 0;
  listCalls.length = 0;
  lightRows.clear();
  listed = [];
  windowed = [];
  LightRefCache.reset();
});

/** Lets the id read settle: the row lands in a promise callback, and the subscription re-renders from there. */
const settle = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};

const triggerOf = (container: HTMLElement) => container.querySelector("[role=combobox]") as HTMLElement;
const panelOf = () => [...document.body.querySelectorAll(":scope > [data-open]")].at(-1);
const rowsOf = () => [...(panelOf()?.querySelectorAll(":scope > .group") ?? [])].map((el) => el.textContent);
const click = async (el: Element | undefined) => {
  await act(async () => {
    el?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
};

describe("Field.Parent", () => {
  test("renders the row it holds before the option list has loaded", async () => {
    const { container, unmount } = await mountAsync(
      <Field.Parent<Row>
        slice={slice}
        value={{ id: "item-1", name: "Acme" }}
        onChange={() => undefined}
        renderOption={(model) => model.name}
      />,
    );
    expect(triggerOf(container).textContent).toContain("Acme");
    expect(rowsOf()).toEqual(["Acme"]);
    expect(lightCalls).toEqual([]);
    unmount();
  });

  test("keeps the list's own copy of a row it also holds", async () => {
    listed = [{ id: "item-1", name: "Acme Corp" }];
    const { container, unmount } = await mountAsync(
      <Field.Parent<Row>
        slice={slice}
        value={{ id: "item-1", name: "Acme" }}
        onChange={() => undefined}
        renderOption={(model) => model.name}
      />,
    );
    await click(triggerOf(container));
    expect(rowsOf()).toEqual(["Acme Corp"]);
    unmount();
  });

  test("opens on the store's own list rather than invalidating it", async () => {
    const { container, unmount } = await mountAsync(
      <Field.Parent<Row> slice={slice} value={null} onChange={() => undefined} renderOption={(m) => m.name} />,
    );
    await click(triggerOf(container));
    expect(refreshes).toEqual([{ invalidate: false, queryArgs: undefined }]);
    unmount();
  });
});

describe("Field.ParentId", () => {
  test("reads the row by id and renders what it reads", async () => {
    lightRows.set("item-1", { id: "item-1", name: "Acme" });
    const { container, unmount } = await mountAsync(
      <Field.ParentId<Row> slice={slice} value="item-1" onChange={() => undefined} />,
    );
    await settle();
    expect(triggerOf(container).textContent).toContain("Acme");
    expect(lightCalls).toEqual(["item-1"]);
    unmount();
  });

  test("labels the option from the row when no renderer says otherwise", async () => {
    lightRows.set("item-1", { id: "item-1", name: "Acme" });
    const { container, unmount } = await mountAsync(
      <Field.ParentId<Row> slice={slice} value="item-1" onChange={() => undefined} />,
    );
    await settle();
    await click(triggerOf(container));
    expect(rowsOf()).toEqual(["Acme"]);
    unmount();
  });

  test("shows the id when the row cannot be read, and reads it once", async () => {
    const first = await mountAsync(<Field.ParentId<Row> slice={slice} value="gone" onChange={() => undefined} />);
    await settle();
    expect(triggerOf(first.container).textContent).toContain("gone");
    first.unmount();

    const second = await mountAsync(<Field.ParentId<Row> slice={slice} value="gone" onChange={() => undefined} />);
    await settle();
    expect(triggerOf(second.container).textContent).toContain("gone");
    expect(lightCalls).toEqual(["gone"]);
    second.unmount();
  });

  test("leaves a row the list already carries alone", async () => {
    seed([{ id: "item-1", name: "Acme" }]);
    const { container, unmount } = await mountAsync(
      <Field.ParentId<Row> slice={slice} value="item-1" onChange={() => undefined} />,
    );
    await settle();
    expect(triggerOf(container).textContent).toContain("Acme");
    expect(lightCalls).toEqual([]);
    unmount();
  });
});

describe("Field.Children", () => {
  test("renders every row it holds before the option list has loaded", async () => {
    const { container, unmount } = await mountAsync(
      <Field.Children<Row>
        slice={slice}
        value={[
          { id: "item-1", name: "Acme" },
          { id: "item-2", name: "Globex" },
        ]}
        onChange={() => undefined}
        renderOption={(model) => model.name}
      />,
    );
    expect(triggerOf(container).textContent).toContain("Acme");
    expect(triggerOf(container).textContent).toContain("Globex");
    unmount();
  });
});

describe("Field.ChildrenId", () => {
  test("reads every id it holds", async () => {
    lightRows.set("item-1", { id: "item-1", name: "Acme" });
    lightRows.set("item-2", { id: "item-2", name: "Globex" });
    const { container, unmount } = await mountAsync(
      <Field.ChildrenId<Row>
        slice={slice}
        value={["item-1", "item-2"]}
        onChange={() => undefined}
        renderOption={(model) => model.name}
      />,
    );
    await settle();
    expect(triggerOf(container).textContent).toContain("Acme");
    expect(triggerOf(container).textContent).toContain("Globex");
    expect(lightCalls).toEqual(["item-1", "item-2"]);
    unmount();
  });
});

describe("an own option window", () => {
  test("loads its window by limit and sort and leaves the store's list as the page holds it", async () => {
    seed([{ id: "page-1", name: "On the page" }]);
    windowed = [
      { id: "item-1", name: "Acme" },
      { id: "item-2", name: "Globex" },
    ];
    const { container, unmount } = await mountAsync(
      <Field.ParentId<Row>
        slice={slice}
        initArgs={["owner-1"]}
        limit={500}
        sort="latestLoginAt"
        value={null}
        onChange={() => undefined}
        renderOption={(model) => model.name}
      />,
    );
    await click(triggerOf(container));
    await settle();
    expect(listCalls).toEqual([["owner-1", 0, 500, "latestLoginAt"]]);
    expect(refreshes).toEqual([]);
    expect(rowsOf()).toEqual(["Acme", "Globex"]);
    const state = storeState();
    expect((state.relFieldItemListInOwner as DataList<Row>).map((row) => row.id)).toEqual(["page-1"]);
    expect(state.limitOfRelFieldItemInOwner).toBe(20);
    expect(state.sortOfRelFieldItemInOwner).toBe("latest");
    unmount();
  });

  test("takes the store's sort and trailing query args for what it omits", async () => {
    setStore({ queryArgsOfRelFieldItemInOwner: ["owner-9"], sortOfRelFieldItemInOwner: "oldest" });
    const { container, unmount } = await mountAsync(
      <Field.ParentId<Row> slice={slice} limit={500} value={null} onChange={() => undefined} />,
    );
    await click(triggerOf(container));
    await settle();
    expect(listCalls).toEqual([["owner-9", 0, 500, "oldest"]]);
    unmount();
  });

  test("asks again only when the window changes", async () => {
    let setLimit: (limit: number) => void = () => undefined;
    const Harness = () => {
      const [limit, set] = useState(500);
      setLimit = set;
      return <Field.ParentId<Row> slice={slice} limit={limit} value={null} onChange={() => undefined} />;
    };
    const { container, unmount } = await mountAsync(<Harness />);
    await click(triggerOf(container));
    await settle();
    await click(triggerOf(container));
    await click(triggerOf(container));
    await settle();
    expect(listCalls).toEqual([[undefined, 0, 500, "latest"]]);

    act(() => setLimit(100));
    await click(triggerOf(container));
    await click(triggerOf(container));
    await settle();
    expect(listCalls).toEqual([
      [undefined, 0, 500, "latest"],
      [undefined, 0, 100, "latest"],
    ]);
    unmount();
  });

  test("keeps a held id the window does not carry", async () => {
    windowed = [{ id: "item-1", name: "Acme" }];
    lightRows.set("item-9", { id: "item-9", name: "Initech" });
    const { container, unmount } = await mountAsync(
      <Field.ParentId<Row>
        slice={slice}
        limit={1}
        value="item-9"
        onChange={() => undefined}
        renderOption={(model) => model.name}
      />,
    );
    await settle();
    await click(triggerOf(container));
    await settle();
    expect(triggerOf(container).textContent).toContain("Initech");
    expect(rowsOf()).toEqual(["Acme", "Initech"]);
    expect(lightCalls).toEqual(["item-9"]);
    unmount();
  });
});
