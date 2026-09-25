import { describe, expect, test } from "bun:test";
import { type LogRecord, logSeverity } from "akanjs/common";
import { HubFileSink } from "./hubFileSink";
import { LogHub } from "./logHub";
import { LogStdoutWriter } from "./logStdoutWriter";
import type { RotatingLogWriter } from "./rotatingLogWriter";

const record = (message: string, overrides: Partial<LogRecord> = {}): LogRecord => ({
  at: 1_000,
  elapsedMs: 0,
  level: "info",
  sev: logSeverity.info,
  name: "Svc",
  context: "",
  message,
  stream: "stdout",
  pid: 1,
  replicaIdx: 0,
  role: "all",
  origin: null,
  traceId: null,
  endpoint: null,
  ...overrides,
});

describe("LogStdoutWriter", () => {
  test("writes one JSON line per admitted record, seq first, and nothing below the level or without one", () => {
    const hub = new LogHub();
    const lines: string[] = [];
    const writer = new LogStdoutWriter(hub, { minSev: logSeverity.info, write: (line) => lines.push(line) });
    hub.ingest(record("shown", { attrs: { ms: 3 } }));
    hub.ingest(record("quiet", { level: "debug", sev: logSeverity.debug }));
    hub.ingest(record("banner", { level: null, sev: 0 }));
    expect(lines.length).toBe(1);
    expect(lines[0]?.endsWith("\n")).toBe(true);
    expect(JSON.parse(lines[0] ?? "")).toMatchObject({ seq: 1, message: "shown", attrs: { ms: 3 } });
    expect(hub.floor).toBe(logSeverity.info);
    writer.close();
    expect(hub.floor).toBeNull();
    hub.close();
  });
});

describe("HubFileSink", () => {
  const fakeWriter = () => {
    const writes: [string, string][] = [];
    return {
      writes,
      writer: { write: (key: string, chunk: string) => writes.push([key, chunk]) } as unknown as RotatingLogWriter,
    };
  };

  test("keys the file by the producing process and renders text by default", () => {
    const hub = new LogHub();
    const { writes, writer } = fakeWriter();
    const sink = new HubFileSink(hub, writer, { minSev: logSeverity.trace, json: false });
    hub.ingest(record("own", { role: "gateway", replicaIdx: null }));
    hub.ingest(record("child", { role: "all", replicaIdx: 1 }));
    hub.ingest(record("worker", { role: "rsc-worker", replicaIdx: 0 }));
    expect(writes.map(([key]) => key)).toEqual(["gateway", "1-all", "0-rsc-worker"]);
    expect(writes[0]?.[1]).toContain("[Svc] 1 -");
    expect(writes[0]?.[1]).toContain(" own +");
    expect(writes[0]?.[1]).not.toContain("\x1B");
    sink.close();
    hub.close();
  });

  test("ndjson-only writes the same JSON line the stdout carries", () => {
    const hub = new LogHub();
    const { writes, writer } = fakeWriter();
    const sink = new HubFileSink(hub, writer, { minSev: logSeverity.trace, json: true });
    hub.ingest(record("own"));
    expect(JSON.parse(writes[0]?.[1] ?? "")).toMatchObject({ seq: 1, message: "own" });
    sink.close();
    hub.close();
  });
});
