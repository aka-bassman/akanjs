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

JWT signing and verification, AES encryption, refresh-token minting. Server-only: no store, no UI.

The OAuth 2.1 authorization server that issues the tokens /mcp accepts. The largest service module in the workspace.

Serves the Akan.js documentation corpus to agents over MCP. Reads a generated folder; writes nothing.

Streams a public blob back as an HTTP Response from a custom path. Four files, one endpoint.

The library's own root container. The service is an empty batch service; the store holds cross-module client state such as the map viewport or the sign-in flow.

The app's own root container, still as akan sync scaffolded it. Every file is present and empty — that is the intended resting state, not an unfinished one.

A title line, one sentence naming what the module owns, and a ## Rules list of the invariants the code cannot show. Every one of the eight has it.

The workflow itself, built with a serve() call naming the module. Every one of the eight has it, even when the body is empty.

Two classes, <X>Internal and <X>Endpoint. There is no Slice — a slice is a window onto a table, and a service module has none.

Built with serviceDictionary rather than modelDictionary — endpoint labels, error keys, and UI phrases. Not tied to model fields, because there are none.

Only when the feature has client state. Four of the eight have one, and two of those four are empty scaffolds.

Boots the whole barrel and calls the endpoints through the generated fetch. _security and _oauth carry one.

Service Module Overview

You need to sign a token, stream a stored blob back to a browser, or run an OAuth handshake to its end. None of those is a record. There is nothing to list, nothing to edit, and no row that would still be there tomorrow — so a folder built around a stored model gives you five files you will leave empty and one you will fill.

A service module is that folder without the model. It lives at lib/_<service> with a leading underscore, its files drop that underscore, and it owns an action or a capability instead of a table. The call path is the same one a model module uses, minus the document layer.

One call through a service module

The Eight That Exist

This workspace has eight service modules, and reading them is faster than reading a description of one. They land on a spectrum: a server-only primitive at one end, an entire authorization server at the other, and an empty root container at the near end.

Module

Notice what none of them has: not one of the eight carries a Util.tsx or a Zone.tsx. That is not an accident of this workspace — see the two UI pages in this section for why the file is rare and what goes there instead.

The Two Poles

_security is the floor. Five files, one of them a test, and a service class whose whole job is to hold two secrets and hand back signed or encrypted strings. Nothing on screen ever renders it, so there is no store and no component.

_oauth is the ceiling, and it is still the same five kinds of file. A 500-line service, ten endpoints, a dictionary that carries error keys and consent-page phrases as well as labels — and no store, because every screen it needs is a route in libs/shared/page/oauth rather than a section of one.

Service File Map

Four files are always there. The rest arrive when the feature earns them, and the order is the order of this section's pages.

File

Ship The Empty Files

The rule that most often looks like a mistake: a scaffold file stays in the tree even when it holds nothing. Here is libs/util/lib/_util/util.signal.ts in full, unedited, on the main branch.

Two exported classes, zero methods. Deleting the file is not a smaller workspace, it is a different one: the generated sig barrel stops naming the module, the next developer has to decide where an endpoint goes instead of where it goes in the file that is already open, and the diff that adds the first endpoint is a new file rather than one line.

The empty forms you will meet:

export class XInternal extends internal(srv.x, () => ({})) {} — the builder callback returns an empty object, not nothing.

export class UtilService extends serve("util" as const, { serverMode: "batch" }, () => ({})) {} — a root container with no methods still registers the service name.

A store body of exactly two comments, // state and // action, marking where each half goes.

apps/akan/lib/_akan and apps/minimal/lib/_minimal are both in exactly this state, all five files present and all five empty, and they are not on anyone's list to clean up.

Model Module Or Service Module

One question decides it: is there a row you would want to list, filter, and still find next week? If yes, it is a model module at lib/<model>, and the service module you were about to write is one of its service methods. If no, it is a service module.

Model module

lib/<model>. A stored table, a document file, filters, slices, generated CRUD, and the five UI roles. user, file, banner, notification.

Service module

lib/_<service>. No table, no document file, no slice. An action, a protocol, an integration, or a library's own root. security, oauth, localFile, doc.

Scalar module

lib/__scalar/<scalar>. A value that is embedded in something else and never stored on its own. This is where a service module's own state lives when it has any.

The next page is the abstract file, which is where the rules you just decided on get written down. After that the pages follow the call path: dictionary, service, signal, store.

## Code Examples

### libs/util/lib/_security

```bash
security.abstract.md     # what it owns, and four rules
security.service.ts      # the workflow
security.signal.ts       # one mutation
security.dictionary.ts   # endpoint labels
security.signal.test.ts  # boots the barrel and calls them
```

### libs/shared/lib/_oauth

```bash
oauth.abstract.md      # seven rules and a workflow chain
oauth.service.ts       # ~500 lines: PKCE, rotation, revocation
oauth.signal.ts        # 10 endpoints, 5 of them at the origin root
oauth.dictionary.ts    # .endpoint() + .error() + .translate()
oauth.signal.test.ts   # the protocol, end to end
```

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

