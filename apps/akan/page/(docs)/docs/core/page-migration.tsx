import { usePage } from "@apps/akan/client";
import { Code, Divider, Docs, DocsToc, panelRecipe } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();
  return (
    <Scroll>
      <Scroll.Slide id="why-the-chain" title={l.trans({ en: "Why The Chain", ko: "왜 체인인가" })}>
        <Docs.Title>{l.trans({ en: "Why The Chain", ko: "왜 체인인가" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A route file used to be a default function beside a handful of named exports: pageConfig, generateMetadata, Loading, fonts, and so on. It is now one declaration — export default page()…render(fn) — and every route setting is a stage of that chain. This page walks each legacy shape to its chain form.",
              ko: "라우트 파일은 default function 옆에 pageConfig, generateMetadata, Loading, fonts 같은 named export를 나열하는 형태였습니다. 이제는 선언 하나 — export default page()…render(fn) — 이고, 모든 라우트 설정은 그 체인의 단계입니다. 이 문서는 예전 형태 하나하나를 체인 형태로 옮기는 과정을 다룹니다.",
            })}
          </div>
          <div className="space-y-1">
            {[
              [
                l.trans({ en: "One declaration", ko: "선언 하나" }),
                l.trans({
                  en: "The module has a single export, so the loader reads one shape and a setting cannot drift into a stray named export.",
                  ko: "모듈의 export가 하나이므로 로더는 한 가지 형태만 읽고, 설정이 떨어져 나간 named export로 흩어질 수 없습니다.",
                }),
              ],
              [
                l.trans({ en: "Typed arguments", ko: "타입이 붙은 인자" }),
                l.trans({
                  en: ".param() and .search() declare what the page reads, and .render() receives those values flat and already typed, with lang — the locale segment — on every route without a stage. A path value the type refuses answers not-found; a bad search value is dropped.",
                  ko: ".param()과 .search()가 페이지가 읽는 것을 선언하고, .render()는 그 값을 평탄하고 타입이 맞춰진 형태로 받습니다. 로케일 세그먼트인 lang은 선언 없이 모든 라우트에 함께 옵니다. 타입이 거부하는 경로 값은 not-found로 응답하고, 잘못된 검색 값은 버려집니다.",
                }),
              ],
              [
                l.trans({ en: "The page is also the prompt", ko: "페이지가 곧 prompt" }),
                l.trans({
                  en: "The same declaration publishes the screen to MCP with .prompt(): its .param() stages are the required arguments and its .search() stages the optional ones. Nothing is declared twice.",
                  ko: "같은 선언이 .prompt()로 화면을 MCP에 공개합니다. .param() 단계가 필수 인자, .search() 단계가 선택 인자가 됩니다. 어느 것도 두 번 선언하지 않습니다.",
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

      <Scroll.Slide id="plain-page" title={l.trans({ en: "A Plain Page", ko: "단순한 페이지" })}>
        <Docs.Title>{l.trans({ en: "A Plain Page", ko: "단순한 페이지" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Drop the function keyword, hand the body to .render(), and close with });. usePage(), getSelf() and fetch.* are called inside it exactly as before. Mark the render async only when it awaits.",
              ko: "function 키워드를 지우고 본문을 .render()에 넘긴 뒤 });로 닫습니다. usePage(), getSelf(), fetch.*는 그 안에서 이전과 똑같이 호출합니다. await할 때만 render를 async로 씁니다.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title={l.trans({ en: "Before · page/about.tsx", ko: "이전 · page/about.tsx" })}
          code={`import { usePage } from "@apps/myapp/client";

export default function Page() {
  const { l } = usePage();
  return <h1>{l("about.title")}</h1>;
}`}
        />
        <Code.Snippet
          className="w-full"
          title={l.trans({ en: "After · page/about.tsx", ko: "이후 · page/about.tsx" })}
          code={`import { usePage } from "@apps/myapp/client";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();
  return <h1>{l("about.title")}</h1>;
});`}
        />
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide
        id="params-and-search"
        title={l.trans({ en: "Params And Search Params", ko: "파라미터와 검색 파라미터" })}
      >
        <Docs.Title>{l.trans({ en: "Params And Search Params", ko: "파라미터와 검색 파라미터" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "PageProps is gone. Every [x] segment of the file's path becomes a .param() stage, in order, and every query key the page reads becomes a .search() stage. pageConfig, generateMetadata and Loading fold into .config(), .metadata() and .loading(). The render receives the declared arguments by name.",
              ko: "PageProps는 사라졌습니다. 파일 경로의 [x] 세그먼트마다 순서대로 .param() 단계가 되고, 페이지가 읽는 쿼리 키마다 .search() 단계가 됩니다. pageConfig, generateMetadata, Loading은 .config(), .metadata(), .loading()으로 접힙니다. render는 선언한 인자를 이름으로 받습니다.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title={l.trans({
            en: "Before · page/(user)/project/[projectId]/_index.tsx",
            ko: "이전 · page/(user)/project/[projectId]/_index.tsx",
          })}
          code={`import { fetch, Task } from "@apps/myapp/client";
import type { GenerateMetadata, PageConfig } from "akanjs/client";

interface PageProps {
  params: { projectId: string };
  searchParams?: { tab?: string; tags?: string | string[] };
}

export default async function Page({ params, searchParams }: PageProps) {
  const { projectId } = params;
  const tags = [searchParams?.tags ?? []].flat();
  const [{ taskInitInProject }] = await Promise.all([fetch.initTaskInProject(projectId)]);
  return <Task.Zone.Card init={taskInitInProject} tab={searchParams?.tab} tags={tags} />;
}

export const pageConfig = { transition: "stack" } satisfies PageConfig;

export const generateMetadata = (({ params }) => ({
  title: \`Project \${params.projectId}\`,
})) satisfies GenerateMetadata;

export function Loading() {
  return <div>Loading project...</div>;
}`}
        />
        <Code.Snippet
          className="w-full"
          title={l.trans({
            en: "After · page/(user)/project/[projectId]/_index.tsx",
            ko: "이후 · page/(user)/project/[projectId]/_index.tsx",
          })}
          code={`import { fetch, Task } from "@apps/myapp/client";
import { ID } from "akanjs/base";
import { page } from "akanjs/client";

export default page()
  .param("projectId", ID, { desc: "The project to open." })
  .search("tab", String, { desc: "Which tab opens first." })
  .search("tags", [String], { desc: "Tags to filter by." })
  .config({ transition: "stack" })
  .metadata(({ projectId }) => ({ title: \`Project \${projectId}\` }))
  .loading(() => <div>Loading project...</div>)
  .render(async ({ projectId, tab, tags }) => {
    const [{ taskInitInProject }] = await Promise.all([fetch.initTaskInProject(projectId)]);
    return <Task.Zone.Card init={taskInitInProject} tab={tab} tags={tags ?? []} />;
  });`}
        />
        <div className="space-y-1">
          {[
            {
              name: "ID · String",
              desc: l.trans({
                en: "Arrive as string. Use ID for every segment whose name ends in Id.",
                ko: "string으로 도착합니다. 이름이 Id로 끝나는 세그먼트에는 ID를 씁니다.",
              }),
            },
            {
              name: "Int · Float",
              desc: l.trans({
                en: "Arrive as number. A path segment that does not parse answers not-found.",
                ko: "number로 도착합니다. 파싱되지 않는 경로 세그먼트는 not-found로 응답합니다.",
              }),
            },
            {
              name: "Boolean · Date",
              desc: l.trans({
                en: "Arrive as boolean and as Dayjs. String, Boolean and Date are globals; ID, Int and Float come from akanjs/base.",
                ko: "boolean과 Dayjs로 도착합니다. String, Boolean, Date는 전역이고 ID, Int, Float는 akanjs/base에서 가져옵니다.",
              }),
            },
            {
              name: "enumOf class",
              desc: l.trans({
                en: "Arrives as the enum's value union, so cnst.ServeType yields the same type the model field carries.",
                ko: "enum의 value union으로 도착합니다. cnst.ServeType은 모델 필드와 같은 타입을 냅니다.",
              }),
            },
            {
              name: "[T]",
              desc: l.trans({
                en: "Search only. Arrives as an array; ?tags=a is a one-item list. Every search argument is optional, so it may be undefined.",
                ko: "search 전용입니다. 배열로 도착하며 ?tags=a는 항목 하나인 목록입니다. 모든 search 인자는 선택 사항이라 undefined일 수 있습니다.",
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
            en: 'Keep the body order inside .render(): usePage(), then auth such as getSelf({ unauthorize: "/signin" }), then the fetches in one Promise.all, then the return. Only the wrapper changed.',
            ko: '.render() 안의 본문 순서는 그대로입니다. usePage(), 그다음 getSelf({ unauthorize: "/signin" }) 같은 인증, 그다음 Promise.all 하나에 담은 fetch, 마지막에 return입니다. 바뀐 것은 감싸는 껍데기뿐입니다.',
          })}
        </Docs.Alert>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="layout" title={l.trans({ en: "A Layout", ko: "레이아웃" })}>
        <Docs.Title>{l.trans({ en: "A Layout", ko: "레이아웃" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A _layout.tsx becomes a layout() chain. It takes the same stages as page(), receives children beside its arguments, and replaces the NotFound and Error exports with .notFound() and .error(). A layout declares only the [x] segments it reads — most read none and declare no .param() at all.",
              ko: "_layout.tsx는 layout() 체인이 됩니다. page()와 같은 단계를 받고, 인자 옆에 children을 함께 받으며, NotFound와 Error export를 .notFound()와 .error()로 대신합니다. 레이아웃은 자기가 읽는 [x] 세그먼트만 선언합니다. 대부분은 아무것도 읽지 않으므로 .param()이 하나도 없습니다.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title={l.trans({ en: "Before · page/org/[orgId]/_layout.tsx", ko: "이전 · page/org/[orgId]/_layout.tsx" })}
          code={`import type { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
  params: { orgId: string };
}

export default function Layout({ children, params }: LayoutProps) {
  return <section data-org={params.orgId}>{children}</section>;
}

export function Loading() {
  return <div>Loading...</div>;
}

export function NotFound({ pathname }: { pathname: string }) {
  return <div>Nothing at {pathname}</div>;
}

export function Error() {
  return <div>Something went wrong.</div>;
}`}
        />
        <Code.Snippet
          className="w-full"
          title={l.trans({ en: "After · page/org/[orgId]/_layout.tsx", ko: "이후 · page/org/[orgId]/_layout.tsx" })}
          code={`import { ID } from "akanjs/base";
import { layout } from "akanjs/client";

export default layout()
  .param("orgId", ID)
  .loading(() => <div>Loading...</div>)
  .notFound(({ pathname }) => <div>Nothing at {pathname}</div>)
  .error(() => <div>Something went wrong.</div>)
  .render(({ children, orgId }) => <section data-org={orgId}>{children}</section>);`}
        />
        <Docs.Alert type="info">
          {l.trans({
            en: "A layout that reads nothing is the shortest chain there is: export default layout().render(({ children }) => …). Auth gates such as getSelf({ unauthorize }) stay inside that render, before any markup.",
            ko: "아무것도 읽지 않는 레이아웃은 가장 짧은 체인입니다. export default layout().render(({ children }) => …). getSelf({ unauthorize }) 같은 인증 게이트는 그 render 안, 마크업보다 앞에 그대로 둡니다.",
          })}
        </Docs.Alert>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="root-layout" title={l.trans({ en: "The Root Layout", ko: "루트 레이아웃" })}>
        <Docs.Title>{l.trans({ en: "The Root Layout", ko: "루트 레이아웃" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "The root _layout.tsx of an app, or of a basePath, becomes a rootLayout() chain. Each app-wide export — fonts, theme, manifest, reconnect, wsConnect, layoutStyle, gaTrackingId, head — is a stage of the same name. The stylesheet import stays the first line.",
              ko: "앱 또는 basePath의 root _layout.tsx는 rootLayout() 체인이 됩니다. fonts, theme, manifest, reconnect, wsConnect, layoutStyle, gaTrackingId, head 같은 앱 공통 export는 각각 같은 이름의 단계가 됩니다. 스타일시트 import는 첫 줄에 그대로 둡니다.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title={l.trans({ en: "Before · page/_layout.tsx", ko: "이전 · page/_layout.tsx" })}
          code={`import "./styles.css";
import type { Font, LayoutProps, WebAppManifest } from "akanjs/client";

export const fonts: Font[] = [
  { name: "pretendard", default: true, paths: [{ src: "/fonts/pretendard.woff2", weight: 400 }] },
];
export const manifest: WebAppManifest = {
  name: "My App",
  shortName: "MyApp",
  startUrl: "/",
  display: "standalone",
};
export const theme = "dark";
export const reconnect = false;
export const wsConnect = false;
export const layoutStyle = "web";
export const gaTrackingId = "G-XXXXXXXXXX";
export const head = (
  <>
    <title>My App</title>
    <link rel="icon" href="/favicon.ico" />
  </>
);

export default function Layout({ children }: LayoutProps) {
  return <>{children}</>;
}`}
        />
        <Code.Snippet
          className="w-full"
          title={l.trans({ en: "After · page/_layout.tsx", ko: "이후 · page/_layout.tsx" })}
          code={`import "./styles.css";
import { rootLayout } from "akanjs/client";

export default rootLayout()
  .fonts([{ name: "pretendard", default: true, paths: [{ src: "/fonts/pretendard.woff2", weight: 400 }] }])
  .manifest({ name: "My App", shortName: "MyApp", startUrl: "/", display: "standalone" })
  .theme("dark")
  .reconnect(false)
  .wsConnect(false)
  .layoutStyle("web")
  .gaTrackingId("G-XXXXXXXXXX")
  .head(
    <>
      <title>My App</title>
      <link rel="icon" href="/favicon.ico" />
    </>,
  )
  .render(({ children }) => children);`}
        />
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="mapping" title={l.trans({ en: "Mapping Table", ko: "대응표" })}>
        <Docs.Title>{l.trans({ en: "Mapping Table", ko: "대응표" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Every legacy export has exactly one chain stage. Read the left column off the file you are migrating and write the right column.",
              ko: "예전 export마다 대응하는 체인 단계가 정확히 하나 있습니다. 옮기려는 파일에서 왼쪽 열을 읽고 오른쪽 열을 씁니다.",
            })}
          </div>
        </Docs.Description>
        <div className="space-y-1">
          {[
            ["interface PageProps { params: { x } } + [x] folder", '.param("x", Type, { desc })'],
            ["searchParams.k", '.search("k", Type | [Type], { desc })'],
            ["params.lang", "lang — on every route, never declared"],
            ["export const pageConfig", ".config({ … })"],
            ["export const head / generateHead", ".head(jsx | (args) => jsx)"],
            ["export const metadata / generateMetadata", ".metadata(obj | (args) => obj)"],
            ["export function Loading", ".loading((args) => jsx)"],
            ["export default function Page", ".render((args) => jsx)"],
            ["export default function Layout", "layout().render(({ children, …args }) => jsx)"],
            ["export function NotFound / Error", ".notFound(fn) / .error(fn)"],
            [
              "fonts · theme · manifest · reconnect · wsConnect · layoutStyle · gaTrackingId",
              "rootLayout().fonts() .theme() .manifest() .reconnect() .wsConnect() .layoutStyle() .gaTrackingId()",
            ],
            ["prompt() on endpoint()", '.prompt("name", "description") on the page'],
          ].map(([legacy, chain]) => (
            <div key={legacy} className={panelRecipe({ padding: "row" }, "grid gap-1 lg:grid-cols-2")}>
              <div className="font-mono text-foreground/70 text-sm">{legacy}</div>
              <div className="font-mono font-semibold text-primary text-sm">{chain}</div>
            </div>
          ))}
        </div>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="rules" title={l.trans({ en: "Rules The Loader Enforces", ko: "로더가 강제하는 규칙" })}>
        <Docs.Title>{l.trans({ en: "Rules The Loader Enforces", ko: "로더가 강제하는 규칙" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "The route loader and akan sync read the same rules. The loader applies them when a module is imported; akan sync reads the chain off the source without evaluating it, so a broken file is named before the first request.",
              ko: "라우트 로더와 akan sync는 같은 규칙을 읽습니다. 로더는 모듈을 import할 때 적용하고, akan sync는 모듈을 실행하지 않고 소스에서 체인을 읽으므로 잘못된 파일은 첫 요청 전에 이름이 불립니다.",
            })}
          </div>
        </Docs.Description>
        <div className="space-y-1">
          {[
            [
              l.trans({ en: "One export", ko: "export 하나" }),
              l.trans({
                en: "A chain module exports nothing beside default. A named export beside the chain is refused — every route setting is a stage.",
                ko: "체인 모듈은 default 외에 아무것도 export하지 않습니다. 체인 옆의 named export는 거절됩니다. 모든 라우트 설정은 단계입니다.",
              }),
            ],
            [
              l.trans({ en: "The right root for the file", ko: "파일에 맞는 루트" }),
              l.trans({
                en: "page() in a _layout.tsx, or layout() in a page file, is refused.",
                ko: "_layout.tsx의 page()나 page 파일의 layout()은 거절됩니다.",
              }),
            ],
            [
              l.trans({ en: "Every segment declared", ko: "모든 세그먼트 선언" }),
              l.trans({
                en: 'A page must .param() every [x] segment of its path, in order; a layout may declare a subset. akan sync refuses a [projectId] folder whose page declares no .param("projectId"), and a .param() naming a segment that is not in the path.',
                ko: '페이지는 경로의 모든 [x] 세그먼트를 순서대로 .param()해야 하고, 레이아웃은 일부만 선언할 수 있습니다. akan sync는 페이지가 .param("projectId")를 선언하지 않은 [projectId] 폴더와, 경로에 없는 세그먼트를 이름 짓는 .param()을 거절합니다.',
              }),
            ],
            [
              l.trans({ en: "String literals", ko: "문자열 리터럴" }),
              l.trans({
                en: "The names in .param() and .prompt(), and devOnly in .config(), are read off the source without running the module, so they must be literals.",
                ko: ".param()과 .prompt()의 이름, .config()의 devOnly는 모듈을 실행하지 않고 소스에서 읽으므로 리터럴이어야 합니다.",
              }),
            ],
            [
              l.trans({ en: "One metadata stage", ko: "metadata 단계 하나" }),
              l.trans({
                en: ".metadata() or .head(), never both in one module. Metadata is not merged across layouts and pages; the nearest route module wins.",
                ko: "한 모듈에서는 .metadata() 또는 .head() 중 하나입니다. metadata는 layout과 page 사이에서 병합되지 않고 가장 가까운 라우트 모듈이 이깁니다.",
              }),
            ],
            [
              l.trans({ en: "_overrides.tsx is unchanged", ko: "_overrides.tsx는 그대로" }),
              l.trans({
                en: "The UI-override manifest keeps its export default override({ … }) shape. Only page and layout files migrate.",
                ko: "UI override 매니페스트는 export default override({ … }) 형태를 유지합니다. page와 layout 파일만 옮깁니다.",
              }),
            ],
          ].map(([title, desc]) => (
            <div key={title} className={panelRecipe({ padding: "row" })}>
              <span className="font-bold text-foreground">{title}: </span>
              <span className="text-foreground/70 text-sm">{desc}</span>
            </div>
          ))}
        </div>
        <div>
          {l.trans({
            en: "The legacy shape still loads. Each unmigrated file is named once at boot, so the server log is the list of what is left:",
            ko: "예전 형태도 여전히 로드됩니다. 옮기지 않은 파일마다 부팅 시 한 번 이름이 불리므로, 서버 로그가 남은 파일 목록입니다:",
          })}
        </div>
        <Code.Snippet
          className="w-full"
          title={l.trans({ en: "Boot warning", ko: "부팅 경고" })}
          language="bash"
          code={`page/(user)/project/[projectId]/_index.tsx uses the legacy route shape (a default function beside named exports). Write \`export default page()…\` instead — see the "Migrating page/" recipe.`}
        />
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="mcp-prompts" title={l.trans({ en: "MCP Prompts", ko: "MCP 프롬프트" })}>
        <Docs.Title>{l.trans({ en: "MCP Prompts", ko: "MCP 프롬프트" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "prompt() on endpoint() is removed. This is a breaking change: a signal file can no longer declare a prompt, and the Msg helpers it built messages with are no longer public. A screen is published as an MCP prompt from its page instead, with the .prompt() stage. The description is the whole instruction the model receives — English, in the API's own vocabulary. Agent.Guide is for the in-page agent and never reaches MCP.",
              ko: "endpoint()의 prompt()는 제거되었습니다. 호환성이 깨지는 변경입니다. signal 파일은 더 이상 prompt를 선언할 수 없고, 메시지를 만들던 Msg 헬퍼도 더 이상 public이 아닙니다. 화면은 대신 그 페이지에서 .prompt() 단계로 MCP prompt로 공개됩니다. description이 모델이 받는 지시문 전체이며, API 어휘를 그대로 쓴 영어로 씁니다. Agent.Guide는 인페이지 에이전트용이며 MCP에는 닿지 않습니다.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="page/(user)/project/[projectId]/tickets.tsx"
          code={`import { fetch, Ticket } from "@apps/myapp/client";
import { ID } from "akanjs/base";
import { page } from "akanjs/client";

export default page()
  .param("projectId", ID, { desc: "The project to brief." })
  .search("statuses", [String], { desc: "Statuses to include." })
  .prompt("briefProjectTickets", "Brief the ticket board of one project.")
  .render(async ({ projectId, statuses }) => {
    const { ticketInitInProject } = await fetch.initTicketInProject(projectId, statuses ?? []);
    return <Ticket.Zone.Board init={ticketInitInProject} />;
  });`}
        />
        <div className="space-y-1">
          {[
            {
              name: "prompts/list",
              desc: l.trans({
                en: "Every page with a .prompt() stage. Its .param() stages are required arguments and its .search() stages optional ones; a list argument's description gets \"Comma-separated list.\" appended and is typed comma-separated in prompts/get. ID, Int and enum values are validated by the page's own declaration. Names match ^[A-Za-z0-9_-]{1,64}$ and are unique across pages. Page prompts exist only when web is enabled.",
                ko: '.prompt() 단계가 있는 모든 페이지입니다. .param() 단계는 필수 인자, .search() 단계는 선택 인자가 됩니다. 목록 인자의 description에는 "Comma-separated list."가 덧붙고 prompts/get에서는 쉼표로 구분해 입력합니다. ID, Int, enum 값은 페이지 자체 선언으로 검증됩니다. 이름은 ^[A-Za-z0-9_-]{1,64}$에 맞고 페이지 사이에서 유일합니다. 페이지 prompt는 web이 켜져 있을 때만 존재합니다.',
              }),
            },
            {
              name: "prompts/get",
              desc: l.trans({
                en: "Runs the page's body — root layouts, layouts, then the page render — in the RSC worker under the caller's bearer token. No JSX is rendered and no client component runs; every fetch.* query the page made is recorded. The answer is the description as the first user message, one embedded resource per query masked by the endpoint's return model and addressed by the akan:// uri the tool answers to, and a final \"Tools for this screen: a, b, c.\" line naming the published tools of the modules the page fetched from, filtered per caller.",
                ko: '페이지 본문 — root layout, layout, 그다음 페이지 render — 을 호출자의 bearer token으로 RSC worker에서 실행합니다. JSX는 렌더되지 않고 client component도 실행되지 않으며, 페이지가 만든 fetch.* query가 모두 기록됩니다. 응답은 첫 user message로 description, query마다 endpoint의 return model로 마스킹되고 그 tool이 응답하는 akan:// uri로 주소가 매겨진 embedded resource 하나씩, 그리고 페이지가 fetch한 모듈의 공개 tool을 호출자 기준으로 걸러 이름 짓는 마지막 한 줄 "Tools for this screen: a, b, c."입니다.',
              }),
            },
            {
              name: "promptBudget",
              desc: l.trans({
                en: 'Lists are cut largest-first until the attachments fit 60,000 characters, and the cut is said: "Attached the first N of M rows of `key`; call it for the rest." Tune it with option.setMcp({ promptBudget }) or AKAN_MCP_PROMPT_BUDGET.',
                ko: '첨부가 60,000자에 들어올 때까지 가장 큰 목록부터 잘리며, 잘렸다는 사실을 말합니다. "Attached the first N of M rows of `key`; call it for the rest." option.setMcp({ promptBudget }) 또는 AKAN_MCP_PROMPT_BUDGET로 조정합니다.',
              }),
            },
            {
              name: l.trans({ en: "Refusals", ko: "거절 응답" }),
              desc: l.trans({
                en: 'A required argument left out answers one message and runs nothing: "No <arg> was named for \\"<prompt>\\". Find it with <model>List…, then run this prompt again with <arg>=<id>." A redirect such as getSelf({ unauthorize }) answers a 401 challenge without a token, otherwise "This screen is not available to the signed-in account." Not-found answers "No screen exists for these arguments." and a throw answers "The page failed to load."',
                ko: '필수 인자가 빠지면 메시지 하나로 답하고 아무것도 실행하지 않습니다. "No <arg> was named for \\"<prompt>\\". Find it with <model>List…, then run this prompt again with <arg>=<id>." getSelf({ unauthorize }) 같은 redirect는 token이 없으면 401 challenge로, 있으면 "This screen is not available to the signed-in account."로 답합니다. not-found는 "No screen exists for these arguments.", throw는 "The page failed to load."로 답합니다.',
              }),
            },
            {
              name: l.trans({ en: "In-page chat", ko: "인페이지 채팅" }),
              desc: l.trans({
                en: "Agent.Chat keeps only its six built-in slash commands — /new, /retry, /compact, /copy, /help, /tools. App prompts are not listed there; a page prompt is for MCP clients.",
                ko: "Agent.Chat은 자체 slash command 여섯 개만 유지합니다 — /new, /retry, /compact, /copy, /help, /tools. 앱 prompt는 거기에 오르지 않습니다. 페이지 prompt는 MCP 클라이언트를 위한 것입니다.",
              }),
            },
          ].map(({ name, desc }) => (
            <div key={name} className={panelRecipe({ padding: "row" })}>
              <div className="font-mono font-semibold text-primary">{name}</div>
              <div className="mt-2 text-foreground/70 text-sm">{desc}</div>
            </div>
          ))}
        </div>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="verify" title={l.trans({ en: "Verify", ko: "검증" })}>
        <Docs.Title>{l.trans({ en: "Verify", ko: "검증" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Typecheck catches an argument the render reads but the chain never declared, and lint catches a stray named export or an import that crossed a boundary. Run both after each file.",
              ko: "typecheck는 render가 읽지만 체인이 선언하지 않은 인자를 잡고, lint는 남은 named export나 경계를 넘은 import를 잡습니다. 파일마다 둘을 모두 실행하세요.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title={l.trans({ en: "From the repo root", ko: "저장소 루트에서" })}
          language="bash"
          code={`bun run akan typecheck <app>
bun run akan lint <app>`}
        />
        <Docs.Alert type="info">
          {l.trans({
            en: "The legacy shape still loads, so an app migrates file by file. Each file that has not moved yet logs the boot warning above once; when the log is quiet, the migration is complete.",
            ko: "예전 형태도 여전히 로드되므로 앱은 파일 단위로 옮길 수 있습니다. 아직 옮기지 않은 파일마다 위 부팅 경고가 한 번 남고, 로그가 조용해지면 마이그레이션이 끝난 것입니다.",
          })}
        </Docs.Alert>
      </Scroll.Slide>
      <DocsToc />
    </Scroll>
  );
});
