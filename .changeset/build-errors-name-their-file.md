---
"@akanjs/devkit": patch
---

fix(build): each reason a failed bundle gives names the file and line it points at

`akan build` and `akan start` listed the bundler's reasons under "Bundle failed" as bare messages, so
`Could not resolve: "./not-there"` never said which file imported it. Each reason now carries the location Bun
reports, relative to the workspace root:

```
Bundle failed
  Could not resolve: "./not-there" (apps/demo/ui/Broken.tsx:2:22)
```

A reason Bun gives no location for prints as before, and a file outside the workspace keeps its absolute path. An
error a plugin raised while loading a file names that file without a line, unless its message already names it.
