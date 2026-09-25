import { Transform, type TransformCallback } from "node:stream";

type MarkerMatch = "none" | "partial" | "start" | "end";

const escapeByte = 0x1b;
const emptyBuffer = Buffer.alloc(0);
const startMarker = Buffer.from("\u001b[200~", "latin1");
const endMarker = Buffer.from("\u001b[201~", "latin1");
const markerLength = startMarker.length;

// Bracketed paste is the only way a terminal says where a paste begins and ends: readline drops the markers
// silently, so without them a pasted block is indistinguishable from lines typed one at a time.
export class ConsolePasteFilter extends Transform {
  static readonly enableSequence = "\u001b[?2004h";
  static readonly disableSequence = "\u001b[?2004l";
  readonly #onBoundary: () => void;
  #tail = emptyBuffer;
  #depth = 0;
  #lastByte = 0x0a;

  constructor(onBoundary: () => void) {
    super();
    this.#onBoundary = onBoundary;
  }

  get isPasting() {
    return this.#depth > 0;
  }

  get endsWithNewline() {
    return this.#lastByte === 0x0a || this.#lastByte === 0x0d;
  }

  override _transform(chunk: Buffer | string, encoding: BufferEncoding, callback: TransformCallback) {
    const incoming = typeof chunk === "string" ? Buffer.from(chunk, encoding) : chunk;
    const buffer = this.#tail.length ? Buffer.concat([this.#tail, incoming]) : incoming;
    this.#tail = emptyBuffer;
    let cursor = 0;
    let partialAt = -1;
    let index = buffer.indexOf(escapeByte);

    while (index >= 0) {
      const match = this.#matchMarker(buffer, index);
      if (match === "none") {
        index = buffer.indexOf(escapeByte, index + 1);
        continue;
      }
      if (match === "partial") {
        partialAt = index;
        break;
      }
      this.#forward(buffer.subarray(cursor, index));
      cursor = index + markerLength;
      if (match === "start") this.#depth += 1;
      else {
        this.#depth = Math.max(0, this.#depth - 1);
        this.#onBoundary();
      }
      index = buffer.indexOf(escapeByte, cursor);
    }

    this.#forward(buffer.subarray(cursor, partialAt >= 0 ? partialAt : buffer.length));
    if (partialAt >= 0) this.#tail = Buffer.from(buffer.subarray(partialAt));
    this.#onBoundary();
    callback();
  }

  override _flush(callback: TransformCallback) {
    const tail = this.#tail;
    this.#tail = emptyBuffer;
    this.#forward(tail);
    this.#onBoundary();
    callback();
  }

  #forward(data: Buffer) {
    if (!data.length) return;
    this.#lastByte = data[data.length - 1] ?? this.#lastByte;
    this.push(data);
  }

  #matchMarker(buffer: Buffer, index: number): MarkerMatch {
    const available = Math.min(buffer.length - index, markerLength);
    for (const [marker, match] of [
      [startMarker, "start"],
      [endMarker, "end"],
    ] as const) {
      if (!buffer.subarray(index, index + available).equals(marker.subarray(0, available))) continue;
      return available < markerLength ? "partial" : match;
    }
    return "none";
  }
}
