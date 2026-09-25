---
"akanjs": patch
---

The API and websocket prefixes are configurable, and the browser follows them.

- `new AkanApp({ prefix, websocketPrefix })` in `main.ts` moves the replica's route table, the gateway's websocket
  upgrade, `robots.txt`, the locale redirect's API bypass and the OpenAPI `servers` URL — and, through the SSR
  bootstrap script, the `fetchClient` in every tab the server renders. `AkanApp` also accepts its options as the
  sole argument now, so the server path no longer has to be spelled out to pass one.
- `api: { prefix, websocketPrefix }` in `akan.config.ts` is the build's answer, for the bundles a server never
  gets to correct: a prebuilt CSR shell and a Capacitor bundle carry it inlined, and the generated Dockerfile
  writes it as the image default.
- Resolution order is `globalThis.__AKAN_PREFIX__`, then `AKAN_API_PREFIX` / `AKAN_WS_PREFIX`, then
  `AKAN_PUBLIC_API_PREFIX` / `AKAN_PUBLIC_WS_PREFIX`, then `/api` and `/ws`. `getApiPrefix()` / `getWsPrefix()`
  from `akanjs/base` are the readers; `getEnv()` gains `apiPrefix` and `wsPrefix` beside them.
- A prefix is a path segment: a blank value or a bare `/` is refused, and so is one whose first segment is a
  declared basePath, because either would silently trade the API's routes for the page routes or the reverse.
  `setPrefix` / `setWebsocketPrefix` now throw after `init()`, where the route table is built, instead of being
  quietly ignored.
- `BlobStorage` derives its default URL prefix from the same value. Blob URLs written before a move stay pointing
  where they were written — they live on the rows that reference them.
