---
"akanjs": patch
---

perf: bound builder memory with RSS recycle and disposable batch workers

Apply the phase-2 bounded-builder plan so Bun.build retention no longer grows without
bound across a long `akan start` session:

- Report builder RSS after each work item and recycle the builder process when it crosses
  a ceiling (`AKAN_BUILDER_MAX_RSS_MB`, else cgroup × 0.35, else 1200 MB), only when no
  build is in flight and the generation is green.
- Extract shared `memoryLimit` helpers (also used by the RSC worker) and announce recovered
  pages/css state after a recycle-triggered boot so a live backend picks up the new
  `base-artifact.json`.
- Move pages/css/csr `Bun.build` work into a disposable `buildBatch` worker that exits per
  generation (optional `AKAN_BUILD_WORKER_REUSE_COUNT`), keeping the watcher process thin.
