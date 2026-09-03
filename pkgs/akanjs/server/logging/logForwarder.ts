import { Logger, type LogRecord } from "akanjs/common";
import type { AkanIpcMessage } from "akanjs/service";

export interface LogForwarderOptions {
  flushMs?: number;
  maxRecords?: number;
  maxBytes?: number;
  maxQueue?: number;
  maxMessageChars?: number;
}

/**
 * The child side of the log channel: a Logger sink that batches records over IPC to whoever owns the hub.
 * Installed only while the owner has asked for a level (`log.level`), so a process nobody is watching sends
 * nothing; `AKAN_LOG_STREAM=1` keeps it on regardless.
 */
export class LogForwarder {
  static readonly defaultFlushMs = 20;
  static readonly defaultMaxRecords = 64;
  /**
   * Bun IPC loses a message outright when the sender exits soon after and the payload is large — measured from
   * 16KB for one long string — and a small message queued behind it dies with it. Batches stay well under that.
   */
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
    if (this.#alwaysOn) this.setMinSev(null);
  }

  /** The severity floor in force, or `null` when nothing is forwarded. */
  get minSev(): number | null {
    return this.#alwaysOn ? Math.min(this.#minSev ?? 0, 0) : this.#minSev;
  }

  get active() {
    return this.#removeSink !== null;
  }

  get dropped() {
    return this.#dropped;
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

  /** Enqueues a record this process produced or relays for one below it; dropped when nobody is listening. */
  push(record: LogRecord) {
    const floor = this.minSev;
    if (floor === null) return;
    if (record.level !== null && record.sev < floor) return;
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
