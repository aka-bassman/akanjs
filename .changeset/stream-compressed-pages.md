---
"akanjs": patch
---

Server-rendered HTML and RSC flight responses are now compressed with brotli, or gzip for a client that takes only gzip, as they stream. The shell still reaches the browser before the render ends, and a client that disconnects still cancels the render. Before, only JSON was compressed, so a page went out at full size; the akanjs.com home page drops from 444 KB to about 48 KB. Behind the gateway the compression happens once, at the hop that faces the client. A compressed page carries a weak `ETag` and no `Content-Length`, and `AKAN_HTTP_COMPRESS=0` still turns compression off.

The `Clipboard` button from `akanjs/ui` now has an accessible name, `base.copy` ("Copy" / "복사"), so a screen reader no longer announces it as an unlabeled button.

A server-rendered page now loads less client JavaScript. On the akanjs.com home page, the client components and their chunks went from 403 KB to 219 KB before compression:
- `akanjs/common` and `tailwind-merge` come from the import map once, instead of being bundled again into each page's chunks.
- Recipes build on `tailwind-variants/lite` and merge once through `cn`, with the same output.
- A server-rendered page no longer loads react-spring or the native plugins.

`akanjs/ui` exports `SelectLanguage`, `ThemeToggle` and `DevModeToggle` by name. In a `"use client"` file, import them that way: `System.ThemeToggle` there bundles the whole app shell. `akanjs/client` now also exports `isNativeApp`, `isNativeShell`, `nativePlatform`, `desktopPlatform` and `openExternalUrl`.

In the browser, a Korean `RecentTime` or `dayjs().locale("ko")` no longer falls back to English after hydration. The `ko` locale is now registered on the dayjs instance that `akanjs/base` exports.

A font path in `rootLayout().fonts([...])` now takes `preload: false`. That weight loads when text first uses it, instead of competing with the page for bandwidth. The akanjs.com home page now preloads 3 Pretendard weights instead of 7.
