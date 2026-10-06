---
"@akanjs/cli": patch
---

A facet folder with nothing to export syncs to `export {};`, so a barrel still exporting a deleted file heals on the next sync, and `akan create-library` no longer scaffolds placeholder `*Logic.ts` files.
