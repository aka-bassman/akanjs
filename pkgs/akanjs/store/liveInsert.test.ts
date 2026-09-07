import { describe, expect, test } from "bun:test";
import { dayjs } from "akanjs/base";
import { livePlacementIndex } from "./liveInsert";

const sorts = { latest: { createdAt: -1 as const }, oldest: { createdAt: 1 as const }, byAt: { at: 1 as const } };
const row = (id: string, at: number) => ({ id, createdAt: dayjs(at), at });
const list = [row("c", 300), row("b", 200), row("a", 100)];

const place = (patch: Partial<Parameters<typeof livePlacementIndex>[0]> = {}) =>
  livePlacementIndex({
    list,
    row: row("new", 250),
    page: 1,
    limit: 5,
    sortKey: "latest",
    allowedSorts: ["latest"],
    sorts,
    ...patch,
  });

describe("livePlacementIndex", () => {
  test("places a row by the declared sort", () => {
    expect(place()).toBe(1);
    expect(place({ row: row("new", 400) })).toBe(0);
    expect(place({ row: row("new", 50) })).toBe(3);
  });

  test("an ascending sort places from the other end", () => {
    expect(place({ sortKey: "oldest", allowedSorts: ["oldest"], list: [...list].reverse() })).toBe(2);
  });

  test("a sort the slice did not allowlist refuses to guess", () => {
    expect(place({ sortKey: "byAt", allowedSorts: ["latest"] })).toBeNull();
    expect(place({ sortKey: "relevance", allowedSorts: ["latest", "relevance"] })).toBeNull();
    expect(place({ sorts: undefined })).toBeNull();
  });

  test("only the first page can place a row", () => {
    expect(place({ page: 2 })).toBeNull();
  });

  test("a row past the end of a full window belongs to a later page", () => {
    expect(place({ row: row("new", 50), limit: 3 })).toBeNull();
    expect(place({ row: row("new", 50), limit: 4 })).toBe(3);
  });

  test("an empty window takes the first row", () => {
    expect(place({ list: [] })).toBe(0);
  });

  test("a row missing the sorted field refuses to guess", () => {
    expect(place({ row: { id: "new" } })).toBeNull();
    expect(place({ row: { id: "new", createdAt: null } })).toBeNull();
  });

  test("ties keep the incoming row after the rows already placed", () => {
    expect(place({ row: row("new", 200) })).toBe(2);
  });

  test("a multi-field sort falls through to the next field", () => {
    const tiered = { tier: { rank: 1 as const, createdAt: -1 as const } };
    const ranked = [
      { id: "x", rank: 1, createdAt: dayjs(500) },
      { id: "y", rank: 2, createdAt: dayjs(900) },
      { id: "z", rank: 2, createdAt: dayjs(100) },
    ];
    const at = (rank: number, createdAt: number) =>
      livePlacementIndex({
        list: ranked,
        row: { id: "new", rank, createdAt: dayjs(createdAt) },
        page: 1,
        limit: 5,
        sortKey: "tier",
        allowedSorts: ["tier"],
        sorts: tiered,
      });
    expect(at(1, 100)).toBe(1);
    expect(at(2, 950)).toBe(1);
    expect(at(3, 950)).toBe(3);
  });
});
