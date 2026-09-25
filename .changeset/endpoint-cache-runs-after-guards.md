---
"akanjs": minor
---

fix(signal): an endpoint's `cache` is looked up after its guards, not ahead of the account

The `Cache` middleware sat ahead of every middleware a lib registers, `AccountMiddleware` among them, so on a hit it
ran the guards before anyone had resolved the caller — a guard reading the account saw none and refused a signed-in
caller the second time they asked. The lookup is now a step of the call itself: guards, then internal arguments,
then the cache, then the handler, inside the `timeout` deadline as before.

`Cache` is no longer exported from `akanjs/signal` and is no longer registered as a middleware, and
`SignalContext.checkGuards()` — which existed only for it — is gone. `{ cache: <ms> }` on an endpoint is unchanged.
