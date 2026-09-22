import { usePage } from "@apps/akan/client";
import { Divider, Docs, DocsToc, type UiComponentReference, UiComponentSlide } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();
  const components: UiComponentReference[] = [
    {
      name: "System",
      desc: l.trans({
        en: "The app shell. Two of these are mounted for you by the generated root layout — `Provider` and `Root` — and the other four are controls you place yourself. `Provider` is the one that branches: it renders the CSR or the SSR provider by render mode, so a root layout names one component and never asks which build it is in.",
        ko: "app shell입니다. 이 중 둘 — `Provider`와 `Root` — 은 generated root layout이 대신 마운트해 주고, 나머지 넷은 직접 배치하는 control입니다. 분기하는 것은 `Provider`입니다. render mode에 따라 CSR provider나 SSR provider를 렌더하므로, root layout은 component 이름 하나만 적고 지금이 어떤 빌드인지 묻지 않습니다.",
      }),
      props: [
        {
          name: "System.Provider",
          type: "{ appName, params, of, children, env?, theme?, prefix?, manifest?, head?, layoutStyle?, gaTrackingId?, reconnect?, wsConnect?, dictionary? }",
          desc: l.trans({
            en: "The app frame. `of` is the root route component the CSR wrapper mounts; `env` is the app's own `env/env.client.ts` merged over the framework's `getEnv()`; `layoutStyle` picks the mobile frame or the plain web layout. The root layout chain sets most of these from `akan.config.ts`, so an app rarely writes it by hand.",
            ko: "앱 frame입니다. `of`는 CSR wrapper가 마운트할 root route component이고, `env`는 앱의 `env/env.client.ts`를 framework의 `getEnv()` 위에 병합한 값이며, `layoutStyle`은 mobile frame과 평범한 web layout 중 하나를 고릅니다. 대부분은 root layout chain이 `akan.config.ts`에서 채우므로 앱이 직접 쓸 일은 드뭅니다.",
          }),
        },
        {
          name: "System.Root",
          type: "{ st, children }",
          desc: l.trans({
            en: "Binds the app's generated store to the framework runtime. It is what makes `st.use.*` resolve inside the tree, and it is mounted once, above everything.",
            ko: "앱의 generated store를 framework runtime에 연결합니다. tree 안에서 `st.use.*`가 동작하게 만드는 것이 이것이며, 모든 것 위에서 한 번만 마운트합니다.",
          }),
        },
        {
          name: "System.ThemeToggle",
          type: "{ themes?: string[] }",
          desc: l.trans({
            en: "Cycles the `data-theme` attribute the semantic tokens follow. `themes` names the rotation; left out it is light and dark.",
            ko: "시맨틱 토큰이 따르는 `data-theme` 속성을 순환시킵니다. `themes`가 순서를 정하고, 빼면 light와 dark입니다.",
          }),
        },
        {
          name: "System.SelectLanguage",
          type: "{ className?, languages?: string[] }",
          desc: l.trans({
            en: "Swaps the locale segment of the current route. Every route sits under `/:lang`, so this changes the path rather than navigating somewhere new.",
            ko: "현재 route의 locale 구간을 바꿉니다. 모든 route가 `/:lang` 아래에 있으므로, 새 곳으로 이동하는 것이 아니라 경로만 바뀝니다.",
          }),
        },
        {
          name: "System.Reconnect",
          type: "component",
          desc: l.trans({
            en: "The blocking overlay for a dropped connection. It pings the server, reports the state, and sits above every other layer on purpose — it is the one surface that should stop the app.",
            ko: "연결이 끊겼을 때 앱을 막는 overlay입니다. 서버에 ping을 보내 상태를 알리고, 의도적으로 다른 모든 layer 위에 놓입니다. 앱을 멈춰 세워야 하는 유일한 표면이기 때문입니다.",
          }),
        },
        {
          name: "System.DevModeToggle",
          type: "component",
          desc: l.trans({
            en: "Flips the store's `devMode` flag — what admin screens read to show developer-only affordances.",
            ko: "store의 `devMode` 플래그를 토글합니다. admin 화면이 개발자 전용 기능을 보여 줄지 판단할 때 읽는 값입니다.",
          }),
        },
      ],
      notes: [
        l.trans({
          en: "`System`'s toast stack is deliberately not a member. `Provider` mounts it, and it keeps the `msg.*` wiring, the store read, the body-level portal, and the dismiss timers — which is why the override slots are `Toast` and `ToastItem`, the surface, rather than the component that decides when a toast appears and goes away.",
          ko: "toast 더미는 의도적으로 `System`의 member가 아닙니다. `Provider`가 마운트하며, `msg.*` 배선과 store 읽기, body 수준 portal, 자동 닫힘 타이머를 스스로 들고 있습니다. override slot이 언제 toast가 뜨고 사라지는지 정하는 컴포넌트가 아니라 표면인 `Toast`와 `ToastItem`인 이유입니다.",
        }),
      ],
      code: `import { System } from "akanjs/ui";

export const AppSettings = () => (
  <div className="flex items-center gap-4">
    <System.SelectLanguage languages={["en", "ko"]} />
    <System.ThemeToggle themes={["light", "dark"]} />
  </div>
);`,
    },
    {
      name: "ClientSide",
      desc: l.trans({
        en: "Small Suspense boundary for content that should be rendered client-side with an optional fallback.",
        ko: "client-side에서 렌더링해야 하는 content를 optional fallback과 함께 감싸는 작은 Suspense boundary입니다.",
      }),
      props: [
        {
          name: "children",
          type: "ReactNode",
          desc: l.trans({ en: "Client-side content.", ko: "client-side content입니다." }),
        },
        {
          name: "loading",
          type: "ReactNode",
          desc: l.trans({ en: "Suspense fallback.", ko: "Suspense fallback입니다." }),
        },
      ],
      code: `import { ClientSide } from "akanjs/ui";

export const BrowserOnlyPanel = () => (
  <ClientSide loading={<div>Loading...</div>}>
    <MapPanel />
  </ClientSide>
);`,
    },
    {
      name: "Signal",
      desc: l.trans({
        en: "The API explorer, as parts. It reads the serialized signal the server ships with the app — every endpoint, its arguments, its guards, its return model — and renders a document you can also call from. Eight members, and every one of them is a namespace carrier: `Signal.Doc` and its siblings render an empty div on their own, so you always reach for a static (`Signal.Doc.Zone`, `Signal.RestApi.Endpoints`), never the root.",
        ko: "API explorer를 부품으로 나눈 것입니다. 서버가 앱과 함께 보내는 serialized signal — endpoint 전부와 그 인자, guard, 반환 model — 을 읽어, 읽을 수도 있고 호출할 수도 있는 문서를 렌더합니다. member는 여덟 개이고 전부 namespace 껍데기입니다. `Signal.Doc`과 형제들은 그 자체로는 빈 div를 렌더하므로, root가 아니라 항상 static(`Signal.Doc.Zone`, `Signal.RestApi.Endpoints`)을 씁니다.",
      }),
      props: [
        {
          name: "Signal.Doc",
          type: "`.Zone` · `.Setting` · `.AuthModal` · `.DocSignals` · `.DocSignal`",
          desc: l.trans({
            en: "The explorer itself. `Doc.Zone({ refName, fetch, openAll? })` is one signal's whole document — the entry point an admin page mounts; `Setting` is the search and guard toolbar, `AuthModal` the credential dialog the Try controls need.",
            ko: "explorer 본체입니다. `Doc.Zone({ refName, fetch, openAll? })`가 signal 하나의 문서 전체이며 admin page가 마운트하는 진입점입니다. `Setting`은 검색과 guard toolbar, `AuthModal`은 Try control이 필요로 하는 인증 dialog입니다.",
          }),
        },
        {
          name: "Signal.RestApi",
          type: "`.Endpoints` · `.Endpoint` · `.Interface` · `.Try`",
          desc: l.trans({
            en: "The HTTP half. `Endpoints({ refName, fetch, endpoints?, openAll?, search?, httpUri? })` lists a signal's query and mutation endpoints — naming `endpoints` narrows it to exactly those, which is how a docs page embeds one call. `Interface` is the read-only shape, `Try` the form that sends it.",
            ko: "HTTP 쪽입니다. `Endpoints({ refName, fetch, endpoints?, openAll?, search?, httpUri? })`가 signal의 query·mutation endpoint를 나열하고, `endpoints`를 지정하면 그중 몇 개로 좁힙니다. 문서 페이지가 호출 하나만 심을 때 쓰는 방법입니다. `Interface`는 읽기 전용 형태, `Try`는 실제로 보내는 form입니다.",
          }),
        },
        {
          name: "Signal.WebSocket",
          type: "`.Endpoints`",
          desc: l.trans({
            en: "`Endpoints({ refName, fetch, openAll?, search? })` — the same listing narrowed to the websocket endpoints, delegating each row to `PubSub` or `Message`. A pubsub room authorizes once, at subscribe, so the guard filter here reads the endpoint's own guards.",
            ko: "`Endpoints({ refName, fetch, openAll?, search? })` — 같은 목록을 websocket endpoint로 좁히고, 각 행을 `PubSub`이나 `Message`에 넘깁니다. pubsub room은 subscribe 시점에 한 번 인가하므로, 여기서의 guard 필터는 endpoint 자신의 guard를 읽습니다.",
          }),
        },
        {
          name: "Signal.PubSub",
          type: "`.Endpoint` · `.Interface` · `.Try`",
          desc: l.trans({
            en: "One subscription: its room, its payload shape, and a Try that subscribes and shows frames as they land.",
            ko: "구독 하나입니다. room, payload 형태, 그리고 구독해서 프레임이 도착하는 대로 보여 주는 Try로 이루어집니다.",
          }),
        },
        {
          name: "Signal.Message",
          type: "`.Endpoint` · `.Interface` · `.Try`",
          desc: l.trans({
            en: "The same three for a one-way message endpoint.",
            ko: "단방향 message endpoint에 대한 같은 세 가지입니다.",
          }),
        },
        {
          name: "Signal.Listener",
          type: "`.Result`",
          desc: l.trans({
            en: '`Result({ status, data })` — the live pane a `PubSub.Try` writes into, with a status dot and the payload. A byte payload is shown as a hex head rather than JSON: `JSON.stringify` spells a `Uint8Array` as `{"0":2,…}`, which for one video chunk is megabytes of DOM.',
            ko: '`Result({ status, data })` — `PubSub.Try`가 기록하는 실시간 pane이며 상태 점과 payload를 보여 줍니다. byte payload는 JSON 대신 16진수 앞부분으로 표시합니다. `JSON.stringify`는 `Uint8Array`를 `{"0":2,…}`로 적는데, 영상 chunk 하나면 그것만으로 수 MB의 DOM이 됩니다.',
          }),
        },
        {
          name: "Signal.Object",
          type: "`.Type` · `.Detail` · `.Schema`",
          desc: l.trans({
            en: "A model's shape, drawn from the constant class: `Type` is one field's type with its array depth and nullability, `Detail` the whole class, `Schema` the nested structure.",
            ko: "constant class에서 끌어온 model의 형태입니다. `Type`은 field 하나의 타입을 배열 깊이와 nullable 여부까지 보여 주고, `Detail`은 class 전체, `Schema`는 중첩 구조입니다.",
          }),
        },
        {
          name: "Signal.Arg",
          type: "component · `.Table` · `.Param` · `.Query` · `.FormData` · `.ID` · `.Int` · `.Float` · `.String` · `.Boolean` · `.Date` · `.Json` · `.Upload`",
          desc: l.trans({
            en: "The only member that is a component in its own right: `Arg({ argType, value, onChange })` renders the input for one scalar type, and the per-type statics are what it dispatches to. `Table` is the read-only argument list an `Interface` shows.",
            ko: "그 자체로 component인 유일한 member입니다. `Arg({ argType, value, onChange })`가 scalar 타입 하나의 입력을 렌더하고, 타입별 static이 그 dispatch 대상입니다. `Table`은 `Interface`가 보여 주는 읽기 전용 인자 목록입니다.",
          }),
        },
      ],
      notes: [
        l.trans({
          en: "`fetch` is the app's own fetch proxy — the explorer reads `fetch.serializedSignal` off it, so a signal the app did not mount is reported as unregistered rather than rendered empty.",
          ko: "`fetch`는 앱 자신의 fetch proxy입니다. explorer가 거기서 `fetch.serializedSignal`을 읽으므로, 앱이 마운트하지 않은 signal은 빈 화면이 아니라 등록되지 않았다고 보고됩니다.",
        }),
      ],
      code: `import { fetch } from "@apps/shop/client";
import { Signal } from "akanjs/ui";

export const ProductApi = () => <Signal.Doc.Zone refName="product" fetch={fetch} />;

export const PingTester = () => (
  <Signal.RestApi.Endpoints refName="base" fetch={fetch} endpoints={["ping"]} openAll />
);`,
    },
    {
      name: "Tab",
      desc: l.trans({
        en: 'A tab set split so the panels stay on the server. Only the provider and the menu hold state; `Tab.Panel` renders whatever it is given, so a panel body full of markup never reaches the bundle. This is the shape to copy — never one `"use client"` file with a mode `useState` and every panel inlined in it.',
        ko: 'panel이 서버에 남도록 쪼개진 tab 묶음입니다. 상태를 갖는 것은 provider와 menu뿐이고 `Tab.Panel`은 받은 것을 그대로 렌더하므로, markup으로 가득 찬 panel 본문이 번들에 들어가지 않습니다. 따라 할 모양은 이쪽입니다. mode `useState` 하나와 모든 panel을 인라인한 `"use client"` 파일 하나는 아닙니다.',
      }),
      props: [
        {
          name: "Tab",
          type: "{ className?, defaultMenu?, namespace?, children? }",
          desc: l.trans({
            en: "The provider. `namespace` names this tab set for the in-page agent — without it the tab publishes nothing, because two tab sets on one screen would otherwise share a tool name.",
            ko: "provider입니다. `namespace`는 인페이지 에이전트에게 이 tab 묶음의 이름을 알려 줍니다. 없으면 아무것도 공개하지 않습니다. 한 화면의 tab 묶음 둘이 같은 tool 이름을 쓰게 되기 때문입니다.",
          }),
        },
        {
          name: "Tab.Menus",
          type: "{ className?, children }",
          desc: l.trans({ en: "The row the menu items sit in.", ko: "menu item이 놓이는 줄입니다." }),
        },
        {
          name: "Tab.Menu",
          type: "{ menu, children, className?, activeClassName?, disabledClassName?, disabled?, tooltip?, scrollToTop? }",
          desc: l.trans({
            en: "One selectable item. The key is `menu`, not `value`.",
            ko: "선택 가능한 item 하나입니다. key는 `value`가 아니라 `menu`입니다.",
          }),
        },
        {
          name: "Tab.Panel",
          type: `{ menu, children?, className?, loading? }`,
          desc: l.trans({
            en: 'Content for a matching `menu` key. `loading` decides when the body is rendered — `"eager"` up front, `"lazy"` on first selection, `"every"` on each selection.',
            ko: '`menu` key가 일치할 때의 content입니다. `loading`이 본문을 언제 렌더할지 정합니다 — `"eager"`는 처음부터, `"lazy"`는 처음 선택될 때, `"every"`는 선택될 때마다입니다.',
          }),
        },
      ],
      code: `import { Tab } from "akanjs/ui";

export const ProductTabs = ({ product }) => (
  <Tab defaultMenu="info" namespace="product">
    <Tab.Menus>
      <Tab.Menu menu="info">Info</Tab.Menu>
      <Tab.Menu menu="history">History</Tab.Menu>
    </Tab.Menus>
    <Tab.Panel menu="info">
      <Product.View.General product={product} />
    </Tab.Panel>
    <Tab.Panel menu="history" loading="lazy">
      <Product.View.History product={product} />
    </Tab.Panel>
  </Tab>
);`,
    },
    {
      name: "animated",
      desc: l.trans({
        en: "Small re-export of react-spring animated primitives used by Akan UI components and custom animated surfaces.",
        ko: "Akan UI component와 custom animated surface에서 사용하는 react-spring animated primitive의 작은 re-export입니다.",
      }),
      props: [
        {
          name: "animated.div",
          type: "react-spring animated div",
          desc: l.trans({ en: "Animated div primitive.", ko: "animated div primitive입니다." }),
        },
        {
          name: "animated.g",
          type: "react-spring animated g",
          desc: l.trans({ en: "Animated SVG group primitive.", ko: "animated SVG group primitive입니다." }),
        },
        {
          name: "animated.progress",
          type: "react-spring animated progress",
          desc: l.trans({ en: "Animated progress element.", ko: "animated progress element입니다." }),
        },
      ],
      code: `import { animated } from "akanjs/ui";
import { useSpring } from "@react-spring/web";

export const FadeIn = ({ children }) => {
  const style = useSpring({ opacity: 1, from: { opacity: 0 } });
  return <animated.div style={style}>{children}</animated.div>;
};`,
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="system-ui" title={l.trans({ en: "System UI", ko: "System UI" })}>
        <Docs.Title>{l.trans({ en: "System UI", ko: "System UI" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "System UI components are app-shell and admin helpers, not normal feature widgets. Use them in root layouts, admin pages, signal dashboards, tabbed detail views, and animation-heavy UI.",
              ko: "System UI component는 일반 feature widget이 아니라 app-shell 및 admin helper입니다. root layout, admin page, signal dashboard, tabbed detail view, animation-heavy UI에서 사용합니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />
      {components.map((component) => (
        <UiComponentSlide key={component.name} component={component} />
      ))}
      <DocsToc />
    </Scroll>
  );
});
