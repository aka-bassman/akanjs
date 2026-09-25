---
"akanjs": patch
---

fix: `Load.Units` rehydrates when a route change swaps its `init` for one with different query args

A slice's store is one global bucket keyed by the slice name, so `ticketListInProject` is shared by every project.
`Load.Units` latched hydration on a mount-scoped `useRef(false)` with `[]` effect deps, so the first `init` it saw
was the only one it ever read. Navigating between two routes that render the same slice with different args — a
project switch, an org switch, any `[id]` change under a shared tab layout — reuses the mounted instance, and the
latch made it keep rendering the previous route's rows: the page fetched the right data on the server and threw it
away on the client.

Hydration identity is now the init payload's `queryArgs`, matching what `Load.View` already does with the model
id: `loaded` is true only while the hydrated args still equal the ones `init` carries, and the memo and both
effects key off the same signature. Same args arriving again — a `router.refresh()`, a re-render — still hydrate
once, so client-side page, sort, and filter state is not clobbered.
