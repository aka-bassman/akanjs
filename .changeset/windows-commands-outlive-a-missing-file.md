---
"@akanjs/devkit": patch
"@akanjs/cli": patch
---

fix(windows): `akan` commands and the dev build worker no longer stop silently at a missing file

On Windows, Bun lets a process exit while a `Bun.file` read of a file that does not exist is still pending, if
nothing else is keeping it alive. `akan build` stopped right after `sync` without an error, and the dev server's boot
build ended with "build worker exited with code 0 before reporting a result" on any app that had no font cache yet.
The CLI and its build workers now await their work from the entry module, which keeps the process alive until it
settles; a failed command still prints its error once and exits 1.
