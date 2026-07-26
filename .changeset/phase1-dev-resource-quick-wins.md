---
"akanjs": patch
---

perf: cut idle/dev-save memory with phase-1 quick wins

Apply the phase-1 resource plan without architecture changes:

- Self-arming CSR rebuild — skip the dead CSR artifact until `/__csr` or `?csr=true` first needs it
  (keeps mobile live-reload working once armed).
- Bound RSC worker reload accumulation with threshold/RSS recycle instead of retaining every pages
  bundle generation.
- Split `@akanjs/devkit` into subpath exports and move route/overrides AST validation out of the
  resident `executors` graph so `typescript` is not pulled into long-lived start processes.
- Lazy-load CLI command modules via a command manifest so unused command graphs stay cold.

Also await async endpoint guards (including in parallel) so `canPass` promises are honored.
