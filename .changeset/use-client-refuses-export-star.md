---
"@akanjs/devkit": patch
---

fix(build): `export *` in a `"use client"` module is a build error, and a dev build failure says why

The server replaces a `"use client"` module with one client reference per name the module exports, and the names
come from Bun's export scan — which reports none through `export * from "./x"`. So a star re-export in a client
module registered nothing: a star-only file was silently no client boundary at all, and a file mixing named exports
with a star lost the star's names on the server, where they were `undefined` in a server component while the same
import worked in a client one. `libs/shared`'s `User.Template.tsx` did exactly this with the leave-flow components.

Like Next.js, the build now refuses it, in `akan build` and `akan start` alike, naming the file, the specifiers and
the fix:

```
libs/shared/lib/user/User.Template.tsx is a "use client" module, so it cannot `export * from "../../ui/UserLeave"`:
the server sees only the names a client module declares, and a star re-export declares none. Re-export them by
name — `export { … } from "../../ui/UserLeave"`.
```

`export type * from` and `export * as ns from` stay allowed, and a module without the directive is untouched. A
barrel that mixes client-only files with isomorphic ones should drop the directive instead: each client file keeps
its own, and the barrel stays importable on the server.

A failed bundle during `akan start` used to report only the bundler's own message, "Bundle failed". The dev build
now prints the reasons nested under it, the way `akan build` already did.
