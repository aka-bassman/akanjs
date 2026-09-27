---
"@akanjs/devkit": patch
---

fix(start): a route whose client code fails to bundle says why

`akan start` bundles a route's client components the first time the route is requested. When the bundler refused
them — an import that does not resolve, a syntax error — the builder reported only the bundler's own message,
"Bundle failed", in the request's error, the build status and the dev log alike. It now lists the bundler's reasons
under it, the way `akan build` and the rest of the dev build already did:

```
Bundle failed
  Could not resolve: "./not-there"
```
