import { usePage } from "@apps/akan/client";
import { Code, Divider, Docs, DocsToc, panelRecipe } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();
  return (
    <Scroll>
      <Scroll.Slide id="file-based-routing" title={l.trans({ en: "File Based Routing", ko: "파일 기반 라우팅" })}>
        <Docs.Title>{l.trans({ en: "File Based Routing", ko: "파일 기반 라우팅" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Akan uses file-based routing. You create files under page/, and the folder structure becomes the page URL. Most pages also get a language parameter automatically, so the same file can serve localized URLs.",
              ko: "Akan은 파일 기반 라우팅을 사용합니다. page/ 아래에 파일을 만들면 폴더 구조가 페이지 URL이 됩니다. 대부분의 페이지에는 언어 파라미터가 자동으로 붙어서 하나의 파일이 다국어 URL을 처리할 수 있습니다.",
            })}
          </div>
          <div className={panelRecipe({ radius: "2xl", padding: "lg" })}>
            <div className="mb-4 font-bold text-foreground">
              {l.trans({ en: "How files become routes", ko: "파일이 라우트가 되는 방식" })}
            </div>
            <div className="grid gap-3 lg:grid-cols-3">
              {[
                {
                  label: l.trans({ en: "Page file", ko: "페이지 파일" }),
                  file: "page/(user)/project/[projectId]/_index.tsx",
                  result: "/:lang/project/:projectId",
                  desc: l.trans({
                    en: "The index file becomes the route endpoint.",
                    ko: "index 파일은 실제 라우트 진입점이 됩니다.",
                  }),
                },
                {
                  label: l.trans({ en: "Layout file", ko: "레이아웃 파일" }),
                  file: "page/(user)/project/[projectId]/_layout.tsx",
                  result: "wraps child pages",
                  desc: l.trans({
                    en: "The layout wraps pages below the same folder.",
                    ko: "layout은 같은 폴더 아래의 페이지를 감쌉니다.",
                  }),
                },
                {
                  label: l.trans({ en: "Route group", ko: "라우트 그룹" }),
                  file: "(user)",
                  result: "not in URL",
                  desc: l.trans({
                    en: "Parentheses organize files without adding a URL segment.",
                    ko: "괄호 폴더는 URL 세그먼트를 추가하지 않고 파일을 정리합니다.",
                  }),
                },
              ].map(({ label, file, result, desc }) => (
                <div key={label} className="rounded-xl border border-border bg-muted p-4">
                  <div className="text-foreground/60 text-xs">{label}</div>
                  <div className="mt-2 break-all font-mono text-primary text-sm">{file}</div>
                  <div className="my-3 flex items-center gap-2 text-foreground/40 text-xs">
                    <div className="h-px flex-1 bg-border" />
                    <span>to</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <div className="font-mono text-foreground text-sm">{result}</div>
                  <div className="mt-2 text-foreground/70 text-sm">{desc}</div>
                </div>
              ))}
            </div>
          </div>
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
                  en: "Akan injects [lang] automatically and hands it to every route as lang.",
                  ko: "Akan이 [lang]을 자동으로 주입하고 모든 라우트에 lang으로 전달합니다.",
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
              en: "A route file can be a page or a layout. _index.tsx renders the current segment, _layout.tsx wraps child segments, and route groups organize files without changing the URL.",
              ko: "라우트 파일은 page 또는 layout이 될 수 있습니다. _index.tsx는 현재 세그먼트를 렌더링하고, _layout.tsx는 하위 세그먼트를 감싸며, route group은 URL을 바꾸지 않고 파일을 정리합니다.",
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
│           └── _index.tsx
└── robots.txt.tsx`}
        />
        <div className="space-y-1">
          <div className={panelRecipe()}>
            <div className="font-mono font-semibold text-primary">_index.tsx</div>
            <div className="mt-2 text-foreground/70 text-sm">
              {l.trans({
                en: "Page for the folder it lives in.",
                ko: "파일이 위치한 폴더 자체의 페이지입니다.",
              })}
            </div>
          </div>
          <div className={panelRecipe()}>
            <div className="font-mono font-semibold text-primary">_layout.tsx</div>
            <div className="mt-2 text-foreground/70 text-sm">
              {l.trans({
                en: "Layout that wraps child pages below it.",
                ko: "아래에 있는 자식 페이지를 감싸는 레이아웃입니다.",
              })}
            </div>
          </div>
          <div className={panelRecipe()}>
            <div className="font-mono font-semibold text-primary">(group)</div>
            <div className="mt-2 text-foreground/70 text-sm">
              {l.trans({
                en: "Organizes files without adding a URL segment.",
                ko: "URL 세그먼트를 추가하지 않고 파일을 정리합니다.",
              })}
            </div>
          </div>
          <div className={panelRecipe()}>
            <div className="font-mono font-semibold text-primary">&lt;path&gt;.tsx</div>
            <div className="mt-2 text-foreground/70 text-sm">
              {l.trans({
                en: "Single-file page for a path segment. project.tsx becomes /:lang/project.",
                ko: "경로 세그먼트를 파일 하나로 선언하는 페이지입니다. project.tsx는 /:lang/project가 됩니다.",
              })}
            </div>
          </div>
          <div className={panelRecipe()}>
            <div className="font-mono font-semibold text-primary">[&lt;param&gt;].tsx</div>
            <div className="mt-2 text-foreground/70 text-sm">
              {l.trans({
                en: "Single-file dynamic page. [projectId].tsx becomes /:lang/:projectId.",
                ko: "동적 경로를 파일 하나로 선언하는 페이지입니다. [projectId].tsx는 /:lang/:projectId가 됩니다.",
              })}
            </div>
          </div>
        </div>
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
        <div className="space-y-1">
          {[
            {
              name: ".param(name, Type, { desc })",
              desc: l.trans({
                en: "One stage per [x] segment of the file's path, in order. A page must declare every segment it sits under; use ID for names ending in Id. A path value the type refuses answers not-found.",
                ko: "파일 경로의 [x] 세그먼트마다 순서대로 하나씩 둡니다. 페이지는 자기가 놓인 세그먼트를 모두 선언해야 하며, Id로 끝나는 이름에는 ID를 씁니다. 타입이 거부하는 경로 값은 not-found로 응답합니다.",
              }),
            },
            {
              name: ".search(key, Type | [Type], { desc })",
              desc: l.trans({
                en: "A query key the page reads, optional and typed. [String] reads a list; a value the type refuses is dropped the way an absent one is.",
                ko: "페이지가 읽는 쿼리 키입니다. 선택 사항이며 타입이 붙습니다. [String]은 목록을 읽고, 타입이 거부하는 값은 없는 값처럼 버려집니다.",
              }),
            },
            {
              name: ".config({ … })",
              desc: l.trans({
                en: "Optional override for client frame behavior: transition, safeArea, topInset, bottomInset, gesture, cache, ssr, devOnly. If omitted, Akan applies platform defaults and frame components such as Navbar or BottomInset register their own insets.",
                ko: "클라이언트 frame 동작을 위한 선택적 override입니다. transition, safeArea, topInset, bottomInset, gesture, cache, ssr, devOnly를 받습니다. 생략하면 Akan이 플랫폼 기본값을 적용하고 Navbar, BottomInset 같은 frame 컴포넌트가 필요한 inset을 자동 등록합니다.",
              }),
            },
            {
              name: ".metadata(value | (args) => value)",
              desc: l.trans({
                en: "Declarative metadata for title, description, robots, Open Graph, Twitter, canonical, and language alternates. Pass an object for static metadata, or a function of the declared arguments for dynamic metadata.",
                ko: "title, description, robots, Open Graph, Twitter, canonical, language alternate를 선언하는 메타데이터입니다. 정적 메타데이터는 객체로, 동적 메타데이터는 선언한 인자를 받는 함수로 넘깁니다.",
              }),
            },
            {
              name: ".head(jsx | (args) => jsx)",
              desc: l.trans({
                en: "Escape hatch for custom JSX head elements when declarative metadata is not enough.",
                ko: "선언형 metadata로 충분하지 않을 때 직접 JSX head element를 넣는 escape hatch입니다.",
              }),
            },
            {
              name: ".loading((args) => jsx)",
              desc: l.trans({
                en: "Fallback UI shown while the page is loading.",
                ko: "페이지가 로딩되는 동안 보여줄 대체 UI입니다.",
              }),
            },
            {
              name: ".prompt(name, description)",
              desc: l.trans({
                en: "Publishes the screen as an MCP prompt. The description is the whole instruction a model receives; .param() stages become required arguments and .search() stages optional ones.",
                ko: "화면을 MCP prompt로 공개합니다. description이 모델이 받는 지시문 전체이며, .param() 단계는 필수 인자, .search() 단계는 선택 인자가 됩니다.",
              }),
            },
            {
              name: ".render((args) => jsx)",
              desc: l.trans({
                en: "The page component and the end of the chain. This is required. Mark it async only when it awaits.",
                ko: "페이지 컴포넌트이자 체인의 끝입니다. 반드시 필요합니다. await할 때만 async로 씁니다.",
              }),
            },
          ].map(({ name, desc }) => (
            <div key={name} className={panelRecipe({ padding: "row" })}>
              <div className="font-mono font-semibold text-primary">{name}</div>
              <div className="mt-2 text-foreground/70 text-sm">{desc}</div>
            </div>
          ))}
        </div>
        <Docs.Alert type="info">
          {l.trans({
            en: "Use one metadata stage per route module: .metadata() or .head(), never both. Metadata is not merged across layouts and pages; the nearest route module wins. A page() chain is the module's only export — a named export beside it is refused, and the names in .param() and .prompt() must be string literals because akan sync reads them off the source. Coming from the legacy default-function shape? See Page Migration.",
            ko: "라우트 모듈 하나에서는 metadata 단계를 하나만 사용합니다. .metadata() 또는 .head() 중 하나이며 둘을 섞지 않습니다. metadata는 layout과 page 사이에서 병합되지 않고 가장 가까운 라우트 모듈의 설정 하나만 적용됩니다. page() 체인은 모듈의 유일한 export입니다. 옆에 named export가 있으면 거절되고, .param()과 .prompt()의 이름은 akan sync가 소스에서 읽으므로 문자열 리터럴이어야 합니다. 예전 default function 형태에서 넘어오고 있다면 페이지 마이그레이션 문서를 참고하세요.",
          })}
        </Docs.Alert>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="layout-module" title={l.trans({ en: "Layout File Shape", ko: "레이아웃 파일 구성" })}>
        <Docs.Title>{l.trans({ en: "Layout File Shape", ko: "레이아웃 파일 구성" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A layout file wraps child pages. Use it for shared headers, tabs, sidebars, guards, or page-level shells.",
              ko: "레이아웃 파일은 하위 페이지를 감쌉니다. 공통 헤더, 탭, 사이드바, 접근 제어, 페이지 껍데기 같은 UI를 둘 때 사용합니다.",
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
        <div>
          {l.trans({
            en: "A layout() chain supports .render(), .param() for the segments it reads, .config(), .metadata() or .head(), .loading(), .notFound(), and .error(). A layout may declare a subset of the [x] segments in its path — most read none. Layout metadata is used for child pages without their own metadata/head stage, and the nearest layout fallback renders when a child route is missing or fails.",
            ko: "layout() 체인은 .render(), 읽는 세그먼트를 위한 .param(), .config(), .metadata() 또는 .head(), .loading(), .notFound(), .error()를 지원합니다. 레이아웃은 경로에 있는 [x] 세그먼트 중 일부만 선언할 수 있습니다. 대부분은 아무것도 읽지 않습니다. 자체 metadata/head 단계가 없는 child page에는 layout metadata가 사용되고, 하위 라우트를 찾지 못하거나 렌더링에 실패하면 가장 가까운 layout fallback이 렌더링됩니다.",
          })}
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {[
            {
              name: ".notFound(({ pathname }) => jsx)",
              desc: l.trans({
                en: "Layout-scoped 404 UI. It renders under the layout when a child route is missing or router.notFound() is called below it.",
                ko: "레이아웃 범위의 404 UI입니다. 하위 라우트를 찾지 못하거나 해당 layout 아래에서 router.notFound()가 호출되면 layout 안에서 렌더링됩니다.",
              }),
            },
            {
              name: ".error(({ error, pathname }) => jsx)",
              desc: l.trans({
                en: "Layout-scoped server render error UI. It renders under the nearest layout when a child route throws during SSR.",
                ko: "레이아웃 범위의 서버 렌더링 에러 UI입니다. 하위 라우트가 SSR 중 에러를 던지면 가장 가까운 layout 안에서 렌더링됩니다.",
              }),
            },
          ].map(({ name, desc }) => (
            <div key={name} className={panelRecipe({ padding: "none" }, "px-4 py-3")}>
              <div className="font-mono font-semibold text-primary">{name}</div>
              <div className="mt-2 text-foreground/70 text-sm">{desc}</div>
            </div>
          ))}
        </div>
        <Docs.Alert type="info">
          {l.trans({
            en: "The .notFound() and .error() stages exist on layout(), not on page(). If a layout declares neither, Akan walks up to the nearest parent layout fallback, then falls back to the framework system page. A page() chain in a _layout.tsx, or a layout() chain in a page file, is refused at load.",
            ko: ".notFound()와 .error() 단계는 page()가 아니라 layout()에 있습니다. 해당 layout이 둘 다 선언하지 않으면 Akan은 가장 가까운 상위 layout fallback을 찾고, 없으면 framework system page를 사용합니다. _layout.tsx의 page() 체인이나 page 파일의 layout() 체인은 로드 시 거절됩니다.",
          })}
        </Docs.Alert>
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
      <div className="divider" />

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
      <div className="divider" />

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
        <div className="space-y-1">
          {[
            {
              name: ".fonts([…])",
              desc: l.trans({
                en: "Registers app-wide fonts so pages can use them consistently.",
                ko: "앱 전체에서 사용할 폰트를 등록합니다.",
              }),
            },
            {
              name: ".manifest({ … })",
              desc: l.trans({
                en: "Defines the web app manifest used for installable/PWA-like behavior.",
                ko: "설치형 앱이나 PWA에 가까운 동작에 사용하는 웹 앱 manifest를 정의합니다.",
              }),
            },
            {
              name: '.theme("dark")',
              desc: l.trans({
                en: "Chooses the default theme policy, such as dark, light, system, or css.",
                ko: "dark, light, system, css 같은 기본 테마 정책을 정합니다.",
              }),
            },
            {
              name: ".reconnect(boolean)",
              desc: l.trans({
                en: "Mounts the connection-lost overlay that appears when the socket drops and reports when it is back. The socket reconnects on its own either way. Defaults to on when operationMode is local.",
                ko: "소켓이 끊겼을 때 나타나고 복구되면 알려주는 연결 끊김 오버레이를 띄울지 정합니다. 오버레이와 무관하게 소켓은 스스로 재연결합니다. operationMode가 local이면 기본값은 켜짐입니다.",
              }),
            },
            {
              name: ".wsConnect(boolean)",
              desc: l.trans({
                en: "Controls whether the browser connects the client WebSocket runtime after load. The default is true. If false, message/pubsub calls warn in the browser console until fetch.instance.connect() is called.",
                ko: "브라우저 로드 후 client WebSocket runtime을 연결할지 정합니다. 기본값은 true입니다. false이면 fetch.instance.connect()를 호출하기 전 message/pubsub 호출 시 브라우저 콘솔에 warning이 표시됩니다.",
              }),
            },
            {
              name: '.layoutStyle("web" | "mobile")',
              desc: l.trans({
                en: "Switches the outer page container style. Use mobile for app-like mobile shells.",
                ko: "바깥 페이지 컨테이너 스타일을 바꿉니다. 앱 같은 모바일 화면에는 mobile을 사용합니다.",
              }),
            },
            {
              name: ".config({ … })",
              desc: l.trans({
                en: "Optional layout-level frame override inherited by child pages. A page's own .config() still wins for explicitly declared fields.",
                ko: "하위 페이지가 상속하는 layout 단위 frame override입니다. 명시된 필드는 page 자체의 .config()가 우선합니다.",
              }),
            },
            {
              name: '.gaTrackingId("G-…")',
              desc: l.trans({
                en: "Adds Google Analytics tracking for the app.",
                ko: "앱에 Google Analytics 추적을 추가합니다.",
              }),
            },
          ].map(({ name, desc }) => (
            <div key={name} className={panelRecipe({ padding: "row" })}>
              <div className="font-mono font-semibold text-primary">{name}</div>
              <div className="mt-2 text-foreground/70 text-sm">{desc}</div>
            </div>
          ))}
        </div>
        <Docs.Alert type="info">
          {l.trans({
            en: "Most of these stages exist only on rootLayout(). A nested layout() may also call .config() when it needs a shared mobile frame override for its child pages.",
            ko: "이 단계들은 대부분 rootLayout()에만 있습니다. 다만 중첩 layout()도 하위 페이지에 공통 모바일 frame override가 필요하면 .config()를 호출할 수 있습니다.",
          })}
        </Docs.Alert>
      </Scroll.Slide>
      <DocsToc />
    </Scroll>
  );
});
