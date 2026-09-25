import { Logger, type LogLevel, type LogRecord, logSeverity } from "akanjs/common";

export type ChildOutputType = "stdout" | "stderr";

export interface ChildOutputReaderOptions {
  /** A complete stdout line, newline included. */
  onLine: (line: string) => void;
  /** A stderr block of newline-terminated lines; one stack trace arrives as one block. */
  onBlock: (lines: string[]) => void;
  blockMaxLines?: number;
  blockIdleMs?: number;
}

export interface ChildRecordInput {
  type: ChildOutputType;
  text: string;
  name: string;
  role: string | null;
  replicaIdx: number | null;
  pid: number | null;
}

/**
 * Splits a child process's stdout and stderr into lines. stderr is block-buffered — a runtime writes a stack
 * trace in many small writes and a reader wants it whole — and a block closes on a blank line, at
 * `blockMaxLines`, after `blockIdleMs` of silence, or when the stream ends.
 */
export class ChildOutputReader {
  static readonly defaultBlockMaxLines = 64;
  static readonly defaultBlockIdleMs = 50;

  readonly #onLine: (line: string) => void;
  readonly #onBlock: (lines: string[]) => void;
  readonly #blockMaxLines: number;
  readonly #blockIdleMs: number;
  readonly #partial: { [key in ChildOutputType]: string } = { stdout: "", stderr: "" };
  #block: string[] = [];
  #blockTimer: ReturnType<typeof setTimeout> | null = null;

  constructor({ onLine, onBlock, blockMaxLines, blockIdleMs }: ChildOutputReaderOptions) {
    this.#onLine = onLine;
    this.#onBlock = onBlock;
    this.#blockMaxLines = blockMaxLines ?? ChildOutputReader.defaultBlockMaxLines;
    this.#blockIdleMs = blockIdleMs ?? ChildOutputReader.defaultBlockIdleMs;
  }

  /**
   * Wraps what a child wrote past its Logger — a `console.*` call, a runtime error, a crash — as a record of the
   * process that read it, so an ndjson stdout stays one JSON line per event even for the line that killed a child.
   */
  static toRecord({ type, text, name, role, replicaIdx, pid }: ChildRecordInput): LogRecord {
    const level: LogLevel = type === "stderr" ? "error" : "info";
    const at = Date.now();
    return {
      at,
      elapsedMs: at - Logger.startAt,
      level,
      sev: logSeverity[level],
      name,
      context: "",
      message: text.replace(/\r?\n$/, ""),
      stream: type,
      pid,
      replicaIdx,
      role,
      origin: null,
      traceId: null,
      endpoint: null,
      attrs: { raw: true },
    };
  }

  async pipe(stream: ReadableStream<Uint8Array> | null | undefined, type: ChildOutputType): Promise<void> {
    if (!stream) return;
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        this.write(type, decoder.decode(value, { stream: true }));
      }
      const remaining = decoder.decode();
      if (remaining) this.write(type, remaining);
    } finally {
      this.flush(type);
    }
  }

  write(type: ChildOutputType, text: string) {
    let buffered = `${this.#partial[type]}${text}`;
    for (;;) {
      const newlineIdx = buffered.indexOf("\n");
      if (newlineIdx === -1) break;
      this.#line(type, buffered.slice(0, newlineIdx + 1));
      buffered = buffered.slice(newlineIdx + 1);
    }
    this.#partial[type] = buffered;
  }

  /** Ends the stream's partial line and, for stderr, the block it belongs to. */
  flush(type: ChildOutputType) {
    const partial = this.#partial[type];
    this.#partial[type] = "";
    if (partial) this.#line(type, `${partial}\n`);
    if (type === "stderr") this.flushBlock();
  }

  flushBlock() {
    if (this.#blockTimer) clearTimeout(this.#blockTimer);
    this.#blockTimer = null;
    if (!this.#block.length) return;
    const block = this.#block;
    this.#block = [];
    this.#onBlock(block);
  }

  close() {
    this.flush("stdout");
    this.flush("stderr");
  }

  #line(type: ChildOutputType, line: string) {
    if (type === "stdout") {
      this.#onLine(line);
      return;
    }
    this.#block.push(line);
    if (this.#blockTimer) clearTimeout(this.#blockTimer);
    this.#blockTimer = null;
    if (line.trim() === "" || this.#block.length >= this.#blockMaxLines) {
      this.flushBlock();
      return;
    }
    this.#blockTimer = setTimeout(() => this.flushBlock(), this.#blockIdleMs);
  }
}
