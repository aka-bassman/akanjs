import "../test/registerDom";
import { describe, expect, test } from "bun:test";
import { mount } from "./mount.fixture";
import { store } from "./store";
import { StoreInstance } from "./storeInstance";
import { StoreRegistry } from "./storeRegistry";

class LiveStore extends store("liveTest" as const, () => ({ tab: "a", draft: "" })) {}
StoreRegistry.register(LiveStore);
const instance = new StoreInstance(StoreRegistry.merge("liveRoot", LiveStore));

const TabReader = () => {
  instance.use.tab?.();
  return null;
};

describe("StoreInstance.liveKeys", () => {
  test("counts mounted readers per key and forgets a key nobody reads", () => {
    expect(instance.liveKeys.has("tab")).toBe(false);
    const unmount = mount(
      <>
        <TabReader />
        <TabReader />
      </>,
    );
    expect(instance.liveKeys.get("tab")).toBe(2);
    expect(instance.liveKeys.has("draft")).toBe(false);
    unmount();
    expect(instance.liveKeys.has("tab")).toBe(false);
  });
});
