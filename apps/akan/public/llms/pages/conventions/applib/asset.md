# Assets (public/ private/)

- Source: /conventions/applib/asset
- Mirror: /llms/pages/conventions/applib/asset.md
- Section: conventions
- Category: App & Library
- Priority: P1

## Headings

- Asset Overview (#asset-overview)
- Public Assets (#public-assets)
- Optimized Images (#optimized-images)
- Private Assets (#private-assets)
- Library Asset Sync (#library-asset-sync)
- Practical Rules (#practical-rules)

## Content

Assets (public/ private/)

Asset Overview

Apps and libraries both hold their assets in two folders at the root, beside lib and ui. Use public for files that the browser can request, and private for files that only server code should read. There is no asset folder wrapping them — akan sync rejects any root entry outside the allowlist.

Served as static assets. Use it for images, PDF files, downloadable JSON, icons, and other files that can be public.

Available only to server-side code. Use it for seed data, private JSON, model files, and resources used by server jobs.

Public Assets

Files under public are served by the server as static assets. The browser can request them directly by URL, with the folder itself dropped from the path.

Optimized Images

When an image is public, you can render it with the Image component from akanjs/ui. Akan serves an optimized image response in a similar way to Next.js image optimization, so use this for UI images instead of a plain img tag when possible.

Private Assets

Files under private are for server-only resources. Put files here when the browser should not download them directly, but the server needs them to load data, run inference, or initialize a service.

Library Asset Sync

When a library has assets, Akan syncs both public and private assets into each app. Public assets become browser-requestable files, while private assets stay server-only after sync. Sync links the library folder into the app, so editing a library asset takes effect without another sync; a production build copies the real files into the build output.

Practical Rules

Use public when the browser is allowed to request the file directly.

Use private when the file contains internal data, model weights, or server-only configuration.

Use Image from akanjs/ui for public UI images that should be optimized by the server.

Put reusable public files in a library's own public folder when multiple apps need the same asset.

## Code Examples

### public asset examples

```bash
apps/myapp/public/docs/product-guide.pdf
apps/myapp/public/data/sample-products.json
apps/myapp/public/images/hero.png

# Web requests
/docs/product-guide.pdf
/data/sample-products.json
/images/hero.png
```

### Link to a PDF

```ts
import { usePage } from "@apps/myapp/client";
import { Link } from "akanjs/ui";

export const GetProductGuide = () => {
  const { l } = usePage();
  return <Link href="/docs/product-guide.pdf">{l.trans({ en: "Open product guide", ko: "제품 가이드 열기" })}</Link>;
};
```

### Fetch static JSON

```ts
export const loadSampleProducts = async () => {
  const res = await fetch("/data/sample-products.json");
  return res.json();
};
```

### HeroImage.tsx

```ts
import { Image } from "akanjs/ui";

export const HeroImage = () => {
  return (
    <Image
      src="/images/hero.png"
      alt="Product hero"
      width={1200}
      height={640}
      priority
    />
  );
};
```

### private asset examples

```bash
apps/myapp/private/seed/products.json
apps/myapp/private/model/yolo.onnx
libs/shared/private/recommendation/default-rules.json
```

### Load private JSON on the server

```ts
export const loadInitialProducts = async () => {
  const file = Bun.file("./private/seed/products.json");
  return file.json();
};
```

### Use a private model file on the server

```ts
export const detectObjects = async (image: ArrayBuffer) => {
  const file = Bun.file("./private/model/yolo.onnx");
  const model = await loadYoloModel(file);
  return model.detect(image);
};
```

### library asset mapping

```bash
# Source in a library
libs/shared/public/banner/logo.png
libs/shared/private/recommendation/default-rules.json

# Linked into an app as public assets
apps/myapp/public/libs/shared/banner/logo.png

# Linked into an app as private assets
apps/myapp/private/libs/shared/recommendation/default-rules.json

# Copied as real files into the production build
dist/apps/myapp/public/libs/shared/banner/logo.png

# Browser request
/libs/shared/banner/logo.png
```

### Use synced public library asset

```ts
import { Image } from "akanjs/ui";

export const SharedLogo = () => {
  return (
    <Image
      src="/libs/shared/banner/logo.png"
      alt="Shared logo"
      width={240}
      height={80}
    />
  );
};
```

### Use synced private library asset

```ts
export const loadDefaultRules = async () => {
  const file = Bun.file("./private/libs/shared/recommendation/default-rules.json");
  return file.json();
};
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Treat convention and generated-file rules as stronger than local style guesses.

