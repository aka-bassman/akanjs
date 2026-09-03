import { timingSafeEqual } from "node:crypto";
import { EventStream } from "../routing/eventStream";
import type { LogHub, LogHubEntry } from "./logHub";
import { LogQueryMatcher } from "./logQuery";
import { LogStdoutWriter } from "./logStdoutWriter";

/**
 * `GET /_akan/app/logs?level=warn&endpoint=mutation:*` — the hub as a `text/event-stream`, for a monitor watching
 * one process from outside the pod. Every event carries the hub `seq` as its `id:`, so a client that reconnects
 * with `Last-Event-ID` gets what it missed while the ring still holds it, and an explicit gap event when it does
 * not — never a silent skip a monitor would read as a quiet interval.
 *
 * The route exists only when `AKAN_LOG_STREAM_TOKEN` is set, and answers only a matching bearer token. It logs
 * nothing itself: a stream that logged its own subscriptions at the level it delivers would feed on itself.
 */
export class LogStreamRoute {
  static readonly path = "/_akan/app/logs";
  static readonly retryMs = 2_000;
  static readonly heartbeatMs = 15_000;

  readonly #hub: () => LogHub | null;
  readonly #token: Buffer;

  constructor(hub: () => LogHub | null, token: string) {
    this.#hub = hub;
    this.#token = Buffer.from(token);
  }

  /** Without a token the route is not registered at all, rather than mounted to answer "forbidden". */
  static fromEnv(hub: () => LogHub | null): LogStreamRoute | null {
    const token = process.env.AKAN_LOG_STREAM_TOKEN?.trim();
    return token ? new LogStreamRoute(hub, token) : null;
  }

  handle(req: Request): Response {
    if (!this.#authorized(req))
      return new Response("Unauthorized", { status: 401, headers: { "www-authenticate": "Bearer" } });
    const hub = this.#hub();
    if (!hub) return new Response("Log hub is not running", { status: 503 });
    const url = new URL(req.url);
    const query = LogQueryMatcher.parse(url.searchParams);
    const matcher = new LogQueryMatcher(query);
    let subscription: { unsubscribe(): void } | null = null;
    const stream = new EventStream(
      () => {
        subscription?.unsubscribe();
        subscription = null;
      },
      { keepAliveMs: LogStreamRoute.heartbeatMs, keepAliveChunk: ": heartbeat\n\n" },
    );
    stream.retry(LogStreamRoute.retryMs);
    const lastEventId = LogStreamRoute.#lastEventId(req);
    if (lastEventId !== null) LogStreamRoute.#resume(hub, stream, matcher, lastEventId);
    subscription = hub.subscribe(query, (entry) => LogStreamRoute.#send(stream, entry));
    return stream.response();
  }

  #authorized(req: Request): boolean {
    const header = req.headers.get("authorization") ?? "";
    const match = /^Bearer\s+(.+)$/i.exec(header);
    if (!match) return false;
    const presented = Buffer.from(match[1] ?? "");
    return presented.length === this.#token.length && timingSafeEqual(presented, this.#token);
  }

  static #lastEventId(req: Request): number | null {
    const value = req.headers.get("last-event-id");
    if (value === null || !/^\d+$/.test(value.trim())) return null;
    return Number(value.trim());
  }

  /** What arrived after `lastEventId`, preceded by a gap event when the ring no longer reaches back that far. */
  static #resume(hub: LogHub, stream: EventStream, matcher: LogQueryMatcher, lastEventId: number) {
    if (lastEventId > hub.seq) {
      // The sequence restarted — a new process is answering — so nothing after that id can exist here.
      stream.write({ type: "gap", reason: "sequence-reset", lastEventId, currentSeq: hub.seq });
      return;
    }
    const { entries, gap } = hub.since(lastEventId);
    if (gap) stream.write({ type: "gap", reason: "ring-buffer-evicted", ...gap });
    for (const entry of entries) if (matcher.matches(entry.record)) LogStreamRoute.#send(stream, entry);
  }

  static #send(stream: EventStream, entry: LogHubEntry) {
    stream.write(LogStdoutWriter.json(entry), entry.seq);
  }
}
