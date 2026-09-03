import { afterEach, describe, expect, test } from "bun:test";
import { Logger, type LogRecord, logSeverity } from "akanjs/common";
import type { AkanIpcMessage } from "akanjs/service";
import { LogForwarder } from "./logForwarder";

type LogBatch = Extract<AkanIpcMessage, { type: "log.records" }>;

const record = (message: string, overrides: Partial<LogRecord> = {}): LogRecord => ({
  at: 1,
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

const collect = () => {
  const sent: LogBatch[] = [];
  const send = (message: AkanIpcMessage) => {
    if (message.type === "log.records") sent.push(message);
  };
  return { sent, send };
};

afterEach(() => {
  Logger.setLevel("info");
  Logger.setFileLevel("trace");
});

describe("LogForwarder", () => {
  test("sends nothing until a level is set, then batches by count", () => {
    const { sent, send } = collect();
    const forwarder = new LogForwarder(send, { maxRecords: 2 });
    forwarder.push(record("ignored"));
    expect(sent).toEqual([]);
    forwarder.setMinSev(0);
    forwarder.push(record("a"));
    expect(sent).toEqual([]);
    forwarder.push(record("b"));
    expect(sent.length).toBe(1);
    expect(sent[0]?.records.map((entry) => entry.message)).toEqual(["a", "b"]);
    forwarder.close();
  });

  test("flushes a partial batch on the timer", async () => {
    const { sent, send } = collect();
    const forwarder = new LogForwarder(send, { flushMs: 5 });
    forwarder.setMinSev(0);
    forwarder.push(record("late"));
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(sent.length).toBe(1);
    forwarder.close();
  });

  test("splits a batch by bytes", () => {
    const { sent, send } = collect();
    const forwarder = new LogForwarder(send, { maxBytes: 1_000, maxMessageChars: 700 });
    forwarder.setMinSev(0);
    forwarder.push(record("x".repeat(600)));
    forwarder.push(record("y".repeat(600)));
    forwarder.flush();
    expect(sent.map((batch) => batch.records.length)).toEqual([1, 1]);
    forwarder.close();
  });

  test("clips a message longer than the cap and says how much went", () => {
    const { sent, send } = collect();
    const forwarder = new LogForwarder(send, { maxMessageChars: 100 });
    forwarder.setMinSev(0);
    forwarder.push(record("x".repeat(600)));
    forwarder.flush();
    expect(sent[0]?.records[0]?.message).toBe(`${"x".repeat(100)}…[truncated 500 chars]`);
    forwarder.close();
  });

  test("drops the oldest past the queue cap and reports the count with the next batch", () => {
    const { sent, send } = collect();
    const forwarder = new LogForwarder(send, { maxQueue: 2, maxRecords: 10 });
    forwarder.setMinSev(0);
    forwarder.push(record("1"));
    forwarder.push(record("2"));
    forwarder.push(record("3"));
    forwarder.flush();
    expect(sent[0]?.records.map((entry) => entry.message)).toEqual(["2", "3"]);
    expect(sent[0]?.dropped).toBe(1);
    forwarder.close();
  });

  test("below the floor is dropped, raw lines pass", () => {
    const { sent, send } = collect();
    const forwarder = new LogForwarder(send);
    forwarder.setMinSev(logSeverity.warn);
    forwarder.push(record("info"));
    forwarder.push(record("banner", { level: null, sev: 0 }));
    forwarder.push(record("warn", { level: "warn", sev: logSeverity.warn }));
    forwarder.flush();
    expect(sent[0]?.records.map((entry) => entry.message)).toEqual(["banner", "warn"]);
    forwarder.close();
  });

  test("installs a Logger sink at the floor and removes it on null", () => {
    const { sent, send } = collect();
    const forwarder = new LogForwarder(send);
    Logger.setLevel("error");
    forwarder.setMinSev(logSeverity.warn);
    expect(forwarder.active).toBe(true);
    Logger.info("not forwarded", "", "ForwarderTest");
    Logger.warn("forwarded", "", "ForwarderTest");
    forwarder.flush();
    expect(sent.length).toBe(1);
    expect(sent[0]?.records.map((entry) => entry.message)).toEqual(["forwarded"]);
    forwarder.setMinSev(null);
    expect(forwarder.active).toBe(false);
    Logger.warn("after", "", "ForwarderTest");
    forwarder.flush();
    expect(sent.length).toBe(1);
    forwarder.close();
  });
});
