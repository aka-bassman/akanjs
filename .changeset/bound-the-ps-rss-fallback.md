---
"akanjs": patch
---

fix(devkit): bound the `ps` fallback that reads another process's memory

Where there is no `/proc` (macOS), the dev host reads a process's RSS by shelling out to `ps`, with no
timeout. An absent `ps` was already handled — it answers `null`, which callers read as "no new
information" — but a stuck one was not, and its only caller awaits it at the end of a 20s settle before
committing a builder recycle. A hang there meant the recycle silently never happened.

Now spawned directly with a 2s kill timer, which is the same treatment the dev-stability harness already
needed after `ps` hung under load.
