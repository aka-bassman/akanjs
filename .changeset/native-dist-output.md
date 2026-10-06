---
"@akanjs/devkit": minor
"@akanjs/cli": minor
---

Native builds moved from `apps/<app>/.akan/native/<target>` to `dist/native/<app>/<target>` (`build/<platform>`, `dev/<platform>`, `web`, `bin`, `updates`). It sits outside `dist/apps/<app>`, which every `akan build` empties, so a signed release waiting for upload survives the next build. Upload what is waiting in an old `.akan/native/<target>/updates` and delete the folder: `akan start` keeps it and warns until then. A CI step that collects installers reads `dist/native/<app>/*/build/*/` now, and `pack-update`'s default output is `dist/native/<app>/<target>/updates/<platform>`.
