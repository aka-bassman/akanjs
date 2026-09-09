---
"akanjs": patch
"@akanjs/devkit": patch
---

A server-side loopback fetch follows the port the process was actually run with, so a container started with
`PORT=80` renders instead of failing every page with `base.error.serverUnreachable`.

- `getEnv().serverPort` fell back to a literal `8282` on the server side, and only `akan start` ever set
  `AKAN_PUBLIC_SERVER_PORT`. A production image overriding the Dockerfile's `ENV PORT=8282` therefore bound one
  port and pointed the RSC worker's `fetch.*` at another; the SSR render failed on every route, with no other
  symptom than the transport error. When the origin resolves to `localhost` — the self-call — the port now comes
  from `PORT`. A `SERVER_HOST` naming another host is not a self-call and keeps the explicit port, and
  `AKAN_PUBLIC_SERVER_PORT` still outranks both.
- `AkanApp` publishes the port it resolved as `PORT` to the replica it runs in-process and to every child it
  spawns, so `new AkanApp({ port })` reaches the tree the same way the env var does. In solo mode that is also
  what makes the option bind: `AkanServer` reads `PORT`, so an explicitly configured port was previously ignored.
- `akan build` no longer publishes `AKAN_PUBLIC_CLIENT_PORT` / `AKAN_PUBLIC_SERVER_PORT` into the build process's
  own env. Bundling `define`s every `AKAN_PUBLIC_*` into a literal, so with `PORT_OFFSET` set the builder's dev
  port was baked into the artifact, where no deployment env could override it.
