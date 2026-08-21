import { describe, expect, test } from "bun:test";
import { dayjs, enumOf, Float, ID, Int } from "akanjs/base";
import { StToolBuilder } from "./StToolBuilder";

class StToolMode extends enumOf("stToolMode", ["fit", "fill"] as const) {}

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
