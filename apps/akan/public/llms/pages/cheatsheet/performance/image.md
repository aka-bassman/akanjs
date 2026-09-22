# Image Optimization

- Source: /cheatsheet/performance/image
- Mirror: /llms/pages/cheatsheet/performance/image.md
- Section: cheatsheet
- Category: Performance
- Priority: P2

## Headings

- Image Optimization (#overview)
- Use Image (#usage)
- Config (#config)
- Formats And The Platform (#formats)
- remotePatterns (#remote)
- Remote Cache (#remote-cache)
- Cache Hits (#cache-hit)

## Content

Image Optimization

Somebody uploads a 4MB photo from their phone and it renders in a 96px avatar. The page is correct, the layout is right, and every visitor downloads four megabytes to look at a thumbnail.

Use `Image` for images shown in UI.

Configure allowed remote domains in `akan.config.ts` — remote images are blocked until you do.

Keep repeated sizes few, so several elements share one cached file.

Use Image

Pass a file-like object or a direct src. What you give it for sizing decides which srcSet it emits, and the two modes are exclusive.

A numeric `width` with no `sizes` emits a two-candidate 1x/2x srcSet, each snapped up to the nearest allowed width. This is what a fixed-size element wants.

`sizes` wins over `width`: once it is present the component emits the full w-descriptor srcSet and ignores the width for URL generation. Give it to a fluid element, not to a fixed one.

A data URL, a blob: URL and an .svg path are bypassed automatically, so `unoptimized` is for something else — an image another system already optimized.

Config

The whole optimizer is one key in akan.config.ts. Every array field is replaced wholesale rather than merged, so writing deviceSizes drops all eight defaults rather than adding to them.

Viewport-scale widths, unioned with imageSizes to form the set of w values the optimizer accepts.

Fixed-element widths, in the same union.

Candidate output formats; the first match against the request's Accept header wins.

Allow-list for the q parameter. Anything else is a 400, integer 1–100 included.

Seconds. The floor for how long a remote image is served without asking its origin again, and it also sets the response max-age.

Allow-list for absolute URLs. Empty means no remote image is allowed at all.

Allow-list for root-relative URLs. The default admits the whole public tree.

Let SVG through the optimizer. Off, an SVG input is a 400 — an SVG is a document that can carry script, not a raster.

Redirect hops followed when fetching a remote image. Each hop is re-checked against remotePatterns, so a redirect cannot escape the allow-list.

Per-hop abort timeout for the remote fetch.

Remote body cap — 25MB. Over it the request is a 413.

Concurrent encodes. 0 sizes it from the CPUs the serving process sees, which the build machine's count is not.

Encoding shares a worker pool with file reads and hashing, so raising maxConcurrency lets a burst of image requests slow down everything else the server is doing. The default holds it to half the slots on purpose.

Formats And The Platform

Encoding runs on Bun.Image, and which codecs exist depends on where the process runs. AVIF, HEIC and TIFF need an OS codec that only the macOS and Windows backends have — a Linux container does not, and never will emit AVIF.

A format the platform cannot encode is filtered out of `formats` at boot, with one log line saying webp is served instead. The config is not an error — it is quietly narrowed.

An animated image, an .ico, a .bmp and a .jxl are passed through without re-encoding, as is an input that is already webp or avif.

This is why declaring `["image/avif", "image/webp"]` is safe: on a Linux deployment the first entry is dropped and every caller gets webp, and on a developer's Mac both are real.

remotePatterns

Remote images are blocked unless their host and path match `remotePatterns`. If optimization returns a bad request, check this setting first — the default is an empty list, which allows nothing.

hostname and pathname are globs: * matches one segment and ** matches any. port and search are matched too when declared, so a pattern can pin a non-standard port or require a signature query the CDN issues.

Remote Cache

A remote image is downloaded once and then served from disk until its TTL runs out, so a warm image never reaches its origin. The TTL is the upstream `max-age`, floored by `minimumCacheTTL`.

After the TTL the source is fetched again, but an unchanged source reuses the encoded file, so revalidation costs one request and no re-encode.

That TTL pointer exists only in a production build. In development the source is refetched every time, so an upstream edit shows up immediately — the encoded bytes are still reused whenever the upstream ETag is unchanged.

Local images are keyed by file mtime and size instead, so replacing a file in `public/` takes effect at once.

The cache lives in the build artifact directory, so each replica keeps its own and every deploy starts cold.

Cache Hits

The encoded file's key is the URL, width, quality, output format and a tag identifying the exact source bytes — the upstream ETag for a remote image, mtime and size for a local one. Too many width or quality choices split that cache into many rarely-used files.

Use a few repeated card sizes instead of many one-off widths.

Keep `qualities` at `[75]` unless a specific surface needs otherwise. Every extra value multiplies the files, and the client only ever asks for 75 unless a component passes `quality`.

A cold srcSet puts the same width in flight several times before any file exists; the optimizer deduplicates those in-flight requests, so only one encode happens.

## Code Examples

### apps/myapp/lib/article/Article.Unit.tsx

```ts
import { Image } from "akanjs/ui";

interface CoverProps {
  className?: string;
  article: Article;
}
export const Cover = ({ className, article }: CoverProps) => {
  return (
    <Image
      className={className}
      file={article.cover}
      width={640}
      height={360}
      alt={article.title}
      priority={article.isFeatured}
    />
  );
};
```

### apps/myapp/akan.config.ts

```ts
export default {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.example.com",
        pathname: "/articles/**",
      },
    ],
  },
};
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Use this page as a task recipe, then verify with the relevant lint, test, or build command.

