import "../../test/registerDom";
import { describe, expect, test } from "bun:test";
import { enumOf, Int } from "akanjs/base";
import { ConstantRegistry, via } from "akanjs/constant";
import { act, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { AgenticSurface, AgentProvider } from "use-agentic";
import { store } from "../store";
import { StoreRegistry } from "../storeRegistry";
import { useFieldTool } from "./useFieldTool";

class FieldToolRole extends enumOf("fieldToolRole", ["owner", "guest"] as const) {}

const Row = via((f) => ({ key: f(String), weight: f(Int, { default: 0 }) }));
ConstantRegistry.buildScalar("fieldToolRow", Row, { Row });

const Input = via((f) => ({
  title: f(String),
  role: f(FieldToolRole),
  tags: f([String]),
  rows: f([Row]),
  note: f(String).optional(),
  password: f.secret(String),
}));
const Obj = via(Input, () => ({}));
const Light = via(Obj, ["title"] as const, () => ({}));
const Full = via(Obj, Light, () => ({}));
const Insight = via(Full, (f) => ({ count: f(Int, { default: 0 }) }));
ConstantRegistry.buildModel("fieldToolItem", Input, Obj, Full, Light, Insight, {});

const written: [string, unknown][] = [];
class FieldToolStore extends store("fieldTool" as const, () => ({
  fieldToolItemForm: {} as { [key: string]: unknown },
})) {
  setTitleOnFieldToolItem(value: string) {
    written.push(["title", value]);
  }
  setTagsOnFieldToolItem(value: string[]) {
    written.push(["tags", value]);
  }
  setNoteOnFieldToolItem(value: string | null) {
    written.push(["note", value]);
  }
  setRowsOnFieldToolItem(value: unknown) {
    written.push(["rows", value]);
  }
  // Stand in for the generated array actions, which only exist on a store built from a signal.
  addRowsOnFieldToolItem(value: unknown) {
    written.push(["addRows", value]);
  }
  subRowsOnFieldToolItem(idxs: unknown) {
    written.push(["subRows", idxs]);
  }
  setPasswordOnFieldToolItem(value: string) {
    written.push(["password", value]);
  }
}
StoreRegistry.register(FieldToolStore);
// The registry's own instance, because the row tools dispatch through `StoreRegistry.instance` the way an app does.
StoreRegistry.instance.addStore(StoreRegistry.merge("fieldToolRoot", FieldToolStore));
const instance = StoreRegistry.instance;
const dispatch = instance.do as unknown as { [key: string]: (value: unknown) => void };

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

const control = (surface: AgenticSurface, onChange: unknown, transform?: unknown) => {
  const Control = () => {
    useFieldTool(onChange, transform);
    return null;
  };
  return (
    <AgentProvider surface={surface}>
      <Control />
    </AgentProvider>
  );
};

describe("useFieldTool", () => {
  test("a control holding the setter by reference publishes it, and unmounting takes it back", async () => {
    const surface = new AgenticSurface();
    written.length = 0;
    const unmount = mount(control(surface, dispatch.setTitleOnFieldToolItem));

    expect(surface.snapshot().tools.map((tool) => tool.name)).toEqual(["setTitleOnFieldToolItem"]);
    expect(surface.snapshot().tools[0]?.parameters).toEqual({
      type: "object",
      properties: { value: { type: "string" } },
      required: ["value"],
      additionalProperties: false,
    });
    await surface.call("setTitleOnFieldToolItem", { value: "Ada" });
    expect(written).toEqual([["title", "Ada"]]);
    unmount();
    expect(surface.snapshot().tools).toHaveLength(0);
  });

  test("an inline arrow names nothing, so it publishes nothing", () => {
    const surface = new AgenticSurface();
    const unmount = mount(control(surface, (value: string) => void written.push(["title", value])));

    expect(surface.snapshot().tools).toHaveLength(0);
    unmount();
  });

  test("a list control takes the whole list, checked element by element", async () => {
    const surface = new AgenticSurface();
    written.length = 0;
    const unmount = mount(control(surface, dispatch.setTagsOnFieldToolItem));

    expect(surface.snapshot().tools[0]?.parameters).toEqual({
      type: "object",
      properties: { value: { type: "array", items: { type: "string" } } },
      required: ["value"],
      additionalProperties: false,
    });
    await surface.call("setTagsOnFieldToolItem", { value: ["a", "b"] });
    expect(written).toEqual([["tags", ["a", "b"]]]);
    await expect(surface.call("setTagsOnFieldToolItem", { value: ["a", 2] })).rejects.toThrow(
      '"value[1]" of setTagsOnFieldToolItem must be a string.',
    );
    unmount();
  });

  test("the control's transform runs on the agent's write too, so both paths store one shape", async () => {
    const surface = new AgenticSurface();
    written.length = 0;
    const unmount = mount(
      control(surface, dispatch.setTitleOnFieldToolItem, (value: string) => value.trim().toUpperCase()),
    );

    await surface.call("setTitleOnFieldToolItem", { value: "  ada  " });
    expect(written).toEqual([["title", "ADA"]]);
    unmount();
  });

  test("a transform normalizes one scalar, so a list control applies it per element", async () => {
    const surface = new AgenticSurface();
    written.length = 0;
    const unmount = mount(control(surface, dispatch.setTagsOnFieldToolItem, (value: string) => value.toUpperCase()));

    await surface.call("setTagsOnFieldToolItem", { value: ["a", "b"] });
    expect(written).toEqual([["tags", ["A", "B"]]]);
    unmount();
  });

  test("clearing a nullable field stays null — a normalizer written for a value would invent one", async () => {
    const surface = new AgenticSurface();
    written.length = 0;
    const unmount = mount(control(surface, dispatch.setNoteOnFieldToolItem, (value: string) => `[${value}]`));

    await surface.call("setNoteOnFieldToolItem", {});
    expect(written).toEqual([["note", null]]);
    unmount();
  });

  test("an embedded-row array also publishes append and remove-by-index", async () => {
    const surface = new AgenticSurface();
    written.length = 0;
    const unmount = mount(control(surface, dispatch.setRowsOnFieldToolItem));
    const rowSchema = {
      type: "object",
      properties: { key: { type: "string" }, weight: { type: "integer" } },
      additionalProperties: false,
    };

    expect(surface.snapshot().tools.map((tool) => tool.name)).toEqual([
      "addRowsOnFieldToolItem",
      "setRowsOnFieldToolItem",
      "subRowsOnFieldToolItem",
    ]);
    expect(surface.snapshot().tools.find((tool) => tool.name === "addRowsOnFieldToolItem")?.parameters).toEqual({
      type: "object",
      properties: { values: { type: "array", items: rowSchema } },
      required: ["values"],
      additionalProperties: false,
    });
    expect(surface.snapshot().tools.find((tool) => tool.name === "subRowsOnFieldToolItem")?.parameters).toEqual({
      type: "object",
      properties: { idxs: { type: "array", items: { type: "integer" } } },
      required: ["idxs"],
      additionalProperties: false,
    });

    await surface.call("addRowsOnFieldToolItem", { values: [{ key: "spawn", weight: 2 }] });
    expect(written).toEqual([["addRows", [{ key: "spawn", weight: 2 }]]]);
    unmount();
    expect(surface.snapshot().tools).toHaveLength(0);
  });

  test("an appended row is checked field by field, so a bad row never reaches the form", async () => {
    const surface = new AgenticSurface();
    written.length = 0;
    const unmount = mount(control(surface, dispatch.setRowsOnFieldToolItem));

    await expect(surface.call("addRowsOnFieldToolItem", { values: [{ key: "a", weight: "two" }] })).rejects.toThrow(
      'Argument "values[0].weight" of addRowsOnFieldToolItem must be a whole number.',
    );
    await expect(surface.call("addRowsOnFieldToolItem", { values: [{ key: "a", other: 1 }] })).rejects.toThrow(
      '"values[0]" of addRowsOnFieldToolItem has no field "other".',
    );
    expect(written).toEqual([]);
    unmount();
  });

  test("removing a position the form does not have is refused with the row count", async () => {
    const surface = new AgenticSurface();
    written.length = 0;
    const unmount = mount(control(surface, dispatch.setRowsOnFieldToolItem));

    await expect(surface.call("subRowsOnFieldToolItem", { idxs: [] })).rejects.toThrow(
      '"idxs" of subRowsOnFieldToolItem takes at least one index.',
    );
    await expect(surface.call("subRowsOnFieldToolItem", { idxs: [0] })).rejects.toThrow(
      "rows has 0 rows, so 0 is out of range.",
    );
    expect(written).toEqual([]);
    unmount();
  });

  test("an array of primitives keeps one whole-array setter — there is no row to retype wrong", () => {
    const surface = new AgenticSurface();
    const unmount = mount(control(surface, dispatch.setTagsOnFieldToolItem));

    expect(surface.snapshot().tools.map((tool) => tool.name)).toEqual(["setTagsOnFieldToolItem"]);
    unmount();
  });

  test("a secret field publishes nothing even when its control renders", () => {
    const surface = new AgenticSurface();
    const unmount = mount(control(surface, dispatch.setPasswordOnFieldToolItem));

    expect(surface.snapshot().tools).toHaveLength(0);
    unmount();
  });
});
