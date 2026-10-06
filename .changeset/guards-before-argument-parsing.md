---
"akanjs": patch
---

Arguments are parsed after the `account` guards and before the `resource` guards, so a caller an account guard refuses never reaches an argument parser. A guard or middleware that reads an argument earlier still gets it. Upgrade note: an unauthenticated call with a malformed argument now answers 401/403 instead of 400. A subscribed room's guards are re-checked on a fresh context, so a guard that memoizes per context gives a new verdict.
