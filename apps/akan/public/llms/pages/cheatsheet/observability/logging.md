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

off

What one Logger call becomes: level, logger name, process and, inside a request, its trace.

An id shared by every line one request writes, such as `m8x1k2-a9f3c1`.

A receiver registered with `Logger.addSink`, such as the rotating file or the hub.

The lowest level a sink or reader accepts. Records below it are dropped.

One journal of every process's records, kept by the gateway or by a solo replica.

A server process behind the gateway. It sends its records to the hub over IPC.

The level name and its OpenTelemetry severity number.

The logger name, and the context string passed as the second argument.

Which process wrote it. role is gateway, all, federation, batch or rsc-worker.

Filled only inside a request, such as `mutation:refundPayment` arriving over `http`.

Structured key=value data attached with `Logger.emit`.

Every step, including the ones that are only interesting once.

Detail a developer asks for on purpose. It is TRACE's upper tier, not a band of its own.

Diagnosis for one subsystem while you are working on it.

Normal lifecycle events. The production default.

Recovered: it kept going, and somebody should know.

An operation failed or needs attention. Written to stderr, not stdout.

App name, environment and operation mode, such as `myapp-local-local`.

The local date. On a new date the sequence starts again at `0001`.

`gateway`, `<replicaIdx>-<role>` for a child, or the role alone for a solo replica.

Four digits. A restart moves on to the next number instead of overwriting.

Filters Combine

Free While Nobody Watches

Bounded Ring

Lines Without Context

Request Line

Writes one record when a call ends, so a request is one line to grep instead of a dozen.

Flight Recorder

Holds each call's records below the level and promotes them, marked flight=true, only if it failed or ran long.

The message. A clean call is written at info, a failed one at warn.

Duration and status. On failure, status is the error's statusCode, or 500.

The caller's account id, once the call knows who is asking.

Query count, query time and cache hit ratio, only under `AKAN_TRACE=1`.

The first line of the error message, cut at 200 characters.

Unset, the route does not exist at all. It is absent, not a 403.

A missing or wrong token is answered with 401.

The `akan logs` filters, plus `name`, `stream` and `limit`.

Each event's id is the hub seq, so a reconnect resumes where it left off.

A heartbeat comment every 15 seconds, and a 2-second reconnect hint.

The ring already dropped part of the range. The event carries from, to and missed.

The id is past the current seq, so a restarted process is answering.

Health And Metrics

Read process health and request metrics next to the logs.

Server Console

Where .tail and .trace run against a live server.

Docker

The container env the generated image sets, logging included.

Kubernetes

Deploying the app image to a Kubernetes cluster.

Runtime Logging

A customer says a refund failed around four o'clock. With only twelve replicas' worth of stdout, nothing tells you which lines belonged to that call.

Words used on this page

Term

What a record carries

Field

One record, from the call to the collector

floor: minLevel, else AKAN_LOG_FILE_LEVEL

Child replica

LogForwarder over IPC

Hub owner

gateway, or the solo replica

Ring buffer

up to AKAN_LOG_BUFFER records

Container stdout

text or ndjson

Rotating file

Using Logger

Structured values go in attrs

Log Levels

There are six levels. The number beside each is its OpenTelemetry severity, not an index from 0 to 5.

Level

Severity

Description

Three level settings

Each answers a different question: what a person at the terminal wants, what stdout ships to a collector, and how deep a sink with no floor goes.

The console level. `log` means info (deprecated); an unknown name silently becomes info.

What stdout carries. Overrides `AKAN_PUBLIC_LOG_LEVEL`; in ndjson, also a child's forwarding floor.

The floor for every sink without `minLevel`, the rotating file and the hub included.

File Logging & Rotation

Name part

Meaning

on (0 in the Docker image)

Only the exact string `0` turns file logging off; `false` does not.

Log directory. A relative path resolves from the process's working directory.

Past this size, writing moves on to the next sequence file.

Newest files kept per process key. Older ones are deleted.

Reading Logs

When the app accepts no traffic, start with the gateway log. Then read the child log that handled the request or background job.

The files are plain text, so ordinary tools work:

List current log files

Follow the gateway

Follow one child replica

Search for errors

On a server with AKAN_LOG_DIR=/var/log/akan

Live Tail

The socket is chmod 0600 and opens no TCP port: filesystem permission is the whole authentication.

warn and above from any mutation, whose message mentions payment

One request, start to finish

What the RSC worker rendered, with the last 50 buffered records first

History only, as NDJSON

The same filters inside akan console

Minimum level, by name or by severity number.

Substring the message must contain.

Endpoint globs, comma-separated: `mutation:*`, `query:userList`.

One request's traceId.

Replica indexes, comma-separated.

Process roles: `gateway`, `all`, `federation`, `batch`, `rsc-worker`.

Call origins: `http`, `websocket`, `mcp`, `internal`, `page`.

Only records newer than this: `30s`, `5m`, `2h`, `1d`, or epoch ms.

Records to replay from the buffer before following.

Print NDJSON records instead of rendered lines.

Keep streaming. Pass `--follow false` for history only.

Directory holding `akan-control.sock`. Pass it for a built app running elsewhere.

Request Line & Flight Recorder

Two opt-ins cut noise instead of filtering it: one summary line per call, and trace-level detail only for the calls that went wrong.

With the process level left at info, you still get trace detail for exactly the request that failed.

What the request line carries

Settings

One summary record per call. `slow` keeps only failures and calls over `AKAN_LOG_FLIGHT_MS`.

Keeps each call's last 64 sub-level records, promoted only if it failed or ran long.

The slow threshold, shared by the flight recorder and `slow` mode.

Records held at once across calls (1,024 calls at 64 each); past it a call runs unrecorded.

unset

Secret for `x-akan-debug`, which lowers one request to trace. Unset, it works only in local.

Adds db and cache figures to the request line, and per-stage spans to metrics.

One request at trace in production

that request alone is logged at trace, its lines marked debug=true

Collection: NDJSON stdout

Collection and live viewing are different problems. Collection must lose nothing and survive restarts, so it goes through the container's stdout.

`ndjson`: one JSON record per stdout line. `ndjson-only` writes the rotating file as JSON too.

Keeps a child's IPC forwarder on instead of following the hub's floor.

Records the hub owner's ring holds. Eviction starts at this or at the byte cap.

Byte cap on the same ring. Ignored unless it is a positive number.

A docker-compose service that ships ndjson looks like this:

On Kubernetes, a node agent such as Fluent Bit strips the CRI wrapper and parses the JSON:

The SSE Stream

Reconnect where you left off; an evicted range arrives as an explicit gap event

Piece

Gaps are explicit

reason

Operational Checklist

Five rules that keep production logs useful and affordable.

Related pages

## Code Examples

### apps/myapp/lib/invoice/invoice.service.ts

```ts
import { BillingApi } from "@apps/myapp/srvkit";
import { serve } from "akanjs/service";

import * as db from "../db";

export class InvoiceService extends serve(db.invoice, ({ plug }) => ({
  billingApi: plug(BillingApi),
})) {
  async syncInvoice(invoiceId: string) {
    this.logger.debug(`sync start invoiceId=${invoiceId}`, "invoice-sync");
    const pushed = await this.billingApi.pushInvoice(invoiceId);
    if (!pushed) {
      this.logger.warn(`sync skipped invoiceId=${invoiceId}`, "invoice-sync");
      return false;
    }
    this.logger.info(`sync complete invoiceId=${invoiceId}`, "invoice-sync");
    return true;
  }
}
```

### apps/myapp/lib/invoice/invoice.service.ts

```ts
import { Logger } from "akanjs/common";

Logger.emit({
  level: "info",
  name: "InvoiceService",
  message: "invoice pushed",
  attrs: { invoiceId, vendor: "stripe", ms: elapsed },
});
```

### local/apps/myapp/runtime/logs

```markdown
myapp-local-local-2026-05-25-gateway-0001.log
myapp-local-local-2026-05-25-0-all-0001.log
myapp-local-local-2026-05-25-1-federation-0001.log
```

### Terminal

```bash
# ${l.trans({ en: "List current log files", ko: "현재 로그 파일 목록" })}
ls -lh local/apps/myapp/runtime/logs

# ${l.trans({ en: "Follow the gateway", ko: "gateway 로그 따라가기" })}
tail -f local/apps/myapp/runtime/logs/*-gateway-*.log

# ${l.trans({ en: "Follow one child replica", ko: "child replica 하나 따라가기" })}
tail -f local/apps/myapp/runtime/logs/*-0-all-*.log

# ${l.trans({ en: "Search for errors", ko: "에러 찾기" })}
rg "ERROR|Unhandled|Failed" local/apps/myapp/runtime/logs

# ${l.trans({ en: "On a server with AKAN_LOG_DIR=/var/log/akan", ko: "AKAN_LOG_DIR=/var/log/akan인 서버에서" })}
ls -lh /var/log/akan
rg "invoice-sync|ERROR" /var/log/akan
```

### Terminal

```bash
# ${l.trans({
              en: "warn and above from any mutation, whose message mentions payment",
              ko: "mutation에서 나온 warn 이상 중 메시지에 payment가 든 줄",
            })}
akan logs myapp --level warn --grep payment --endpoint "mutation:*"

# ${l.trans({ en: "One request, start to finish", ko: "요청 하나를 처음부터 끝까지" })}
akan logs myapp --trace m8x1k2-a9f3c1

# ${l.trans({
              en: "What the RSC worker rendered, with the last 50 buffered records first",
              ko: "RSC worker가 렌더한 것, 버퍼의 최근 50건부터",
            })}
akan logs myapp --role rsc-worker --origin page --replay 50

# ${l.trans({ en: "History only, as NDJSON", ko: "지난 기록만 NDJSON으로" })}
akan logs myapp --since 5m --follow false --json

# ${l.trans({ en: "The same filters inside akan console", ko: "akan console 안에서도 같은 필터" })}
akan:myapp> .tail level=warn grep=payment endpoint=mutation:*
akan:myapp> .trace m8x1k2-a9f3c1
akan:myapp> .tail off
```

### Terminal

```bash
curl -X POST -H "x-akan-debug: <secret>" \\
     https://api.example.com/api/refundPayment/ord_1
# ${l.trans({
              en: "that request alone is logged at trace, its lines marked debug=true",
              ko: "그 요청만 trace로 찍히고, 그 줄에는 debug=true가 붙습니다",
            })}
```

### docker-compose.yml

```yaml
services:
  app:
    environment:
      AKAN_LOG_FORMAT: ndjson
      AKAN_LOG_TO_FILE: "0"
      AKAN_LOG_STDOUT_LEVEL: info
    logging:
      driver: json-file
      options: { max-size: "50m", max-file: "5" }
```

### fluent-bit.conf

```yaml
[INPUT]
    name              tail
    path              /var/log/containers/*.log
    multiline.parser  cri
[FILTER]
    name          parser
    match         *
    key_name      log
    parser        json
    reserve_data  true
```

### Terminal

```bash
curl -N -H "Authorization: Bearer $AKAN_LOG_STREAM_TOKEN" \\
     "http://<pod>:8282/_akan/app/logs?level=warn&endpoint=mutation:*"

# ${l.trans({
              en: "Reconnect where you left off; an evicted range arrives as an explicit gap event",
              ko: "끊긴 곳부터 다시 받기. 밀려난 구간은 gap 이벤트로 알려 줍니다",
            })}
curl -N -H "Authorization: Bearer $AKAN_LOG_STREAM_TOKEN" \\
     -H "Last-Event-ID: 84213" \\
     "http://<pod>:8282/_akan/app/logs?level=warn"
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Use this page as a task recipe, then verify with the relevant lint, test, or build command.

