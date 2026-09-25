# model.service.ts

- Source: /conventions/module/service
- Mirror: /llms/pages/conventions/module/service.md
- Section: conventions
- Category: Domain
- Priority: P1

## Headings

- model.service.ts (#service-overview)
- Service Shapes (#service-shapes)
- What serve() Gives You (#serve-runtime)
- Generated Methods (#generated-methods)
- Service Extension (#service-extension)
- Injection Builder (#injection-overview)
- Injection Types (#injection-types)
- Business Logic Flow (#business-flow)
- Lifecycle Hooks (#lifecycle-hooks)
- Practical Rules (#practical-rules)

## Content

model.service.ts

Changing one document

state change

A chain method such as `story.approve()` validates, changes the document and returns `this`.

state precondition

The chain method throws when the document is in the wrong state for the change.

Running a business action

multi-document workflow

Load the documents, call their chain methods, save, then notify.

cross-document rule

A rule that compares several documents throws its `Err` here.

external API · job · server-only code

Reached through injected adapters, signals and env values.

Exposing it

who may call it

The endpoint's guards decide access.

the endpoint

Its `exec` calls one service method and nothing more.

A service bound to one model with `serve(db.<model>, …)`. It gets that model's methods.

A service with no model, made with `serve("<name>" as const, …)`.

The function you pass to `serve()`. Each key it returns becomes a property on `this`.

A document method that changes one document and returns `this`, e.g. `story.approve()`.

A method such as `_preCreate` that runs around `create<Model>`, `update<Model>` or `remove<Model>`.

Database

Plain

From the model

The model adaptor, such as `this.storyModel`.

The six CRUD methods listed under Generated Methods.

Fourteen methods for each filter in the document.

Hooks around create, update and remove.

On every service

A Logger named after the class, such as `StoryService`.

Run once at boot and once at shutdown.

injected properties

Every key your injection builder returns.

Service classes passed after the builder, mixed in.

First argument for a database service.

First argument for a plain service.

Goes second when present. See Service Option below.

Returns the properties to inject. See Injection Builder.

Mixes in their methods, injections and hooks. See Service Extension.

`false` leaves the service out. A function runs once, the first time it is read.

On only where `SERVER_MODE` is that value or `all`. `enabled` wins when both are set.

The model adaptor, injected automatically. Call the model's own methods and filters on it.

A Logger named after the service class.

Loads one document by id. Throws when it does not exist.

Loads one document by id. Returns null when it does not exist or the id is empty.

Loads several documents by id in one batch.

Creates a document through `_preCreate` and `_postCreate`.

Applies a patch through `_preUpdate` and `_postUpdate`, then returns the document.

Soft-removes (sets `removedAt`) through the remove hooks, then runs cascades.

Lists the matching documents.

Lists the ids of the matching documents.

Finds one match, or returns null.

Finds the id of one match, or returns null.

Finds one match. Throws when there is none.

Finds the id of one match. Throws when there is none.

Checks for a match. Returns the id of one match, or null.

Counts the matching documents.

Computes the model's insight over the matching documents.

Returns the query descriptor itself, without running it.

Soft-removes every match in one atomic update.

Soft-removes the newest match by `createdAt`. For at-most-one queries, not for queues.

Updates every match atomically. The patch goes in `.set()`; the chain alone runs nothing.

Updates the newest match by `createdAt`. The result has counts, not which row changed.

Another service, a lib's included. The key must end in `Service`; the rest names the target.

A value registered with `option.use()` in `lib/option.ts`. The key must match its name.

A server signal, for queueing a background job or publishing an event. Key ends in `Signal`.

An `adapt()` adapter. If an implementation was applied to that role, you get it instead.

A value built at boot from the server env or `process.env`. Pass a factory, not `env("KEY")`.

State kept in the cache adaptor, or on the instance with `local: true`. See below.

This service's own model. A database service already has it as `<model>Model`.

Keep a plain writable value on this instance instead of in the cache; on a `Map`, a real `Map`.

What a single value reads before its first `set()`, else `null`; a `local` one starts with it.

The value type of a `Map` memory, a scalar or model class. Required when `ref` is `Map`.

How long each write lives, unless that `set()` passes its own `{ expireAt }`.

Maps the stored value (a Map's entry value) to what code reads. Give it with `set` or not at all.

The inverse of `get`: turns what code writes back into the stored value.

A plain value you read and assign directly.

An object with three async methods.

An async key–value map.

Runs before `create<Model>`. Return the data to create; you may change it.

Runs after the document is created. Return the document.

Runs before `update<Model>`. Return the patch to apply.

Runs after the update. Return the document.

Runs before `remove<Model>`. Check or clean up here; throw to stop the removal.

Runs after the soft remove. Return the document.

A cascade field removes its targets through their services, so their `_postRemove` runs too.

Runs once at boot, after this service's injections are filled in.

Runs once when the server shuts down.

Open it when an action needs more than one document, another service, a background job, an external API, or anything that must stay on the server.

Which file owns the work

The work

Belongs here

Not here

Words used on this page

Term

Service Shapes

Database Service

Plain Service

No model. For runtime coordination, scheduled work, shared server features, or app-level orchestration.

Extended Service

A database service that also mixes in a lib's service for the same model, then adds app-specific behaviour.

A database service, complete with its imports:

What serve() Gives You

What you get

Included

Not included

Arguments

Service Option

Generated Methods

Predefined Properties

Property

CRUD Methods

Method

Filter Methods

Reads

Query-level writes

Full-text search

Service Extension

Injection Builder

Injection Types

Pick the helper by where the value comes from:

Helper

use() and plug() in real code

env() feeding a hook

memory() in detail

Declared as

All three shapes side by side:

Business Logic Flow

A service method should read like the business action it performs. It can load documents, call their chain methods, work with other services, write logs and queue signals, all in one place.

A like is recorded through another service, then counted by the model:

A backup moves through several steps, and the slow part runs later as a queued job:

Lifecycle Hooks

Hook

Here a backup refuses to start twice for the same branch, and a new backup queues its own archive job:

Practical Rules

Write the chain methods and filters a service calls.

Expose service methods as guarded endpoints.

Server Utils (srvkit/)

Write the adapters a service injects with plug().

Dependency Injection

Recipes for service, plug, use and env.

## Code Examples

### apps/koyo/lib/story/story.service.ts

```ts
import { serve } from "akanjs/service";

import * as db from "../db";
import type * as srv from "../srv";

export class StoryService extends serve(db.story, ({ service }) => ({
  boardService: service<srv.BoardService>(),
  actionLogService: service<srv.ActionLogService>(),
})) {
  async approve(storyId: string) {
    const story = await this.storyModel.getStory(storyId);
    return await story.approve().save();
  }
}
```

### pkgs/akanjs/service/base.service.ts

```ts
export class BaseService extends serve("base" as const, ({ env, signal }) => ({
  onCleanup: env(({ onCleanup }: { onCleanup?: () => Promise<void> }) => onCleanup),
  baseSignal: signal<Base>(),
})) {
  publishPing() {
    this.baseSignal.pubsubPing("ping");
  }
}
```

### apps/koyo/lib/story/

```ts
// story.document.ts
export class StoryFilter extends from(cnst.Story, (filter) => ({
  query: {
    bySearch: filter()
      .arg("text", String)
      .query((text, q) => q.search(text, { prefix: true })),
  },
  sort: {},
})) {}

// story.service.ts
const stories = await this.listBySearch(text, { sort: "relevance" });
const count = await this.countBySearch(text);
```

### apps/koyo/lib/user/user.service.ts

```ts
import type { GithubApp } from "@libs/util/srvkit";
import { serve } from "akanjs/service";

import { user } from "../__lib/lib.service";
import * as db from "../db";

export class UserService extends serve(
  db.user,
  ({ use }) => ({
    githubApp: use<GithubApp>(),
  }),
  ...user.services,
) {
  async authCallback(code: string, userId: string) {
    const { accessToken } = await this.githubApp.getAccessToken(code);
    const user = await this.getUser(userId);
    return await user.set({ githubInfo: { accessToken } }).save();
  }
}
```

### apps/koyo/lib/example/example.service.ts

```ts
import { PaymentApi } from "@apps/koyo/srvkit";
import type { EmailApi } from "@libs/util/srvkit";
import { Int } from "akanjs/base";
import { serve } from "akanjs/service";

import * as db from "../db";
import type { ModulesOptions } from "../option";
import type * as sig from "../sig";
import type * as srv from "../srv";

export class ExampleService extends serve(
  db.example,
  ({ service, use, signal, plug, env, memory }) => ({
    userService: service<srv.UserService>(),
    emailApi: use<EmailApi>(),
    exampleSignal: signal<sig.Example>(),
    paymentApi: plug(PaymentApi),
    hostname: env((options: ModulesOptions) => options.hostname),
    localCounter: memory(Int, { local: true, default: 0 }),
  }),
) {}
```

### libs/shared/lib/file/file.service.ts

```ts
import { IpfsApi, type StorageApi } from "@libs/util/srvkit";
import { serve } from "akanjs/service";

import * as db from "../db";

export class FileService extends serve(db.file, ({ use, plug }) => ({
  storageApi: use<StorageApi>(),
  ipfsApi: plug(IpfsApi),
})) {
  override async _postRemove(file: db.File) {
    await this.storageApi.deleteData(file.url);
    return file;
  }
  async getJsonFromUri<T = unknown>(uri: string) {
    return (await (await fetch(this.ipfsApi.getHttpsUri(uri))).json()) as T;
  }
}
```

### apps/koyo/lib/devProject/devProject.service.ts

```ts
export class DevProjectService extends serve(db.devProject, ({ service, env }) => ({
  userService: service<srv.UserService>(),
  dockerRegistry: env((options: ModulesOptions) => options.dockerRegistry),
})) {
  override async _preCreate(data: DataInputOf<db.DevProjectInput, db.DevProject>) {
    return { ...data, registry: this.dockerRegistry };
  }
}
```

### apps/koyo/lib/_runtime/runtime.service.ts

```ts
export class RuntimeService extends serve("runtime" as const, ({ memory }) => ({
  localCounter: memory(Int, { local: true, default: 3 }),
  remoteValue: memory(String),
  remoteMap: memory(Map, { of: String }),
})) {
  async updateRemoteValue(value: string) {
    await this.remoteValue.set(value);
    return await this.remoteValue.get();
  }
}
```

### apps/koyo/lib/story/story.service.ts

```ts
export class StoryService extends serve(db.story, ({ service }) => ({
  actionLogService: service<srv.ActionLogService>(),
})) {
  async like(target: string, user: string) {
    const prev = await this.actionLogService.set({ type: "story", target, user, action: "like" }, 1);
    return await this.storyModel.like(target, prev);
  }
}
```

### apps/koyo/lib/dbBackup/dbBackup.service.ts

```ts
export class DbBackupService extends serve(db.dbBackup, ({ service, signal }) => ({
  clusterService: service<srv.ClusterService>(),
  fileService: service<srv.shared.FileService>(),
  dbBackupSignal: signal<sig.DbBackup>(),
})) {
  async queueArchiveDbBackup(dbBackupId: string) {
    const dbBackup = await this.dbBackupModel.getDbBackup(dbBackupId);
    await dbBackup.set({ status: "preparing" }).save();
    await this.dbBackupSignal.archiveDbBackup(dbBackupId);
    return dbBackup;
  }

  async archiveDbBackup(dbBackupId: string) {
    const dbBackup = await this.dbBackupModel.getDbBackup(dbBackupId);
    const cluster = await this.clusterService.getCluster(dbBackup.devApp);
    // archive, upload, clean up, then mark the backup active
    return await dbBackup.set({ status: "active" }).save();
  }
}
```

### apps/koyo/lib/dbBackup/dbBackup.service.ts

```ts
import type { DataInputOf } from "akanjs/document";
import { serve } from "akanjs/service";

import * as db from "../db";
import { Err } from "../dict";
import type * as sig from "../sig";

export class DbBackupService extends serve(db.dbBackup, ({ signal }) => ({
  dbBackupSignal: signal<sig.DbBackup>(),
})) {
  override async _preCreate(data: DataInputOf<db.DbBackupInput, db.DbBackup>) {
    if (await this.dbBackupModel.workingBackupExists(data.devApp, data.branch))
      throw new Err("dbBackup.error.workingBackupExists");
    return data;
  }

  override async _postCreate(doc: db.DbBackup) {
    await this.dbBackupSignal.archiveDbBackup(doc.id);
    return doc;
  }
}
```

### apps/koyo/lib/dbBackup/dbBackup.dictionary.ts

```ts
.error({
  workingBackupExists: [
    "A backup is already running for this branch",
    "이 브랜치에서 이미 백업이 실행 중입니다.",
  ],
})
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Treat convention and generated-file rules as stronger than local style guesses.

