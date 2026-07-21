---
"akanjs": minor
"@akanjs/cli": minor
"@akanjs/devkit": minor
"create-akan-workspace": minor
---

Improve dev server stability:

- Add `isPortInUseError` utility for detecting EADDRINUSE across Bun versions
- Stop crash-looping replicas after max boot failures in dev mode (`akan start`)
- Handle parent IPC disconnect to prevent orphaned gateway/child processes
- Report `wsUpstream` in ready IPC so gateway routes to the actual bound port
- Fall back to ephemeral port when preferred WS port is in use
- Support controlled dev-host restart on config changes (`akan.config.ts`, `tsconfig`)
- Forward backend build-status IPC to dev host for error surfacing in HMR overlay
- Limit backend recovery attempts (5 max) and idle until next server-side edit
- Add integration tests for config-edit restart and boot-failure recovery
