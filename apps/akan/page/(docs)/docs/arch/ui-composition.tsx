import { usePage } from "@apps/akan/client";
import { Code, Divider, Docs, DocsToc, panelRecipe } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";
import { Link } from "akanjs/ui";

export default page().render(() => {
  const { l } = usePage();

  const uiRows = [
    {
      name: "Load.Units · Load.View · Load.Edit",
      desc: l.trans({
        en: "The three data shells. Each takes the matching fetch handle, seeds the client store from it, and renders loading, empty and list states for you.",
        ko: "데이터 셸 셋입니다. 각각 대응하는 fetch handle을 받아 client store를 seed하고, loading·empty·list 상태를 대신 렌더링합니다.",
      }),
    },
    {
      name: "Load.Stream",
      desc: l.trans({
        en: "Awaits one promise behind its own Suspense boundary. A resolved value renders in the shell with no boundary at all, so the same call site works either way.",
        ko: "promise 하나를 자체 Suspense boundary 뒤에서 await합니다. 이미 해소된 값은 boundary 없이 shell에 렌더링되므로, 같은 호출부가 양쪽을 모두 처리합니다.",
      }),
    },
    {
      name: "Model.New · Model.Edit · Model.SureToRemove",
      desc: l.trans({
        en: "The three CRUD workflows as modals, wired to the generated store actions. Model.EditModal, Model.ViewModal and Model.AdminPanel cover the composed variants.",
        ko: "생성·수정·삭제 세 workflow를 모달로 제공하며, 생성된 store action에 연결되어 있습니다. Model.EditModal, Model.ViewModal, Model.AdminPanel이 조합형 변형을 맡습니다.",
      }),
    },
    {
      name: "Field",
      desc: l.trans({
        en: "Every model field control: Text, TextArea, Number, Date, DateRange, Switch, ToggleSelect, Tags, Email, Phone, Password, Parent, Children and more. Never a bare input for a model field.",
        ko: "모델 field용 컨트롤 전부입니다. Text, TextArea, Number, Date, DateRange, Switch, ToggleSelect, Tags, Email, Phone, Password, Parent, Children 등이 있습니다. 모델 field에 맨 input을 쓰지 않습니다.",
      }),
    },
    {
      name: "Tab · Layout · Link · Image · Empty",
      desc: l.trans({
        en: "The composition primitives. Tab splits into four small shells so panel bodies stay on the server, Link handles locale-prefixed internal navigation, and Empty is the bare placeholder.",
        ko: "조합용 기본 요소입니다. Tab은 패널 본문이 서버에 남도록 작은 셸 넷으로 나뉘고, Link는 locale이 붙은 내부 이동을 처리하며, Empty는 비어 있는 상태의 기본 자리표시자입니다.",
      }),
    },
    {
      name: "cn",
      desc: l.trans({
        en: "From akanjs/client, not akanjs/ui. Token-aware tailwind-merge, and the only class-combining function — no clsx, no raw twMerge, no object syntax. Merge the caller's className last.",
        ko: "akanjs/ui가 아니라 akanjs/client에서 가져옵니다. 토큰을 아는 tailwind-merge이며, 클래스를 합치는 유일한 함수입니다. clsx도, 맨 twMerge도, 객체 문법도 쓰지 않습니다. 호출자의 className을 가장 뒤에 합칩니다.",
      }),
    },
  ];

  const helperRows = [
    {
      name: "fetch",
      desc: l.trans({
        en: "One function per signal endpoint, plus the generated init, view and edit handles per slice. Routes and server components call it; client components do not.",
        ko: "signal endpoint마다 함수 하나, 그리고 slice마다 생성된 init·view·edit handle입니다. route와 server component가 호출하며, client component는 호출하지 않습니다.",
      }),
    },
    {
      name: "st",
      desc: l.trans({
        en: "Read with st.use.*, write with st.do.*. State and the CRUD actions are generated, so most stores need no hand-written action at all.",
        ko: "읽을 때는 st.use.*, 쓸 때는 st.do.*입니다. state와 CRUD action이 생성되므로 대부분의 store에는 직접 쓴 action이 아예 없습니다.",
      }),
    },
    {
      name: "<Model>.*",
      desc: l.trans({
        en: "The namespace a module exports: Unit, View, Zone, Template and Util. The model comes from the namespace, so a component is named for its role — IcecreamOrder.Unit.Card, never IcecreamOrderCard.",
        ko: "모듈이 내보내는 namespace입니다. Unit, View, Zone, Template, Util이 들어 있습니다. 모델 이름은 namespace가 제공하므로 component는 역할로 이름을 짓습니다. IcecreamOrder.Unit.Card이지 IcecreamOrderCard가 아닙니다.",
      }),
    },
    {
      name: "usePage",
      desc: l.trans({
        en: "l, l.trans and the page context. It reads request-scoped server context, so it is legal in a server component and never forces a client boundary.",
        ko: "l, l.trans, 그리고 page context입니다. 요청 단위 서버 context를 읽으므로 server component에서도 합법이며, client 경계를 강제하지 않습니다.",
      }),
    },
  ];

  const loadRows = [
    {
      name: "Load.Units",
      desc: l.trans({
        en: "init from fetch.init<Model><Suffix>. renderItem draws one row, renderList takes the whole DataList when the layout is a carousel or a table, renderEmpty replaces the empty state, and pagination, filter, sort and staleTime tune the rest.",
        ko: "fetch.init<Model><Suffix>가 준 init을 받습니다. renderItem이 행 하나를 그리고, 캐러셀이나 테이블처럼 레이아웃이 통짜일 때는 renderList가 DataList 전체를 받으며, renderEmpty가 빈 상태를 대체하고, pagination·filter·sort·staleTime이 나머지를 조정합니다.",
      }),
    },
    {
      name: "Load.View",
      desc: l.trans({
        en: "view from fetch.view<Model>. renderView is required and receives the full model; empty is the placeholder for a view whose model came back empty.",
        ko: "fetch.view<Model>가 준 view를 받습니다. renderView는 필수이며 full 모델을 받습니다. 모델이 비어서 돌아온 경우의 자리표시자는 empty입니다.",
      }),
    },
    {
      name: "Load.Edit",
      desc: l.trans({
        en: "edit from fetch.edit<Model>, or a plain partial for a new record. slice is required; type picks modal, form or empty; draft controls form recovery.",
        ko: "fetch.edit<Model>가 준 edit을 받거나, 새 레코드라면 평범한 partial을 받습니다. slice는 필수이고, type으로 modal·form·empty를 고르며, draft가 form 복구를 제어합니다.",
      }),
    },
    {
      name: "Load.Stream",
      desc: l.trans({
        en: "of is any promise or resolved value, children is a function of the value, and fallback shows only while a thenable is pending. This is the one that takes the x<Model>List<Suffix> promise a slice hands out.",
        ko: "of는 promise이거나 이미 해소된 값이고, children은 그 값을 받는 함수이며, fallback은 thenable이 대기 중일 때만 보입니다. slice가 내주는 x<Model>List<Suffix> promise를 받는 것이 바로 이것입니다.",
      }),
    },
    {
      name: "Load.Pagination · Load.Page",
      desc: l.trans({
        en: "The paging control on its own, and the shared SSR/CSR page loader wrapper.",
        ko: "페이지 이동 컨트롤 단독, 그리고 SSR과 CSR이 함께 쓰는 page loader wrapper입니다.",
      }),
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="ui-composition" title={l.trans({ en: "UI Composition", ko: "UI 구성" })}>
        <Docs.Title>{l.trans({ en: "UI Composition", ko: "UI 구성" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Your order list needs a skeleton while it loads, a placeholder when it is empty, a page control at the bottom, a modal for a new order, a second modal for editing one, and a confirmation before anything is deleted. That is six states around one array, and none of them is your product.",
              ko: "주문 목록 화면에는 로딩 중 스켈레톤, 비었을 때의 자리표시자, 하단의 페이지 컨트롤, 새 주문용 모달, 수정용 모달이 하나 더, 그리고 무언가를 지우기 전의 확인창이 필요합니다. 배열 하나를 둘러싼 상태가 여섯 개인데, 그중 어느 것도 당신의 제품은 아닙니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "akanjs/ui ships all six, wired to the generated store. You write the row and the detail view; the shells around them handle loading, empty, paging, refresh and the CRUD modals. This page is the inventory and the composition rules — the client boundary itself is the previous page's subject.",
              ko: "akanjs/ui는 그 여섯 가지를 모두 제공하며, 생성된 store에 이미 연결되어 있습니다. 여러분이 쓰는 것은 행 하나와 상세 화면 하나이고, 그 둘레의 셸이 loading·empty·paging·refresh와 CRUD 모달을 맡습니다. 이 문서는 그 목록과 조합 규칙이며, 클라이언트 경계 자체는 앞 문서의 주제입니다.",
            })}
          </div>
          <Docs.IntroTable type={l.trans({ en: "Export", ko: "Export" })} items={uiRows} />
          <div>
            {l.trans({
              en: "What you write splits the same way. Anything bound to one model lives in that model's folder under lib/, so the module owns its own row, detail view, form and actions; anything reusable across models and not bound to one goes in the app's ui/. A component that needs both is two components.",
              ko: "직접 쓰는 쪽도 같은 방식으로 나뉩니다. 모델 하나에 묶인 것은 lib/ 아래 그 모델의 폴더에 두어 모듈이 자기 행과 상세 화면과 폼과 액션을 직접 소유하게 하고, 여러 모델에서 재사용되며 어느 하나에도 묶이지 않는 것은 앱의 ui/에 둡니다. 둘 다 필요한 component는 사실 component 둘입니다.",
            })}
          </div>
          <Docs.Alert type="error">
            {l.trans({
              en: (
                <span>
                  A third-party package may not be imported from <code>page/**</code>, from a barrel, or from any module
                  component file. Re-export it through a lib first — that is why <code>libs/shared/ui/Field.tsx</code>{" "}
                  extends the framework <code>Field</code> with <code>Rich</code>, <code>Img</code> and <code>Map</code>{" "}
                  instead of each app importing an editor directly.
                </span>
              ),
              ko: (
                <span>
                  서드파티 패키지는 <code>page/**</code>, barrel, 모듈 component 파일에서 import할 수 없습니다. 먼저
                  lib를 거쳐 re-export해야 합니다. <code>libs/shared/ui/Field.tsx</code>가 프레임워크의{" "}
                  <code>Field</code>에 <code>Rich</code>, <code>Img</code>, <code>Map</code>을 더해 확장하는 이유이며,
                  그래서 각 앱이 에디터를 직접 import하지 않습니다.
                </span>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="screen-flow" title={l.trans({ en: "The Shape Of A Model Screen", ko: "모델 화면의 모양" })}>
        <Docs.Title>{l.trans({ en: "The Shape Of A Model Screen", ko: "모델 화면의 모양" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A model almost always produces the same four screens. Users scan a list, create a record, open one, and come back to edit it. Each arrow below is a shell that already exists, so the four screens are four small files rather than four workflows.",
              ko: "모델 하나는 거의 언제나 같은 네 화면을 만들어냅니다. 사용자는 목록을 훑고, 레코드를 만들고, 하나를 열어 보고, 다시 돌아와 수정합니다. 아래의 화살표는 모두 이미 존재하는 셸이므로, 네 화면은 네 개의 workflow가 아니라 네 개의 작은 파일입니다.",
            })}
          </div>
          <Docs.Mermaid
            title={l.trans({ en: "Index, new, view, edit", ko: "목록, 생성, 상세, 수정" })}
            highlightNodes={["Index"]}
            chart={`stateDiagram-v2
  [*] --> Index
  Index: index page<br/>Load.Units renders one Unit per row
  New: new page<br/>Model.New opens the Template
  View: view page<br/>Load.View renders the View
  Edit: edit page<br/>Load.Edit reopens the Template
  Index --> New: new
  New --> View: submit
  Index --> View: pick a Unit
  View --> Edit: edit
  Edit --> View: submit
  View --> Index: back
  View --> [*]: Model.SureToRemove`}
          />
          <div>
            {l.trans({
              en: "Index pages are for discovery: search, scan, page, choose. New and edit pages are controlled input through one Template and a submit action. View pages present one record clearly and then offer the follow-up actions. Underneath all four, the same stack runs in the same order:",
              ko: "index 화면은 탐색을 위한 것입니다. 검색하고, 훑고, 페이지를 넘기고, 고릅니다. new와 edit 화면은 Template 하나와 submit action을 통한 통제된 입력입니다. view 화면은 레코드 하나를 명확히 보여준 뒤 후속 액션을 제시합니다. 네 화면 모두의 아래에서 같은 스택이 같은 순서로 돕니다:",
            })}
          </div>
          <Docs.Mermaid
            title={l.trans({ en: "From the route to the database", ko: "route에서 데이터베이스까지" })}
            highlightNodes={["fetchClient"]}
            chart={`flowchart LR
  route["page()<br/>route entry"] --> server["Unit · View<br/>server components"]
  route --> client["Zone · Template · Util<br/>client components"]
  client --> store["store<br/>st.use · st.do"]
  store --> fetchClient["fetch<br/>generated endpoint calls"]
  route --> fetchClient
  fetchClient --> signal["signal<br/>endpoint · slice"]
  signal --> service["service"]
  service --> document["document"]`}
          />
          <div>
            {l.trans({
              en: "The route reaches fetch directly and a client component reaches it only through a store action, which is the one rule that keeps the two paths from drifting. Four generated helpers are the whole daily surface:",
              ko: "route는 fetch에 직접 닿고, client component는 store action을 통해서만 닿습니다. 이 한 가지 규칙이 두 경로가 어긋나지 않게 합니다. 일상적으로 쓰는 표면은 생성된 helper 넷이 전부입니다:",
            })}
          </div>
          <Docs.IntroTable type={l.trans({ en: "Helper", ko: "헬퍼" })} items={helperRows} />
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="load-shells" title={l.trans({ en: "The Load Shells", ko: "Load 셸" })}>
        <Docs.Title>{l.trans({ en: "The Load Shells", ko: "Load 셸" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Never hand-roll a loading, empty or list state. A Load shell takes the handle the route fetched, seeds the client store from it so the generated pagination, query, sort and refresh actions keep working after hydration, and renders the three states around your row component.",
              ko: "loading, empty, list 상태를 직접 만들지 마세요. Load 셸은 route가 가져온 handle을 받아 client store를 seed하므로 hydration 이후에도 생성된 pagination·query·sort·refresh action이 계속 동작하고, 여러분의 행 component 둘레에 세 가지 상태를 그려 줍니다.",
            })}
          </div>
          <Docs.IntroTable type={l.trans({ en: "Shell", ko: "셸" })} items={loadRows} />
          <div>
            {l.trans({
              en: "The route destructures the handle instead of awaiting it, hands the init field to a Zone and any leftover list promise to a Load.Stream. Both render behind their own boundary as their own data lands, so the page never waits for the slowest query:",
              ko: "route는 handle을 await하는 대신 구조 분해해서, init field는 Zone에 넘기고 남는 list promise는 Load.Stream에 넘깁니다. 둘 다 자기 데이터가 도착하는 대로 자기 boundary 뒤에서 렌더링되므로, page가 가장 느린 query를 기다릴 일이 없습니다:",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/koyo/page/(public)/icecreamOrder/_index.tsx"
            code={`import { fetch, IcecreamOrder } from "@apps/koyo/client";
import { page } from "akanjs/client";
import { Load, Loading } from "akanjs/ui";

export default page().render(() => {
  const { icecreamOrderInitInPublic, icecreamOrderListInPublic } = fetch.initIcecreamOrderInPublic();
  return (
    <>
      <Load.Stream of={icecreamOrderListInPublic} fallback={<Loading.Skeleton active />}>
        {(icecreamOrderList) => <IcecreamOrder.Unit.Total count={icecreamOrderList.length} />}
      </Load.Stream>
      <IcecreamOrder.Zone.Card init={icecreamOrderInitInPublic} />
    </>
  );
});`}
          />
          <Docs.Alert type="warning">
            {l.trans({
              en: (
                <span>
                  <code>x&lt;Model&gt;List&lt;Suffix&gt;</code> and <code>x&lt;Model&gt;Insight&lt;Suffix&gt;</code>{" "}
                  resolve to hydrated model instances, which React Flight refuses as client props. Consume them in a
                  server component or inside a <code>Load.Stream</code> — never pass one to a <code>Zone</code>. The{" "}
                  <code>init</code> field is the one shaped for the boundary.
                </span>
              ),
              ko: (
                <span>
                  <code>x&lt;Model&gt;List&lt;Suffix&gt;</code>와 <code>x&lt;Model&gt;Insight&lt;Suffix&gt;</code>는
                  hydrate된 모델 인스턴스로 해소되는데, React Flight는 이를 client prop으로 거부합니다. server component
                  안이나 <code>Load.Stream</code> 안에서 소비하고, <code>Zone</code>에는 절대 넘기지 마세요. 경계를
                  넘도록 만들어진 field는 <code>init</code>입니다.
                </span>
              ),
            })}
          </Docs.Alert>
          <Docs.Alert type="error">
            {l.trans({
              en: (
                <span>
                  Never call <code>fetch.init*</code> from a client file. From a route it resolves before the first
                  byte; after hydration it is two extra round-trips for a shell the browser already painted. Reload from
                  the client through the generated <code>st.do.init&lt;Model&gt;&lt;Suffix&gt;()</code> instead.
                </span>
              ),
              ko: (
                <span>
                  client 파일에서 <code>fetch.init*</code>을 호출하지 마세요. route에서는 첫 바이트 전에 해소되지만,
                  hydration 이후에는 브라우저가 이미 그린 화면을 위해 왕복 두 번을 더 치르는 일입니다. 클라이언트에서
                  다시 불러올 때는 생성된 <code>st.do.init&lt;Model&gt;&lt;Suffix&gt;()</code>를 쓰세요.
                </span>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="model-shells" title={l.trans({ en: "The CRUD Modals", ko: "CRUD 모달" })}>
        <Docs.Title>{l.trans({ en: "The CRUD Modals", ko: "CRUD 모달" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Creating, editing and removing a record are three workflows every model needs and no model should implement. Each shell takes the slice it operates on, opens the module's own Template, and calls the generated store action on submit.",
              ko: "레코드를 만들고, 고치고, 지우는 것은 모든 모델에 필요하지만 어떤 모델도 직접 구현할 필요가 없는 세 가지 workflow입니다. 각 셸은 자기가 다룰 slice를 받아, 모듈의 Template을 열고, 제출 시 생성된 store action을 호출합니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/koyo/lib/icecreamOrder/IcecreamOrder.Util.tsx"
            code={`"use client";
import { fetch, usePage } from "@apps/koyo/client";
import { Model } from "akanjs/ui";
import { BiPlus, BiTrash } from "react-icons/bi";

export const New = () => {
  const { l } = usePage();
  return (
    <Model.New slice={fetch.slice.icecreamOrder}>
      <BiPlus /> {l("base.create")}
    </Model.New>
  );
};

interface RemoveProps {
  icecreamOrderId: string;
}
export const Remove = ({ icecreamOrderId }: RemoveProps) => {
  const { l } = usePage();
  return (
    <Model.SureToRemove
      modelId={icecreamOrderId}
      name={l("icecreamOrder.modelName")}
      slice={fetch.slice.icecreamOrder}
      redirect="/icecreamOrder"
      trigger={
        <button type="button">
          <BiTrash /> {l("base.remove")}
        </button>
      }
    />
  );
};`}
          />
          <div>
            {l.trans({
              en: "A Util export is named for the endpoint verb minus the model noun, so this file exports New and Remove rather than NewIcecreamOrder. Three things about these shells are worth knowing before you reach for one:",
              ko: "Util의 export는 endpoint 동사에서 모델 명사를 뺀 이름을 씁니다. 그래서 이 파일은 NewIcecreamOrder가 아니라 New와 Remove를 내보냅니다. 이 셸을 쓰기 전에 알아둘 것이 셋 있습니다:",
            })}
          </div>
          <div className="my-4 space-y-3">
            <div className={panelRecipe({ radius: "lg", padding: "sm" })}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-primary">🎯</span>
                <strong className="text-primary">{"trigger"}</strong>
              </div>
              <div className="text-foreground/70 text-sm">
                {l.trans({
                  en: "Replaces the default button that opens the modal. On Model.New and Model.Edit children is the form body handed to the modal, not the label, and neither takes a className; Model.SureToRemove takes no children at all, so its trigger is the whole control.",
                  ko: "모달을 여는 기본 버튼을 대체합니다. Model.New와 Model.Edit에서 children은 라벨이 아니라 모달로 넘어가는 폼 본문이며, 둘 다 className을 받지 않습니다. Model.SureToRemove는 children을 아예 받지 않으므로 trigger가 컨트롤 전체입니다.",
                })}
              </div>
            </div>
            <div className={panelRecipe({ radius: "lg", padding: "sm" })}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-primary">💾</span>
                <strong className="text-primary">{"draft"}</strong>
              </div>
              <div className="text-foreground/70 text-sm">
                {l.trans({
                  en: "Form recovery, on by default. The shell saves the whole form as the user types and offers it back on the next open, scoped to the record id for an edit and to the seed plus the route for a new form, per signed-in user. Secret and hidden values are never saved.",
                  ko: "폼 복구이며 기본으로 켜져 있습니다. 사용자가 입력하는 동안 폼 전체를 저장했다가 다음에 열 때 돌려줍니다. scope는 edit이면 레코드 id, new면 seed와 route이고, 로그인한 사용자별로 분리됩니다. secret과 hidden 값은 저장하지 않습니다.",
                })}
              </div>
            </div>
            <div className={panelRecipe({ radius: "lg", padding: "sm" })}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-primary">🧷</span>
                <strong className="text-primary">{"name"}</strong>
              </div>
              <div className="text-foreground/70 text-sm">
                {l.trans({
                  en: "Model.SureToRemove shows this in the confirmation, and with typeNameToRemove it also makes the user type it back before the delete button enables.",
                  ko: "Model.SureToRemove가 확인창에 보여주는 값이며, typeNameToRemove를 켜면 삭제 버튼이 활성화되기 전에 사용자가 이 값을 직접 입력하게 합니다.",
                })}
              </div>
            </div>
          </div>
          <div>
            {l.trans({
              en: 'Never persist form values yourself. The old per-field cache and cacheKey props are deprecated and store nothing: they covered five control types, keyed on the translated label, and restored over server data. draft={false} turns recovery off and draft="<scope>" names the scope when the context is in neither the id nor the seed.',
              ko: '폼 값을 직접 저장하지 마세요. 예전의 field별 cache와 cacheKey prop은 deprecated이며 아무것도 저장하지 않습니다. 컨트롤 다섯 종류만 다뤘고, 번역된 라벨을 키로 썼으며, 서버 데이터 위에 덮어썼습니다. draft={false}는 복구를 끄고, draft="<scope>"는 맥락이 id에도 seed에도 없을 때 scope를 직접 지정합니다.',
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide
        id="forms-and-fields"
        title={l.trans({ en: "Forms Are Store-Driven", ko: "폼은 store가 움직입니다" })}
      >
        <Docs.Title>{l.trans({ en: "Forms Are Store-Driven", ko: "폼은 store가 움직입니다" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A Template holds no state of its own. Every control reads one key of <model>Form and writes it through the generated setter, which is why a Template contains zero useState and why a draft can be restored into it at all.",
              ko: "Template은 자기 상태를 갖지 않습니다. 모든 컨트롤이 <model>Form의 key 하나를 읽고 생성된 setter를 통해 씁니다. 그래서 Template에는 useState가 하나도 없고, 그래서 draft를 되돌려 넣을 수 있습니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/koyo/lib/icecreamOrder/IcecreamOrder.Template.tsx"
            code={`"use client";
import { cnst, st, usePage } from "@apps/koyo/client";
import { Field } from "@libs/shared/ui";
import { Layout } from "akanjs/ui";

interface GeneralProps {
  className?: string;
}
export const General = ({ className }: GeneralProps) => {
  const icecreamOrderForm = st.use.icecreamOrderForm();
  const { l } = usePage();
  return (
    <Layout.Template className={className}>
      <Field.Number
        label={l("icecreamOrder.size")}
        desc={l("icecreamOrder.size.desc")}
        value={icecreamOrderForm.size}
        onChange={st.do.setSizeOnIcecreamOrder}
      />
      <Field.MultiToggleSelect
        label={l("icecreamOrder.toppings")}
        desc={l("icecreamOrder.toppings.desc")}
        value={icecreamOrderForm.toppings}
        items={cnst.Topping}
        onChange={st.do.setToppingsOnIcecreamOrder}
      />
    </Layout.Template>
  );
};`}
          />
          <Docs.Alert type="warning">
            {l.trans({
              en: (
                <span>
                  Pass the setter <strong>by reference</strong>.{" "}
                  <code>{"onChange={(v) => st.do.setSizeOnIcecreamOrder(v)}"}</code> runs identically, but the arrow is
                  a fresh anonymous closure, so the control emits no <code>data-akan-action</code> and publishes no
                  agent tool for that field. Two lines that read the same, one of which silently stops working for the
                  in-page agent, the E2E selectors and any external browser agent. Normalize with the control&apos;s{" "}
                  <code>transform</code> prop instead.
                </span>
              ),
              ko: (
                <span>
                  setter는 <strong>참조로</strong> 넘기세요.{" "}
                  <code>{"onChange={(v) => st.do.setSizeOnIcecreamOrder(v)}"}</code>는 동작이 같지만, 화살표 함수는 매번
                  새로 만들어지는 익명 클로저라서 컨트롤이 <code>data-akan-action</code>을 내보내지 않고 그 field에 대한
                  에이전트 tool도 publish되지 않습니다. 똑같이 읽히는 두 줄 중 하나가 인페이지 에이전트와 E2E selector와
                  외부 브라우저 에이전트에게는 조용히 동작을 멈추는 것입니다. 값 변환이 필요하면 컨트롤의{" "}
                  <code>transform</code> prop을 쓰세요.
                </span>
              ),
            })}
          </Docs.Alert>
          <div>
            {l.trans({
              en: 'Nested rows are written with st.do.writeOnIcecreamOrder("toppings.3.name", value) plus the generated add<Field>OnX and sub<Field>OnX actions. An image or file field is a relation to the File model, and the store generates upload<Field>On<Model>(fileList) for it — never hand-roll a data-URL fallback.',
              ko: '중첩된 행은 st.do.writeOnIcecreamOrder("toppings.3.name", value)와 생성된 add<Field>OnX, sub<Field>OnX action으로 씁니다. 이미지나 파일 field는 File 모델에 대한 relation이고, store가 그에 맞춰 upload<Field>On<Model>(fileList)를 생성합니다. data-URL 대체 구현을 직접 만들지 마세요.',
            })}
          </div>
          <div>
            {l.trans({
              en: "A store action returns nothing. Every method of a store class dispatches through st.do.<action>() and is typed void, so a returned value is unreachable — write it into state with this.set({ ... }) instead. And do not catch inside one: let the framework toast the Err. Its whole job is to read state, call fetch, and update loading, list and form state; the password, permission, stock and payment rules stay in the service, never duplicated here.",
              ko: "store action은 아무것도 반환하지 않습니다. store 클래스의 모든 메서드는 st.do.<action>()을 통해 디스패치되고 void로 타입이 정해지므로, 반환한 값에는 아무도 닿을 수 없습니다. 대신 this.set({ ... })으로 state에 쓰세요. 그리고 action 안에서 catch하지 마세요. Err는 프레임워크가 토스트로 띄웁니다. action이 하는 일은 state를 읽고 fetch를 호출하고 loading·list·form 상태를 갱신하는 것뿐입니다. 비밀번호, 권한, 재고, 결제 규칙은 service에 남고 여기에 중복되지 않습니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="i18n" title={l.trans({ en: "One Vocabulary, Many Screens", ko: "하나의 어휘, 여러 화면" })}>
        <Docs.Title>{l.trans({ en: "One Vocabulary, Many Screens", ko: "하나의 어휘, 여러 화면" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Every string a user reads goes through the module's dictionary. Field labels, enum values, error messages and the model's own name are declared once as [en, ko] pairs, and the components read them by key — so the vocabulary lives next to the model rather than scattered through the components that happen to display it.",
              ko: "사용자가 읽는 모든 문구는 모듈의 dictionary를 거칩니다. field 라벨, enum 값, 오류 메시지, 모델 이름까지 [en, ko] 쌍으로 한 번 선언하고 component는 key로 읽습니다. 그래서 어휘는 그것을 표시하게 된 component들에 흩어지지 않고 모델 옆에 있습니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/koyo/lib/icecreamOrder/icecreamOrder.dictionary.ts"
            code={`import { modelDictionary } from "akanjs/dictionary"; // [!code collapse:4]

import type { IcecreamOrder, IcecreamOrderInsight, IcecreamOrderStatus } from "./icecreamOrder.constant";

export const dictionary = modelDictionary(["en", "ko"])
  .of((t) => t(["Icecream Order", "아이스크림 주문"]).desc(["One customer order", "고객 주문 한 건"]))
  .model<IcecreamOrder>((t) => ({
    size: t(["Size", "사이즈"]).desc(["Cup size in millilitres", "컵 용량, 밀리리터"]),
    toppings: t(["Toppings", "토핑"]).desc(["Toppings on the order", "주문에 올린 토핑"]),
    status: t(["Status", "상태"]).desc(["Current order status", "현재 주문 상태"]),
  }))
  .insight<IcecreamOrderInsight>((t) => ({}))
  .enum<IcecreamOrderStatus>("icecreamOrderStatus", (t) => ({
    active: t(["Active", "접수됨"]).desc(["Created and waiting", "생성되어 대기 중"]),
    served: t(["Served", "제공됨"]).desc(["Handed to the customer", "고객에게 전달됨"]),
  }))
  .error({
    alreadyServed: ["This order has already been served", "이미 제공된 주문입니다."],
  });`}
          />
          <div>
            {l.trans({
              en: 'A component then renders l("icecreamOrder.size") for a field label, l("icecreamOrder.modelName") for the model, and l.trans({ en, ko }) for a one-off sentence that belongs to no model. usePage() resolves all three on both sides, so a fully localized screen never needs a client boundary for its text.',
              ko: 'component는 field 라벨에는 l("icecreamOrder.size")를, 모델 이름에는 l("icecreamOrder.modelName")을, 어느 모델에도 속하지 않는 일회성 문장에는 l.trans({ en, ko })를 씁니다. usePage()가 셋 모두를 양쪽에서 해결하므로, 완전히 다국어인 화면도 문구 때문에 client 경계를 만들 일이 없습니다.',
            })}
          </div>
          <div>
            {l.trans({
              en: (
                <span>
                  That same vocabulary, the same <code>fetch</code> and the same store back a customer web site, an
                  admin console, a partner portal and a mobile app — those are client surfaces of one app, not separate
                  apps, and which one a screen belongs to is a product decision before it is an infrastructure one.{" "}
                  <Link href="/docs/core/multi-client" className="text-primary">
                    Multi Client
                  </Link>{" "}
                  covers how a basePath gives each surface its own routes, layout and permissions.
                </span>
              ),
              ko: (
                <span>
                  같은 어휘, 같은 <code>fetch</code>, 같은 store가 고객 웹사이트와 관리자 콘솔과 파트너 포털과 모바일
                  앱을 함께 받칩니다. 이들은 별개의 앱이 아니라 한 앱의 client 표면이고, 어떤 화면이 어디에 속하는지는
                  인프라 결정이기 전에 제품 결정입니다. basePath가 각 표면에 자기 route와 layout과 permission을 어떻게
                  주는지는{" "}
                  <Link href="/docs/core/multi-client" className="text-primary">
                    다중 클라이언트
                  </Link>{" "}
                  문서에서 다룹니다.
                </span>
              ),
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <DocsToc />
    </Scroll>
  );
});
