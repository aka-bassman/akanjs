import { describe, expect, test } from "bun:test";
import { type LogRecord, logSeverity } from "akanjs/common";
import { LogQueryMatcher } from "./logQuery";

const record = (overrides: Partial<LogRecord> = {}): LogRecord => ({
  at: 1_000,
  elapsedMs: 0,
  level: "info",
  sev: logSeverity.info,
  name: "PaymentService",
  context: "",
  message: "payment refund started for order 1234",
  stream: "stdout",
  pid: 1,
  replicaIdx: 0,
  role: "all",
  origin: "http",
  traceId: "t-1",
  endpoint: "mutation:refundPayment",
  ...overrides,
});

const matches = (query: ConstructorParameters<typeof LogQueryMatcher>[0], overrides: Partial<LogRecord> = {}) =>
  new LogQueryMatcher(query).matches(record(overrides));

describe("LogQueryMatcher", () => {
  test("an empty query matches everything, raw lines included", () => {
    expect(matches({})).toBe(true);
    expect(matches({}, { level: null, sev: 0 })).toBe(true);
  });

  test("minSev keeps the level and above, and excludes raw lines", () => {
    expect(matches({ minSev: logSeverity.warn })).toBe(false);
    expect(matches({ minSev: logSeverity.info })).toBe(true);
    expect(matches({ minSev: logSeverity.info }, { level: "error", sev: logSeverity.error })).toBe(true);
    expect(matches({ minSev: 0 }, { level: null, sev: 0 })).toBe(false);
  });

  test("text is a substring of the message only", () => {
    expect(matches({ text: "refund" })).toBe(true);
    expect(matches({ text: "PaymentService" })).toBe(false);
  });

  test("endpoint and name accept * globs, and a record with no endpoint never matches one", () => {
    expect(matches({ endpoint: ["mutation:*"] })).toBe(true);
    expect(matches({ endpoint: ["*:refundPayment"] })).toBe(true);
    expect(matches({ endpoint: ["query:*"] })).toBe(false);
    expect(matches({ endpoint: ["mutation:*"] }, { endpoint: null })).toBe(false);
    expect(matches({ name: ["Payment*"] })).toBe(true);
    expect(matches({ name: ["User*", "Payment*"] })).toBe(true);
  });

  test("glob text outside * is literal", () => {
    expect(matches({ endpoint: ["mutation:refund.ayment"] })).toBe(false);
  });

  test("fields AND together and lists OR", () => {
    expect(matches({ minSev: logSeverity.info, text: "refund", endpoint: ["mutation:*"] })).toBe(true);
    expect(matches({ minSev: logSeverity.warn, text: "refund", endpoint: ["mutation:*"] })).toBe(false);
    expect(matches({ child: [1, 2] })).toBe(false);
    expect(matches({ child: [0, 2] })).toBe(true);
    expect(matches({ role: ["gateway"] })).toBe(false);
    expect(matches({ role: ["gateway", "all"] })).toBe(true);
    expect(matches({ origin: ["mcp"] })).toBe(false);
    expect(matches({ traceId: "t-2" })).toBe(false);
    expect(matches({ stream: ["stderr"] })).toBe(false);
    expect(matches({ since: 2_000 })).toBe(false);
    expect(matches({ since: 1_000 })).toBe(true);
  });
});

describe("LogQueryMatcher.parse", () => {
  test("reads a query string with level sugar, lists and a relative since", () => {
    const now = 100_000;
    const query = LogQueryMatcher.parse(
      new URLSearchParams(
        "level=warn&grep=payment&endpoint=mutation:*,query:userList&child=0&child=1&since=5s&limit=20",
      ),
      now,
    );
    expect(query).toEqual({
      minSev: logSeverity.warn,
      text: "payment",
      endpoint: ["mutation:*", "query:userList"],
      child: [0, 1],
      since: now - 5_000,
      limit: 20,
    });
  });

  test("reads a JSON object with the same keys", () => {
    expect(LogQueryMatcher.parse({ minSev: 13, name: ["A", "B"], traceId: "t" })).toEqual({
      minSev: 13,
      name: ["A", "B"],
      traceId: "t",
    });
  });

  test("the legacy log level name means info and garbage is dropped", () => {
    expect(LogQueryMatcher.parse({ level: "log" })).toEqual({ minSev: logSeverity.info });
    expect(LogQueryMatcher.parse({ level: "loud", since: "yesterday", limit: "-1" })).toEqual({});
  });
});

describe("LogQueryMatcher promoted records", () => {
  test("a flight or debug record passes minSev, since it was asked for below the level", () => {
    const matcher = new LogQueryMatcher({ minSev: logSeverity.warn });
    const base: LogRecord = {
      at: 1,
      elapsedMs: 0,
      level: "trace",
      sev: logSeverity.trace,
      name: "Svc",
      context: "",
      message: "m",
      stream: "stdout",
      pid: 1,
      replicaIdx: 0,
      role: "all",
      origin: null,
      traceId: null,
      endpoint: null,
    };
    expect(matcher.matches(base)).toBe(false);
    expect(matcher.matches({ ...base, attrs: { flight: true } })).toBe(true);
    expect(matcher.matches({ ...base, attrs: { debug: true } })).toBe(true);
    expect(
      new LogQueryMatcher({ minSev: logSeverity.warn, text: "x" }).matches({ ...base, attrs: { flight: true } }),
    ).toBe(false);
  });
});
