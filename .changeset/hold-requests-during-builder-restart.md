---
"akanjs": patch
---

fix(devkit): hold page requests while the builder restarts instead of failing them

A route or CSR request that arrived while the builder was recycling or restarting was answered
immediately with `builder is restarting; reload after the builder is ready`. Nothing retried, so the
browser tab showed an error for a builder that was seconds from being back — and the builder is recycled
routinely, whenever its RSS passes the ceiling.

Those requests are now held and replayed when the builder reports ready, which is what the idle-suspend
path already did for exactly this reason. `BuilderRpc`'s own timeout still bounds the wait, the queue is
capped so a builder that never returns cannot grow it, and anything still held when the builder is
stopped for good is failed rather than left silent.
