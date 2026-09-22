import { usePage } from "@apps/akan/client";
import { Code, Divider, Docs, DocsToc, panelRecipe } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

const routeFiles = [
  {
    name: "folder/_index.tsx",
    en: "The page for the folder it sits in. page/(user)/project/[projectId]/_index.tsx serves /:lang/project/:projectId.",
    ko: "자기가 놓인 폴더의 페이지입니다. page/(user)/project/[projectId]/_index.tsx는 /:lang/project/:projectId를 제공합니다.",
  },
  {
    name: "folder/_layout.tsx",
    en: "Wraps every page below its folder. An app's own root _layout.tsx — and a basePath's — is a rootLayout() chain instead.",
    ko: "자기 폴더 아래의 모든 페이지를 감쌉니다. 앱의 root _layout.tsx와 basePath의 root _layout.tsx는 rootLayout() 체인입니다.",
  },
  {
    name: "folder/_overrides.tsx",
    en: "The third reserved filename: a logic-free manifest of UI overrides for this route subtree. Imports plus one export default override({ … }), no directive and no other export.",
    ko: "세 번째 예약 파일명입니다. 이 라우트 하위 트리의 UI override를 적는 로직 없는 매니페스트로, import와 export default override({ … }) 하나만 둡니다. 디렉티브도 다른 export도 없습니다.",
  },
  {
    name: "path.tsx",
    en: "A path segment declared as one file. project.tsx serves /:lang/project. The filename must not start with an uppercase letter.",
    ko: "경로 세그먼트를 파일 하나로 선언합니다. project.tsx는 /:lang/project를 제공합니다. 파일명은 대문자로 시작할 수 없습니다.",
  },
  {
    name: "[param].tsx",
    en: 'A dynamic segment as one file. [projectId].tsx serves /:lang/:projectId, and the page must declare .param("projectId", …).',
    ko: '동적 세그먼트를 파일 하나로 선언합니다. [projectId].tsx는 /:lang/:projectId를 제공하고, 페이지는 .param("projectId", …)을 선언해야 합니다.',
  },
  {
    name: "(group)/",
    en: "Organizes files without adding a URL segment. (user), (public), (tab), (detail) are the usual names.",
    ko: "URL 세그먼트를 더하지 않고 파일을 정리합니다. (user), (public), (tab), (detail)을 주로 씁니다.",
  },
  {
    name: "[lang]/",
    en: "Never written. Akan injects the locale segment itself, and a folder named [lang] fails the load with a message telling you to move the files up one level.",
    ko: "직접 쓰지 않습니다. Akan이 locale 세그먼트를 스스로 주입하며, [lang] 폴더가 있으면 파일을 한 단계 위로 옮기라는 메시지와 함께 로드가 실패합니다.",
  },
  {
    name: "robots.txt.tsx",
    en: "A special route leaf: it is the one shape that does not sit under the locale, so it serves /robots.txt rather than /:lang/robots.txt.",
    ko: "특수 라우트입니다. locale 아래에 놓이지 않는 유일한 형태라서 /:lang/robots.txt가 아니라 /robots.txt를 제공합니다.",
  },
];

const chainStages = [
  {
    key: ".param(name, Type)",
    on: "page · layout · rootLayout",
    required: false,
    en: "One stage per [x] segment of the path, in order. A page must declare every segment it sits under; a layout may declare a subset, and most declare none. Values arrive typed — ID and String give a string, Int and Float a number, Date a Dayjs, an enumOf class its union. A path value the type refuses answers not-found.",
    ko: "경로의 [x] 세그먼트마다 순서대로 하나씩 둡니다. 페이지는 자기가 놓인 세그먼트를 모두 선언해야 하고, 레이아웃은 일부만 선언해도 되며 대부분은 하나도 선언하지 않습니다. 값은 타입이 붙은 채로 도착합니다. ID·String은 string, Int·Float은 number, Date는 Dayjs, enumOf 클래스는 그 유니온입니다. 타입이 거부하는 경로 값은 not-found로 응답합니다.",
  },
  {
    key: ".search(key, Type)",
    on: "page · layout · rootLayout",
    required: false,
    en: "A query key the route reads, always optional. [String] reads a list, and a repeated key or one comma-separated value both arrive as an array. A value the type refuses is dropped the way an absent one is.",
    ko: "라우트가 읽는 쿼리 키이며 항상 선택 사항입니다. [String]은 목록을 읽고, 키를 반복해도 쉼표로 구분해도 배열로 도착합니다. 타입이 거부하는 값은 없는 값처럼 버려집니다.",
  },
  {
    key: ".config({ … })",
    on: "page · layout · rootLayout",
    required: false,
    en: "Client frame behaviour: transition, safeArea, topInset, bottomInset, topSafeAreaColor, bottomSafeAreaColor, gesture, cache, ssr, rscPatchHeadSafe, devOnly. On a layout it is inherited by child pages, and a page's own value wins for the fields it names. Omit it and Akan applies platform defaults while frame components such as Navbar register their own insets.",
    ko: "클라이언트 frame 동작입니다. transition, safeArea, topInset, bottomInset, topSafeAreaColor, bottomSafeAreaColor, gesture, cache, ssr, rscPatchHeadSafe, devOnly를 받습니다. 레이아웃에 두면 하위 페이지가 상속하고, 페이지가 적은 필드는 페이지 값이 이깁니다. 생략하면 Akan이 플랫폼 기본값을 적용하고 Navbar 같은 frame 컴포넌트가 필요한 inset을 직접 등록합니다.",
  },
  {
    key: ".metadata(value | fn)",
    on: "page · layout · rootLayout",
    required: false,
    en: "Declarative title, description, robots, openGraph, twitter, and alternates. Pass an object for static metadata, or a function of the declared arguments for dynamic metadata. The callback receives lang and the declared args — never children.",
    ko: "title·description·robots·openGraph·twitter·alternates를 선언합니다. 정적 메타데이터는 객체로, 동적 메타데이터는 선언한 인자를 받는 함수로 넘깁니다. 콜백은 lang과 선언한 인자를 받고 children은 받지 않습니다.",
  },
  {
    key: ".head(jsx | fn)",
    on: "page · layout · rootLayout",
    required: false,
    en: "Escape hatch for custom JSX head elements when declarative metadata is not enough. Same argument shape as .metadata().",
    ko: "선언형 metadata로 충분하지 않을 때 직접 JSX head element를 넣는 escape hatch입니다. 인자 형태는 .metadata()와 같습니다.",
  },
  {
    key: ".loading(fn)",
    on: "page · layout · rootLayout",
    required: false,
    en: "Fallback UI shown while the route loads. It runs with an empty search map, so every .search() value reads undefined inside it however the type reads.",
    ko: "라우트가 로딩되는 동안 보여줄 대체 UI입니다. 검색 파라미터가 빈 맵인 상태로 실행되므로, 타입과 무관하게 .search() 값은 모두 undefined로 읽힙니다.",
  },
  {
    key: ".prompt(name, desc)",
    on: "page",
    required: false,
    en: "Publishes the screen as an MCP prompt. The description is the whole instruction a model receives; .param() stages become required arguments and .search() stages optional ones. The name must be a string literal of letters, digits, underscore or hyphen.",
    ko: "화면을 MCP prompt로 공개합니다. description이 모델이 받는 지시문 전체이며, .param() 단계는 필수 인자, .search() 단계는 선택 인자가 됩니다. 이름은 문자·숫자·밑줄·하이픈으로 된 문자열 리터럴이어야 합니다.",
  },
  {
    key: ".notFound(fn)",
    on: "layout · rootLayout",
    required: false,
    en: "Layout-scoped 404 UI, rendered inside the layout when a child route is missing. It receives the raw route props — params, searchParams, pathname — not the typed arguments .render() gets.",
    ko: "레이아웃 범위의 404 UI이며, 하위 라우트를 찾지 못하면 레이아웃 안에서 렌더링됩니다. .render()가 받는 타입 인자가 아니라 params·searchParams·pathname 원본을 받습니다.",
  },
  {
    key: ".error(fn)",
    on: "layout · rootLayout",
    required: false,
    en: "Layout-scoped server render error UI, rendered under the nearest layout when a child route throws during SSR. It receives the same raw props plus error and digest.",
    ko: "레이아웃 범위의 서버 렌더링 에러 UI이며, 하위 라우트가 SSR 중 에러를 던지면 가장 가까운 레이아웃 안에서 렌더링됩니다. 같은 원본 props에 error와 digest가 더해집니다.",
  },
  {
    key: ".fonts([…])",
    on: "rootLayout",
    required: false,
    en: "Registers the app-wide fonts. Each entry names the family, its files and weights, and whether it is the default; turning optimize on makes the source a build input that is subsetted and served from /_akan/fonts.",
    ko: "앱 전체에서 쓸 폰트를 등록합니다. 각 항목은 이름, 파일과 weight, 기본 폰트 여부를 담습니다. optimize를 켜면 원본이 빌드 입력이 되어 subset된 뒤 /_akan/fonts에서 제공됩니다.",
  },
  {
    key: ".manifest({ … })",
    on: "rootLayout",
    required: false,
    en: "The web app manifest used for installable and PWA-like behaviour: name, shortName, startUrl, display, themeColor, icons.",
    ko: "설치형 앱이나 PWA 동작에 쓰는 web app manifest입니다. name, shortName, startUrl, display, themeColor, icons를 담습니다.",
  },
  {
    key: ".theme(name)",
    on: "rootLayout",
    required: false,
    en: "The default theme the document carries, such as dark, light, or system. An empty string is honoured rather than dropped.",
    ko: "문서가 들고 갈 기본 테마입니다. dark, light, system 같은 값을 씁니다. 빈 문자열도 버려지지 않고 그대로 적용됩니다.",
  },
  {
    key: ".reconnect(on)",
    on: "rootLayout",
    required: false,
    en: "Mounts the connection-lost overlay that appears when the socket drops and reports when it is back. The socket reconnects on its own either way. Left off, it is on exactly when operationMode is local.",
    ko: "소켓이 끊겼을 때 나타나고 복구되면 알려 주는 연결 끊김 오버레이를 띄웁니다. 오버레이와 무관하게 소켓은 스스로 재연결합니다. 선언하지 않으면 operationMode가 local일 때만 켜집니다.",
  },
  {
    key: ".wsConnect(on)",
    on: "rootLayout",
    required: false,
    en: "Whether the browser connects the client WebSocket runtime after load. Default true. With false, a message or pubsub call warns in the console until fetch.instance.connect() runs.",
    ko: "브라우저가 로드 후 client WebSocket runtime을 연결할지 정합니다. 기본값은 true입니다. false이면 fetch.instance.connect()를 호출하기 전까지 message·pubsub 호출이 콘솔에 경고를 남깁니다.",
  },
  {
    key: ".layoutStyle(style)",
    on: "rootLayout",
    required: false,
    en: "The outer page container style, web or mobile. Use mobile for app-like shells.",
    ko: "바깥 페이지 컨테이너 스타일이며 web 또는 mobile입니다. 앱 같은 화면에는 mobile을 씁니다.",
  },
  {
    key: ".gaTrackingId(id)",
    on: "rootLayout",
    required: false,
    en: "Adds Google Analytics for the app. An empty string is treated as no id.",
    ko: "앱에 Google Analytics를 추가합니다. 빈 문자열은 id가 없는 것으로 봅니다.",
  },
  {
    key: ".render(fn)",
    on: "page · layout · rootLayout",
    required: true,
    en: "The component and the end of the chain. Required — a chain without it fails the load. It receives lang, the declared arguments, and on a layout children. Mark it async only when the body awaits.",
    ko: "컴포넌트이자 체인의 끝입니다. 반드시 필요하며, 없으면 로드가 실패합니다. lang과 선언한 인자를 받고, 레이아웃이라면 children도 받습니다. 본문이 await할 때만 async로 씁니다.",
  },
];

export default page().render(() => {
  const { l } = usePage();
  return (
    <Scroll>
      <Scroll.Slide id="file-based-routing" title={l.trans({ en: "File Based Routing", ko: "파일 기반 라우팅" })}>
        <Docs.Title>{l.trans({ en: "File Based Routing", ko: "파일 기반 라우팅" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Akan uses file-based routing. You create files under page/, and the folder structure becomes the page URL. Every route also sits under a locale segment that Akan injects for you, so the same file serves every language you ship.",
              ko: "Akan은 파일 기반 라우팅을 사용합니다. page/ 아래에 파일을 만들면 폴더 구조가 페이지 URL이 됩니다. 모든 라우트는 Akan이 자동으로 주입하는 locale 세그먼트 아래에 놓이므로, 하나의 파일이 제공하는 모든 언어를 처리합니다.",
            })}
          </div>
          <Docs.Mermaid
            title="From folder to URL"
            highlightNodes={["url"]}
            chart={`flowchart LR
  file["page/(user)/project/[projectId]/_index.tsx"] --> group["(user) adds no segment"]
  group --> lang["Akan injects the locale"]
  lang --> url["/:lang/project/:projectId"]`}
          />
          <div className="space-y-1">
            {[
              [
                l.trans({ en: "File-based", ko: "파일 기반" }),
                l.trans({
                  en: "Folders and files decide the URL shape.",
                  ko: "폴더와 파일이 URL 형태를 결정합니다.",
                }),
              ],
              [
                l.trans({ en: "Locale-aware", ko: "다국어 지원" }),
                l.trans({
                  en: "Akan injects the locale segment automatically and hands it to every route as lang.",
                  ko: "Akan이 locale 세그먼트를 자동으로 주입하고 모든 라우트에 lang으로 전달합니다.",
                }),
              ],
              [
                l.trans({ en: "Explicit files", ko: "명시적인 파일" }),
                l.trans({
                  en: "Use page and layout files instead of hidden magic.",
                  ko: "숨겨진 규칙보다 page와 layout 파일을 명시적으로 사용합니다.",
                }),
              ],
            ].map(([title, desc]) => (
              <div key={title} className={panelRecipe({ padding: "row" })}>
                <span className="font-bold text-foreground">{title}: </span>

                <span className="text-foreground/70 text-sm">{desc}</span>
              </div>
            ))}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="file-convention" title={l.trans({ en: "File Convention", ko: "파일 컨벤션" })}>
        <Docs.Title>{l.trans({ en: "File Convention", ko: "파일 컨벤션" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A route file is a page, a layout, or an overrides manifest. Everything under page/ must be a .tsx route module — no helper file, no logic file, no lowercase-free filename.",
              ko: "라우트 파일은 page, layout, overrides 매니페스트 중 하나입니다. page/ 아래에는 .tsx 라우트 모듈만 둘 수 있습니다. helper 파일도, 로직 파일도, 대문자로 시작하는 파일명도 허용되지 않습니다.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="page/"
          language="bash"
          code={`page/
├── _layout.tsx
├── _index.tsx
├── (public)/
│   └── signin.tsx
│   └── signup.tsx
├── (user)/
│   └── project/
│       └── [projectId]/
│           ├── _layout.tsx
│           ├── _overrides.tsx
│           └── _index.tsx
└── robots.txt.tsx`}
        />
        <Docs.IntroTable
          type={l.trans({ en: "File", ko: "파일" })}
          items={routeFiles.map(({ name, en, ko }) => ({ name, desc: l.trans({ en, ko }) }))}
        />
        <Docs.Alert type="error">
          {l.trans({
            en: "_index.tsx, _layout.tsx and _overrides.tsx are the only reserved names an underscore may introduce. Any other _something.tsx under page/ fails the load, and so does a .ts, .js or .jsx route file.",
            ko: "밑줄로 시작할 수 있는 예약 파일명은 _index.tsx, _layout.tsx, _overrides.tsx 셋뿐입니다. page/ 아래의 다른 _something.tsx는 로드가 실패하며, .ts·.js·.jsx 라우트 파일도 마찬가지입니다.",
          })}
        </Docs.Alert>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="page-module" title={l.trans({ en: "Page File Shape", ko: "페이지 파일 구성" })}>
        <Docs.Title>{l.trans({ en: "Page File Shape", ko: "페이지 파일 구성" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A page file exports one page() chain and nothing else. Every route setting is a stage of that chain: .param() and .search() declare the arguments the page reads, .config(), .metadata() or .head(), and .loading() replace the old named exports, and .render() holds the component. The render receives the declared arguments flat and typed.",
              ko: "페이지 파일은 page() 체인 하나만 export합니다. 모든 라우트 설정은 그 체인의 단계입니다. .param()과 .search()는 페이지가 읽는 인자를 선언하고, .config(), .metadata() 또는 .head(), .loading()이 예전의 named export를 대신하며, .render()가 컴포넌트를 담습니다. render는 선언한 인자를 평탄하고 타입이 붙은 형태로 받습니다.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="page/(user)/project/[projectId]/_index.tsx"
          code={`import { ID } from "akanjs/base";
import { page } from "akanjs/client";

export default page()
  .param("projectId", ID, { desc: "The project to open." })
  .search("tab", String, { desc: "Which tab opens first." })
  .config({ transition: "stack" })
  .metadata(({ projectId }) => ({
    title: \`Project \${projectId}\`,
    description: "Project workspace",
  }))
  .loading(() => <div>Loading...</div>)
  .render(({ projectId, tab }) => {
    return (
      <div>
        Project {projectId} ({tab ?? "overview"})
      </div>
    );
  });`}
        />
        <Code.Snippet
          className="w-full"
          title="Static metadata example"
          code={`import { page } from "akanjs/client";

export default page()
  .metadata({
    title: "Projects",
    description: "Browse your projects",
    openGraph: { title: "Projects", images: ["/og/projects.png"] },
    twitter: { card: "summary_large_image", images: ["/og/projects.png"] },
    alternates: {
      canonical: "https://example.com/projects",
      languages: {
        ko: "https://example.com/ko/projects",
        en: "https://example.com/en/projects",
      },
    },
  })
  .render(() => <div>Projects</div>);`}
        />
        <Docs.Alert type="info">
          {l.trans({
            en: "Use one metadata stage per route module: .metadata() or .head(), never both. Metadata is not merged across layouts and pages; the nearest route module wins. A page() chain is the module's only export — a named export beside it is refused, and the names in .param() and .prompt() must be string literals because akan sync reads them off the source. Coming from the legacy default-function shape? See Page Migration.",
            ko: "라우트 모듈 하나에서는 metadata 단계를 하나만 사용합니다. .metadata() 또는 .head() 중 하나이며 둘을 섞지 않습니다. metadata는 layout과 page 사이에서 병합되지 않고 가장 가까운 라우트 모듈의 설정 하나만 적용됩니다. page() 체인은 모듈의 유일한 export입니다. 옆에 named export가 있으면 거절되고, .param()과 .prompt()의 이름은 akan sync가 소스에서 읽으므로 문자열 리터럴이어야 합니다. 예전 default function 형태에서 넘어오고 있다면 페이지 마이그레이션 문서를 참고하세요.",
          })}
        </Docs.Alert>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="chain-stages" title={l.trans({ en: "Chain Stages", ko: "체인 단계" })}>
        <Docs.Title>{l.trans({ en: "Chain Stages", ko: "체인 단계" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "There are seventeen stages, and the three chains share most of them. page() adds .prompt(); layout() adds .notFound() and .error(); rootLayout() is a layout that also carries the app-wide stages. The Chain column names every builder a stage is legal on.",
              ko: "단계는 모두 열일곱 개이고, 세 체인이 그 대부분을 공유합니다. page()는 .prompt()를, layout()은 .notFound()와 .error()를 더하며, rootLayout()은 앱 공통 단계까지 가진 layout입니다. Chain 열이 각 단계를 쓸 수 있는 체인을 알려 줍니다.",
            })}
          </div>
          <Docs.OptionTable
            items={chainStages.map(({ key, on, required, en, ko }) => ({
              key,
              type: on,
              default: required ? l.trans({ en: "required", ko: "필수" }) : l.trans({ en: "optional", ko: "선택" }),
              desc: l.trans({ en, ko }),
            }))}
          />
          <Docs.Alert type="warning">
            {l.trans({
              en: 'On rootLayout(), the app-wide stages must come before .param() and .search(). Those two stages return a layout type rather than the chain\'s own type, so .theme() and its siblings are gone from what follows them — rootLayout().theme("dark").param("orgId", ID) compiles and the reverse order does not.',
              ko: 'rootLayout()에서는 앱 공통 단계를 .param()·.search()보다 먼저 씁니다. 이 두 단계는 체인 자신의 타입이 아니라 layout 타입을 반환하므로, 그 뒤에서는 .theme()과 형제 단계들이 사라집니다. rootLayout().theme("dark").param("orgId", ID)는 컴파일되고 순서를 뒤집으면 되지 않습니다.',
            })}
          </Docs.Alert>
          <Docs.Alert type="info">
            {l.trans({
              en: "lang is never declared. Every route sits under the locale, the value reaches every stage as lang, and declaring it throws. A page must declare every [x] segment of its path; a layout may leave some undeclared.",
              ko: "lang은 선언하지 않습니다. 모든 라우트가 locale 아래에 놓이고 값이 lang으로 모든 단계에 전달되며, 직접 선언하면 예외가 납니다. 페이지는 경로의 [x] 세그먼트를 모두 선언해야 하고, 레이아웃은 일부를 남겨 둘 수 있습니다.",
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="layout-module" title={l.trans({ en: "Layout File Shape", ko: "레이아웃 파일 구성" })}>
        <Docs.Title>{l.trans({ en: "Layout File Shape", ko: "레이아웃 파일 구성" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A layout file wraps child pages. Use it for shared headers, tabs, sidebars, guards, or page-level shells. Its own .metadata() covers child pages that declare none, and its .notFound() and .error() are the fallback for everything below it.",
              ko: "레이아웃 파일은 하위 페이지를 감쌉니다. 공통 헤더, 탭, 사이드바, 접근 제어, 페이지 껍데기 같은 UI를 둘 때 사용합니다. 자체 .metadata()는 metadata를 선언하지 않은 하위 페이지에 쓰이고, .notFound()와 .error()는 그 아래 전체의 fallback이 됩니다.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="page/(user)/project/[projectId]/_layout.tsx"
          code={`import { ID } from "akanjs/base";
import { layout } from "akanjs/client";

export default layout()
  .param("projectId", ID)
  .loading(() => <div>Loading project...</div>)
  .notFound(({ pathname }) => <div>Project route not found: {pathname}</div>)
  .error(() => <div>Project failed to render.</div>)
  .render(({ children, projectId }) => {
    return (
      <section>
        <nav>Project {projectId}</nav>
        {children}
      </section>
    );
  });`}
        />
        <Docs.Alert type="info">
          {l.trans({
            en: "The .notFound() and .error() stages exist on layout(), not on page(). If a layout declares neither, Akan walks up to the nearest parent layout fallback, then falls back to the framework system page. A page() chain in a _layout.tsx, or a layout() chain in a page file, is refused at load.",
            ko: ".notFound()와 .error() 단계는 page()가 아니라 layout()에 있습니다. 해당 layout이 둘 다 선언하지 않으면 Akan은 가장 가까운 상위 layout fallback을 찾고, 없으면 framework system page를 사용합니다. _layout.tsx의 page() 체인이나 page 파일의 layout() 체인은 로드 시 거절됩니다.",
          })}
        </Docs.Alert>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="root-layout-exports" title={l.trans({ en: "Root Layout Stages", ko: "Root Layout 단계" })}>
        <Docs.Title>{l.trans({ en: "Root Layout Stages", ko: "Root Layout 단계" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "The root _layout.tsx of an app, or of a basePath, is a rootLayout() chain. It is still a layout, but it also carries the app-wide stages for fonts, manifest, theme, realtime connection, analytics, and mobile-style rendering. The stylesheet import stays the first line of the file.",
              ko: "앱 또는 basePath의 root _layout.tsx는 rootLayout() 체인입니다. 기본적으로는 layout이지만 font, manifest, theme, realtime connection, analytics, mobile-style rendering 같은 앱 공통 단계를 함께 가집니다. 스타일시트 import는 파일의 첫 줄에 그대로 둡니다.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="page/_layout.tsx"
          code={`import "./styles.css";
import { rootLayout } from "akanjs/client";

export default rootLayout()
  .fonts([
    {
      name: "pretendard",
      default: true,
      paths: [{ src: "/fonts/pretendard.woff2", weight: 400 }],
    },
  ])
  .manifest({
    name: "Akan App",
    shortName: "Akan",
    startUrl: "/",
    display: "standalone",
    themeColor: "#111827",
  })
  .theme("dark")
  .reconnect(true)
  .wsConnect(true)
  .layoutStyle("web")
  .gaTrackingId("G-XXXXXXXXXX")
  .head(
    <>
      <title>Akan App</title>
      <link rel="icon" href="/favicon.ico" />
    </>,
  )
  .render(({ children }) => children);`}
        />
        <div>
          {l.trans({
            en: "Each of these is one row of the Chain Stages table above, and only .fonts(), .manifest(), .theme(), .reconnect(), .wsConnect(), .layoutStyle() and .gaTrackingId() are exclusive to this file. Everything else here — .config(), .head(), .loading(), .notFound(), .error(), .render() — is the ordinary layout surface.",
            ko: "여기 쓰인 단계는 모두 위의 Chain Stages 표에 한 행씩 있으며, 이 파일에만 있는 것은 .fonts(), .manifest(), .theme(), .reconnect(), .wsConnect(), .layoutStyle(), .gaTrackingId() 일곱 개뿐입니다. 나머지 .config(), .head(), .loading(), .notFound(), .error(), .render()는 일반 layout에도 있는 단계입니다.",
          })}
        </div>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="base-paths" title={l.trans({ en: "Base Paths", ko: "Base Path" })}>
        <Docs.Title>{l.trans({ en: "Base Paths", ko: "Base Path" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "When an app defines base paths in akan.config.ts, page files must live under one of those base path folders. This keeps multi-service or multi-domain apps explicit.",
              ko: "앱이 akan.config.ts에서 base path를 정의하면 page 파일은 해당 base path 폴더 아래에 있어야 합니다. 여러 서비스나 여러 도메인을 가진 앱의 라우트를 명확하게 나누기 위한 규칙입니다.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="apps/myapp/akan.config.ts"
          code={`const config = {
  routes: [
    { domains: { main: ["manager.myapp.com"] }, basePath: "manager" },
    { domains: { main: ["admin.myapp.com"] }, basePath: "admin" },
  ],
};`}
        />
        <Code.Snippet
          className="w-full"
          title="page/"
          language="bash"
          code={`page/
├── manager/
│   └── _index.tsx
└── admin/
    └── _index.tsx`}
        />
        <Docs.Alert type="info">
          {l.trans({
            en: "If base paths are configured, putting a page directly under page/ is invalid. Move it under page/<basePath>/ so Akan can tell which route group owns it.",
            ko: "base path가 설정된 앱에서는 page/ 바로 아래에 페이지를 두면 올바르지 않습니다. Akan이 어떤 라우트 묶음에 속하는지 알 수 있도록 page/<basePath>/ 아래로 옮겨야 합니다.",
          })}
        </Docs.Alert>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="library-pages" title={l.trans({ en: "Library Pages", ko: "라이브러리 페이지" })}>
        <Docs.Title>{l.trans({ en: "Library Pages", ko: "라이브러리 페이지" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A library can ship routes from its own page folder. An app opts in with syncPageLibs, and sync links those routes into page/(libs)/(<lib>). Both folder names are route groups, so a library route keeps its own path.",
              ko: "라이브러리도 자체 page 폴더에 라우트를 담을 수 있습니다. 앱이 syncPageLibs로 사용을 선언하면 sync가 해당 라우트를 page/(libs)/(<lib>)로 링크합니다. 두 폴더 이름 모두 route group이라 라이브러리 라우트는 자기 경로를 그대로 사용합니다.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          title="apps/myapp/akan.config.ts"
          code={`const config = {
  // true: every lib dependency that has a page folder
  // ["shared"]: only the libs listed
  // false (default): nothing is synced
  syncPageLibs: ["shared"],
};`}
        />
        <Code.Snippet
          title="library route mapping"
          language="bash"
          code={`# Source in a library
libs/shared/page/login/_index.tsx

# Linked into an app by \`akan sync\` (generated, gitignored)
apps/myapp/page/(libs)/(shared)/login/_index.tsx

# Browser request
/login`}
        />
        <Docs.Alert type="info">
          {l.trans({
            en: "Edit the library file, never the linked copy. Apps with base paths get the library routes under every base path, and two synced routes that resolve to the same path are reported as an error.",
            ko: "링크된 쪽이 아니라 라이브러리 파일을 수정해야 합니다. base path가 있는 앱은 모든 base path 아래에 라이브러리 라우트를 받고, 같은 경로로 겹치는 라우트가 두 개면 에러로 알려줍니다.",
          })}
        </Docs.Alert>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="dev-only-routes" title={l.trans({ en: "Dev Only Routes", ko: "개발 전용 라우트" })}>
        <Docs.Title>{l.trans({ en: "Dev Only Routes", ko: "개발 전용 라우트" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: ".config({ devOnly: true }) keeps a route out of akan build. It still serves under akan start and is still typechecked, but nothing about it reaches production: no bundle, no route manifest entry, no URL.",
              ko: ".config({ devOnly: true })를 켜면 해당 라우트가 akan build에서 제외됩니다. akan start에서는 그대로 동작하고 타입 검사도 계속 받지만, 번들에도 라우트 매니페스트에도 들어가지 않아 프로덕션에서는 존재하지 않습니다.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          title="page/(dev)/playground/_index.tsx"
          code={`import { page } from "akanjs/client";

export default page()
  .config({ devOnly: true })
  .render(() => <div>Component playground</div>);`}
        />
        <Docs.Alert type="info">
          {l.trans({
            en: "On a _layout file, devOnly removes every route under that directory too, so a whole dev-only section can be marked once. Write it as a literal true or false — the build reads it from the source without running the module.",
            ko: "_layout 파일에 지정하면 그 디렉토리 아래 라우트가 모두 함께 제외되므로 개발 전용 구역 전체를 한 번에 표시할 수 있습니다. 빌드는 모듈을 실행하지 않고 소스에서 값을 읽으므로 반드시 리터럴 true 또는 false로 작성해야 합니다.",
          })}
        </Docs.Alert>
      </Scroll.Slide>
      <DocsToc />
    </Scroll>
  );
});
