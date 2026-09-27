---
"@akanjs/devkit": patch
"@akanjs/cli": patch
---

fix(devkit): executor, doctor, barrel and code-agent fixes from the devkit/cli bug sweep

- **Workspace apps, libs and packages are listed in name order**, not in the order the file system answered. It
  shows in pickers, `akan context` / `akan doctor` listings, the `## Workspace` lines `akan agent install` writes,
  and the order a lib's `docker.preRuns` / `postRuns` land in a generated Dockerfile, which is now the same on every
  build.
- **Barrel import rewriting no longer drops re-exports when two barrels are analyzed at once.** Concurrent analyses
  shared one regex position, so a build could leave an import on the whole barrel, differently from build to build.
- **`akan doctor`, `akan workflow validate` and MCP `doctor_workspace` ignore a malformed workflow artifact** instead
  of throwing a `TypeError`.
- **`SysExecutor`'s module listings filter on each module's own file** — they returned every folder — and find a
  service module at `lib/_<name>/<name>.service.ts`. `getScalarDictionaryFiles` reads `lib/__scalar/`, and
  `getTsConfig({ refresh: true })` re-reads the config it extends.
- `akan code`: a prompt typed instead of answering drops the questions and approvals it replaced, a session past
  512 KiB still shows in `/sessions`, and an MCP token refreshed without `expires_in` is kept until the server
  refuses it instead of being refreshed on every connect.
