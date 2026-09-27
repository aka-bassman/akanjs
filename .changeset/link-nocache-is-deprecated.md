---
"akanjs": patch
---

fix(ui): mark `Link`'s `noCache` deprecated — it has never done anything

Neither renderer reads it: the server-rendered and CSR links navigate the same way with or without it, and
`router.push` / `replace` take no cache option to hand it to. The prop is still accepted, so nothing breaks, but
`<Link noCache>` now shows as deprecated in the editor. Drop it; to fetch a page fresh after a change, clear the
route cache with `clearRscNavigationCache()` from `akanjs/client`.
