---
"akanjs": patch
---

fix(signal): a `query` endpoint that declares a `.body()` argument is named in a warning at declaration

`fetch` sends a query as `GET` with its `.param` and `.search` arguments in the URL and no body, so a `.body()`
argument on a query never arrives over HTTP — a required one fails every call, an optional one is always `null` —
while an MCP call does deliver it. Behaviour is unchanged; `endpoint()` now logs one warning per such argument naming
the endpoint and the argument, and pointing at `.search()` or a mutation.
