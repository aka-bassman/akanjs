---
"akanjs": patch
"@akanjs/cli": patch
---

An endpoint's declared `timeout` bounds the call, on both ends, instead of being read by nobody

`mutation(cnst.X, { timeout: 5 * 60 * 1000 })` could not work. The value had exactly one reader — the `Timeout`
middleware, which no app registers because it is opt-in — it was never serialized to the client, `FetchPolicy.timeout`
was accepted by the public type and dropped by `#makeHttpFn`, and `HttpClient` was constructed without one, so every
non-upload request was abandoned at the client's hard-coded 30 seconds and restored as `base.error.gatewayTimeout`.
Anything whose real work outlives half a minute — hardware provisioning, a firmware flow, an SSH round trip, an
external orchestration — was unreachable from a browser, and the declaration on the endpoint read as if it were
configured.

The declared value now travels. `FetchSerializer` puts it on the serialized endpoint and `fetch.<endpoint>()` makes
it that request's budget, a caller overrides it per call with `{ timeout }` (`false` waits as long as the runtime
will), and an app moves its own default with `fetch.instance.setTimeout(ms)` — precedence caller, endpoint,
client default, with an upload still bounded by nothing. Server side the middleware is registered by default and has
**no default of its own**: it stands aside for every endpoint that declared nothing, which is what makes registering
it safe, and what made the 5-second fallback it used to apply the reason it could not be. It now rejects with a 504
carrying `base.error.gatewayTimeout` rather than a bare `Error` that `SignalFailure` generalized to a 500, so both
sides of a deadline produce the sentence the dictionary already had, and it clears its timer — the loser of the race
was a pending timer per call, holding the event loop for the whole budget on a call that answered immediately.

What is still true, and is now written down: losing the race does not cancel the work. `Promise.race` cannot reach
into `next()`, so a handler that timed out runs to completion with nobody holding its result. A `timeout` bounds
what a caller waits for; an operation that must not half-happen needs its own idempotency.

`cache` had the same shape and got the same treatment. The `Cache` middleware was opt-in, ignored the declared
`cache` value for a hard-coded 60 seconds, and — had anyone registered it — would have cached every endpoint in
the app including mutations, under a key that names only the endpoint and its arguments, on a hit that skips
`next()` and therefore skips the guards. It is now registered by default, reads the declared value as its TTL,
runs `context.checkGuards()` before handing an entry over, and takes an entry only for a `query` that declares no
internal argument — internal arguments are how a call learns who is asking, so an endpoint that has them answers
per caller and a shared entry would be one caller's answer handed to the next. A `mutation` or a per-caller query
that declares `cache` is named once in the log instead of being silently ignored, and a cache backend that is down
is warned about rather than failing the call.

`Retry` is removed. Three attempts with a fixed backoff, on an endpoint whose failure it cannot classify, replays
whatever the first attempt already did — and it was unreferenced.
