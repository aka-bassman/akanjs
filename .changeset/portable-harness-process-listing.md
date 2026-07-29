---
"akanjs": patch
---

fix(devkit): survive a container image with no `ps`

`DevStabilityHarness` shells out to `ps` to find leftover dev processes, and slim images such as
`oven/bun` ship without procps, so the spawn threw. It now returns the same `null` it already
returns for a `ps` that does not answer in time — "could not look", not "nothing is running".
Fixture liveness never depended on it (`process.kill(pid, 0)`), so sweeping still works.
