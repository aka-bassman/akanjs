import "../../test/registerDom";
import { describe, expect, test } from "bun:test";
import { enumOf, Int } from "akanjs/base";
import { ConstantRegistry, via } from "akanjs/constant";
import { act, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { AgenticSurface, AgentProvider } from "use-agentic";
import { store } from "../store";
import { StoreInstance } from "../storeInstance";
import { StoreRegistry } from "../storeRegistry";
import { useFieldTool } from "./useFieldTool";

class FieldToolRole extends enumOf("fieldToolRole", ["owner", "guest"] as const) {}

const Input = via((f) => ({
  title: f(String),
  role: f(FieldToolRole),
  tags: f([String]),
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
  setPasswordOnFieldToolItem(value: string) {
    written.push(["password", value]);
  }
}
StoreRegistry.register(FieldToolStore);
const instance = new StoreInstance(StoreRegistry.merge("fieldToolRoot", FieldToolStore));
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

const control = (surface: AgenticSurface, onChange: unknown) => {
  const Control = () => {
    useFieldTool(onChange);
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

  test("a secret field publishes nothing even when its control renders", () => {
    const surface = new AgenticSurface();
    const unmount = mount(control(surface, dispatch.setPasswordOnFieldToolItem));

    expect(surface.snapshot().tools).toHaveLength(0);
    unmount();
  });
});
