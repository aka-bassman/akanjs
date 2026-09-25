import { usePage } from "@apps/akan/client";
import { Code, cardGridRecipe, Divider, Docs, DocsToc, type IntroItem, panelRecipe } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();

  const chip = "mt-2 block overflow-x-auto whitespace-nowrap rounded-md bg-muted/60 px-2.5 py-1.5 font-mono text-xs";

  const termRows: IntroItem[] = [
    {
      name: "service module",
      desc: l.trans({
        en: "A module under `lib/_<name>/` that owns a workflow and no table.",
        ko: "`lib/_<name>/` 아래에서 테이블 없이 워크플로만 소유하는 모듈입니다.",
      }),
    },
    {
      name: "model service",
      desc: l.trans({
        en: "`lib/<model>/<model>.service.ts`, built on a table with `serve(db.<model>, …)`.",
        ko: "테이블 위에 `serve(db.<model>, …)`로 만든 `lib/<model>/<model>.service.ts`입니다.",
      }),
    },
    {
      name: "injection callback",
      desc: l.trans({
        en: "The function passed to `serve()` that returns the service's dependencies.",
        ko: "`serve()`에 넘기는 함수로, service의 의존성을 객체로 돌려줍니다.",
      }),
    },
    {
      name: ["federation", "batch"],
      desc: l.trans({
        en: "Process roles: federation serves requests, batch runs background work and serves none.",
        ko: "프로세스 역할입니다. federation은 요청을 받고, batch는 요청 없이 백그라운드 작업만 돌립니다.",
      }),
    },
  ];

  const patternRows: IntroItem[] = [
    {
      name: '"security" as const',
      desc: l.trans({
        en: "The registration key, pinned as a literal; a `securityService` field finds it by this name.",
        ko: "리터럴로 고정한 등록 키입니다. `securityService` 필드가 이 이름으로 이 service를 찾습니다.",
      }),
    },
    {
      name: "({ use }) => ({ … })",
      desc: l.trans({
        en: "The injection callback. Each key it returns becomes a field on `this`.",
        ko: "주입 콜백입니다. 돌려주는 키마다 `this`의 필드가 됩니다.",
      }),
    },
    {
      name: "readonly refreshTokenDays = 30",
      desc: l.trans({
        en: "A constant the rules refer to lives on the class as a `readonly` field, not at module scope.",
        ko: "규칙이 참조하는 상수는 모듈 스코프가 아니라 클래스의 `readonly` 필드에 둡니다.",
      }),
    },
    {
      name: "@libs/util/srvkit",
      desc: l.trans({
        en: "Every crypto primitive comes from here, never from `node:crypto` directly.",
        ko: "암호 함수는 전부 여기서 가져오고, `node:crypto`를 직접 쓰지 않습니다.",
      }),
    },
  ];

  const reachRows: IntroItem[] = [
    {
      name: "service<srv.XService>()",
      desc: l.trans({
        en: "Another module's service. The first choice when the work belongs to an existing module.",
        ko: "다른 모듈의 service입니다. 이미 있는 모듈의 일이라면 언제나 첫 번째 선택입니다.",
      }),
      example: "securityService: service<srv.util.SecurityService>()",
    },
    {
      name: ["plug(TheClass)", "plug(StorageAdaptorRole)"],
      desc: l.trans({
        en: "An `adapt()` singleton found by its own class or by a role, so nothing goes in `option.ts`.",
        ko: "클래스 자체나 role로 찾는 `adapt()` 싱글턴이라, `option.ts`에 등록할 것이 없습니다.",
      }),
      example: "corpus: plug(DocCorpus)",
    },
    {
      name: "use<T>()",
      desc: l.trans({
        en: "A legacy value registered in `lib/option.ts`; move it to `adapt()` only when you touch it anyway.",
        ko: "`lib/option.ts`에 등록된 레거시 값입니다. 어차피 손댈 때에만 `adapt()`로 옮깁니다.",
      }),
      example: "jwtSecret: use<string>()",
    },
  ];

  const otherRows: IntroItem[] = [
    {
      name: "memory(Map, { of: T })",
      desc: l.trans({
        en: "Per-service state that outlives one call, in Redis or sqlite; `T` is a scalar or a model class.",
        ko: "호출 한 번보다 오래 사는 service별 상태로, Redis나 sqlite에 저장됩니다. `T`는 scalar나 model 클래스입니다.",
      }),
      example: "grants: memory(Map, { of: cnst.OauthGrant })",
    },
    {
      name: "env(() => ...)",
      desc: l.trans({
        en: "A config value computed from the server environment once, when the service is injected.",
        ko: "service가 주입될 때 server 환경에서 한 번 계산하는 설정 값입니다.",
      }),
      example: 'masterPhones: env(() => process.env.MASTER_PHONES?.split(",") ?? [])',
    },
    {
      name: "signal<sig.X>()",
      desc: l.trans({
        en: "This module's own signal, so the service can publish to a pubsub room the signal declares.",
        ko: "이 모듈 자신의 signal입니다. signal이 선언한 pubsub room으로 service가 직접 발행합니다.",
      }),
      example: "minimalSignal: signal<sig.Minimal>()",
    },
  ];

  const namingNotes = [
    l.trans({
      en: (
        <>
          <strong>A service field ends in Service.</strong> The part before it names the target:{" "}
          <code>securityService</code> resolves to the <code>security</code> service.
        </>
      ),
      ko: (
        <>
          <strong>service 필드는 Service로 끝납니다.</strong> 그 앞부분이 대상을 가리킵니다.{" "}
          <code>securityService</code>는 <code>security</code> service로 연결됩니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>A signal field ends in Signal.</strong> <code>minimalSignal</code> is the <code>minimal</code>{" "}
          module's signal.
        </>
      ),
      ko: (
        <>
          <strong>signal 필드는 Signal로 끝납니다.</strong> <code>minimalSignal</code>은 <code>minimal</code> 모듈의
          signal입니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>A use field shares its name with the option key.</strong> <code>{"jwtSecret: use<string>()"}</code>{" "}
          reads the value <code>option.ts</code> registered as <code>jwtSecret</code>.
        </>
      ),
      ko: (
        <>
          <strong>use 필드는 option 키와 이름이 같습니다.</strong> <code>{"jwtSecret: use<string>()"}</code>는{" "}
          <code>option.ts</code>가 <code>jwtSecret</code>으로 등록한 값을 읽습니다.
        </>
      ),
    }),
  ];

  const memoryRows: IntroItem[] = [
    {
      name: "clients",
      desc: l.trans({
        en: "Client registrations; a registered client expires after `clientDays` (90) days.",
        ko: "client 등록입니다. 등록한 client는 `clientDays`(90)일 뒤 만료됩니다.",
      }),
    },
    {
      name: "requests",
      desc: l.trans({
        en: "Pending authorization requests, each gone `requestMinutes` (10) after it was created.",
        ko: "대기 중인 인가 요청입니다. 만들어지고 `requestMinutes`(10)분 뒤 사라집니다.",
      }),
    },
    {
      name: "grants",
      desc: l.trans({
        en: "Issued authorization codes, keyed by their hash and valid for `codeSeconds` (60) seconds.",
        ko: "발급된 인가 코드입니다. hash를 키로 쓰고 `codeSeconds`(60)초 동안 유효합니다.",
      }),
    },
    {
      name: "registrations",
      desc: l.trans({
        en: "Registrations per address, capped by `registrationsPerHour`; the count expires after an hour.",
        ko: "주소별 등록 횟수로, `registrationsPerHour`로 제한합니다. 횟수는 한 시간 뒤 만료됩니다.",
      }),
    },
    {
      name: "revokedSessions",
      desc: l.trans({
        en: "Revoked grant lineages, denied for as long as one of their access tokens could still be valid.",
        ko: "폐기된 grant 계보입니다. 그 계보의 access token이 아직 유효할 수 있는 동안 거부합니다.",
      }),
    },
  ];

  const methodKindRows: IntroItem[] = [
    {
      name: "public",
      desc: l.trans({ en: "The unit a signal calls.", ko: "signal이 호출하는 단위입니다." }),
    },
    {
      name: "private",
      desc: l.trans({
        en: "A step that two public methods share.",
        ko: "public 메서드 둘이 공유하는 단계입니다.",
      }),
    },
    {
      name: "private static",
      desc: l.trans({
        en: "A helper that touches no injected dependency, so it visibly cannot reach the database.",
        ko: "주입된 의존성을 건드리지 않는 헬퍼입니다. 데이터베이스에 닿을 수 없다는 것이 한눈에 보입니다.",
      }),
    },
  ];

  const outcomeColumns = [
    { key: "case", label: l.trans({ en: "Case", ko: "경우" }) },
    { key: "write", label: l.trans({ en: "Write", ko: "쓰는 것" }) },
    { key: "why", label: l.trans({ en: "Why", ko: "이유" }) },
  ];
  const outcomeRows = [
    {
      case: l.trans({ en: "A precondition is broken", ko: "전제 조건이 깨짐" }),
      write: '`throw new Err("oauth.error.notSignedIn", …)`',
      why: l.trans({
        en: "The dictionary translates the key; the third argument sets the status, which defaults to 400.",
        ko: "dictionary가 키를 번역합니다. 세 번째 인자가 status를 정하고, 기본값은 400입니다.",
      }),
    },
    {
      case: l.trans({ en: "The input names nothing", ko: "가리키는 대상이 없음" }),
      write: "`return false` · `return null`",
      why: l.trans({
        en: "An ordinary answer. The signal decides whether it is worth an error.",
        ko: "평범한 답입니다. error로 만들지는 signal이 정합니다.",
      }),
    },
  ];

  const methodNotes = [
    l.trans({
      en: (
        <>
          <strong>TypeScript private, not #private.</strong> A service file is one of the four suffixes where lint bans
          the <code>#</code> form, because one service can be mixed into another.
        </>
      ),
      ko: (
        <>
          <strong>#private이 아니라 TypeScript private입니다.</strong> service 파일은 lint가 <code>#</code> 형태를 막는
          네 가지 suffix 중 하나입니다. service는 다른 service에 mixin으로 합쳐질 수 있기 때문입니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>this.logger is provided.</strong> Never write <code>new Logger()</code> in a service, and never call{" "}
          <code>.log()</code>; the levels are <code>trace</code>, <code>verbose</code>, <code>debug</code>,{" "}
          <code>info</code>, <code>warn</code>, <code>error</code>.
        </>
      ),
      ko: (
        <>
          <strong>this.logger는 이미 있습니다.</strong> service에서 <code>new Logger()</code>를 만들지 말고,{" "}
          <code>.log()</code>도 호출하지 마세요. 레벨은 <code>trace</code>, <code>verbose</code>, <code>debug</code>,{" "}
          <code>info</code>, <code>warn</code>, <code>error</code>입니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>return await in tail position.</strong> When a method returns a promise's result, write it out as{" "}
          <code>decrypt()</code> and <code>readLocalFile()</code> on this page do, and do not "optimize" it away.
        </>
      ),
      ko: (
        <>
          <strong>마지막 줄은 return await입니다.</strong> promise의 결과를 돌려줄 때는 이 페이지의{" "}
          <code>decrypt()</code>, <code>readLocalFile()</code>처럼 명시적으로 쓰고, "최적화"한다며 지우지 마세요.
        </>
      ),
    }),
  ];

  const importColumns = [
    { key: "value", label: "import", code: true },
    { key: "type", label: "import type", code: true },
  ];
  const importGroups = [
    {
      label: l.trans({ en: "Server side", ko: "서버 쪽" }),
      rows: [
        {
          name: "akanjs/service · akanjs/base",
          desc: l.trans({
            en: "Framework facets, except client ones such as `akanjs/client`, `akanjs/ui` and `akanjs/store`.",
            ko: "프레임워크 facet입니다. `akanjs/client`, `akanjs/ui`, `akanjs/store` 같은 클라이언트 facet은 예외입니다.",
          }),
          marks: { value: true, type: true },
        },
        {
          name: "../dict · ../cnst · ../srv",
          desc: l.trans({
            en: "The module's generated barrels; a service imports `srv` as `import type * as srv`.",
            ko: "모듈의 생성된 barrel입니다. service는 `srv`를 `import type * as srv`로 가져옵니다.",
          }),
          marks: { value: true, type: true },
        },
        {
          name: "@libs/<lib>/srvkit",
          desc: l.trans({
            en: "Adapters and server helpers, where vendor code lives.",
            ko: "어댑터와 server 헬퍼입니다. vendor 코드는 여기 삽니다.",
          }),
          marks: { value: true, type: true },
        },
      ],
    },
    {
      label: l.trans({ en: "Client side: types only", ko: "클라이언트 쪽: 타입만" }),
      rows: [
        {
          name: "*.store · st · store · useClient",
          desc: l.trans({
            en: "Client state. Server code holds none.",
            ko: "클라이언트 상태입니다. 서버 코드는 갖지 않습니다.",
          }),
          marks: { value: false, type: true },
        },
        {
          name: "*.Template · Unit · Util · View · Zone",
          desc: l.trans({
            en: "Module components. Server code never renders JSX.",
            ko: "모듈 컴포넌트입니다. 서버 코드는 JSX를 그리지 않습니다.",
          }),
          marks: { value: false, type: true },
        },
        {
          name: "ui/ · webkit/ · */client",
          desc: l.trans({
            en: "Client entrypoints, including `@libs/<lib>/client` and `akanjs/client`.",
            ko: "`@libs/<lib>/client`와 `akanjs/client`를 포함한 클라이언트 진입점입니다.",
          }),
          marks: { value: false, type: true },
        },
      ],
    },
    {
      label: l.trans({ en: "Outside the workspace: never", ko: "워크스페이스 바깥: 금지" }),
      rows: [
        {
          name: <span className="font-sans">{l.trans({ en: "third-party package", ko: "서드파티 패키지" })}</span>,
          desc: l.trans({
            en: "Wrap it in a `srvkit/` adapter and reach it through `plug()` or an exported type.",
            ko: "`srvkit/` 어댑터로 감싸고 `plug()`나 export한 타입으로 닿습니다.",
          }),
          marks: { value: false, type: false },
        },
        {
          name: "node:*",
          desc: l.trans({
            en: "Built-ins count too: `node:crypto` goes through `@libs/util/srvkit`.",
            ko: "내장 모듈도 마찬가지입니다. `node:crypto`는 `@libs/util/srvkit`를 거칩니다.",
          }),
          marks: { value: false, type: false },
        },
      ],
    },
  ];

  const localFileRows: IntroItem[] = [
    {
      name: "localFile.service.ts",
      desc: l.trans({
        en: "Holds the one rule, that a path under `private/` is never served, and leaves the bytes alone.",
        ko: "`private/` 아래 경로는 절대 제공하지 않는다는 규칙 하나만 들고, 바이트에는 손대지 않습니다.",
      }),
    },
    {
      name: "localFile.signal.ts",
      desc: l.trans({
        en: "Turns the stream into a `Response` at a custom path; the next page covers it.",
        ko: "스트림을 커스텀 경로의 `Response`로 바꿉니다. 다음 문서에서 다룹니다.",
      }),
    },
    {
      name: "localFile.dictionary.ts",
      desc: l.trans({
        en: "Carries the error key the `throw` names, in English and Korean.",
        ko: "`throw`가 부르는 error 키를 영어와 한국어로 담습니다.",
      }),
    },
    {
      name: "localFile.abstract.md",
      desc: l.trans({
        en: "Lists the rule among the module's invariants.",
        ko: "이 규칙을 모듈의 불변식 중 하나로 적어 둡니다.",
      }),
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="service-file" title="service.service.ts">
        <Docs.Title>service.service.ts</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "The service file holds a service module's workflow: the rules its signal calls into. Open it whenever that workflow changes.",
              ko: "service 파일은 service module의 워크플로, 즉 signal이 호출하는 규칙을 담습니다. 그 워크플로가 바뀔 때마다 이 파일을 엽니다.",
            })}
          </div>
          <Docs.SubSubTitle>{l.trans({ en: "Words used on this page", ko: "이 페이지에서 쓰는 말" })}</Docs.SubSubTitle>
          <Docs.IntroTable type={l.trans({ en: "Term", ko: "용어" })} items={termRows} />
          <div>
            {l.trans({
              en: (
                <span>
                  Both kinds of service start with <code>serve()</code>. What differs is the first argument:
                </span>
              ),
              ko: (
                <span>
                  두 종류의 service 모두 <code>serve()</code>로 시작합니다. 다른 것은 첫 번째 인자입니다:
                </span>
              ),
            })}
          </div>
          <div className={cardGridRecipe({ cols: "mdTwo" }, "my-4")}>
            <div className={panelRecipe({ radius: "lg", padding: "sm" }, "min-w-0")}>
              <div className="font-semibold text-primary">{l.trans({ en: "Model Service", ko: "model service" })}</div>
              <code className={chip}>{"serve(db.ticket, ({ … }) => ({ … }))"}</code>
              <div className="mt-2 text-foreground/70 text-sm">
                {l.trans({
                  en: "Names its table and inherits a table's worth of generated methods.",
                  ko: "테이블을 이름으로 받고, 테이블 하나 분량의 생성된 메서드를 물려받습니다.",
                })}
              </div>
            </div>
            <div className={panelRecipe({ radius: "lg", padding: "sm" }, "min-w-0")}>
              <div className="font-semibold text-primary">
                {l.trans({ en: "Service Module", ko: "service module" })}
              </div>
              <code className={chip}>{'serve("security" as const, ({ … }) => ({ … }))'}</code>
              <div className="mt-2 text-foreground/70 text-sm">
                {l.trans({
                  en: "Has no table to name, so it opens with its own name and asks for everything else by hand.",
                  ko: "이름 붙일 테이블이 없어 자기 이름으로 시작하고, 그 밖에 필요한 것은 전부 직접 요청합니다.",
                })}
              </div>
            </div>
          </div>
          <div>
            {l.trans({
              en: "A real service module, cut down to four of its methods:",
              ko: "실제 service module 하나를 메서드 네 개만 남겨 옮기면 이렇습니다:",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="libs/util/lib/_security/security.service.ts"
            code={`import { aesDecrypt, aesEncrypt, createOpaqueToken, hashToken, jwtSign } from "@libs/util/srvkit"; // [!code highlight]
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
}`}
          />
          <div>
            {l.trans({
              en: "Four things in it are the pattern, not this module's details:",
              ko: "이 중 네 가지는 이 모듈의 사정이 아니라 패턴입니다:",
            })}
          </div>
          <Docs.IntroTable type={l.trans({ en: "Pattern", ko: "패턴" })} items={patternRows} />
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="injection" title={l.trans({ en: "Asking For What It Needs", ko: "필요한 것을 요청하기" })}>
        <Docs.Title>{l.trans({ en: "Asking For What It Needs", ko: "필요한 것을 요청하기" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "The injection callback is the service's dependency list. Pick each entry by where the value comes from.",
              ko: "주입 콜백은 service의 의존성 목록입니다. 값이 어디서 오는지를 보고 항목마다 주입기를 고릅니다.",
            })}
          </div>

          <Docs.SubSubTitle>
            {l.trans({ en: "Reaching other code: try in this order", ko: "다른 코드에 닿기: 이 순서대로" })}
          </Docs.SubSubTitle>
          <div>
            {l.trans({
              en: "Reaching further down this list than you had to is how a module ends up owning a connection that belongs to somebody else.",
              ko: "필요한 것보다 아래까지 내려가면, 남의 것이어야 할 연결을 이 모듈이 떠안게 됩니다.",
            })}
          </div>
          <Docs.IntroTable type={l.trans({ en: "Injector", ko: "주입기" })} items={reachRows} />

          <Docs.SubSubTitle>
            {l.trans({ en: "State, configuration and your own signal", ko: "상태, 설정, 자기 signal" })}
          </Docs.SubSubTitle>
          <Docs.IntroTable type={l.trans({ en: "Injector", ko: "주입기" })} items={otherRows} />
          <div>
            {l.trans({
              en: "The field name is part of the declaration:",
              ko: "필드 이름도 선언의 일부입니다:",
            })}
          </div>
          <ul className="my-4 list-disc space-y-2 pl-5">
            {namingNotes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>

          <Docs.SubSubTitle>
            {l.trans({ en: "An authorization server with no table", ko: "테이블 없는 인가 서버" })}
          </Docs.SubSubTitle>
          <div>
            {l.trans({
              en: "The OAuth module uses most of these at once, and stores nothing in a table:",
              ko: "OAuth 모듈은 이 주입기 대부분을 한꺼번에 쓰면서, 테이블에는 아무것도 저장하지 않습니다:",
            })}
          </div>
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
  readonly clientDays = 90;
  readonly registrationsPerHour = 20;

  override onInit() {
    RevokedSessions.use(async (sessionId) => !!(await this.revokedSessions.get(sessionId)));
  }
}`}
          />
          <div>
            {l.trans({
              en: "Five memory caches hold the whole authorization state:",
              ko: "memory 캐시 다섯 개가 인가 상태 전부를 담습니다:",
            })}
          </div>
          <Docs.IntroTable
            type={l.trans({ en: "Cache", ko: "캐시" })}
            descLabel={l.trans({ en: "What it holds", ko: "담는 것" })}
            items={memoryRows}
          />
          <ul className="my-4 list-disc space-y-2 pl-5">
            <li>
              {l.trans({
                en: (
                  <>
                    <strong>Every entry carries its own expiry.</strong> The workflow sets it with{" "}
                    <code>{"set(key, value, { expireAt })"}</code>, and each entry expires alone on Redis and sqlite
                    alike, so the caches clean up after themselves. A fixed lifetime could be declared once as{" "}
                    <code>ttl</code> instead.
                  </>
                ),
                ko: (
                  <>
                    <strong>항목마다 만료 시각이 따로 있습니다.</strong> 워크플로가{" "}
                    <code>{"set(key, value, { expireAt })"}</code>로 정하고, Redis든 sqlite든 항목이 하나씩 따로
                    만료되므로 캐시는 알아서 비워집니다. 수명이 늘 같다면 선언에 <code>ttl</code>로 한 번만 적어도
                    됩니다.
                  </>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <>
                    <strong>One-time setup goes in onInit().</strong> <code>override onInit()</code> runs once when the
                    service starts; never put setup work at module scope.
                  </>
                ),
                ko: (
                  <>
                    <strong>한 번만 할 준비는 onInit()에 둡니다.</strong> <code>override onInit()</code>은 service가
                    시작될 때 한 번 실행됩니다. 준비 작업을 모듈 스코프에 두지 마세요.
                  </>
                ),
              })}
            </li>
          </ul>
          <Docs.LinkGrid
            items={[
              {
                href: "/conventions/module/service#injection-types",
                title: l.trans({ en: "Injection Types In Depth", ko: "주입 종류 자세히" }),
                desc: l.trans({
                  en: "memory() options and the shape each declaration gives you.",
                  ko: "memory() 옵션과, 선언 방식마다 받게 되는 모양.",
                }),
              },
              {
                href: "/conventions/applib/srvkit#adaptor-plug",
                title: l.trans({ en: "Adaptor And plug", ko: "Adaptor와 plug" }),
                desc: l.trans({
                  en: "How to write the adapt() class a service plugs in.",
                  ko: "service가 plug하는 adapt() 클래스를 쓰는 법.",
                }),
              },
            ]}
          />
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="service-options" title={l.trans({ en: "The Options Argument", ko: "옵션 인자" })}>
        <Docs.Title>{l.trans({ en: "The Options Argument", ko: "옵션 인자" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  <code>serve()</code> takes an optional options object between the name and the injection callback. It
                  has two keys:
                </span>
              ),
              ko: (
                <span>
                  <code>serve()</code>는 이름과 주입 콜백 사이에 선택적인 옵션 객체를 받습니다. 키는 두 개입니다:
                </span>
              ),
            })}
          </div>
          <Docs.OptionTable
            items={[
              {
                key: "serverMode",
                type: '"batch" | "federation"',
                desc: l.trans({
                  en: "Loads the service only in processes of that role, and in an `all` process.",
                  ko: "그 역할의 프로세스와 `all` 프로세스에서만 service를 불러옵니다.",
                }),
              },
              {
                key: "enabled",
                type: "boolean | (() => boolean)",
                desc: l.trans({
                  en: "Turns the module on or off and wins over `serverMode`; a function runs once, on first read.",
                  ko: "모듈을 켜고 끄며 `serverMode`보다 우선합니다. 함수는 처음 읽을 때 한 번 실행됩니다.",
                }),
              },
            ]}
          />
          <div>
            {l.trans({
              en: "A library's or an app's root container is often this entire file:",
              ko: "라이브러리나 앱의 루트 컨테이너는 흔히 이 파일이 전부입니다:",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="libs/util/lib/_util/util.service.ts"
            code={`import { serve } from "akanjs/service";

export class UtilService extends serve("util" as const, { serverMode: "batch" }, () => ({})) {}`}
          />
          <ul className="my-4 list-disc space-y-2 pl-5">
            <li>
              {l.trans({
                en: (
                  <>
                    <strong>It is common.</strong> Of the eight service modules in this workspace, <code>util</code> and{" "}
                    <code>shared</code> are this file with only the name changed, and <code>akan</code> also adds an
                    unused destructure.
                  </>
                ),
                ko: (
                  <>
                    <strong>흔한 모양입니다.</strong> 이 워크스페이스의 service module 여덟 개 중 <code>util</code>과{" "}
                    <code>shared</code>는 이름만 바꾼 같은 파일이고, <code>akan</code>은 여기에 쓰지 않는 구조분해
                    하나만 더 있습니다.
                  </>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <>
                    <strong>A root container owns no workflow.</strong> It exists so the library has a service name to
                    hang an internal task or a store on.
                  </>
                ),
                ko: (
                  <>
                    <strong>루트 컨테이너는 워크플로를 소유하지 않습니다.</strong> 라이브러리가 internal task나 store를
                    걸어 둘 service 이름을 갖기 위해 존재합니다.
                  </>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <>
                    <strong>batch keeps it off the request servers,</strong> where it would only take up memory.
                  </>
                ),
                ko: (
                  <>
                    <strong>batch로 표시하면 request server에서 빠집니다.</strong> 거기서는 메모리만 차지할 뿐입니다.
                  </>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <>
                    <strong>The default deployment runs everything.</strong> <code>AKAN_REPLICA=0,0,1</code> is one{" "}
                    <code>all</code> process, so the split only matters once federation and batch replicas are separate.
                  </>
                ),
                ko: (
                  <>
                    <strong>기본 배포에서는 전부 뜹니다.</strong> <code>AKAN_REPLICA=0,0,1</code>은 <code>all</code>{" "}
                    프로세스 하나이므로, federation과 batch replica를 나눌 때에야 차이가 생깁니다.
                  </>
                ),
              })}
            </li>
          </ul>
          <Docs.Alert>
            {l.trans({
              en: (
                <span>
                  <strong>Declare serverMode together with the schedule that needs it.</strong> A <code>cron</code>{" "}
                  declared <code>{'{ serverMode: "batch" }'}</code> runs in the batch worker, and a service marked the
                  same way is loaded only there.
                </span>
              ),
              ko: (
                <span>
                  <strong>serverMode는 그것이 필요한 schedule과 함께 선언합니다.</strong>{" "}
                  <code>{'{ serverMode: "batch" }'}</code>로 선언한 <code>cron</code>은 batch worker에서 돌고, 같은
                  표시를 단 service는 그곳에만 적재됩니다.
                </span>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="method-shape" title={l.trans({ en: "What A Method Looks Like", ko: "메서드의 모양" })}>
        <Docs.Title>{l.trans({ en: "What A Method Looks Like", ko: "메서드의 모양" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Short, and it decides one thing. Anything that reads like a paragraph is two methods that have not been split yet.",
              ko: "짧고, 한 가지를 결정합니다. 한 문단처럼 읽힌다면 아직 쪼개지 않은 메서드 두 개입니다.",
            })}
          </div>
          <Docs.IntroTable type={l.trans({ en: "Kind", ko: "종류" })} items={methodKindRows} />
          <div>
            {l.trans({
              en: "One public method from the OAuth service, with two of the helpers it calls:",
              ko: "OAuth service의 public 메서드 하나와, 그 메서드가 부르는 헬퍼 중 둘입니다:",
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
  }

  private static subjectOf(account: SerAccount | null): Subject | null {
    const { self, me } = (account ?? {}) as SerAccount<{ self?: { id?: string }; me?: { id?: string } }>;
    if (self?.id) return { type: "user", id: self.id };
    if (me?.id) return { type: "admin", id: me.id };
    return null;
  }`}
          />
          <div>
            {l.trans({
              en: "It has one throw and two returns, and the difference between them is the rule:",
              ko: "throw 하나와 return 둘이 있고, 그 차이가 곧 규칙입니다:",
            })}
          </div>
          <Docs.Table columns={outcomeColumns} rows={outcomeRows} stacked />
          <ul className="my-4 list-disc space-y-2 pl-5">
            {methodNotes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>
          <Docs.Alert type="error">
            {l.trans({
              en: (
                <span>
                  <strong>Never throw a raw Error.</strong> Lint rejects <code>throw new Error</code> in a service, and
                  a bare <code>Error</code> reaches the caller as <code>Internal Server Error</code>. Register the key
                  in the module's dictionary and throw <code>Err</code> from <code>../dict</code>.
                </span>
              ),
              ko: (
                <span>
                  <strong>raw Error는 절대 던지지 않습니다.</strong> service의 <code>throw new Error</code>는 lint가
                  막고, 맨 <code>Error</code>는 호출자에게 <code>Internal Server Error</code>로 뭉개져 도착합니다. 키를
                  모듈의 dictionary에 등록하고 <code>../dict</code>의 <code>Err</code>를 던지세요.
                </span>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="boundaries" title={l.trans({ en: "What Stays Out", ko: "들어오지 않는 것" })}>
        <Docs.Title>{l.trans({ en: "What Stays Out", ko: "들어오지 않는 것" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A service file is a server file, and the boundary sits at the import statement rather than at the call site. Lint checks every import against this table:",
              ko: "service 파일은 server 파일이고, 그 경계는 호출 지점이 아니라 import 문에 있습니다. lint는 모든 import를 이 표에 비춰 봅니다:",
            })}
          </div>
          <Docs.Matrix
            type={l.trans({ en: "Import from", ko: "import 대상" })}
            columns={importColumns}
            groups={importGroups}
            markLabel={l.trans({ en: "Allowed", ko: "허용" })}
            emptyLabel={l.trans({ en: "Lint error", ko: "lint 오류" })}
          />
          <div>
            {l.trans({
              en: (
                <span>
                  The vendor import lives in <code>srvkit/</code>, once, where a single file can be swapped. Two modules
                  show the two ways to reach it:
                </span>
              ),
              ko: (
                <span>
                  vendor import는 <code>srvkit/</code>에 한 번만 있고, 그래서 파일 하나만 바꾸면 교체됩니다. 두 모듈이
                  그곳에 닿는 두 가지 방법을 보여 줍니다:
                </span>
              ),
            })}
          </div>
          <div className={cardGridRecipe({ cols: "mdTwo" }, "my-4")}>
            <div className={panelRecipe({ radius: "lg", padding: "sm" }, "min-w-0")}>
              <div className="font-semibold text-primary">localFile.service.ts</div>
              <code className={chip}>{"blobStorageApi: use<BlobStorageApi>()"}</code>
              <div className="mt-2 text-foreground/70 text-sm">
                {l.trans({
                  en: (
                    <span>
                      Reaches blob storage through a type from <code>@libs/util/srvkit</code>.
                    </span>
                  ),
                  ko: (
                    <span>
                      <code>@libs/util/srvkit</code>의 타입을 통해 blob storage에 닿습니다.
                    </span>
                  ),
                })}
              </div>
            </div>
            <div className={panelRecipe({ radius: "lg", padding: "sm" }, "min-w-0")}>
              <div className="font-semibold text-primary">doc.service.ts</div>
              <code className={chip}>corpus: plug(DocCorpus)</code>
              <div className="mt-2 text-foreground/70 text-sm">
                {l.trans({
                  en: "Reaches the filesystem through the adapter it plugs in.",
                  ko: "plug한 어댑터를 통해 파일시스템에 닿습니다.",
                })}
              </div>
            </div>
          </div>
          <div>
            {l.trans({
              en: "The first one in full:",
              ko: "첫 번째 파일의 전문입니다:",
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
          <div>
            {l.trans({
              en: "The whole module is four files, and each holds one part of the rule:",
              ko: "모듈 전체는 파일 네 개이고, 각 파일이 규칙의 한 부분씩을 맡습니다:",
            })}
          </div>
          <Docs.IntroTable type={l.trans({ en: "File", ko: "파일" })} items={localFileRows} />
        </Docs.Description>
      </Scroll.Slide>
      <DocsToc />
    </Scroll>
  );
});
