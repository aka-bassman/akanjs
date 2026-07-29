---
"akanjs": patch
---

perf(devkit): cache tailwind candidate tokens across builds

The CSS rebuild read the full text of every source file on every save. Phase 2 moved css
compilation into a per-generation batch worker, so an in-memory cache is discarded before
the next save can use it — the cache goes to disk instead, the same way font subsetting
does, which also survives a builder recycle and a dev-host restart.

Measured on `apps/akan` (556 sources, 26800 candidates): the candidate scan drops from
58-60ms to 13-19ms. Note that this is a smaller share of the rebuild than expected — the
full CSS rebuild is ~380ms, so the scan was never the dominant cost. Nothing is written
when nothing was re-read.
