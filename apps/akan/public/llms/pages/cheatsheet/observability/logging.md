# Logging

- Source: /cheatsheet/observability/logging
- Mirror: /llms/pages/cheatsheet/observability/logging.md
- Section: cheatsheet
- Category: Observability
- Priority: P2

## Headings

- Runtime Logging (#logging-overview)
- Using Logger (#using-logger)
- Log Levels (#log-levels)
- File Logging & Rotation (#file-logging)
- Reading Logs (#reading-logs)
- Live Tail (#live-tail)
- Request Line & Flight Recorder (#request-line)
- Collection: NDJSON stdout (#collection)
- The SSE Stream (#log-stream)
- Operational Checklist (#operational-checklist)

## Content

Logging

Runtime Logging

A customer says their refund failed at about four o'clock. You have the container's stdout, twelve replicas' worth of it, and no way to tell which lines belonged to that one call. Every line is true and none of them is an answer.

Akan's answer is that a log line is a record before it is a line. Every Logger call carries a level, a logger name, a process role, a replica index and — inside a request — a traceId, the endpoint, and the origin. One request's lines share a trace, so the question above becomes one command.

One record, from the call to the collector

Using Logger

Create a Logger with a component or service name, then write logs at the level that matches the intent. The second argument is a context string — add it when the same logger handles several jobs.

Structured values do not belong in the message. Logger.emit puts them in LogRecord.attrs, where they render as key=value after the text and ride the JSON as an object — greppable in a terminal and queryable in a collector, from one call.

Log Levels

Six levels, and the numbers beside them are OpenTelemetry severity bands rather than 0 through 5. They are what ndjson output, the SSE payload and a numeric --level filter all carry, so a table that renumbers them disagrees with the wire.

Level

Three levels are configured separately because they answer different questions: what a human watching the terminal wants, what the container's stdout should carry to a collector, and how deep a sink that asked for nothing is allowed to go.

The console level. log is accepted and means info, with a one-time deprecation warning at boot; an unrecognised name falls back silently.

What the container's stdout carries, and the floor a child forwards from before the hub has asked for anything. It has no literal default — it tracks the console level.

The floor for every sink that declared no minLevel — the rotating file and the hub included, not only the file. This is the most expensive default in the system.

File Logging & Rotation

A supervised session writes file logs under the app's runtime directory. Gateway logs and child process logs are separated, and each process key rotates independently by local date and file size.

Only the exact string 0 disables file logging — false does not. The Dockerfile Akan generates bakes 0, because a container's writable layer is ephemeral.

Where the files are written. The runtime directory is runtime/ under NODE_ENV=production and local/apps/<app>/runtime otherwise.

Roll to the next sequence file past this size. A non-positive or unparseable value falls back to the default.

Files retained per process key. Applied per key, so replicas multiply the maximum disk usage.

The file name format is appName-environment-operationMode-YYYY-MM-DD-processKey-sequence.log. If the date changes, sequence starts again at 0001 for that date. If an app restarts, Akan continues from the next available sequence instead of overwriting old files.

Reading Logs

Start with the gateway log when the app cannot accept traffic, then inspect the child log that handled the request or background job. Child files include stdout and stderr prefixes.

Direct console.log calls from child servers are captured through stdout/stderr pipes. Direct console.log calls from the gateway process are not part of Logger sink capture, so prefer Logger in runtime code.

Live Tail

The running gateway — or the replica itself when it runs alone — keeps a ring buffer of records and serves a unix control socket in the runtime directory, chmod 0600, with no TCP port. Filesystem permission is the whole authentication. akan logs attaches to it, and so does .tail inside akan console.

Minimum level: trace, verbose, debug, info, warn, error. A bare severity number works too.

Substring the message must contain.

Endpoint glob(s), comma-separated: mutation:*, query:userList. Passing it always prints a notice that the primitive query fast path carries no endpoint and is not shown.

One request's traceId.

Replica index(es), comma-separated.

Process role(s): gateway, all, batch, rsc-worker.

Call origin(s): http, websocket, mcp, internal, page.

Only records newer than this: 5m, 30s, or epoch ms. A value older than the ring prints what the buffer actually covers.

Records to replay from the buffer before following. The default shows nothing historical unless you ask.

Print NDJSON records instead of rendered lines.

Keep streaming; pass --follow false for history only.

Runtime dir holding akan-control.sock. Pass it for a built app running somewhere else.

Filters combine

Every flag ANDs with the others; a comma-separated list inside a flag is an OR. Globs use * only, and apply to the logger name and the endpoint.

Zero cost when nobody is watching

A child forwards records over IPC only while a subscriber wants that level. AKAN_LOG_STREAM=1 keeps forwarding on; AKAN_LOG_BUFFER and AKAN_LOG_BUFFER_MB size the ring, 2000 records and 4MB by default, and only in the hub owner.

What carries no context

Gateway-internal lines, the scheduler's own started/finished lines, and unauthenticated primitive GET queries served by the fast path have no traceId or endpoint. AKAN_LOG_CONTEXT=0 switches request context off everywhere.

Request Line & Flight Recorder

Two opt-ins reduce noise instead of filtering it. The canonical request line writes one record per call at its end — ok or error, the endpoint, ms, status, userId, and under AKAN_TRACE=1 the db and cache figures — so a request is one line to grep, not a dozen.

The flight recorder is the other half. It keeps each call's own sub-level records and promotes them, marked flight=true, only when the call failed or ran past the threshold: trace-level detail for the request that went wrong, with the process level left at info.

One summary record per call. slow writes it only for failed calls and those over AKAN_LOG_FLIGHT_MS.

Keep each call's last 64 sub-level records and promote them only when it failed or ran long.

The slow threshold, shared by the flight recorder and canonical slow mode.

Records held at once — records, not traces. Divided by the 64-record ring, that is about a thousand concurrent recorded calls; one past the cap runs unrecorded.

The secret an x-akan-debug header must match to lower one request to trace. Unset, the header is honoured only when AKAN_PUBLIC_ENV is local.

Adds span, db and cache figures to the canonical line.

Promoted lines pass every floor

A flight=true or debug=true record was asked for below the level, so a forwarder's floor, the stdout writer's level and a --level filter all let it through.

Cost

Measured: the recorder adds about 190ns to a clean call, the gate about 20ns per rejected log call inside a trace. Both are off by default; the memory cap is an operator's decision.

Collection: NDJSON stdout

Collection and live viewing are different problems. Collection must be lossless and restart-safe, so it is the container's stdout — and under AKAN_LOG_FORMAT=ndjson the hub owner becomes that stream's only writer. Every other server process turns its console off and forwards; the RSC worker is piped rather than inherited; and whatever either wrote past its Logger, a crash stack included, is wrapped as a raw=true record so the stream stays valid JSON.

ndjson makes stdout one JSON record per line; ndjson-only writes the rotating file as JSON too. Anything else parses as text. It is a whole-deployment setting — giving processes different values corrupts the stream.

Pins a child's IPC forwarder on instead of letting it follow the hub's floor. Only a child has a forwarder, so it does nothing in a solo process.

Records the hub owner's ring holds. Evicted whenever either this or the byte cap is reached.

Byte cap on the same ring. Ignored unless it is a positive number.

The SSE Stream

Live viewing is a session tool. GET /_akan/app/logs serves the hub as text/event-stream to a bearer token, resumable with Last-Event-ID, taking the same filter vocabulary as akan logs. Without AKAN_LOG_STREAM_TOKEN the route is not mounted at all — not mounted and answering 403, absent.

Only the hub owner has it

The route is mounted by the gateway, or by a solo replica. A non-solo child does not serve it, so a token alone is not enough to reach one.

Gaps are explicit

Every SSE event's id is the hub seq. A Last-Event-ID the ring no longer reaches answers with a gap event naming the missed range, and one from before a restart with sequence-reset — never a silent skip.

Not the collection path

A subscription loses the whole gap of a pod restart and needs a route to every pod. Use it to watch one process now; what must be kept goes through stdout and the node agent.

Operational Checklist

Keep terminal logs readable

Use AKAN_PUBLIC_LOG_LEVEL=info or warn in production and increase it temporarily during live debugging.

Give every sink a floor

Pass minLevel to Logger.addSink. A floorless sink follows AKAN_LOG_FILE_LEVEL, which is trace, and makes every trace call in the process build a record.

Never log per delivered record

Anything that delivers records — a forwarder, a sink, the stream route — must not log per item, or it feeds on its own output.

Plan disk usage

AKAN_LOG_MAX_SIZE_MB and AKAN_LOG_MAX_FILES are applied per process key, so replicas multiply the maximum disk usage.

Avoid secrets

Key-name redaction only covers attrs, and only keys naming a secret. A token interpolated into the message text is not redacted, and file logs outlive terminal output.

## Code Examples

### apps/myapp/lib/billing/billing.service.ts

```ts
import { Logger } from "akanjs/common";

export class BillingService {
  readonly logger = new Logger("BillingService");

  async syncInvoice(invoiceId: string) {
    this.logger.debug(`sync start invoiceId=${invoiceId}`, "invoice-sync");

    try {
      await this.pushInvoice(invoiceId);
      this.logger.info(`sync complete invoiceId=${invoiceId}`, "invoice-sync");
    } catch (error) {
      this.logger.error(
        `sync failed invoiceId=${invoiceId} message=${error instanceof Error ? error.message : String(error)}`,
        "invoice-sync",
      );
      throw error;
    }
  }
}
```

### apps/myapp/lib/billing/billing.service.ts

```ts
import { Logger } from "akanjs/common";

Logger.emit({
  level: "info",
  name: "BillingService",
  message: "invoice pushed",
  attrs: { invoiceId, vendor: "stripe", ms: elapsed },
});
// An attr key naming a secret — token, password, authorization, cookie, api_key, private_key —
// is replaced with "[redacted]" while the record is built, so no sink can ever see the value.
```

### Default log files

```bash
local/apps/myapp/runtime/logs/
  myapp-local-local-2026-05-25-gateway-0001.log
  myapp-local-local-2026-05-25-0-all-0001.log
  myapp-local-local-2026-05-25-1-federation-0001.log
```

### Local lookup

```bash
# List current log files
ls -lh local/apps/myapp/runtime/logs

# Follow gateway logs
tail -f local/apps/myapp/runtime/logs/*-gateway-*.log

# Follow a child process log
tail -f local/apps/myapp/runtime/logs/*-0-all-*.log

# Search errors
rg "ERROR|Unhandled|Failed" local/apps/myapp/runtime/logs

# On a server, when AKAN_LOG_DIR is configured
ls -lh /var/log/akan
rg "invoice-sync|ERROR" /var/log/akan
```

### Terminal

```bash
# Only warn and above whose message mentions payment, from any mutation
akan logs myapp --level warn --grep payment --endpoint "mutation:*"

# One request, start to finish
akan logs myapp --trace m8x1k2-a9f3c1

# What the RSC worker rendered, with the last 50 buffered records first
akan logs myapp --role rsc-worker --origin page --replay 50

# History only, as NDJSON
akan logs myapp --since 5m --follow false --json

# The same vocabulary inside the operator console
akan:myapp> .tail level=warn grep=payment endpoint=mutation:*
akan:myapp> .trace m8x1k2-a9f3c1
akan:myapp> .tail off
```

### Terminal

```bash
curl -H "x-akan-debug: <secret>" https://api.example.com/api/refundPayment/ord_1
# stdout now carries that request's trace lines, marked debug=true, and nothing else changes
```

### docker-compose.yml

```ts
services:
  app:
    environment:
      AKAN_LOG_FORMAT: ndjson
      AKAN_LOG_TO_FILE: "0"              # the image default; the writable layer is ephemeral
      AKAN_LOG_STDOUT_LEVEL: info        # kubelet and json-file rotate by size, so trace can outrun the agent
    logging:
      driver: json-file
      options: { max-size: "50m", max-file: "5" }   # json-file never rotates unless told to
```

### fluent-bit.conf

```ts
[INPUT]
    name    tail
    path    /var/log/containers/*.log
    parser  cri
[FILTER]
    name          parser
    match         *
    key_name      log
    parser        json
    reserve_data  true
# Keep traceId and userId as JSON fields, not Loki labels: labels must stay low-cardinality.
```

### Terminal

```bash
curl -N -H "Authorization: Bearer $AKAN_LOG_STREAM_TOKEN" \
     "http://<pod>:8282/_akan/app/logs?level=warn&endpoint=mutation:*"

# Reconnect where you left off; an evicted range arrives as an explicit gap event
curl -N -H "Authorization: Bearer $AKAN_LOG_STREAM_TOKEN" -H "Last-Event-ID: 84213" \
     "http://<pod>:8282/_akan/app/logs?level=warn"
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Use this page as a task recipe, then verify with the relevant lint, test, or build command.

