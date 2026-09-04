# akanjs/fetch

- Source: /references/akanjs/fetch
- Mirror: /llms/pages/references/akanjs/fetch.md
- Section: references
- Category: AkanJS Reference
- Priority: P0

## Headings

- akanjs/fetch (#akanjs-fetch)

## Content

akanjs/fetch

What `fetch.init<Model><Suffix>`, `fetch.view<Model>`, and `fetch.edit<Model>` return. Awaiting the handle gives the object these helpers have always given, so every existing call site reads unchanged. Reading a field off the un-awaited handle gives that field's own promise instead, so a route can hand each one to the section that renders it and let the slowest arrive last rather than holding the whole page. Every request leaves at call time, so splitting the result never serializes the queries.

Zone prop type for initialized list pages. It contains list objects, insight object, pagination fields, query args, sort state, and init timestamp, and accepts either the resolved payload or the `x<Model>Init<Suffix>` promise the init handle hands out. A pending promise renders behind the Zone's own Suspense boundary.

Zone prop types for a single model. Each wraps the server payload — `x<Model>View` for read, `x<Model>Edit` for a form — and accepts the resolved object or the promise the view/edit handle hands out. `ClientEdit` also accepts a partial form object, which is how a new-record page seeds defaults with no request at all.

Metadata carried with initialized slice data. UI helpers use it to know the ref name, slice name, and number of query arguments behind a list or insight block.

Option shape for list initialization. It controls page, limit, sort, default form values, invalidation, and whether insight data should be fetched together with the list. `insight: false` skips the aggregate query outright, so `x<Model>ObjInsight` is `null` and the rows in hand are the whole count there is — pass it whenever the screen shows no total and no pagination.

Request account shape shared by server middleware and services. It always includes `appName` and `environment`, then allows app-specific account data to be added by generic parameter.

Runtime client that turns serialized signal metadata into typed HTTP and WebSocket fetch functions. App clients use the proxy around this class, while advanced tests can instantiate or clone it directly.

Server-side request helpers backed by AsyncLocalStorage or a request fallback stack. Use them in server components and fetch internals to read the current request without pulling client dependencies.

`akanjs/fetch` defines the typed client/server fetch boundary. Import it for Zone props, generated fetch client types, request-scoped headers/cookies/theme helpers, and advanced FetchClient usage.

Usage

## Code Examples

No code snippets were extracted from this page.

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Respect server/client subpath boundaries when importing Akan APIs.

