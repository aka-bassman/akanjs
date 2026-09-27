---
"akanjs": patch
---

fix(webkit): `useCodepush().version` reports the version of the bundle that is running

It was a `useState("")` nothing ever set, so it read `""` forever. `checkNewRelease` now fills it with the running
bundle's version — the app's own version while the built-in bundle runs, the downloaded bundle's otherwise — the same
value it already sends to the release server. It stays `""` until the first check. The `libs/util` copy of the hook
gets the same change.
