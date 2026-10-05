---
"@akanjs/cli": patch
---

Stop referencing `tsconfig.spec.json` from the generated app `tsconfig.json` template so freshly generated apps pass the workspace root-file scan and typecheck.
