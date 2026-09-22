import { usePage } from "@apps/akan/client";
import { Code, Divider, Docs, DocsToc, panelRecipe } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();

  const boundaryRows = [
    {
      name: "useState · useEffect · any use* hook",
      desc: l.trans({
        en: (
          <span>
            <strong>Client.</strong> React runs hooks in the browser. <code>usePage()</code>, <code>getSelf()</code> and{" "}
            <code>useServer()</code> are the three exceptions — they read request-scoped server context and stay legal
            in a server component.
          </span>
        ),
        ko: (
          <span>
            <strong>클라이언트.</strong> React는 hook을 브라우저에서 실행합니다. 예외는 <code>usePage()</code>,{" "}
            <code>getSelf()</code>, <code>useServer()</code> 셋뿐입니다. 이들은 요청 단위 서버 context를 읽으므로 server
            component에서도 그대로 씁니다.
          </span>
        ),
      }),
    },
    {
      name: "onClick · onChange · any on* handler",
      desc: l.trans({
        en: (
          <span>
            <strong>Client.</strong> A function attached to a DOM event has to exist in the browser, so the component
            holding it does too.
          </span>
        ),
        ko: (
          <span>
            <strong>클라이언트.</strong> DOM 이벤트에 붙는 함수는 브라우저에 존재해야 하므로, 그 함수를 가진 component도
            브라우저로 갑니다.
          </span>
        ),
      }),
    },
    {
      name: "st.use.* · st.do.*",
      desc: l.trans({
        en: (
          <span>
            <strong>Client.</strong> The store is a runtime singleton that only exists in the client bundle. Importing{" "}
            <code>st</code> is what forces the directive, whether you read or write.
          </span>
        ),
        ko: (
          <span>
            <strong>클라이언트.</strong> store는 client bundle에만 존재하는 런타임 싱글턴입니다. 읽든 쓰든{" "}
            <code>st</code>를 import하는 것 자체가 directive를 강제합니다.
          </span>
        ),
      }),
    },
    {
      name: "window · document · navigator · localStorage",
      desc: l.trans({
        en: (
          <span>
            <strong>Client.</strong> Browser globals, plus <code>matchMedia</code>, the three observers,{" "}
            <code>requestAnimationFrame</code> and <code>WebSocket</code>. None of them exist while the server renders.
          </span>
        ),
        ko: (
          <span>
            <strong>클라이언트.</strong> 브라우저 전역 객체입니다. <code>matchMedia</code>, 세 가지 observer,{" "}
            <code>requestAnimationFrame</code>, <code>WebSocket</code>도 같습니다. 서버 렌더링 시점에는 어느 것도
            없습니다.
          </span>
        ),
      }),
    },
    {
      name: "a client-only third-party package",
      desc: l.trans({
        en: (
          <span>
            <strong>Client.</strong> A map, an editor, a chart library that touches the DOM on import. This is the one
            reason the directive is never questioned — reach it through a lib re-export, never a direct import.
          </span>
        ),
        ko: (
          <span>
            <strong>클라이언트.</strong> import 시점에 DOM을 건드리는 지도, 에디터, 차트 라이브러리입니다. directive를
            문제 삼지 않는 유일한 이유이며, 직접 import하지 말고 lib re-export를 거칩니다.
          </span>
        ),
      }),
    },
    {
      name: "rendering markup · mapping over data",
      desc: l.trans({
        en: (
          <span>
            <strong>Server.</strong> A list of cards built from an array is HTML the server can finish. It costs nothing
            to hydrate because there is nothing to hydrate.
          </span>
        ),
        ko: (
          <span>
            <strong>서버.</strong> 배열로 만든 카드 목록은 서버가 끝까지 만들 수 있는 HTML입니다. hydrate할 것이 없으니
            hydrate 비용도 없습니다.
          </span>
        ),
      }),
    },
    {
      name: "usePage() · l() · l.trans()",
      desc: l.trans({
        en: (
          <span>
            <strong>Server.</strong> Translation resolves on both sides, so a localized screen never needs the directive
            for its text.
          </span>
        ),
        ko: (
          <span>
            <strong>서버.</strong> 번역은 양쪽에서 해결되므로, 다국어 화면이 문구 때문에 directive를 달 일은 없습니다.
          </span>
        ),
      }),
    },
    {
      name: "route params and search values",
      desc: l.trans({
        en: (
          <span>
            <strong>Server.</strong> <code>.param()</code> and <code>.search()</code> hand the render callback typed
            values before the first byte.
          </span>
        ),
        ko: (
          <span>
            <strong>서버.</strong> <code>.param()</code>과 <code>.search()</code>는 첫 바이트가 나가기 전에 타입이
            맞춰진 값을 render callback에 넘깁니다.
          </span>
        ),
      }),
    },
    {
      name: "fetch.* inside a route",
      desc: l.trans({
        en: (
          <span>
            <strong>Server.</strong> A route calls the endpoint directly. The same call from a mounted client component
            is two extra round-trips for a shell the browser already painted.
          </span>
        ),
        ko: (
          <span>
            <strong>서버.</strong> route는 endpoint를 직접 호출합니다. 같은 호출을 마운트된 client component에서 하면,
            브라우저가 이미 그린 화면을 위해 왕복 두 번을 더 치릅니다.
          </span>
        ),
      }),
    },
    {
      name: "getSelf({ unauthorize })",
      desc: l.trans({
        en: (
          <span>
            <strong>Server.</strong> Gate auth in <code>_layout.tsx</code> before any HTML is sent, not in a component
            that renders and then redirects.
          </span>
        ),
        ko: (
          <span>
            <strong>서버.</strong> 인증은 HTML이 나가기 전에 <code>_layout.tsx</code>에서 막습니다. 렌더링한 뒤
            redirect하는 component에서 하지 않습니다.
          </span>
        ),
      }),
    },
    {
      name: "showing and hiding a panel",
      desc: l.trans({
        en: (
          <span>
            <strong>Server, usually.</strong> A <code>data-*</code> attribute with <code>group-data-</code> variants, or{" "}
            <code>details</code> and <code>summary</code>, keeps both branches server-rendered. Reach for state only
            when the visibility itself is business state.
          </span>
        ),
        ko: (
          <span>
            <strong>대개 서버.</strong> <code>data-*</code> 속성과 <code>group-data-</code> variant, 혹은{" "}
            <code>details</code>/<code>summary</code>를 쓰면 양쪽 분기가 모두 서버에서 렌더링됩니다. 보이고 숨기는 것
            자체가 비즈니스 상태일 때만 state를 씁니다.
          </span>
        ),
      }),
    },
  ];

  const roleRows = [
    {
      name: "<Model>.Unit.tsx",
      desc: l.trans({
        en: "Server. One row, one card, one tile. Takes the model as a prop and renders it. Never carries the directive.",
        ko: "서버. 행 하나, 카드 하나, 타일 하나입니다. 모델을 prop으로 받아 렌더링하며, directive를 달지 않습니다.",
      }),
    },
    {
      name: "<Model>.View.tsx",
      desc: l.trans({
        en: "Server. The detail surface for one record. Takes the full model as a prop. Never carries the directive.",
        ko: "서버. 레코드 하나의 상세 화면입니다. full 모델을 prop으로 받으며, directive를 달지 않습니다.",
      }),
    },
    {
      name: "<Model>.Zone.tsx",
      desc: l.trans({
        en: 'Client. The composed page section that reads the store and hydrates from an init or view prop. Always "use client" on line 1, and it should hold almost no markup of its own.',
        ko: '클라이언트. store를 읽고 init/view prop으로 hydrate하는 구성 section입니다. 1행에 항상 "use client"가 있고, 자체 마크업은 거의 갖지 않습니다.',
      }),
    },
    {
      name: "<Model>.Template.tsx",
      desc: l.trans({
        en: 'Client. The form. Every field is bound to the store, so a Template contains zero useState. Always "use client" on line 1.',
        ko: '클라이언트. 폼입니다. 모든 field가 store에 묶이므로 Template에는 useState가 하나도 없습니다. 1행에 항상 "use client"가 있습니다.',
      }),
    },
    {
      name: "<Model>.Util.tsx",
      desc: l.trans({
        en: 'Client. One domain action as a control — Serve, Refund, Remove. Always "use client" on line 1, and it takes ids rather than model instances.',
        ko: '클라이언트. 도메인 액션 하나를 컨트롤로 만든 것입니다. Serve, Refund, Remove 같은 것들이죠. 1행에 항상 "use client"가 있고, 모델 인스턴스가 아니라 id를 받습니다.',
      }),
    },
  ];

  const ssrRuleRows = [
    {
      name: "akan.ssr.unnecessary-use-client",
      desc: l.trans({
        en: "The directive is there but the file uses no client-only capability at all. Delete it.",
        ko: "directive는 있는데 파일이 클라이언트 전용 기능을 하나도 쓰지 않습니다. 지우세요.",
      }),
    },
    {
      name: "akan.ssr.client-static-component",
      desc: l.trans({
        en: "A component in a client file renders four or more JSX elements with zero client-only capability. It is server-renderable markup sitting in the bundle.",
        ko: "client 파일 안의 component가 클라이언트 전용 기능 없이 JSX 엘리먼트를 4개 이상 렌더링합니다. 번들에 들어앉은 서버 렌더링 가능한 마크업입니다.",
      }),
    },
    {
      name: "akan.ssr.client-static-markup",
      desc: l.trans({
        en: "Ten or more JSX elements wrapped around one or two client-only touches. Split it: the touch stays client, the subtree goes server.",
        ko: "클라이언트 전용 접점 한두 개를 JSX 엘리먼트 10개 이상이 감싸고 있습니다. 접점만 클라이언트에 남기고 서브트리는 서버로 나눕니다.",
      }),
    },
    {
      name: "akan.ssr.client-mount-load",
      desc: l.trans({
        en: "A useEffect with an empty dependency array loads server data. The route can fetch it before the first byte. A reactive effect with real dependencies is not flagged.",
        ko: "의존성 배열이 빈 useEffect가 서버 데이터를 불러옵니다. route가 첫 바이트 전에 가져올 수 있습니다. 실제 의존성이 있는 반응형 effect는 보고되지 않습니다.",
      }),
    },
    {
      name: "akan.ssr.module-missing-server-view",
      desc: l.trans({
        en: "A module renders only from Template, Zone and Util and declares no Unit or View at all, so every consumer pays for hydration just to display the model.",
        ko: "모듈이 Template, Zone, Util에서만 렌더링하고 Unit이나 View를 전혀 선언하지 않습니다. 모델을 보여주기만 하려는 소비자도 hydration 비용을 냅니다.",
      }),
    },
    {
      name: "akan.ssr.template-client-state",
      desc: l.trans({
        en: "A Template holds form state in useState instead of the store. Bind the field with value={xForm.field} and onChange={st.do.setFieldOnX}.",
        ko: "Template이 폼 상태를 store가 아니라 useState에 들고 있습니다. value={xForm.field}와 onChange={st.do.setFieldOnX}로 묶으세요.",
      }),
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="ui-overview" title={l.trans({ en: "UI Architecture", ko: "UI 아키텍처" })}>
        <Docs.Title>{l.trans({ en: "UI Architecture", ko: "UI 아키텍처" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: 'You add "use client" to a file because one button in it has an onClick. The file is two hundred lines of product markup and one handler, and now all two hundred lines ship twice: once as the HTML the server already rendered, and again as JavaScript the browser has to download, parse and re-run before that one button works.',
              ko: '어떤 파일에 버튼 하나가 onClick을 가졌다는 이유로 "use client"를 답니다. 그 파일은 상품 마크업 200줄과 핸들러 하나로 이루어져 있고, 이제 200줄 전체가 두 번 전송됩니다. 한 번은 서버가 이미 렌더링한 HTML로, 또 한 번은 그 버튼 하나가 동작하기 전에 브라우저가 내려받고 파싱하고 다시 실행해야 하는 JavaScript로요.',
            })}
          </div>
          <div>
            {l.trans({
              en: "Akan is SSR-first. Every element that renders on the server ships as markup and costs nothing to hydrate, so the default is server and the directive is a cost you justify per component rather than a habit. This page is about where that line falls, why it is mechanical rather than a judgment call, and how to see where your app currently sits.",
              ko: "Akan은 SSR이 기본입니다. 서버에서 렌더링된 엘리먼트는 마크업으로만 전송되고 hydrate 비용이 없습니다. 그래서 기본값은 서버이고, directive는 습관이 아니라 component마다 근거를 대야 하는 비용입니다. 이 페이지는 그 선이 어디에 그어지는지, 왜 그것이 판단이 아니라 기계적인 규칙인지, 그리고 지금 내 앱이 어디에 서 있는지 보는 법을 다룹니다.",
            })}
          </div>
          <Docs.Alert type="warning">
            {l.trans({
              en: (
                <span>
                  <code>akan quality ssr</code> prints the server render share per app and lib — server-rendered JSX
                  elements over the total. <strong>50% is the floor</strong>, and a falling share is a regression. If a
                  change moves markup to the client, say why, or move it back.
                </span>
              ),
              ko: (
                <span>
                  <code>akan quality ssr</code>은 app과 lib별 server render share를 출력합니다. 전체 JSX 엘리먼트 중
                  서버에서 렌더링된 비율입니다. <strong>50%가 하한선</strong>이고, 비율이 떨어지면 그것은 회귀입니다.
                  어떤 변경이 마크업을 클라이언트로 옮겼다면 이유를 밝히거나, 되돌리세요.
                </span>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide
        id="server-side-rendering"
        title={l.trans({ en: "How A Page Reaches The Browser", ko: "페이지가 브라우저에 닿는 경로" })}
      >
        <Docs.Title>
          {l.trans({ en: "How A Page Reaches The Browser", ko: "페이지가 브라우저에 닿는 경로" })}
        </Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Server-side rendering means the server prepares the first visible HTML before the browser has finished loading the app. A customer reads the order list, the price and the policy text while the filter and the submit button are still arriving. Viewing and interacting do not have to happen at the same moment.",
              ko: "서버사이드 렌더링은 브라우저가 앱을 다 불러오기 전에 서버가 먼저 보일 HTML을 준비해 보내는 방식입니다. 필터와 제출 버튼이 아직 도착하는 중에도 고객은 주문 목록과 가격과 정책 문구를 읽습니다. 보는 순간과 조작하는 순간이 같을 필요는 없습니다.",
            })}
          </div>
          <Docs.Mermaid
            title={l.trans({ en: "One request, end to end", ko: "요청 하나의 전 구간" })}
            highlightNodes={["Route"]}
            chart={`sequenceDiagram
  actor User
  participant Browser
  participant Route as page().render()
  participant Fetch as fetch.init and fetch.view
  participant Server as Akan server
  User->>Browser: opens /en/icecreamOrder
  Browser->>Route: request
  Route->>Fetch: fetch.initIcecreamOrderInPublic()
  Fetch->>Server: slice query
  Server-->>Fetch: init payload
  Route-->>Browser: shell HTML, server components already rendered
  Note over Browser: the user can read the page here
  Route-->>Browser: each section streams in as its own promise lands
  Browser->>Browser: hydrate the client islands only
  Note over Browser: the user can now type and click`}
          />
          <div className="my-4 space-y-3">
            <div className={panelRecipe({ radius: "lg", padding: "sm" })}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-primary">👀</span>
                <strong className="text-primary">Time to View</strong>
              </div>
              <div className="text-foreground/70 text-sm">
                {l.trans({
                  en: "How quickly the user can read something meaningful: order titles, sizes, prices, the first rows, the policy text. Server rendering is what moves this.",
                  ko: "사용자가 의미 있는 내용을 얼마나 빨리 읽을 수 있는가입니다. 주문 제목, 사이즈, 가격, 첫 행들, 정책 문구요. 이 값을 움직이는 것이 서버 렌더링입니다.",
                })}
              </div>
            </div>
            <div className={panelRecipe({ radius: "lg", padding: "sm" })}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-primary">🖱️</span>
                <strong className="text-primary">Time to Interaction</strong>
              </div>
              <div className="text-foreground/70 text-sm">
                {l.trans({
                  en: "How quickly the user can type, click, filter or receive a live update. Only the hydrated islands move this, and every element you keep on the server makes them smaller.",
                  ko: "사용자가 얼마나 빨리 입력하고, 클릭하고, 필터링하고, 실시간 갱신을 받을 수 있는가입니다. 이 값을 움직이는 것은 hydrate되는 섬들뿐이고, 서버에 남기는 엘리먼트마다 그 섬이 작아집니다.",
                })}
              </div>
            </div>
          </div>
          <div>
            {l.trans({
              en: "The shell does not have to wait for every query. fetch.init<Model><Suffix>, fetch.view<Model> and fetch.edit<Model> are awaitable and destructurable: destructuring hands out one promise per field with both queries already in flight, so a route can send the shell and give each section its own promise. Awaiting instead keeps that section in the shell, which is what SEO snapshots, prerendering and pre-hydration E2E read — so await what the page needs immediately and stream the rest.",
              ko: "shell이 모든 query를 기다릴 필요는 없습니다. fetch.init<Model><Suffix>, fetch.view<Model>, fetch.edit<Model>은 await할 수도 있고 구조 분해할 수도 있습니다. 구조 분해하면 두 query가 이미 출발한 상태로 field마다 promise 하나씩을 내주므로, route는 shell을 먼저 보내고 각 section에 자기 promise를 넘길 수 있습니다. 반대로 await하면 그 section이 shell 안에 남는데, SEO 스냅샷과 prerendering과 hydration 이전 E2E가 읽는 것이 바로 그 shell입니다. 그러니 페이지가 당장 필요한 것은 await하고 나머지는 스트리밍하세요.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/koyo/page/(public)/icecreamOrder/_index.tsx"
            code={`import { fetch, IcecreamOrder, usePage } from "@apps/koyo/client";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();
  const { icecreamOrderInitInPublic } = fetch.initIcecreamOrderInPublic();
  return (
    <div className="p-4">
      <h1 className="font-bold text-2xl">{l("icecreamOrder.modelName")}</h1>
      <IcecreamOrder.Zone.Card init={icecreamOrderInitInPublic} />
    </div>
  );
});`}
          />
          <div>
            {l.trans({
              en: "The heading is server markup. The Zone is the only thing in the tree that hydrates, and it receives the unawaited promise rather than an awaited value, so the heading is on the wire while the slice query is still running. A promise that no Zone consumes goes to a Load.Stream instead, which the composition page covers.",
              ko: "제목은 서버 마크업입니다. 트리에서 hydrate되는 것은 Zone뿐이고, Zone은 await된 값이 아니라 await하지 않은 promise를 받습니다. 그래서 slice query가 아직 도는 동안 제목은 이미 전송된 상태입니다. Zone이 소비하지 않는 promise는 대신 Load.Stream으로 보내는데, 이는 구성 문서에서 다룹니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide
        id="client-boundary"
        title={l.trans({ en: "What Earns A Client Component", ko: "무엇이 클라이언트 컴포넌트를 정당화하는가" })}
      >
        <Docs.Title>
          {l.trans({ en: "What Earns A Client Component", ko: "무엇이 클라이언트 컴포넌트를 정당화하는가" })}
        </Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "There are exactly five capabilities that require the browser. Everything else on a screen — including all the markup around them — is server work. This is the whole decision, and it is the same table akan quality ssr reads when it decides whether a directive was earned.",
              ko: "브라우저를 반드시 필요로 하는 기능은 정확히 다섯 가지입니다. 화면의 나머지 전부는, 그 다섯 가지를 둘러싼 마크업을 포함해 서버의 일입니다. 결정은 이것이 전부이며, akan quality ssr이 directive가 정당했는지 판단할 때 읽는 표도 같습니다.",
            })}
          </div>
          <Docs.IntroTable type={l.trans({ en: "Capability", ko: "기능" })} items={boundaryRows} />
          <div>
            {l.trans({
              en: (
                <span>
                  Notice that only the capability crosses, never the markup around it. The smallest useful client
                  component adds one behaviour and renders <code>children</code> untouched, so everything inside it
                  stays server markup. Wrap the interaction, not the UI.
                </span>
              ),
              ko: (
                <span>
                  경계를 넘는 것은 기능뿐이고 그 둘레의 마크업은 넘지 않는다는 점에 주목하세요. 가장 쓸모 있는 최소
                  client component는 동작 하나를 더하고 <code>children</code>은 손대지 않고 렌더링합니다. 그 안의 모든
                  것은 서버 마크업으로 남습니다. UI가 아니라 인터랙션을 감싸세요.
                </span>
              ),
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide
        id="file-roles"
        title={l.trans({ en: "In Domain UI The Rule Is Mechanical", ko: "도메인 UI에서 규칙은 기계적입니다" })}
      >
        <Docs.Title>
          {l.trans({ en: "In Domain UI The Rule Is Mechanical", ko: "도메인 UI에서 규칙은 기계적입니다" })}
        </Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Inside a domain module you never make the call above. The file role decides it: Template, Zone and Util always carry the directive on line 1, and Unit and View never do. If a file's role and its directive disagree, one of the two is wrong.",
              ko: "도메인 모듈 안에서는 위의 판단을 할 일이 없습니다. 파일의 역할이 결정합니다. Template, Zone, Util은 1행에 언제나 directive가 있고, Unit과 View에는 절대 없습니다. 파일의 역할과 directive가 어긋난다면 둘 중 하나가 잘못된 것입니다.",
            })}
          </div>
          <Docs.IntroTable type={l.trans({ en: "File", ko: "파일" })} items={roleRows} />
          <div>
            {l.trans({
              en: "The pair below is the shape the rule produces. The Zone is client because it hydrates the store from init; it holds no markup of its own and delegates every row to a server Unit.",
              ko: "아래 한 쌍이 이 규칙이 만들어내는 모양입니다. Zone은 init으로 store를 hydrate하기 때문에 클라이언트이며, 자체 마크업 없이 모든 행을 server Unit에 위임합니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/koyo/lib/icecreamOrder/IcecreamOrder.Zone.tsx"
            code={`"use client";
import { IcecreamOrder, type cnst } from "@apps/koyo/client";
import type { ClientInit } from "akanjs/fetch";
import { Load } from "akanjs/ui";

interface CardProps {
  className?: string;
  init: ClientInit<"icecreamOrder", cnst.LightIcecreamOrder>;
}
export const Card = ({ className, init }: CardProps) => {
  return (
    <Load.Units
      className={className}
      init={init}
      renderItem={(icecreamOrder) => (
        <IcecreamOrder.Unit.Card key={icecreamOrder.id} icecreamOrder={icecreamOrder} />
      )}
    />
  );
};`}
          />
          <div>
            {l.trans({
              en: "The Unit takes the model as a prop and renders it. No directive, no import of st, nothing to hydrate — a hundred rows on screen cost the bundle exactly one component, the Zone.",
              ko: "Unit은 모델을 prop으로 받아 렌더링합니다. directive도 없고, st import도 없고, hydrate할 것도 없습니다. 화면에 행이 100개여도 번들이 치르는 비용은 component 하나, Zone뿐입니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/koyo/lib/icecreamOrder/IcecreamOrder.Unit.tsx"
            code={`import type { cnst } from "@apps/koyo/client";
import type { ModelProps } from "akanjs/client";
import { Link } from "akanjs/ui";

export const Card = ({ icecreamOrder, href }: ModelProps<"icecreamOrder", cnst.LightIcecreamOrder>) => {
  return (
    <Link href={href} className="flex w-full rounded-lg shadow-sm hover:shadow-lg">
      <div>{icecreamOrder.size}</div>
      <div>{icecreamOrder.status}</div>
    </Link>
  );
};`}
          />
          <Docs.Alert type="error">
            {l.trans({
              en: (
                <span>
                  A <code>Util</code> or <code>Zone</code> prop is never a model instance. Both roles are always client
                  components, so a <code>cnst.IcecreamOrder</code> prop is a class the server has to hand across the
                  boundary. Take <code>icecreamOrderId: string</code> and read the model from the store instead.
                </span>
              ),
              ko: (
                <span>
                  <code>Util</code>과 <code>Zone</code>의 prop은 모델 인스턴스가 아닙니다. 두 역할 모두 언제나 client
                  component이므로 <code>cnst.IcecreamOrder</code> prop은 서버가 경계 너머로 넘겨야 하는 클래스입니다.
                  대신 <code>icecreamOrderId: string</code>을 받고 모델은 store에서 읽으세요.
                </span>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="splitting-a-screen" title={l.trans({ en: "Splitting One Screen", ko: "한 화면을 나누기" })}>
        <Docs.Title>{l.trans({ en: "Splitting One Screen", ko: "한 화면을 나누기" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Outside a domain module — an app shell, a marketing section, a dashboard — you place the boundary yourself. Push it down until it sits on the leaf that actually needs the browser, and let everything above and inside it stay server markup:",
              ko: "도메인 모듈 밖에서는 — 앱 셸, 마케팅 섹션, 대시보드에서는 — 경계를 직접 놓게 됩니다. 실제로 브라우저가 필요한 잎까지 경계를 밀어 내리고, 그 위와 그 안은 서버 마크업으로 남겨 두세요:",
            })}
          </div>
          <div className="my-4 space-y-3">
            <div className={panelRecipe({ radius: "lg", padding: "sm" })}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-primary">🎁</span>
                <strong className="text-primary">
                  {l.trans({ en: "Wrap, do not absorb", ko: "감싸되 삼키지 않기" })}
                </strong>
              </div>
              <div className="text-foreground/70 text-sm">
                {l.trans({
                  en: "A client component that adds one behaviour and renders children untouched keeps its whole subtree on the server.",
                  ko: "동작 하나만 더하고 children은 손대지 않고 렌더링하는 client component는 서브트리 전체를 서버에 남깁니다.",
                })}
              </div>
            </div>
            <div className={panelRecipe({ radius: "lg", padding: "sm" })}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-primary">🧩</span>
                <strong className="text-primary">
                  {l.trans({ en: "Split compound components", ko: "복합 컴포넌트를 쪼개기" })}
                </strong>
              </div>
              <div className="text-foreground/70 text-sm">
                {l.trans({
                  en: "Tab, Tab.Menus, Tab.Menu and Tab.Panel are four small client shells; the panel bodies arrive as children and never enter the bundle. One client file with a mode useState and every panel inlined is the opposite.",
                  ko: "Tab, Tab.Menus, Tab.Menu, Tab.Panel은 작은 client 셸 네 개이고, 패널 본문은 children으로 들어와 번들에 닿지 않습니다. mode용 useState 하나에 모든 패널을 인라인한 client 파일 하나는 그 반대입니다.",
                })}
              </div>
            </div>
            <div className={panelRecipe({ radius: "lg", padding: "sm" })}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-primary">🪟</span>
                <strong className="text-primary">
                  {l.trans({ en: "Use named slots", ko: "이름 있는 슬롯 쓰기" })}
                </strong>
              </div>
              <div className="text-foreground/70 text-sm">
                {l.trans({
                  en: "Layout.Navbar takes title, back, left, right and children, so a client shell composes server content in five places instead of absorbing it.",
                  ko: "Layout.Navbar는 title, back, left, right, children을 받습니다. client 셸이 서버 콘텐츠를 삼키는 대신 다섯 자리에서 조립합니다.",
                })}
              </div>
            </div>
            <div className={panelRecipe({ radius: "lg", padding: "sm" })}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-primary">🧮</span>
                <strong className="text-primary">
                  {l.trans({ en: "Derive on the server", ko: "파생 계산은 서버에서" })}
                </strong>
              </div>
              <div className="text-foreground/70 text-sm">
                {l.trans({
                  en: "Display and predicate logic belongs on Light<Model>, which both sides hold; enum-to-class lookups belong in a module-scope as const map.",
                  ko: "표시와 판별 로직은 양쪽이 모두 들고 있는 Light<Model>에 둡니다. enum에서 클래스를 찾는 표는 모듈 스코프의 as const 맵에 둡니다.",
                })}
              </div>
            </div>
            <div className={panelRecipe({ radius: "lg", padding: "sm" })}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-primary">💤</span>
                <strong className="text-primary">
                  {l.trans({ en: "Keep the heavy island late", ko: "무거운 섬은 나중에" })}
                </strong>
              </div>
              <div className="text-foreground/70 text-sm">
                {l.trans({
                  en: "A map, an editor or a chart goes behind the ui/<Folder>/index_.tsx and lazy() pair, with a server-safe index.tsx beside it. Collapsing the pair into one file breaks RSC.",
                  ko: "지도, 에디터, 차트는 ui/<Folder>/index_.tsx와 lazy() 쌍 뒤에 두고, 옆에 서버에서 안전한 index.tsx를 둡니다. 이 쌍을 한 파일로 합치면 RSC가 깨집니다.",
                })}
              </div>
            </div>
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/koyo/ui/CopyOrderId.tsx"
            code={`"use client";
import type { ReactNode } from "react";

interface CopyOrderIdProps {
  className?: string;
  orderId: string;
  children: ReactNode;
}
export const CopyOrderId = ({ className, orderId, children }: CopyOrderIdProps) => {
  return (
    <button type="button" className={className} onClick={() => void navigator.clipboard.writeText(orderId)}>
      {children}
    </button>
  );
};`}
          />
          <div>
            {l.trans({
              en: "That file is the whole client cost of a copy button: one handler and one children pass-through. The label, the icon and the receipt block around it are written in the page and stay server markup, however large they grow.",
              ko: "저 파일이 복사 버튼의 클라이언트 비용 전부입니다. 핸들러 하나와 children 전달 하나죠. 라벨과 아이콘과 그 둘레의 영수증 블록은 page에 쓰이고, 아무리 커져도 서버 마크업으로 남습니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="quality-ssr" title={l.trans({ en: "Measuring The Split", ko: "경계를 측정하기" })}>
        <Docs.Title>{l.trans({ en: "Measuring The Split", ko: "경계를 측정하기" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "None of the above is a style preference, so it is measured rather than reviewed. akan quality ssr counts JSX elements per side and reports the share each app and lib keeps on the server, plus the six findings below. It reads the .tsx files under ui/ and lib/ in every app and lib — page/ and webkit/ are outside the measurement, so moving markup into a route neither helps nor hurts the number.",
              ko: "위의 어느 것도 취향의 문제가 아니므로, 리뷰가 아니라 측정으로 다룹니다. akan quality ssr은 양쪽의 JSX 엘리먼트를 세어 app과 lib마다 서버에 남긴 비율을 보고하고, 아래 여섯 가지를 함께 알려줍니다. 읽는 대상은 각 app과 lib의 ui/와 lib/ 아래 .tsx 파일입니다. page/와 webkit/은 측정 밖이므로, 마크업을 route로 옮기는 것은 수치를 올리지도 내리지도 않습니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="Terminal"
            language="bash"
            showLineNumbers={false}
            copy={false}
            code={`$ akan quality ssr

Akan SSR Balance Scan
scanned files: 827
ssr warnings: 14

Server render share (component files, JSX elements rendered per side):

  apps/koyo: 43% server (163 of 381 JSX elements, 218 client)  <- below the 50% target
  libs/shared: 62% server (460 of 742 JSX elements, 282 client)

Warnings:

apps/koyo/ui/OrderPanel.tsx:189:1 - warning akan.ssr.client-static-markup: Client component
"OrderPanel" renders 16 JSX elements around only 1 client-only touch (onClick). Most of this
subtree does not need the client bundle.
  fix: Keep the interactive element in the client component and hoist the static subtree into a
  server component, then accept it as \`children\` or render it through a Unit/View reference.`}
          />
          <Docs.IntroTable type={l.trans({ en: "Rule", ko: "규칙" })} items={ssrRuleRows} />
          <div>
            {l.trans({
              en: "Three things are deliberately not flagged. A client-only third-party package and an index_.tsx lazy() boundary are legitimate reasons for the directive; a Zone, Template or Util inside a module is exempt because its role requires the directive whether or not today's body uses it; and an interaction-driven fetch — a lookup inside an onClick — is work the server could not have done. Only mount-time loads are findings.",
              ko: "세 가지는 일부러 보고하지 않습니다. 클라이언트 전용 서드파티 패키지와 index_.tsx의 lazy() 경계는 directive의 정당한 이유입니다. 모듈 안의 Zone, Template, Util은 오늘의 본문이 그 기능을 쓰든 말든 역할 자체가 directive를 요구하므로 예외입니다. 그리고 인터랙션으로 시작되는 fetch — onClick 안의 조회 — 는 서버가 대신할 수 없었던 일입니다. 마운트 시점의 로드만 findings입니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "Run it before and after any change that touches .tsx, and treat --format json as the hook for CI. With the boundary settled, the next page is about what fills the space on either side of it: the akanjs/ui shells that render a list, a detail view and a form without you writing a loading state, and the generated helpers underneath them.",
              ko: ".tsx를 건드리는 변경 전후로 실행하고, CI에 걸 때는 --format json을 씁니다. 경계가 정리되었으니 다음 문서는 그 양쪽을 무엇이 채우는지 다룹니다. 로딩 상태를 직접 쓰지 않고도 목록과 상세와 폼을 렌더링해 주는 akanjs/ui 셸들, 그리고 그 아래의 생성된 helper들입니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <DocsToc />
    </Scroll>
  );
});
