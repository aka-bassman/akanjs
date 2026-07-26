---
"akanjs": patch
---

fix: register and correctly invoke `internal(... { process })` queue workers

`process` internals accepted jobs but never ran them. Three defects:

- `buildInternal.process` was the only scheduled factory that did not default `enabled: true`, so
  `SignalResolver.resolveSchedule` skipped it and no worker was ever registered. Placement is now governed by
  `serverMode`/`operationMode` alone, matching the existing `serverMode: "all"` default.
- Registered workers were called with the `AkanJob` rather than the declared `msg` arguments. The job payload is
  now spread onto the declared args and deserialized against their declared types, so the `exec` signature
  `(...msgArgs, job)` holds at runtime.
- `BullQueue` scoped its worker to queue `<prefix>:<key>` while enqueueing onto queue `<prefix>`, so cluster mode
  never consumed jobs. Producer and consumer now share one queue per process key.

`resolveSchedule` also logs when a `process` internal gets no worker on the current server, since the producer is
installed regardless of placement.
