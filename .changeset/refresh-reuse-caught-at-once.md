---
---

fix(shared): a refresh token presented twice at the same moment is caught as reuse

`rotateRefreshSession` read the session, checked `rotatedAt` and then wrote it, so two presentations of one token
that reached the cache together both passed and each got a live session — under strict single use too, which let a
thief racing the legitimate client in unnoticed. The presented token is now claimed with the cache's atomic
`setIfAbsent` before it rotates: the first presentation rotates as before, and one that loses the claim is a reuse —
revoking the account, or the lineage when asked — unless a grace window was asked for and it falls inside it, measured
from the claim, in which case it gets a session of its own as before. Each presentation lists its new session before
claiming, so the revocation a losing one sets off reaches the winner's session as well. With no grace window the
decision reads no clock, so a presentation whose clock is behind the first one's is a reuse too. Sessions written
before this change are judged by their `rotatedAt` as they were. `libs/shared` ships through `akan install-library`,
not a versioned package, so this changeset names none.
