import { Logger, type LogRecord, logSeverity } from "akanjs/common";
import type { AkanIpcMessage } from "akanjs/service";

export interface LogForwarderOptions {
  flushMs?: number;
  maxRecords?: number;
  maxBytes?: number;
  maxQueue?: number;
  maxMessageChars?: number;
}

export class LogForwarder {
  static readonly defaultFlushMs = 20;
  static readonly defaultMaxRecords = 64;
  // Bun IPC drops a large message (and those queued behind it) when the sender exits soon after: keep batches small.
  static readonly defaultMaxBytes = 32 * 1024;
  static readonly defaultMaxQueue = 1_000;
  static readonly defaultMaxMessageChars = 16 * 1024;

  readonly #send: (message: AkanIpcMessage) => void;
  readonly #flushMs: number;
  readonly #maxRecords: number;
  readonly #maxBytes: number;
  readonly #maxQueue: number;
  readonly #maxMessageChars: number;
  readonly #alwaysOn = process.env.AKAN_LOG_STREAM === "1";
  // In an ndjson deployment this process writes nothing itself, so what the stdout level admits must go up.
  readonly #baseSev: number | null = Logger.isNdjson ? logSeverity[Logger.level] : null;
  #queue: LogRecord[] = [];
  #dropped = 0;
  #timer: ReturnType<typeof setTimeout> | null = null;
  #removeSink: (() => void) | null = null;
  #minSev: number | null = null;

  constructor(send: (message: AkanIpcMessage) => void, options: LogForwarderOptions = {}) {
    this.#send = send;
    this.#flushMs = options.flushMs ?? LogForwarder.defaultFlushMs;
    this.#maxRecords = options.maxRecords ?? LogForwarder.defaultMaxRecords;
    this.#maxBytes = options.maxBytes ?? LogForwarder.defaultMaxBytes;
    this.#maxQueue = options.maxQueue ?? LogForwarder.defaultMaxQueue;
    this.#maxMessageChars = options.maxMessageChars ?? LogForwarder.defaultMaxMessageChars;
    if (this.minSev !== null) this.setMinSev(null);
  }

  get minSev(): number | null {
    const base = this.#alwaysOn ? 0 : this.#baseSev;
    if (base === null) return this.#minSev;
    return this.#minSev === null ? base : Math.min(base, this.#minSev);
  }

  get active() {
    return this.#removeSink !== null;
  }

  setMinSev(minSev: number | null) {
    this.#minSev = minSev;
    const floor = this.minSev;
    this.#removeSink?.();
    this.#removeSink = null;
    if (floor === null) {
      this.flush();
      return;
    }
    this.#removeSink = Logger.addSink((entry) => this.push(entry.record), {
      minLevel: Logger.levelAtOrAbove(floor),
    });
  }

  push(record: LogRecord) {
    const floor = this.minSev;
    if (floor === null) return;
    if (record.level !== null && record.sev < floor && !Logger.isPromoted(record)) return;
    if (this.#queue.length >= this.#maxQueue) {
      this.#queue.shift();
      this.#dropped += 1;
    }
    this.#queue.push(this.#clip(record));
    if (this.#queue.length >= this.#maxRecords) this.flush();
    else this.#timer ??= setTimeout(() => this.flush(), this.#flushMs);
  }

  pushMany(records: LogRecord[]) {
    for (const record of records) this.push(record);
  }

  flush() {
    if (this.#timer) clearTimeout(this.#timer);
    this.#timer = null;
    while (this.#queue.length) {
      const batch: LogRecord[] = [];
      let bytes = 0;
      while (this.#queue.length && batch.length < this.#maxRecords) {
        const next = this.#queue[0] as LogRecord;
        const size = next.message.length + 200;
        if (batch.length && bytes + size > this.#maxBytes) break;
        batch.push(next);
        bytes += size;
        this.#queue.shift();
      }
      const dropped = this.#dropped;
      this.#dropped = 0;
      this.#send({ type: "log.records", records: batch, ...(dropped ? { dropped } : {}), pid: process.pid });
    }
  }

  close() {
    this.#removeSink?.();
    this.#removeSink = null;
    this.flush();
  }

  #clip(record: LogRecord): LogRecord {
    if (record.message.length <= this.#maxMessageChars) return record;
    const cut = record.message.length - this.#maxMessageChars;
    return { ...record, message: `${record.message.slice(0, this.#maxMessageChars)}…[truncated ${cut} chars]` };
  }
}
