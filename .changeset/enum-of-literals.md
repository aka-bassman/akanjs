---
"akanjs": patch
---

`enumOf` infers its literal values without `as const`, so a value outside the list fails to compile. Upgrade note: code that relied on a widened `string`/`number` enum type may need a narrower type.
