---
"akanjs": patch
---

fix(ui): `Refresh` handles pull-to-refresh itself, and `react-simple-pull-to-refresh` is no longer a peer

`Refresh` loaded `react-simple-pull-to-refresh` through a dynamic import, which the bundler resolves at build time,
so the optional peer was in fact required: a workspace that had not installed it failed its CSR build with
`Could not resolve: "react-simple-pull-to-refresh"`. `Refresh` now tracks the touch gesture itself — same props,
same spinner, refresh past 67px of pull, capped at 95px — and the package is gone from `akanjs`'s peer
dependencies. An app that installed it only for `Refresh` can remove it.
