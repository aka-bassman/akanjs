---
---

fix(shared): `UserService.refreshUserToken` takes the refresh-reuse grace window and lineage-only revocation

`refreshUserToken(refreshToken, account?, { graceMs, reuseRevokes })` — and `UserModel.rotateRefreshSession` under
it — now hand the rotation the options the OAuth refresh already uses. Without them nothing changes: a refresh token
presented again after its rotation signs the account out everywhere, which stays the browser session's policy. A
caller whose token several processes hold at once — a cloud CLI, two of whose runs can refresh one session moments
apart — passes `{ graceMs: refreshRotationGraceMs, reuseRevokes: "lineage" }` (`refreshRotationGraceMs` from
`@libs/shared/srvkit`): a reuse inside the thirty-second window is answered with a session of its own, and one after
it revokes only that token's lineage, so the browser and every other session stay signed in. `libs/shared` ships
through `akan install-library`, not a versioned package, so this changeset names none.
