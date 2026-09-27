---
---

fix(util): the account layer reads a bearer credential exactly the way `/mcp` does

`resolveJwt` — what `libs/shared`'s `AccountMiddleware` reads the caller with — split the `Authorization` header on a
space and compared the scheme to `Bearer` exactly, so `bearer <token>` or `Bearer  <token>` left the caller
anonymous, while `/mcp`'s own check (case-insensitive scheme per RFC 7235, one or more spaces per RFC 6750) read the
same header as a credential. An MCP client sending a lowercase scheme got through `/mcp` and then met every guard as
an anonymous caller. `resolveJwt` now parses with exactly `/mcp`'s rule and no more loosely: a token the account
layer read but `/mcp` ignored would skip `/mcp`'s audience and expiry checks. `libs/util` ships through
`akan library install`, not a versioned package, so this changeset names none.
