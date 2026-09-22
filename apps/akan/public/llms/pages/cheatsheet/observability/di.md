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
- Legacy: Register With use (#use)
- Read Environment (#env)
- One Key, One Owner (#duplicate)
- Tips (#tips)

## Content

Dependency Injection

Dependency injection means a service receives what it needs instead of creating everything by itself. This keeps business code small and makes external systems easier to replace.

Reach for them in this order. The first that fits is the right one:

`service` connects one service to another service's business method.

`adapt` and `plug` are for replaceable tools such as storage, cache, or message APIs.

`use` reaches a legacy singleton registered in `option.ts`. Recognise it; do not write new ones.

`env` reads runtime configuration without passing it through every function.

Inject Services

Use `service()` when one service needs another service's business method. This is clearer than importing and creating the other service yourself.

Service to service

Adapt And Plug

Use an adaptor when a tool has behavior and can be replaced later. The service only asks for the role it needs.

Declare adaptor

Plug adaptor into service

Legacy: Register With use

`AkanOption.use()` registers a plain singleton that services then reach with `use<T>()`. It still works and older code is full of it, so learn to recognise it — but write new singletons as `adapt()` classes, which self-register and need no `option.ts` entry at all.

Never register an `adapt()` class in `option.ts`. It self-registers, and `plug(Class)` uses the class itself as the token — a second registration under the same key fails the boot.

Option registers values

Service receives values

Read Environment

`env()` is useful when the service needs runtime identity such as app name, operation mode, hostname, or a feature flag.

Environment value

One Key, One Owner

A `use` key and an adaptor `refName` may be claimed once. Claiming either twice is last-write-wins everywhere downstream: the second registration replaces the first, and the replaced adaptor's `onInit` never runs. Akan refuses the boot instead, naming both claimants.

Boot fails with both owners named

The check is per key, not per registration. One adaptor class reached from two services is one adaptor and passes; two different classes under the same name do not. Fix it by renaming one of them, or by declaring it once in a lib both sides plug.

Tips

Do not create external clients inside every method. Declare one `adapt()` class and `plug()` it.

Use `service()` for business collaboration, and `plug()` for replaceable infrastructure.

Keep secrets in env/options and inject prepared clients, not raw credentials, when possible.

`adapt()` is for singletons only. A per-use value object stays a plain class you `new` at the call site.

## Code Examples

### Code

```ts
export class ArticleService extends serve(db.article, ({ service }) => ({
  fileService: service<srv.FileService>(),
  notificationService: service<srv.NotificationService>(),
})) {
  async publish(articleId: string) {
    const article = await this.articleModel.update(articleId, { status: "published" });
    await this.notificationService.notify("articlePublished", article.id);
    return article;
  }
}
```

### Code

```ts
export class ImageStorage extends adapt("imageStorage" as const, ({ env }) => ({
  bucket: env((env: AppEnv) => env.imageBucket),
})) {
  async upload(file: File) {
    return await uploadToBucket(this.bucket, file);
  }
}
```

### Code

```ts
export class ArticleService extends serve(db.article, ({ plug }) => ({
  imageStorage: plug(ImageStorage),
})) {
  async setCover(articleId: string, file: File) {
    const url = await this.imageStorage.upload(file);
    return await this.articleModel.update(articleId, { cover: url });
  }
}
```

### Code

```ts
export const option = new AkanOption<AppEnv>().use((env) => ({
  mailApi: env.mail ? new MailApi(env.mail) : null,
  storageApi: env.storage ? new CloudStorage(env.storage) : new LocalStorage(),
  appHost: env.operationMode === "local" ? "localhost" : env.hostname,
}));
```

### Code

```ts
export class ArticleService extends serve(db.article, ({ use }) => ({
  mailApi: use<MailApi>(),
  storageApi: use<StorageApi>(),
  appHost: use<string>(),
})) {
  async sendPublishedMail(articleId: string) {
    await this.mailApi.send(`${this.appHost}/article/${articleId}`);
  }
}
```

### Code

```ts
export class ArticleService extends serve(db.article, ({ env }) => ({
  publicUrl: env((env: AppEnv) =>
    env.operationMode === "local" ? "http://localhost:8282" : `https://${env.hostname}`,
  ),
})) {
  getShareUrl(articleId: string) {
    return `${this.publicUrl}/article/${articleId}`;
  }
}
```

### Code

```bash
[DI:use] 1 duplicate registration(s):
  • "storageApi" is registered by lib "util" and by lib "shared"
[DI:adaptor] 1 duplicate registration(s):
  • "imageStorage" is registered by service "article" and by service "gallery"
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Use this page as a task recipe, then verify with the relevant lint, test, or build command.

