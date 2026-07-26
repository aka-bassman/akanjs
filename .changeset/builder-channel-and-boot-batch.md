---
"akanjs": patch
---

fix(devkit): flush all builder ipc through BuilderChannel and isolate the boot build

`BuilderReply` only covered request responses, so recycle `process.exit` could still
drop unflushed events like `css-updated` and leave the backend on a stale bundle. The
boot `SsrBaseArtifactBuilder` also stayed in the long-lived watcher and retained most of
its idle RSS.

- Replace `BuilderReply` with `BuilderChannel` (`send` / `emit` / `drain`) so every
  builder→host message awaits ipc flush before recycle exit.
- Run the boot base artifact build in the disposable `buildBatch` worker (`needs: ["base"]`)
  and keep only the serializable artifact/fonts in the watcher.
- Split the idle resource-budget assertion so host+backend stays tight while the builder
  can swing within its RSS recycle ceiling.
