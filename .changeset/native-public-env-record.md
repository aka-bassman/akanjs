---
"@akanjs/devkit": patch
"@akanjs/cli": patch
---

Every native build and update pack records the `AKAN_PUBLIC_*` values its web bundle inlined in `bundle.json` as `web.publicEnv`, with a `web.publicEnvHash`; `pack.json` carries the hash too. Keys `akan.config.ts` derives are left out. A target with `updates` refuses a value an update could not carry: a key naming a secret, a non-string, a control character, or more than 256 keys or 64 KiB.

`--public-env <file>` on `release-ios`, `release-android`, `pack-update`, `push-update` and `register-binary` builds the web bundle with exactly those values, taken from a JSON map or a store build's `bundle.json`; the shell's and `.env`'s other `AKAN_PUBLIC_*` are dropped. `pack-update --against` repeats what that store build recorded, and a pack whose values differ needs a new store build (exit 2). `register-binary` repeats what the store build recorded.
