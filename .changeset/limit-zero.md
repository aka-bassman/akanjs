---
"akanjs": patch
---

A server caller's `limit: 0` reads every row again, like an omitted limit, instead of 20. A client's `limit: 0` is served the 500-row page ceiling with a one-time warn.
