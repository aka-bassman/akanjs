---
"akanjs": patch
"@akanjs/devkit": patch
"@akanjs/cli": patch
---

fix(console): a production `akan console` brings services up and starts no schedule

The `console.js` an `akan build` writes never marked its process as a console, so `server.start()` took the replica
branch: it registered every `interval` / `cron` / queue worker, ran every internal `init()`, and opened the log
transport — a second scheduler inside a running deployment. The shim now marks the process before it loads the
server, the same way `akan console` does in development, so a console runs service and adaptor `onInit` and nothing
the internals schedule.

`assertAkanConsoleAllowed()` was handed `server.env`, which carries neither `environment` nor `operationMode`, so it
effectively checked `NODE_ENV` alone. Called with no argument it now reads the deployment from `AKAN_PUBLIC_ENV` /
`AKAN_PUBLIC_OPERATION_MODE` (deriving the mode the way `getEnv()` does): a `main` environment, a `cloud` or `edge`
operation mode, or `NODE_ENV=production` refuses the console unless `AKAN_CONSOLE=1`.
