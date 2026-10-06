---
"@akanjs/devkit": patch
---

Upgrading may stop `akan sync` (and every command that runs it, `build-desktop` included) with a scan-convention error on a hand-written `index.tsx`, `index.jsx` or `index.mts` at the root of `ui/`, `webkit/`, `srvkit/`, `common/` or `plugin/`. Bun loads that file ahead of the generated `index.ts` while TypeScript checks `index.ts`, so a name only the generated barrel exports typechecks and is undefined at runtime. Delete the file: the generated barrel re-exports every file and folder of the facet. A namespace it built belongs in `<facet>/<Folder>/index.tsx`, which the check leaves alone.
