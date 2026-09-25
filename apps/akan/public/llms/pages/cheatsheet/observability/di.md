# Dependency Injection

- Source: /cheatsheet/observability/di
- Mirror: /llms/pages/cheatsheet/observability/di.md
- Section: cheatsheet
- Category: Observability
- Priority: P2

## Headings

- Dependency Injection (#overview)
- Inject Services (#service)
- Adapt And Plug (#adaptor)
- Read Environment (#env)
- Tips (#tips)

## Content

Dependency Injection

injector

A helper like `service()` or `plug()` inside `serve()` or `adapt()`. Each one fills one field.

A class built with `adapt()` that wraps one outside tool, such as storage or a mail API.

A slot for a built-in adaptor, such as `StorageAdaptorRole`. The app decides what fills it.

One instance per server process, shared by everything that injects it.

The object in `env/env.server.<environment>.ts`, typed by `ModulesOptions` in `lib/option.ts`.

Pick in this order: the first that fits wins

Another service's business method.

A replaceable tool such as storage, a cache or a message API.

A legacy singleton registered in `option.ts`. Recognise it; do not write new ones.

Runtime configuration, read without passing it through every function.

For one specific job

A small value that survives between calls.

A server signal, to publish an event or queue a job. The field name ends in `Signal`.

Role

Default

Used for

Documents and queries

`memory()` values and the document cache

Uploaded files, on local disk by default

Background jobs queued by signals

Cron and interval jobs

Writing log lines by level

Pubsub rooms for websocket clients

Encoding a typed value to bytes and back

LLM calls from the in-page agent relay

What you need

Read it with

A server env field: hostname, a feature flag, an API option

App identity: appName, environment, operationMode

A container variable or a secret

Injection Types

Every injector with its naming rules, in the service convention.

Adaptor And plug

Where adaptors live in `srvkit/` and how they are shaped.

Service Memory

`memory()` values that survive between calls.

Chat Flow

A service that publishes through an injected `signal()`.

Words used on this page

Term

Which injector to use

Reach for them in this order; the first that fits is the right one. The marks show where each works.

Injector

Available

Not available

Inject Services

Adapt And Plug

Use an adaptor for a tool that has behavior of its own and may be replaced later. The service asks for the class or the role; it never builds the client.

1. Declare it in srvkit/

2. Plug it into a service

3. Swap a built-in role

Read Environment

Add a setting of your own

Steps 1 and 2 take a few lines each:

Step 3 reads it next to the app's identity:

Tips

Read next

## Code Examples

### apps/koyo/lib/article/article.service.ts

```ts
import { serve } from "akanjs/service";

import * as db from "../db";
import type * as srv from "../srv";

export class ArticleService extends serve(db.article, ({ service }) => ({
  fileService: service<srv.shared.FileService>(),
  subscriptionService: service<srv.SubscriptionService>(),
})) {
  async publish(articleId: string) {
    const article = await this.updateArticle(articleId, { status: "published" });
    await this.subscriptionService.notifySubscribers(article.id);
    return article;
  }
  async getCoverUrl(articleId: string) {
    const { cover } = await this.getArticle(articleId);
    const file = cover ? await this.fileService.getFile(cover) : null;
    return file?.url ?? null;
  }
}
```

### apps/koyo/srvkit/imageStorage.ts

```ts
import { getEnv } from "akanjs/base";
import { adapt, StorageAdaptorRole } from "akanjs/service";

export class ImageStorage extends adapt("imageStorage" as const, ({ env, plug }) => ({
  folder: env(() => `images/${getEnv().environment}`),
  storage: plug(StorageAdaptorRole),
})) {
  async upload(localPath: string, filename: string) {
    const path = `${this.folder}/${filename}`;
    return await this.storage.uploadDataFromLocal({ path, localPath });
  }
}
```

### apps/koyo/lib/article/article.service.ts

```ts
import { ImageStorage } from "@apps/koyo/srvkit";
import { serve } from "akanjs/service";

import * as db from "../db";

export class ArticleService extends serve(db.article, ({ plug }) => ({
  imageStorage: plug(ImageStorage),
})) {
  async setCover(articleId: string, localPath: string) {
    const filename = `${articleId}.webp`;
    const coverUrl = await this.imageStorage.upload(localPath, filename);
    return await this.updateArticle(articleId, { coverUrl });
  }
}
```

### apps/koyo/lib/option.ts

```ts
import { R2Storage } from "@apps/koyo/srvkit";
import { AkanOption } from "akanjs/server";
import { StorageAdaptorRole } from "akanjs/service";

export const option = new AkanOption<ModulesOptions>()
  .applyAdaptor(StorageAdaptorRole, R2Storage);
```

### apps/koyo/lib/option.ts · apps/koyo/env/env.server.local.ts

```ts
// lib/option.ts
export type ModulesOptions = LibOptions & {
  shareEnabled?: boolean;
};

// env/env.server.local.ts
export const env: ModulesOptions = {
  ...libEnv,
  shareEnabled: true,
};
```

### apps/koyo/lib/article/article.service.ts

```ts
import { getEnv } from "akanjs/base";
import { serve } from "akanjs/service";

import * as db from "../db";
import type { ModulesOptions } from "../option";

export class ArticleService extends serve(db.article, ({ env }) => ({
  publicUrl: env((options: ModulesOptions) => {
    const isLocal = getEnv().operationMode === "local";
    return isLocal ? "http://localhost:8282" : `https://${options.hostname}`;
  }),
  isShareEnabled: env((options: ModulesOptions) => !!options.shareEnabled),
})) {
  getShareUrl(articleId: string) {
    if (!this.isShareEnabled) return null;
    return `${this.publicUrl}/article/${articleId}`;
  }
}
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Use this page as a task recipe, then verify with the relevant lint, test, or build command.

