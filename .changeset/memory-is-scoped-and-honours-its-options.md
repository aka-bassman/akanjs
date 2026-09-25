---
"akanjs": minor
---

fix(service): `memory()` is scoped to its owner and does what its options say

- A non-`Map` memory was keyed by its property name alone, so two services that each declared `token` shared one
  value. It is now stored under the owner's refName, like a `Map` memory already was. Values written under the old
  key are not read back.
- `get` / `set` were type-checked and then ignored at runtime. They now run: `get` turns the stored value (a `Map`'s
  entry value) into what the code reads, and `set` is its inverse.
- A declared `default` is what a missing value reads as on Redis too; Redis answers a missing key with `null`, which
  used to skip it.
- `local: true` on a `Map` gives a `Map`, not `null`.
- The declaration's `expireAt` was one fixed time computed when the class loaded. It is replaced by `ttl` in
  milliseconds, applied to each write that names no `expireAt` of its own.
- `RedisCache` expires a hash field on its own. `PEXPIREAT` on the whole hash expired every entry with the last one
  written; each field's expiry now lives in a sorted set beside the hash (portable to Redis before 7.4), expired
  fields read as missing, and they are dropped on every write and every listing.
