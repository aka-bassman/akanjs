---
"akanjs": minor
---

Reads and query-level writes can reach soft-removed rows with `{ withRemoved: true }` (`find`/`findOne`/`findById`'s third argument, `count`/`exists`/`updateMany`'s last, `updateOne`/`updateById`'s options). Upgrade note: a query with a `removedAt` condition only a removed row can meet (`q.exists("removedAt")`, a comparison) now throws `can never match` instead of silently matching nothing; add the flag where removed rows are meant. A removed document is read-only, and `updateById(id, { removedAt: null }, { withRemoved: true })` revives one.
