import { usePage } from "@apps/akan/client";
import { Code, Divider, Docs, DocsToc, type IntroItem, panelRecipe } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();

  const injectors: IntroItem[] = [
    {
      name: "service<srv.XService>()",
      desc: l.trans({
        en: "Another module's service. First choice whenever the work belongs to a module that already exists — oauth reaches user, admin and security this way rather than repeating any of them.",
        ko: "다른 module의 service입니다. 이미 존재하는 module의 일이라면 언제나 첫 번째 선택입니다. oauth는 user, admin, security를 이 방법으로 불러 쓰고 어느 것도 다시 구현하지 않습니다.",
      }),
      example: "securityService: service<srv.util.SecurityService>()",
    },
    {
      name: "plug(TheClass)",
      desc: l.trans({
        en: "An adapt() singleton from srvkit/. The class itself is the token, so nothing is registered in option.ts. This is the shape a new adapter is written in.",
        ko: "srvkit/의 adapt() singleton입니다. class 자체가 token이므로 option.ts에 등록할 것이 없습니다. 새 adapter를 쓸 때의 형태입니다.",
      }),
      example: "corpus: plug(DocCorpus)",
    },
    {
      name: "memory(Map, { of: T })",
      desc: l.trans({
        en: "A cache the runtime backs with Redis or sqlite. T is a scalar or model class, not only a primitive: the value serializes through the constant and travels as JSON text, so the same declaration round-trips either backend.",
        ko: "runtime이 Redis나 sqlite로 받쳐 주는 캐시입니다. T는 primitive만이 아니라 scalar나 model class여도 됩니다. 값은 constant를 통해 직렬화되어 JSON 텍스트로 이동하므로 같은 선언이 어느 backend에서도 왕복합니다.",
      }),
      example: "grants: memory(Map, { of: cnst.OauthGrant })",
    },
    {
      name: "use<T>()",
      desc: l.trans({
        en: "A legacy singleton registered in lib/option.ts. Recognise it, do not reach for it first — migrate one to adapt() only when you are already changing it.",
        ko: "lib/option.ts에 등록된 legacy singleton입니다. 알아보되 먼저 집지는 마세요. 어차피 손대야 할 때에만 adapt()로 옮깁니다.",
      }),
      example: "jwtSecret: use<string>()",
    },
    {
      name: "signal<sig.X>()",
      desc: l.trans({
        en: "This module's own signal, so the service can publish to a pubsub room it declared. The field name ends in Signal; the injector strips the suffix to find the registration.",
        ko: "이 module 자신의 signal입니다. 선언해 둔 pubsub room으로 service가 직접 발행할 수 있게 합니다. field 이름은 Signal로 끝나고, injector가 그 suffix를 떼어 등록을 찾습니다.",
      }),
      example: "minimalSignal: signal<sig.Minimal>()",
    },
    {
      name: "env(() => ...)",
      desc: l.trans({
        en: "A value derived from the server environment at injection time. Use it for configuration, never for a secret resolved at module scope.",
        ko: "주입 시점에 server 환경에서 끌어낸 값입니다. 설정에 쓰고, module scope에서 해석되는 secret에는 쓰지 않습니다.",
      }),
      example: "environment: env(() => getEnv().environment)",
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="service-file" title="service.service.ts">
        <Docs.Title>service.service.ts</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A model service opens with serve(db.ticket, ...) and inherits a table's worth of generated methods. A service module has no table to name, so it opens with its own name as a string literal instead — and everything the workflow needs has to be asked for by hand.",
              ko: "model service는 serve(db.ticket, ...)으로 시작해서 테이블 하나 분량의 생성된 method를 물려받습니다. service module에는 이름 붙일 테이블이 없으니, 대신 자기 이름을 문자열 리터럴로 적으며 시작합니다. 그리고 workflow에 필요한 것은 전부 직접 요청해야 합니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="libs/util/lib/_security/security.service.ts"
            code={`import { aesDecrypt, aesEncrypt, createOpaqueToken, hashToken, jwtSign } from "@libs/util/srvkit";
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
}`}
          />
          <div>
            {l.trans({
              en: 'Four things there are the pattern rather than this module\'s details: the "as const" that pins the registration key, the injection callback returning an object of declared dependencies, the readonly field holding a constant the rules refer to, and every crypto primitive coming from @libs/util/srvkit instead of node:crypto.',
              ko: '그 안의 네 가지는 이 module의 사정이 아니라 패턴입니다. 등록 key를 고정하는 "as const", 선언한 의존성을 객체로 돌려주는 주입 callback, 규칙이 참조하는 상수를 담은 readonly field, 그리고 node:crypto가 아니라 @libs/util/srvkit에서 오는 모든 암호 primitive입니다.',
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="injection" title={l.trans({ en: "Asking For What It Needs", ko: "필요한 것을 요청하기" })}>
        <Docs.Title>{l.trans({ en: "Asking For What It Needs", ko: "필요한 것을 요청하기" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "The injection callback is the service's dependency list, and the order below is the order to try. Reaching further down the list than you had to is how a module ends up owning a connection that belongs to somebody else.",
              ko: "주입 callback은 service의 의존성 목록이고, 아래 순서가 시도해 볼 순서입니다. 필요한 것보다 아래까지 내려가면, 남의 것이어야 할 연결을 이 module이 소유하게 됩니다.",
            })}
          </div>
          <Docs.IntroTable type={l.trans({ en: "Injector", ko: "주입기" })} items={injectors} />
          <Code.Snippet
            className="w-full"
            title="libs/shared/lib/_oauth/oauth.service.ts"
            code={`export class OauthService extends serve("oauth" as const, ({ use, service, memory }) => ({
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
}`}
          />
          <div>
            {l.trans({
              en: "An entire authorization server, and it stores nothing in a table. The five memory caches hold client registrations, pending requests, issued codes, a per-address registration counter and the revoked-lineage denylist, each keyed by an expiry the workflow sets. Setup work that has to run once goes in override async onInit(), never at module scope.",
              ko: "인가 서버 하나 전체인데 테이블에는 아무것도 저장하지 않습니다. memory 캐시 다섯 개가 client 등록, 대기 중인 request, 발급된 code, 주소별 등록 횟수, 폐기된 계보 denylist를 담고, 각각 workflow가 정한 만료 시각을 key로 씁니다. 한 번만 돌아야 하는 준비 작업은 module scope가 아니라 override async onInit()에 둡니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="service-options" title={l.trans({ en: "The Options Argument", ko: "옵션 인자" })}>
        <Docs.Title>{l.trans({ en: "The Options Argument", ko: "옵션 인자" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "serve() takes an optional options object between the name and the injection callback. It carries two keys: serverMode, which is batch or federation, and enabled, which is a boolean or a function returning one.",
              ko: "serve()는 이름과 주입 callback 사이에 선택적인 옵션 객체를 받습니다. key는 둘입니다. batch 또는 federation인 serverMode, 그리고 boolean이거나 boolean을 돌려주는 함수인 enabled입니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="libs/util/lib/_util/util.service.ts"
            code={`import { serve } from "akanjs/service";

export class UtilService extends serve("util" as const, { serverMode: "batch" }, () => ({})) {}`}
          />
          <div>
            {l.trans({
              en: "That is the file in full, and two of the eight service modules in this workspace are this file to the character — a third differs only by an unused destructure. A library's or an app's root container owns no workflow — it exists so the library has a service name to hang an internal task or a store on — and marking it batch keeps it out of the request servers where it would only take up memory.",
              ko: "그 파일의 전문이고, 이 워크스페이스의 service module 여덟 중 둘이 글자 하나까지 이 파일입니다. 셋째는 쓰이지 않는 구조분해 하나만 다릅니다. 라이브러리나 앱의 루트 컨테이너는 workflow를 소유하지 않습니다. 라이브러리가 internal task나 store를 걸어 둘 service 이름을 갖기 위해 존재합니다. batch로 표시해 두면 메모리만 차지할 request server에서 빠집니다.",
            })}
          </div>
          <Docs.Alert>
            {l.trans({
              en: (
                <span>
                  <code>serverMode</code> pairs with the schedule entries in the signal file. A <code>cron</code>{" "}
                  declared <code>{'{ serverMode: "batch" }'}</code> runs in the batch worker, and a service marked the
                  same way is loaded there — which is why the two are usually declared together rather than one at a
                  time.
                </span>
              ),
              ko: (
                <span>
                  <code>serverMode</code>는 signal 파일의 schedule 항목과 짝을 이룹니다.{" "}
                  <code>{'{ serverMode: "batch" }'}</code>로 선언한 <code>cron</code>은 batch worker에서 돌고, 같은
                  표시를 단 service가 그곳에 적재됩니다. 그래서 둘은 보통 따로가 아니라 함께 선언됩니다.
                </span>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="method-shape" title={l.trans({ en: "What A Method Looks Like", ko: "Method의 모양" })}>
        <Docs.Title>{l.trans({ en: "What A Method Looks Like", ko: "Method의 모양" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Short, and it decides one thing. A public method is the unit a signal calls; a private one is a step two public methods share. Anything that reads like a paragraph is two methods that have not been split yet.",
              ko: "짧고, 한 가지를 결정합니다. public method는 signal이 호출하는 단위이고, private method는 public method 둘이 공유하는 단계입니다. 한 문단처럼 읽히는 것은 아직 쪼개지 않은 두 개의 method입니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="libs/shared/lib/_oauth/oauth.service.ts"
            code={`  async revokeConnection(sessionId: string, account: SerAccount | null): Promise<boolean> {
    const subject = OauthService.subjectOf(account);
    if (!subject) throw new Err("oauth.error.notSignedIn", undefined, { statusCode: 401 });
    const sessions = await listRefreshSessions(this.cacheOf(subject.type), subject.type, subject.id);
    const lineage = sessions.find((session) => session.id === sessionId && session.clientId);
    if (!lineage) return false;
    await this.revokeLineage(lineage);
    this.logger.info(\`\${subject.type}:\${subject.id} disconnected OAuth client \${lineage.clientId}\`);
    return true;
  }

  private cacheOf(subject: RefreshSession["subject"]) {
    return subject === "user" ? this.userService.userModel.userCache : this.adminService.adminModel.adminCache;
  }`}
          />
          <div>
            {l.trans({
              en: "Two returns and one throw, and the difference between them is the rule. A caller who is not signed in has broken a precondition, so that is an Err the dictionary translates. A session id that names nothing is an ordinary answer — false — and the signal decides whether that is worth an error. Never throw a raw Error; the lint rule refuses it, and a bare Error is generalized to Internal Server Error on the way out.",
              ko: "return 둘과 throw 하나가 있고, 그 차이가 규칙입니다. 로그인하지 않은 호출자는 전제 조건을 깬 것이므로 dictionary가 번역하는 Err입니다. 아무것도 가리키지 않는 session id는 평범한 답 false이고, 그것이 error가 될 만한지는 signal이 정합니다. raw Error는 절대 던지지 않습니다. lint 규칙이 거부하고, 맨 Error는 나가는 길에 Internal Server Error로 뭉개집니다.",
            })}
          </div>
          <div className="my-4 space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-primary">🔒</span>
              <div>
                <strong>
                  {l.trans({ en: "TypeScript private, not #private", ko: "#private이 아니라 TypeScript private" })}
                </strong>
                :{" "}
                {l.trans({
                  en: "a service file is one of exactly four suffixes where the # form is lint-banned, because the framework mixes into these classes",
                  ko: "service 파일은 # 형태가 lint로 금지된 정확히 네 개의 suffix 중 하나입니다. framework가 이 class들에 mixin하기 때문입니다",
                })}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary">📝</span>
              <div>
                <strong>this.logger</strong>:{" "}
                {l.trans({
                  en: "injected, never constructed. Do not write new Logger() in a service, and never call .log() — the ladder is trace verbose debug info warn error",
                  ko: "주입되며 직접 만들지 않습니다. service에서 new Logger()를 쓰지 말고, .log()는 절대 호출하지 마세요. 사다리는 trace verbose debug info warn error입니다",
                })}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary">🧊</span>
              <div>
                <strong>static</strong>:{" "}
                {l.trans({
                  en: "a helper that touches no injected dependency is static, which is also how you can tell at a glance that it cannot reach the database",
                  ko: "주입된 의존성을 건드리지 않는 helper는 static입니다. 그것이 데이터베이스에 닿을 수 없다는 사실을 한눈에 알려주기도 합니다",
                })}
              </div>
            </div>
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="boundaries" title={l.trans({ en: "What Stays Out", ko: "들어오지 않는 것" })}>
        <Docs.Title>{l.trans({ en: "What Stays Out", ko: "들어오지 않는 것" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A service file is a server file, and the lint rules hold that boundary at the import statement rather than at the call site — by the time the call runs, the module is already bundled. It may not import a store, a module component, ui/, webkit/, or a package client entrypoint.",
              ko: "service 파일은 server 파일이고, lint 규칙은 그 경계를 호출 지점이 아니라 import 문에서 지킵니다. 호출이 실행될 즈음이면 module은 이미 번들에 들어가 있습니다. store, module component, ui/, webkit/, package client entrypoint를 import할 수 없습니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "It also may not import a third-party package directly. localFile.service.ts reaches blob storage through a type from @libs/util/srvkit, and doc.service.ts reaches the filesystem through an adapter it plugs in — the vendor import lives in srvkit/, once, where a single file can be swapped.",
              ko: "third-party 패키지도 직접 import할 수 없습니다. localFile.service.ts는 @libs/util/srvkit의 type을 통해 blob storage에 닿고, doc.service.ts는 plug한 adapter를 통해 파일시스템에 닿습니다. vendor import는 srvkit/에 한 번만 있고, 그래서 파일 하나만 바꾸면 교체됩니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="libs/util/lib/_localFile/localFile.service.ts"
            code={`import type { BlobStorageApi } from "@libs/util/srvkit";
import { serve } from "akanjs/service";

import { Err } from "../dict";

export class LocalFileService extends serve("localFile" as const, ({ use }) => ({
  blobStorageApi: use<BlobStorageApi>(),
})) {
  async readLocalFile(path: string) {
    if (path.startsWith("private/")) throw new Err("localFile.error.privateFilesNotServed");
    return await this.blobStorageApi.readData(path);
  }
}`}
          />
          <div className={panelRecipe({ radius: "lg" }, "my-4")}>
            <div className="mb-2 font-semibold text-primary">
              {l.trans({ en: "The whole module, in three files:", ko: "module 전체, 세 파일로:" })}
            </div>
            <ul className="list-disc space-y-1 pl-5 text-foreground/70 text-sm">
              <li>
                {l.trans({
                  en: "The service holds the one rule that matters — a path under private/ is never served — and does nothing else to the bytes.",
                  ko: "service는 중요한 규칙 하나만 들고 있습니다. private/ 아래 경로는 절대 제공하지 않는다는 것입니다. 바이트에는 그 밖의 어떤 일도 하지 않습니다.",
                })}
              </li>
              <li>
                {l.trans({
                  en: "The signal turns the stream into a Response at a custom path, which is the next page.",
                  ko: "signal은 그 stream을 custom path에서 Response로 바꿉니다. 다음 문서의 내용입니다.",
                })}
              </li>
              <li>
                {l.trans({
                  en: "The dictionary carries the error key the throw names, and the abstract carries the sentence saying why the rule exists.",
                  ko: "dictionary는 throw가 이름으로 부른 error key를 담고, abstract는 그 규칙이 왜 있는지 말하는 문장을 담습니다.",
                })}
              </li>
            </ul>
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <DocsToc />
    </Scroll>
  );
});
