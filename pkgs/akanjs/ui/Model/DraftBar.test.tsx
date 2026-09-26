import "../../test/registerDom";
import { beforeAll, describe, expect, test } from "bun:test";
import { act } from "react";
import { AgenticSurface, AgentProvider } from "use-agentic";
import { itemFixtureOf, l, mountSuspense, setTestEnv } from "../testHelpers";
import type { AkanUiOverrides } from "../UiOverride";

let DraftBar: typeof import("./DraftBar").default;
let UiOverrideProvider: typeof import("../UiOverride").UiOverrideProvider;
let st: typeof import("akanjs/store").st;
let makeStore: () => void;

const slice = { refName: "draftBarItem", sliceName: "draftBarItem", argLength: 1 };
const SAVED_AT = new Date("2026-01-01T00:00:00.000Z");

beforeAll(async () => {
  setTestEnv("draftbartest");
  const { storeMaker } = await itemFixtureOf("draftBarItem");
  const { registerClientRuntime } = await import("akanjs/client");
  ({ st } = await import("akanjs/store"));
  registerClientRuntime({
    usePage: () => ({ path: "/", lang: "en", l }),
    fetch: { sortKeyMap: new Map([["draftBarItem", ["latest"]]]) },
  } as never);
  makeStore = storeMaker({ root: "draftBarRoot" });
  ({ default: DraftBar } = await import("./DraftBar"));
  ({ UiOverrideProvider } = await import("../UiOverride"));
});

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
    const { container, unmount } = await mountSuspense(
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
    const { container, unmount } = await mountSuspense(
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
