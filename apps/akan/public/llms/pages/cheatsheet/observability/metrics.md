# Metrics

- Source: /cheatsheet/observability/metrics
- Mirror: /llms/pages/cheatsheet/observability/metrics.md
- Section: cheatsheet
- Category: Observability
- Priority: P2

## Headings

- Health And Metrics (#overview)
- Check Health (#health)
- Check Metrics (#metrics)
- How To Read (#read)
- Memory Logs (#memory-log)
- Troubleshooting Order (#checklist)

## Content

Metrics

off

A front process that hands requests to replicas, e.g. under `akan start` or with 2+ replicas.

A server process that handles requests or jobs; each one is an entry in `children`.

One replica with no gateway in front, the container default; it answers both endpoints itself.

The separate process that renders pages, one per web-serving replica.

`running`, or `stopping` while the server shuts down.

`all` does both, `federation` serves requests, `batch` runs background internals only.

`true` once the replica has booted and can take requests or jobs.

Where the replica is in its lifecycle; see the table below.

How often the replica restarted and why; read these first when it keeps coming back.

Appears only in solo, where the replica's entry carries no restart fields.

Meaning

The process was spawned and is still booting.

It takes requests, but the gateway's first health ping has not come back yet.

It answers the gateway's health ping, sent every 2 seconds.

It missed pings for 5 s (15 s under `akan start`) or was unreachable; the gateway restarts it.

The process ended, and the gateway starts it again.

`akan start` only: boot failed three times in a row, so it waits for your next save.

Gateway

Solo

Top level

Pubsub rooms with a subscriber, and the sockets subscribed to them.

The gateway process's own memory and event-loop sample.

Time to hand a request from the gateway to a replica, only with `AKAN_TRACE=1`.

Each replica, in children[]

Requests in flight now, and requests since the replica started.

Open WebSocket connections passed to this replica.

How often the replica restarted, and why the last time.

The replica's memory in the last sample.

Memory of the replica's RSC worker, which is a separate process.

How late timers fired in the last window; high means something blocks the process.

Renders sent to the RSC worker that have not come back yet.

Per-endpoint timings and query counts, only with `AKAN_TRACE=1`.

Requests being handled now; if it stays high, a slow endpoint may be holding work.

Realtime load: open connections, and the rooms they subscribe to.

Memory size; watch the trend across samples, not one value.

Add it to the replica's `rssBytes`; the sum is what the replica really costs.

Server renders waiting on the RSC worker; a rising value means render work is queuing.

How late the event loop ran its timers; a high value means work is blocking requests.

Replica restarts and the last reason; a rising count means the replica keeps failing.

Planned RSC worker swaps at a limit such as `rss>…MiB`; frequent swaps point at render memory.

Logs one `memory role=…` line per process on every sample.

Sample interval for these lines and for the numbers in `/_akan/app/metrics`.

Forces a full GC before each sample so heap numbers show live memory, and adds `gcDurationMs`.

Live Tail

Filter `akan logs` by level, endpoint, trace and role.

Request Line And AKAN_TRACE

One summary line per call, and what `AKAN_TRACE=1` adds.

Scale With AKAN_REPLICA

Replica slots, and exactly when a gateway appears.

Kubernetes Probes

How the pod's probes call `/_akan/app/health`.

Health And Metrics

When an app feels slow or stops answering, ask the running app before you guess. Two endpoints are built in and need no setup.

Where to look

What it answers

Words used on this page

Term

Check Health

Open health first when the app does not load. It tells you whether the server answers and whether each replica is ready.

Response

Reading the fields

Field

Replica status

Check Metrics

Open metrics when the app answers but feels busy. It shows traffic, WebSocket load, memory and the render queue for every process.

Call it the same way; the second line picks two numbers per replica:

A trimmed response with a gateway in front:

With a gateway, or solo

A solo replica has no gateway counting for it, so several fields come back empty:

Has a value

null, 0 or absent

How To Read

One snapshot rarely tells the story. Take a few samples a minute apart, and read each number against the question it answers.

Number

What it tells you

Memory Logs

When one metrics response cannot pin down a memory problem, log every sample and watch how the values move.

Troubleshooting Order

Go from the cheapest question to the most detailed one, and stop as soon as you find the cause.

Read next

## Code Examples

### Terminal

```bash
curl -s http://localhost:8282/_akan/app/health
curl -s localhost:8282/_akan/app/health | jq '.children[] | {role, status, ready}'
```

### Code

```json
{
  "status": "running",
  "pid": 72128,
  "children": [
    {
      "idx": 0,
      "role": "all",
      "status": "healthy",
      "ready": true,
      "pid": 72129,
      "restartCount": 0,
      "restartPending": false
    }
  ]
}
```

### Terminal

```bash
curl -s http://localhost:8282/_akan/app/metrics
curl -s localhost:8282/_akan/app/metrics | jq '.children[].metrics | {activeRequests, rssBytes}'
```

### Code

```json
{
  "rooms": 12,
  "sockets": 34,
  "gateway": {
    "rssBytes": 180000000,
    "heapUsedBytes": 72000000
  },
  "proxyHop": null,
  "children": [
    {
      "role": "all",
      "rooms": 12,
      "metrics": {
        "reportedAt": 1790223722512,
        "activeRequests": 2,
        "totalRequests": 136,
        "activeWebSockets": 10,
        "rssBytes": 420000000,
        "heapUsedBytes": 60000000,
        "rscWorkerRssBytes": 310000000,
        "eventLoopLagP99Ms": 6.8,
        "rscPendingRenderCount": 1
      }
    }
  ]
}
```

### .env

```bash
AKAN_MEMORY_LOG=1
AKAN_MEMORY_LOG_INTERVAL_MS=10000
AKAN_MEMORY_GC_ON_REPORT=1
```

### Terminal

```bash
akan logs <app> --grep "memory role="
# memory role=all pid=72129 rss=412.3MiB heapUsed=57.5MiB … rscWorkerRss=298.0MiB elLag=1.2/6.8/9.4ms
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Use this page as a task recipe, then verify with the relevant lint, test, or build command.

