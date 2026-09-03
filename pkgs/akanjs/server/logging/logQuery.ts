import { Logger, type LogLevelInput, type LogRecord, logSeverity } from "akanjs/common";

/** Fields AND together; a list inside a field is an OR. One shape serves live tail, history and the SSE query string. */
export interface LogQuery {
  minSev?: number;
  text?: string;
  name?: string[];
  endpoint?: string[];
  origin?: string[];
  traceId?: string;
  child?: number[];
  role?: string[];
  stream?: ("stdout" | "stderr")[];
  since?: number;
  limit?: number;
}

const durationUnitMs = { ms: 1, s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 } as const;

export class LogQueryMatcher {
  readonly query: LogQuery;
  readonly #name: RegExp[] | null;
  readonly #endpoint: RegExp[] | null;

  constructor(query: LogQuery) {
    this.query = query;
    this.#name = query.name?.length ? query.name.map(LogQueryMatcher.compileGlob) : null;
    this.#endpoint = query.endpoint?.length ? query.endpoint.map(LogQueryMatcher.compileGlob) : null;
  }

  matches(record: LogRecord): boolean {
    const q = this.query;
    // A raw line has no level, so it is only excluded when the caller asked for a level at all.
    if (q.minSev !== undefined && (record.level === null || record.sev < q.minSev)) return false;
    if (q.text !== undefined && !record.message.includes(q.text)) return false;
    if (this.#name && !this.#name.some((glob) => glob.test(record.name))) return false;
    if (
      this.#endpoint &&
      (record.endpoint === null || !this.#endpoint.some((glob) => glob.test(record.endpoint ?? "")))
    )
      return false;
    if (q.origin?.length && (record.origin === null || !q.origin.includes(record.origin))) return false;
    if (q.traceId !== undefined && record.traceId !== q.traceId) return false;
    if (q.child?.length && (record.replicaIdx === null || !q.child.includes(record.replicaIdx))) return false;
    if (q.role?.length && (record.role === null || !q.role.includes(record.role))) return false;
    if (q.stream?.length && !q.stream.includes(record.stream)) return false;
    if (q.since !== undefined && record.at < q.since) return false;
    return true;
  }

  /** `*` is the only wildcard: `mutation:*`, `*:userList`. Everything else is literal. */
  static compileGlob(pattern: string): RegExp {
    const source = pattern
      .split("*")
      .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join(".*");
    return new RegExp(`^${source}$`);
  }

  /** A duration such as `5m` / `30s` / `2h` / `1d`, or an absolute epoch-ms number. */
  static parseSince(value: string, now = Date.now()): number | undefined {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    if (/^\d+$/.test(trimmed)) return Number(trimmed);
    const match = /^(\d+(?:\.\d+)?)(ms|s|m|h|d)$/.exec(trimmed);
    if (!match) return undefined;
    return now - Number(match[1]) * durationUnitMs[match[2] as keyof typeof durationUnitMs];
  }

  static parseMinSev(value: string | undefined): number | undefined {
    if (value === undefined || value === "") return undefined;
    if (/^\d+$/.test(value)) return Number(value);
    const level = Logger.normalizeLevel(value as LogLevelInput);
    return level in logSeverity ? logSeverity[level] : undefined;
  }

  /**
   * Reads a query off `URLSearchParams` or a parsed JSON object. Lists accept repeated keys and comma-separated
   * values; `level=warn` is sugar for `minSev`; `since` accepts a duration.
   */
  static parse(input: URLSearchParams | Record<string, unknown>, now = Date.now()): LogQuery {
    const list = (key: string): string[] => {
      const raw =
        input instanceof URLSearchParams
          ? input.getAll(key)
          : Array.isArray(input[key])
            ? (input[key] as unknown[]).map(String)
            : input[key] === undefined || input[key] === null
              ? []
              : [String(input[key])];
      return raw
        .flatMap((value) => value.split(","))
        .map((value) => value.trim())
        .filter(Boolean);
    };
    const one = (key: string): string | undefined => list(key)[0];
    const query: LogQuery = {};
    const minSev = LogQueryMatcher.parseMinSev(one("minSev") ?? one("level"));
    if (minSev !== undefined) query.minSev = minSev;
    const text = one("text") ?? one("grep");
    if (text !== undefined) query.text = text;
    const name = list("name");
    if (name.length) query.name = name;
    const endpoint = list("endpoint");
    if (endpoint.length) query.endpoint = endpoint;
    const origin = list("origin");
    if (origin.length) query.origin = origin;
    const traceId = one("traceId") ?? one("trace");
    if (traceId !== undefined) query.traceId = traceId;
    const child = list("child")
      .map(Number)
      .filter((value) => Number.isInteger(value));
    if (child.length) query.child = child;
    const role = list("role");
    if (role.length) query.role = role;
    const stream = list("stream").filter(
      (value): value is "stdout" | "stderr" => value === "stdout" || value === "stderr",
    );
    if (stream.length) query.stream = stream;
    const since = one("since");
    if (since !== undefined) {
      const parsed = LogQueryMatcher.parseSince(since, now);
      if (parsed !== undefined) query.since = parsed;
    }
    const limit = Number(one("limit"));
    if (Number.isInteger(limit) && limit > 0) query.limit = limit;
    return query;
  }
}
