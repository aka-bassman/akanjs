import dayjs from "dayjs";
import { type LogContextSnapshot, readLogContext } from "./logContext";

export const logLevels = ["trace", "verbose", "debug", "info", "warn", "error"] as const;
export type LogLevel = (typeof logLevels)[number];
export type LogLevelInput = LogLevel | "log";

// OTel SeverityNumber bands: TRACE 1-4, DEBUG 5-8, INFO 9-12, WARN 13-16, ERROR 17-20. `verbose` is TRACE's upper tier.
export const logSeverity = { trace: 1, verbose: 3, debug: 5, info: 9, warn: 13, error: 17 } as const satisfies {
  [key in LogLevel]: number;
};

/** `text` is the human console line; the `ndjson` pair make the container's stdout one JSON record per line. */
export const logFormats = ["text", "ndjson", "ndjson-only"] as const;
export type LogFormat = (typeof logFormats)[number];

export type LogAttrValue = string | number | boolean | null;
export interface LogAttrs {
  [key: string]: LogAttrValue;
}

export interface LogRecord {
  at: number;
  /** Milliseconds since the producing process started — what the `+Nms` in the rendered line shows. */
  elapsedMs: number;
  level: LogLevel | null;
  sev: number;
  name: string;
  context: string;
  message: string;
  stream: "stdout" | "stderr";
  pid: number | null;
  replicaIdx: number | null;
  role: string | null;
  origin: string | null;
  traceId: string | null;
  endpoint: string | null;
  attrs?: LogAttrs;
}

export interface LoggerSinkEntry {
  stream: "stdout" | "stderr";
  level?: LogLevel;
  message: string;
  plainMessage: string;
  record: LogRecord;
}

export type LoggerSink = (entry: LoggerSinkEntry) => void | Promise<void>;

export interface LoggerSinkOptions {
  minLevel?: LogLevelInput;
}

export interface LoggerEmitInput {
  level: LogLevel;
  name: string;
  message: string;
  context?: string;
  attrs?: LogAttrs;
}

const clc = {
  bold: (text: string) => `\x1B[1m${text}\x1B[0m`,
  green: (text: string) => `\x1B[32m${text}\x1B[39m`,
  yellow: (text: string) => `\x1B[33m${text}\x1B[39m`,
  red: (text: string) => `\x1B[31m${text}\x1B[39m`,
  magentaBright: (text: string) => `\x1B[95m${text}\x1B[39m`,
  cyanBright: (text: string) => `\x1B[96m${text}\x1B[39m`,
};

const colorizeMap: { [key in LogLevel]: (text: string) => string } = {
  trace: clc.bold,
  verbose: clc.cyanBright,
  debug: clc.magentaBright,
  info: clc.green,
  warn: clc.yellow,
  error: clc.red,
};

const ansiPattern = new RegExp(`${String.fromCharCode(27)}\\[[0-?]*[ -/]*[@-~]`, "g");
// An attribute under one of these names is masked before the record exists, so no sink, socket or stdout
// line can carry it — the record may leave the process over the network.
const redactedAttrKey = /password|passwd|token|jwt|authorization|cookie|secret|api[-_]?key|private[-_]?key/i;

/** Log-level aware logger used by Akan runtime, CLI, and application services. */
export class Logger {
  /** `AKAN_LOG_STDOUT_LEVEL` names what the container's stdout carries; without it the console level is that. */
  static level: LogLevel = Logger.#levelFromEnv(
    process.env?.AKAN_LOG_STDOUT_LEVEL,
    Logger.#levelFromEnv(process.env?.AKAN_PUBLIC_LOG_LEVEL, "info"),
  );
  static fileLevel: LogLevel = Logger.#levelFromEnv(process.env?.AKAN_LOG_FILE_LEVEL, "trace");
  static format: LogFormat = Logger.#formatFromEnv(process.env?.AKAN_LOG_FORMAT);
  /** Which process this is (`gateway`, `all`, `batch`, `rsc-worker`); the owner sets it at boot. */
  static role: string | null = process.env?.SERVER_MODE ?? null;
  /**
   * Whether this process writes its own lines to the terminal. Off in every server process of an ndjson
   * deployment: the hub owner writes the one JSON stream, and a text line from anyone would corrupt it.
   */
  static consoleOutput = true;
  /** Set by the trace layer when a flight recorder or a per-request debug floor can be active. */
  static contextGate = false;
  static readonly startAt = Date.now();
  static #consoleSev: number = logSeverity[Logger.level];
  static #fileSev: number = logSeverity[Logger.fileLevel];
  static #sinkFloorSev = Number.POSITIVE_INFINITY;
  static #sinks = new Map<LoggerSink, number | null>();

  static setLevel(level: LogLevelInput) {
    Logger.level = Logger.normalizeLevel(level);
    Logger.#consoleSev = logSeverity[Logger.level];
  }
  static setFileLevel(level: LogLevelInput) {
    Logger.fileLevel = Logger.normalizeLevel(level);
    Logger.#fileSev = logSeverity[Logger.fileLevel];
    Logger.#refreshSinkFloor();
  }
  static addSink(sink: LoggerSink, { minLevel }: LoggerSinkOptions = {}) {
    Logger.#sinks.set(sink, minLevel === undefined ? null : logSeverity[Logger.normalizeLevel(minLevel)]);
    Logger.#refreshSinkFloor();
    return () => Logger.removeSink(sink);
  }
  static removeSink(sink: LoggerSink) {
    Logger.#sinks.delete(sink);
    Logger.#refreshSinkFloor();
  }
  static isVerbose() {
    return Logger.#consoleSev <= logSeverity.verbose;
  }
  static get isNdjson() {
    return Logger.format !== "text";
  }
  /** For hot-path callers that would otherwise build a message the level is about to discard. */
  static shouldLog(logLevel: LogLevelInput) {
    return Logger.#shouldLog(Logger.normalizeLevel(logLevel));
  }
  static normalizeLevel(level: LogLevelInput): LogLevel {
    return level === "log" ? "info" : level;
  }
  /** The lowest named level whose severity is at least `sev`. */
  static levelAtOrAbove(sev: number): LogLevel {
    return logLevels.find((level) => logSeverity[level] >= sev) ?? "error";
  }
  static render(record: LogRecord): string {
    const level = record.level;
    if (level === null) return record.message;
    const replicaMsg = record.replicaIdx === null ? "" : `#${record.replicaIdx} `;
    const processMsg = Logger.#colorize(`[${record.name}] ${replicaMsg}${record.pid ?? "window"} -`, level);
    const timestampMsg = dayjs(record.at).format("MM/DD/YYYY, HH:mm:ss A");
    const logLevelMsg = Logger.#colorize(level.toUpperCase().padStart(7, " "), level);
    const contextMsg = record.context ? clc.yellow(`[${record.context}] `) : "";
    const contentMsg = Logger.#colorize(record.message, level);
    const attrsMsg = record.attrs ? Logger.formatAttrs(record.attrs) : "";
    const timeDiffMsg = clc.yellow(`+${record.elapsedMs}ms`);
    return `${processMsg} ${timestampMsg} ${logLevelMsg} ${contextMsg} ${contentMsg}${attrsMsg ? ` ${attrsMsg}` : ""} ${timeDiffMsg}\n`;
  }
  /** `key=value` pairs; a string with whitespace is quoted so the line stays splittable. */
  static formatAttrs(attrs: LogAttrs): string {
    return Object.entries(attrs)
      .map(
        ([key, value]) =>
          `${key}=${typeof value === "string" && /\s/.test(value) ? JSON.stringify(value) : String(value)}`,
      )
      .join(" ");
  }
  /**
   * A record somebody asked for below the level — a failed call's flight recorder, a request carrying
   * `x-akan-debug` — passes every floor between here and the reader; the floors exist to drop what nobody asked for.
   */
  static isPromoted(record: LogRecord) {
    return record.attrs?.flight === true || record.attrs?.debug === true;
  }
  static redactAttrs(attrs: LogAttrs): LogAttrs {
    let redacted: LogAttrs | null = null;
    for (const key of Object.keys(attrs)) {
      if (!redactedAttrKey.test(key)) continue;
      redacted ??= { ...attrs };
      redacted[key] = "[redacted]";
    }
    return redacted ?? attrs;
  }
  /** A structured record from a caller that has more than a sentence to say — the canonical request line. */
  static emit({ level, name, message, context = "", attrs }: LoggerEmitInput) {
    if (Logger.#shouldLog(level)) Logger.#write(name, message, context, level, attrs);
  }
  /**
   * Writes records that were captured below the gate and are now promoted — a failed request's flight
   * recorder. They bypass the console level, since not showing them is what the recorder was for, and reach
   * sinks under their own floors; each is marked `flight` so a reader knows why a trace line appears at info.
   */
  static replay(records: LogRecord[], { evicted = 0 }: { evicted?: number } = {}) {
    records.forEach((record, idx) => {
      const attrs: LogAttrs = { ...record.attrs, flight: true };
      if (idx === 0 && evicted > 0) attrs.flightEvicted = evicted;
      const entry = Logger.#entry({ ...record, attrs });
      Logger.#emit(entry);
      Logger.#writeConsole(entry);
    });
  }

  name?: string;
  constructor(name?: string) {
    this.name = name;
  }
  trace(msg: string, context = "", name = this.name ?? "App") {
    if (Logger.#shouldLog("trace")) Logger.#write(name, msg, context, "trace");
  }
  verbose(msg: string, context = "", name = this.name ?? "App") {
    if (Logger.#shouldLog("verbose")) Logger.#write(name, msg, context, "verbose");
  }
  debug(msg: string, context = "", name = this.name ?? "App") {
    if (Logger.#shouldLog("debug")) Logger.#write(name, msg, context, "debug");
  }
  /** @deprecated Emits at `info`; call `info()`. */
  log(msg: string, context = "", name = this.name ?? "App") {
    if (Logger.#shouldLog("info")) Logger.#write(name, msg, context, "info");
  }
  info(msg: string, context = "", name = this.name ?? "App") {
    if (Logger.#shouldLog("info")) Logger.#write(name, msg, context, "info");
  }
  warn(msg: string, context = "", name = this.name ?? "App") {
    if (Logger.#shouldLog("warn")) Logger.#write(name, msg, context, "warn");
  }
  error(msg: string, context = "", name = this.name ?? "App") {
    if (Logger.#shouldLog("error")) Logger.#write(name, msg, context, "error");
  }
  raw(msg: string, method?: "console" | "process") {
    Logger.rawLog(msg, method);
  }
  rawLog(msg: string, method?: "console" | "process") {
    Logger.rawLog(msg, method);
  }
  static trace(msg: string, context = "", name = "App") {
    if (Logger.#shouldLog("trace")) Logger.#write(name, msg, context, "trace");
  }
  static verbose(msg: string, context = "", name = "App") {
    if (Logger.#shouldLog("verbose")) Logger.#write(name, msg, context, "verbose");
  }
  static debug(msg: string, context = "", name = "App") {
    if (Logger.#shouldLog("debug")) Logger.#write(name, msg, context, "debug");
  }
  /** @deprecated Emits at `info`; call `info()`. */
  static log(msg: string, context = "", name = "App") {
    if (Logger.#shouldLog("info")) Logger.#write(name, msg, context, "info");
  }
  static info(msg: string, context = "", name = "App") {
    if (Logger.#shouldLog("info")) Logger.#write(name, msg, context, "info");
  }
  static warn(msg: string, context = "", name = "App") {
    if (Logger.#shouldLog("warn")) Logger.#write(name, msg, context, "warn");
  }
  static error(msg: string, context = "", name = "App") {
    if (Logger.#shouldLog("error")) Logger.#write(name, msg, context, "error");
  }
  static #levelFromEnv(value: string | undefined, fallback: LogLevel): LogLevel {
    if (value === "log") return "info";
    return (logLevels as readonly string[]).includes(value ?? "") ? (value as LogLevel) : fallback;
  }
  static #formatFromEnv(value: string | undefined): LogFormat {
    return (logFormats as readonly string[]).includes(value ?? "") ? (value as LogFormat) : "text";
  }
  static #refreshSinkFloor() {
    let floor = Number.POSITIVE_INFINITY;
    for (const minSev of Logger.#sinks.values()) floor = Math.min(floor, minSev ?? Logger.#fileSev);
    Logger.#sinkFloorSev = floor;
  }
  static #colorize(msg: string, logLevel: LogLevel) {
    return colorizeMap[logLevel](msg);
  }
  static stripAnsi(msg: string) {
    return msg.replace(ansiPattern, "");
  }
  static #shouldLog(logLevel: LogLevel) {
    if (Logger.#shouldWriteConsole(logLevel) || Logger.#shouldEmitSink(logLevel)) return true;
    return Logger.contextGate && Logger.#contextFloor(readLogContext()) <= logSeverity[logLevel];
  }
  static #shouldWriteConsole(logLevel: LogLevel) {
    return Logger.consoleOutput && logSeverity[logLevel] >= Logger.#consoleSev;
  }
  static #shouldEmitSink(logLevel: LogLevel) {
    return logSeverity[logLevel] >= Logger.#sinkFloorSev;
  }
  /** The lowest severity the ambient request wants captured or shown, or +∞ outside one. */
  static #contextFloor(ctx: LogContextSnapshot | undefined) {
    if (!ctx) return Number.POSITIVE_INFINITY;
    return Math.min(ctx.flight?.minSev ?? Number.POSITIVE_INFINITY, ctx.debugSev ?? Number.POSITIVE_INFINITY);
  }
  static #buildRecord(
    name: string | undefined,
    message: string,
    context: string,
    level: LogLevel | null,
    stream: "stdout" | "stderr",
    ctx: LogContextSnapshot | undefined,
    attrs?: LogAttrs,
  ): LogRecord {
    const proc = process as unknown as NodeJS.Process | undefined;
    const replicaIdx = Number(proc?.env?.AKAN_REPLICA_IDX ?? Number.NaN);
    const at = Date.now();
    return {
      at,
      elapsedMs: at - Logger.startAt,
      level,
      sev: level === null ? 0 : logSeverity[level],
      name: name ?? "App",
      context,
      message,
      stream,
      pid: proc?.pid ?? null,
      replicaIdx: Number.isNaN(replicaIdx) ? null : replicaIdx,
      role: Logger.role,
      origin: ctx?.origin ?? null,
      traceId: ctx?.traceId ?? null,
      endpoint: ctx?.endpoint ?? null,
      ...(attrs ? { attrs: Logger.redactAttrs(attrs) } : {}),
    };
  }
  static #entry(record: LogRecord, text?: string): LoggerSinkEntry {
    let message = text;
    let plainMessage: string | undefined;
    return {
      stream: record.stream,
      level: record.level ?? undefined,
      record,
      get message() {
        message ??= Logger.render(record);
        return message;
      },
      get plainMessage() {
        plainMessage ??= Logger.stripAnsi(this.message);
        return plainMessage;
      },
    };
  }
  static #emit(entry: LoggerSinkEntry) {
    for (const [sink, minSev] of Logger.#sinks) {
      // A raw line (CLI banner, spinner) carries no level and reaches every sink, as it did before sink floors.
      if (
        entry.record.level !== null &&
        entry.record.sev < (minSev ?? Logger.#fileSev) &&
        !Logger.isPromoted(entry.record)
      )
        continue;
      try {
        void Promise.resolve(sink(entry)).catch(() => undefined);
      } catch {
        // Log sinks are observers; they must not break application logging.
      }
    }
  }
  static #writeConsole(entry: LoggerSinkEntry) {
    if (!Logger.consoleOutput) return;
    if (typeof window === "undefined")
      (process[entry.stream] as unknown as NodeJS.WriteStream | undefined)?.write(entry.message);
    // biome-ignore lint/suspicious/noConsole: browser fallback
    else console.log(entry.message);
  }
  static #write(name: string | undefined, message: string, context: string, logLevel: LogLevel, attrs?: LogAttrs) {
    const stream = logLevel === "error" ? "stderr" : "stdout";
    const ctx = readLogContext();
    const sev = logSeverity[logLevel];
    const debug = ctx?.debugSev !== undefined && ctx.debugSev !== null && sev >= ctx.debugSev;
    // Marked when the request's floor, not the process level, is what admits it — the mark is what carries it
    // past every later floor (a forwarder's, the stdout writer's) that would otherwise drop it as unasked-for.
    const promoted = debug && sev < Logger.#consoleSev;
    const record = Logger.#buildRecord(
      name,
      message,
      context,
      logLevel,
      stream,
      ctx,
      promoted ? { ...attrs, debug: true } : attrs,
    );
    const toConsole = Logger.#shouldWriteConsole(logLevel) || (debug && Logger.consoleOutput);
    const toSinks = Logger.#shouldEmitSink(logLevel) || debug;
    ctx?.flight?.capture(record, toConsole || toSinks);
    if (!toConsole && !toSinks) return;
    const entry = Logger.#entry(record);
    if (toSinks) Logger.#emit(entry);
    if (toConsole) Logger.#writeConsole(entry);
  }
  static rawLog(msg = "", method?: "console" | "process", outputStream?: "log" | "error") {
    Logger.raw(`${msg}\n`, method, outputStream);
  }
  static raw(msg = "", method?: "console" | "process", outputStream?: "log" | "error") {
    const stream = outputStream === "error" ? "stderr" : "stdout";
    Logger.#emit(Logger.#entry(Logger.#buildRecord(undefined, msg, "", null, stream, readLogContext()), msg));
    if (!Logger.consoleOutput) return;
    if (typeof window === "undefined" && method !== "console" && (process as unknown as NodeJS.Process | undefined))
      process[stream].write(msg);
    // biome-ignore lint/suspicious/noConsole: browser fallback
    else console[outputStream === "error" ? "error" : "log"](msg.trim());
  }
  static {
    if (process.env?.AKAN_PUBLIC_LOG_LEVEL === "log" && typeof window === "undefined")
      Logger.warn("AKAN_PUBLIC_LOG_LEVEL=log is deprecated and now means info; set AKAN_PUBLIC_LOG_LEVEL=info.");
  }
}
