import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { type LogRecord, logSeverity } from "akanjs/common";
import { LogControlSocket } from "./logControlSocket";
import { LogHub, type LogHubEntry } from "./logHub";
import { LogControlUnavailableError, LogTailClient } from "./logTailClient";

const record = (message: string, overrides: Partial<LogRecord> = {}): LogRecord => ({
  at: Date.now(),
  elapsedMs: 0,
  level: "warn",
  sev: logSeverity.warn,
  name: "Svc",
  context: "",
  message,
  stream: "stdout",
  pid: 1,
  replicaIdx: 0,
  role: "all",
  origin: "http",
  traceId: "t-1",
  endpoint: "mutation:refund",
  ...overrides,
});

describe("LogTailClient", () => {
  let dir: string;
  let hub: LogHub;
  let control: LogControlSocket;

  beforeAll(async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), "akan-ltc-"));
    hub = new LogHub();
    control = new LogControlSocket(hub, dir);
    await control.start();
  });

  afterAll(async () => {
    await control.stop();
    hub.close();
    await rm(dir, { recursive: true, force: true });
  });

  test("names the socket the server binds", () => {
    expect(LogTailClient.socketPath(dir)).toBe(control.path);
  });

  test("subscribes, streams matching records, and answers history in order", async () => {
    const seen: LogHubEntry[] = [];
    const client = await LogTailClient.connect(control.path, { onRecord: (entry) => seen.push(entry) });
    const subscribed = await client.subscribe({ level: "warn" });
    expect(subscribed.query).toEqual({ minSev: logSeverity.warn });
    hub.ingest(record("first"));
    hub.ingest(record("quiet", { level: "info", sev: logSeverity.info }));
    for (let idx = 0; idx < 50 && seen.length < 1; idx += 1) await new Promise((r) => setTimeout(r, 5));
    expect(seen.map((entry) => entry.record.message)).toEqual(["first"]);
    const history = await client.history({ trace: "t-1" });
    expect(history.entries.map((entry) => entry.record.message)).toEqual(["first", "quiet"]);
    expect((await client.coverage()).count).toBe(2);
    await client.unsubscribe(subscribed.id);
    expect(hub.floor).toBeNull();
    client.close();
    expect(client.closed).toBe(true);
  });

  test("replay delivers the buffer before live records", async () => {
    const seen: string[] = [];
    const client = await LogTailClient.connect(control.path, { onRecord: (entry) => seen.push(entry.record.message) });
    await client.subscribe({ grep: "first" }, { replay: 5 });
    for (let idx = 0; idx < 50 && seen.length < 1; idx += 1) await new Promise((r) => setTimeout(r, 5));
    expect(seen).toEqual(["first"]);
    client.close();
  });

  test("a missing socket is a distinct error naming the path", async () => {
    const missing = path.join(dir, "nope.sock");
    await expect(LogTailClient.connect(missing, { onRecord: () => undefined })).rejects.toBeInstanceOf(
      LogControlUnavailableError,
    );
  });

  test("describes what the buffer covers", () => {
    expect(LogTailClient.describeCoverage({ count: 0, oldestSeq: null, newestSeq: null, from: null, to: null })).toBe(
      "buffer is empty",
    );
    expect(
      LogTailClient.describeCoverage({ count: 12, oldestSeq: 1, newestSeq: 12, from: 1_000, to: 200_000 }, 253_000),
    ).toBe("buffer covers last 4m12s (12 records)");
    expect(LogTailClient.formatDuration(3_723_000)).toBe("1h02m");
    expect(LogTailClient.formatDuration(9_000)).toBe("9s");
  });
});
