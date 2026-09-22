# Akan Runtime

- Source: /docs/core/runtime
- Mirror: /llms/pages/docs/core/runtime.md
- Section: docs
- Category: Core Concepts
- Priority: P0

## Headings

- Akan Runtime (#akan-runtime)
- Identity And Environment (#env-identity)
- Text Search Variables (#env-search)
- Logging Variables (#env-logging)
- getEnv() (#get-env)
- OpenAPI JSON (#openapi-json)
- Selective Module Boot (#module-selection)
- Health, Metrics, Logs (#health-metrics-logs)

## Content

Akan Runtime

Akan applications run on a Bun-based runtime that connects app code, generated artifacts, server routes, and pages. The app entry point (main.ts) starts the runtime, and Akan handles the server shape behind it.

When Akan App starts, Akan Server prepares everything the app can serve. In practice, the runtime exposes four kinds of work.

Internal API (Queue, Timer, etc.): internal work that runs without a browser request.

API (HTTP, WebSocket): public communication for data requests and realtime updates.

SSR Pages (Web): web pages rendered by the server and sent to the browser.

CSR Page (Android, iOS): client-rendered pages used by mobile targets.

AKAN_REPLICA decides how many server processes each role gets, and it defaults to 0,0,1 everywhere: one all server and nothing else. With a single traffic replica there is nothing to balance, so Akan App runs that server inside its own process instead of spawning it and proxying to it. The container holds one process, and every request skips a proxy hop.

all: runs both federation and batch behavior in one server process. This is the default, and the shape almost every deployment ships.

federation: serves browser traffic such as pages, API calls, and WebSocket connections.

batch: runs background work such as queues, timers, and scheduled jobs.

Five things bring the gateway back: two or more replicas, a batch-only replica that never listens, AKAN_SOLO=false, passing replica to new AkanApp(...), and akan start, which always runs it because the gateway is also the dev server's build relay and error overlay. Then Akan App spawns the servers and load-balances browser traffic across the ready federation and all processes.

A single Akan App has built-in clustering. You can run multiple server replicas and let Akan App distribute traffic, without setting up separate local load-balancing tools such as nginx, docker compose, or pm2.

Identity And Environment

The root .env file decides which organization, domain, environment, operation mode, and log level the app uses while it runs. Most projects keep these values stable, but changing them lets the same app behave like a local, debug, develop, or production-like service.

Environment variables prefixed with AKAN_PUBLIC_ are public. They can be read by browser code, so never store secrets, private tokens, or credentials in them.

Four of those names answer who this app is and where it runs. getEnv() reads them once and caches the result, and it throws rather than guessing when the first two are missing:

required

Organization or repository namespace, usually fixed for the life of the project. getEnv() throws when it is missing instead of falling back.

The domain the app builds links, callbacks, and domain-based routes from. Also throws when missing.

Which data set the app runs against. local is your machine and your test data, debug is shared test data for reproduction, develop is the team integration check, and main is production-like behavior.

local when ENV=local, else cloud

Where clients connect. local talks to the local runtime, cloud talks to cloud services, and edge uses the edge-facing paths. module is in the type and no runtime branch reads it.

In practice you move two of them together. Build a feature with ENV=local and OPERATION_MODE=local, switch ENV to debug or develop when you need shared data or shared services, and deploy with ENV=main against whichever operation mode the cluster serves:

Text Search Variables

Full-text search is on unless you switch it off, and both of its variables are deployment-wide decisions rather than per-process ones. A process cannot clean up triggers for models it does not mount, so give every process in one deployment the same pair.

unset means on

Switches the full-text index off. Indexed data is kept and re-enabling reconciles every model, so turning it off is reversible. An unrecognised value fails the boot rather than guessing.

The fts5 tokenizer the index is built with; database.search.tokenizer in the app config takes precedence. Changing it rebuilds the index from the mirror on the next boot, so no data is re-read from the model tables — but the rebuild takes no cross-process claim, so a fleet restarted at once repeats it in every process. Stagger the restart when the mirror is large. A value this SQLite build cannot provide fails the boot and names the fix, rather than starting a server whose every search would raise; writes are left alone, so the models on that database keep accepting them and the next healthy boot recovers the index in full.

Logging Variables

The level ladder is trace, verbose, debug, info, warn, error, and three destinations read it independently: the container's stdout, the rotating log file, and any sink the app registered. Everything else here decides how much structure travels with a record and who is allowed to ask for more.

How much runtime output the console carries. log is a deprecated seventh name that now means info and warns once.

What goes to the container's stdout, in either format. kubelet and the docker json-file driver rotate container logs by size, so a stdout at trace can outrun the collector; info is the production recommendation, with the flight recorder promoting detail for failed calls only.

How much structured Logger output is written to files, independent from the terminal log level.

text is the human console line. ndjson makes the container's stdout one JSON record per line, written only by the gateway or the solo replica: every other server process turns its console off and forwards its records instead, and a child's crash stack is wrapped as a raw record so the stream stays valid JSON. ndjson-only writes the rotating file as JSON too. Give every process the same value.

AkanApp writes gateway and child process logs to runtime/logs by default. Set 0 to disable file logging; the generated Dockerfile sets 0, because a container's writable layer is ephemeral and stdout is the collection path.

Where file logging writes, when the default directory is not where the volume is mounted.

Create the next sequence file when a process log reaches this size.

Keep this many rotated files per process key, such as gateway or child-0.

Every request, websocket call, MCP call, internal trigger and page render runs under a lightweight trace, so its log records carry traceId, endpoint and origin. 0 switches it off. Independent from AKAN_TRACE, which adds span and query aggregation.

A child forwards log records to the gateway over IPC only while akan logs or a console .tail is subscribed at that level. 1 keeps forwarding on regardless.

unset — route absent

Set it and GET /_akan/app/logs serves the ring buffer and live records as text/event-stream to a matching bearer token; the LogQuery is the query string, each event's id is the hub seq, Last-Event-ID resumes and an evicted range arrives as an explicit gap event. Unset, the route does not exist. A session tool for one pod — collection is stdout.

One record per call at its end: ok or error, the endpoint, ms, status, userId, and under AKAN_TRACE=1 the db and cache figures. 1 or all writes every call; slow keeps only failed calls and those over AKAN_LOG_FLIGHT_MS. Off by default because it grows with QPS.

Keeps each call's own last 64 records that fell below the level and promotes them, marked flight=true, only when the call failed or ran past the threshold. Measured cost on a clean call: about 190ns.

A call at least this long is slow, for both the flight recorder and the slow canonical mode.

Caps the records the process holds at once; a call past the cap runs unrecorded.

How many records the in-memory hub keeps for akan logs and the SSE stream to replay. Oldest are dropped first; a reader that falls behind gets an explicit gap event rather than a silent hole.

The same buffer's byte ceiling, whichever limit is reached first. Raise it when records carry large attrs; the hub is per process, so the cost is multiplied by the replica count.

unset — local only

A request carrying x-akan-debug logs at trace for its own duration, whatever the process level. Honoured unconditionally in local; elsewhere only when the header value equals this secret, compared in constant time, because a client that can lower a server's log level is a log-volume vector.

The ring the gateway (or the solo replica) keeps for akan logs --replay and .trace is not an environment decision: it holds 2,000 records or 4 MB, whichever fills first, and the older record goes first.

getEnv()

getEnv() is the runtime helper that turns .env values into the information your app actually uses. Instead of hand-writing API URLs or WebSocket URLs, app code can read the prepared values from getEnv().

Local mode

When OPERATION_MODE is local, getEnv() points the browser and API client to your local Akan runtime, usually localhost:8282.

Cloud / edge mode

When OPERATION_MODE is cloud or edge, getEnv() builds service URLs from the app name, environment, and serve domain.

Use getEnv() when application code needs runtime addresses or environment identity. It keeps URL decisions in one place and makes local, cloud, and edge modes easier to switch.

OpenAPI JSON

Akan can expose the HTTP query and mutation surface declared in signal files as an OpenAPI 3.1 document. This is useful when you want to connect Swagger, Redoc, external clients, or SDK generation tools to the same API shape Akan already uses.

After enabling it, request /openapi.json from the app origin. In local mode, the document is usually available at localhost:8282/openapi.json. The normal API prefix stays at /api; OpenAPI JSON is served as a framework metadata route.

App option

Use this when the app should always expose OpenAPI JSON in that entry point.

Environment variable

Use this when deployment or local scripts should decide whether the endpoint is available.

Server option

Use this when you start AkanServer directly instead of going through AkanApp.

OpenAPI JSON is opt-in. Enable it only for environments where exposing API structure is acceptable, because it describes routes, request fields, response schemas, and guard metadata.

Selective Module Boot

An app mounts every module its libraries declare. The modules option narrows that: name the modules a process should serve and Akan boots those plus the ones they depend on, leaving the rest out of the container entirely. A module left out has no service, no signal, no route, and no scheduled job. This is how one codebase runs as several small processes, such as a batch worker that only needs its own domain.

Dependencies are followed for you, so you list entry points instead of the whole graph. A named module pulls in every service and signal it injects, and every model its cascade removes. The boot log prints what was mounted.

Boot log

disableModules and disableLibs are the same idea from the other end: mount everything except what you name and whatever reaches it. disableModules takes module names, disableLibs takes the name of a library and stands for every module that library registered, so it does not drift as the library gains modules. Reach for either when the process serves most of the app and a library it depends on is one it does not use — server.ts is generated from the dependency graph, so a library cannot be dropped by editing it. Both are accepted in all three places modules is, as AKAN_DISABLE_MODULES and AKAN_DISABLE_LIBS in the environment. Naming a module in both modules and an exclusion leaves it out, because modules says what a process is for and the exclusions say what it must not run.

Use this when the entry point itself decides which modules the process serves. Every replica it spawns gets the same selection.

Use this when deployment decides the split, so one image can run as different processes without a second entry point.

An unregistered name fails the boot instead of being ignored, in all three options: a typo in modules quietly drops a module, and a typo in an exclusion quietly keeps one running. Selection narrows the enabled set rather than replacing it, so it never turns on a module whose service is disabled. A module that reaches a disabled one goes with it, and the boot log names the ones you did not ask for. Endpoints of a module left out do not exist, so a client that calls one gets a 404.

Health, Metrics, Logs

Akan runtime exposes simple ways to check whether the app is alive, how busy it is, and what it is doing. In local development, these are mostly useful when a page does not load or a background job seems stuck.

Health

Use this to check whether the server processes are running and ready. A solo replica answers it itself, in the same shape the gateway uses, so a probe reads one contract either way.

Metrics

Use this to see runtime counts such as active requests, WebSocket connections, rooms, and process metrics.

Logs

Use AKAN_PUBLIC_LOG_LEVEL to choose how much detail appears in the terminal. AkanApp also stores gateway and child process output in runtime/logs by default, using AKAN_LOG_FILE_LEVEL for structured Logger output and rotating files by date and size.

File names include app name, environment, operation mode, local date, process key, and sequence. Direct console.log calls from child servers are captured through stdout/stderr pipes; direct gateway console.log calls are not part of Logger sink capture.

Start with health when the app does not respond. Use metrics when the app responds but feels busy. Increase LOG_LEVEL or enable AKAN_MEMORY_LOG when you need more terminal detail.

## Code Examples

### apps/myapp/main.ts

```ts
import { AkanApp } from "akanjs/server/akanApp";

const run = async () => {
  await new AkanApp().start();
};
void run();
```

### .env

```bash
AKAN_PUBLIC_REPO_NAME=myorg
AKAN_PUBLIC_SERVE_DOMAIN="mydomain.com"
AKAN_PUBLIC_ENV=local
AKAN_PUBLIC_OPERATION_MODE=local
AKAN_PUBLIC_LOG_LEVEL=debug
AKAN_SEARCH_ENABLED=1
AKAN_SEARCH_TOKENIZER="unicode61 remove_diacritics 2"
```

### .env

```bash
# Build a feature locally
AKAN_PUBLIC_ENV=local
AKAN_PUBLIC_OPERATION_MODE=local
AKAN_PUBLIC_LOG_LEVEL=debug

# Reproduce with shared test data
AKAN_PUBLIC_ENV=debug
AKAN_PUBLIC_OPERATION_MODE=local
AKAN_PUBLIC_LOG_LEVEL=debug

# Deploy production to a cloud server
AKAN_PUBLIC_ENV=main
AKAN_PUBLIC_OPERATION_MODE=cloud
AKAN_PUBLIC_LOG_LEVEL=info

# Deploy production to an edge server
AKAN_PUBLIC_ENV=main
AKAN_PUBLIC_OPERATION_MODE=edge
AKAN_PUBLIC_LOG_LEVEL=info
```

### Using getEnv()

```ts
import { getEnv } from "akanjs/base";

const env = getEnv();

env.clientHttpUri; // app URL
env.serverHttpUri; // API URL
env.serverWsUri;   // WebSocket URL
```

### local

```bash
AKAN_PUBLIC_OPERATION_MODE=local
clientHttpUri=http://localhost:8282
serverHttpUri=http://localhost:8282/api
serverWsUri=ws://localhost:8282
```

### cloud / edge

```bash
AKAN_PUBLIC_APP_NAME=myapp
AKAN_PUBLIC_ENV=main
AKAN_PUBLIC_SERVE_DOMAIN=akanjs.com

serverHttpUri=https://myapp-main.mydomain.com/api
serverWsUri=wss://myapp-main.mydomain.com
```

### apps/myapp/main.ts

```ts
import { AkanApp } from "akanjs/server/akanApp";

const run = async () => {
  await new AkanApp("./server", { openapi: true }).start();
};
void run();
```

### Read the OpenAPI document

```bash
curl http://localhost:8282/openapi.json
```

### apps/myapp/main.ts

```ts
import { AkanApp } from "akanjs/server/akanApp";

const run = async () => {
  await new AkanApp("./server", { modules: ["article"] }).start();
};
void run();
```

### Code

```bash
[DiLifecycle] INFO  Mounting 3 of 12 module(s): article, file, user
```

### apps/myapp/main.ts

```ts
import { AkanApp } from "akanjs/server/akanApp";

const run = async () => {
  await new AkanApp("./server", { disableLibs: ["social"], disableModules: ["legacyImport"] }).start();
};
void run();
```

### Code

```bash
[DiLifecycle] INFO  disableModules/disableLibs also dropped 2 dependent module(s): digest, notification
```

### health

```bash
curl http://localhost:8282/_akan/app/health
```

### metrics

```bash
curl http://localhost:8282/_akan/app/metrics
```

### logs

```bash
AKAN_PUBLIC_LOG_LEVEL=debug
AKAN_LOG_FILE_LEVEL=trace
AKAN_MEMORY_LOG=1
AKAN_LOG_MAX_SIZE_MB=50
AKAN_LOG_MAX_FILES=100
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Treat convention and generated-file rules as stronger than local style guesses.

