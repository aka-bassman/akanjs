---
"@akanjs/devkit": patch
"@akanjs/cli": patch
---

fix(code): an MCP server that refuses a stored token gets one refresh before `akan code` asks for a sign-in

`akan code` refreshed an MCP server's token only when the stored expiry said it had run out. A server that refused
the token earlier — it was revoked, or it was a refreshed token the server issued with no lifetime, which is kept
until refused — sent the session straight to `sign-in needed · /mcp login <name>`, even though the stored refresh
token would still have worked.

On a 401 at connect, a server holding a refresh token now gets exactly one refresh (or the token another session
already stored since), and the connect is retried with it. Only when that refresh is refused, or the new token is
refused too, is the server listed as needing a sign-in. A 401 is never retried a second time, so a server that
refuses every token costs one refresh, not a loop.
