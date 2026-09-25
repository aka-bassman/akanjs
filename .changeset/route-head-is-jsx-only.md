---
"akanjs": minor
"@akanjs/devkit": patch
"@akanjs/cli": patch
---

feat(route): a route's head is JSX only, and analytics is the app's own component

**`.metadata()` is gone, along with the `metadata` / `generateMetadata` exports and the `AkanMetadata` type.** A route
had two ways to say the same thing — an object of `title` / `description` / `openGraph` / `twitter` / `alternates`
that the server translated into tags, and `.head()` taking the tags themselves — and could use only one of them per
module. Every app in the workspace already wrote `.head(<>…</>)`. Rewrite an object as the tags it produced:

```tsx
.head(({ projectId }) => (
  <>
    <title>{`Project ${projectId}`}</title>
    <meta name="description" content="Project workspace" />
    <meta property="og:image" content="/og/project.png" />
    <link rel="canonical" href="https://example.com/project" />
  </>
))
```

A legacy route that still exports `metadata` or `generateMetadata` now fails the load as an unsupported export,
the same way any other stray export does. The hreflang alternates Akan adds per locale are unchanged; the only thing
that could suppress them was an `alternates.languages` object, so leave them out of the JSX.

**`.gaTrackingId()` and the `gaTrackingId` export / `System.Provider` prop are gone.** Which tags load, in which
environment and behind which consent banner are the app's decisions, and the framework's built-in `Gtag` made none
of them. Render a `"use client"` component that loads gtag.js from the root layout's `.render()` instead — the
routing guide has one. GA4's Enhanced measurement already counts the router's `history.pushState` navigations, so
the component only loads the tag.

The head-snapshot path used by the experimental partial commit (`AKAN_PUBLIC_RSC_PARTIAL_COMMIT=1` with
`rscPatchHeadSafe`) was fed only by the metadata object, so it now always falls back to a full navigation.
