import { usePage } from "@apps/akan/client";
import { Code, Divider, Docs, DocsToc } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";
import { Link } from "akanjs/ui";

export default page().render(() => {
  const { l } = usePage();

  const termRows = [
    {
      name: "light model",
      desc: l.trans({
        en: "The `Light<Model>` class: the few fields a list or card needs. Server and client both hold it.",
        ko: "`Light<Model>` 클래스입니다. 목록이나 카드에 필요한 필드 몇 개만 담고, 서버와 클라이언트가 모두 가집니다.",
      }),
    },
    {
      name: "full model",
      desc: l.trans({
        en: "The `<Model>` class: every field of one record. Detail screens use it.",
        ko: "`<Model>` 클래스입니다. 레코드 하나의 모든 필드를 담고, 상세 화면에서 씁니다.",
      }),
    },
    {
      name: "slice",
      desc: l.trans({
        en: "A server query that fills a list in the client store.",
        ko: "클라이언트 store의 목록을 채우는 서버 쿼리입니다.",
      }),
    },
    {
      name: "endpoint",
      desc: l.trans({
        en: "One query, mutation, message or pubsub a caller can reach.",
        ko: "호출하는 쪽이 부를 수 있는 query, mutation, message, pubsub 하나입니다.",
      }),
    },
    {
      name: "guard",
      desc: l.trans({
        en: "A class that decides whether the caller may run an endpoint.",
        ko: "호출한 사람이 endpoint를 실행해도 되는지 판정하는 클래스입니다.",
      }),
    },
    {
      name: ["Load.Units", "Load.View"],
      desc: l.trans({
        en: "Wrappers that fill the store from route data and draw the loading and empty states.",
        ko: "route가 넘긴 데이터로 store를 채우고, 로딩 상태와 빈 상태를 대신 그려 주는 래퍼입니다.",
      }),
    },
  ];

  const logicFiles = [
    {
      href: "/conventions/module/abstract",
      title: <span className="font-mono">model.abstract.md</span>,
      desc: l.trans({
        en: "What the module owns, the 2–5 rules code cannot show, and any workflow. Read it first.",
        ko: "모듈이 맡는 일, 코드로는 드러나지 않는 규칙 2~5개, 필요하면 상태 흐름을 적습니다. 가장 먼저 읽습니다.",
      }),
    },
    {
      href: "/conventions/module/constant",
      title: <span className="font-mono">model.constant.ts</span>,
      desc: l.trans({
        en: "The data shape: fields, enums, the five model layers, helpers, hidden/secret and resolved fields.",
        ko: "데이터 모양입니다. 필드, enum, 모델 다섯 단계, 헬퍼, hidden/secret 필드, resolve 필드를 정의합니다.",
      }),
    },
    {
      href: "/conventions/module/dictionary",
      title: <span className="font-mono">model.dictionary.ts</span>,
      desc: l.trans({
        en: "Words users read: fields, insights, queries, sorts, enums, slices, endpoints, errors, UI text.",
        ko: "사용자가 읽는 말입니다. 필드, insight, query, sort, enum, slice, endpoint, 에러, UI 문구에 이름을 붙입니다.",
      }),
    },
    {
      href: "/conventions/module/document",
      title: <span className="font-mono">model.document.ts</span>,
      desc: l.trans({
        en: "How stored documents behave: filters, document methods, model helpers, indexes, schema hooks.",
        ko: "저장된 document의 동작입니다. filter, document method, 모델 헬퍼, index, schema hook을 정의합니다.",
      }),
    },
    {
      href: "/conventions/module/service",
      title: <span className="font-mono">model.service.ts</span>,
      desc: l.trans({
        en: "Business workflows, built from document methods, injected services and database operations.",
        ko: "비즈니스 흐름입니다. document method, 주입받은 service, 데이터베이스 작업을 엮어 구현합니다.",
      }),
    },
    {
      href: "/conventions/module/signal",
      title: <span className="font-mono">model.signal.ts</span>,
      desc: l.trans({
        en: "Where server work starts: slices, endpoints, message, pubsub, tasks, guards, resolved fields.",
        ko: "서버 작업이 시작되는 곳입니다. slice, endpoint, 실시간 message와 pubsub, 내부 작업, guard, resolve 필드를 둡니다.",
      }),
    },
    {
      href: "/conventions/module/store",
      title: <span className="font-mono">model.store.ts</span>,
      desc: l.trans({
        en: "Client state: form and list state, generated fetch calls, toasts, and the actions UI calls.",
        ko: "클라이언트 상태입니다. 폼·목록 상태, 생성된 fetch 호출, 토스트, UI가 부르는 action을 맡습니다.",
      }),
    },
  ];

  const uiFiles = [
    {
      href: "/conventions/module/template",
      title: <span className="font-mono">Model.Template.tsx</span>,
      desc: l.trans({
        en: "The form. Its fields bind to the store's form state through the generated setters.",
        ko: "폼입니다. 각 필드를 생성된 setter로 store의 폼 상태에 연결합니다.",
      }),
    },
    {
      href: "/conventions/module/unit",
      title: <span className="font-mono">Model.Unit.tsx</span>,
      desc: l.trans({
        en: "One piece of a light model: a card, row, avatar, column or compact summary.",
        ko: "light model을 그리는 작은 조각입니다. 카드, 행, 아바타, 열, 짧은 요약 같은 것입니다.",
      }),
    },
    {
      href: "/conventions/module/view",
      title: <span className="font-mono">Model.View.tsx</span>,
      desc: l.trans({
        en: "One full model in detail: detail pages, view modals, sections that need every field.",
        ko: "full model 하나의 상세 화면입니다. 상세 페이지, 보기 모달, 모든 필드가 필요한 섹션에 씁니다.",
      }),
    },
    {
      href: "/conventions/module/util",
      title: <span className="font-mono">Model.Util.tsx</span>,
      desc: l.trans({
        en: "Small client controls: action buttons, toolboxes, dialogs, query panels, navigation helpers.",
        ko: "작은 클라이언트 컨트롤입니다. 액션 버튼, 툴박스, 다이얼로그, 쿼리 패널, 내비게이션 도우미 등이 있습니다.",
      }),
    },
    {
      href: "/conventions/module/zone",
      title: <span className="font-mono">Model.Zone.tsx</span>,
      desc: l.trans({
        en: (
          <span>
            A page section. It feeds route data to <code>Load.Units</code> or <code>Load.View</code> and composes Unit,
            View and Util.
          </span>
        ),
        ko: (
          <span>
            페이지 섹션입니다. route가 넘긴 데이터를 <code>Load.Units</code>나 <code>Load.View</code>에 넣고 Unit, View,
            Util을 조립합니다.
          </span>
        ),
      }),
    },
  ];

  const flowSteps = [
    {
      name: "abstract",
      desc: l.trans({
        en: "Write down the business intent and the domain rules that should last.",
        ko: "비즈니스 의도와 오래 유지될 도메인 규칙부터 적습니다.",
      }),
    },
    {
      name: "constant",
      desc: l.trans({
        en: "Define the business shape: fields, enums and the model layers.",
        ko: "필드, enum, 모델 단계로 비즈니스 데이터의 모양을 정합니다.",
      }),
    },
    {
      name: "dictionary",
      desc: l.trans({
        en: "Give those fields, actions, errors and UI phrases the names users see.",
        ko: "그 필드, 동작, 에러, UI 문구에 사용자가 볼 이름을 붙입니다.",
      }),
    },
    {
      name: "document",
      desc: l.trans({
        en: "Describe how stored documents are queried, changed, indexed and loaded.",
        ko: "저장된 document를 조회하고, 바꾸고, 인덱싱하고, 불러오는 방식을 정합니다.",
      }),
    },
    {
      name: "service",
      desc: l.trans({
        en: "Build business workflows from document helpers and other services.",
        ko: "document 헬퍼와 다른 service를 엮어 비즈니스 흐름을 구현합니다.",
      }),
    },
    {
      name: "signal",
      desc: l.trans({
        en: "Expose server behaviour as typed slices, endpoints, realtime channels and tasks.",
        ko: "서버 동작을 타입이 있는 slice, endpoint, 실시간 채널, 작업으로 공개합니다.",
      }),
    },
    {
      name: "store",
      desc: l.trans({
        en: "Connect the generated fetch API to client state, form state and UI actions.",
        ko: "생성된 fetch API를 클라이언트 상태, 폼 상태, UI action에 연결합니다.",
      }),
    },
    {
      name: "UI",
      desc: l.trans({
        en: "Draw forms, lists, detail views, actions and page sections.",
        ko: "폼, 목록, 상세 화면, 동작, 페이지 섹션을 그립니다.",
      }),
    },
  ];

  const boundaryColumns = [
    { key: "what", label: l.trans({ en: "What", ko: "무엇을" }) },
    { key: "where", label: l.trans({ en: "Where", ko: "어디에" }), code: true },
    { key: "holds", label: l.trans({ en: "What goes there", ko: "담는 것" }) },
  ];

  const boundaryRows = [
    {
      what: l.trans({ en: "Business rules", ko: "비즈니스 규칙" }),
      where: "service · document · constant",
      holds: l.trans({
        en: "Service workflows, document methods and constant helpers. Never inside render code.",
        ko: "service 흐름, document method, constant 헬퍼로 둡니다. render 코드 안에 숨기지 않습니다.",
      }),
    },
    {
      what: l.trans({ en: "API and access", ko: "API와 접근 권한" }),
      where: "signal",
      holds: l.trans({
        en: "Slices, endpoints, guards, internal args, realtime channels and tasks.",
        ko: "slice, endpoint, guard, internal arg, 실시간 채널, 작업을 둡니다.",
      }),
    },
    {
      what: l.trans({ en: "Client coordination", ko: "클라이언트 조율" }),
      where: "store",
      holds: l.trans({
        en: "Fetch calls, form and list state, toasts and UI actions.",
        ko: "fetch 호출, 폼·목록 상태, 토스트, UI action을 둡니다.",
      }),
    },
    {
      what: l.trans({ en: "Display", ko: "표시" }),
      where: "Unit · View",
      holds: l.trans({
        en: "Unit repeats a light model; View shows one full model in detail.",
        ko: "반복되는 light model은 Unit, full model 하나의 상세는 View로 그립니다.",
      }),
    },
    {
      what: l.trans({ en: "Page sections", ko: "페이지 섹션" }),
      where: "Zone",
      holds: l.trans({
        en: "Load wrappers, Unit/View, Util controls and the section's layout.",
        ko: "Load 래퍼, Unit/View, Util 컨트롤, 섹션 배치를 조립합니다.",
      }),
    },
    {
      what: l.trans({ en: "Small controls", ko: "작은 컨트롤" }),
      where: "Util",
      holds: l.trans({
        en: "Toolboxes, action buttons, dialog triggers, query panels and navigation helpers.",
        ko: "툴박스, 액션 버튼, 다이얼로그를 여는 버튼, 쿼리 패널, 내비게이션 도우미를 둡니다.",
      }),
    },
  ];

  const pathColumns = [
    { key: "model", label: l.trans({ en: "New model", ko: "새 모델" }) },
    { key: "list", label: l.trans({ en: "List", ko: "목록" }) },
    { key: "detail", label: l.trans({ en: "Detail/edit", ko: "상세·수정" }) },
    { key: "action", label: l.trans({ en: "Action", ko: "동작" }) },
  ];

  const pathTasks = [
    {
      label: l.trans({ en: "New model", ko: "새 모델" }),
      desc: l.trans({
        en: "defining a business object from scratch.",
        ko: "비즈니스 객체를 처음부터 정의할 때.",
      }),
    },
    {
      label: l.trans({ en: "List", ko: "목록" }),
      desc: l.trans({
        en: "a page needs list data, filtering, pagination and cards.",
        ko: "페이지에 목록 데이터, 필터, 페이지 나누기, 카드가 필요할 때.",
      }),
    },
    {
      label: l.trans({ en: "Detail/edit", ko: "상세·수정" }),
      desc: l.trans({
        en: "showing a model's full data, or editing an existing one.",
        ko: "모델의 전체 데이터를 보여 주거나, 이미 있는 모델을 수정할 때.",
      }),
    },
    {
      label: l.trans({ en: "Action", ko: "동작" }),
      desc: l.trans({
        en: "a user's click should run a business workflow.",
        ko: "사용자의 클릭이 비즈니스 흐름을 실행해야 할 때.",
      }),
    },
  ];

  const pathGroups = [
    {
      label: l.trans({ en: "Logic files", ko: "로직 파일" }),
      rows: [
        {
          name: "abstract",
          desc: l.trans({
            en: "Every path starts here, with the rules the change must keep.",
            ko: "모든 경로의 출발점입니다. 변경이 지켜야 할 규칙을 먼저 확인합니다.",
          }),
          marks: { model: true, list: true, detail: true, action: true },
        },
        {
          name: "constant",
          desc: l.trans({
            en: "The new object's fields and model layers.",
            ko: "새 객체의 필드와 모델 단계를 정합니다.",
          }),
          marks: { model: true, list: false, detail: false, action: false },
        },
        {
          name: "dictionary",
          desc: l.trans({
            en: "Names for the new fields, errors and UI text.",
            ko: "새 필드, 에러, UI 문구에 이름을 붙입니다.",
          }),
          marks: { model: true, list: false, detail: false, action: false },
        },
        {
          name: "document",
          desc: l.trans({
            en: "Filters, document methods and indexes for the stored data.",
            ko: "저장된 데이터의 filter, document method, index를 정합니다.",
          }),
          marks: { model: true, list: false, detail: false, action: false },
        },
        {
          name: "service",
          desc: l.trans({
            en: "The workflow the new model or the click runs.",
            ko: "새 모델이나 클릭이 실행할 비즈니스 흐름을 구현합니다.",
          }),
          marks: { model: true, list: false, detail: false, action: true },
        },
        {
          name: "signal",
          desc: l.trans({
            en: "A slice for a list, the `get` guard behind `view<Model>` for detail, an endpoint for an action.",
            ko: "목록은 slice, 상세는 `view<Model>` 조회에 걸린 `get` guard, 동작은 endpoint를 봅니다.",
          }),
          marks: { model: true, list: true, detail: true, action: true },
        },
        {
          name: "store",
          desc: l.trans({
            en: "The state the screen reads. For an action, the store action a button calls.",
            ko: "화면이 읽는 상태입니다. 동작이라면 버튼이 부를 store action을 봅니다.",
          }),
          marks: { model: true, list: true, detail: true, action: true },
        },
      ],
    },
    {
      label: l.trans({ en: "UI files", ko: "UI 파일" }),
      rows: [
        {
          name: "Zone",
          desc: l.trans({
            en: "The section that takes the route's data and fills the list or the detail.",
            ko: "route가 넘긴 데이터로 목록이나 상세 화면을 채우는 섹션입니다.",
          }),
          marks: { model: false, list: true, detail: true, action: false },
        },
        {
          name: "Unit",
          desc: l.trans({
            en: "One card or row of the list.",
            ko: "목록의 카드나 행 하나입니다.",
          }),
          marks: { model: false, list: true, detail: false, action: false },
        },
        {
          name: "View",
          desc: l.trans({
            en: "The detail of one full record.",
            ko: "레코드 하나의 상세 화면입니다.",
          }),
          marks: { model: false, list: false, detail: true, action: false },
        },
        {
          name: "Template",
          desc: l.trans({
            en: "The edit form. For an action, the button can live here or in Util.",
            ko: "수정 폼입니다. 동작 버튼은 여기나 Util 중 한 곳에 둡니다.",
          }),
          marks: { model: false, list: false, detail: true, action: true },
        },
        {
          name: "Util",
          desc: l.trans({
            en: "The action's button when it is a control of its own.",
            ko: "동작 버튼이 독립된 컨트롤이라면 여기에 둡니다.",
          }),
          marks: { model: false, list: false, detail: false, action: true },
        },
      ],
    },
  ];

  const practicalRules = [
    l.trans({
      en: (
        <>
          <strong>Connect files through generated types.</strong> Let <code>cnst</code>, <code>fetch</code> and{" "}
          <code>st</code> carry shapes between files instead of copying them by hand.
        </>
      ),
      ko: (
        <>
          <strong>파일은 생성된 타입으로 잇습니다.</strong> 모양을 손으로 복사하지 말고 <code>cnst</code>,{" "}
          <code>fetch</code>, <code>st</code>가 파일 사이를 잇게 둡니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>Server before UI.</strong> When a feature changes stored data, design the server behaviour first.
        </>
      ),
      ko: (
        <>
          <strong>UI보다 서버가 먼저입니다.</strong> 기능이 저장된 데이터를 바꾼다면 서버 동작부터 설계합니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>UI files compose and present.</strong> Business decisions never hide in them; a display or predicate
          rule goes on <code>{"Light<Model>"}</code> as a method.
        </>
      ),
      ko: (
        <>
          <strong>UI 파일은 조립하고 보여 주기만 합니다.</strong> 비즈니스 결정을 그 안에 숨기지 않고, 표시나 판정
          규칙은 <code>{"Light<Model>"}</code>의 메서드로 둡니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>Split before a Zone grows.</strong> When a section gets large, move display into Unit/View and
          controls into Util first.
        </>
      ),
      ko: (
        <>
          <strong>Zone을 키우기 전에 나눕니다.</strong> 섹션이 커지면 표시는 Unit/View로, 컨트롤은 Util로 먼저 옮깁니다.
        </>
      ),
    }),
  ];

  return (
    <Scroll>
      <Scroll.Slide id="module-overview" title={l.trans({ en: "Module Overview", ko: "모듈 개요" })}>
        <Docs.Title>{l.trans({ en: "Module Overview", ko: "모듈 개요" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "An Akan module is one folder for one business feature. The model's shape, its wording, storage, workflows, API, client state and UI all sit side by side in it.",
              ko: "Akan 모듈은 비즈니스 기능 하나를 담는 폴더입니다. 모델의 모양, 화면 문구, 저장 방식, 비즈니스 흐름, API, 클라이언트 상태, UI가 한 폴더에 나란히 놓입니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "This page is a map for choosing which file to open next. Syntax and examples live on each file's own page.",
              ko: "이 페이지는 다음에 열 파일을 고르기 위한 지도입니다. 문법과 예시는 파일별 문서에 있습니다.",
            })}
          </div>
          <Docs.SubSubTitle>{l.trans({ en: "An Example Module", ko: "예시 모듈" })}</Docs.SubSubTitle>
          <div>
            {l.trans({
              en: (
                <span>
                  The <code>banner</code> module in <code>libs/shared</code> looks like this:
                </span>
              ),
              ko: (
                <span>
                  <code>libs/shared</code>의 <code>banner</code> 모듈은 이렇게 생겼습니다:
                </span>
              ),
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="libs/shared/lib/banner/"
            language="bash"
            showLineNumbers={false}
            copy={false}
            code={`libs/shared/lib/banner/
├── banner.abstract.md
├── banner.constant.ts
├── banner.dictionary.ts
├── banner.document.ts
├── banner.service.ts
├── banner.signal.ts
├── banner.signal.spec.ts
├── banner.signal.test.ts
├── banner.store.ts
├── Banner.Template.tsx
├── Banner.Unit.tsx
├── Banner.Util.tsx
├── Banner.View.tsx
├── Banner.Zone.tsx
└── index.ts`}
          />
          <ul className="my-4 list-disc space-y-2 pl-5">
            <li>
              {l.trans({
                en: (
                  <>
                    <strong>Lowercase files are logic.</strong> They are named <code>{"<model>.<role>.ts"}</code> and
                    hold data, storage, API and client state.
                  </>
                ),
                ko: (
                  <>
                    <strong>소문자 파일은 로직입니다.</strong> <code>{"<model>.<역할>.ts"}</code> 이름으로 데이터, 저장,
                    API, 클라이언트 상태를 맡습니다.
                  </>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <>
                    <strong>PascalCase files are UI.</strong> Their components are reached through the model's
                    namespace: <code>Card</code> in <code>Banner.Unit.tsx</code> is{" "}
                    <code>{"<Banner.Unit.Card />"}</code>.
                  </>
                ),
                ko: (
                  <>
                    <strong>PascalCase 파일은 UI입니다.</strong> 컴포넌트는 모델 네임스페이스로 부릅니다.{" "}
                    <code>Banner.Unit.tsx</code>의 <code>Card</code>는 <code>{"<Banner.Unit.Card />"}</code>입니다.
                  </>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <>
                    <strong>
                      <code>index.ts</code> is generated.
                    </strong>{" "}
                    Never edit it. <code>*.signal.spec.ts</code> holds test fixtures and <code>*.signal.test.ts</code>{" "}
                    the assertions.
                  </>
                ),
                ko: (
                  <>
                    <strong>
                      <code>index.ts</code>는 자동 생성됩니다.
                    </strong>{" "}
                    손으로 고치지 않습니다. <code>*.signal.spec.ts</code>에는 테스트 fixture를,{" "}
                    <code>*.signal.test.ts</code>에는 검증을 둡니다.
                  </>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <>
                    <strong>This page covers database modules</strong> in <code>{"lib/<model>"}</code>.{" "}
                    <Link href="/conventions/service/overview" className="text-primary">
                      Service modules
                    </Link>{" "}
                    (<code>{"lib/_<service>"}</code>) and{" "}
                    <Link href="/conventions/scalar/overview" className="text-primary">
                      scalar modules
                    </Link>{" "}
                    (<code>{"lib/__scalar/<scalar>"}</code>) have their own overview pages.
                  </>
                ),
                ko: (
                  <>
                    <strong>이 페이지는 데이터베이스 모듈을 다룹니다.</strong> 위치는 <code>{"lib/<model>"}</code>
                    입니다.{" "}
                    <Link href="/conventions/service/overview" className="text-primary">
                      서비스 모듈
                    </Link>
                    (<code>{"lib/_<service>"}</code>)과{" "}
                    <Link href="/conventions/scalar/overview" className="text-primary">
                      스칼라 모듈
                    </Link>
                    (<code>{"lib/__scalar/<scalar>"}</code>)은 개요 문서가 따로 있습니다.
                  </>
                ),
              })}
            </li>
          </ul>
          <Docs.SubSubTitle>{l.trans({ en: "Words used on this page", ko: "이 페이지에서 쓰는 말" })}</Docs.SubSubTitle>
          <Docs.IntroTable type={l.trans({ en: "Term", ko: "용어" })} items={termRows} />
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="module-file-map" title={l.trans({ en: "Module File Map", ko: "모듈 파일 지도" })}>
        <Docs.Title>{l.trans({ en: "Module File Map", ko: "모듈 파일 지도" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A module's files fall into two groups: seven lowercase logic files and five PascalCase UI files. Each card opens that file's guide.",
              ko: "모듈 파일은 두 가지로 나뉩니다. 소문자 로직 파일 일곱 개와 PascalCase UI 파일 다섯 개입니다. 카드를 누르면 그 파일의 문서로 이동합니다.",
            })}
          </div>
          <Docs.SubSubTitle>{l.trans({ en: "Logic Files", ko: "로직 파일" })}</Docs.SubSubTitle>
          <Docs.LinkGrid items={logicFiles} />
          <Docs.SubSubTitle>{l.trans({ en: "UI Files", ko: "UI 파일" })}</Docs.SubSubTitle>
          <div>
            {l.trans({
              en: (
                <span>
                  <code>Unit</code> and <code>View</code> are server components. <code>Template</code>,{" "}
                  <code>Zone</code> and <code>Util</code> are client components and start with{" "}
                  <code>{'"use client"'}</code>.
                </span>
              ),
              ko: (
                <span>
                  <code>Unit</code>과 <code>View</code>는 서버 컴포넌트입니다. <code>Template</code>, <code>Zone</code>,{" "}
                  <code>Util</code>은 클라이언트 컴포넌트라서 첫 줄에 <code>{'"use client"'}</code>를 붙입니다.
                </span>
              ),
            })}
          </div>
          <Docs.LinkGrid items={uiFiles} />
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide
        id="server-client-flow"
        title={l.trans({ en: "Server To Client Flow", ko: "서버에서 클라이언트까지" })}
      >
        <Docs.Title>{l.trans({ en: "Server To Client Flow", ko: "서버에서 클라이언트까지" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A module usually grows from the data shape to storage, then to the API, client state and UI. Not every feature needs every file, but this order keeps each file's job clear.",
              ko: "모듈은 보통 데이터 모양에서 시작해 저장, API, 클라이언트 상태, UI 순서로 자랍니다. 모든 기능에 모든 파일이 필요하지는 않지만, 이 순서를 따르면 파일마다 맡은 일이 분명해집니다.",
            })}
          </div>
          <ol className="my-4 list-decimal space-y-2 pl-5">
            {flowSteps.map(({ name, desc }) => (
              <li key={name}>
                <strong>
                  <code>{name}</code>
                </strong>{" "}
                — {desc}
              </li>
            ))}
          </ol>
          <div>
            {l.trans({
              en: "As a diagram, the chain ends in UI, which splits into the five UI roles:",
              ko: "그림으로 보면 흐름은 UI에서 끝나고, UI는 다섯 역할로 갈라집니다:",
            })}
          </div>
          <Docs.Flow
            title={l.trans({ en: "One module, data to UI", ko: "모듈 하나, 데이터에서 UI까지" })}
            direction="TB"
            nodes={{
              constant: { label: "constant" },
              dictionary: { label: "dictionary" },
              document: { label: "document" },
              service: { label: "service" },
              signal: { label: "signal" },
              store: { label: "store" },
              ui: { label: "UI" },
              template: { label: "Template", lines: [l.trans({ en: "the form", ko: "폼" })] },
              unit: { label: "Unit", lines: [l.trans({ en: "one row or card", ko: "행 하나 또는 카드" })] },
              view: { label: "View", lines: [l.trans({ en: "one full record", ko: "레코드 하나 전체" })] },
              util: { label: "Util", lines: [l.trans({ en: "one control", ko: "컨트롤 하나" })] },
              zone: { label: "Zone", lines: [l.trans({ en: "the section", ko: "섹션" })] },
            }}
            edges={[
              ["constant", "dictionary"],
              ["dictionary", "document"],
              ["document", "service"],
              ["service", "signal"],
              ["signal", "store"],
              ["store", "ui"],
              ["ui", "template"],
              ["ui", "unit"],
              ["ui", "view"],
              ["ui", "util"],
              ["ui", "zone"],
            ]}
            emphasis={["ui"]}
          />
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="role-boundaries" title={l.trans({ en: "Role Boundaries", ko: "역할 경계" })}>
        <Docs.Title>{l.trans({ en: "Role Boundaries", ko: "역할 경계" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "When a module gets confusing, it is usually because logic moved into the wrong file. Check where it belongs before adding code.",
              ko: "모듈이 헷갈리기 시작했다면 대개 로직이 엉뚱한 파일에 들어간 것입니다. 코드를 더하기 전에 아래 표에서 자리를 확인하세요.",
            })}
          </div>
          <Docs.Table columns={boundaryColumns} rows={boundaryRows} />
          <Docs.Alert type="error">
            {l.trans({
              en: (
                <span>
                  <strong>UI and store files never import server logic.</strong> A <code>*.store.ts</code> or{" "}
                  <code>.tsx</code> file importing a <code>*.document.ts</code>, <code>*.dictionary.ts</code>,{" "}
                  <code>*.service.ts</code> or <code>*.signal.ts</code>, or the reverse, is a lint error that fails the
                  build. UI code takes <code>cnst</code>, <code>fetch</code> and <code>st</code> from{" "}
                  <code>{"@apps/<app>/client"}</code> or <code>{"@libs/<lib>/client"}</code>, and{" "}
                  <code>import type</code> is fine in either direction.
                </span>
              ),
              ko: (
                <span>
                  <strong>UI와 store 파일은 서버 로직을 import하지 않습니다.</strong> <code>*.store.ts</code>나{" "}
                  <code>.tsx</code> 파일이 <code>*.document.ts</code>, <code>*.dictionary.ts</code>,{" "}
                  <code>*.service.ts</code>, <code>*.signal.ts</code>를 import하거나 그 반대로 import하면 lint 오류로
                  빌드가 멈춥니다. UI 코드는 <code>{"@apps/<app>/client"}</code>나 <code>{"@libs/<lib>/client"}</code>
                  에서 <code>cnst</code>, <code>fetch</code>, <code>st</code>를 가져오고, <code>import type</code>은
                  어느 방향이든 괜찮습니다.
                </span>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="reading-paths" title={l.trans({ en: "Recommended Reading Paths", ko: "추천 읽기 순서" })}>
        <Docs.Title>{l.trans({ en: "Recommended Reading Paths", ko: "추천 읽기 순서" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  Pick the column for the task you are building and read it top to bottom: that is the order to open the
                  files in. The first one, <code>abstract</code>, is the best place to inspect or design the change.
                </span>
              ),
              ko: (
                <span>
                  지금 만들려는 작업의 열을 골라 위에서 아래로 읽으세요. 그 순서대로 파일을 열면 됩니다. 첫 파일인{" "}
                  <code>abstract</code>가 변경을 살피고 설계하기에 가장 좋은 출발점입니다.
                </span>
              ),
            })}
          </div>
          <ul className="my-4 list-disc space-y-2 pl-5">
            {pathTasks.map(({ label, desc }) => (
              <li key={label}>
                <strong>{label}</strong>
                {l.trans({ en: ": when ", ko: ": " })}
                {desc}
              </li>
            ))}
          </ul>
          <Docs.Matrix
            type={l.trans({ en: "File, in reading order", ko: "파일 (읽는 순서)" })}
            columns={pathColumns}
            groups={pathGroups}
            markLabel={l.trans({ en: "Read for this task", ko: "이 작업에서 읽음" })}
            emptyLabel={l.trans({ en: "Not needed", ko: "필요 없음" })}
          />
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="practical-rules" title={l.trans({ en: "Practical Rules", ko: "실전 규칙" })}>
        <Docs.Title>{l.trans({ en: "Practical Rules", ko: "실전 규칙" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Four habits that keep a module easy to follow:",
              ko: "모듈을 따라 읽기 쉽게 유지하는 습관 네 가지입니다:",
            })}
          </div>
          <ul className="my-4 list-disc space-y-2 pl-5">
            {practicalRules.map((rule, idx) => (
              <li key={idx}>{rule}</li>
            ))}
          </ul>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <DocsToc />
    </Scroll>
  );
});
