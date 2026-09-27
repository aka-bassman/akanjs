---
"akanjs": patch
---

fix(server): run a route's head once per render, and not at all for a cached replay

The RSC worker resolved every matched route's head before deciding how to render, although only a partial-commit
patch decision ever reads it. A full render therefore ran the head twice, and a replay from the RSC result cache
ran it once, backend queries included. The head now runs for that decision only when partial commit is on, the
navigation is a patch candidate and the page declares `rscPatchHeadSafe`; otherwise it runs once, inside the
render. A replayed cached page runs no head at all, the same as its body: a head that would now throw `notFound()`
or `redirect()` no longer pre-empts a cached replay until the entry expires or is invalidated.
