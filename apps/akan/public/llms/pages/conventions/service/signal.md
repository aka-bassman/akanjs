# service.signal.ts

- Source: /conventions/service/signal
- Mirror: /llms/pages/conventions/service/signal.md
- Section: conventions
- Category: Service
- Priority: P1

## Headings

- service.signal.ts (#signal-file)
- Every Endpoint Names Its Guards (#guards)
- Routes A Protocol Fixes (#custom-routes)
- Work The Runtime Starts (#internal)
- Realtime Without A Model (#realtime)

## Content

service.signal.ts

A module in `lib/_<name>` with no table of its own, such as `_security` or `_oauth`.

A class that decides whether a call may run, such as `Public`, `Every` or `Admin`.

A value the server fills in rather than the caller, taken with `.with(...)`.

The protocol AI agents use to call your endpoints. Akan serves it at `/mcp`.

A server's role: `federation` answers requests, `batch` runs background work, `all` does both.

Model module

Service module

Declared in this order

Work the runtime starts: schedules, queue jobs, boot and shutdown. Written even when empty.

A paged window onto a table, with an insight query behind it. No table, no slice.

What callers reach: `query`, `mutation`, `pubsub` and `message`.

Checks the caller

Agents see it

Names a real guard

Published. An agent's call is checked like anyone else's.

HTTP serves it as before. Only the agent listing drops it.

A person-only act. A model is refused and never sees the entry.

Names Public, or nothing

An open read, decided on purpose. Published, like the doc tools below.

Runs for anyone over HTTP. MCP treats it as having no guard.

no guards

Zero checks over HTTP, and refused by MCP.

endpoint name

A literal route, in place of the one built from the endpoint name and its `.param()`s.

model refName

The segment before the path. A model module puts its refName there; a service module, nothing.

API prefix (/api)

`false` drops the app's API prefix, so the route sits at the origin root.

`false` keeps it off the agent listing without changing who may call it.

The raw `Request`, for a form body or a header Akan does not parse for you.

The caller's IP as the nearest proxy recorded it, or `null` when no address is known at all.

The verified account of the caller, imported from `@libs/shared/srvkit`.

Runs on a cron schedule, such as every midnight.

Runs every `ms` milliseconds.

Runs once, `ms` milliseconds after the server starts.

Runs once when the process starts, and once when it stops.

A background queue job. `.msg()` names each field of its payload.

Computes a model's `resolve` field. A service module has no model, so it never uses this.

Which server roles run it. `"batch"` runs on batch and `"all"` servers, never on federation.

every mode

Runs only where `AKAN_PUBLIC_OPERATION_MODE` is in the list, like `["cloud"]`.

For `cron` and `interval`, skips a run while the previous one still runs in the same process.

`false` turns the job off without deleting its code.

service.signal.ts is the door in front of a service module. The signal decides who may call and with which arguments, and the service decides what happens. You open it to add an endpoint, a scheduled job or a realtime room.

Words used on this page

Term

Two classes, not three

A model module's signal declares three classes. A service module's declares two, because it has no table to put a slice in front of:

Class

Declared

Not declared

Here is the whole file for a receipt module with one endpoint:

Common mistake: an endpoint with no guards

Every Endpoint Names Its Guards

The same array also decides whether AI agents see the endpoint over MCP:

What the endpoint declares

Yes

No

An open endpoint is fine when it is a decision, written down as one. The docs app's own signal does exactly that:

Routes A Protocol Fixes

Values the server fills in

Internal argument

Return a Response as it is

Work The Runtime Starts

Builder

A job that should run once a night, not once per server, names the batch worker:

Realtime Without A Model

A room clients subscribe to. It declares the room's arguments and the payload type.

The minimal app pairs one of each for a fan-out benchmark:

## Code Examples

### apps/koyo/lib/_receipt/receipt.signal.ts

```ts
import { Every } from "@libs/shared/srvkit";
import { ID } from "akanjs/base";
import { endpoint, internal } from "akanjs/signal";

import * as srv from "../srv";

export class ReceiptInternal extends internal(srv.receipt, () => ({})) {}

export class ReceiptEndpoint extends endpoint(srv.receipt, ({ mutation }) => ({
  printReceipt: mutation(Boolean, { guards: [Every] })
    .param("icecreamOrderId", ID)
    .exec(async function (icecreamOrderId) {
      return await this.receiptService.print(icecreamOrderId);
    }),
})) {}
```

### libs/util/lib/_security/security.signal.ts

```ts
import { endpoint, internal, None } from "akanjs/signal";

import * as srv from "../srv";

export class SecurityInternal extends internal(srv.security, () => ({})) {}

export class SecurityEndpoint extends endpoint(srv.security, ({ mutation }) => ({
  encrypt: mutation(String) // [!code --]
  encrypt: mutation(String, { guards: [None], mcp: false }) // [!code ++]
    .body("data", String)
    .exec(async function (data) {
      return await this.securityService.encrypt(data);
    }),
})) {}
```

### apps/akan/lib/_doc/doc.signal.ts

```ts
import { Int } from "akanjs/base";
import { endpoint, internal, Public } from "akanjs/signal";

import * as cnst from "../cnst";
import { Err } from "../dict";
import * as srv from "../srv";

export class DocInternal extends internal(srv.doc, () => ({})) {}

/**
 * The framework's own documentation, served to agents.
 *
 * `[Public]` on every one of these is the decision, not an omission: the corpus is the same markdown the site
 * already serves anonymously under `/llms/pages`, so a guard here would protect nothing while making the tools
 * unusable to the agents they exist for.
 */
export class DocEndpoint extends endpoint(srv.doc, ({ query }) => ({
  listDocPages: query([cnst.DocPage], { guards: [Public] })
    .search("section", cnst.DocSection)
    .exec(async function (section) {
      return await this.docService.listPages(section);
    }),

  readDocPage: query(String, { guards: [Public] })
    .param("href", String, { example: "/references/akanjs/signal" })
    .exec(async function (href) {
      // An href that names nothing is the caller's own mistake, and an agent that gets it wrong needs to be told
      // so rather than handed an empty page it would go on to summarize.
      const body = await this.docService.readPage(href);
      if (!body) throw new Err("doc.error.docPageNotFound");
      return body;
    }),

  searchDocPages: query([cnst.DocPage], { guards: [Public] })
    .param("text", String, { example: "cascade remove" })
    .search("limit", Int)
    .exec(async function (text, limit) {
      return await this.docService.searchPages(text, limit);
    }),
})) {}
```

### libs/shared/lib/_oauth/oauth.signal.ts

```ts
import { Account } from "@libs/shared/srvkit";
import { Any } from "akanjs/base";
import { endpoint, Ip, Public, Req } from "akanjs/signal";

import * as srv from "../srv";

// The protocol endpoints live at the origin's root, where RFC 8414 and the clients look for them, and are `mcp: false`
// because they are the way onto the shelf rather than anything on it. `[Public]` is the decision: a client holds no
// credential yet, which is what it is here to obtain.
const protocolRoute = { guards: [Public], prefix: false as const, globalPrefix: false as const, mcp: false as const };

export class OauthEndpoint extends endpoint(srv.oauth, ({ query, mutation }) => ({
  oauthAuthorizationServerMetadata: query(Any, {
    ...protocolRoute,
    path: ".well-known/oauth-authorization-server",
  }).exec(function () {
    return this.oauthService.metadata();
  }),

  authorizeOAuth: query(Any, { ...protocolRoute, path: "oauth/authorize" })
    .with(Req)
    .with(Account, { nullable: true })
    .exec(async function (req, account) {
      return await this.oauthService.authorize(req, account);
    }),

  // Nullable: a child reached over a unix socket learns the caller only from the gateway's headers, and a
  // deployment that lost them should register under a shared, wider bucket rather than refuse every client.
  registerOAuthClient: mutation(Any, { ...protocolRoute, path: "oauth/register" })
    .with(Req)
    .with(Ip, { nullable: true })
    .exec(async function (req, ip) {
      return await this.oauthService.register(await req.json().catch(() => null), ip);
    }),
})) {}
```

### libs/util/lib/_localFile/localFile.signal.ts

```ts
export class LocalFileEndpoint extends endpoint(srv.localFile, ({ query }) => ({
  getBlob: query(Any, { guards: [Public], path: "localFile/getBlob/*", mcp: false }) // [!code highlight]
    .with(Req)
    .exec(async function (req) {
      const path = req.url.split("/localFile/getBlob/").slice(1).join("/localFile/getBlob/");
      const fileStream = await this.localFileService.readLocalFile(path);
      return new Response(fileStream);
    }),
})) {}
```

### apps/koyo/lib/_receipt/receipt.signal.ts

```ts
import { Every } from "@libs/shared/srvkit";
import { ID } from "akanjs/base";
import { endpoint, internal } from "akanjs/signal";

import * as srv from "../srv";

export class ReceiptInternal extends internal(srv.receipt, ({ cron }) => ({ // [!code ++]
  purgeReceipts: cron("0 0 * * *", { serverMode: "batch" }).exec(async function () { // [!code ++]
    await this.receiptService.purgeExpired(); // [!code ++]
  }), // [!code ++]
})) {} // [!code ++]

export class ReceiptEndpoint extends endpoint(srv.receipt, ({ mutation }) => ({
  printReceipt: mutation(Boolean, { guards: [Every] })
    .param("icecreamOrderId", ID)
    .exec(async function (icecreamOrderId) {
      return await this.receiptService.print(icecreamOrderId);
    }),
})) {}
```

### apps/minimal/lib/_minimal/minimal.signal.ts

```ts
export class MinimalEndpoint extends endpoint(srv.minimal, ({ query, message, pubsub }) => ({
  benchFanout: pubsub(Any, { guards: [Public], mcp: false })
    .room("roomId", String)
    .exec(() => undefined),
  benchPublish: message(Boolean, { guards: [Public], mcp: false })
    .msg("roomId", String)
    .msg("seq", Int)
    .msg("sentAt", Int)
    .exec(async function (roomId, seq, sentAt) {
      return await this.minimalService.publishBenchFanout(roomId, seq, sentAt);
    }),
})) {}
```

### apps/minimal/lib/_minimal/minimal.service.ts

```ts
export class MinimalService extends serve("minimal" as const, { serverMode: "batch" }, ({ signal }) => ({
  minimalSignal: signal<sig.Minimal>(),
})) {
  async publishBenchFanout(roomId: string, seq: number, sentAt: number) {
    await this.minimalSignal.benchFanout(roomId, { seq, sentAt });
    return true;
  }
}
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Treat convention and generated-file rules as stronger than local style guesses.

