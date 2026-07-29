---
"akanjs": patch
---

fix(server): stop closing the database out from under its own schema setup

`getStore()` returns a store synchronously while `ensure()` goes on creating tables and indexes, so a
shutdown could close the connection mid-setup. The rejection was unhandled — `void store.ensure()` —
and surfaced as `RangeError: Cannot use a closed database` blamed on whatever ran next, which read as a
flaky test rather than a race at shutdown. Reproduced at 3 failures in 8 runs of the akanjs suite, 0 in
10 after the fix.

All three SQL adaptors (bun:sqlite, libsql, Postgres) now track those setups and let them finish before
closing. Every statement `ensure()` runs is `IF NOT EXISTS`, so one cut short is simply redone next boot.
