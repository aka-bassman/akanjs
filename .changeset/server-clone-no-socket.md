---
"akanjs": patch
---

On a server, `fetch.clone({ origin })` toward another origin no longer opens a websocket unless `connect: true`, so a server making one-off calls to another server no longer leaks an auto-reconnecting socket per clone.
