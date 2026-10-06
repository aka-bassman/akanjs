---
"akanjs": minor
---

Endpoints take a rate limit: `rateLimit: { calls, windowMs?, by?: "ip" | "account" } | false` in the signal option, and `option.setRateLimit({ budget, endpoints, accountKey, enabled })` in an app or lib `option.ts`. An `ip` budget is counted before the request body is read, an `account` budget after the middlewares and before the guards, and a refusal answers 429 `base.error.tooManyRequests` with `{ seconds }` and `Retry-After`. Counters share the cache across instances. `AKAN_RATE_LIMIT=off|on|<calls>[/<seconds>]`; unset, budgets apply everywhere but a `local` environment. A service counts a business key with `plug(RateLimit)` and `consume(key, { calls, windowMs })`. Fetches a page makes while rendering now carry the visitor's address, and the MCP limiter keys an anonymous caller by its trusted-proxy address instead of a raw `X-Real-IP` any caller could forge.
