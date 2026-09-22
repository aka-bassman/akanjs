# Web Utils (webkit/)

- Source: /conventions/applib/webkit
- Mirror: /llms/pages/conventions/applib/webkit.md
- Section: conventions
- Category: App & Library
- Priority: P1

## Headings

- Webkit Overview (#webkit-overview)
- What Belongs In Webkit (#what-belongs)
- Barrel, Optimized Import, And Shape (#barrel-optimization)
- Practical Rules (#practical-rules)

## Content

Web Utils (webkit/)

Pure, isomorphic, zero-dependency. It may import a sibling common/* file and akanjs/base, and nothing else — not Err, which is why throwing code stays out of it.

Touches window, navigator or Capacitor, or is a React hook. The browser half of what common/ cannot hold.

Touches node:*, Bun, process.env, a secret, or a server SDK. The server half, and the only place a vendor package is imported directly.

Renders JSX and is not bound to one model. A component tied to a model belongs in that module as a Unit, View, Template, Util or Zone instead.

A build-time or CLI-time AkanPlugin, registered in akan.config.ts and re-exported from the generated barrel.

Webkit Overview

The webkit folder contains reusable code needed during web rendering. It is similar to srvkit, but it is for browser-side or web-rendering logic instead of server-only logic.

Use it for render maps, browser helpers, web hooks, and wrappers around browser libraries. Pages can then import from the webkit barrel instead of carrying complex logic directly.

The five folders answer one question each, and the test is what the code touches rather than what it is for. Reading them together is faster than reading any one of them, so the same table opens all three pages.

Folder

What Belongs In Webkit

Render maps

Static maps used during rendering, such as status colors, badges, icons, labels, or page display options.

Browser helpers

Small browser actions such as downloading a file, reading cookies, opening a share link, or copying text.

Web hooks

Reusable browser hooks for notifications, messaging, viewport state, permission checks, or browser APIs.

External web wrappers

Wrappers around browser libraries so pages do not import vendor packages directly.

Routing/account helpers

Web helpers that read account state or route users during rendering.

Barrel, Optimized Import, And Shape

The webkit folder is a barrel folder like ui. Export web helpers from index.ts, then import from the barrel. Akan can optimize imports so the page includes only the webkit files it actually uses.

Prefer one file, one export, and file name equals export name. This keeps the barrel predictable and helps optimized imports stay precise.

Practical Rules

Use webkit for web-rendering logic that is not itself a reusable UI component.

Use srvkit for server-only code, and webkit for browser or web-rendering code.

Import from the webkit barrel instead of deep paths so optimized import can work.

Keep file names and export names aligned, such as downloadFile.ts exporting downloadFile.

## Code Examples

### webkit/downloadFile.ts

```ts
"use client";

import { saveAs } from "file-saver";

export const downloadFile = async (url: string, filename: string) => {
  const res = await window.fetch(url, { method: "GET" });
  saveAs(await res.blob(), filename);
};
```

### webkit/index.ts

```ts
export { downloadFile } from "./downloadFile";
```

### ui/DownloadButton.tsx

```ts
"use client";

import { usePage } from "@apps/myapp/client";
import { downloadFile } from "@libs/shared/webkit";

export const DownloadButton = () => {
  const { l } = usePage();
  return (
    <button onClick={() => downloadFile("/invoice.pdf", "invoice.pdf")}>
      {l.trans({ en: "Download", ko: "다운로드" })}
    </button>
  );
};
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Treat convention and generated-file rules as stronger than local style guesses.

