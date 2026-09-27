---
---

fix(util): `resolveJwt` no longer writes the caller's bearer token into the log

When a token failed to verify, the verbose line carried the whole `Authorization` header — a live credential in any
sink at `verbose`. The line now names the failure only.
