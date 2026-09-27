---
"akanjs": patch
---

feat: helpers the code cleanup made public

Consolidating duplicated helpers left a few new public names. Each is an addition; nothing was renamed or removed.

- `akanjs/common`: `isRecord(value)` (a type guard for an object that is neither `null` nor an array),
  `round(value, digits = 3)` and `toError(reason)` (an `Error` as is, anything else wrapped in one).
- `akanjs/document`: the `SaveEventListener<Doc>` type, the listener `listenPre` / `listenPost` take.
- `akanjs/server`: `ProcessMetricsCollector.startReporting(report)`, which reports once and then on every memory-log
  interval and returns the timer.
- Subpath exports `akanjs/server/artifact/routeSeedIndexStore` and `akanjs/server/artifact/routesManifestStore`, so a
  published `@akanjs/devkit` can read and write those artifacts without loading the whole server barrel.
