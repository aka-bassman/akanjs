import { describe, expect, test } from "bun:test";
import { Compaction } from "./Compaction";
import type { ChatMessage } from "./types";

const user = (text: string): ChatMessage => ({ role: "user", text });
const assistant = (text: string): ChatMessage => ({ role: "assistant", text });
const call = (id: string, name: string): ChatMessage => ({ role: "assistant", toolCalls: [{ id, name, args: {} }] });
const result = (id: string, name: string): ChatMessage => ({ role: "tool", toolResults: [{ id, name, result: 1 }] });

describe("Compaction.cutAt", () => {
  test("cuts at the first user message at or below the kept tail", () => {
    const messages = [user("a"), assistant("b"), user("c"), assistant("d"), user("e"), assistant("f")];
    expect(Compaction.cutAt(messages, 2)).toBe(4);
    expect(Compaction.cutAt(messages, 3)).toBe(4);
  });

  test("never leaves a tool result whose call was summarized away", () => {
    const messages = [user("a"), call("c1", "bump"), result("c1", "bump"), assistant("done")];
    // Two messages back is the result, and cutting there would send a tool response with no call above it.
    expect(Compaction.cutAt(messages, 2)).toBe(-1);
  });

  test("keeping nothing summarizes the whole transcript, and an empty one has nothing to cut", () => {
    expect(Compaction.cutAt([user("a"), assistant("b")], 0)).toBe(2);
    expect(Compaction.cutAt([], 0)).toBe(-1);
    expect(Compaction.cutAt([user("a")], 4)).toBe(-1);
  });
});

describe("Compaction.tokensOf", () => {
  test("estimates from the JSON a turn posts and ignores what is never sent", () => {
    const long = user("x".repeat(4000));
    expect(Compaction.tokensOf([long])).toBeGreaterThan(1000);
    expect(Compaction.tokensOf([{ role: "assistant", text: "y".repeat(4000), local: true }])).toBe(0);
  });
});

describe("Compaction.digest", () => {
  test("names every part of a message a summary would need", () => {
    const digest = Compaction.digest([
      user("trim the intro"),
      { role: "assistant", text: "on it", toolCalls: [{ id: "c1", name: "setSeconds", args: { seconds: 4 } }] },
      { role: "tool", toolResults: [{ id: "c1", name: "setSeconds", error: "refused" }] },
    ]);
    expect(digest).toContain("user: trim the intro");
    expect(digest).toContain('[called setSeconds {"seconds":4}]');
    expect(digest).toContain("[failed setSeconds: refused]");
  });

  test("an overlong digest gives way in the middle, keeping the earlier summary and where it now is", () => {
    const messages = [user("SUMMARY OF EVERYTHING"), ...Array.from({ length: 40 }, (_, at) => assistant(`m${at}`))];
    const digest = Compaction.digest(messages, 200);
    expect(digest.length).toBeLessThanOrEqual(260);
    expect(digest).toContain("SUMMARY OF EVERYTHING");
    expect(digest).toContain("m39");
    expect(digest).toContain("messages omitted");
  });

  test("clips one enormous message instead of letting it fill the digest", () => {
    const digest = Compaction.digest([user("x".repeat(5000))]);
    expect(digest.length).toBeLessThan(1400);
    expect(digest.endsWith("...")).toBe(true);
  });
});
