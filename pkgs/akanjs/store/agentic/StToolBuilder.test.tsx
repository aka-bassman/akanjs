import "../../test/registerDom";
import { describe, expect, test } from "bun:test";
import { dayjs, enumOf, Float, ID, Int } from "akanjs/base";
import { act, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { AgenticSurface, AgentProvider } from "use-agentic";
import { actionTagOf } from "../actionTag";
import { StToolBuilder } from "./StToolBuilder";

const mount = (node: ReactNode) => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(node));
  return () => {
    act(() => root.unmount());
    container.remove();
  };
};

class StToolMode extends enumOf("stToolMode", ["fit", "fill"] as const) {}
/** The scalar comes from the values: all-integers infers `Int`, so the schema says `integer` with no help. */
class StToolLevel extends enumOf("stToolLevel", [1, 2, 3] as const) {}

describe("StToolBuilder", () => {
  test("parametersOf compiles scalars and enums into one named-object schema", () => {
    expect(
      StToolBuilder.parametersOf([
        { name: "sceneId", type: ID, optional: false },
        { name: "toIndex", type: Int, optional: false },
        { name: "ratio", type: Float, optional: true },
        { name: "mode", type: StToolMode, optional: false },
        { name: "startAt", type: Date, optional: true },
        { name: "notify", type: Boolean, optional: false },
      ]),
    ).toEqual({
      type: "object",
      properties: {
        sceneId: { type: "string" },
        toIndex: { type: "integer" },
        ratio: { type: "number" },
        mode: { type: "string", enum: ["fit", "fill"] },
        startAt: { type: "string", format: "date-time" },
        notify: { type: "boolean" },
      },
      required: ["sceneId", "toIndex", "mode", "notify"],
      additionalProperties: false,
    });
  });

  test("no declared arguments publishes no schema", () => {
    expect(StToolBuilder.parametersOf([])).toBeUndefined();
  });

  test("a model class or Map is rejected where it is declared", () => {
    class NotAScalar {}
    expect(() => StToolBuilder.schemaOf(NotAScalar as unknown as typeof ID)).toThrow(
      "st.tool takes scalar and enum arguments only.",
    );
    expect(() => StToolBuilder.schemaOf(Map as unknown as typeof ID)).toThrow(
      "st.tool takes scalar and enum arguments only.",
    );
  });

  test("checkedValue enforces the published schema and coerces a date", () => {
    expect(() => StToolBuilder.checkedValue("reorder", "toIndex", Int, "3")).toThrow(
      'Argument "toIndex" of reorder must be a whole number.',
    );
    expect(() => StToolBuilder.checkedValue("setMode", "mode", StToolMode, "zoom")).toThrow(
      'Argument "mode" of setMode must be one of: fit, fill.',
    );
    expect(StToolBuilder.checkedValue("setMode", "mode", StToolMode, "fill")).toBe("fill");
    const parsed = StToolBuilder.checkedValue("schedule", "startAt", Date, "2026-08-19T09:00:00Z");
    expect(dayjs.isDayjs(parsed)).toBe(true);
    expect(() => StToolBuilder.checkedValue("schedule", "startAt", Date, "not-a-date")).toThrow(
      'Argument "startAt" of schedule must be an ISO 8601 date string.',
    );
  });

  test("oneOf narrows a scalar to a value set only the render knows", () => {
    const args = [{ name: "sortKey", type: String, optional: false, oneOf: ["latest", "oldest"] as const }];
    expect(StToolBuilder.parametersOf(args)).toEqual({
      type: "object",
      properties: { sortKey: { type: "string", enum: ["latest", "oldest"] } },
      required: ["sortKey"],
      additionalProperties: false,
    });
    expect(StToolBuilder.positionalOf("sortList", args, { sortKey: "oldest" })).toEqual(["oldest"]);
    expect(() => StToolBuilder.positionalOf("sortList", args, { sortKey: "title" })).toThrow(
      'Argument "sortKey" of sortList must be one of: latest, oldest.',
    );
  });

  test("positionalOf maps named arguments into declared order and nulls omitted optionals", () => {
    const args = [
      { name: "sceneId", type: ID, optional: false },
      { name: "ratio", type: Float, optional: true },
    ];
    expect(StToolBuilder.positionalOf("resize", args, { sceneId: "s1" })).toEqual(["s1", null]);
    expect(() => StToolBuilder.positionalOf("resize", args, { ratio: 2 })).toThrow(
      'Missing argument "sceneId" for resize.',
    );
  });
});

describe("StToolBuilder.exec", () => {
  test("publishes the tool and tags the callable", async () => {
    const surface = new AgenticSurface();
    // The declared type is the assertion: `oneOf` narrows the callable to the value set, not to the base scalar.
    const tab: { switchTab?: (menu: "one" | "two") => Promise<void> } = {};
    const seen: string[] = [];
    const Tabs = () => {
      tab.switchTab = new StToolBuilder("switchTab", { desc: "Switch the tab." })
        .arg("menu", String, { oneOf: ["one", "two"] })
        .exec((menu) => void seen.push(menu));
      return null;
    };
    const unmount = mount(
      <AgentProvider surface={surface}>
        <Tabs />
      </AgentProvider>,
    );
    expect(surface.snapshot().tools.map((tool) => tool.name)).toEqual(["switchTab"]);
    expect(actionTagOf(tab.switchTab)?.action).toBe("switchTab");
    await surface.call("switchTab", { menu: "two" });
    expect(seen).toEqual(["two"]);
    await expect(surface.call("switchTab", { menu: "three" })).rejects.toThrow(
      'Argument "menu" of switchTab must be one of: one, two.',
    );
    unmount();
  });

  test("an enum argument carries its own value set — no oneOf, and the callable narrows to it", async () => {
    const surface = new AgenticSurface();
    // The declared type is the assertion: an enum arg narrows to its values, an Int-backed one to its numbers.
    const held: { setMode?: (mode: "fit" | "fill", level: 1 | 2 | 3) => Promise<void> } = {};
    const seen: unknown[] = [];
    const Panel = () => {
      held.setMode = new StToolBuilder("setMode", { desc: "Set the mode." })
        .arg("mode", StToolMode)
        .arg("level", StToolLevel)
        .exec((mode, level) => void seen.push([mode, level]));
      return null;
    };
    const unmount = mount(
      <AgentProvider surface={surface}>
        <Panel />
      </AgentProvider>,
    );

    expect(surface.snapshot().tools[0]?.parameters).toEqual({
      type: "object",
      properties: {
        mode: { type: "string", enum: ["fit", "fill"] },
        level: { type: "integer", enum: [1, 2, 3] },
      },
      required: ["mode", "level"],
      additionalProperties: false,
    });
    await surface.call("setMode", { mode: "fill", level: 2 });
    expect(seen).toEqual([["fill", 2]]);
    await expect(surface.call("setMode", { mode: "zoom", level: 2 })).rejects.toThrow(
      'Argument "mode" of setMode must be one of: fit, fill.',
    );
    await expect(surface.call("setMode", { mode: "fit", level: 9 })).rejects.toThrow(
      'Argument "level" of setMode must be one of: 1, 2, 3.',
    );
    unmount();
  });

  test("a falsy name declares nothing and still drives the click", async () => {
    const surface = new AgenticSurface();
    const tab: { switchTab?: (menu: string) => Promise<void> } = {};
    const seen: string[] = [];
    const Tabs = () => {
      tab.switchTab = new StToolBuilder(null, { desc: "Switch the tab." })
        .arg("menu", String)
        .exec((menu) => void seen.push(menu));
      return null;
    };
    const unmount = mount(
      <AgentProvider surface={surface}>
        <Tabs />
      </AgentProvider>,
    );
    expect(surface.snapshot().tools).toHaveLength(0);
    expect(actionTagOf(tab.switchTab)).toBeUndefined();
    await tab.switchTab?.("two");
    expect(seen).toEqual(["two"]);
    unmount();
  });
});
