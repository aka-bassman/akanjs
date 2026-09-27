---
"@akanjs/devkit": patch
"@akanjs/cli": patch
---

fix(code): two `akan code` sessions refreshing the same MCP token make one refresh between them

Every `akan code` process refreshes an MCP server's token itself, from the one token file they all share. Two
sessions whose calls were refused at the same moment each presented the same refresh token, and a server that
rotates refresh tokens refuses the second use — signing that session out, or revoking the whole grant.

A refresh now runs under a lock file beside the token file (`mcpAuth.json.lock`, the same kind of lock `akan login`
takes on `~/.akan/config.json`). The token is read again once the lock is held: if another session already replaced
it, that token is used and no refresh is made. A lock left by a process that died is taken over; one a live process
holds for more than 30 seconds reads as a failed refresh. The token file's format and location are unchanged.
