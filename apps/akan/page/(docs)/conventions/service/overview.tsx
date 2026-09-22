import { usePage } from "@apps/akan/client";
import { Code, Divider, Docs, DocsToc, type IntroItem, panelRecipe } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();

  const realModules: IntroItem[] = [
    {
      name: "_security",
      desc: l.trans({
        en: "JWT signing and verification, AES encryption, refresh-token minting. Server-only: no store, no UI.",
        ko: "JWT 서명과 검증, AES 암복호화, refresh token 발급을 담당합니다. server 전용이라 store도 UI도 없습니다.",
      }),
      example: "libs/util/lib/_security",
    },
    {
      name: "_oauth",
      desc: l.trans({
        en: "The OAuth 2.1 authorization server that issues the tokens /mcp accepts. The largest service module in the workspace.",
        ko: "/mcp가 받아들이는 OAuth 2.1 token을 발급하는 인가 서버입니다. 이 워크스페이스에서 가장 큰 service module입니다.",
      }),
      example: "libs/shared/lib/_oauth",
    },
    {
      name: "_doc",
      desc: l.trans({
        en: "Serves the Akan.js documentation corpus to agents over MCP. Reads a generated folder; writes nothing.",
        ko: "Akan.js 문서 코퍼스를 MCP로 agent에게 제공합니다. 생성된 폴더를 읽기만 하고 쓰지 않습니다.",
      }),
      example: "apps/akan/lib/_doc",
    },
    {
      name: "_localFile",
      desc: l.trans({
        en: "Streams a public blob back as an HTTP Response from a custom path. Four files, one endpoint.",
        ko: "custom path에서 공개 blob을 HTTP Response로 흘려보냅니다. 파일 네 개, endpoint 하나입니다.",
      }),
      example: "libs/util/lib/_localFile",
    },
    {
      name: "_util · _shared",
      desc: l.trans({
        en: "The library's own root container. The service is an empty batch service; the store holds cross-module client state such as the map viewport or the sign-in flow.",
        ko: "라이브러리 자신의 루트 컨테이너입니다. service는 비어 있는 batch service이고, store는 지도 viewport나 로그인 흐름처럼 module을 가로지르는 client state를 담습니다.",
      }),
      example: "libs/util/lib/_util\nlibs/shared/lib/_shared",
    },
    {
      name: "_akan · _minimal",
      desc: l.trans({
        en: "The app's own root container, still as akan sync scaffolded it. Every file is present and empty — that is the intended resting state, not an unfinished one.",
        ko: "앱 자신의 루트 컨테이너이며 akan sync가 만든 그대로입니다. 모든 파일이 있고 비어 있습니다. 미완성이 아니라 의도된 정지 상태입니다.",
      }),
      example: "apps/akan/lib/_akan\napps/minimal/lib/_minimal",
    },
  ];

  const fileMap: IntroItem[] = [
    {
      name: "<service>.abstract.md",
      desc: l.trans({
        en: "A title line, one sentence naming what the module owns, and a ## Rules list of the invariants the code cannot show. Every one of the eight has it.",
        ko: "제목 한 줄, 이 module이 무엇을 소유하는지 말하는 문장 하나, 그리고 코드가 보여줄 수 없는 불변식을 담은 ## Rules 목록입니다. 여덟 개 모두 가지고 있습니다.",
      }),
      example: "libs/shared/lib/_oauth/oauth.abstract.md",
    },
    {
      name: "<service>.service.ts",
      desc: l.trans({
        en: "The workflow itself, built with a serve() call naming the module. Every one of the eight has it, even when the body is empty.",
        ko: "workflow 그 자체이며 module 이름을 넘긴 serve() 호출로 만듭니다. 본문이 비어 있더라도 여덟 개 모두 가지고 있습니다.",
      }),
      example: 'export class SecurityService extends serve("security" as const, ({ use }) => ({}))',
    },
    {
      name: "<service>.signal.ts",
      desc: l.trans({
        en: "Two classes, <X>Internal and <X>Endpoint. There is no Slice — a slice is a window onto a table, and a service module has none.",
        ko: "<X>Internal과 <X>Endpoint 두 개의 class입니다. Slice는 없습니다. slice는 테이블을 들여다보는 창인데, service module에는 테이블이 없습니다.",
      }),
      example: "libs/util/lib/_security/security.signal.ts",
    },
    {
      name: "<service>.dictionary.ts",
      desc: l.trans({
        en: "Built with serviceDictionary rather than modelDictionary — endpoint labels, error keys, and UI phrases. Not tied to model fields, because there are none.",
        ko: "modelDictionary가 아니라 serviceDictionary로 만듭니다. endpoint label, error key, UI 문구를 담습니다. model field에 묶이지 않습니다. field 자체가 없기 때문입니다.",
      }),
      example: "libs/shared/lib/_oauth/oauth.dictionary.ts",
    },
    {
      name: "<service>.store.ts",
      desc: l.trans({
        en: "Only when the feature has client state. Four of the eight have one, and two of those four are empty scaffolds.",
        ko: "feature에 client state가 있을 때만 씁니다. 여덟 중 넷이 가지고 있고, 그 넷 중 둘은 빈 스캐폴드입니다.",
      }),
      example: "libs/util/lib/_util/util.store.ts",
    },
    {
      name: "<service>.signal.test.ts",
      desc: l.trans({
        en: "Boots the whole barrel and calls the endpoints through the generated fetch. _security and _oauth carry one.",
        ko: "barrel 전체를 부팅하고 생성된 fetch로 endpoint를 호출합니다. _security와 _oauth가 가지고 있습니다.",
      }),
      example: "libs/shared/lib/_oauth/oauth.signal.test.ts",
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="service-module" title={l.trans({ en: "Service Module Overview", ko: "Service module 개요" })}>
        <Docs.Title>{l.trans({ en: "Service Module Overview", ko: "Service module 개요" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "You need to sign a token, stream a stored blob back to a browser, or run an OAuth handshake to its end. None of those is a record. There is nothing to list, nothing to edit, and no row that would still be there tomorrow — so a folder built around a stored model gives you five files you will leave empty and one you will fill.",
              ko: "token에 서명해야 하고, 저장된 blob을 브라우저로 흘려보내야 하고, OAuth 핸드셰이크를 끝까지 진행해야 합니다. 셋 다 레코드가 아닙니다. 나열할 것도, 수정할 것도, 내일까지 남아 있을 행도 없습니다. 저장된 model을 중심으로 만든 folder를 쓰면 비워 둘 파일 다섯 개와 채울 파일 하나를 얻게 됩니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "A service module is that folder without the model. It lives at lib/_<service> with a leading underscore, its files drop that underscore, and it owns an action or a capability instead of a table. The call path is the same one a model module uses, minus the document layer.",
              ko: "Service module은 model을 뺀 그 folder입니다. 앞에 underscore를 붙인 lib/_<service>에 놓이고, 내부 파일명에서는 그 underscore를 뗍니다. 테이블 대신 동작이나 능력을 소유합니다. 호출 경로는 model module과 같고, document 계층만 없습니다.",
            })}
          </div>
          <Docs.Mermaid
            title={l.trans({ en: "One call through a service module", ko: "Service module을 지나는 호출 하나" })}
            highlightNodes={["service"]}
            chart={`flowchart LR
  screen["A page, a store, an MCP client"] -->|"fetch.exchangeOAuthToken(...)"| signal["oauth.signal.ts<br/>endpoint · internal"]
  runtime["The runtime itself<br/>cron · queue · boot"] --> signal
  signal --> service["oauth.service.ts<br/>the workflow"]
  service --> other["Another module's service<br/>service(srv.UserService)"]
  service --> srvkit["An adapter in srvkit/<br/>plug() · use()"]
  srvkit --> external["The outside world"]`}
          />
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="real-modules" title={l.trans({ en: "The Eight That Exist", ko: "실재하는 여덟 개" })}>
        <Docs.Title>{l.trans({ en: "The Eight That Exist", ko: "실재하는 여덟 개" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "This workspace has eight service modules, and reading them is faster than reading a description of one. They land on a spectrum: a server-only primitive at one end, an entire authorization server at the other, and an empty root container at the near end.",
              ko: "이 워크스페이스에는 service module이 여덟 개 있고, 설명을 읽는 것보다 그것들을 읽는 편이 빠릅니다. 스펙트럼 위에 놓입니다. 한쪽 끝은 server 전용 primitive, 반대쪽 끝은 인가 서버 하나 전체, 가까운 쪽 끝은 비어 있는 루트 컨테이너입니다.",
            })}
          </div>
          <Docs.IntroTable type={l.trans({ en: "Module", ko: "모듈" })} items={realModules} />
          <div>
            {l.trans({
              en: "Notice what none of them has: not one of the eight carries a Util.tsx or a Zone.tsx. That is not an accident of this workspace — see the two UI pages in this section for why the file is rare and what goes there instead.",
              ko: "여덟 개 중 어느 것도 가지고 있지 않은 것을 보세요. Util.tsx도 Zone.tsx도 하나도 없습니다. 이 워크스페이스만의 우연이 아닙니다. 왜 그 파일이 드문지, 대신 무엇을 쓰는지는 이 섹션의 UI 문서 두 개에 있습니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="two-poles" title={l.trans({ en: "The Two Poles", ko: "양 극단" })}>
        <Docs.Title>{l.trans({ en: "The Two Poles", ko: "양 극단" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "_security is the floor. Five files, one of them a test, and a service class whose whole job is to hold two secrets and hand back signed or encrypted strings. Nothing on screen ever renders it, so there is no store and no component.",
              ko: "_security가 바닥입니다. 파일 다섯 개, 그중 하나는 테스트이고, service class가 하는 일은 secret 두 개를 들고 서명하거나 암호화한 문자열을 돌려주는 것뿐입니다. 화면에 그려지는 것이 없으니 store도 component도 없습니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="libs/util/lib/_security"
            language="bash"
            showLineNumbers={false}
            copy={false}
            code={`security.abstract.md     # what it owns, and four rules
security.service.ts      # the workflow
security.signal.ts       # one mutation
security.dictionary.ts   # endpoint labels
security.signal.test.ts  # boots the barrel and calls them`}
          />
          <div>
            {l.trans({
              en: "_oauth is the ceiling, and it is still the same five kinds of file. A 500-line service, ten endpoints, a dictionary that carries error keys and consent-page phrases as well as labels — and no store, because every screen it needs is a route in libs/shared/page/oauth rather than a section of one.",
              ko: "_oauth가 천장인데, 그래도 같은 다섯 종류의 파일입니다. 500줄짜리 service, endpoint 열 개, label뿐 아니라 error key와 동의 화면 문구까지 담은 dictionary가 있습니다. 그리고 store는 없습니다. 필요한 화면이 어떤 화면의 한 구획이 아니라 libs/shared/page/oauth의 route이기 때문입니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="libs/shared/lib/_oauth"
            language="bash"
            showLineNumbers={false}
            copy={false}
            code={`oauth.abstract.md      # seven rules and a workflow chain
oauth.service.ts       # ~500 lines: PKCE, rotation, revocation
oauth.signal.ts        # 10 endpoints, 5 of them at the origin root
oauth.dictionary.ts    # .endpoint() + .error() + .translate()
oauth.signal.test.ts   # the protocol, end to end`}
          />
          <Docs.Alert>
            {l.trans({
              en: (
                <span>
                  A service module with state does not grow a table for it. <code>_oauth</code> keeps every client,
                  request and grant in <code>memory(Map, &#123; of: cnst.OauthGrant &#125;)</code> caches, and the
                  shapes it stores are scalars under <code>libs/shared/lib/__scalar/</code>. A scalar travels as JSON
                  text, so the same declaration round-trips through the Redis and sqlite caches unchanged.
                </span>
              ),
              ko: (
                <span>
                  상태가 있는 service module이라고 해서 테이블을 만들지는 않습니다. <code>_oauth</code>는 client,
                  request, grant를 전부 <code>memory(Map, &#123; of: cnst.OauthGrant &#125;)</code> 캐시에 담고, 담는
                  모양은 <code>libs/shared/lib/__scalar/</code> 아래의 scalar입니다. scalar는 JSON 텍스트로 이동하므로
                  같은 선언이 Redis 캐시와 sqlite 캐시를 그대로 왕복합니다.
                </span>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="file-map" title={l.trans({ en: "Service File Map", ko: "Service file map" })}>
        <Docs.Title>{l.trans({ en: "Service File Map", ko: "Service file map" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Four files are always there. The rest arrive when the feature earns them, and the order is the order of this section's pages.",
              ko: "네 개는 언제나 있습니다. 나머지는 feature가 그 파일을 필요로 하게 될 때 생기며, 순서는 이 섹션 문서들의 순서와 같습니다.",
            })}
          </div>
          <Docs.IntroTable type={l.trans({ en: "File", ko: "파일" })} items={fileMap} />
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="empty-scaffolds" title={l.trans({ en: "Ship The Empty Files", ko: "빈 파일도 함께 배포한다" })}>
        <Docs.Title>{l.trans({ en: "Ship The Empty Files", ko: "빈 파일도 함께 배포한다" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "The rule that most often looks like a mistake: a scaffold file stays in the tree even when it holds nothing. Here is libs/util/lib/_util/util.signal.ts in full, unedited, on the main branch.",
              ko: "가장 자주 실수처럼 보이는 규칙입니다. 스캐폴드 파일은 아무것도 담고 있지 않아도 트리에 남습니다. 아래는 main 브랜치의 libs/util/lib/_util/util.signal.ts 전문이며, 손대지 않은 그대로입니다.",
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
          <div>
            {l.trans({
              en: "Two exported classes, zero methods. Deleting the file is not a smaller workspace, it is a different one: the generated sig barrel stops naming the module, the next developer has to decide where an endpoint goes instead of where it goes in the file that is already open, and the diff that adds the first endpoint is a new file rather than one line.",
              ko: "export한 class 둘, method 영. 이 파일을 지우면 워크스페이스가 작아지는 것이 아니라 달라집니다. 생성된 sig barrel이 이 module의 이름을 부르지 않게 되고, 다음 개발자는 endpoint를 이미 열려 있는 파일의 어디에 둘지가 아니라 어디에 둘지부터 정해야 하며, 첫 endpoint를 추가하는 diff가 한 줄이 아니라 새 파일이 됩니다.",
            })}
          </div>
          <div className={panelRecipe({ radius: "lg" }, "my-4")}>
            <div className="mb-2 font-semibold text-primary">
              {l.trans({ en: "The empty forms you will meet:", ko: "만나게 될 빈 형태들:" })}
            </div>
            <ul className="list-disc space-y-1 pl-5 text-foreground/70 text-sm">
              <li>
                {l.trans({
                  en: "export class XInternal extends internal(srv.x, () => ({})) {} — the builder callback returns an empty object, not nothing.",
                  ko: "export class XInternal extends internal(srv.x, () => ({})) {} — builder callback은 아무것도가 아니라 빈 객체를 반환합니다.",
                })}
              </li>
              <li>
                {l.trans({
                  en: 'export class UtilService extends serve("util" as const, { serverMode: "batch" }, () => ({})) {} — a root container with no methods still registers the service name.',
                  ko: 'export class UtilService extends serve("util" as const, { serverMode: "batch" }, () => ({})) {} — method가 없는 루트 컨테이너도 service 이름은 등록합니다.',
                })}
              </li>
              <li>
                {l.trans({
                  en: "A store body of exactly two comments, // state and // action, marking where each half goes.",
                  ko: "정확히 주석 두 줄, // state 와 // action 뿐인 store 본문. 각 절반이 들어갈 자리를 표시합니다.",
                })}
              </li>
            </ul>
          </div>
          <div>
            {l.trans({
              en: "apps/akan/lib/_akan and apps/minimal/lib/_minimal are both in exactly this state, all five files present and all five empty, and they are not on anyone's list to clean up.",
              ko: "apps/akan/lib/_akan과 apps/minimal/lib/_minimal이 정확히 이 상태입니다. 다섯 파일이 모두 있고 모두 비어 있으며, 누구의 정리 목록에도 올라 있지 않습니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide
        id="which-one"
        title={l.trans({ en: "Model Module Or Service Module", ko: "Model module인가 Service module인가" })}
      >
        <Docs.Title>
          {l.trans({ en: "Model Module Or Service Module", ko: "Model module인가 Service module인가" })}
        </Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "One question decides it: is there a row you would want to list, filter, and still find next week? If yes, it is a model module at lib/<model>, and the service module you were about to write is one of its service methods. If no, it is a service module.",
              ko: "질문 하나로 정해집니다. 나열하고 걸러 보고 싶고, 다음 주에도 찾게 될 행이 있습니까? 있다면 lib/<model>의 model module이고, 지금 쓰려던 service module은 그 module의 service method 하나입니다. 없다면 service module입니다.",
            })}
          </div>
          <div className="my-4 space-y-3">
            <div className={panelRecipe({ radius: "lg", padding: "sm" })}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-primary">🗃️</span>
                <strong className="text-primary">{l.trans({ en: "Model module", ko: "Model module" })}</strong>
              </div>
              <div className="text-foreground/70 text-sm">
                {l.trans({
                  en: "lib/<model>. A stored table, a document file, filters, slices, generated CRUD, and the five UI roles. user, file, banner, notification.",
                  ko: "lib/<model>. 저장된 테이블, document 파일, filter, slice, 생성된 CRUD, 그리고 다섯 개의 UI 역할. user, file, banner, notification이 그렇습니다.",
                })}
              </div>
            </div>
            <div className={panelRecipe({ radius: "lg", padding: "sm" })}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-primary">⚙️</span>
                <strong className="text-primary">{l.trans({ en: "Service module", ko: "Service module" })}</strong>
              </div>
              <div className="text-foreground/70 text-sm">
                {l.trans({
                  en: "lib/_<service>. No table, no document file, no slice. An action, a protocol, an integration, or a library's own root. security, oauth, localFile, doc.",
                  ko: "lib/_<service>. 테이블도 document 파일도 slice도 없습니다. 동작, 프로토콜, 연동, 또는 라이브러리 자신의 루트입니다. security, oauth, localFile, doc이 그렇습니다.",
                })}
              </div>
            </div>
            <div className={panelRecipe({ radius: "lg", padding: "sm" })}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-primary">📐</span>
                <strong className="text-primary">{l.trans({ en: "Scalar module", ko: "Scalar module" })}</strong>
              </div>
              <div className="text-foreground/70 text-sm">
                {l.trans({
                  en: "lib/__scalar/<scalar>. A value that is embedded in something else and never stored on its own. This is where a service module's own state lives when it has any.",
                  ko: "lib/__scalar/<scalar>. 다른 것 안에 박히고 혼자서는 저장되지 않는 값입니다. service module에 상태가 있다면 그 상태가 사는 곳입니다.",
                })}
              </div>
            </div>
          </div>
          <div>
            {l.trans({
              en: "The next page is the abstract file, which is where the rules you just decided on get written down. After that the pages follow the call path: dictionary, service, signal, store.",
              ko: "다음 문서는 abstract 파일입니다. 방금 정한 규칙을 적어 두는 곳입니다. 그다음부터는 호출 경로를 따라 dictionary, service, signal, store 순서입니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <DocsToc />
    </Scroll>
  );
});
