import { describe, expect, test } from "bun:test";
import { via } from "akanjs/constant";
import { readableValue } from "./readableValue";

const ReadableNote = via((f) => ({
  title: f(String),
  secretMemo: f.secret(String).optional(),
}));

describe("readableValue", () => {
  test("scalars, dates, and arrays of them pass through", () => {
    expect(readableValue("tab", "info")).toBe("info");
    expect(readableValue("counts", [1, 2, 3])).toEqual([1, 2, 3]);
    expect(readableValue("at", new Date("2026-08-19"))).toEqual(new Date("2026-08-19"));
    expect(readableValue("nothing", null)).toBeNull();
  });

  test("a declared mask strips what the model marks secret, spread copies included", () => {
    const value = { title: "hello", secretMemo: "do not ship" };
    expect(readableValue("note", value, ReadableNote)).toEqual({ title: "hello" });
  });

  test("an object with no model and no serialize is refused by name", () => {
    expect(() => readableValue("job", { progress: 0.4 })).toThrow(
      'State "job" holds an object that belongs to no model',
    );
  });
});
