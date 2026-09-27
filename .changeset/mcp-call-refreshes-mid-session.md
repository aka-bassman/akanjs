---
"@akanjs/devkit": patch
"@akanjs/cli": patch
---

fix(code): an MCP tool call refused mid-session refreshes the token once and retries

`akan code` refreshed an MCP server's token only while connecting. A token that expired or was revoked during a
long session made every call to that server fail with `MCP server "<name>" requires authentication`, which named no
way out, until the session was reloaded.

A call answered 401 now gets one refresh (or the token another session stored since), reopens the server with it —
on a new streamable HTTP session, since a server may bind its session to the token that opened it — and is retried
once. If the refresh is refused, or the new token is refused too, the call fails with `MCP server "<name>" needs
signing in — /mcp login <name>`, and later calls to that server answer the same without refreshing again.

Calls refused together share one refresh, and so does every connection in the process that would present the same
refresh token — a sub-agent's, or one opening with an expired token — because a server that rotates refresh tokens
may revoke the whole grant when one is presented twice. The token file's format and location are unchanged.
