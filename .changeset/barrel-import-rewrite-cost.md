---
"akanjs": patch
---

perf(devkit): stop parsing every source file to find barrel imports

`rewriteBarrelImports` ran a full TypeScript parse of every file it was given, to find import
statements it then discarded for all but the barrel ones. It runs on every source file of every dev
rebuild, which made it the single most expensive thing in one.

- **63% of files import no barrel at all.** A static import cannot name a specifier without that
  specifier appearing literally in the source, so a substring test skips them before the parser is
  involved — 4ms for 1189 files. The bundler plugin already did this privately; it now lives in
  `rewriteBarrelImports` so the CSS and client-entry walks get it too.
- **`setParentNodes: true` was paid for no reader.** Nothing reads `node.parent`; every position comes
  from `getStart(sourceFile)`, which takes the file explicitly.

Measured across 1189 files: 299ms and 161MB of RSS become 88ms and 5MB. End to end on `apps/akan`,
`CssCompiler.discoverCssAndSources` drops from 262ms to 190ms and the client-entry discovery walk from
242ms to 176ms, retaining 107MB instead of 128MB. Verified output-identical on 1535 files: same import
statements from the parser, and no file the pre-filter skips would have been rewritten.

`CssCompiler` also memoises import resolution for the life of one rebuild, where a miss cost up to 13
sequential `exists()` calls repeated per importer (a further 216ms → 190ms).
