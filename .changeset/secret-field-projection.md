---
"akanjs": patch
---

Separate `field.secret` from `field.hidden` so secret fields are excluded from default server reads and only returned through explicit projections.
