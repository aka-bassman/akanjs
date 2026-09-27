---
"use-agentic": patch
---

fix: the `use-agentic` entry is no longer marked `"use client"`

The entry re-exports every module with `export *`, and a client boundary cannot re-export that way — its export names
must be visible to the bundler. Every module that needs the client already carries its own `"use client"`, while
`AgentSession`, `httpRunner` and `Reference` are server-safe and are used on the server, so the directive on the entry
only claimed a boundary it did not draw. Nothing an importer receives changes.
