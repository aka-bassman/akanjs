---
"@akanjs/devkit": minor
"@akanjs/cli": patch
---

A test lives in the module folder it covers: `akan sync` no longer admits `<model>.signal.test.ts` / `.spec.ts` at the `lib/` root and names where it goes (`lib/<model>/<model>.signal.test.ts`; an app-wide harness to `srvkit/*.spec.ts` or `lib/_<app>/<app>.signal.spec.ts`), and `akan quality scan` warns on a `<model>.<qualifier>.signal.test.ts` (`akan.layout.qualified-signal-test`): a module keeps one signal test, a further suite is a nested `describe` in it. The conventions and mcpRule guidelines say the same. A module's `*.signal.test.ts` / `*.service.test.ts` may import the runtime's `node:*` and `bun:*` modules (`no-import-external-library-in-test.grit`); third-party packages stay refused there.
