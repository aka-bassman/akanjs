---
"akanjs": patch
---

fix: every store write marks the slice payloads stale, and `Load.View` refetches a replayed one

A write patches the lists and the model the store holds, but the RSC payload each of them was hydrated from still
carries the pre-write rows — and `rscCache` replays that payload verbatim when the user navigates back to a route
they already visited. So changing a ticket's status in one project, switching projects, and coming back showed the
status the page was first rendered with.

`staleAtOfOtherSlices` was the only guard against this and it was half-wired: it ran on `create<Model>` /
`create<Model>InForm` only, and it excluded the slice that issued the write. `update<Model>`,
`update<Model>InForm`, `merge<Model>`, `remove<Model>` and `set<Model>` — the last of which is where every custom
mutation endpoint commits its result — stamped nothing at all.

It is now `staleAtOfSlices`, stamped by all seven writes across every slice including the issuing one. The
exclusion bought nothing: the stamp starts no fetch, because `Load.Units` only re-checks staleness when a list
re-hydrates, and the slice that took the optimistic patch is exactly as far behind in its payload as its siblings.

`Load.View` had the same hole with no guard at all — view a model, edit it, view another, come back — and now
refetches through `view<Model>` when the payload it is re-hydrating from predates the last local write. It reads
`<refName>StaleAt`, the root slice's stamp, and does nothing on a model whose signal declares no slice.

Both checks compare a server-generated `initAt`/`viewAt` against a client-generated `staleAt`, so a badly skewed
client clock costs an extra refetch per navigation (clock ahead) or misses one (clock behind). That trade is
unchanged from the create path this generalizes.
