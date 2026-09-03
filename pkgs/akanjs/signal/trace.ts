import { AsyncLocalStorage } from "node:async_hooks";
import { registerLogContextReader } from "akanjs/common";

/**
 * Request tracing for Akan signals, in two modes.
 *
 * `context` is on by default, production included: it carries only the identity a log record needs
 * (`traceId`, endpoint, origin) and costs one `als.run` per call (~25ns measured). `AKAN_LOG_CONTEXT=0` is
 * the emergency exit. `full` adds the per-stage spans, query counts and cache ratio the metrics endpoint
 * aggregates, and stays behind `AKAN_TRACE=1` because those are for performance work, not for every request.
 */

let traceEnabledCache: boolean | null = null;
let logContextEnabledCache: boolean | null = null;

/** Whether full request tracing (`AKAN_TRACE=1`) is enabled. Cached after first read. */
export const isTraceEnabled = (): boolean => {
  if (traceEnabledCache === null) traceEnabledCache = process.env.AKAN_TRACE === "1";
  return traceEnabledCache;
};

/** Override the trace flag at runtime (tests / harness control). */
export const setTraceEnabled = (enabled: boolean): void => {
  traceEnabledCache = enabled;
};

export const isLogContextEnabled = (): boolean => {
  if (logContextEnabledCache === null)
    logContextEnabledCache = !(process.env.AKAN_LOG_CONTEXT === "0" || process.env.AKAN_LOG_CONTEXT === "false");
  return logContextEnabledCache;
};

export const setLogContextEnabled = (enabled: boolean): void => {
  logContextEnabledCache = enabled;
};

export interface SpanRecord {
  name: string;
  durationMs: number;
}

export type TraceMode = "context" | "full";
export type TraceOrigin = "http" | "websocket" | "mcp" | "internal" | "page";
export type TraceOutcome = "ok" | "error";

const MAX_SPANS_PER_TRACE = 64;

/** Per-request trace context. Threaded via {@link AsyncLocalStorage}. */
export class SignalTrace {
  readonly traceId: string;
  readonly endpointKey: string;
  readonly endpointType: string;
  readonly origin: TraceOrigin;
  readonly mode: TraceMode;
  readonly startedAt: number;
  readonly spans: SpanRecord[] = [];
  dbQueryCount = 0;
  dbQueryMs = 0;
  cacheHits = 0;
  cacheMisses = 0;
  dataLoaderBatchCount = 0;
  dataLoaderKeyCount = 0;
  outcome: TraceOutcome | null = null;
  error: unknown = null;
  #finalized = false;

  constructor(
    endpointKey: string,
    endpointType: string,
    { mode = "full", origin = "http" }: { mode?: TraceMode; origin?: TraceOrigin } = {},
  ) {
    this.endpointKey = endpointKey;
    this.endpointType = endpointType;
    this.mode = mode;
    this.origin = origin;
    this.startedAt = performance.now();
    this.traceId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  /** The trace a call runs under given what is switched on, or `null` when both modes are off. */
  static create(endpointKey: string, endpointType: string, origin: TraceOrigin): SignalTrace | null {
    if (isTraceEnabled()) return new SignalTrace(endpointKey, endpointType, { mode: "full", origin });
    if (isLogContextEnabled()) return new SignalTrace(endpointKey, endpointType, { mode: "context", origin });
    return null;
  }

  get endpoint() {
    return `${this.endpointType}:${this.endpointKey}`;
  }

  recordSpan(name: string, durationMs: number): void {
    if (this.mode !== "full" || this.spans.length >= MAX_SPANS_PER_TRACE) return;
    this.spans.push({ name, durationMs });
  }

  countDbQuery(durationMs: number): void {
    if (this.mode !== "full") return;
    this.dbQueryCount += 1;
    this.dbQueryMs += durationMs;
  }

  countCache(hit: boolean): void {
    if (this.mode !== "full") return;
    if (hit) this.cacheHits += 1;
    else this.cacheMisses += 1;
  }

  countDataLoaderBatch(keyCount: number): void {
    if (this.mode !== "full") return;
    this.dataLoaderBatchCount += 1;
    this.dataLoaderKeyCount += keyCount;
  }

  fail(error: unknown): void {
    this.outcome = "error";
    this.error = error;
  }

  finalize(): void {
    if (this.#finalized) return;
    this.#finalized = true;
    this.outcome ??= "ok";
    if (this.mode !== "full") return;
    const totalMs = performance.now() - this.startedAt;
    this.recordSpan("total", totalMs);
    traceAggregator.ingest(this);
    maybeFlushTraceFile();
  }
}

// Shared across bundle chunks (see traceAggregator note) so that span/db/cache helpers
// invoked from other modules (database.resolver, middleware) observe the active trace.
// Shared store pinned to `process`. The akan worker loads the app server bundle and the
// framework runtime in separate module realms (each with its own `globalThis`), so the
// signal layer that records spans and the metrics collector that reads them would otherwise
// hold different singletons. `process` is the one object shared across realms in a single OS
// process, so we hang the trace ALS + aggregator off it to guarantee a single instance.
const traceProcessStore = process as unknown as {
  __akanTraceAls?: AsyncLocalStorage<SignalTrace>;
  __akanTraceAggregator?: TraceAggregator;
};

let alsInstance = traceProcessStore.__akanTraceAls;
if (!alsInstance) {
  alsInstance = new AsyncLocalStorage<SignalTrace>();
  traceProcessStore.__akanTraceAls = alsInstance;
}
const als = alsInstance;

export const getCurrentTrace = (): SignalTrace | undefined => als.getStore();

/** Run `fn` with `trace` as the ambient request trace. */
export const runWithTrace = <T>(trace: SignalTrace, fn: () => T): T => als.run(trace, fn);

/**
 * Run `fn` as the whole life of `trace`: a throw marks the outcome before it propagates, and the trace is
 * finalized after the caller's own catch has run — which is what lets an error log carry the traceId.
 */
export const runTraced = async <T>(trace: SignalTrace | null, fn: () => Promise<T>): Promise<T> => {
  if (!trace) return await fn();
  return await als.run(trace, async () => {
    try {
      return await fn();
    } catch (error) {
      trace.fail(error);
      throw error;
    } finally {
      trace.finalize();
    }
  });
};

registerLogContextReader(() => {
  const trace = als.getStore();
  return trace ? { traceId: trace.traceId, endpoint: trace.endpoint, origin: trace.origin } : undefined;
});

/**
 * Time an async stage under the current trace. When tracing is off (or no trace is
 * active) this is a thin passthrough with no measurement overhead.
 */
export const traceSpan = async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
  const trace = getCurrentTrace();
  if (trace?.mode !== "full") return await fn();
  const start = performance.now();
  try {
    return await fn();
  } finally {
    trace.recordSpan(name, performance.now() - start);
  }
};

/** Record a DB query duration against the current trace (no-op when untraced). */
export const traceDbQuery = (durationMs: number): void => {
  getCurrentTrace()?.countDbQuery(durationMs);
};

/** Record a cache hit/miss against the current trace (no-op when untraced). */
export const traceCache = (hit: boolean): void => {
  getCurrentTrace()?.countCache(hit);
};

/** Record a DataLoader batch against the current trace (no-op when untraced). */
export const traceDataLoaderBatch = (keyCount: number): void => {
  getCurrentTrace()?.countDataLoaderBatch(keyCount);
};

interface SpanStat {
  count: number;
  sumMs: number;
  maxMs: number;
  samples: number[];
}

interface EndpointStat {
  endpointKey: string;
  endpointType: string;
  requests: number;
  spans: Map<string, SpanStat>;
  dbQueryCount: number;
  dbQueryMs: number;
  cacheHits: number;
  cacheMisses: number;
  dataLoaderBatchCount: number;
  dataLoaderKeyCount: number;
}

const RING_SIZE = 1024;

const percentile = (sorted: number[], p: number): number => {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx] ?? 0;
};

/**
 * Process-wide aggregator. Keeps rolling per-endpoint, per-span statistics with a
 * bounded sample ring per span so percentiles stay representative of steady state
 * without unbounded memory growth.
 */
class TraceAggregator {
  #endpoints = new Map<string, EndpointStat>();

  ingest(trace: SignalTrace): void {
    const id = `${trace.endpointType}:${trace.endpointKey}`;
    let stat = this.#endpoints.get(id);
    if (!stat) {
      stat = {
        endpointKey: trace.endpointKey,
        endpointType: trace.endpointType,
        requests: 0,
        spans: new Map(),
        dbQueryCount: 0,
        dbQueryMs: 0,
        cacheHits: 0,
        cacheMisses: 0,
        dataLoaderBatchCount: 0,
        dataLoaderKeyCount: 0,
      };
      this.#endpoints.set(id, stat);
    }
    stat.requests += 1;
    stat.dbQueryCount += trace.dbQueryCount;
    stat.dbQueryMs += trace.dbQueryMs;
    stat.cacheHits += trace.cacheHits;
    stat.cacheMisses += trace.cacheMisses;
    stat.dataLoaderBatchCount += trace.dataLoaderBatchCount;
    stat.dataLoaderKeyCount += trace.dataLoaderKeyCount;
    for (const span of trace.spans) {
      let spanStat = stat.spans.get(span.name);
      if (!spanStat) {
        spanStat = { count: 0, sumMs: 0, maxMs: 0, samples: [] };
        stat.spans.set(span.name, spanStat);
      }
      spanStat.count += 1;
      spanStat.sumMs += span.durationMs;
      spanStat.maxMs = Math.max(spanStat.maxMs, span.durationMs);
      if (spanStat.samples.length < RING_SIZE) spanStat.samples.push(span.durationMs);
      else spanStat.samples[spanStat.count % RING_SIZE] = span.durationMs;
    }
  }

  reset(): void {
    this.#endpoints.clear();
  }

  /** Summarized snapshot suitable for JSON exposure on the metrics endpoint. */
  snapshot() {
    const endpoints = [...this.#endpoints.values()].map((stat) => {
      const spans = [...stat.spans.entries()].map(([name, s]) => {
        const sorted = [...s.samples].sort((a, b) => a - b);
        return {
          name,
          count: s.count,
          meanMs: round(s.sumMs / s.count),
          p50Ms: round(percentile(sorted, 50)),
          p95Ms: round(percentile(sorted, 95)),
          p99Ms: round(percentile(sorted, 99)),
          maxMs: round(s.maxMs),
        };
      });
      spans.sort((a, b) => b.meanMs - a.meanMs);
      const cacheTotal = stat.cacheHits + stat.cacheMisses;
      return {
        endpoint: `${stat.endpointType}:${stat.endpointKey}`,
        requests: stat.requests,
        avgDbQueriesPerRequest: round(stat.dbQueryCount / stat.requests),
        avgDbQueryMsPerRequest: round(stat.dbQueryMs / stat.requests),
        cacheHitRatio: cacheTotal ? round(stat.cacheHits / cacheTotal, 4) : null,
        avgDataLoaderBatchSize: stat.dataLoaderBatchCount
          ? round(stat.dataLoaderKeyCount / stat.dataLoaderBatchCount)
          : null,
        spans,
      };
    });
    endpoints.sort((a, b) => b.requests - a.requests);
    return { enabled: isTraceEnabled(), endpoints };
  }
}

const round = (value: number, digits = 3): number => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

// The akan build can bundle this module into more than one chunk (e.g. the signal layer
// that writes spans vs. the metrics collector that reads them). A plain module-level
// singleton would then diverge per chunk, so pin it to `process` (see above) to guarantee
// that every copy of this module shares one aggregator within the process.
let aggregatorInstance = traceProcessStore.__akanTraceAggregator;
if (!aggregatorInstance) {
  aggregatorInstance = new TraceAggregator();
  traceProcessStore.__akanTraceAggregator = aggregatorInstance;
}
export const traceAggregator: TraceAggregator = aggregatorInstance;

/** Snapshot of all aggregated trace stats. Safe to call when tracing is disabled. */
export const getTraceSnapshot = () => traceAggregator.snapshot();

/**
 * Optional file sink for the aggregated snapshot.
 *
 * The akan worker loads the app-server bundle and the framework metrics collector in
 * separate module realms that share neither `globalThis` nor `process`, so the in-realm
 * aggregator that records spans cannot be read by the metrics endpoint's collector. When
 * `AKAN_TRACE_FILE` is set, the recording realm instead flushes the cumulative snapshot to
 * that path (throttled), where any external reader (e.g. the benchmark harness) can pick it
 * up. This is a benchmarking/diagnostics aid, not a production hot-path concern.
 */
const traceFilePath = process.env.AKAN_TRACE_FILE;
let lastTraceFlushAt = 0;
const TRACE_FLUSH_INTERVAL_MS = 1_000;

const maybeFlushTraceFile = (): void => {
  if (!traceFilePath) return;
  const now = Date.now();
  if (now - lastTraceFlushAt < TRACE_FLUSH_INTERVAL_MS) return;
  lastTraceFlushAt = now;
  void Bun.write(traceFilePath, JSON.stringify(traceAggregator.snapshot())).catch(() => {});
};
