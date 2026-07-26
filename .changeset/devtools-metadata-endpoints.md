---
"akanjs": patch
---

feat: expose local-dev metadata endpoints for devtools visualization

Add four JSON endpoints, registered only when `AKAN_PUBLIC_ENV=local` (override with `AKAN_DEVTOOLS`),
that describe the running system for an external developer-tools UI:

- `GET /_akan/constant` — every model's Input/Object/Full/Light/Insight view, scalars, enums, filter
  query/sort, and derived relation edges.
- `GET /_akan/signal` — declared and framework-generated endpoints, slices, internals, and a flattened
  route table with fully resolved HTTP/WS paths.
- `GET /_akan/dictionary` — the merged i18n tree, module kinds, and flattened dotted keys (`?lang=` narrows it).
- `GET /_akan/deps` — the DI graph: services, adaptors, signals, uses, middleware, env, roles, and the
  topological init stages.

They live in `AkanServer.#createBuiltinRoutes()` next to `/openapi.json`, so they stay off the `/api` prefix
and never enter the `serializedSignal` payload shipped to clients. Outside `local` the routes are not
registered at all and fall through to the SSR catch-all.

Supporting changes:

- `DictionaryRegistry` collects each `makeTrans` root, which was previously closure-private and unreachable
  from the server.
- `DiLifecycle` gains a read-only `modules` accessor and retains disabled-module reasons that were only logged.
- `SignalResolver.getScheduleSkipReason` is now public so the reported schedule placement cannot drift from
  the scheduler's own rules.

Secrets discipline: secret constant fields report name and type but no `default`/`example`, `env` carries
values for `AKAN_PUBLIC_*` only and every other key by name alone, and `uses` are reported as key plus class
name — never the instance. `env` inject keys are extracted by scanning the factory source, never by running it.
