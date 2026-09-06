---
"akanjs": patch
---

fix: scope the auth cookie and storage key to the app so two apps on one host stop clobbering each other

Cookies carry no port (RFC 6265), so every app served from `localhost` shared one jar. Under the global `jwt`
key each signin overwrote the neighbour's session, and the JWT's own `appName` check only turned the surviving
cookie into a credential that fails every guard — the other app fell back to anonymous, guard failures, and a
login wall.

The key is now `jwt:<appName>`, written by `setAuth` to both the cookie and client storage and read by
`getAccount`, `initAuth`, the SSR `fetchClient` credential, the websocket credential snapshot, and the CSR boot.
`authTokenKey()` and `getAuthToken()` are exported from `akanjs/client` (and `authTokenKey`, `readAuthToken`,
`isOwnAuthToken`, `isAuthTokenKey`, `cookieHeaderHasAuthToken`, `legacyAuthTokenKey` from `akanjs/common`) so an
app's own middleware reads the same key instead of spelling it out. Read the cookie through `getAuthToken()`
rather than `getCookie("jwt")`.

`initAuth` now checks the token's `appName`/`environment` before handing it to `fetch.setJwt`, which it never
did: a `?jwt=` for another app used to ride along on every request. A mismatch is ignored, and clears the cookie
when it came from this app's own key.

**Breaking, with a migration path.** Reads still fall back to a pre-scoping `jwt` cookie, but only when the
token's payload names this app — so an existing session survives the upgrade and a neighbour's leftover is never
adopted. Writes only ever use the scoped key and delete the legacy one. The fallback is temporary; once
deployments have rotated past it, the legacy read goes away and a stale session needs one re-login.
