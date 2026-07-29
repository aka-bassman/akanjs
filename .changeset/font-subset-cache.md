---
"akanjs": patch
---

perf(devkit): cache font subsetting across dev-server boots

`FontOptimizer.optimize()` re-subset every font file on each builder boot even though it
already computed a config hash and wrote hashed outputs. It now skips the
`fonteditor-core` / `subset-font` work when the expected outputs are present, which also
keeps those two packages out of the common path entirely.
