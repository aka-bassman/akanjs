---
"akanjs": patch
---

fix(service): a required nested scalar fills from its own field defaults instead of failing the write

`field(Coordinate)` on a model whose scalar carries a default for every one of its own fields still had to be
written `field(Coordinate, { default: () => new Coordinate() })`, or `create({ name })` threw
`Missing required field: location`. Every other layer already disagreed: `getDefault` recurses into a nested
scalar, `HydrationPlan` constructs one, and `sampleOf` fills one — only the SQL write path treated an absent
scalar as a missing value rather than a constructible one.

`prepareDocument` now applies the same rule `getDefault` does, in the same order — a parent-level `default`
first, then `nullable` (an optional nested scalar stays absent), then the scalar's own defaults. A **relation**
is unchanged and still fails closed: only the caller knows which row it names.

The read path had the matching hole. A row written before the field was declared carries no value for it, and a
scalar has no primitive `DEFAULT_VALUE` to fall back on, so `decodeDocumentPayload` handed back `null` — which
the next `save()` of that row rejected as `Field is not nullable`. It now constructs the same defaults, so an
existing row migrates by being saved.

Array defaults are copied per document rather than shared. A field with no declared default is given `[]` at the
class build, and both the store and `getDefault` handed that one array to every document filled from the model,
so a `doc.tags.push(...)` landed in the field default and in every document created after it. The constant layer
was already safe — `crystalize` copies an array on the way into an instance — and the document path now is too.
