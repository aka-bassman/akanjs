import { describe, expect, test } from "bun:test";
import { createInlineRscScript, encodeInlineRscChunk, SsrChunkRegistry } from "./ssrFromRscRenderer";

describe("SsrChunkRegistry", () => {
  test("evicts least recently used chunk groups while preserving aliases", () => {
    const registry = new SsrChunkRegistry<Record<string, string>>(4);
    const modA = { name: "a" };
    const modB = { name: "b" };
    const modC = { name: "c" };

    registry.set(["/a.js?v=1", "/a.js"], modA);
    registry.set(["/b.js?v=1", "/b.js"], modB);
    expect(registry.size).toBe(4);

    expect(registry.get("/a.js")).toBe(modA);
    registry.set(["/c.js?v=1", "/c.js"], modC);

    expect(registry.size).toBe(4);
    expect(registry.evictionCount).toBe(1);
    expect(registry.get("/a.js?v=1")).toBe(modA);
    expect(registry.get("/b.js")).toBeUndefined();
    expect(registry.get("/b.js?v=1")).toBeUndefined();
    expect(registry.get("/c.js")).toBe(modC);
  });
});

describe("inline RSC chunks", () => {
  test("encodes valid UTF-8 chunks as strings", () => {
    const bytes = new TextEncoder().encode("hello 한글");

    expect(encodeInlineRscChunk(bytes)).toEqual([1, "hello 한글"]);
  });

  test("falls back to base64 for invalid UTF-8 chunks", () => {
    expect(encodeInlineRscChunk(new Uint8Array([0xff]))).toEqual([3, "/w=="]);
  });

  test("escapes script-breaking UTF-8 payloads", () => {
    const script = createInlineRscScript(new TextEncoder().encode(`</script><!--\u2028\u2029`));

    expect(script).toContain("self.__RSC_PUSH__(1,");
    expect(script).not.toContain("</script><!--");
    expect(script).toContain("\\u003c/script\\u003e\\u003c!--\\u2028\\u2029");
  });
});
