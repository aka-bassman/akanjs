import { usePage } from "@apps/akan/client";
import { Code, Divider, Docs, DocsToc } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();
  const symbols = [
    {
      name: "router",
      desc: l.trans({
        en: "Client navigation singleton that normalizes Akan language/base-path prefixes before delegating to the active router. Use it from pages, stores, templates, and utilities for push/replace/back/refresh.",
        ko: "Akan language/base-path prefix를 normalize한 뒤 active router에 위임하는 client navigation singleton입니다. page, store, template, utility에서 push/replace/back/refresh에 사용합니다.",
      }),
      code: `import { router } from "akanjs/client";

router.push("/profile");
router.replace("/signin");
router.refresh();`,
    },
    {
      name: "cn",
      desc: l.trans({
        en: 'The one class-combining function: joins conditional parts (`cond && "x"`) and resolves Tailwind conflicts with Akan\'s semantic tokens registered. Every view/unit/template component imports it from `akanjs/client`.',
        ko: '유일한 class 결합 함수입니다. 조건부 조각(`cond && "x"`)을 합치고, Akan 시맨틱 토큰이 등록된 tailwind-merge 로 충돌을 해소합니다. 모든 view/unit/template component 는 `akanjs/client`에서 import합니다.',
      }),
      code: `import { cn } from "akanjs/client";

<button className={cn("px-3 py-1", active && "bg-primary text-primary-foreground")} />;`,
    },
    {
      name: "ModelProps / ModelsProps",
      desc: l.trans({
        en: "Common props for generated Unit, Zone, and list UI components. They carry model data, slice metadata, query/init settings, actions, columns, and click handlers.",
        ko: "generated Unit, Zone, list UI component를 위한 공통 props입니다. model data, slice metadata, query/init setting, action, column, click handler를 전달합니다.",
      }),
      code: `import type { ModelProps, ModelsProps } from "akanjs/client";

export function UserUnit({ user, className }: ModelProps<"user", LightUser>) {}
export function UserZone({ slice, init }: ModelsProps<LightUser>) {}`,
    },
    {
      name: "page / layout / rootLayout",
      desc: l.trans({
        en: "The route chain. A route file has one export: `export default page()…render(fn)` in a page file (`<name>.tsx`, `_index.tsx`), `layout()` in a `_layout.tsx`, and `rootLayout()` in the root `_layout.tsx` of an app or a basePath. Every route setting is a stage of the chain: `.param(name, Type, { desc })` for each `[name]` segment of the path, `.search(name, Type | [Type], { desc })` for a query key, `.config(PageConfig)`, `.head(node | (args) => node)`, `.metadata(obj | (args) => obj)`, `.loading((args) => node)`, and `.render((args) => node)` last. The render callback is not a React component: it receives the declared arguments already typed — `ID`/`String` → string, `Int`/`Float` → number, `Boolean` → boolean, `Date` → Dayjs, an `enumOf` class → its value union, `[T]` → array — and every search argument is optional. `lang`, the locale segment every route sits under, arrives on every stage without a `.param()` for it, and declaring one is refused. `usePage()`, `getSelf()`, and `fetch.*` are called inside it exactly as before.",
        ko: "route chain입니다. route 파일의 export는 하나입니다. page 파일(`<name>.tsx`, `_index.tsx`)에서는 `export default page()…render(fn)`, `_layout.tsx`에서는 `layout()`, app 또는 basePath의 root `_layout.tsx`에서는 `rootLayout()`입니다. 모든 route 설정은 chain의 stage입니다. path의 `[name]` segment마다 `.param(name, Type, { desc })`, query key에는 `.search(name, Type | [Type], { desc })`, 그리고 `.config(PageConfig)`, `.head(node | (args) => node)`, `.metadata(obj | (args) => obj)`, `.loading((args) => node)`, 마지막에 `.render((args) => node)`를 씁니다. render callback은 React component가 아닙니다. 선언한 인자를 이미 타입이 맞춰진 값으로 받으며 — `ID`/`String` → string, `Int`/`Float` → number, `Boolean` → boolean, `Date` → Dayjs, `enumOf` class → 그 value union, `[T]` → array — search 인자는 모두 optional입니다. 모든 route가 그 아래에 놓이는 locale segment `lang`은 `.param()` 없이 모든 stage에 함께 오며, 직접 선언하면 거부됩니다. `usePage()`, `getSelf()`, `fetch.*`는 그 안에서 이전과 똑같이 호출합니다.",
      }),
      code: `import { fetch, Project, usePage } from "@apps/myapp/client";
import { ID } from "akanjs/base";
import { page } from "akanjs/client";
import { Loading } from "akanjs/ui";

export default page()
  .param("projectId", ID)
  .search("tab", String)
  .search("tags", [String])
  .config({ transition: "stack" })
  .head(({ projectId }) => <title>{projectId}</title>)
  .loading(() => <Loading.Skeleton active />)
  .render(async ({ projectId, tab, tags }) => {
    const { l } = usePage();
    const { project } = await fetch.viewProject(projectId);
    return <Project.Zone.View view={project} tab={tab} tags={tags ?? []} />;
  });`,
    },
    {
      name: "layout / rootLayout stages",
      desc: l.trans({
        en: '`layout()` takes the same stages as `page()`, receives `children` beside its arguments, may declare only the `[x]` segments it reads, and adds `.notFound(fn)` and `.error(fn)` in place of the `NotFound` / `Error` exports. `rootLayout()` adds what only the root `_layout.tsx` sets: `.fonts(ReactFont[])`, `.manifest(WebAppManifest)`, `.theme(string)`, `.reconnect(bool)`, `.wsConnect(bool)`, `.layoutStyle("mobile" | "web")`, and `.gaTrackingId(string)`; `import "./styles.css";` stays the first line of that file.',
        ko: '`layout()`은 `page()`와 같은 stage를 받고, 인자 옆에 `children`을 함께 받으며, 읽는 `[x]` segment만 선언해도 되고, `NotFound` / `Error` export 대신 `.notFound(fn)`과 `.error(fn)`을 더합니다. `rootLayout()`은 root `_layout.tsx`만 설정하는 것을 더합니다. `.fonts(ReactFont[])`, `.manifest(WebAppManifest)`, `.theme(string)`, `.reconnect(bool)`, `.wsConnect(bool)`, `.layoutStyle("mobile" | "web")`, `.gaTrackingId(string)`이며, `import "./styles.css";`는 그 파일의 첫 줄에 그대로 둡니다.',
      }),
      code: `// page/_layout.tsx
import "./styles.css";
import { rootLayout } from "akanjs/client";

export default rootLayout()
  .fonts([{ name: "Noto Sans KR", paths: [{ src: "./font.woff2", weight: 400 }] }])
  .theme("dark")
  .layoutStyle("web")
  .head(<link rel="icon" href="/favicon.ico" />)
  .render(({ children }) => children);

// page/org/[orgId]/_layout.tsx
import { Org } from "@apps/myapp/client";
import { ID } from "akanjs/base";
import { layout } from "akanjs/client";

export default layout()
  .param("orgId", ID)
  .notFound(({ pathname }) => <p>{pathname}</p>)
  .render(({ orgId, children }) => <Org.Zone.Shell orgId={orgId}>{children}</Org.Zone.Shell>);`,
    },
    {
      name: "PageConfig",
      desc: l.trans({
        en: "The object `.config()` takes. It controls transition, safe area and chrome insets, gesture, cache, and the SSR mode, plus `devOnly` to keep the route out of `akan build`. `devOnly` is written as a literal `true`/`false` because the build reads it off the source without evaluating the module; on a `_layout.tsx` it excludes every route under that directory.",
        ko: "`.config()`가 받는 object입니다. transition, safe area와 chrome inset, gesture, cache, SSR mode를 제어하고, `akan build`에서 route를 제외하는 `devOnly`를 더합니다. build가 module을 실행하지 않고 source에서 읽으므로 `devOnly`는 literal `true`/`false`로 씁니다. `_layout.tsx`에 두면 그 디렉터리 아래 모든 route가 함께 제외됩니다.",
      }),
      code: `import { page } from "akanjs/client";

export default page()
  .config({ transition: "bottomUp", safeArea: true, devOnly: true })
  .render(() => <Playground />);`,
    },
    {
      name: "prompt",
      desc: l.trans({
        en: 'Page-only stage that publishes the screen as an MCP prompt: `.prompt(name, description)`, where the description is the whole instruction the model receives, in English. `prompts/get` runs the page body under the token of the caller and answers with the description, one embedded resource per `fetch.*` query the page made — masked by the return model of the endpoint and addressed by its `akan://` uri — and a "Tools for this screen: …" line; lists are cut to `promptBudget` (default 60,000 characters). Every `.param()` is a required prompt argument and every `.search()` an optional one, so give each a `desc`. A missing required argument answers a single message pointing at the `<model>List…` tool; a redirect answers a 401 challenge without a token, or "This screen is not available to the signed-in account." with one. `endpoint()` has no `prompt()` kind any more and `Msg` is not public.',
        ko: 'screen을 MCP prompt로 공개하는 page 전용 stage입니다. `.prompt(name, description)`의 description은 model이 받는 지시문 전체이며 영어로 씁니다. `prompts/get`은 호출자의 token으로 page body를 실행하고 description, page가 만든 `fetch.*` query마다 하나의 embedded resource — endpoint의 return model로 마스킹되고 `akan://` uri로 주소가 매겨진 — 그리고 "Tools for this screen: …" 한 줄로 답합니다. list는 `promptBudget`(기본 60,000자)에서 잘립니다. 모든 `.param()`은 필수 prompt 인자, 모든 `.search()`는 optional 인자가 되므로 각각 `desc`를 적어 주세요. 필수 인자가 빠지면 `<model>List…` tool을 가리키는 message 하나로 답하고, redirect는 token이 없으면 401 challenge로, 있으면 "This screen is not available to the signed-in account."로 답합니다. `endpoint()`에는 더 이상 `prompt()` 종류가 없고 `Msg`는 public이 아닙니다.',
      }),
      code: `import { cnst, fetch, Ticket } from "@apps/myapp/client";
import { ID } from "akanjs/base";
import { page } from "akanjs/client";

export default page()
  .param("projectId", ID, { desc: "The project to brief." })
  .search("status", cnst.TicketStatus, { desc: "Only tickets in this status." })
  .prompt("briefProjectTickets", "Brief the ticket board of one project.")
  .render(async ({ projectId, status }) => {
    const { ticketInitInProject } = await fetch.initTicketInProject(projectId, status);
    return <Ticket.Zone.Board init={ticketInitInProject} />;
  });`,
    },
    {
      name: "resolveRouteModule / isRouteDefinition",
      desc: l.trans({
        en: 'What every loader — the RSC worker, the CSR boot, the generated root layout — reads a route module through. `resolveRouteModule(module, key, { kind, pattern })` unfolds the default export of a chain into the named-export shape and passes a legacy module through untouched; `isRouteDefinition(value)` is the test it uses. The rules it enforces: a chain module exports nothing but `default`; `page()` in a `_layout.tsx` or `layout()` in a page file is refused; a page must name every `[x]` segment of its path with `.param()` and a layout may name a subset; `.param("x")` and `.prompt("x", …)` take string literals and `.config({ devOnly })` a literal boolean, because `akan sync` and the build read them off the source. A legacy module still loads, with one deprecation warning per file at boot.',
        ko: 'RSC worker, CSR boot, generated root layout 등 모든 loader가 route module을 읽는 통로입니다. `resolveRouteModule(module, key, { kind, pattern })`은 chain의 default export를 named-export 모양으로 펼치고 legacy module은 그대로 통과시키며, `isRouteDefinition(value)`이 그 판별 함수입니다. 강제하는 규칙은 다음과 같습니다. chain module은 `default` 외에 아무것도 export하지 않습니다. `_layout.tsx`의 `page()`나 page 파일의 `layout()`은 거부됩니다. page는 path의 모든 `[x]` segment를 `.param()`으로 선언해야 하고 layout은 일부만 선언해도 됩니다. `akan sync`와 build가 source에서 읽으므로 `.param("x")`과 `.prompt("x", …)`은 string literal, `.config({ devOnly })`는 literal boolean이어야 합니다. legacy module은 여전히 로드되며 boot 시 파일마다 deprecation warning 하나를 남깁니다.',
      }),
      code: `import { isRouteDefinition, resolveRouteModule } from "akanjs/client";

const mod = await import("./page/project/[projectId]/_index.tsx");
const { module, definition } = resolveRouteModule(mod, "project/[projectId]/_index.tsx", {
  kind: "page",
  pattern: "/:lang/project/:projectId",
});
isRouteDefinition(mod.default); // true for a chain module, so definition is set
module.default; // the render every loader already reads`,
    },
    {
      name: "Font / createFont",
      desc: l.trans({
        en: "Font declaration types and client-side font factory shims. The root layout hands `Font` data to `rootLayout().fonts([...])` so the server build can optimize local font assets while CSR code receives safe no-op shims.",
        ko: "font declaration type과 client-side font factory shim입니다. root layout은 `Font` data를 `rootLayout().fonts([...])`에 넘겨 server build가 local font asset을 optimize하게 하고, CSR code에는 안전한 no-op shim을 제공합니다.",
      }),
      code: `import type { Font } from "akanjs/client";
import { Noto_Sans_KR, rootLayout } from "akanjs/client";

const fonts: Font[] = [{ name: "Noto Sans KR", paths: [{ src: "./font.woff2", weight: 400 }] }];

export default rootLayout().fonts(fonts).render(({ children }) => children);`,
    },
    {
      name: "usePage / msg / Err",
      desc: l.trans({
        en: "Page dictionary and translation helpers generated from Akan dictionaries. Components use `usePage()` for locale-aware text and `msg`/`Err` for message rendering helpers.",
        ko: "Akan dictionary에서 생성되는 page dictionary와 translation helper입니다. component는 locale-aware text에 `usePage()`를 사용하고 message rendering helper로 `msg`/`Err`를 사용합니다.",
      }),
      code: `import { msg, Err, usePage } from "akanjs/client";

const { l } = usePage();
const label = l.trans({ en: "Save", ko: "저장" });`,
    },
    {
      name: "fetch / sig",
      desc: l.trans({
        en: "Typed client fetch proxy built from registered signal metadata. It exposes generated endpoint and slice methods and keeps JWT state synchronized through auth helpers.",
        ko: "registered signal metadata에서 만들어지는 typed client fetch proxy입니다. generated endpoint와 slice method를 제공하고 auth helper를 통해 JWT state를 동기화합니다.",
      }),
      code: `import { fetch, sig } from "akanjs/client";

const user = await fetch.user(userId);
const signals = sig;`,
    },
    {
      name: "getCookie / setCookie / getAccount / getAuthToken",
      desc: l.trans({
        en: "Cookie and account helpers that work across server and client contexts. The auth cookie is keyed per app (`authTokenKey()` returns `jwt:<appName>`) because cookies carry no port, so two apps on one host would otherwise share one token. Read it with `getAuthToken()` rather than by name. `getAccount` decodes the JWT only when it belongs to the current app and environment.",
        ko: "server/client context 모두에서 동작하는 cookie 및 account helper입니다. cookie에는 port가 없어 한 host의 두 app이 token을 공유하게 되므로, auth cookie key는 app별로 분리됩니다(`authTokenKey()`가 `jwt:<appName>`을 반환). 이름으로 직접 읽지 말고 `getAuthToken()`을 사용하세요. `getAccount`는 JWT가 현재 app과 environment에 속할 때만 decode합니다.",
      }),
      code: `import { authTokenKey, getAccount, getAuthToken, setCookie } from "akanjs/client";

const jwt = getAuthToken();
const key = authTokenKey();
const account = getAccount<{ userId: string }>();
setCookie("theme", "dark");`,
    },
    {
      name: "setAuth / initAuth / resetAuth",
      desc: l.trans({
        en: "Authentication helpers that update FetchClient JWT state, cookies, and client storage together. Stores call these after login/logout so future generated fetch calls include the right token.",
        ko: "FetchClient JWT state, cookie, client storage를 함께 업데이트하는 authentication helper입니다. store는 login/logout 이후 이를 호출해 이후 generated fetch call이 올바른 token을 포함하도록 합니다.",
      }),
      code: `import { initAuth, resetAuth, setAuth } from "akanjs/client";

initAuth();
setAuth({ jwt });
resetAuth();`,
    },
    {
      name: "device",
      desc: l.trans({
        en: "Device singleton for Capacitor/native features such as safe-area values, keyboard listeners, haptics, scroll position, platform info, and language detection.",
        ko: "safe-area value, keyboard listener, haptics, scroll position, platform info, language detection 같은 Capacitor/native feature를 위한 device singleton입니다.",
      }),
      code: `import { device } from "akanjs/client";

await device.vibrate("light");
const scrollTop = device.getScrollTop();`,
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="akanjs-client" title="akanjs/client">
        <Docs.Title>akanjs/client</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "`akanjs/client` contains browser/UI-facing helpers: the route chain (`page()`, `layout()`, `rootLayout()`), routing, typed fetch access, dictionary hooks, auth/cookie helpers, device utilities, font declarations, and common UI prop types.",
              ko: "`akanjs/client`는 browser/UI-facing helper를 제공합니다. route chain(`page()`, `layout()`, `rootLayout()`), routing, typed fetch access, dictionary hook, auth/cookie helper, device utility, font declaration, common UI prop type에 사용합니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />
      {symbols.map((symbol) => (
        <Scroll.Slide key={symbol.name} id={symbol.name} title={symbol.name}>
          <Docs.Title>{symbol.name}</Docs.Title>
          <Docs.Description>
            <div>{symbol.desc}</div>
          </Docs.Description>
          <Code.Snippet
            className="w-full"
            title={l.trans({ en: "Usage", ko: "사용 예시" })}
            language="typescript"
            code={symbol.code}
          />
        </Scroll.Slide>
      ))}
      <DocsToc />
    </Scroll>
  );
});
