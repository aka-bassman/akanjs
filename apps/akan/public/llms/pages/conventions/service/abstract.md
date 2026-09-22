# service.abstract.md

- Source: /conventions/service/abstract
- Mirror: /llms/pages/conventions/service/abstract.md
- Section: conventions
- Category: Service
- Priority: P1

## Headings

- service.abstract.md (#service-abstract)
- The Shape It Actually Has (#real-shape)
- Replace The Scaffold (#scaffold)
- What Counts As A Rule (#what-to-write)

## Content

service.abstract.md

Six months from now somebody will read oauth.service.ts and see that a refresh token reused within thirty seconds gets a rotation instead of a revocation. The code says it. What the code cannot say is why: a client that holds the same token twice is not a thief, and treating it as one signs the user out of an app that did nothing wrong.

That sentence is the whole job of the abstract. It holds the invariants the implementation obeys but cannot explain, and nothing else. The folder keeps its underscore and the file drops it: lib/_oauth/oauth.abstract.md.

The Shape It Actually Has

Four parts, and the last one is optional. Thirty-one of the thirty-three abstracts in this workspace are written this way; the two that are not have never been written at all.

One title line carrying the module name as the folder spells it, minus the underscore.

One declarative sentence

What this module owns, stated as fact and not as a promise. No heading above it.

Two to five bullets. Each one is an invariant a reader could not derive from the code, not a restatement of it.

A workflow chain

Optional, and one line when present. Bare arrows, no heading: authorize -> pending -> approved | denied -> code.

libs/shared/lib/_oauth/oauth.abstract.md is the best one in the workspace. It is reproduced below in full, unedited — seven rules and a chain, for a module whose service file is five hundred lines.

Read the rules against the code and notice what is missing. Not one names a field, a type, a class, or a method. Every one of them is a decision somebody made that the next reader would otherwise have to reverse-engineer, and four of the seven exist to stop a plausible change from becoming a security hole.

Replace The Scaffold

A new service module arrives with six headings and no content. This is the file akan sync writes, and it is a prompt rather than a template — the first real edit deletes five of the six.

Purpose becomes the one sentence under the title. Domain Rules becomes ## Rules. Workflows becomes the arrow chain, if there is one. Data Meaning belongs next to the field it describes, as a trailing comment in constant.ts. Agent Notes and Related Modules say nothing this guide does not already say to every module, so they go and nothing replaces them.

What Counts As A Rule

The test is the same one the comment rule uses: does this sentence carry a fact that is nowhere in the code? A bullet that survives it is worth its line for years. One that does not goes stale the first time somebody renames a field.

Worth a bullet:

A lifetime or a threshold and the reason for it — a code lives sixty seconds; a request lives ten minutes.

A refusal that looks like an oversight — revocation answers 200 whether or not the token was live, so it cannot be used to probe tokens.

Why an obvious alternative was rejected — a client holding the same refresh token twice is not a thief.

A scope boundary the code enforces one call at a time — a later reuse revokes that grant's lineage only, never the account's other sessions.

⚠️ Not worth a bullet:

A field list, a type, or a method signature. The constant file and the signal file are shorter than the sentence describing them.

Anything the root AGENTS.md already says to every module, such as keeping business behaviour in the service.

A to-do, a roadmap, or a list of related modules that the import graph already shows.

Korean is normal in an abstract and common in this workspace — security, util, localFile and shared are all written in it. What is never normal is a language split inside one file.

## Code Examples

### libs/shared/lib/_oauth/oauth.abstract.md

```markdown
# oauth Service Abstract

Issues, from the same process that serves `/mcp`, the OAuth 2.1 tokens that MCP endpoint accepts: authorization-server
metadata, authorization with PKCE and a consent page, client registration, token exchange and refresh.

## Rules

- Every access token is signed with the app's own secret and names the MCP endpoint as `aud`, so `AccountMiddleware`
  accepts it unchanged and `McpAuth` verifies it through `option.setMcp`. Guards stay the only authorization decision;
  no scope narrows what the token may do.
- An authorization request lives ten minutes, binds to the first signed-in account that opens it, and is decided once.
  A code lives sixty seconds and is consumed on first exchange, whether or not that exchange succeeds.
- PKCE `S256` is the only method. A redirect URI must be registered and match exactly, except that a loopback address
  may vary its port; a private-use scheme is accepted only when configuration names it.
- Refresh tokens rotate on use through `refreshSession`; a token reused within thirty seconds of its rotation is answered with
  a rotation of its own (a client that holds it twice is not a thief), one reused later revokes that grant's lineage only — never
  the account's other sessions. A refresh presented by a client other than the one it was issued to is refused.
- Registration is open (RFC 7591), rate-limited per address and public-client only; a `client_id` that is an HTTPS URL is
  read as a Client ID Metadata Document — resolved first and refused when it points into a private range, never fetched
  from the server's own network — unless configuration turns the feature off.
- A grant is revoked as a whole (RFC 7009 `/oauth/revoke` by the client, or the account's owner disconnecting it): its
  refresh lineage is closed and the lineage id is denylisted for an access token's lifetime, which is how a stateless
  token dies early. Revocation answers 200 whether or not the token was live, so it cannot be used to probe tokens.
- A token this server minted names its client and the MCP resource; a browser session names neither. That difference is
  what `isAgentCall` / `Person` read to keep an act a person may take from being taken on a model's say-so.
- None of these endpoints is published to MCP: they are the protocol and the account's own controls, not tools.

authorize -> pending -> approved | denied -> code -> token -> refresh -> revoked
```

### pkgs/@akanjs/cli/templates/service/__model__.abstract.md

```markdown
# Service Abstract

## Purpose // [!code --]

Describe the business workflow or integration this service owns. // [!code --]

## Domain Rules // [!code --]

- Keep durable business invariants here.
- Avoid repeating implementation details already clear in the service or signal files. // [!code --]

## Data Meaning // [!code --]

Explain important input, output, and state meanings only when the code does not make the intent obvious. // [!code --]

## Workflows // [!code --]

Describe the service workflows, background jobs, external calls, or state transitions.

## Agent Notes // [!code --]

- Read this abstract before changing the service module. // [!code --]
- Keep business behavior in service code and expose callable actions through signals. // [!code --]
- Update this file when business invariants, workflows, or public behavior change. // [!code --]

## Related Modules // [!code --]

- None yet. // [!code --]
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Treat convention and generated-file rules as stronger than local style guesses.

