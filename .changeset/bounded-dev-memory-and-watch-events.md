---
"akanjs": patch
---

feat(devkit): bound dev-server memory and stop losing watch events

Two dev-server problems that compounded each other.

- The builder grew without bound because `Bun.build` retains native bundler arenas that
  `Bun.gc(true)` never reclaims. It is now recycled once its RSS passes a ceiling derived
  from the container's cgroup limit, draining in flight work first.
- Bun's recursive `fs.watch` reports roughly one path per coalescing window and discards
  the rest, so concurrent saves went unbuilt. Changes are now resolved against a
  `SourceMtimeIndex` baseline and events only decide *when* to look.
