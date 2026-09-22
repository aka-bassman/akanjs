# File Based Routing

- Source: /docs/core/routing
- Mirror: /llms/pages/docs/core/routing.md
- Section: docs
- Category: Core Concepts
- Priority: P0

## Headings

- File Based Routing (#file-based-routing)
- File Convention (#file-convention)
- Page File Shape (#page-module)
- Chain Stages (#chain-stages)
- Layout File Shape (#layout-module)
- Root Layout Stages (#root-layout-exports)
- Base Paths (#base-paths)
- Library Pages (#library-pages)
- Dev Only Routes (#dev-only-routes)

## Content

File Based Routing

Akan uses file-based routing. You create files under page/, and the folder structure becomes the page URL. Every route also sits under a locale segment that Akan injects for you, so the same file serves every language you ship.

File-based

Folders and files decide the URL shape.

Locale-aware

Akan injects the locale segment automatically and hands it to every route as lang.

Explicit files

Use page and layout files instead of hidden magic.

File Convention

A route file is a page, a layout, or an overrides manifest. Everything under page/ must be a .tsx route module — no helper file, no logic file, no lowercase-free filename.

File

_index.tsx, _layout.tsx and _overrides.tsx are the only reserved names an underscore may introduce. Any other _something.tsx under page/ fails the load, and so does a .ts, .js or .jsx route file.

Page File Shape

A page file exports one page() chain and nothing else. Every route setting is a stage of that chain: .param() and .search() declare the arguments the page reads, .config(), .metadata() or .head(), and .loading() replace the old named exports, and .render() holds the component. The render receives the declared arguments flat and typed.

Use one metadata stage per route module: .metadata() or .head(), never both. Metadata is not merged across layouts and pages; the nearest route module wins. A page() chain is the module's only export — a named export beside it is refused, and the names in .param() and .prompt() must be string literals because akan sync reads them off the source. Coming from the legacy default-function shape? See Page Migration.

Chain Stages

There are seventeen stages, and the three chains share most of them. page() adds .prompt(); layout() adds .notFound() and .error(); rootLayout() is a layout that also carries the app-wide stages. The Chain column names every builder a stage is legal on.

required

optional

On rootLayout(), the app-wide stages must come before .param() and .search(). Those two stages return a layout type rather than the chain's own type, so .theme() and its siblings are gone from what follows them — rootLayout().theme("dark").param("orgId", ID) compiles and the reverse order does not.

lang is never declared. Every route sits under the locale, the value reaches every stage as lang, and declaring it throws. A page must declare every [x] segment of its path; a layout may leave some undeclared.

Layout File Shape

A layout file wraps child pages. Use it for shared headers, tabs, sidebars, guards, or page-level shells. Its own .metadata() covers child pages that declare none, and its .notFound() and .error() are the fallback for everything below it.

The .notFound() and .error() stages exist on layout(), not on page(). If a layout declares neither, Akan walks up to the nearest parent layout fallback, then falls back to the framework system page. A page() chain in a _layout.tsx, or a layout() chain in a page file, is refused at load.

Root Layout Stages

The root _layout.tsx of an app, or of a basePath, is a rootLayout() chain. It is still a layout, but it also carries the app-wide stages for fonts, manifest, theme, realtime connection, analytics, and mobile-style rendering. The stylesheet import stays the first line of the file.

Each of these is one row of the Chain Stages table above, and only .fonts(), .manifest(), .theme(), .reconnect(), .wsConnect(), .layoutStyle() and .gaTrackingId() are exclusive to this file. Everything else here — .config(), .head(), .loading(), .notFound(), .error(), .render() — is the ordinary layout surface.

Base Paths

When an app defines base paths in akan.config.ts, page files must live under one of those base path folders. This keeps multi-service or multi-domain apps explicit.

If base paths are configured, putting a page directly under page/ is invalid. Move it under page/<basePath>/ so Akan can tell which route group owns it.

Library Pages

A library can ship routes from its own page folder. An app opts in with syncPageLibs, and sync links those routes into page/(libs)/(<lib>). Both folder names are route groups, so a library route keeps its own path.

Edit the library file, never the linked copy. Apps with base paths get the library routes under every base path, and two synced routes that resolve to the same path are reported as an error.

Dev Only Routes

.config({ devOnly: true }) keeps a route out of akan build. It still serves under akan start and is still typechecked, but nothing about it reaches production: no bundle, no route manifest entry, no URL.

On a _layout file, devOnly removes every route under that directory too, so a whole dev-only section can be marked once. Write it as a literal true or false — the build reads it from the source without running the module.

## Code Examples

### page/

```bash
page/
├── _layout.tsx
├── _index.tsx
├── (public)/
│   └── signin.tsx
│   └── signup.tsx
├── (user)/
│   └── project/
│       └── [projectId]/
│           ├── _layout.tsx
│           ├── _overrides.tsx
│           └── _index.tsx
└── robots.txt.tsx
```

### page/(user)/project/[projectId]/_index.tsx

```ts
import { ID } from "akanjs/base";
import { page } from "akanjs/client";

export default page()
  .param("projectId", ID, { desc: "The project to open." })
  .search("tab", String, { desc: "Which tab opens first." })
  .config({ transition: "stack" })
  .metadata(({ projectId }) => ({
    title: `Project ${projectId}`,
    description: "Project workspace",
  }))
  .loading(() => <div>Loading...</div>)
  .render(({ projectId, tab }) => {
    return (
      <div>
        Project {projectId} ({tab ?? "overview"})
      </div>
    );
  });
```

### Static metadata example

```ts
import { page } from "akanjs/client";

export default page()
  .metadata({
    title: "Projects",
    description: "Browse your projects",
    openGraph: { title: "Projects", images: ["/og/projects.png"] },
    twitter: { card: "summary_large_image", images: ["/og/projects.png"] },
    alternates: {
      canonical: "https://example.com/projects",
      languages: {
        ko: "https://example.com/ko/projects",
        en: "https://example.com/en/projects",
      },
    },
  })
  .render(() => <div>Projects</div>);
```

### page/(user)/project/[projectId]/_layout.tsx

```ts
import { ID } from "akanjs/base";
import { layout } from "akanjs/client";

export default layout()
  .param("projectId", ID)
  .loading(() => <div>Loading project...</div>)
  .notFound(({ pathname }) => <div>Project route not found: {pathname}</div>)
  .error(() => <div>Project failed to render.</div>)
  .render(({ children, projectId }) => {
    return (
      <section>
        <nav>Project {projectId}</nav>
        {children}
      </section>
    );
  });
```

### page/_layout.tsx

```ts
import "./styles.css";
import { rootLayout } from "akanjs/client";

export default rootLayout()
  .fonts([
    {
      name: "pretendard",
      default: true,
      paths: [{ src: "/fonts/pretendard.woff2", weight: 400 }],
    },
  ])
  .manifest({
    name: "Akan App",
    shortName: "Akan",
    startUrl: "/",
    display: "standalone",
    themeColor: "#111827",
  })
  .theme("dark")
  .reconnect(true)
  .wsConnect(true)
  .layoutStyle("web")
  .gaTrackingId("G-XXXXXXXXXX")
  .head(
    <>
      <title>Akan App</title>
      <link rel="icon" href="/favicon.ico" />
    </>,
  )
  .render(({ children }) => children);
```

### apps/myapp/akan.config.ts

```ts
const config = {
  routes: [
    { domains: { main: ["manager.myapp.com"] }, basePath: "manager" },
    { domains: { main: ["admin.myapp.com"] }, basePath: "admin" },
  ],
};
```

### page/

```bash
page/
├── manager/
│   └── _index.tsx
└── admin/
    └── _index.tsx
```

### apps/myapp/akan.config.ts

```ts
const config = {
  // true: every lib dependency that has a page folder
  // ["shared"]: only the libs listed
  // false (default): nothing is synced
  syncPageLibs: ["shared"],
};
```

### library route mapping

```bash
# Source in a library
libs/shared/page/login/_index.tsx

# Linked into an app by `akan sync` (generated, gitignored)
apps/myapp/page/(libs)/(shared)/login/_index.tsx

# Browser request
/login
```

### page/(dev)/playground/_index.tsx

```ts
import { page } from "akanjs/client";

export default page()
  .config({ devOnly: true })
  .render(() => <div>Component playground</div>);
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Treat convention and generated-file rules as stronger than local style guesses.

