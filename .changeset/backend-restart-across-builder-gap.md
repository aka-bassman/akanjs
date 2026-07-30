---
"akanjs": patch
---

fix(devkit): restart the backend for server code saved while the builder was away

Nothing watches the source tree between a builder leaving and its replacement being ready: the idle
suspend stops its own watcher before the wake's boot build, a recycle or crash takes the builder's
watcher with it, and a fresh builder primes its mtime index from whatever it finds on disk — so a save
that lands in that window is *baseline* to it and produces no event anywhere. The client half of such a
save is rescued by the boot build reading the new file; the backend half was not. A `.service.ts` saved
in that window left the server running the code it replaced, with nothing on screen to say so.

The dev host now stamps `(mtime, size)` for every file in the backend import graph when the builder goes
away — at suspend, at a recycle request, at a crash exit — and compares them when a builder is ready
again, restarting the backend for anything that moved. Comparing stamps rather than waiting for events
also covers the watcher dropping one, which Bun's recursive `fs.watch` does.

A config change while suspended is exempt, because it replaces the backend along with the builder on its
own. Where the backend graph scan has never succeeded — path-role fallback rules — there is nothing to
stamp, and the host says so rather than staying quiet about it.
