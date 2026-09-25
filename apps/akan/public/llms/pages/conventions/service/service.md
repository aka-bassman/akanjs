# service.service.ts

- Source: /conventions/service/service
- Mirror: /llms/pages/conventions/service/service.md
- Section: conventions
- Category: Service
- Priority: P1

## Headings

- service.service.ts (#service-file)
- Asking For What It Needs (#injection)
- The Options Argument (#service-options)
- What A Method Looks Like (#method-shape)
- What Stays Out (#boundaries)

## Content

service.service.ts

A module under `lib/_<name>/` that owns a workflow and no table.

`lib/<model>/<model>.service.ts`, built on a table with `serve(db.<model>, …)`.

The function passed to `serve()` that returns the service's dependencies.

Process roles: federation serves requests, batch runs background work and serves none.

The registration key, pinned as a literal; a `securityService` field finds it by this name.

The injection callback. Each key it returns becomes a field on `this`.

A constant the rules refer to lives on the class as a `readonly` field, not at module scope.

Every crypto primitive comes from here, never from `node:crypto` directly.

Another module's service. The first choice when the work belongs to an existing module.

An `adapt()` singleton found by its own class or by a role, so nothing goes in `option.ts`.

A legacy value registered in `lib/option.ts`; move it to `adapt()` only when you touch it anyway.

Per-service state that outlives one call, in Redis or sqlite; `T` is a scalar or a model class.

A config value computed from the server environment once, when the service is injected.

This module's own signal, so the service can publish to a pubsub room the signal declares.

Client registrations; a registered client expires after `clientDays` (90) days.

Pending authorization requests, each gone `requestMinutes` (10) after it was created.

Issued authorization codes, keyed by their hash and valid for `codeSeconds` (60) seconds.

Registrations per address, capped by `registrationsPerHour`; the count expires after an hour.

Revoked grant lineages, denied for as long as one of their access tokens could still be valid.

The unit a signal calls.

A step that two public methods share.

A helper that touches no injected dependency, so it visibly cannot reach the database.

Case

Write

Why

A precondition is broken

The dictionary translates the key; the third argument sets the status, which defaults to 400.

The input names nothing

An ordinary answer. The signal decides whether it is worth an error.

Server side

Framework facets, except client ones such as `akanjs/client`, `akanjs/ui` and `akanjs/store`.

The module's generated barrels; a service imports `srv` as `import type * as srv`.

Adapters and server helpers, where vendor code lives.

Client side: types only

Client state. Server code holds none.

Module components. Server code never renders JSX.

Client entrypoints, including `@libs/<lib>/client` and `akanjs/client`.

Outside the workspace: never

third-party package

Wrap it in a `srvkit/` adapter and reach it through `plug()` or an exported type.

Built-ins count too: `node:crypto` goes through `@libs/util/srvkit`.

Holds the one rule, that a path under `private/` is never served, and leaves the bytes alone.

Turns the stream into a `Response` at a custom path; the next page covers it.

Carries the error key the `throw` names, in English and Korean.

Lists the rule among the module's invariants.

The service file holds a service module's workflow: the rules its signal calls into. Open it whenever that workflow changes.

Words used on this page

Term

Model Service

Names its table and inherits a table's worth of generated methods.

Service Module

Has no table to name, so it opens with its own name and asks for everything else by hand.

A real service module, cut down to four of its methods:

Four things in it are the pattern, not this module's details:

Pattern

Asking For What It Needs

The injection callback is the service's dependency list. Pick each entry by where the value comes from.

Reaching other code: try in this order

Reaching further down this list than you had to is how a module ends up owning a connection that belongs to somebody else.

Injector

State, configuration and your own signal

The field name is part of the declaration:

An authorization server with no table

The OAuth module uses most of these at once, and stores nothing in a table:

Five memory caches hold the whole authorization state:

Cache

What it holds

Injection Types In Depth

memory() options and the shape each declaration gives you.

Adaptor And plug

How to write the adapt() class a service plugs in.

The Options Argument

Loads the service only in processes of that role, and in an `all` process.

Turns the module on or off and wins over `serverMode`; a function runs once, on first read.

A library's or an app's root container is often this entire file:

What A Method Looks Like

Short, and it decides one thing. Anything that reads like a paragraph is two methods that have not been split yet.

Kind

One public method from the OAuth service, with two of the helpers it calls:

It has one throw and two returns, and the difference between them is the rule:

What Stays Out

A service file is a server file, and the boundary sits at the import statement rather than at the call site. Lint checks every import against this table:

Import from

Allowed

Lint error

Reaches the filesystem through the adapter it plugs in.

The first one in full:

The whole module is four files, and each holds one part of the rule:

File

## Code Examples

### libs/util/lib/_security/security.service.ts

```ts
import { aesDecrypt, aesEncrypt, createOpaqueToken, hashToken, jwtSign } from "@libs/util/srvkit"; // [!code highlight]
import { dayjs } from "akanjs/base";
import { serve } from "akanjs/service";

export class SecurityService extends serve("security" as const, ({ use }) => ({ // [!code highlight]
  jwtSecret: use<string>(),
  aeskey: use<string>(),
})) {
  readonly refreshTokenDays = 30; // [!code highlight]

  async decrypt(hash: string) {
    return await aesDecrypt(hash, this.aeskey);
  }
  async encrypt(data: string) {
    return await aesEncrypt(data, this.aeskey);
  }
  async sign(message: object) {
    return { jwt: await jwtSign(message, this.jwtSecret) };
  }
  createRefreshToken() {
    const refreshToken = createOpaqueToken();
    return {
      refreshToken,
      refreshTokenHash: hashToken(refreshToken),
      refreshTokenExpiresAt: dayjs().add(this.refreshTokenDays, "day").toDate(),
    };
  }
}
```

### libs/shared/lib/_oauth/oauth.service.ts

```ts
export class OauthService extends serve("oauth" as const, ({ use, service, memory }) => ({
  securityService: service<srv.util.SecurityService>(),
  userService: service<srv.UserService>(),
  adminService: service<srv.AdminService>(),
  oauthOption: use<ResolvedOAuthOptions>(),
  clients: memory(Map, { of: cnst.OauthClient }),
  requests: memory(Map, { of: cnst.OauthRequest }),
  grants: memory(Map, { of: cnst.OauthGrant }),
  registrations: memory(Map, { of: Int }),
  revokedSessions: memory(Map, { of: Int }),
})) {
  readonly codeSeconds = 60;
  readonly requestMinutes = 10;
  readonly clientDays = 90;
  readonly registrationsPerHour = 20;

  override onInit() {
    RevokedSessions.use(async (sessionId) => !!(await this.revokedSessions.get(sessionId)));
  }
}
```

### libs/util/lib/_util/util.service.ts

```ts
import { serve } from "akanjs/service";

export class UtilService extends serve("util" as const, { serverMode: "batch" }, () => ({})) {}
```

### libs/shared/lib/_oauth/oauth.service.ts

```ts
async revokeConnection(sessionId: string, account: SerAccount | null): Promise<boolean> {
    const subject = OauthService.subjectOf(account);
    if (!subject) throw new Err("oauth.error.notSignedIn", undefined, { statusCode: 401 });
    const sessions = await listRefreshSessions(this.cacheOf(subject.type), subject.type, subject.id);
    const lineage = sessions.find((session) => session.id === sessionId && session.clientId);
    if (!lineage) return false;
    await this.revokeLineage(lineage);
    this.logger.info(`${subject.type}:${subject.id} disconnected OAuth client ${lineage.clientId}`);
    return true;
  }

  private cacheOf(subject: RefreshSession["subject"]) {
    return subject === "user" ? this.userService.userModel.userCache : this.adminService.adminModel.adminCache;
  }

  private static subjectOf(account: SerAccount | null): Subject | null {
    const { self, me } = (account ?? {}) as SerAccount<{ self?: { id?: string }; me?: { id?: string } }>;
    if (self?.id) return { type: "user", id: self.id };
    if (me?.id) return { type: "admin", id: me.id };
    return null;
  }
```

### libs/util/lib/_localFile/localFile.service.ts

```ts
import type { BlobStorageApi } from "@libs/util/srvkit";
import { serve } from "akanjs/service";

import { Err } from "../dict";

export class LocalFileService extends serve("localFile" as const, ({ use }) => ({
  blobStorageApi: use<BlobStorageApi>(),
})) {
  async readLocalFile(path: string) {
    if (path.startsWith("private/")) throw new Err("localFile.error.privateFilesNotServed");
    return await this.blobStorageApi.readData(path);
  }
}
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Treat convention and generated-file rules as stronger than local style guesses.

