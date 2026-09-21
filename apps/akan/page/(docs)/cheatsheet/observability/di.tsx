import { usePage } from "@apps/akan/client";
import { Code, Divider, Docs, DocsList, DocsToc } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();

  return (
    <Scroll>
      <Scroll.Slide id="overview" title={l.trans({ en: "Dependency Injection", ko: "의존성 주입" })}>
        <Docs.Title>{l.trans({ en: "Dependency Injection", ko: "의존성 주입" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Dependency injection means a service receives what it needs instead of creating everything by itself. This keeps business code small and makes external systems easier to replace.",
              ko: "의존성 주입은 service가 필요한 것을 직접 만들지 않고 받아서 쓰는 방식입니다. 이렇게 하면 비즈니스 코드는 작아지고, 외부 시스템도 쉽게 교체할 수 있습니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "Reach for them in this order. The first that fits is the right one:",
              ko: "다음 순서로 고르세요. 먼저 맞는 것이 맞는 답입니다:",
            })}
          </div>
          <DocsList>
            <li>
              {l.trans({
                en: "`service` connects one service to another service's business method.",
                ko: "`service`는 한 service를 다른 service의 업무 method에 연결합니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "`adapt` and `plug` are for replaceable tools such as storage, cache, or message APIs.",
                ko: "`adapt`와 `plug`는 storage, cache, message API처럼 교체 가능한 도구에 사용합니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "`use` reaches a legacy singleton registered in `option.ts`. Recognise it; do not write new ones.",
                ko: "`use`는 `option.ts`에 등록된 legacy singleton을 가져옵니다. 알아보기만 하고, 새로 쓰지는 마세요.",
              })}
            </li>
            <li>
              {l.trans({
                en: "`env` reads runtime configuration without passing it through every function.",
                ko: "`env`는 런타임 설정을 모든 함수에 넘기지 않고 읽게 해줍니다.",
              })}
            </li>
          </DocsList>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="service" title={l.trans({ en: "Inject Services", ko: "Service 주입" })}>
        <Docs.Title>{l.trans({ en: "Inject Services", ko: "Service 주입" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Use `service()` when one service needs another service's business method. This is clearer than importing and creating the other service yourself.",
              ko: "한 service가 다른 service의 업무 method가 필요할 때 `service()`를 사용합니다. 직접 import해서 생성하는 것보다 흐름이 명확합니다.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title={l.trans({ en: "Service to service", ko: "Service끼리 연결" })}
          code={`export class ArticleService extends serve(db.article, ({ service }) => ({
  fileService: service<srv.FileService>(),
  notificationService: service<srv.NotificationService>(),
})) {
  async publish(articleId: string) {
    const article = await this.articleModel.update(articleId, { status: "published" });
    await this.notificationService.notify("articlePublished", article.id);
    return article;
  }
}`}
        />
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="adaptor" title={l.trans({ en: "Adapt And Plug", ko: "adapt와 plug" })}>
        <Docs.Title>{l.trans({ en: "Adapt And Plug", ko: "adapt와 plug" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Use an adaptor when a tool has behavior and can be replaced later. The service only asks for the role it needs.",
              ko: "도구가 동작을 가지고 있고 나중에 교체될 수 있다면 adaptor를 사용하세요. Service는 필요한 역할만 요청하면 됩니다.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title={l.trans({ en: "Declare adaptor", ko: "Adaptor 선언" })}
          code={`export class ImageStorage extends adapt("imageStorage" as const, ({ env }) => ({
  bucket: env((env: AppEnv) => env.imageBucket),
})) {
  async upload(file: File) {
    return await uploadToBucket(this.bucket, file);
  }
}`}
        />
        <Code.Snippet
          className="w-full"
          title={l.trans({ en: "Plug adaptor into service", ko: "Service에 plug하기" })}
          code={`export class ArticleService extends serve(db.article, ({ plug }) => ({
  imageStorage: plug(ImageStorage),
})) {
  async setCover(articleId: string, file: File) {
    const url = await this.imageStorage.upload(file);
    return await this.articleModel.update(articleId, { cover: url });
  }
}`}
        />
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="use" title={l.trans({ en: "Legacy: Register With use", ko: "Legacy: use로 등록하기" })}>
        <Docs.Title>{l.trans({ en: "Legacy: Register With use", ko: "Legacy: use로 등록하기" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "`AkanOption.use()` registers a plain singleton that services then reach with `use<T>()`. It still works and older code is full of it, so learn to recognise it — but write new singletons as `adapt()` classes, which self-register and need no `option.ts` entry at all.",
              ko: "`AkanOption.use()`는 평범한 singleton을 등록하고, service는 `use<T>()`로 가져옵니다. 지금도 동작하고 오래된 코드에 많이 남아 있으니 알아볼 수는 있어야 합니다. 다만 새 singleton은 `adapt()` class로 쓰세요. 스스로 등록하므로 `option.ts` 항목이 필요 없습니다.",
            })}
          </div>
        </Docs.Description>
        <Docs.Alert type="warning">
          {l.trans({
            en: "Never register an `adapt()` class in `option.ts`. It self-registers, and `plug(Class)` uses the class itself as the token — a second registration under the same key fails the boot.",
            ko: "`adapt()` class는 `option.ts`에 등록하지 마세요. 스스로 등록하고 `plug(Class)`가 class 자체를 token으로 쓰므로, 같은 key로 한 번 더 등록하면 부팅이 실패합니다.",
          })}
        </Docs.Alert>
        <Code.Snippet
          className="w-full"
          title={l.trans({ en: "Option registers values", ko: "Option에서 값 등록" })}
          code={`export const option = new AkanOption<AppEnv>().use((env) => ({
  mailApi: env.mail ? new MailApi(env.mail) : null,
  storageApi: env.storage ? new CloudStorage(env.storage) : new LocalStorage(),
  appHost: env.operationMode === "local" ? "localhost" : env.hostname,
}));`}
        />
        <Code.Snippet
          className="w-full"
          title={l.trans({ en: "Service receives values", ko: "Service에서 값 받기" })}
          code={`export class ArticleService extends serve(db.article, ({ use }) => ({
  mailApi: use<MailApi>(),
  storageApi: use<StorageApi>(),
  appHost: use<string>(),
})) {
  async sendPublishedMail(articleId: string) {
    await this.mailApi.send(\`\${this.appHost}/article/\${articleId}\`);
  }
}`}
        />
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="env" title={l.trans({ en: "Read Environment", ko: "환경값 읽기" })}>
        <Docs.Title>{l.trans({ en: "Read Environment", ko: "환경값 읽기" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "`env()` is useful when the service needs runtime identity such as app name, operation mode, hostname, or a feature flag.",
              ko: "`env()`는 service가 app name, operation mode, hostname, feature flag 같은 런타임 정보를 알아야 할 때 유용합니다.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title={l.trans({ en: "Environment value", ko: "환경값 사용" })}
          code={`export class ArticleService extends serve(db.article, ({ env }) => ({
  publicUrl: env((env: AppEnv) =>
    env.operationMode === "local" ? "http://localhost:8282" : \`https://\${env.hostname}\`,
  ),
})) {
  getShareUrl(articleId: string) {
    return \`\${this.publicUrl}/article/\${articleId}\`;
  }
}`}
        />
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="duplicate" title={l.trans({ en: "One Key, One Owner", ko: "키는 하나의 주인만" })}>
        <Docs.Title>{l.trans({ en: "One Key, One Owner", ko: "키는 하나의 주인만" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A `use` key and an adaptor `refName` may be claimed once. Claiming either twice is last-write-wins everywhere downstream: the second registration replaces the first, and the replaced adaptor's `onInit` never runs. Akan refuses the boot instead, naming both claimants.",
              ko: "`use` 키와 adaptor `refName`은 한 번만 등록할 수 있습니다. 두 번 등록하면 뒤에 온 것이 앞의 것을 덮어쓰고, 밀려난 adaptor의 `onInit`은 실행되지 않습니다. Akan은 그런 상태로 뜨는 대신 부팅을 실패시키고 두 등록자를 모두 알려줍니다.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title={l.trans({ en: "Boot fails with both owners named", ko: "두 등록자를 표시하며 부팅 실패" })}
          language="bash"
          code={`[DI:use] 1 duplicate registration(s):
  • "storageApi" is registered by lib "util" and by lib "shared"
[DI:adaptor] 1 duplicate registration(s):
  • "imageStorage" is registered by service "article" and by service "gallery"`}
        />
        <Docs.Description>
          <div>
            {l.trans({
              en: "The check is per key, not per registration. One adaptor class reached from two services is one adaptor and passes; two different classes under the same name do not. Fix it by renaming one of them, or by declaring it once in a lib both sides plug.",
              ko: "검사 기준은 등록 횟수가 아니라 키입니다. 같은 adaptor class를 두 service가 plug하는 것은 하나의 adaptor이므로 통과하고, 이름만 같은 서로 다른 class는 통과하지 못합니다. 둘 중 하나의 이름을 바꾸거나, 양쪽이 함께 plug할 수 있도록 lib에 한 번만 선언하세요.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="tips" title={l.trans({ en: "Tips", ko: "꿀팁" })}>
        <Docs.Title>{l.trans({ en: "Tips", ko: "꿀팁" })}</Docs.Title>
        <Docs.Description>
          <DocsList>
            <li>
              {l.trans({
                en: "Do not create external clients inside every method. Declare one `adapt()` class and `plug()` it.",
                ko: "외부 client를 method마다 만들지 마세요. `adapt()` class로 한 번 선언하고 `plug()`로 받으세요.",
              })}
            </li>
            <li>
              {l.trans({
                en: "Use `service()` for business collaboration, and `plug()` for replaceable infrastructure.",
                ko: "업무 협력은 `service()`, 교체 가능한 인프라는 `plug()`를 사용하세요.",
              })}
            </li>
            <li>
              {l.trans({
                en: "Keep secrets in env/options and inject prepared clients, not raw credentials, when possible.",
                ko: "가능하면 secret은 env/options에 두고 raw credential보다 준비된 client를 주입하세요.",
              })}
            </li>
            <li>
              {l.trans({
                en: "`adapt()` is for singletons only. A per-use value object stays a plain class you `new` at the call site.",
                ko: "`adapt()`는 singleton 전용입니다. 호출마다 새로 만드는 값 객체는 호출 지점에서 `new` 하는 평범한 class로 두세요.",
              })}
            </li>
          </DocsList>
        </Docs.Description>
      </Scroll.Slide>
      <DocsToc />
    </Scroll>
  );
});
