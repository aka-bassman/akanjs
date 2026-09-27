---
"@akanjs/cli": patch
"create-akan-workspace": patch
---

fix(cli): a freshly created workspace builds and starts

The sample app wrote `srvkit/AuthGuard.ts` and `srvkit/SessionInternalArg.ts`, but a `srvkit/` barrel exports only
camelCase file names, so no `srvkit/index.ts` was generated. The first `akan build` failed with
`TS2307: Cannot find module '@apps/<app>/srvkit'` and `akan start` with `Cannot find package '@apps/<app>'`. The
sample now writes `srvkit/guards.ts` and `srvkit/internalArgs.ts`, the names the conventions give those files.
