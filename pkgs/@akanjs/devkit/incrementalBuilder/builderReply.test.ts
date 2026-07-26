import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { BuilderReply } from "./builderReply";

const tempDirs: string[] = [];

afterEach(async () => {
  for (const dir of tempDirs.splice(0)) await rm(dir, { recursive: true, force: true });
});

/**
 * Run a child that answers a build request and exits immediately — the shape of the recycle drain
 * finishing its last work item — and report whatever the parent actually received.
 */
const replyThenExit = async (
  bytes: number,
  { awaitFlush }: { awaitFlush: boolean },
): Promise<{ id?: number } | null> => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "builder-reply-"));
  tempDirs.push(dir);
  const entry = path.join(dir, "child.ts");
  const modulePath = JSON.stringify(path.join(import.meta.dir, "builderReply"));
  const reply = awaitFlush ? "await BuilderReply.send(res as never);" : "process.send?.(res);";
  await Bun.write(
    entry,
    [
      `import { BuilderReply } from ${modulePath};`,
      'const chunk = "x".repeat(200);',
      "const moduleMap: Record<string, string> = {};",
      `for (let i = 0; i * 210 < ${bytes}; i++) moduleMap["chunk-" + i] = chunk;`,
      'const res = { type: "build-route-res", id: 7, ok: true, data: { ssrManifestDelta: moduleMap } };',
      reply,
      "process.exit(0);",
    ].join("\n"),
  );
  let received: { id?: number } | null = null;
  const proc = Bun.spawn(["bun", entry], {
    stdio: ["ignore", "inherit", "inherit"],
    serialization: "advanced",
    ipc: (message) => {
      received = message as { id?: number };
    },
  });
  await proc.exited;
  // Replies land before the exit callback, never after, but leave room for a straggler to prove it.
  await Bun.sleep(50);
  return received;
};

describe("BuilderReply.send", () => {
  test("delivers a reply too large for the pipe buffer before the process exits", async () => {
    expect(await replyThenExit(1_000_000, { awaitFlush: true })).toMatchObject({ id: 7 });
    // A manifest delta is usually well past the buffer, but the small case must keep working too.
    expect(await replyThenExit(0, { awaitFlush: true })).toMatchObject({ id: 7 });
  });

  test("without the flush wait the same reply is lost, which is why this class exists", async () => {
    // A control, not a requirement: if a future bun flushes ipc writes on exit, this fails and says so.
    expect(await replyThenExit(1_000_000, { awaitFlush: false })).toBeNull();
  });

  test("resolves instead of hanging when there is no ipc channel", async () => {
    const send = process.send;
    try {
      (process as { send?: typeof process.send }).send = undefined;
      await BuilderReply.send({ type: "build-csr-res", id: 1, ok: true });
    } finally {
      (process as { send?: typeof process.send }).send = send;
    }
  });
});
