import { usePage } from "@apps/akan/client";
import { Code, cardGridRecipe, Divider, Docs, DocsToc, type IntroItem, panelRecipe } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();

  const chip = "mt-2 block overflow-x-auto whitespace-nowrap rounded-md bg-muted/60 px-2.5 py-1.5 font-mono text-xs";
  const bulletList = "my-4 list-disc space-y-2 pl-5";

  const glanceCards = [
    {
      title: l.trans({ en: "Where It Lives", ko: "위치" }),
      desc: l.trans({
        en: (
          <span>
            In <code>lib/_&lt;service&gt;</code>, with a leading underscore. The files inside drop it.
          </span>
        ),
        ko: (
          <span>
            앞에 밑줄(_)을 붙인 <code>lib/_&lt;service&gt;</code>에 둡니다. 안의 파일 이름에서는 밑줄을 뗍니다.
          </span>
        ),
      }),
      code: "libs/util/lib/_security/security.service.ts",
    },
    {
      title: l.trans({ en: "What It Owns", ko: "맡는 일" }),
      desc: l.trans({
        en: "An action or a capability instead of a table. Nothing to list, edit, or keep until tomorrow.",
        ko: "테이블이 아니라 동작이나 기능을 맡습니다. 나열하거나 고치거나 내일까지 남겨 둘 데이터가 없습니다.",
      }),
      code: "sign · encrypt · stream · authorize",
    },
    {
      title: l.trans({ en: "What It Leaves Out", ko: "없는 것" }),
      desc: l.trans({
        en: "No document file, no filters, no slices, no generated CRUD: there is no table behind it.",
        ko: "document 파일, filter, slice, 생성된 CRUD가 없습니다. 뒤에 테이블이 없기 때문입니다.",
      }),
      code: "no *.document.ts · no slice()",
    },
    {
      title: l.trans({ en: "How It Is Called", ko: "호출 경로" }),
      desc: l.trans({
        en: "The same path a model module uses, minus the document layer.",
        ko: "model module과 같은 경로에서 document 계층만 빠집니다.",
      }),
      code: "fetch → signal → service → srvkit/",
    },
  ];

  const realModules: IntroItem[] = [
    {
      name: "_security",
      desc: l.trans({
        en: "JWT signing and verification, AES encryption, refresh-token minting. Server-only: no store, no UI.",
        ko: "JWT 서명과 검증, AES 암복호화, refresh token 발급을 맡습니다. 서버 전용이라 store도 UI도 없습니다.",
      }),
      example: "libs/util/lib/_security",
    },
    {
      name: "_oauth",
      desc: l.trans({
        en: "The OAuth 2.1 authorization server that issues the tokens `/mcp` accepts.",
        ko: "`/mcp`가 받아 주는 OAuth 2.1 토큰을 발급하는 인가 서버입니다.",
      }),
      example: "libs/shared/lib/_oauth",
    },
    {
      name: "_doc",
      desc: l.trans({
        en: "Serves the Akan.js docs to agents over MCP. It reads a generated folder and writes nothing.",
        ko: "Akan.js 문서를 MCP로 에이전트에게 제공합니다. 생성된 폴더를 읽기만 하고 아무것도 쓰지 않습니다.",
      }),
      example: "apps/akan/lib/_doc",
    },
    {
      name: "_localFile",
      desc: l.trans({
        en: "Streams a public blob back as an HTTP `Response` from a custom path. Four files, one endpoint.",
        ko: "지정한 경로로 들어온 요청에 공개 blob을 HTTP `Response`로 스트리밍합니다. 파일 네 개, endpoint 하나입니다.",
      }),
      example: "libs/util/lib/_localFile",
    },
    {
      name: ["_util", "_shared"],
      desc: l.trans({
        en: "A library's root container: an empty batch service and a client store other modules share.",
        ko: "라이브러리의 루트 컨테이너입니다. 빈 batch service와, 여러 module이 함께 쓰는 client store를 둡니다.",
      }),
      example: "libs/util/lib/_util\nlibs/shared/lib/_shared",
    },
    {
      name: ["_akan", "_minimal"],
      desc: l.trans({
        en: "An app's root container. `_akan` is still the empty scaffold; `_minimal` adds four bench endpoints.",
        ko: "앱의 루트 컨테이너입니다. `_akan`은 아직 빈 스캐폴드이고, `_minimal`은 벤치마크 endpoint 네 개를 더했습니다.",
      }),
      example: "apps/akan/lib/_akan\napps/minimal/lib/_minimal",
    },
  ];

  const optionalColumns = [
    { key: "store", label: "store", code: true, caption: "*.store.ts" },
    { key: "test", label: "test", code: true, caption: "*.test.ts" },
    { key: "util", label: "Util", code: true, caption: "*.Util.tsx" },
    { key: "zone", label: "Zone", code: true, caption: "*.Zone.tsx" },
  ];
  const withTest = { store: false, test: true, util: false, zone: false };
  const withStore = { store: true, test: false, util: false, zone: false };
  const emptyStoreNote = l.trans({ en: "The store is the empty scaffold.", ko: "store는 빈 스캐폴드입니다." });
  const optionalGroups = [
    {
      label: l.trans({ en: "Feature modules", ko: "기능 module" }),
      rows: [
        { name: "_security", marks: withTest },
        { name: "_oauth", marks: withTest },
        {
          name: "_doc",
          desc: l.trans({
            en: "Tests its service: `doc.service.test.ts`.",
            ko: "service를 직접 테스트합니다: `doc.service.test.ts`.",
          }),
          marks: withTest,
        },
        { name: "_localFile", marks: { store: false, test: false, util: false, zone: false } },
      ],
    },
    {
      label: l.trans({ en: "Root containers", ko: "루트 컨테이너" }),
      rows: [
        { name: "_util", marks: withStore },
        { name: "_shared", marks: withStore },
        { name: "_akan", desc: emptyStoreNote, marks: withStore },
        { name: "_minimal", desc: emptyStoreNote, marks: withStore },
      ],
    },
  ];

  const poles = [
    {
      name: "_security",
      title: l.trans({ en: "The Floor", ko: "바닥" }),
      desc: l.trans({
        en: "Its service holds two secrets and hands back signed or encrypted strings. Nothing on screen renders it, so there is no store and no component.",
        ko: "service는 secret 두 개를 들고 서명하거나 암호화한 문자열을 돌려줄 뿐입니다. 화면에 그려지는 것이 없으니 store도 component도 없습니다.",
      }),
      files: [
        { file: "abstract.md", note: l.trans({ en: "What it owns, and four rules", ko: "맡는 일과 규칙 네 개" }) },
        { file: "dictionary.ts", note: l.trans({ en: "Endpoint labels", ko: "endpoint label" }) },
        {
          file: "service.ts",
          note: l.trans({ en: "About 75 lines holding two secrets", ko: "secret 두 개를 쥔 75줄 남짓" }),
        },
        {
          file: "signal.ts",
          note: l.trans({
            en: (
              <span>
                One mutation, <code>encrypt</code>
              </span>
            ),
            ko: (
              <span>
                mutation 하나, <code>encrypt</code>
              </span>
            ),
          }),
        },
        { file: "signal.test.ts", note: l.trans({ en: "Boots the barrel and calls it", ko: "barrel을 부팅해 호출" }) },
      ],
    },
    {
      name: "_oauth",
      title: l.trans({ en: "The Ceiling", ko: "천장" }),
      desc: l.trans({
        en: (
          <span>
            A whole authorization server, and still no store: every screen it needs is a route in{" "}
            <code>libs/shared/page/oauth</code>, not a section of another screen.
          </span>
        ),
        ko: (
          <span>
            인가 서버 하나 전체인데도 store가 없습니다. 필요한 화면은 다른 화면의 한 구획이 아니라{" "}
            <code>libs/shared/page/oauth</code>의 route이기 때문입니다.
          </span>
        ),
      }),
      files: [
        {
          file: "abstract.md",
          note: l.trans({ en: "Eight rules and a workflow chain", ko: "규칙 여덟 개와 workflow 체인" }),
        },
        {
          file: "dictionary.ts",
          note: l.trans({
            en: (
              <span>
                Labels in <code>.endpoint()</code>, error keys in <code>.error()</code>, consent-page phrases in{" "}
                <code>.translate()</code>
              </span>
            ),
            ko: (
              <span>
                <code>.endpoint()</code>에 label, <code>.error()</code>에 error key, <code>.translate()</code>에 동의
                화면 문구
              </span>
            ),
          }),
        },
        {
          file: "service.ts",
          note: l.trans({
            en: "About 500 lines: PKCE, rotation, revocation",
            ko: "500줄 남짓: PKCE, 토큰 교체, 폐기",
          }),
        },
        {
          file: "signal.ts",
          note: l.trans({
            en: "10 endpoints, 5 of them at the origin root",
            ko: "endpoint 10개, 그중 5개는 origin 루트 경로",
          }),
        },
        {
          file: "signal.test.ts",
          note: l.trans({ en: "The protocol, end to end", ko: "프로토콜 전체를 처음부터 끝까지" }),
        },
      ],
    },
  ];

  const alwaysFiles: IntroItem[] = [
    {
      name: "<service>.abstract.md",
      desc: l.trans({
        en: "A title, one sentence on what it owns, and `## Rules`: invariants the code cannot show.",
        ko: "제목, 무엇을 맡는지 한 문장, 그리고 코드로는 보이지 않는 불변식을 적은 `## Rules`입니다.",
      }),
      example: "libs/shared/lib/_oauth/oauth.abstract.md",
    },
    {
      name: "<service>.dictionary.ts",
      desc: l.trans({
        en: "Built with `serviceDictionary`: endpoint labels, error keys and UI phrases.",
        ko: "`serviceDictionary`로 만듭니다. endpoint label, error key, UI 문구를 담습니다.",
      }),
      example: "libs/shared/lib/_oauth/oauth.dictionary.ts",
    },
    {
      name: "<service>.service.ts",
      desc: l.trans({
        en: "The workflow itself, built with `serve()` naming the module, even when the body is empty.",
        ko: "workflow 본체입니다. module 이름을 넘긴 `serve()`로 만들고, 본문이 비어 있어도 둡니다.",
      }),
      example: `export class SecurityService extends serve("security" as const, ({ use }) => ({
  jwtSecret: use<string>(),
  aeskey: use<string>(),
})) {}`,
    },
    {
      name: "<service>.signal.ts",
      desc: l.trans({
        en: "Two classes, `<X>Internal` and `<X>Endpoint`. No Slice, because there is no table to page through.",
        ko: "`<X>Internal`과 `<X>Endpoint` 두 class입니다. 넘겨 볼 테이블이 없으니 Slice는 없습니다.",
      }),
      example: "libs/util/lib/_security/security.signal.ts",
    },
  ];

  const optionalFiles: IntroItem[] = [
    {
      name: "<service>.store.ts",
      desc: l.trans({
        en: "Only when the feature has client state. Four of the eight have one; two are empty scaffolds.",
        ko: "client state가 있을 때만 씁니다. 여덟 중 넷에 있고, 그중 둘은 빈 스캐폴드입니다.",
      }),
      example: "libs/util/lib/_util/util.store.ts",
    },
    {
      name: "<service>.signal.test.ts",
      desc: l.trans({
        en: "Boots the barrel and calls the endpoints through `fetch`. `_security` and `_oauth` have one.",
        ko: "barrel 전체를 부팅하고 `fetch`로 endpoint를 호출합니다. `_security`와 `_oauth`에 있습니다.",
      }),
      example: "libs/shared/lib/_oauth/oauth.signal.test.ts",
    },
    {
      name: ["<Service>.Util.tsx", "<Service>.Zone.tsx"],
      desc: l.trans({
        en: "Rare: none of the eight has one. The two UI pages of this section explain why.",
        ko: "드뭅니다. 여덟 중 하나도 없습니다. 이유는 이 섹션의 UI 문서 두 개에 있습니다.",
      }),
    },
  ];

  const emptyForms: IntroItem[] = [
    {
      name: "signal.ts",
      desc: l.trans({
        en: "The builder callback returns an empty object, not nothing.",
        ko: "builder callback은 아무것도 반환하지 않는 것이 아니라 빈 객체를 반환합니다.",
      }),
      example: "export class XInternal extends internal(srv.x, () => ({})) {}",
    },
    {
      name: "service.ts",
      desc: l.trans({
        en: "A root container with no methods still declares its service.",
        ko: "method가 없는 루트 컨테이너도 service는 선언합니다.",
      }),
      example: 'export class UtilService extends serve("util" as const, { serverMode: "batch" }, () => ({})) {}',
    },
    {
      name: "store.ts",
      desc: l.trans({
        en: "Exactly two comments, `// state` and `// action`, mark where each half goes.",
        ko: "`// state`와 `// action` 주석 두 줄만 있고, 각 절반이 들어갈 자리를 표시합니다.",
      }),
      example: `export class AkanStore extends store("akan" as const, () => ({
  // state
})) {
  // action
}`,
    },
  ];

  const moduleKinds = [
    {
      title: l.trans({ en: "Model Module", ko: "Model module" }),
      folder: "lib/<model>",
      desc: l.trans({
        en: "A stored table with a document file, filters, slices, generated CRUD and the five UI roles.",
        ko: "document 파일, filter, slice, 생성된 CRUD, 다섯 가지 UI 역할을 갖춘 저장 테이블입니다.",
      }),
      examples: "user · file · banner · notification",
    },
    {
      title: l.trans({ en: "Service Module", ko: "Service module" }),
      folder: "lib/_<service>",
      desc: l.trans({
        en: "No table, no document file, no slice. An action, a protocol, an integration, or a library's own root.",
        ko: "테이블도 document 파일도 slice도 없습니다. 동작, 프로토콜, 연동, 또는 라이브러리 자신의 루트입니다.",
      }),
      examples: "security · oauth · localFile · doc",
    },
    {
      title: l.trans({ en: "Scalar Module", ko: "Scalar module" }),
      folder: "lib/__scalar/<scalar>",
      desc: l.trans({
        en: "A value embedded in something else and never stored on its own. A service module's state takes this shape.",
        ko: "다른 것 안에 들어가고 혼자서는 저장되지 않는 값입니다. service module의 상태는 이 모양으로 담깁니다.",
      }),
      examples: "oauthClient · oauthGrant · oauthRequest",
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="service-module" title={l.trans({ en: "Service Module Overview", ko: "Service module 개요" })}>
        <Docs.Title>{l.trans({ en: "Service Module Overview", ko: "Service module 개요" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Signing a token, streaming a stored file back to a browser, running an OAuth handshake to its end: none of these is a record. A folder built around a stored model would give you five files to leave empty and one to fill.",
              ko: "토큰 서명, 저장된 파일을 브라우저로 돌려보내기, OAuth 핸드셰이크를 끝까지 진행하기는 모두 레코드가 아닙니다. 저장된 model 중심의 폴더를 쓰면 비워 둘 파일 다섯 개와 채울 파일 하나가 생길 뿐입니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "A service module is that folder without the model.",
              ko: "service module은 그 폴더에서 model을 뺀 것입니다.",
            })}
          </div>
          <div className={cardGridRecipe({ cols: "mdTwo" }, "my-4")}>
            {glanceCards.map((card) => (
              <div key={card.code} className={panelRecipe({ radius: "lg", padding: "sm" }, "min-w-0")}>
                <div className="font-semibold text-primary">{card.title}</div>
                <div className="mt-1 text-foreground/70 text-sm">{card.desc}</div>
                <code className={chip}>{card.code}</code>
              </div>
            ))}
          </div>
          <div>
            {l.trans({
              en: (
                <span>
                  Here is one call through a service module, using <code>_oauth</code> as the example:
                </span>
              ),
              ko: (
                <span>
                  <code>_oauth</code>를 예로 들면, service module을 지나는 호출 하나는 이렇습니다:
                </span>
              ),
            })}
          </div>
          <Docs.Flow
            title={l.trans({ en: "One call through a service module", ko: "Service module을 지나는 호출 하나" })}
            direction="TB"
            nodes={{
              screen: { label: l.trans({ en: "A page, a store, an MCP client", ko: "페이지, store, MCP client" }) },
              runtime: {
                label: l.trans({ en: "The runtime itself", ko: "런타임 자체" }),
                lines: ["cron · process · initialize"],
              },
              signal: { label: "oauth.signal.ts", lines: ["endpoint · internal"] },
              service: { label: "oauth.service.ts", lines: [l.trans({ en: "the workflow", ko: "workflow" })] },
              other: {
                label: l.trans({ en: "Another module's service", ko: "다른 module의 service" }),
                lines: ["service<srv.UserService>()"],
              },
              srvkit: {
                label: l.trans({ en: "An adapter in srvkit/", ko: "srvkit/의 adapter" }),
                lines: ["plug() · use()"],
              },
              external: { label: l.trans({ en: "The outside world", ko: "외부 시스템" }), tone: "muted" },
            }}
            edges={[
              ["screen", "signal", { label: "fetch.listOAuthConnections()" }],
              ["runtime", "signal"],
              ["signal", "service"],
              ["service", "other"],
              ["service", "srvkit"],
              ["srvkit", "external"],
            ]}
            emphasis={["service"]}
          />
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Two ways in.</strong> A caller reaches an <code>Endpoint</code> through <code>fetch</code>,
                    and the runtime fires an <code>Internal</code> on a schedule, a queue job, or startup.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>들어오는 길은 둘입니다.</strong> 호출자는 <code>fetch</code>로 <code>Endpoint</code>를
                    부르고, 런타임은 스케줄, 큐 작업, 시작 시점에 <code>Internal</code>을 실행합니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>The service does the work.</strong> It asks another module through{" "}
                    <code>service&lt;srv.X&gt;()</code> and the outside world through a <code>srvkit/</code> adapter.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>일은 service가 합니다.</strong> 다른 module은 <code>service&lt;srv.X&gt;()</code>로, 외부
                    시스템은 <code>srvkit/</code>의 adapter로 부릅니다.
                  </span>
                ),
              })}
            </li>
          </ul>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="real-modules" title={l.trans({ en: "The Eight That Exist", ko: "지금 있는 여덟 개" })}>
        <Docs.Title>{l.trans({ en: "The Eight That Exist", ko: "지금 있는 여덟 개" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "This workspace has eight service modules, and reading them is faster than reading a description. They range from a server-only primitive to a whole authorization server, plus the empty root container each app and lib carries.",
              ko: "이 워크스페이스에는 service module이 여덟 개 있고, 설명을 읽기보다 실물을 보는 편이 빠릅니다. 서버 전용 primitive부터 인가 서버 하나 전체까지 있고, 앱과 라이브러리마다 빈 루트 컨테이너가 하나씩 있습니다.",
            })}
          </div>
          <Docs.IntroTable type={l.trans({ en: "Module", ko: "모듈" })} items={realModules} />
          <div>
            {l.trans({
              en: "Only four files are in every one of them. Here is which of the eight carry the optional ones:",
              ko: "여덟 개 모두에 있는 파일은 네 개뿐입니다. 선택 파일을 가진 module은 다음과 같습니다:",
            })}
          </div>
          <Docs.Matrix
            type={l.trans({ en: "Module", ko: "모듈" })}
            columns={optionalColumns}
            groups={optionalGroups}
            markLabel={l.trans({ en: "Has the file", ko: "파일 있음" })}
            emptyLabel={l.trans({ en: "No file", ko: "파일 없음" })}
          />
          <div>
            {l.trans({
              en: (
                <span>
                  <strong>Not one of the eight has a Util or a Zone.</strong> That is not an accident of this workspace;
                  the two UI pages explain why the files are rare and what goes there instead.
                </span>
              ),
              ko: (
                <span>
                  <strong>여덟 개 중 Util이나 Zone을 가진 것은 하나도 없습니다.</strong> 이 워크스페이스만의 우연이
                  아닙니다. 왜 드문지, 대신 무엇을 쓰는지는 UI 문서 두 개에 있습니다.
                </span>
              ),
            })}
          </div>
          <Docs.LinkGrid
            items={[
              {
                href: "/conventions/service/util",
                title: "Service.Util.tsx",
                desc: l.trans({
                  en: "Why the control usually belongs in ui/ or the page instead.",
                  ko: "버튼 같은 컨트롤이 보통 ui/나 page에 놓이는 이유를 다룹니다.",
                }),
              },
              {
                href: "/conventions/service/zone",
                title: "Service.Zone.tsx",
                desc: l.trans({
                  en: "When a capability earns a section of its own, and when it is just a page.",
                  ko: "기능에 별도 구획이 필요한 때와, page 하나로 충분한 때를 다룹니다.",
                }),
              },
            ]}
          />
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="two-poles" title={l.trans({ en: "The Two Poles", ko: "양 끝" })}>
        <Docs.Title>{l.trans({ en: "The Two Poles", ko: "양 끝" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  Put a small feature module, <code>_security</code>, beside the largest, <code>_oauth</code>: both have
                  the same five kinds of file. What changes is how much each file holds:
                </span>
              ),
              ko: (
                <span>
                  작은 기능 module인 <code>_security</code>와 가장 큰 <code>_oauth</code>를 나란히 놓으면 파일 종류는
                  똑같이 다섯입니다. 다른 것은 각 파일이 담는 양입니다:
                </span>
              ),
            })}
          </div>
          <div className={cardGridRecipe({ cols: "mdTwo" }, "my-4")}>
            {poles.map((pole) => (
              <div key={pole.name} className={panelRecipe({ radius: "lg", padding: "sm" }, "min-w-0")}>
                <div className="font-semibold text-primary">
                  <code>{pole.name}</code> · {pole.title}
                </div>
                <div className="mt-1 text-foreground/70 text-sm">{pole.desc}</div>
                <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1.5 border-border/60 border-t pt-3 text-sm">
                  {pole.files.flatMap(({ file, note }) => [
                    <dt key={`${file}-name`} className="font-mono text-foreground text-xs leading-5">
                      {file}
                    </dt>,
                    <dd key={`${file}-note`} className="text-foreground/70">
                      {note}
                    </dd>,
                  ])}
                </dl>
              </div>
            ))}
          </div>
          <Docs.Alert>
            {l.trans({
              en: (
                <span>
                  <strong>A service module with state does not grow a table for it.</strong> <code>_oauth</code> keeps
                  every client, request and grant in <code>memory(Map, &#123; of: cnst.OauthGrant &#125;)</code> caches,
                  and each shape is a scalar under <code>libs/shared/lib/__scalar/</code>. A scalar travels as JSON
                  text, so the same declaration round-trips through the Redis and sqlite caches unchanged.
                </span>
              ),
              ko: (
                <span>
                  <strong>상태가 있는 service module이라도 테이블을 만들지 않습니다.</strong> <code>_oauth</code>는
                  client, request, grant를 모두 <code>memory(Map, &#123; of: cnst.OauthGrant &#125;)</code> 캐시에 담고,
                  담는 모양은 <code>libs/shared/lib/__scalar/</code> 아래의 scalar입니다. scalar는 JSON 텍스트로
                  오가므로 같은 선언이 Redis 캐시와 sqlite 캐시를 그대로 왕복합니다.
                </span>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="file-map" title={l.trans({ en: "Service File Map", ko: "Service 파일 구성" })}>
        <Docs.Title>{l.trans({ en: "Service File Map", ko: "Service 파일 구성" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Four files are always there. The rest arrive when the feature earns them, and both lists follow the order of this section's pages.",
              ko: "네 파일은 언제나 있습니다. 나머지는 기능에 필요해질 때 생기며, 두 목록 모두 이 섹션 문서의 순서를 따릅니다.",
            })}
          </div>
          <Docs.SubSubTitle>{l.trans({ en: "Always There", ko: "항상 있는 네 파일" })}</Docs.SubSubTitle>
          <Docs.IntroTable type={l.trans({ en: "File", ko: "파일" })} items={alwaysFiles} />
          <Docs.SubSubTitle>{l.trans({ en: "Only When Needed", ko: "필요할 때만 생기는 파일" })}</Docs.SubSubTitle>
          <Docs.IntroTable type={l.trans({ en: "File", ko: "파일" })} items={optionalFiles} />
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="empty-scaffolds" title={l.trans({ en: "Ship The Empty Files", ko: "빈 파일도 남겨 둔다" })}>
        <Docs.Title>{l.trans({ en: "Ship The Empty Files", ko: "빈 파일도 남겨 둔다" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  The rule that most often looks like a mistake: a scaffold file stays in the tree even when it holds
                  nothing. Here is <code>libs/util/lib/_util/util.signal.ts</code> in full, unedited:
                </span>
              ),
              ko: (
                <span>
                  가장 자주 실수처럼 보이는 규칙입니다. 스캐폴드 파일은 아무것도 담지 않아도 트리에 남깁니다. 아래는{" "}
                  <code>libs/util/lib/_util/util.signal.ts</code>의 전문이며, 손대지 않은 그대로입니다:
                </span>
              ),
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="libs/util/lib/_util/util.signal.ts"
            code={`import { endpoint, internal } from "akanjs/signal";

import * as srv from "../srv";

export class UtilInternal extends internal(srv.util, () => ({})) {}

export class UtilEndpoint extends endpoint(srv.util, () => ({})) {}`}
          />
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Two exported classes, zero methods.</strong> That is the whole file, and it stays.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>export한 class 둘, method 0개.</strong> 이것이 파일 전체이고, 그대로 둡니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Deleting it does not shrink the workspace, it changes it.</strong> The next developer first
                    has to decide where an endpoint goes, instead of where it goes in the file already open.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>지우면 워크스페이스가 작아지는 것이 아니라 달라집니다.</strong> 다음 개발자는 이미 열린
                    파일의 어디에 endpoint를 둘지가 아니라, 어느 파일에 둘지부터 정해야 합니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>The first endpoint stays a one-line diff.</strong> Without the file, it would be a new file.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>첫 endpoint가 한 줄짜리 diff로 끝납니다.</strong> 파일이 없으면 새 파일을 만드는 diff가
                    됩니다.
                  </span>
                ),
              })}
            </li>
          </ul>
          <Docs.SubSubTitle>
            {l.trans({ en: "The Empty Forms You Will Meet", ko: "자주 만나는 빈 형태" })}
          </Docs.SubSubTitle>
          <Docs.IntroTable type={l.trans({ en: "File", ko: "파일" })} items={emptyForms} />
          <div>
            {l.trans({
              en: (
                <span>
                  <code>apps/akan/lib/_akan</code> is in exactly this state: its service, signal and store are all
                  empty. <code>apps/minimal/lib/_minimal</code> keeps the same empty store beside its bench endpoints,
                  and neither is waiting to be cleaned up.
                </span>
              ),
              ko: (
                <span>
                  <code>apps/akan/lib/_akan</code>이 정확히 이 상태입니다. service, signal, store가 모두 비어 있습니다.{" "}
                  <code>apps/minimal/lib/_minimal</code>도 벤치마크 endpoint 옆에 같은 빈 store를 두고 있고, 둘 다 정리
                  대상이 아닙니다.
                </span>
              ),
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide
        id="which-one"
        title={l.trans({ en: "Model Module Or Service Module", ko: "Model module인가, service module인가" })}
      >
        <Docs.Title>
          {l.trans({ en: "Model Module Or Service Module", ko: "Model module인가, service module인가" })}
        </Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "One question decides it: is there a row you would want to list, filter, and still find next week?",
              ko: "질문 하나로 정해집니다. 나열하고 걸러 보고, 다음 주에도 다시 찾을 행이 있습니까?",
            })}
          </div>
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Yes: a model module</strong> at <code>lib/&lt;model&gt;</code>. The service module you were
                    about to write is one of its service methods.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>있다면 model module</strong>입니다. <code>lib/&lt;model&gt;</code>에 두고, 쓰려던 service
                    module은 그 module의 service method 하나가 됩니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>No: a service module</strong> at <code>lib/_&lt;service&gt;</code>.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>없다면 service module</strong>입니다. <code>lib/_&lt;service&gt;</code>에 둡니다.
                  </span>
                ),
              })}
            </li>
          </ul>
          <div className="my-4 space-y-3">
            {moduleKinds.map((kind) => (
              <div key={kind.folder} className={panelRecipe({ radius: "lg", padding: "sm" }, "min-w-0")}>
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <span className="font-semibold text-primary">{kind.title}</span>
                  <code className="font-mono text-foreground/60 text-xs">{kind.folder}</code>
                </div>
                <div className="mt-1 text-foreground/70 text-sm">{kind.desc}</div>
                <code className={chip}>{kind.examples}</code>
              </div>
            ))}
          </div>
          <div>
            {l.trans({
              en: "The next page is the abstract file, where the rules you just decided on are written down. After that the pages follow the call path:",
              ko: "다음 문서는 방금 정한 규칙을 적어 두는 abstract 파일입니다. 그다음부터는 호출 경로를 따라갑니다:",
            })}
          </div>
          <Docs.LinkGrid
            items={[
              {
                href: "/conventions/service/abstract",
                title: "service.abstract.md",
                desc: l.trans({ en: "What the module owns, and its rules.", ko: "module이 맡는 일과 그 규칙." }),
              },
              {
                href: "/conventions/service/dictionary",
                title: "service.dictionary.ts",
                desc: l.trans({ en: "Endpoint labels, errors and phrases.", ko: "endpoint label, error, 문구." }),
              },
              {
                href: "/conventions/service/service",
                title: "service.service.ts",
                desc: l.trans({ en: "The workflow and what it injects.", ko: "workflow와 주입받는 것." }),
              },
              {
                href: "/conventions/service/signal",
                title: "service.signal.ts",
                desc: l.trans({ en: "Internal and Endpoint, without a Slice.", ko: "Slice 없이 Internal과 Endpoint." }),
              },
              {
                href: "/conventions/service/store",
                title: "service.store.ts",
                desc: l.trans({
                  en: "Client state, only when the feature has any.",
                  ko: "client state가 있을 때만 쓰는 store.",
                }),
              },
            ]}
          />
        </Docs.Description>
      </Scroll.Slide>
      <DocsToc />
    </Scroll>
  );
});
