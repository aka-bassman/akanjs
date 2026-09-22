import { usePage } from "@apps/akan/client";
import { cardGridRecipe, Divider, Docs, DocsToc, type IntroItem, panelRecipe } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";
import { Link } from "akanjs/ui";

export default page().render(() => {
  const { l } = usePage();
  const pages = [
    {
      title: l.trans({ en: "Core", ko: "Core" }),
      href: "/references/ui/core",
      components: "Link, Image, Layout, Load, Model",
      desc: l.trans({
        en: "The most common page-building primitives for routing, media, page shells, data loading, and model workflows.",
        ko: "routing, media, page shell, data loading, model workflow에 가장 자주 쓰이는 핵심 primitive입니다.",
      }),
    },
    {
      title: l.trans({ en: "Display", ko: "Display" }),
      href: "/references/ui/display",
      components: "Data, RecentTime, Loading, Empty, Table, Pagination, Badge",
      desc: l.trans({
        en: "Display and feedback helpers for model lists, relative time labels, loading states, empty states, status pills, and tabular UI.",
        ko: "model list, relative time label, loading state, empty state, 상태 pill, table UI를 위한 표시/피드백 helper입니다.",
      }),
    },
    {
      title: l.trans({ en: "Forms", ko: "Forms" }),
      href: "/references/ui/forms",
      components: "Field, Input, Select, Switch, Radio, ToggleSelect, DatePicker, Button",
      desc: l.trans({
        en: "Form controls and action primitives used by templates, filters, and admin surfaces.",
        ko: "template, filter, admin surface에서 사용하는 form control과 action primitive입니다.",
      }),
    },
    {
      title: l.trans({ en: "Overlays", ko: "Overlays" }),
      href: "/references/ui/overlays",
      components: "Modal, Dialog, Popconfirm, Dropdown, BottomSheet, Tooltip, Menu, Portal, Copy",
      desc: l.trans({
        en: "Overlay, confirmation, sheet, menu, hint, and copy helpers for focused user actions.",
        ko: "집중된 사용자 action을 위한 overlay, confirmation, sheet, menu, 힌트, copy helper입니다.",
      }),
    },
    {
      title: l.trans({ en: "System", ko: "System" }),
      href: "/references/ui/system",
      components: "System, ClientSide, Signal, Tab, animated",
      desc: l.trans({
        en: "Application shell helpers, CSR guards, admin signal tools, tab state, and animation wrappers.",
        ko: "application shell helper, CSR guard, admin signal tool, tab state, animation wrapper입니다.",
      }),
    },
    {
      title: l.trans({ en: "Agent", ko: "Agent" }),
      href: "/references/ui/agent",
      components: "Agent.Chat, Agent.Zone, Agent.Guide, Agent.Skip, Agent.Dock",
      desc: l.trans({
        en: "The in-page agent's surface — one chat in a layout, a subtree with its own conversation, route guidance, and the development dock.",
        ko: "인페이지 에이전트의 표면입니다. layout의 채팅 하나, 자기 대화를 갖는 subtree, route 지침, 그리고 개발용 dock입니다.",
      }),
    },
    {
      title: l.trans({ en: "Customization", ko: "커스터마이즈" }),
      href: "/references/ui/customize",
      components: "_overrides.tsx, override(), 46 slots",
      desc: l.trans({
        en: "Re-skin any framework component per route with a `page/**/_overrides.tsx` manifest — drop-in replacements, no call-site changes.",
        ko: "`page/**/_overrides.tsx` manifest로 framework 컴포넌트를 route 단위로 re-skin합니다 — drop-in 교체, call-site 변경 없음.",
      }),
    },
    {
      title: l.trans({ en: "Recipes", ko: "Recipe" }),
      href: "/docs/arch/ui-recipe",
      components: "buttonRecipe, badgeRecipe, inputRecipe",
      desc: l.trans({
        en: "The className factories behind the primitives. Consume one, author one in `apps/<app>/ui/Recipe/`, or swap the framework's through the `recipes` manifest key.",
        ko: "primitive 뒤의 className factory입니다. 가져다 쓰거나, `apps/<app>/ui/Recipe/`에 직접 만들거나, `recipes` manifest key로 framework 것을 교체합니다.",
      }),
    },
  ];

  const agent = l.trans({ en: "Agent", ko: "Agent" });
  const core = l.trans({ en: "Core", ko: "Core" });
  const custom = l.trans({ en: "Customization", ko: "커스터마이즈" });
  const display = l.trans({ en: "Display", ko: "Display" });
  const forms = l.trans({ en: "Forms", ko: "Forms" });
  const here = l.trans({ en: "Here", ko: "여기" });
  const overlays = l.trans({ en: "Overlays", ko: "Overlays" });
  const system = l.trans({ en: "System", ko: "System" });

  const on = (where: string, en: string, ko: string) =>
    l.trans({
      en: (
        <span>
          <strong className="text-primary">{where}.</strong> {en}
        </span>
      ),
      ko: (
        <span>
          <strong className="text-primary">{where}.</strong> {ko}
        </span>
      ),
    });

  const exportRows: IntroItem[] = [
    {
      name: "Agent",
      desc: on(
        agent,
        "The in-page agent namespace — twelve members.",
        "인페이지 에이전트 namespace이며 member는 열둘입니다.",
      ),
    },
    {
      name: "agentAttrs",
      desc: on(
        forms,
        "The `data-akan-*` attributes for a handler passed by reference.",
        "참조로 넘긴 handler에 붙는 `data-akan-*` 속성입니다.",
      ),
    },
    { name: "AgentAttachments", desc: on(agent, "The composer's attachment chips.", "입력창의 첨부 chip입니다.") },
    {
      name: "AgentProvider",
      desc: on(
        agent,
        "Holds a session for a subtree, under `Agent.Zone`.",
        "`Agent.Zone` 아래에서 subtree의 session을 보관합니다.",
      ),
    },
    {
      name: "AgentReferences",
      desc: on(agent, "The composer's `@` pointer chips.", "입력창의 `@` 포인터 chip입니다."),
    },
    {
      name: "AgentSession",
      desc: on(
        agent,
        "The conversation object a host builds to own itself.",
        "host가 직접 소유하려고 만드는 대화 객체입니다.",
      ),
    },
    {
      name: "agentSessionOf",
      desc: on(
        agent,
        "Builds one from the same options `Agent.Chat` takes.",
        "`Agent.Chat`이 받는 것과 같은 option으로 session을 만듭니다.",
      ),
    },
    {
      name: "animated",
      desc: on(system, "The react-spring animated primitives.", "react-spring animated primitive입니다."),
    },
    { name: "Badge", desc: on(display, "The status pill.", "상태 pill입니다.") },
    {
      name: "badgeRecipe",
      desc: on(
        custom,
        "Its className factory, and a recipe slot.",
        "그 className factory이며 recipe slot이기도 합니다.",
      ),
    },
    {
      name: "BottomSheet",
      desc: on(overlays, "The mobile sheet, `half` or `full`.", "mobile sheet이며 `half`와 `full`이 있습니다."),
    },
    {
      name: "Button",
      desc: on(
        forms,
        "The one button primitive; a promise handler adds the async states.",
        "유일한 button primitive이며, promise를 반환하는 handler가 async 상태를 켭니다.",
      ),
    },
    {
      name: "buttonRecipe",
      desc: on(
        custom,
        "Its className factory, and a recipe slot.",
        "그 className factory이며 recipe slot이기도 합니다.",
      ),
    },
    {
      name: "ChatCommands",
      desc: on(agent, "The chat's slash-command registry.", "채팅의 슬래시 명령 registry입니다."),
    },
    {
      name: "ClientSide",
      desc: on(
        system,
        "A small Suspense boundary for client-only content.",
        "client 전용 content를 감싸는 작은 Suspense boundary입니다.",
      ),
    },
    {
      name: "Clipboard",
      desc: on(
        overlays,
        "A bare copy icon; `Copy` is the version with a success toast.",
        "복사 아이콘만 있는 형태이며, 성공 toast까지 있는 쪽은 `Copy`입니다.",
      ),
    },
    {
      name: "Constant",
      desc: on(
        system,
        "`Doc` and `Graph` — a constant class as a document and as a relation graph.",
        "`Doc`과 `Graph`입니다. constant class를 문서와 관계 그래프로 그립니다.",
      ),
    },
    {
      name: "Copy",
      desc: on(
        overlays,
        "Copy to clipboard with a global success message.",
        "clipboard에 복사하고 전역 성공 메시지를 띄웁니다.",
      ),
    },
    {
      name: "createOverridable",
      desc: on(
        custom,
        "Makes a framework component resolve through a route slot.",
        "framework component가 route slot을 거쳐 결정되게 만듭니다.",
      ),
    },
    {
      name: "CsrImage",
      desc: on(
        core,
        "`Image` without the SSR optimizer, for a CSR-only bundle.",
        "SSR optimizer 없는 `Image`이며 CSR 전용 번들을 위한 것입니다.",
      ),
    },
    {
      name: "Data",
      desc: on(display, "The admin listing, in nine parts.", "admin 목록 화면이며 부품은 아홉 개입니다."),
    },
    {
      name: "DatePicker",
      desc: on(
        forms,
        "The native date field, plus `RangePicker` and `TimePicker`.",
        "native date field이며 `RangePicker`와 `TimePicker`가 함께 있습니다.",
      ),
    },
    {
      name: "Default*",
      desc: on(
        custom,
        "`DefaultApproval`, `DefaultBubble`, `DefaultCode`, `DefaultComposer`, `DefaultLauncher`, `DefaultMarkdown`, `DefaultAgentMenu`, `DefaultQuestion`, `DefaultQueued`, `DefaultSteps`, `DefaultToolCard`, `DefaultToast`, `DefaultToastItem` — the shipped implementation behind each matching slot, exported so a replacement composes it instead of starting over.",
        "`DefaultApproval`, `DefaultBubble`, `DefaultCode`, `DefaultComposer`, `DefaultLauncher`, `DefaultMarkdown`, `DefaultAgentMenu`, `DefaultQuestion`, `DefaultQueued`, `DefaultSteps`, `DefaultToolCard`, `DefaultToast`, `DefaultToastItem` — 각 slot의 기본 구현이며, 교체본이 처음부터 만들지 않고 조합할 수 있도록 공개되어 있습니다.",
      ),
    },
    {
      name: "Dialog",
      desc: on(
        overlays,
        "The headless dialog namespace `Modal` is built on.",
        "`Modal`이 올라타 있는 headless dialog namespace입니다.",
      ),
    },
    {
      name: "DragAction",
      desc: on(
        here,
        "A row that reveals a left and a right action when swiped.",
        "밀면 좌우 action이 드러나는 행입니다.",
      ),
    },
    {
      name: "DraggableList",
      desc: on(
        here,
        "A drag-sortable list with `Item` and `Cursor`; `Field.TextList` is built on it.",
        "드래그로 정렬하는 목록이며 `Item`과 `Cursor`를 갖습니다. `Field.TextList`가 이것 위에 있습니다.",
      ),
    },
    {
      name: "DROPDOWN_KEEP_OPEN_ATTR",
      desc: on(
        overlays,
        "The attribute name behind `data-dropdown-keep-open`.",
        "`data-dropdown-keep-open`의 속성 이름 상수입니다.",
      ),
    },
    { name: "Dropdown", desc: on(overlays, "The row-action menu.", "행 action menu입니다.") },
    { name: "Empty", desc: on(display, "The no-data placeholder.", "데이터 없음 placeholder입니다.") },
    {
      name: "Field",
      desc: on(
        forms,
        "The form-field namespace — a section wrapper and twenty members.",
        "form field namespace이며 section wrapper와 member 스무 개로 이루어집니다.",
      ),
    },
    {
      name: "fetchRunner",
      desc: on(
        agent,
        "A transport that drives a plain `fetch.*` endpoint.",
        "평범한 `fetch.*` endpoint를 사용하는 transport입니다.",
      ),
    },
    {
      name: "FontFace",
      desc: on(
        here,
        "Emits the `@font-face` rule for one `ReactFont`; the root layout's `.fonts()` stage mounts it.",
        "`ReactFont` 하나의 `@font-face` 규칙을 내보냅니다. root layout의 `.fonts()` stage가 마운트합니다.",
      ),
    },
    {
      name: "httpRunner",
      desc: on(
        agent,
        "A transport that speaks to an arbitrary HTTP endpoint.",
        "임의의 HTTP endpoint와 통신하는 transport입니다.",
      ),
    },
    {
      name: "Image",
      desc: on(
        core,
        "Images from a `File` model or a URL, through the Akan optimizer.",
        "`File` model이나 URL의 이미지를 Akan optimizer로 처리합니다.",
      ),
    },
    {
      name: "InfiniteScroll",
      desc: on(
        here,
        "Loads the next window when a sentinel scrolls into view; `reverse` prepends and keeps the reading position.",
        "감시 요소가 보이면 다음 창을 불러옵니다. `reverse`는 위로 덧붙이면서 읽던 위치를 유지합니다.",
      ),
    },
    { name: "Input", desc: on(forms, "The primitive input namespace.", "primitive input namespace입니다.") },
    {
      name: "inputRecipe",
      desc: on(
        custom,
        "The field shell's className factory, and a recipe slot.",
        "field 껍데기의 className factory이며 recipe slot이기도 합니다.",
      ),
    },
    {
      name: "KeyboardAvoiding",
      desc: on(here, "Lifts its children above the on-screen keyboard.", "children을 화면 키보드 위로 밀어 올립니다."),
    },
    {
      name: "Layout",
      desc: on(
        core,
        "The page shell — content containers and frame slots.",
        "page shell이며 content container와 frame slot으로 이루어집니다.",
      ),
    },
    {
      name: "LegacyModal",
      desc: on(
        overlays,
        "The previous modal skin: spring transitions and drag-to-dismiss.",
        "이전 modal skin입니다. spring 전환과 드래그 닫기가 있습니다.",
      ),
    },
    {
      name: "Link",
      desc: on(
        core,
        "Route-aware navigation, plus `Back`, `Close`, and `Lang`.",
        "route를 아는 navigation이며 `Back`, `Close`, `Lang`이 함께 있습니다.",
      ),
    },
    {
      name: "Load",
      desc: on(
        core,
        "The fetch-to-React bridge — `Units`, `View`, `Edit`, `Pagination`, `Page`, `Stream`.",
        "fetch와 React를 잇는 다리입니다 — `Units`, `View`, `Edit`, `Pagination`, `Page`, `Stream`.",
      ),
    },
    {
      name: "Loading",
      desc: on(
        display,
        "Six indicators, one per shape of waiting.",
        "기다리는 모양마다 하나씩, 여섯 개의 indicator입니다.",
      ),
    },
    {
      name: "maxAttachmentBytes",
      desc: on(
        agent,
        "With `maxMessageAttachmentBytes` and `maxMessageAttachments`, the composer's shipped limits.",
        "`maxMessageAttachmentBytes`, `maxMessageAttachments`와 함께 입력창의 기본 한도입니다.",
      ),
    },
    {
      name: "Menu",
      desc: on(overlays, "A navigation menu built from an item tree.", "item 트리로 만드는 navigation menu입니다."),
    },
    { name: "Modal", desc: on(overlays, "The controlled modal.", "controlled modal입니다.") },
    {
      name: "Model",
      desc: on(
        core,
        "The CRUD shells for a generated model store — fifteen members.",
        "generated model store를 위한 CRUD shell이며 member는 열다섯입니다.",
      ),
    },
    {
      name: "More",
      desc: on(
        here,
        "The load-more footer under a list; `Load.Units` draws it when `pagination` is off.",
        "목록 아래 더 보기 footer입니다. `pagination`이 꺼진 `Load.Units`가 이것을 그립니다.",
      ),
    },
    {
      name: "ObjectId",
      desc: on(
        here,
        "A document id, shortened, with a copy control.",
        "문서 id를 줄여서 보여 주고 복사 control을 붙입니다.",
      ),
    },
    {
      name: "override",
      desc: on(
        custom,
        "The typed identity helper an `_overrides.tsx` exports.",
        "`_overrides.tsx`가 export하는 타입 검사용 identity helper입니다.",
      ),
    },
    {
      name: "OverlayOwnerProvider",
      desc: on(
        overlays,
        "With `isOwnOverlayClick`, `OVERLAY_LAYER_ATTR`, `useOverlayLayerProps`, and `useOverlayScope` — how a menu tells its own overlay's clicks from an outside click.",
        "`isOwnOverlayClick`, `OVERLAY_LAYER_ATTR`, `useOverlayLayerProps`, `useOverlayScope`와 함께, menu가 자기 overlay의 클릭과 바깥 클릭을 구분하는 장치입니다.",
      ),
    },
    {
      name: "Pagination",
      desc: on(display, "The pager taking its numbers as props.", "숫자를 prop으로 받는 pager입니다."),
    },
    {
      name: "Popconfirm",
      desc: on(overlays, "Inline confirmation for a destructive action.", "파괴적 action을 위한 inline 확인입니다."),
    },
    {
      name: "Portal",
      desc: on(
        overlays,
        "Renders into a named host element, SSR included.",
        "이름 붙은 host element 안으로 렌더하며 SSR에서도 동작합니다.",
      ),
    },
    { name: "Radio", desc: on(forms, "The radio group, with `Item`.", "radio 그룹이며 `Item`을 갖습니다.") },
    {
      name: "RecentTime",
      desc: on(
        display,
        "A relative time label with the absolute date in a tooltip.",
        "상대 시각 label이며 절대 날짜는 tooltip에 있습니다.",
      ),
    },
    {
      name: "recipe",
      desc: on(
        custom,
        "With `tv`, the factory every recipe is built from.",
        "`tv`와 함께 모든 recipe를 만드는 factory입니다.",
      ),
    },
    {
      name: "Reference",
      desc: on(
        agent,
        "The `@` pointer value a reference source produces.",
        "reference source가 만들어 내는 `@` 포인터 값입니다.",
      ),
    },
    {
      name: "Refresh",
      desc: on(here, "Pull-to-refresh around a scrolling child.", "스크롤되는 자식을 감싸는 당겨서 새로고침입니다."),
    },
    {
      name: "ScreenNavigator",
      desc: on(
        here,
        "A swipeable pager across named screens, with a `namespace` for the agent.",
        "이름 붙은 화면들 사이를 스와이프로 넘기는 pager이며, 에이전트용 `namespace`를 받습니다.",
      ),
    },
    {
      name: "Select",
      desc: on(forms, "The selector — single, multiple, searchable.", "selector이며 단일·다중·검색을 지원합니다."),
    },
    {
      name: "SessionContext",
      desc: on(agent, "Where a zone hands its session down.", "zone이 자기 session을 아래로 넘기는 통로입니다."),
    },
    {
      name: "Signal",
      desc: on(system, "The API explorer, in eight namespaces.", "API explorer이며 namespace 여덟 개로 이루어집니다."),
    },
    {
      name: "Switch",
      desc: on(forms, 'A boolean as a `role="switch"` button.', '`role="switch"` 버튼으로 만든 boolean입니다.'),
    },
    {
      name: "System",
      desc: on(
        system,
        "The app shell — provider, root, and four controls.",
        "app shell입니다. provider, root, 그리고 control 넷입니다.",
      ),
    },
    {
      name: "Tab",
      desc: on(system, "Tabs split so the panels stay on the server.", "panel이 서버에 남도록 쪼개진 tab입니다."),
    },
    {
      name: "Table",
      desc: on(
        display,
        "Rows you already have, with columns and an optional pager.",
        "이미 손에 있는 행을 column과 선택적 pager로 그립니다.",
      ),
    },
    {
      name: "Toast",
      desc: on(
        display,
        "The toast stack `System.Provider` mounts; `msg.*` is how you write into it.",
        "`System.Provider`가 마운트하는 toast 더미이며, 여기에 쓰는 방법은 `msg.*`입니다.",
      ),
    },
    {
      name: "ToggleSelect",
      desc: on(forms, "A choice as a row of buttons, with `Multi`.", "버튼 줄로 고르는 선택이며 `Multi`가 있습니다."),
    },
    { name: "tokenCount", desc: on(agent, "The estimate compaction decides on.", "압축 판단에 쓰이는 추정치입니다.") },
    {
      name: "Tooltip",
      desc: on(overlays, "A pure-CSS hint on hover or focus.", "hover와 포커스에서 뜨는 순수 CSS 힌트입니다."),
    },
    {
      name: "triggerSlot",
      desc: on(
        custom,
        "Clones a caller's trigger so aria state lands on the real control.",
        "호출자의 trigger를 clone해 aria 상태가 실제 control에 붙게 합니다.",
      ),
    },
    {
      name: "UiOverrideProvider",
      desc: on(
        custom,
        "Mounts an override map by hand, where the route manifest cannot reach.",
        "route manifest가 닿지 않는 곳에서 override map을 직접 마운트합니다.",
      ),
    },
    {
      name: "Unauthorized",
      desc: on(system, "The refusal screen a guarded route renders.", "guard가 걸린 route가 그리는 거절 화면입니다."),
    },
    {
      name: "useAgent",
      desc: on(agent, "Reads the enclosing session from a component.", "component에서 감싸고 있는 session을 읽습니다."),
    },
    {
      name: "useAgentReference",
      desc: on(
        agent,
        "Publishes one field of the screen as an `@` target.",
        "화면의 field 하나를 `@` 대상으로 공개합니다.",
      ),
    },
    {
      name: "useUiOverride",
      desc: on(
        custom,
        "With `useUiRecipe`, how a component resolves its own slot.",
        "`useUiRecipe`와 함께, component가 자기 slot을 찾는 방법입니다.",
      ),
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="akanjs-ui" title="akanjs/ui">
        <Docs.Title>akanjs/ui</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "`akanjs/ui` is the shared UI facet for Akan apps. It provides route-aware links, data loading wrappers, model UI shells, form controls, display helpers, overlays, the in-page agent, and system-level app chrome.",
              ko: "`akanjs/ui`는 Akan app을 위한 shared UI facet입니다. route-aware link, data loading wrapper, model UI shell, form control, display helper, overlay, 인페이지 에이전트, system-level app chrome을 제공합니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "Seven pages cover it, split by the layer you are working in. The export table at the bottom is the whole surface, name by name, with the page that documents each — start there when you know the name and not the page.",
              ko: "작업 중인 layer를 기준으로 일곱 페이지가 이것을 다룹니다. 맨 아래 export 표가 표면 전체를 이름 단위로 담고 있으며, 각 이름이 어느 페이지에 문서화되어 있는지 함께 적혀 있습니다. 이름은 아는데 페이지를 모를 때는 거기서 시작하세요.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="page-map" title={l.trans({ en: "Page Map", ko: "페이지 맵" })}>
        <Docs.Title>{l.trans({ en: "Page Map", ko: "페이지 맵" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Open the page that matches the UI layer you are working on. Each detail page uses one `Scroll.Slide` per component, with a props table and the notes that props alone cannot carry.",
              ko: "작업 중인 UI layer에 맞는 페이지를 여세요. 각 상세 페이지는 컴포넌트마다 `Scroll.Slide` 하나를 쓰고, props 표와 props만으로는 담을 수 없는 note를 함께 싣습니다.",
            })}
          </div>
        </Docs.Description>
        <div className={cardGridRecipe()}>
          {pages.map(({ title, href, components, desc }) => (
            <Link key={title} href={href} className={panelRecipe({}, "hover:border-primary")}>
              <div className="font-bold text-foreground">{title}</div>
              <div className="mt-1 font-mono text-foreground/70">{components}</div>
              <div className="mt-2 text-foreground/70">{desc}</div>
            </Link>
          ))}
        </div>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="exports" title={l.trans({ en: "Every Export", ko: "전체 export" })}>
        <Docs.Title>{l.trans({ en: "Every Export", ko: "전체 export" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Every name `akanjs/ui` exports, A to Z, and the page that documents it. A row marked Here is documented by its own line and nowhere else — those are the exports a single sentence exhausts.",
              ko: "`akanjs/ui`가 export하는 모든 이름을 A부터 Z까지, 각각을 다루는 페이지와 함께 적었습니다. 여기로 표시된 행은 그 한 줄이 문서의 전부입니다. 한 문장이면 충분한 export들입니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "Type-only exports are left out: they follow the component they type, and a props interface is documented in that component's own table.",
              ko: "타입 전용 export는 뺐습니다. 타입은 자기가 설명하는 컴포넌트를 따라가고, props interface는 그 컴포넌트의 표에 문서화되어 있기 때문입니다.",
            })}
          </div>
        </Docs.Description>
        <Docs.IntroTable type={l.trans({ en: "Export", ko: "Export" })} items={exportRows} />
      </Scroll.Slide>
      <Divider />

      <DocsToc />
    </Scroll>
  );
});
