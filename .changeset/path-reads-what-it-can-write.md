---
"akanjs": patch
---

`pathGet` reads every path `pathSet` can write

The two halves of the dotted-path vocabulary had drifted apart, and only the reading half was short. `pathSet`
parsed segments with `/[^.[\]]+/g` and read containers through a `Map` branch; `pathGet` did `path.split(".")` and
a bare property access. So `cutFrames[2].content` — the bracket spelling a form field hands `writeOn<Model>` — was
three segments to a write and one to a read, and a `field(Map, …)` entry could be written and never read back. The
failure is silent in both cases: `pathGet` answers with its fallback, which is `null`.

Both now share one definition, `toPathSegments`, so a path that writes and a path that reads cannot disagree about
what its segments are, and `pathGet` reads a `Map` entry the way `pathSet` writes one. A caller that named its own
separator keeps the plain split it has always had — under any separator but `.`, a `[0]` is part of a key rather
than an index.

The argument order is left alone and remains the trap it was: `pathGet(path, obj)` against `pathSet(obj, path,
value)`. Flipping it would be caught by the typechecker rather than silently, and there are only two callers — but
`pathGetLoose` takes the same `(path, obj)` order as `pathGet`, so flipping one of the pair would replace a trap
between get and set with a trap between get and get. The reference documentation's own example had the arguments
backwards and is fixed here, which is the evidence that this one is worth deciding rather than leaving implicit.
