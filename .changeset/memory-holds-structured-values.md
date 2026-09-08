---
"akanjs": patch
---

fix(service): a `memory(...)` value that is a scalar or model class round-trips on both caches

`memory(Map, { of: SomeScalarInput })` typechecked and serialized through the constant, then handed the
resulting object to a cache that holds a string, a number or a Buffer. The sqlite-backed `SolidCache` happens to
JSON anything else on its own, so it worked there; Redis passes the value to `hset`, which coerces it to
`"[object Object]"`. The same declaration meant two different things per deployment, and the failure only
surfaced on read — so apps hand-encoded JSON into a `String` memory to get a structured value back.

A value whose declared type is not a primitive scalar now travels as JSON text in both directions, decided by
the declaration rather than by the runtime value, so both adaptors store and return the same thing. A value that
arrives already parsed — a row written before this change, or `SolidCache`'s own `json` type — is still read
correctly.
