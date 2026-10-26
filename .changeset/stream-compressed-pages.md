---
"akanjs": patch
---

Server-rendered HTML and RSC flight responses are now compressed with brotli, or gzip for a client that takes only gzip, as they stream. The shell still reaches the browser before the render ends, and a client that disconnects still cancels the render. Before, only JSON was compressed, so a page went out at full size; the akanjs.com home page drops from 444 KB to about 48 KB. Behind the gateway the compression happens once, at the hop that faces the client. A compressed page carries a weak `ETag` and no `Content-Length`, and `AKAN_HTTP_COMPRESS=0` still turns compression off.

The `Clipboard` button from `akanjs/ui` now has an accessible name, `base.copy` ("Copy" / "복사"), so a screen reader no longer announces it as an unlabeled button.
