---
"@akanjs/devkit": minor
---

`akan sync` prunes a root-declared dependency nothing imports and realigns every root-declared entry to the root's version; `package.json#akan.keepDependencies`, `externalLibs` and `trustedDependencies` are always kept. `akan install-library` keeps the root's versions and only adds what the root lacks.
