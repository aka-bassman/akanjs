---
"@akanjs/cli": patch
---

The local registry accepts this repo's own packages again

Publishing to the verdaccio registry `akan smoke-registry` starts had stopped working once the akan packages were
published to npm: verdaccio proxied their names to the uplink and answered every whole-package PUT with
`409 this package is already present`. They are declared without a proxy now, so a local publish owns the name and
everything else still proxies. The `npm login` that ran before each publish is skipped for a local registry too —
it carries no registry argument, so it asked for npmjs.org credentials to authorize a publish that never reaches
npmjs.org, and being interactive it made the whole documented flow unscriptable.
