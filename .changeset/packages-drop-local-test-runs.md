---
"akanjs": patch
"@akanjs/devkit": patch
"@akanjs/cli": patch
---

fix(release): the published packages no longer carry test-run files from `local/`

`akanjs` 3.0.0-beta.19 shipped 65 files (SQLite databases and logs, 820 KB) and `@akanjs/devkit` 2 from the
gitignored `local/` directory the test suites write into, because both builds copied the package directory whole.
`build-package` and `akanjs`'s own build now leave `local/` out, and `verify-akan-publish-packages` refuses a package
whose pack list still contains it.
