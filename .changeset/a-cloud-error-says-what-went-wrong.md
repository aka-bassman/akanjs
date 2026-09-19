---
"@akanjs/devkit": patch
"@akanjs/cli": patch
---

fix(tunnel): reach the tunnel control plane at its real path, and report the status instead of parsing the error page

`akan tunnel` and `akan start --share` could not open a share at all: `CloudApi` called `/api/requestTunnel`,
`/api/tunnelListInSelf` and `/api/revokeTunnel`, none of which exist. An endpoint's path carries the model's
refName — `fetch.serializer.ts` takes it from `sliceCls.srv.cnst?.refName` — so every database module's endpoints
sit under a segment of their own and the service modules beside them do not. `tunnel` is a database module; its
neighbours in the same file, `uploadEnv` and `getRemoteSelf`, belong to the `_cloud` service module and have no
`cnst` to take a prefix from. The three paths now carry `/tunnel/`, with a note saying why they differ from the
methods above them.

**The 404 was invisible, which is the more expensive half.** `HttpClient.get` and `post` called `response.json()`
without looking at `response.ok`, so the control plane's HTML error page reached the user as
`JSON Parse error: Unrecognized token '<'` — a parse error where the status line had already said `404 Not Found`.
Both now read the status first and throw with it, matching `getFile`, which has always done so.

Three failures were being swallowed the same way and now surface:

- `uploadEnv` returned the parsed error body, which is a truthy object, so **a failed env upload reported success**
  and the project went on to build against env that never arrived.
- `getRemoteSelf` and `getRemoteAuthToken` are written to catch and answer `null`; with nothing thrown they
  answered an error object instead.
- `refreshAuthToken` fed a rejected response straight into `toAccessToken`, minting a token from it.
