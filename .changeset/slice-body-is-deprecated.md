---
"akanjs": patch
---

fix(signal): mark a slice's `.body()` deprecated — `fetch` never sends its argument

A slice is served as GET queries (its list and insight reads), and a GET carries no body: `fetch.*` sends only a
slice's `.param` and `.search` arguments. A required `.body` argument therefore failed every call with a
missing-value error, and an optional one always arrived as `null`. `.body()` still declares the argument exactly as
before, so nothing changes at runtime; the editor now shows it as deprecated. Declare the argument with `.search`
(or `.param`) instead.
