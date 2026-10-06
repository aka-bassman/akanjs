---
"akanjs": patch
---

A Mongo-style `schema.index({ x: "text" })` no longer builds a B-tree over the JSON value (which could fail long inserts on Postgres); it warns at boot and points at the `text` field role, and drops the index an earlier boot built for exactly that declaration.
