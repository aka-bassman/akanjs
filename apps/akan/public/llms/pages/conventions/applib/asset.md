# Assets (public/ private/)

- Source: /conventions/applib/asset
- Mirror: /llms/pages/conventions/applib/asset.md
- Section: conventions
- Category: App & Library
- Priority: P1

## Headings

- Asset Folders (#asset-overview)
- Public Assets (#public-assets)
- Optimized Images (#optimized-images)
- Private Assets (#private-assets)
- Library Assets (#library-asset-sync)
- Which Folder? (#practical-rules)

## Content

Assets (public/ private/)

The browser may download it

Served as static files by URL. Images, PDFs, downloadable JSON and icons go here.

Only the server reads it

Never served. Seed data, private JSON, model files and resources for server jobs go here.

File

Used for

Seed data the server loads.

Model weights for server-side inference.

A library's internal rules, covered under Library Assets below.

Library's public/

Inside the app

Browser URL

Library's private/

Server code reads

Anyone may download it

UI images and icons, drawn with `Image` from `akanjs/ui`.

PDFs and other files a user downloads.

JSON the browser loads by URL.

Only the server may read it

Internal data such as seed records.

Model weights.

Server-only configuration and rules.

Folder

In the build

Copied into every build.

Copied when the app serves pages; an API-only build (`web: false`) leaves it out.

Fonts in `public/`

Unreferenced fonts are dropped by `assets.pruneFonts`; list any to keep in `assets.keepFonts`.

Asset Folders

Public Assets

Load a JSON file in the browser from its URL:

Optimized Images

Image Optimization

srcSet, formats, caching and every prop, step by step.

images in akan.config.ts

Widths, formats, qualities and the remote hosts the optimizer may fetch.

Private Assets

Read from the app folder

Load data and models

Read a JSON file with the helper:

Library Assets

Where

Path

Which Folder?

Example file

Goes here

Not here

What a build ships

## Code Examples

### apps/myapp/ui/ProductGuideLink.tsx

```ts
import { usePage } from "@apps/myapp/client";

interface ProductGuideLinkProps {
  className?: string;
}
export const ProductGuideLink = ({ className }: ProductGuideLinkProps) => {
  const { l } = usePage();
  return (
    <a
      className={className}
      href="/docs/product-guide.pdf"
      target="_blank"
      rel="noreferrer"
    >
      {l.trans({ en: "Open product guide", ko: "제품 가이드 열기" })}
    </a>
  );
};
```

### apps/myapp/webkit/useSampleProducts.tsx

```ts
export const useSampleProducts = () => {
  const load = async () => {
    const res = await window.fetch("/data/sample-products.json");
    return await res.json();
  };
  return { load };
};
```

### apps/myapp/ui/HeroImage.tsx

```ts
import { usePage } from "@apps/myapp/client";
import { Image } from "akanjs/ui";

interface HeroImageProps {
  className?: string;
}
export const HeroImage = ({ className }: HeroImageProps) => {
  const { l } = usePage();
  return (
    <Image
      className={className}
      src="/images/hero.png"
      alt={l.trans({ en: "Product hero", ko: "제품 대표 이미지" })}
      width={1200}
      height={640}
      priority
    />
  );
};
```

### apps/myapp/srvkit/privateFile.ts

```ts
import path from "node:path";

export const privateFile = (relativePath: string) => {
  const appDir = process.env.AKAN_APP_DIR ?? path.dirname(Bun.main);
  return Bun.file(path.join(appDir, "private", relativePath));
};
```

### apps/myapp/srvkit/seedProducts.ts

```ts
import { privateFile } from "./privateFile";

export const loadInitialProducts = async () => {
  return await privateFile("seed/products.json").json();
};
```

### apps/myapp/srvkit/yoloDetector.ts

```ts
import { adapt } from "akanjs/service";
import { privateFile } from "./privateFile";

export class YoloDetector extends adapt("yoloDetector" as const, () => ({})) {
  #model: YoloModel | null = null;

  override async onInit() {
    this.#model = await loadYoloModel(privateFile("model/yolo.onnx"));
  }

  async detect(image: ArrayBuffer) {
    return this.#model?.detect(image) ?? [];
  }
}
```

### apps/myapp/ui/SharedLogo.tsx

```ts
import { usePage } from "@apps/myapp/client";
import { Image } from "akanjs/ui";

interface SharedLogoProps {
  className?: string;
}
export const SharedLogo = ({ className }: SharedLogoProps) => {
  const { l } = usePage();
  return (
    <Image
      className={className}
      src="/libs/shared/banner/logo.png"
      alt={l.trans({ en: "Shared logo", ko: "공용 로고" })}
      width={240}
      height={80}
    />
  );
};
```

### apps/myapp/srvkit/defaultRules.ts

```ts
import { privateFile } from "./privateFile";

export const loadDefaultRules = async () => {
  const file = privateFile("libs/shared/recommendation/default-rules.json");
  return await file.json();
};
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Treat convention and generated-file rules as stronger than local style guesses.

