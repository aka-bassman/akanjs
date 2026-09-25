---
"akanjs": minor
---

feat(document): a model loader remembers nothing unless it declares `cache`

`loader.byField` / `byArrayField` / `byQuery` built their `DataLoader` with the default `cache: true`, and a model's
loaders live as long as the process — so a key read once was answered from memory forever, however the document
changed. They now take an option after the default query, `{ cache }`: `false` by default, a number of milliseconds
to keep each key, or `true` for the life of the process. A failed load is never kept.

`DataLoader` itself now defaults to `cache: false` and accepts the same `boolean | number`.
