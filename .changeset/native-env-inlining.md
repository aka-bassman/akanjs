---
"@akanjs/devkit": patch
---

A native build's `--env` reaches its CSR bundle. The CSR builds passed `env: "AKAN_PUBLIC_*"` to `Bun.build`, which inlines the `.env` Bun read when the process started and ranks it above `define`, so `build-desktop --env debug` shipped the root `.env`'s `AKAN_PUBLIC_ENV=local` and called `http://localhost:8282`, and `akan build` baked back the operation mode and ports it had just dropped. Every `AKAN_PUBLIC_*` now comes from `process.env` through `define` alone, and `akan build` drops `AKAN_PUBLIC_CLIENT_PORT` / `AKAN_PUBLIC_SERVER_PORT` from `process.env` as well, so a port in `.env` is no longer baked in.
