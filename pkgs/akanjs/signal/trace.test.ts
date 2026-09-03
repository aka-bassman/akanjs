import { afterEach, describe, expect, test } from "bun:test";
import { Logger, type LoggerSinkEntry } from "akanjs/common";
import {
  getCurrentTrace,
  runTraced,
  SignalTrace,
  setLogContextEnabled,
  setTraceEnabled,
  traceAggregator,
  traceSpan,
} from "./trace";

afterEach(() => {
  setTraceEnabled(false);
  setLogContextEnabled(true);
  traceAggregator.reset();
});

describe("SignalTrace.create", () => {
  test("is a context trace by default and a full trace under AKAN_TRACE", () => {
    setTraceEnabled(false);
    setLogContextEnabled(true);
    expect(SignalTrace.create("userList", "query", "http")?.mode).toBe("context");
    setTraceEnabled(true);
    expect(SignalTrace.create("userList", "query", "http")?.mode).toBe("full");
  });

  test("is null once both switches are off", () => {
    setTraceEnabled(false);
    setLogContextEnabled(false);
    expect(SignalTrace.create("userList", "query", "http")).toBeNull();
  });

  test("names the endpoint as type:key", () => {
    expect(SignalTrace.create("signScContract", "mutation", "http")?.endpoint).toBe("mutation:signScContract");
  });
});

describe("context mode", () => {
  test("counts nothing and never reaches the aggregator", async () => {
    const trace = new SignalTrace("userList", "query", { mode: "context" });
    await runTraced(trace, async () => {
      await traceSpan("guard", async () => undefined);
      getCurrentTrace()?.countDbQuery(3);
      getCurrentTrace()?.countCache(true);
    });
    expect(trace.spans).toEqual([]);
    expect(trace.dbQueryCount).toBe(0);
    expect(trace.cacheHits).toBe(0);
    expect(traceAggregator.snapshot().endpoints).toEqual([]);
  });

  test("full mode still aggregates", async () => {
    const trace = new SignalTrace("userList", "query", { mode: "full" });
    await runTraced(trace, async () => {
      getCurrentTrace()?.countDbQuery(3);
    });
    expect(trace.spans.map((span) => span.name)).toEqual(["total"]);
    expect(traceAggregator.snapshot().endpoints[0]?.endpoint).toBe("query:userList");
  });
});

describe("runTraced", () => {
  test("marks the outcome before the error reaches the caller, and finalizes after", async () => {
    const trace = new SignalTrace("userList", "query", { mode: "context" });
    let outcomeInCatch: string | null = null;
    await expect(
      runTraced(trace, async () => {
        throw new Error("boom");
      }).catch((error: unknown) => {
        outcomeInCatch = trace.outcome;
        throw error;
      }),
    ).rejects.toThrow("boom");
    expect(outcomeInCatch).toBe("error");
    expect(trace.error).toBeInstanceOf(Error);
  });

  test("a clean run is ok and the ambient trace is gone afterwards", async () => {
    const trace = new SignalTrace("userList", "query", { mode: "context" });
    await runTraced(trace, async () => {
      expect(getCurrentTrace()).toBe(trace);
    });
    expect(trace.outcome).toBe("ok");
    expect(getCurrentTrace()).toBeUndefined();
  });

  test("passes through with no trace", async () => {
    expect(await runTraced(null, async () => 7)).toBe(7);
  });
});

describe("log records inside a trace", () => {
  test("carry the traceId, endpoint and origin of the ambient trace", async () => {
    const entries: LoggerSinkEntry[] = [];
    const removeSink = Logger.addSink((entry) => entries.push(entry));
    const trace = new SignalTrace("signScContract", "mutation", { mode: "context", origin: "mcp" });
    try {
      Logger.setLevel("error");
      await runTraced(trace, async () => {
        Logger.info("inside", "", "TraceTest");
      });
      Logger.info("outside", "", "TraceTest");
      expect(entries[0]?.record).toMatchObject({
        traceId: trace.traceId,
        endpoint: "mutation:signScContract",
        origin: "mcp",
      });
      expect(entries[1]?.record).toMatchObject({ traceId: null, endpoint: null, origin: null });
    } finally {
      removeSink();
      Logger.setLevel("info");
    }
  });
});
