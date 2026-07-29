---
"akanjs": patch
---

fix(cli): make `bun run akan <cmd>` concurrency-safe

`bun run akan` rebuilds the CLI into a shared `dist/` before every command, so two
commands started at once could read a half-written bundle.
