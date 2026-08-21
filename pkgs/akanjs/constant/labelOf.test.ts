import { describe, expect, test } from "bun:test";
import { labelOf } from "./labelOf";

describe("labelOf", () => {
  test("reads the field the text:title search role names", () => {
    const model = { text: { title: new Set(["subject"]), children: { title: new Set<string>() } } };
    expect(labelOf(model, { subject: "Fix login", title: "wrong" })).toBe("Fix login");
  });

  test("skips nested title paths and falls back to conventional keys", () => {
    const model = { text: { title: new Set(["works[*].name"]) } };
    expect(labelOf(model, { title: "Fix login" })).toBe("Fix login");
    expect(labelOf(model, { name: "Kang" })).toBe("Kang");
  });

  test("returns nothing for a value with no readable label", () => {
    expect(labelOf({}, { count: 3 })).toBeUndefined();
    expect(labelOf(null, null)).toBeUndefined();
  });
});
