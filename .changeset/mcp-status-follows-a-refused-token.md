---
"@akanjs/devkit": patch
"@akanjs/cli": patch
---

fix(code): `/mcp` says `sign-in needed` for a server whose token stopped working mid-session

An MCP server whose token could not be renewed during a session answered every tool call with `needs signing in —
/mcp login <name>`, but `/mcp` kept listing it as `signed in` — the state from when the session connected. Its row
now turns to the same `sign-in needed · /mcp login <name>` a failed connect shows, and `/mcp <name>` says it needs
signing in instead of listing tools that cannot answer; a server that failed to connect for want of a sign-in no
longer claims it "connected and published no tools" there either. `/mcp login <name>` (or `/mcp reload` once a
usable token is stored) reopens the session, and the server reads as signed in again.
