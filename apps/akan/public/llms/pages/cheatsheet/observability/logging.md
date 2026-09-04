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
- Collection: NDJSON stdout & SSE (#collection)
- Operational Checklist (#operational-checklist)

## Content

Logging

Runtime Logging

Akan uses Logger for structured runtime output and AkanApp stores gateway and child process logs as files. Terminal logging stays concise for development, while file logging keeps richer records for later inspection.

Logger API

Use named loggers in services, adaptors, scripts, and runtime code.

Terminal level

Controls what is printed to stdout and stderr.

File level

Controls what Logger output is written to log files. Defaults to trace.

Using Logger

Create a Logger with a component or service name, then write logs at the level that matches the intent. Add context when the same logger handles several jobs.

Use trace or debug for detailed diagnosis, info/log for normal lifecycle events, warn for recoverable issues, and error when an operation failed or needs attention.

Log Levels

Terminal output and file output are intentionally separated. A production server can keep the terminal at info or warn while still writing trace-level Logger records to files. The ladder is trace, verbose, debug, info, warn, error; logger.log() is kept for compatibility and emits at info, and AKAN_PUBLIC_LOG_LEVEL=log means info.

Terminal

Controlled by AKAN_PUBLIC_LOG_LEVEL. Lower-priority messages are not printed to stdout/stderr.

Files

Controlled by AKAN_LOG_FILE_LEVEL. Defaults to trace so structured Logger messages are preserved even when the terminal is quiet.

File Logging & Rotation

When AkanApp starts, it writes file logs under the app runtime directory by default. Gateway logs and child process logs are separated, and each process key rotates independently by local date and file size.

The file name format is appName-environment-operationMode-YYYY-MM-DD-processKey-sequence.log. If the date changes, sequence starts again at 0001 for that date. If an app restarts, Akan continues from the next available sequence instead of overwriting old files.

Reading Logs

Start with the gateway log when the app cannot accept traffic, then inspect the child log that handled the request or background job. Child files include stdout and stderr prefixes.

Direct console.log calls from child servers are captured through stdout/stderr pipes. Direct console.log calls from the gateway process are not part of Logger sink capture, so prefer Logger in runtime code.

Live Tail

Every Logger call is a record before it is a line: level, logger name, process role, replica index, and — inside a request — the traceId, the endpoint (mutation:signScContract) and the origin (http, websocket, mcp, internal, page). The running gateway, or the replica itself when it runs alone, keeps a ring buffer of them and serves a unix control socket in the runtime directory. akan logs attaches to it, and so does .tail inside akan console.

Filters combine

Every flag ANDs with the others; a comma-separated list inside a flag is an OR. Globs use * only.

Zero cost when nobody is watching

A child forwards records over IPC only while a subscriber wants that level. AKAN_LOG_STREAM=1 keeps forwarding on; AKAN_LOG_BUFFER and AKAN_LOG_BUFFER_MB size the ring.

What carries no context

Gateway-internal lines, the scheduler's own started/finished lines, and unauthenticated primitive GET queries served by the fast path have no traceId or endpoint. AKAN_LOG_CONTEXT=0 switches request context off everywhere.

Request Line & Flight Recorder

Two opt-ins reduce noise instead of filtering it. The canonical request line writes one record per call at its end — ok or error, the endpoint, ms, status, userId, and under AKAN_TRACE=1 the db and cache figures — so a request is one line to grep, not a dozen. The flight recorder keeps each call's own sub-level records and promotes them, marked flight=true, only when the call failed or ran past the threshold: trace-level detail for the request that went wrong, with the process level left at info.

Structured attrs

Logger.emit({ level, name, message, attrs }) puts values in LogRecord.attrs; they render as key=value after the message and ride the JSON as an object. A key naming a secret is redacted before the record exists.

Promoted lines pass every floor

A flight=true or debug=true record was asked for below the level, so a forwarder's floor, the stdout writer's level and a --level filter all let it through.

Cost

Measured: the recorder adds about 190ns to a clean call, the gate about 20ns per rejected log call inside a trace. Both are off by default; the memory cap is an operator's decision.

Collection: NDJSON stdout & SSE

Collection and live viewing are different problems. Collection must be lossless and restart-safe, so it is the container's stdout: with AKAN_LOG_FORMAT=ndjson the gateway (or the solo replica) is the stream's only writer and emits one JSON record per line for every process it fronts — a child turns its console off and forwards, the RSC worker is piped rather than inherited, and whatever either wrote past its Logger, a crash stack included, is wrapped as a raw=true record. The node agent's parser is json. Live viewing is a session tool: GET /_akan/app/logs serves the hub as text/event-stream to a bearer token, resumable with Last-Event-ID.

One writer

Every server process shares the format through the environment. A child forwards from the stdout level on its own before the gateway asks, so a boot line is never lost; text stays the default and the image ships text.

Gaps are explicit

Every SSE event's id is the hub seq. A Last-Event-ID the ring no longer reaches answers with a gap event naming the missed range, and one from before a restart with sequence-reset — never a silent skip.

Not the collection path

A subscription loses the whole gap of a pod restart and needs a route to every pod. Use it to watch one process now; what must be kept goes through stdout and the node agent.

Operational Checklist

Keep terminal logs readable

Use AKAN_PUBLIC_LOG_LEVEL=info or warn in production and increase it temporarily during live debugging.

Preserve file detail

Keep AKAN_LOG_FILE_LEVEL=trace unless log volume or sensitive fields require a narrower level.

Plan disk usage

AKAN_LOG_MAX_SIZE_MB and AKAN_LOG_MAX_FILES are applied per process key, so replicas multiply the maximum disk usage.

Avoid secrets

Do not log tokens, passwords, database URLs, or private payloads. File logs are designed to last longer than terminal output.

## Code Examples

### Service logging

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

### .env

```bash
# Terminal output
AKAN_PUBLIC_LOG_LEVEL=info

# File output for structured Logger messages
AKAN_LOG_FILE_LEVEL=trace

# Turn file logging off when needed
AKAN_LOG_TO_FILE=0
```

### Default log files

```bash
local/apps/myapp/runtime/logs/
  myapp-local-local-2026-05-25-gateway-0001.log
  myapp-local-local-2026-05-25-0-all-0001.log
  myapp-local-local-2026-05-25-1-federation-0001.log
```

### Rotation configuration

```bash
# Override the log directory
AKAN_LOG_DIR=/var/log/akan

# Create the next sequence file after this size
AKAN_LOG_MAX_SIZE_MB=50

# Keep this many files per process key
AKAN_LOG_MAX_FILES=100
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
```

### Server lookup

```bash
# When AKAN_LOG_DIR is configured
ls -lh /var/log/akan
tail -f /var/log/akan/*-gateway-*.log
rg "invoice-sync|ERROR" /var/log/akan
```

### akan logs

```bash
# Only warn and above whose message mentions payment, from any mutation
akan logs myapp --level warn --grep payment --endpoint "mutation:*"

# One request, start to finish
akan logs myapp --trace m8x1k2-a9f3c1

# What the RSC worker rendered, with the last 50 buffered records first
akan logs myapp --role rsc-worker --origin page --replay 50

# History only, as NDJSON
akan logs myapp --since 5m --follow false --json
```

### akan console

```bash
akan:myapp> .tail level=warn grep=payment endpoint=mutation:*
akan:myapp> .trace m8x1k2-a9f3c1
akan:myapp> .tail off
```

### .env

```bash
# One line per call: "ok mutation:signScContract ms=132.4 status=200 userId=u_abc"
AKAN_LOG_CANONICAL=1          # slow: only failed calls and those over AKAN_LOG_FLIGHT_MS

# Keep each call's last 64 sub-level lines; promote them only when it failed or ran long
AKAN_LOG_FLIGHT=1
AKAN_LOG_FLIGHT_MS=1000
AKAN_LOG_FLIGHT_MAX=65536     # records held at once; a call past the cap runs unrecorded

# One request at trace, whatever the level: unconditional in local, elsewhere with this secret
AKAN_LOG_DEBUG_HEADER=<random secret>
```

### x-akan-debug

```bash
curl -H "x-akan-debug: <secret>" https://api.example.com/api/refundPayment/ord_1
# stdout now carries that request's trace lines, marked debug=true, and nothing else changes
```

### Deployment env

```bash
AKAN_LOG_FORMAT=ndjson          # stdout is JSON lines; ndjson-only makes the file JSON too
AKAN_LOG_TO_FILE=0              # the image default; the writable layer is ephemeral
AKAN_LOG_STDOUT_LEVEL=info      # kubelet and json-file rotate by size, so trace can outrun the agent
AKAN_LOG_STREAM_TOKEN=<secret>  # optional: mounts GET /_akan/app/logs
```

### docker-compose.yml

```ts
services:
  app:
    environment:
      AKAN_LOG_FORMAT: ndjson
      AKAN_LOG_TO_FILE: "0"
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

### SSE

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

