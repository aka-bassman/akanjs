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

Another module's service. First choice whenever the work belongs to a module that already exists — oauth reaches user, admin and security this way rather than repeating any of them.

An adapt() singleton from srvkit/. The class itself is the token, so nothing is registered in option.ts. This is the shape a new adapter is written in.

A cache the runtime backs with Redis or sqlite. T is a scalar or model class, not only a primitive: the value serializes through the constant and travels as JSON text, so the same declaration round-trips either backend.

A legacy singleton registered in lib/option.ts. Recognise it, do not reach for it first — migrate one to adapt() only when you are already changing it.

This module's own signal, so the service can publish to a pubsub room it declared. The field name ends in Signal; the injector strips the suffix to find the registration.

A value derived from the server environment at injection time. Use it for configuration, never for a secret resolved at module scope.

A model service opens with serve(db.ticket, ...) and inherits a table's worth of generated methods. A service module has no table to name, so it opens with its own name as a string literal instead — and everything the workflow needs has to be asked for by hand.

Four things there are the pattern rather than this module's details: the "as const" that pins the registration key, the injection callback returning an object of declared dependencies, the readonly field holding a constant the rules refer to, and every crypto primitive coming from @libs/util/srvkit instead of node:crypto.

Asking For What It Needs

The injection callback is the service's dependency list, and the order below is the order to try. Reaching further down the list than you had to is how a module ends up owning a connection that belongs to somebody else.

Injector

An entire authorization server, and it stores nothing in a table. The five memory caches hold client registrations, pending requests, issued codes, a per-address registration counter and the revoked-lineage denylist, each keyed by an expiry the workflow sets. Setup work that has to run once goes in override async onInit(), never at module scope.

The Options Argument

serve() takes an optional options object between the name and the injection callback. It carries two keys: serverMode, which is batch or federation, and enabled, which is a boolean or a function returning one.

That is the file in full, and two of the eight service modules in this workspace are this file to the character — a third differs only by an unused destructure. A library's or an app's root container owns no workflow — it exists so the library has a service name to hang an internal task or a store on — and marking it batch keeps it out of the request servers where it would only take up memory.

What A Method Looks Like

Short, and it decides one thing. A public method is the unit a signal calls; a private one is a step two public methods share. Anything that reads like a paragraph is two methods that have not been split yet.

Two returns and one throw, and the difference between them is the rule. A caller who is not signed in has broken a precondition, so that is an Err the dictionary translates. A session id that names nothing is an ordinary answer — false — and the signal decides whether that is worth an error. Never throw a raw Error; the lint rule refuses it, and a bare Error is generalized to Internal Server Error on the way out.

TypeScript private, not #private

a service file is one of exactly four suffixes where the # form is lint-banned, because the framework mixes into these classes

injected, never constructed. Do not write new Logger() in a service, and never call .log() — the ladder is trace verbose debug info warn error

a helper that touches no injected dependency is static, which is also how you can tell at a glance that it cannot reach the database

What Stays Out

A service file is a server file, and the lint rules hold that boundary at the import statement rather than at the call site — by the time the call runs, the module is already bundled. It may not import a store, a module component, ui/, webkit/, or a package client entrypoint.

It also may not import a third-party package directly. localFile.service.ts reaches blob storage through a type from @libs/util/srvkit, and doc.service.ts reaches the filesystem through an adapter it plugs in — the vendor import lives in srvkit/, once, where a single file can be swapped.

The whole module, in three files:

The service holds the one rule that matters — a path under private/ is never served — and does nothing else to the bytes.

The signal turns the stream into a Response at a custom path, which is the next page.

The dictionary carries the error key the throw names, and the abstract carries the sentence saying why the rule exists.

## Code Examples

### libs/util/lib/_security/security.service.ts

```ts
import { aesDecrypt, aesEncrypt, createOpaqueToken, hashToken, jwtSign } from "@libs/util/srvkit";
import { dayjs, getEnv } from "akanjs/base";
import { serve } from "akanjs/service";

export class SecurityService extends serve("security" as const, ({ use }) => ({
  jwtSecret: use<string>(),
  aeskey: use<string>(),
})) {
  readonly refreshTokenDays = 30;

  async encrypt(data: string) {
    return await aesEncrypt(data, this.aeskey);
  }
  async decrypt(hash: string) {
    return await aesDecrypt(hash, this.aeskey);
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

