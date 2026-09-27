import "../../test/registerDom";
import { beforeAll, describe, expect, mock, test } from "bun:test";
import type { SerializedArg } from "akanjs/signal";
import { act } from "react";
import { itemFixtureOf, l, mountSuspense, rootSliceArgs, setTestEnv } from "../testHelpers.fixture";

let QueryMaker: typeof import("./QueryMaker").default;
let makeStore: () => void;
let calls: Record<string, ReturnType<typeof mock>>;
let ownerRows: { id: string; nickname: string }[];

// ObjectId-shaped, because building a Light row validates its id.
const adaId = "6650000000000000000000a1";
const linusId = "6650000000000000000000b2";

const slice = { refName: "queryMakerTestItem", sliceName: "queryMakerTestItem", argLength: 2 };
const filterQuery = {
  any: [],
  byTitle: [{ type: "search", name: "title", refName: "String" }],
  byAuthor: [{ type: "search", name: "authorId", refName: "ID", modelType: "object" }],
  byOwner: [{ type: "search", name: "ownerId", refName: "ID", ref: "queryMakerTestOwner" }],
};
const ownerFilterQuery = {
  any: [],
  byManager: [{ type: "search", name: "managerId", refName: "ID", ref: "queryMakerTestOwner" }],
};

/** The options portal out of the maker, so a pick is a click on the panel React mounted on `document.body`. */
const pickOption = async (label: string) => {
  // The option's own row carries the click handler; its `.group` wrapper does not, so dispatch on the row.
  const option = [...document.querySelectorAll("[data-akan-overlay] .group > div")].find((node) =>
    node.textContent?.startsWith(label),
  );
  if (!option) throw new Error(`No "${label}" option is offered`);
  await act(async () => {
    option.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
};

/** Clicks the first button whose text contains `text`, anywhere on the page — the picker modal portals out. */
const clickButton = async (text: string) => {
  const button = [...document.querySelectorAll("button")].find((node) => node.textContent?.includes(text));
  if (!button) throw new Error(`No "${text}" button is rendered`);
  await act(async () => {
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
};

/** The maker debounces its writes, so a pick lands one timer later. */
const settleDebounce = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 200));
  });
};

beforeAll(async () => {
  setTestEnv("querymakertest");
  const { Int } = await import("akanjs/base");
  const { ConstantRegistry, via } = await import("akanjs/constant");
  const { Insight, storeMaker } = await itemFixtureOf("queryMakerTestItem");
  const { registerClientRuntime } = await import("akanjs/client");
  calls = {
    queryMakerTestItemList: mock(async () => []),
    queryMakerTestItemInsight: mock(async () => new Insight({ count: 0 })),
  };
  const OwnerInput = via((f) => ({ nickname: f(String) }));
  const OwnerObj = via(OwnerInput, () => ({}));
  class OwnerLight extends via(OwnerObj, ["nickname"] as const, () => ({})) {
    label() {
      return this.nickname ? `@${this.nickname}` : "";
    }
  }
  const OwnerFull = via(OwnerObj, OwnerLight, () => ({}));
  const OwnerInsight = via(OwnerFull, (f) => ({ count: f(Int, { default: 0 }) }));
  ConstantRegistry.buildModel("queryMakerTestOwner", OwnerInput, OwnerObj, OwnerFull, OwnerLight, OwnerInsight, {});
  ownerRows = [];
  const ownerList = mock(async () => ownerRows.map((row) => new OwnerLight(row)));
  registerClientRuntime({
    usePage: () => ({ path: "/", lang: "en", l }),
    fetch: {
      filterQueryMap: new Map<string, { [queryKey: string]: SerializedArg[] }>([
        ["queryMakerTestItem", filterQuery as unknown as { [queryKey: string]: SerializedArg[] }],
        ["queryMakerTestOwner", ownerFilterQuery as unknown as { [queryKey: string]: SerializedArg[] }],
      ]),
      slice: {
        queryMakerTestOwner: { refName: "queryMakerTestOwner", sliceName: "queryMakerTestOwner", argLength: 2 },
      },
      queryMakerTestOwnerList: ownerList,
    },
  } as never);
  makeStore = storeMaker({ root: "queryMakerRoot", calls, sliceArgs: rootSliceArgs });
  ({ default: QueryMaker } = await import("./QueryMaker"));
});

describe("Data.QueryMaker", () => {
  test("offers the filters the client can fill, and the args the selected one takes", async () => {
    makeStore();
    const { container, unmount } = await mountSuspense(<QueryMaker slice={slice} query={{ queryKey: "byTitle" }} />);

    // The options live in the select's portal, not under the maker itself.
    const options = document.querySelector("[data-akan-overlay]")?.textContent ?? "";
    expect(options).toContain("Any");
    expect(options).toContain("By Title");
    expect(options).not.toContain("By Author");
    expect(container.textContent).toContain("By Title");
    expect(container.textContent).toContain("Title");
    unmount();
  });

  test("holds a filter whose required arg is still empty instead of sending a query the server refuses", async () => {
    makeStore();
    const { container, unmount } = await mountSuspense(<QueryMaker slice={slice} />);

    await pickOption("By Title");
    expect(container.textContent).toContain("By Title");
    expect(calls.queryMakerTestItemList).not.toHaveBeenCalled();

    await pickOption("Any");
    await settleDebounce();
    expect(calls.queryMakerTestItemList).toHaveBeenCalled();
    expect(calls.queryMakerTestItemList.mock.calls[0]?.slice(0, 2)).toEqual(["any", []]);
    unmount();
  });

  test("picks an id the filter declared against a model from that model's own rows", async () => {
    makeStore();
    ownerRows = [
      { id: adaId, nickname: "ada" },
      { id: linusId, nickname: "linus" },
    ];
    const { container, unmount } = await mountSuspense(<QueryMaker slice={slice} query={{ queryKey: "byOwner" }} />);

    expect(container.querySelector("input")).toBeNull();
    await clickButton("Select");

    const modal = document.querySelector("[role=dialog]");
    expect(modal?.textContent).toContain("@ada");
    expect(modal?.textContent).toContain("@linus");
    expect(modal?.textContent).toContain(adaId);

    await clickButton("@ada");
    await settleDebounce();
    expect(calls.queryMakerTestItemList.mock.calls[0]?.slice(0, 2)).toEqual(["byOwner", [adaId]]);
    expect(document.querySelector("[role=dialog]")).toBeNull();
    expect(container.textContent).toContain("@ada");
    unmount();
  });

  test("says how to give the referenced model a label when none of its rows has one", async () => {
    makeStore();
    ownerRows = [{ id: adaId, nickname: "" }];
    const { unmount } = await mountSuspense(<QueryMaker slice={slice} query={{ queryKey: "byOwner" }} />);

    await clickButton("Select");
    const modal = document.querySelector("[role=dialog]");
    expect(modal?.textContent).toContain(adaId);
    expect(modal?.textContent).toContain("label() method to LightQueryMakerTestOwner");
    unmount();
  });

  test("keeps nesting when the referenced model's own filter points at a model too", async () => {
    makeStore();
    ownerRows = [{ id: adaId, nickname: "ada" }];
    const { unmount } = await mountSuspense(<QueryMaker slice={slice} query={{ queryKey: "byOwner" }} />);

    await clickButton("Select");
    expect(document.querySelectorAll("[role=dialog]")).toHaveLength(1);

    await pickOption("By Manager");
    const nested = [...document.querySelectorAll("[role=dialog] button")].filter((node) =>
      node.textContent?.includes("Select"),
    );
    expect(nested).toHaveLength(1);
    await act(async () => {
      nested[0]?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(document.querySelectorAll("[role=dialog]")).toHaveLength(2);
    unmount();
  });

  test("renders nothing when the model declares no filter beyond the one every model has", async () => {
    makeStore();
    const { container, unmount } = await mountSuspense(<QueryMaker slice={{ ...slice, refName: "unfiltered" }} />);

    expect(container.textContent).toBe("");
    unmount();
  });
});
