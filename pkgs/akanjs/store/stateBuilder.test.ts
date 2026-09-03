import { describe, expect, mock, spyOn, test } from "bun:test";
import { enumOf, Int } from "akanjs/base";
import { ConstantRegistry, via } from "akanjs/constant";
import {
  createDerivedStateBuilder,
  createWritableStateBuilder,
  mergeDerivedMeta,
  resolveDerivedState,
  resolveWritableState,
} from "./stateBuilder";

class StateBuilderTestMode extends enumOf("StateBuilderTestMode", ["list", "grid"] as const) {}
const StateBuilderTestAddress = via((f) => ({
  city: f(String),
  zip: f(Int, { default: 10000 }),
}));
ConstantRegistry.buildScalar("stateBuilderTestAddress", StateBuilderTestAddress, { StateBuilderTestAddress });

const setupEnv = () => {
  process.env.AKAN_PUBLIC_APP_NAME = "storetest";
  process.env.AKAN_PUBLIC_REPO_NAME = "storetest";
  process.env.AKAN_PUBLIC_SERVE_DOMAIN = "localhost";
  process.env.AKAN_PUBLIC_ENV = "testing";
};

describe("makeDefaultFactory", () => {
  test("preserves DataList instances when cloning default state", async () => {
    setupEnv();

    const [{ DataList }, { makeDefaultFactory }] = await Promise.all([import("akanjs/base"), import("./stateBuilder")]);
    const original = new DataList([{ id: "project-1", name: "Project 1" }]);
    const clone = makeDefaultFactory(original)() as typeof original;

    expect(clone).toBeInstanceOf(DataList);
    expect(clone).not.toBe(original);
    expect(clone.map((project) => project.name)).toEqual(["Project 1"]);
    expect(clone.get("project-1")?.name).toBe("Project 1");
  });

  test("keeps non-plain browser-like objects as opaque references", async () => {
    setupEnv();

    const { makeDefaultFactory } = await import("./stateBuilder");
    class BrowserResource {
      readonly id = "stream-1";
      getTracks() {
        return ["audio"];
      }
    }
    const original = new BrowserResource();
    const clone = makeDefaultFactory(original)() as BrowserResource;

    expect(clone).toBe(original);
    expect(clone.getTracks()).toEqual(["audio"]);
  });
});

describe("state builder declarations", () => {
  test("resolves persist and session metadata with typed defaults and codecs", () => {
    setupEnv();
    const builder = createWritableStateBuilder();
    const state = {
      count: builder.persist(Int, { default: 7, key: "countOverride" }),
      tags: builder.session([String], { default: ["alpha"] }),
      mode: builder.persist(StateBuilderTestMode, { default: "list" }),
      address: builder.persist(StateBuilderTestAddress, {
        default: () => new StateBuilderTestAddress({ city: "Seoul" }),
      }),
    };

    const resolved = resolveWritableState("prefs", state);

    expect(resolved.shape).toMatchObject({
      count: 7,
      tags: ["alpha"],
      mode: "list",
    });
    expect(resolved.shape.address).toBeInstanceOf(StateBuilderTestAddress);
    expect((resolved.shape.address as InstanceType<typeof StateBuilderTestAddress>).zip).toBe(10000);
    expect(resolved.meta.persistSession.count).toMatchObject({
      kind: "persist",
      key: "count",
    });
    expect(resolved.meta.persistSession.count.storageKey).toContain(".prefs.countOverride");
    expect(resolved.meta.persistSession.tags.kind).toBe("session");
    expect(resolved.meta.persistSession.count.parse("9")).toBe(9);
    expect(resolved.meta.persistSession.tags.parse(["a", "b"])).toEqual(["a", "b"]);
    expect(resolved.meta.persistSession.mode.parse("grid")).toBe("grid");
    expect(() => resolved.meta.persistSession.mode.parse("invalid")).toThrow("Invalid enum value");

    const parsedAddress = resolved.meta.persistSession.address.parse({ city: "Busan", zip: "12345" });
    expect(parsedAddress).toEqual({ city: "Busan", zip: 12345 });
    expect(resolved.meta.persistSession.address.serialize(parsedAddress)).toEqual({ city: "Busan", zip: 12345 });
  });

  test("parses search state from repeated params and JSON object params", () => {
    setupEnv();
    const builder = createDerivedStateBuilder<{ searchParams: Record<string, string | string[]> }>();
    const resolved = resolveDerivedState(
      {
        ids: builder.search("id", [Int], { default: [1] }),
        modes: builder.search("mode", [StateBuilderTestMode], { default: ["list"] }),
        addresses: builder.search("address", [StateBuilderTestAddress], { default: [] }),
        enabled: builder.search("enabled", Boolean, { default: false }),
      },
      new Set(["searchParams"]),
    );

    expect(resolved.meta.search.ids.parseSearch({ id: ["3", "4"] })).toEqual([3, 4]);
    expect(resolved.meta.search.modes.parseSearch({ mode: JSON.stringify(["grid", "list"]) })).toEqual([
      "grid",
      "list",
    ]);
    expect(
      resolved.meta.search.addresses.parseSearch({
        address: JSON.stringify([
          { city: "Seoul", zip: 12345 },
          { city: "Jeju", zip: 10000 },
        ]),
      }),
    ).toEqual([
      { city: "Seoul", zip: 12345 },
      { city: "Jeju", zip: 10000 },
    ]);
    expect(resolved.meta.search.enabled.parseSearch({ enabled: "true" })).toBe(true);

    const warn = spyOn(console, "warn").mockImplementation(() => {});
    expect(resolved.meta.search.ids.parseSearch({ id: "not-number" })).toEqual([1]);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("Failed to parse search param id"));
    warn.mockRestore();
  });

  test("validates computed dependencies and rejects duplicate derived metadata", () => {
    setupEnv();
    const builder = createDerivedStateBuilder<{ count: number; label: string }>();
    const equals = mock((a: string, b: string) => a.toLowerCase() === b.toLowerCase());
    const resolved = resolveDerivedState(
      {
        summary: builder.computed(["count", "label"], (count, label) => `${label}:${count}`, { equals }),
      },
      new Set(["count", "label"]),
    );

    expect(resolved.shape.summary).toBeUndefined();
    expect(resolved.meta.derivedKeys.has("summary")).toBe(true);
    expect(resolved.meta.computed.summary.deps).toEqual(["count", "label"]);
    expect(resolved.meta.computed.summary.selector(2, "total")).toBe("total:2");
    expect(resolved.meta.computed.summary.equals("TOTAL:2", "total:2")).toBe(true);
    expect(equals).toHaveBeenCalled();

    expect(() =>
      resolveDerivedState({ broken: builder.computed(["missing" as never], () => "bad") }, new Set(["count"])),
    ).toThrow("Computed broken has invalid deps: missing");
    expect(() => mergeDerivedMeta(resolved.meta, resolved.meta)).toThrow("Duplicate state metadata key: summary");
  });

  test("rejects derived declarations that conflict with writable keys", () => {
    setupEnv();
    const builder = createDerivedStateBuilder<{ count: number }>();

    expect(() => resolveDerivedState({ count: builder.search("count", Int) }, new Set(["count"]))).toThrow(
      "Derived state key conflicts with writable state: count",
    );
    expect(() => resolveDerivedState({ count: 1 }, new Set(["value"]))).toThrow(
      "Derived state count must be declared with search() or computed()",
    );
  });
});
