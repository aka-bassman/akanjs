# Overview

- Source: /conventions/service/overview
- Mirror: /llms/pages/conventions/service/overview.md
- Section: conventions
- Category: Service
- Priority: P1

## Headings

- Service Module Overview (#service-module)
- The Eight That Exist (#real-modules)
- The Two Poles (#two-poles)
- Service File Map (#file-map)
- Ship The Empty Files (#empty-scaffolds)
- Model Module Or Service Module (#which-one)

## Content

Overview

Where It Lives

What It Owns

An action or a capability instead of a table. Nothing to list, edit, or keep until tomorrow.

What It Leaves Out

No document file, no filters, no slices, no generated CRUD: there is no table behind it.

How It Is Called

The same path a model module uses, minus the document layer.

JWT signing and verification, AES encryption, refresh-token minting. Server-only: no store, no UI.

The OAuth 2.1 authorization server that issues the tokens `/mcp` accepts.

Serves the Akan.js docs to agents over MCP. It reads a generated folder and writes nothing.

Streams a public blob back as an HTTP `Response` from a custom path. Four files, one endpoint.

A library's root container: an empty batch service and a client store other modules share.

An app's root container. `_akan` is still the empty scaffold; `_minimal` adds four bench endpoints.

The store is the empty scaffold.

Feature modules

Tests its service: `doc.service.test.ts`.

Root containers

The Floor

Its service holds two secrets and hands back signed or encrypted strings. Nothing on screen renders it, so there is no store and no component.

What it owns, and four rules

Endpoint labels

About 75 lines holding two secrets

Boots the barrel and calls it

The Ceiling

Eight rules and a workflow chain

About 500 lines: PKCE, rotation, revocation

10 endpoints, 5 of them at the origin root

The protocol, end to end

A title, one sentence on what it owns, and `## Rules`: invariants the code cannot show.

Built with `serviceDictionary`: endpoint labels, error keys and UI phrases.

The workflow itself, built with `serve()` naming the module, even when the body is empty.

Two classes, `<X>Internal` and `<X>Endpoint`. No Slice, because there is no table to page through.

Only when the feature has client state. Four of the eight have one; two are empty scaffolds.

Boots the barrel and calls the endpoints through `fetch`. `_security` and `_oauth` have one.

Rare: none of the eight has one. The two UI pages of this section explain why.

The builder callback returns an empty object, not nothing.

A root container with no methods still declares its service.

Exactly two comments, `// state` and `// action`, mark where each half goes.

Model Module

A stored table with a document file, filters, slices, generated CRUD and the five UI roles.

Service Module

No table, no document file, no slice. An action, a protocol, an integration, or a library's own root.

Scalar Module

A value embedded in something else and never stored on its own. A service module's state takes this shape.

Service Module Overview

Signing a token, streaming a stored file back to a browser, running an OAuth handshake to its end: none of these is a record. A folder built around a stored model would give you five files to leave empty and one to fill.

A service module is that folder without the model.

One call through a service module

A page, a store, an MCP client

The runtime itself

the workflow

Another module's service

An adapter in srvkit/

The outside world

The Eight That Exist

This workspace has eight service modules, and reading them is faster than reading a description. They range from a server-only primitive to a whole authorization server, plus the empty root container each app and lib carries.

Module

Only four files are in every one of them. Here is which of the eight carry the optional ones:

Has the file

No file

Why the control usually belongs in ui/ or the page instead.

When a capability earns a section of its own, and when it is just a page.

The Two Poles

Service File Map

Four files are always there. The rest arrive when the feature earns them, and both lists follow the order of this section's pages.

Always There

File

Only When Needed

Ship The Empty Files

The Empty Forms You Will Meet

Model Module Or Service Module

One question decides it: is there a row you would want to list, filter, and still find next week?

The next page is the abstract file, where the rules you just decided on are written down. After that the pages follow the call path:

What the module owns, and its rules.

Endpoint labels, errors and phrases.

The workflow and what it injects.

Internal and Endpoint, without a Slice.

Client state, only when the feature has any.

## Code Examples

### libs/util/lib/_util/util.signal.ts

```ts
import { endpoint, internal } from "akanjs/signal";

import * as srv from "../srv";

export class UtilInternal extends internal(srv.util, () => ({})) {}

export class UtilEndpoint extends endpoint(srv.util, () => ({})) {}
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Treat convention and generated-file rules as stronger than local style guesses.

