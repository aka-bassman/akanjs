---
"akanjs": minor
---

A slice's `get`/`cru`/`create`/`update`/`remove` guard may be `false`, which mounts no generated endpoint for that verb; `mcp: { cru: false }` only ever kept the verbs off the agent shelf. Upgrade note: a generated verb whose guards resolve to none is no longer mounted (it used to answer anyone over HTTP while the client never synthesized it). Resolving an endpoint class now warns about every endpoint that declares no guards.
