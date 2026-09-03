---
"akanjs": patch
---

perf: hydrate a model from one compiled plan per class, and build a Date field's dayjs on first read

`new cnst.X(raw)` and `set()` used to re-read the field map, resolve `getProps()` and dispatch on the field kind
per field per instance, evaluated every default thunk before overwriting it, and wrapped every Date in a dayjs
object — ~300 bytes and eight getter calls each — whether or not anything read it. A 1000-row listing paid 3.5ms
and 1.7MB over the parsed JSON for that; it now pays 0.9ms and lands under the raw parse, because `HydrationPlan`
compiles the field map once per class and a Date field keeps a native `Date` under a symbol slot, with the `Dayjs`
its type promises built on first read and memoized per `Date`.

The accessors are on the prototype, so `Object.keys(model)` and `{ ...model }` no longer include Date fields.
`"createdAt" in model`, `for...in`, `JSON.stringify` (via `toJSON`), `plainFieldsOf` (`akanjs/common`),
`immerify` and `deepObjectify` all still do; copy a model with `new cnst.X().set(model)`. immer invokes the setter on
the draft, so store writes stay copy-on-write.

Two hydration passes that never produced anything are gone as well: the browser no longer `structuredClone`s
every query response — the request memo that copy protected exists only inside a request store — and
`fetch.initX` builds its `xList` / `xInsight` instances only for a caller that reads them, which a route passing
`xInit` down never did.
