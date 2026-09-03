import { describe, expect, test } from "bun:test";
import { logSeverity } from "akanjs/common";
import { ChildOutputReader } from "./childOutputReader";

const reader = (options: { blockIdleMs?: number; blockMaxLines?: number } = {}) => {
  const lines: string[] = [];
  const blocks: string[][] = [];
  const instance = new ChildOutputReader({
    onLine: (line) => lines.push(line),
    onBlock: (block) => blocks.push(block),
    ...options,
  });
  return { lines, blocks, instance };
};

describe("ChildOutputReader stdout", () => {
  test("emits a line as soon as it completes, however the chunks fell", () => {
    const { lines, instance } = reader();
    instance.write("stdout", "hel");
    instance.write("stdout", "lo\nwor");
    expect(lines).toEqual(["hello\n"]);
    instance.write("stdout", "ld\n\n");
    expect(lines).toEqual(["hello\n", "world\n", "\n"]);
  });

  test("a partial line is completed when the stream ends", async () => {
    const { lines, instance } = reader();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("a\nb"));
        controller.close();
      },
    });
    await instance.pipe(stream, "stdout");
    expect(lines).toEqual(["a\n", "b\n"]);
  });
});

describe("ChildOutputReader stderr", () => {
  test("gathers a stack into one block closed by a blank line", () => {
    const { blocks, instance } = reader();
    instance.write("stderr", "error: boom\n    at a\n    at b\n\n");
    expect(blocks).toEqual([["error: boom\n", "    at a\n", "    at b\n", "\n"]]);
  });

  test("closes a block at the line cap and after the idle timer", async () => {
    const { blocks, instance } = reader({ blockMaxLines: 2, blockIdleMs: 5 });
    instance.write("stderr", "1\n2\n3\n");
    expect(blocks).toEqual([["1\n", "2\n"]]);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(blocks).toEqual([["1\n", "2\n"], ["3\n"]]);
  });

  test("close flushes both partials and the pending block", () => {
    const { lines, blocks, instance } = reader({ blockIdleMs: 10_000 });
    instance.write("stdout", "tail");
    instance.write("stderr", "half");
    instance.close();
    expect(lines).toEqual(["tail\n"]);
    expect(blocks).toEqual([["half\n"]]);
  });
});

describe("ChildOutputReader.toRecord", () => {
  test("names the stream's level and marks the record raw", () => {
    const out = ChildOutputReader.toRecord({
      type: "stdout",
      text: "console said\n",
      name: "child",
      role: "all",
      replicaIdx: 1,
      pid: 42,
    });
    expect(out).toMatchObject({
      level: "info",
      sev: logSeverity.info,
      message: "console said",
      stream: "stdout",
      role: "all",
      replicaIdx: 1,
      pid: 42,
      attrs: { raw: true },
    });
    const err = ChildOutputReader.toRecord({
      type: "stderr",
      text: "error: boom\n    at a\n",
      name: "rsc-worker",
      role: "rsc-worker",
      replicaIdx: null,
      pid: null,
    });
    expect(err).toMatchObject({ level: "error", message: "error: boom\n    at a", stream: "stderr" });
  });
});
