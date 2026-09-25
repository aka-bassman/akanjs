---
"akanjs": patch
---

fix: a navigation to a route that is not there leaves the page alone

The RSC route answers a target that resolves to nothing with `0:null` under a 404 — a Flight payload whose root is
literally `null`. `fetchRscNavigationResponse` read the redirect and patch headers but never the status, so that
payload was decoded like any other and committed: the client replaced the whole document with an empty tree. Since
the tree is mounted by `hydrateRoot(document, …)`, everything went with it — the root layout, and whatever it holds,
an in-page agent's chat session included. A full document load never showed this, because that path renders a real
not-found page instead; only client navigation reached the empty one, so the same bad href behaved completely
differently depending on how it was followed.

The status is now read before the body reaches the decoder, and a not-found navigation is **refused rather than
committed**: nothing is rendered, history is never touched, and the page stays exactly where it was. It is
deliberately not converted into a document navigation either — that would land on the 404 this refusal exists to
avoid. `Router.navigation()` is the new report: it answers the navigation `push` / `replace` last started and
rejects when the route refused to move, which `push` itself cannot do because it returns before the payload for the
new route has even been asked for. `popstate` is the one exception and goes the other way — the address bar has
already moved, so refusing would leave the tree and the URL describing different pages, and a document navigation
there renders the real not-found page.

The in-page agent's `navigate` reads that report and answers the model with the miss instead of a move that did not
happen, so a guessed path costs one tool error on the screen the agent is still on rather than the session.
