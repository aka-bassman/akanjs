import { describe, expect, test } from "bun:test";
import { DataList, enumOf, Float, Int, isEnum } from ".";

type TestItem = {
  id: string;
  name: string;
  score: number;
};

describe("enumOf", () => {
  test("creates a string enum with lookup helpers", () => {
    class Role extends enumOf<"Role", string>("Role", ["admin", "member", "guest"] as const) {}

    expect(isEnum(Role)).toBe(true);
    expect(Role.refName).toBe("Role");
    expect(Role.type).toBe(String);
    expect(Role.values).toEqual(["admin", "member", "guest"]);
    expect(Role.has("member")).toBe(true);
    expect(Role.has("unknown")).toBe(false);
    expect(Role.indexOf("guest")).toBe(2);
    expect(Role.find((value) => value.startsWith("mem"))).toBe("member");
    expect(Role.findIndex((value) => value === "guest")).toBe(2);
    expect(Role.filter((value) => value.includes("e"))).toEqual(["member", "guest"]);
    expect(Role.map((value, idx) => `${idx}:${value}`)).toEqual(["0:admin", "1:member", "2:guest"]);
  });

  test("uses Int for integer numeric enums and Float for decimal enums", () => {
    const Status = enumOf("Status", [100, 200, 404] as const);
    const Rate = enumOf("Rate", [0.5, 1, 1.5] as const);

    expect(Status.type).toBe(Int);
    expect(Status.indexOf(200)).toBe(1);
    expect(Rate.type).toBe(Float);
    expect(Rate.has(1.5)).toBe(true);
  });

  test("throws when enum values are empty or lookup misses", () => {
    const Status = enumOf<"Status", number>("Status", [1, 2, 3] as const);

    expect(() => enumOf("Empty", [])).toThrow("Enum values are empty");
    expect(() => Status.indexOf(4)).toThrow("Value 4 is not in enum");
    expect(() => Status.find((value) => value > 10)).toThrow("Value not found in enum");
    expect(() => Status.findIndex((value) => value > 10)).toThrow("Value not found in enum");
  });
});

describe("DataList", () => {
  const items: TestItem[] = [
    { id: "a", name: "Alpha", score: 10 },
    { id: "b", name: "Beta", score: 20 },
    { id: "a", name: "Alpha updated", score: 30 },
  ];

  test("deduplicates constructor data by id and keeps the latest value", () => {
    const list = new DataList(items);

    expect(list.length).toBe(2);
    expect(list.values).toEqual([
      { id: "a", name: "Alpha updated", score: 30 },
      { id: "b", name: "Beta", score: 20 },
    ]);
    expect(list.has("a")).toBe(true);
    expect(list.get("missing")).toBeUndefined();
    expect(list.indexOf("b")).toBe(1);
    expect(list.pick("a").name).toBe("Alpha updated");
  });

  test("sets, deletes, and reindexes values by id", () => {
    const list = new DataList<TestItem>([
      { id: "a", name: "Alpha", score: 10 },
      { id: "b", name: "Beta", score: 20 },
      { id: "c", name: "Gamma", score: 30 },
    ]);

    expect(list.set({ id: "b", name: "Beta updated", score: 25 })).toBe(list);
    expect(list.length).toBe(3);
    expect(list.pick("b").score).toBe(25);

    list.set({ id: "d", name: "Delta", score: 40 });
    expect(list.length).toBe(4);
    expect(list.pickAt(3).id).toBe("d");

    expect(list.delete("b")).toBe(list);
    expect(list.length).toBe(3);
    expect(list.values.map((value) => value.id)).toEqual(["a", "c", "d"]);
    expect(list.indexOf("c")).toBe(1);
    expect(list.indexOf("d")).toBe(2);
    expect(list.has("b")).toBe(false);
    expect(() => list.pick("b")).toThrow("Value b is not in list");
    expect(() => list.pickAt(99)).toThrow("Value at 99 is undefined");
  });

  test("supports array-like helpers and returns DataList for derived lists", () => {
    const list = new DataList<TestItem>([
      { id: "a", name: "Alpha", score: 10 },
      { id: "b", name: "Beta", score: 20 },
      { id: "c", name: "Gamma", score: 30 },
    ]);

    expect(list.at(-1)?.id).toBe("c");
    expect(list.find((value) => value.score > 15)?.id).toBe("b");
    expect(list.findIndex((value) => value.id === "c")).toBe(2);
    expect(list.some((value) => value.score === 20)).toBe(true);
    expect(list.every((value) => value.score >= 10)).toBe(true);
    expect(list.map((value) => value.name)).toEqual(["Alpha", "Beta", "Gamma"]);
    expect(list.flatMap((value) => [value.id, value.name])).toEqual(["a", "Alpha", "b", "Beta", "c", "Gamma"]);
    expect(list.reduce((sum, value) => sum + value.score, 0)).toBe(60);
    expect([...list].map((value) => value.id)).toEqual(["a", "b", "c"]);

    const filtered = list.filter((value) => value.score >= 20);
    expect(filtered).toBeInstanceOf(DataList);
    expect(filtered.values.map((value) => value.id)).toEqual(["b", "c"]);

    const sliced = list.slice(1);
    expect(sliced).toBeInstanceOf(DataList);
    expect(sliced.values.map((value) => value.id)).toEqual(["b", "c"]);

    const sorted = list.save().sort((a, b) => b.score - a.score);
    expect(sorted).toBeInstanceOf(DataList);
    expect(sorted.values.map((value) => value.id)).toEqual(["c", "b", "a"]);
    expect(list.values.map((value) => value.id)).toEqual(["a", "b", "c"]);
  });

  test("sorts into a new list and leaves the source lookups intact", () => {
    const list = new DataList<TestItem>([
      { id: "a", name: "Alpha", score: 10 },
      { id: "b", name: "Beta", score: 20 },
      { id: "c", name: "Gamma", score: 30 },
    ]);

    const sorted = list.sort((a, b) => b.score - a.score);

    expect(sorted.values.map((value) => value.id)).toEqual(["c", "b", "a"]);
    expect(sorted.pick("a").name).toBe("Alpha");
    expect(sorted.indexOf("c")).toBe(0);
    expect(list.values.map((value) => value.id)).toEqual(["a", "b", "c"]);
    expect(list.pick("a").name).toBe("Alpha");
    expect(list.get("c")?.name).toBe("Gamma");
  });

  test("copies from another DataList through save", () => {
    const list = new DataList<TestItem>(items);
    const saved = list.save();

    expect(saved).toBeInstanceOf(DataList);
    expect(saved).not.toBe(list);
    expect(saved.values).toEqual(list.values);

    list.set({ id: "c", name: "Gamma", score: 40 });
    expect(saved.has("c")).toBe(false);
  });
});
