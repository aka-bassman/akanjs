---
"akanjs": patch
---

fix(signal): the cross-site gate compares hosts, so a TLS-terminating proxy no longer refuses every mutation

An app reached through a Cloudflare tunnel — or any edge that terminates TLS and forwards no
`x-forwarded-proto` — answered `403 This request was not permitted.` to every mutation. The browser sends
`Origin: https://app.example.com`; the request reaches the server over plain HTTP, so the origin it computed for
itself was `http://app.example.com`, and the full-origin comparison made the app cross-site to itself.

`CrossSiteGuard.assertOrigin` now compares the `Origin` header's **host** against the host the request arrived on
(`x-forwarded-host`, else `Host`), which is the comparison `McpRouter` already made for the same reason. The CSRF
property is unchanged: the host is written by the browser from the URL it was told to open, so a page on another
site still arrives with this deployment's host and its own `Origin`. Only the scheme distinction is dropped — the
one part of an origin a proxy routinely loses — and what that costs is a page served over plaintext on the same
host, which is an attacker who already holds the name. An explicit `:443` in a forwarded host and its absence in
`Origin` now compare equal too.

A refusal logs the host it was measured against (`... (request host app.example.com)`), so a proxy misreporting
the host reads differently from a missing `allowedOrigins` entry and from an attack.
