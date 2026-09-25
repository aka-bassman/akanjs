import type { LogRecord } from "./Logger";

/** A per-request ring the Logger hands every record to; the trace decides at its end whether any of it is shown. */
export interface LogFlightRecorder {
  minSev: number;
  capture(record: LogRecord, written: boolean): void;
}

export interface LogContextSnapshot {
  traceId: string | null;
  endpoint: string | null;
  origin: string | null;
  flight?: LogFlightRecorder | null;
  /** A per-request floor below the process level (`x-akan-debug`); `null` when the request asked for nothing. */
  debugSev?: number | null;
}

export type LogContextReader = () => LogContextSnapshot | undefined;

// Pinned to `process` for the reason `akanjs/signal/trace.ts` pins its ALS there: the akan worker evaluates the
// app bundle and the framework runtime as separate module realms, so a module-level slot would let the signal
// layer register a reader that the Logger instance in the other realm never sees.
const slot: { __akanLogContextReader?: LogContextReader | null } =
  typeof process === "undefined" ? {} : (process as unknown as { __akanLogContextReader?: LogContextReader | null });

export const registerLogContextReader = (reader: LogContextReader | null) => {
  slot.__akanLogContextReader = reader;
};

export const readLogContext = () => slot.__akanLogContextReader?.();
