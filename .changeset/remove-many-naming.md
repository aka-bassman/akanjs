---
"akanjs": minor
---

refactor(document): rename `deleteMany` to `removeMany`, and reserve `delete` for an actual delete

The model facade's `deleteMany(query)` and the store's `deleteManyByQuery(query)` never deleted anything: both
stamp `removedAt` in one atomic UPDATE, exactly like `remove(id)` does. The framework has no hard delete for a
model table at all — `DELETE FROM` appears only against the cache, `_akan_meta`, and the search mirror.

They are now `removeMany` and `removeManyByQuery`, so the name matches the write, and `delete` stays free to mean
a real `DELETE` if one is ever added. Services also gained `__removeMany(query)`, the path a bulk cascade takes.

Rename the call sites; the behaviour is unchanged.
