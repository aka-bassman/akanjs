---
"akanjs": patch
---

perf(devkit): stop retaining source text in client-entry discovery, and expire its misses

`GraphClientEntryDiscovery` is created once per builder process, so its caches live for the
whole dev session in the watcher.

- It kept the full text of every file the walk had touched plus a barrel-rewritten copy of
  each, when the walk only ever asks two things of a file — is it a client entry, and what
  does it import — both of which were already cached separately under the same key. Those
  three caches collapse into one holding just the derived facts: measured on `apps/akan`,
  retention after a full walk drops from 135-142MB to 125-127MB.
- `invalidate()` never cleared the file-existence and resolution caches. They are keyed by
  extension-less path and by `dir\0specifier`, neither of which maps back to a file that was
  just created, so a negative recorded before a module existed was permanent: adding a new
  module and importing it left the import unresolved until the next config change or builder
  recycle. Negative answers are now dropped on any invalidate; positive ones are keyed by a
  real path and are left alone.
