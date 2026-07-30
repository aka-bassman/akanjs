---
"akanjs": patch
---

fix(devkit): hold page requests during the recycle drain, not only after the builder exits

A builder asked to recycle drains first — it stays alive finishing its queued work and refuses
everything new — and throughout that window the dev host still reported it as `ready`. So a route or CSR
request that arrived during the drain was sent, refused by the departing builder, and relayed to the
backend as a failure: the same dev error page the request-holding fix was written to remove, in the half
of the window it never covered. The hold was unreachable there, because it only runs when the send
itself fails.

The builder host now reports `recycling` for the drain, which `send()` refuses on and which the hold
decision treats like a restart. `ready` — the field `onExit` reads to tell a planned exit from a builder
that never came up — is deliberately unchanged.
