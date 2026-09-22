# akanjs/client

- Source: /references/akanjs/client
- Mirror: /llms/pages/references/akanjs/client.md
- Section: references
- Category: AkanJS Reference
- Priority: P0

## Headings

- akanjs/client (#akanjs-client)

## Content

akanjs/client

Client navigation singleton that normalizes Akan language/base-path prefixes before delegating to the active router. Use it from pages, stores, templates, and utilities for push/replace/back/refresh.

The one class-combining function: joins conditional parts (`cond && "x"`) and resolves Tailwind conflicts with Akan's semantic tokens registered. Every view/unit/template component imports it from `akanjs/client`.

Common props for generated Unit, Zone, and list UI components. They carry model data, slice metadata, query/init settings, actions, columns, and click handlers.

The route chain. A route file has one export: `export default page()…render(fn)` in a page file (`<name>.tsx`, `_index.tsx`), `layout()` in a `_layout.tsx`, and `rootLayout()` in the root `_layout.tsx` of an app or a basePath. Every route setting is a stage of the chain: `.param(name, Type, { desc })` for each `[name]` segment of the path, `.search(name, Type | [Type], { desc })` for a query key, `.config(PageConfig)`, `.head(node | (args) => node)`, `.metadata(obj | (args) => obj)`, `.loading((args) => node)`, and `.render((args) => node)` last. The render callback is not a React component: it receives the declared arguments already typed — `ID`/`String` → string, `Int`/`Float` → number, `Boolean` → boolean, `Date` → Dayjs, an `enumOf` class → its value union, `[T]` → array — and every search argument is optional. `lang`, the locale segment every route sits under, arrives on every stage without a `.param()` for it, and declaring one is refused. `usePage()`, `getSelf()`, and `fetch.*` are called inside it exactly as before.

`layout()` takes the same stages as `page()`, receives `children` beside its arguments, may declare only the `[x]` segments it reads, and adds `.notFound(fn)` and `.error(fn)` in place of the `NotFound` / `Error` exports. `rootLayout()` adds what only the root `_layout.tsx` sets: `.fonts(ReactFont[])`, `.manifest(WebAppManifest)`, `.theme(string)`, `.reconnect(bool)`, `.wsConnect(bool)`, `.layoutStyle("mobile" | "web")`, and `.gaTrackingId(string)`; `import "./styles.css";` stays the first line of that file.

The object `.config()` takes. It controls transition, safe area and chrome insets, gesture, cache, and the SSR mode, plus `devOnly` to keep the route out of `akan build`. `devOnly` is written as a literal `true`/`false` because the build reads it off the source without evaluating the module; on a `_layout.tsx` it excludes every route under that directory.

Page-only stage that publishes the screen as an MCP prompt: `.prompt(name, description)`, where the description is the whole instruction the model receives, in English. `prompts/get` runs the page body under the token of the caller and answers with the description, one embedded resource per `fetch.*` query the page made — masked by the return model of the endpoint and addressed by its `akan://` uri — and a "Tools for this screen: …" line; lists are cut to `promptBudget` (default 60,000 characters). Every `.param()` is a required prompt argument and every `.search()` an optional one, so give each a `desc`. A missing required argument answers a single message pointing at the `<model>List…` tool; a redirect answers a 401 challenge without a token, or "This screen is not available to the signed-in account." with one. `endpoint()` has no `prompt()` kind any more and `Msg` is not public.

What every loader — the RSC worker, the CSR boot, the generated root layout — reads a route module through. `resolveRouteModule(module, key, { kind, pattern })` unfolds the default export of a chain into the named-export shape and passes a legacy module through untouched; `isRouteDefinition(value)` is the test it uses. The rules it enforces: a chain module exports nothing but `default`; `page()` in a `_layout.tsx` or `layout()` in a page file is refused; a page must name every `[x]` segment of its path with `.param()` and a layout may name a subset; `.param("x")` and `.prompt("x", …)` take string literals and `.config({ devOnly })` a literal boolean, because `akan sync` and the build read them off the source. A legacy module still loads, with one deprecation warning per file at boot.

Font declaration types and client-side font factory shims. The root layout hands `Font` data to `rootLayout().fonts([...])` so the server build can optimize local font assets while CSR code receives safe no-op shims.

Page dictionary and translation helpers generated from Akan dictionaries. Components use `usePage()` for locale-aware text and `msg`/`Err` for message rendering helpers.

Typed client fetch proxy built from registered signal metadata. It exposes generated endpoint and slice methods and keeps JWT state synchronized through auth helpers.

Cookie and account helpers that work across server and client contexts. The auth cookie is keyed per app (`authTokenKey()` returns `jwt:<appName>`) because cookies carry no port, so two apps on one host would otherwise share one token. Read it with `getAuthToken()` rather than by name. `getAccount` decodes the JWT only when it belongs to the current app and environment.

Authentication helpers that update FetchClient JWT state, cookies, and client storage together. Stores call these after login/logout so future generated fetch calls include the right token.

Device singleton for Capacitor/native features such as safe-area values, keyboard listeners, haptics, scroll position, platform info, and language detection.

`akanjs/client` contains browser/UI-facing helpers: the route chain (`page()`, `layout()`, `rootLayout()`), routing, typed fetch access, dictionary hooks, auth/cookie helpers, device utilities, font declarations, and common UI prop types.

Usage

## Code Examples

No code snippets were extracted from this page.

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Respect server/client subpath boundaries when importing Akan APIs.

