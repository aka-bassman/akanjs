---
"@akanjs/devkit": patch
---

`akan build-desktop` builds for this computer's CPU without asking; `--arch arm64|x64` picks another one. Any CLI option declared both `enum` and `nullable` is now `null` when left out instead of prompting for one of its choices.
