---
"@akanjs/devkit": patch
---

fix(build): the production server bundle keeps its identifiers, so a class still names its own log lines

`akan build` compiled `main.ts`, `server.ts`, the RSC worker and the console runtime with `minify: true`, which
includes `identifiers`. Renaming every class in a server bundle is renaming the only identity several parts of
the framework read back at runtime:

- `serve()` gives each service `new Logger(this.constructor.name)`, so a production log line read
  `[P6e] ... Updating 0 Floors' Awairs Latest Air Data` — the class the message came from is exactly what a log
  filter (`akan logs --child`, `--grep`) needs and the one thing the record no longer carried.
- `Exception` and `Err` set `this.name = this.constructor.name`, so a 500's logged error name was mangled too.
- A guard's `static name = "User";` is what `fetch` serializes, what the API explorer filters on, and what
  `mcpExposure` compares against `"Public"`. The convention held the framework's own guards together; a guard
  that omitted it silently published a two-letter name.
- Every frame of every stack trace lost its function and class name, on a single-line bundle that has no
  source map to fall back on.

Server bytes are read from the image, never sent to a client, and the measurements say identifier mangling was
not buying much: on `minimal`, `server.js` grows 5.5MB → 7.4MB, boot moves 202ms → 206ms (median of five), and
peak RSS stays inside the noise band. `minify.whitespace` and `minify.syntax` are unchanged, and the browser
bundles — CSR, page and client entries — still mangle identifiers, where the bytes actually travel.

`minify.keepNames` would have been the narrow fix; Bun 1.4.2 accepts the flag in `BuildConfig` and renames
classes anyway, which `applicationBuildRunner.test.ts` now pins so the flag can be adopted when it lands.
