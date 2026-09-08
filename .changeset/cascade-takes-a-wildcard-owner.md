---
"akanjs": minor
---

feat(constant): `polymorphic: "any"` lets a `removeWith` cascade name any model as its owner

A polymorphic `removeWith` required its `refPath` to name an `enumOf`, so the one shape an enum cannot express
had no cascade at all: a child whose owner may be *any* model in the app — a reaction, a comment, an attachment
that later models opt into. Listing the candidates in the child's own enum inverts the direction `removeWith`
exists for, where the owner never learns its children exist.

That declaration is now available, opt-in and priced:

```ts
parent: field(ID, { refPath: "parentType", cascade: "removeWith", polymorphic: "any" }),
parentType: field(String),   // holds the owner's refName
```

Every model's removal then sweeps the child by the removed model's own refName. The lookup is cheap — the
declaration auto-creates the same `{ removedAt, typeKey, fk }` index it always did, so a removal that owns
nothing is one index probe returning zero rows, not a table scan. The real price is bulk: a query-level removal
of *any* model would be a removal whose wildcard children were never looked for, so **one wildcard edge anywhere
turns every cascade in the app back to one document at a time**. The boot log says so in one `info` line naming
the edges, because "why does this app remove everything per document" must be answerable without reading a
model file. An app that declares none keeps the fast path exactly as before.

Refused while the class is built: `polymorphic: "any"` on a `refPath` that already names an `enumOf` (the enum
names the candidates and indexes better — keep one), a `typeKey` that is not a `String` (the sweep matches a
refName against that column, and a column that cannot hold one silently finds nothing, which is
indistinguishable from never having declared the cascade), and the option anywhere other than a
`cascade: "removeWith"` field with a `refPath`. A wildcard owner is also exempt from the mount check a
monomorphic owner fails at boot — it names no module to mount.
