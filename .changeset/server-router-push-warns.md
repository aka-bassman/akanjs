---
"akanjs": patch
---

fix(client): `router.push` / `replace` on the server warn that they do nothing, and name `router.redirect()`

Called during a server render, both only wrote an `info` line and returned — no navigation, no redirect — so a page
that meant to send the visitor elsewhere rendered in place with nothing louder than a log line at the default level.
They now log a warning that names `router.redirect()`, the call that answers a server render with a redirect. They
still do not throw, so a page that renders today keeps rendering.
