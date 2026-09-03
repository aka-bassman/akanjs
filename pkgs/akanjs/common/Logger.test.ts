import { describe, expect, test } from "bun:test";
import dayjs from "dayjs";
import { Logger, type LoggerSinkEntry, type LogRecord, logSeverity } from "./Logger";
import { registerLogContextReader } from "./logContext";

const resetLoggerLevels = () => {
  Logger.setLevel("info");
  Logger.setFileLevel("trace");
};

describe("Logger sinks", () => {
  test("emits file sink entries independently from terminal log level", () => {
    const entries: LoggerSinkEntry[] = [];
    const removeSink = Logger.addSink((entry) => entries.push(entry));

    try {
      Logger.setLevel("error");
      Logger.setFileLevel("trace");
      Logger.trace("file only", "sink-test", "LoggerTest");

      expect(entries.length).toBe(1);
      expect(entries[0]?.level).toBe("trace");
      expect(entries[0]?.plainMessage.includes("file only")).toBe(true);
    } finally {
      removeSink();
      resetLoggerLevels();
    }
  });

  test("filters sink entries with AKAN_LOG_FILE_LEVEL semantics", () => {
    const entries: LoggerSinkEntry[] = [];
    const removeSink = Logger.addSink((entry) => entries.push(entry));

    try {
      Logger.setLevel("error");
      Logger.setFileLevel("warn");
      Logger.info("skip file", "sink-test", "LoggerTest");
      Logger.warn("keep file", "sink-test", "LoggerTest");

      expect(entries.map((entry) => entry.level)).toEqual(["warn"]);
      expect(entries[0]?.plainMessage.includes("keep file")).toBe(true);
    } finally {
      removeSink();
      resetLoggerLevels();
    }
  });

  test("a sink's own minLevel floors it independently of the file level", () => {
    const fileEntries: LoggerSinkEntry[] = [];
    const warnEntries: LoggerSinkEntry[] = [];
    const removeFile = Logger.addSink((entry) => fileEntries.push(entry));
    const removeWarn = Logger.addSink((entry) => warnEntries.push(entry), { minLevel: "warn" });

    try {
      Logger.setLevel("error");
      Logger.setFileLevel("trace");
      Logger.verbose("v", "", "LoggerTest");
      Logger.warn("w", "", "LoggerTest");

      expect(fileEntries.map((entry) => entry.level)).toEqual(["verbose", "warn"]);
      expect(warnEntries.map((entry) => entry.level)).toEqual(["warn"]);
    } finally {
      removeFile();
      removeWarn();
      resetLoggerLevels();
    }
  });

  test("nothing is built when every sink and the console reject the level", () => {
    const entries: LoggerSinkEntry[] = [];
    const removeSink = Logger.addSink((entry) => entries.push(entry), { minLevel: "warn" });

    try {
      Logger.setLevel("error");
      expect(Logger.shouldLog("info")).toBe(false);
      Logger.info("dropped", "", "LoggerTest");
      expect(entries).toEqual([]);
    } finally {
      removeSink();
      resetLoggerLevels();
    }
  });

  test("raw lines reach every sink regardless of its floor", () => {
    const entries: LoggerSinkEntry[] = [];
    const removeSink = Logger.addSink((entry) => entries.push(entry), { minLevel: "error" });

    try {
      Logger.raw("banner\n", "console");
      expect(entries.length).toBe(1);
      expect(entries[0]?.level).toBeUndefined();
      expect(entries[0]?.record.sev).toBe(0);
      expect(entries[0]?.message).toBe("banner\n");
    } finally {
      removeSink();
    }
  });
});

describe("Logger levels", () => {
  test("log() emits at info and the legacy level name normalizes", () => {
    const entries: LoggerSinkEntry[] = [];
    const removeSink = Logger.addSink((entry) => entries.push(entry));

    try {
      Logger.setLevel("error");
      Logger.setFileLevel("log");
      expect(Logger.fileLevel).toBe("info");
      Logger.log("legacy", "", "LoggerTest");
      Logger.debug("below", "", "LoggerTest");

      expect(entries.map((entry) => entry.level)).toEqual(["info"]);
      expect(entries[0]?.record.sev).toBe(logSeverity.info);
    } finally {
      removeSink();
      resetLoggerLevels();
    }
  });

  test("isVerbose follows the console level", () => {
    try {
      Logger.setLevel("verbose");
      expect(Logger.isVerbose()).toBe(true);
      Logger.setLevel("debug");
      expect(Logger.isVerbose()).toBe(false);
    } finally {
      resetLoggerLevels();
    }
  });
});

describe("Logger records", () => {
  test("renders the record into the historical console line", () => {
    const at = dayjs("2026-01-02T15:04:05.000").valueOf();
    const record: LogRecord = {
      at,
      elapsedMs: 4_200,
      level: "warn",
      sev: logSeverity.warn,
      name: "LoggerTest",
      context: "ctx",
      message: "hello",
      stream: "stdout",
      pid: 123,
      replicaIdx: 2,
      role: null,
      origin: null,
      traceId: null,
      endpoint: null,
    };
    const yellow = (text: string) => `\x1B[33m${text}\x1B[39m`;
    const rendered = Logger.render(record);
    const [head, tail] = rendered.split(" \x1B[33m+");
    expect(head).toBe(
      `${yellow("[LoggerTest] #2 123 -")} ${dayjs(at).format("MM/DD/YYYY, HH:mm:ss A")} ${yellow("   WARN")} ${yellow("[ctx] ")} ${yellow("hello")}`,
    );
    expect(tail).toBe(`4200ms${"\x1B"}[39m\n`);
  });

  test("sink entries expose the record and render text on demand", () => {
    const entries: LoggerSinkEntry[] = [];
    const removeSink = Logger.addSink((entry) => entries.push(entry));

    try {
      Logger.setLevel("error");
      Logger.info("structured", "ctx", "LoggerTest");
      const entry = entries[0];
      expect(entry?.record).toMatchObject({
        level: "info",
        sev: logSeverity.info,
        name: "LoggerTest",
        context: "ctx",
        message: "structured",
        stream: "stdout",
        pid: process.pid,
      });
      expect(entry?.message).toBe(Logger.render(entry?.record as LogRecord));
      expect(entry?.plainMessage).toContain("[LoggerTest]");
      expect(entry?.plainMessage).not.toContain("\x1B");
    } finally {
      removeSink();
      resetLoggerLevels();
    }
  });

  test("records carry whatever the registered context reader returns", () => {
    const entries: LoggerSinkEntry[] = [];
    const removeSink = Logger.addSink((entry) => entries.push(entry));
    registerLogContextReader(() => ({ traceId: "t-1", endpoint: "mutation:signScContract", origin: "http" }));

    try {
      Logger.setLevel("error");
      Logger.info("in context", "", "LoggerTest");
      expect(entries[0]?.record).toMatchObject({ traceId: "t-1", endpoint: "mutation:signScContract", origin: "http" });
    } finally {
      registerLogContextReader(null);
      removeSink();
      resetLoggerLevels();
    }
  });
});
