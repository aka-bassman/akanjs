# service.signal.ts

- Source: /conventions/service/signal
- Mirror: /llms/pages/conventions/service/signal.md
- Section: conventions
- Category: Service
- Priority: P1

## Headings

- service.signal.ts (#signal-file)
- Every Endpoint Names Its Guards (#guards)
- Routes That Are Not Ours (#custom-routes)
- Work Nobody Calls (#internal)
- Realtime Without A Model (#realtime)

## Content

service.signal.ts

A model signal declares three classes. A service signal declares two, and the missing one is Slice — a slice is a window onto a table with pagination and an insight query behind it, and a module with no table has nothing to put in the window.

The Internal class is empty and stays in the file. The Endpoint class holds one mutation, and the body of that mutation is one line — the signal decides who may call and what the arguments are, and the service decides what happens.

Every Endpoint Names Its Guards

A model module has a slice, and a slice carries a guards map that the generated CRUD endpoints inherit. A service module has neither, so there is no default to fall back on and no file to look in: every endpoint names its own array, beside itself.

[Public] is a decision here, written down as one. The class comment says what would be true if the guard were tighter, which is the one kind of comment this codebase asks for: an obvious alternative was rejected, and here is why.

Routes That Are Not Ours

Most endpoints are reached by their generated path and never by a literal. A protocol endpoint is the exception: RFC 8414 says the metadata document lives at /.well-known/oauth-authorization-server, and a client that cannot find it there has no way to ask.

Four options do that, and a shared const is how ten endpoints avoid disagreeing about them. path names the literal route; prefix: false drops the module name Akan would otherwise put in front of it; globalPrefix: false drops the api segment; mcp: false keeps the protocol off an agent's shelf without touching who may call it.

the raw Request, for a handler that has to read a form body or a header Akan does not parse for it

the caller's address as a proxy recorded it. Never read it off the socket — behind a gateway every peer is 127.0.0.1

the verified account, or null when the option says nullable. Never take the acting identity as a body value

A Response returned from exec is sent as it stands. That is how localFile streams a blob back with no copy and how every OAuth endpoint answers with a redirect the client is waiting for.

Work Nobody Calls

internal() is for work the runtime starts: a cron expression, an interval, a queue job, something that has to happen once at boot or once at shutdown. It takes no guards option at all, and that is not an omission — the runtime is the only caller, so there is no request to authorize.

The serverMode there has to match the one the service declares, or the job is scheduled in a process where the service it calls was never loaded. All eight service modules in this workspace still have an empty internal class, which is what an internal class looks like until the first scheduled job arrives.

Builders internal() offers:

cron(expression) and interval(ms) — recurring work, locked by default so two replicas do not both run it.

initialize() and destroy() — once when the process starts, once when it stops.

process(Return).msg(...) — a background queue job, with msg naming the payload.

resolveField(Return) — a model module's viewer-specific field. A service module has no model, so it has no use for this one.

Realtime Without A Model

pubsub and message need no table either. A pubsub declares a room and a payload, a message handles one frame a client sends, and a service publishes into the room through its own injected signal.

## Code Examples

### libs/util/lib/_security/security.signal.ts

```ts
import { endpoint, internal } from "akanjs/signal";

import * as srv from "../srv";

export class SecurityInternal extends internal(srv.security, () => ({})) {}

export class SecurityEndpoint extends endpoint(srv.security, ({ mutation }) => ({
  encrypt: mutation(String)
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
})) {}
```

### libs/shared/lib/_oauth/oauth.signal.ts

```ts
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
  getBlob: query(Any, { guards: [Public], path: "localFile/getBlob/*" }) // [!code ++]
    .with(Req)
    .exec(async function (req) {
      const path = req.url.split("/localFile/getBlob/").slice(1).join("/localFile/getBlob/");
      const fileStream = await this.localFileService.readLocalFile(path);
      return new Response(fileStream);
    }),
})) {}
```

### A cron scoped to the batch worker

```ts
export class SecurityInternal extends internal(srv.security, ({ cron }) => ({
  cleanup: cron("0 0 * * *", { serverMode: "batch" }).exec(async function () {
    await this.securityService.pruneExpiredSessions();
  }),
})) {}
```

### apps/minimal/lib/_minimal/minimal.signal.ts

```ts
export class MinimalEndpoint extends endpoint(srv.minimal, ({ query, message, pubsub }) => ({
  benchFanout: pubsub(Any)
    .room("roomId", String)
    .exec(() => undefined),
  benchPublish: message(Boolean)
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

