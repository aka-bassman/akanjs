import { usePage } from "@apps/akan/client";
import { Code, Divider, Docs, DocsToc } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();

  const bulletList = "my-4 list-disc space-y-2 pl-5";
  const stepList = "my-4 list-decimal space-y-2 pl-5";

  const termRows = [
    {
      name: l.trans({ en: "chunk", ko: "청크(chunk)" }),
      desc: l.trans({
        en: "A JavaScript file the bundler splits off, downloaded only when something asks for it.",
        ko: "번들러가 따로 떼어 낸 JavaScript 파일로, 브라우저는 필요해질 때만 이 파일을 받습니다.",
      }),
    },
    {
      name: l.trans({ en: "Suspense boundary", ko: "Suspense 경계" }),
      desc: l.trans({
        en: "A React boundary that shows a placeholder while something inside it is still loading.",
        ko: "안쪽 내용이 아직 로딩 중일 때 그 자리에 자리 표시(placeholder)를 대신 보여 주는 React 경계입니다.",
      }),
    },
    {
      name: "shell",
      desc: l.trans({
        en: "The first HTML the server sends; content inside a boundary may stream in after it.",
        ko: "서버가 가장 먼저 보내는 HTML로, 경계 안쪽 내용은 그 뒤에 스트리밍으로 따라올 수 있습니다.",
      }),
    },
  ];

  const whenColumns = [
    { key: "lazy", label: "lazy()", code: true },
    { key: "eager", label: "import", code: true },
  ];
  const whenGroups = [
    {
      label: l.trans({ en: "Split it off", ko: "떼어 낼 것" }),
      rows: [
        {
          name: (
            <span className="font-sans">
              {l.trans({
                en: "Maps · charts · editors · 3D viewers · wallet widgets",
                ko: "지도 · 차트 · 에디터 · 3D 뷰어 · 지갑 위젯",
              })}
            </span>
          ),
          desc: l.trans({
            en: "Heavy code, and often browser-only.",
            ko: "코드가 무겁고, 브라우저에서만 도는 경우가 많습니다.",
          }),
          marks: { lazy: true, eager: false },
        },
        {
          name: (
            <span className="font-sans">
              {l.trans({ en: "Large admin panels opened now and then", ko: "가끔만 여는 큰 관리자 패널" })}
            </span>
          ),
          desc: l.trans({
            en: "Most visits never open it, so most visits never pay for it.",
            ko: "대부분의 방문에서는 열리지 않으니, 그 비용도 치르지 않습니다.",
          }),
          marks: { lazy: true, eager: false },
        },
      ],
    },
    {
      label: l.trans({ en: "Import it directly", ko: "그냥 import할 것" }),
      rows: [
        {
          name: <span className="font-sans">{l.trans({ en: "Tiny buttons", ko: "작은 버튼" })}</span>,
          desc: l.trans({
            en: "Too small to be worth a separate download.",
            ko: "따로 받을 만큼 크지 않습니다.",
          }),
          marks: { lazy: false, eager: true },
        },
        {
          name: (
            <span className="font-sans">{l.trans({ en: "Above-the-fold content", ko: "첫 화면의 핵심 내용" })}</span>
          ),
          desc: l.trans({
            en: "Users need it right away, so deferring it only makes them wait.",
            ko: "사용자가 바로 봐야 하므로, 미루면 기다리게 할 뿐입니다.",
          }),
          marks: { lazy: false, eager: true },
        },
      ],
    },
  ];

  const lazyOptions = [
    {
      key: "ssr",
      type: "boolean",
      default: "true",
      desc: l.trans({
        en: "`false` skips server rendering: the server sends `loading`, and the chunk loads after mount.",
        ko: "`false`면 서버 렌더링을 건너뛰어 서버는 `loading`만 보내고, 청크는 마운트 뒤에 받습니다.",
      }),
    },
    {
      key: "suspense",
      type: "boolean",
      default: "false",
      desc: l.trans({
        en: "Gives the component its own Suspense boundary, so only this spot waits for the chunk.",
        ko: "컴포넌트를 전용 Suspense 경계로 감싸, 청크를 기다리는 동안 이 자리만 기다리게 합니다.",
      }),
    },
    {
      key: "loading",
      type: "() => ReactNode",
      desc: l.trans({
        en: "The placeholder, shown only with `ssr: false` or `suspense: true`.",
        ko: "`ssr: false`나 `suspense: true`일 때만 보이는 자리 표시입니다.",
      }),
    },
  ];

  const deferColumns = [
    { key: "lazy", label: "import()", code: true },
    { key: "eager", label: "import", code: true },
  ];
  const onDemand = { lazy: true, eager: false };
  const deferGroups = [
    {
      label: l.trans({
        en: "Defer: heavy, and an app may never configure it",
        ko: "미룰 것: 무겁고, 앱이 설정하지 않을 수도 있음",
      }),
      rows: [
        {
          name: "discord.js",
          desc: l.trans({
            en: "Sends Discord messages, about 23 MiB.",
            ko: "Discord 메시지 전송용이며, 약 23 MiB입니다.",
          }),
          marks: onDemand,
        },
        {
          name: "puppeteer",
          desc: l.trans({
            en: "A headless browser for PDF output, about 19 MiB.",
            ko: "PDF 생성에 쓰는 헤드리스 브라우저이며, 약 19 MiB입니다.",
          }),
          marks: onDemand,
        },
        {
          name: "nodemailer",
          desc: l.trans({ en: "Sends mail, about 16 MiB.", ko: "메일 발송용이며, 약 16 MiB입니다." }),
          marks: onDemand,
        },
        {
          name: "firebase-admin",
          desc: l.trans({ en: "Push notifications, about 2 MiB.", ko: "푸시 알림용이며, 약 2 MiB입니다." }),
          marks: onDemand,
        },
        {
          name: <span className="font-sans">{l.trans({ en: "An image encoder", ko: "이미지 인코더" })}</span>,
          desc: l.trans({
            en: "Heavy, and only the apps that process images need it.",
            ko: "무겁고, 이미지를 다루는 앱에만 필요합니다.",
          }),
          marks: onDemand,
        },
      ],
    },
    {
      label: l.trans({ en: "Keep eager: every request uses it", ko: "그대로 둘 것: 매 요청에 쓰임" }),
      rows: [
        {
          name: "jwt · aes",
          desc: l.trans({
            en: "Deferring only moves the load to the first request.",
            ko: "미뤄도 로딩이 첫 요청으로 옮겨 갈 뿐입니다.",
          }),
          marks: { lazy: false, eager: true },
        },
      ],
    },
  ];

  const memoryEnv = [
    {
      key: "AKAN_MEMORY_LOG",
      type: '"1"',
      desc: l.trans({
        en: "Logs each server process's resident memory (RSS) on an interval.",
        ko: "서버 프로세스마다 상주 메모리(RSS)를 주기적으로 로그에 남깁니다.",
      }),
    },
    {
      key: "AKAN_MEMORY_LOG_INTERVAL_MS",
      type: "number",
      default: "60000",
      desc: l.trans({
        en: "How often the report is written, in milliseconds.",
        ko: "보고 주기이며, 단위는 밀리초입니다.",
      }),
    },
  ];

  const modeColumns = [
    { key: "server", label: l.trans({ en: "Server render", ko: "서버 렌더링" }) },
    { key: "loading", label: l.trans({ en: "Shows loading", ko: "loading 표시" }) },
  ];
  const modeGroups = [
    {
      label: l.trans({ en: "Rendered on the server", ko: "서버에서 그리는 설정" }),
      rows: [
        {
          name: "lazy(loader)",
          desc: l.trans({
            en: "The default, for a component that can render on the server.",
            ko: "기본값이며, 서버에서 그릴 수 있는 컴포넌트에 씁니다.",
          }),
          marks: { server: true, loading: false },
        },
        {
          name: "{ suspense: true }",
          desc: l.trans({
            en: "Use it for what mounts after a click: a modal body, an editor, a dropdown.",
            ko: "클릭한 뒤에 마운트되는 모달 본문, 에디터, 드롭다운에 씁니다.",
          }),
          marks: { server: true, loading: true },
        },
      ],
    },
    {
      label: l.trans({ en: "Rendered in the browser only", ko: "브라우저에서만 그리는 설정" }),
      rows: [
        {
          name: "{ ssr: false }",
          desc: l.trans({
            en: "Use it when the library needs `window`, `document`, canvas, WebGL or browser storage.",
            ko: "라이브러리가 `window`, `document`, canvas, WebGL, 브라우저 저장소를 필요로 할 때 씁니다.",
          }),
          marks: { server: false, loading: true },
        },
      ],
    },
  ];

  const moreLinks = [
    {
      href: "/references/akanjs/webkit#lazy",
      title: l.trans({ en: "lazy() reference", ko: "lazy() 레퍼런스" }),
      desc: l.trans({
        en: "The `lazy` entry in the `akanjs/webkit` reference.",
        ko: "`akanjs/webkit` 레퍼런스의 `lazy` 항목입니다.",
      }),
    },
    {
      href: "/references/ui/system#ClientSide",
      title: "ClientSide",
      desc: l.trans({
        en: "A Suspense boundary you place yourself around several lazy parts.",
        ko: "여러 lazy 조각을 직접 감싸는 Suspense 경계입니다.",
      }),
    },
    {
      href: "/docs/arch/frontend#splitting-a-screen",
      title: l.trans({ en: "Splitting one screen", ko: "한 화면을 나누기" }),
      desc: l.trans({
        en: "Where the `index_.tsx` pair fits among the other SSR techniques.",
        ko: "`index_.tsx` 쌍이 다른 SSR 기법과 어떻게 어울리는지 설명합니다.",
      }),
    },
    {
      href: "/cheatsheet/observability/metrics#memory-log",
      title: l.trans({ en: "Memory logs", ko: "메모리 로그" }),
      desc: l.trans({
        en: "Reading `AKAN_MEMORY_LOG` output over time.",
        ko: "시간에 따라 쌓인 `AKAN_MEMORY_LOG` 출력을 읽는 법입니다.",
      }),
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="overview" title={l.trans({ en: "Lazy Loading", ko: "지연 로딩" })}>
        <Docs.Title>{l.trans({ en: "Lazy Loading", ko: "지연 로딩" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  Lazy loading keeps a heavy component out of the first download. Its code arrives only when the user
                  actually reaches it, through <code>lazy()</code> from <code>akanjs/webkit</code>.
                </span>
              ),
              ko: (
                <span>
                  지연 로딩은 무거운 컴포넌트를 첫 다운로드에서 빼 두는 방식입니다. 그 코드는 사용자가 실제로 그
                  컴포넌트를 쓸 때 내려받으며, <code>akanjs/webkit</code>의 <code>lazy()</code>로 구현합니다.
                </span>
              ),
            })}
          </div>
          <Docs.SubSubTitle>{l.trans({ en: "Words used on this page", ko: "이 페이지에서 쓰는 말" })}</Docs.SubSubTitle>
          <Docs.IntroTable type={l.trans({ en: "Term", ko: "용어" })} items={termRows} />
          <Docs.SubSubTitle>{l.trans({ en: "What to split", ko: "무엇을 나눌까" })}</Docs.SubSubTitle>
          <Docs.Matrix
            type={l.trans({ en: "Component", ko: "컴포넌트" })}
            columns={whenColumns}
            groups={whenGroups}
            markLabel={l.trans({ en: "Load it this way", ko: "이 방식으로 불러옵니다" })}
            emptyLabel={l.trans({ en: "Not this way", ko: "이 방식이 아닙니다" })}
          />
          <Docs.SubSubTitle>{l.trans({ en: "lazy() options", ko: "lazy() 옵션" })}</Docs.SubSubTitle>
          <div>
            {l.trans({
              en: (
                <span>
                  <code>lazy(loader, option?)</code> takes a function that returns <code>import(…)</code> and gives back
                  a component you render like any other.
                </span>
              ),
              ko: (
                <span>
                  <code>lazy(loader, option?)</code>는 <code>import(…)</code>를 돌려주는 함수를 받아, 평소처럼
                  렌더링하는 컴포넌트를 돌려줍니다.
                </span>
              ),
            })}
          </div>
          <Docs.OptionTable items={lazyOptions} />
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="external" title={l.trans({ en: "External Libraries", ko: "외부 라이브러리" })}>
        <Docs.Title>{l.trans({ en: "External Libraries", ko: "외부 라이브러리" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  Some libraries are large, or touch browser-only APIs such as <code>window</code> the moment they load.
                  Load them through a pair of files in <code>ui/&lt;Folder&gt;/</code>, and turn server rendering off
                  with <code>ssr: false</code> when they need the browser.
                </span>
              ),
              ko: (
                <span>
                  어떤 라이브러리는 크거나, 불러오는 순간 <code>window</code> 같은 브라우저 전용 API를 건드립니다. 이런
                  라이브러리는 <code>ui/&lt;Folder&gt;/</code>의 파일 두 개를 거쳐 불러오고, 브라우저가 필요하면{" "}
                  <code>ssr: false</code>로 서버 렌더링을 끕니다.
                </span>
              ),
            })}
          </div>
          <ol className={stepList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <code>index_.tsx</code> starts with <code>{'"use client"'}</code> and exports the{" "}
                    <code>lazy()</code> component.
                  </span>
                ),
                ko: (
                  <span>
                    <code>index_.tsx</code>는 <code>{'"use client"'}</code>로 시작하고 <code>lazy()</code> 컴포넌트를
                    내보냅니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <code>index.tsx</code> has no <code>{'"use client"'}</code>. It imports from <code>./index_</code>,
                    and the rest of the app imports it.
                  </span>
                ),
                ko: (
                  <span>
                    <code>index.tsx</code>에는 <code>{'"use client"'}</code>가 없습니다. <code>./index_</code>에서
                    가져오며, 앱의 다른 파일은 이 파일을 import합니다.
                  </span>
                ),
              })}
            </li>
          </ol>
          <div>
            {l.trans({
              en: "First, the client file that loads the library:",
              ko: "먼저 라이브러리를 불러오는 클라이언트 파일입니다.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="apps/koyo/ui/ArticleMap/index_.tsx"
          code={`"use client";
import { lazy } from "akanjs/webkit";

export const MapWidget = lazy(() => import("heavy-map-widget"), {
  ssr: false,
  loading: () => (
    <div className="h-64 w-full animate-pulse rounded-box bg-muted" />
  ),
});`}
        />
        <Docs.Description>
          <div>
            {l.trans({
              en: "Then the server-safe component that pages import:",
              ko: "다음은 페이지가 import하는, 서버에서도 안전한 컴포넌트입니다.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="apps/koyo/ui/ArticleMap/index.tsx"
          code={`import { MapWidget } from "./index_";

interface ArticleMapProps {
  center: { lat: number; lng: number };
}
export const ArticleMap = ({ center }: ArticleMapProps) => {
  return <MapWidget center={center} />;
};`}
        />
        <Docs.Description>
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Why two files.</strong> A namespace exported from a <code>{'"use client"'}</code> file
                    reaches the server as one stub, so <code>X.Member</code> reads <code>undefined</code>. Build
                    namespaces and wrappers in <code>index.tsx</code>; merging the pair breaks RSC.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>파일이 두 개인 이유.</strong> <code>{'"use client"'}</code> 파일에서 내보낸 namespace는
                    서버에 스텁(stub) 하나로 도착해서, <code>X.Member</code>가 <code>undefined</code>가 됩니다.
                    namespace와 감싸는 컴포넌트는 <code>index.tsx</code>에 만들고, 두 파일을 합치면 RSC가 깨집니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      <code>lazy()</code> renders the module's <code>default</code>.
                    </strong>{" "}
                    That is why <code>lazy()</code> targets use <code>export default</code>. For a named export, resolve
                    the loader to it: <code>import("./X").then((m) =&gt; m.X)</code>.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      <code>lazy()</code>는 모듈의 <code>default</code>를 렌더링합니다.
                    </strong>{" "}
                    그래서 <code>lazy()</code> 대상에는 <code>export default</code>를 씁니다. named export라면 loader가
                    그 컴포넌트를 돌려주게 합니다: <code>import("./X").then((m) =&gt; m.X)</code>.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Set the library up in your own file.</strong> When it needs setup such as plugin
                    registration, write a sibling file with <code>export default</code> and lazy-load that, as{" "}
                    <code>libs/util/ui/Chart</code> does.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>설정이 필요하면 내 파일로 감쌉니다.</strong> 플러그인 등록 같은 준비가 필요하면{" "}
                    <code>export default</code>를 가진 옆 파일을 만들고 그 파일을 lazy로 불러옵니다.{" "}
                    <code>libs/util/ui/Chart</code>가 이렇게 합니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Pages never import the package.</strong> Pages and module files may not import a third-party
                    package, so it enters only through this <code>ui/</code> folder.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>페이지는 패키지를 직접 import하지 않습니다.</strong> 페이지와 모듈 파일은 서드파티 패키지를
                    import할 수 없으므로, 패키지는 이 <code>ui/</code> 폴더로만 들어옵니다.
                  </span>
                ),
              })}
            </li>
          </ul>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="internal" title={l.trans({ en: "Large Components", ko: "큰 컴포넌트" })}>
        <Docs.Title>{l.trans({ en: "Large Components", ko: "큰 컴포넌트" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Your own components split the same way. It pays off most for a heavy editor or dashboard that opens only after a click.",
              ko: "직접 만든 컴포넌트도 같은 방식으로 나눕니다. 클릭한 뒤에야 열리는 무거운 에디터나 대시보드에서 효과가 가장 큽니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: (
                <span>
                  Give anything that mounts after the page is painted its own boundary with <code>suspense: true</code>:
                </span>
              ),
              ko: (
                <span>
                  페이지가 그려진 뒤에 마운트되는 것에는 <code>suspense: true</code>로 전용 경계를 둡니다.
                </span>
              ),
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="apps/koyo/ui/ArticleEditor/index_.tsx"
          code={`"use client";
import { lazy } from "akanjs/webkit";

export const ArticleEditor = lazy(() => import("./Editor"), {
  suspense: true,
  loading: () => (
    <div className="h-64 w-full animate-pulse rounded-box bg-muted" />
  ),
});`}
        />
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  Render it only when it is needed. The chunk downloads the first time <code>open</code> turns true:
                </span>
              ),
              ko: (
                <span>
                  필요할 때만 렌더링합니다. 청크는 <code>open</code>이 처음 true가 될 때 받습니다.
                </span>
              ),
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="apps/koyo/ui/ArticleEditor/index.tsx"
          code={`import { ArticleEditor } from "./index_";

interface EditPanelProps {
  open: boolean;
}
export const EditPanel = ({ open }: EditPanelProps) => {
  return open ? <ArticleEditor /> : null;
};`}
        />
        <Docs.Description>
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      Without <code>suspense: true</code>, the whole page flashes.
                    </strong>{" "}
                    The wait climbs to the nearest boundary, usually the route, and the page repaints as its loading
                    screen on the first open.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      <code>suspense: true</code>를 빼면 페이지 전체가 깜빡입니다.
                    </strong>{" "}
                    기다림이 가장 가까운 경계(보통 route)까지 올라가서, 처음 열 때 페이지 전체가 로딩 화면으로 다시
                    그려집니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      Leave <code>suspense: true</code> off page bodies.
                    </strong>{" "}
                    With streaming SSR, what sits inside the boundary leaves the shell and arrives later. SEO snapshots,
                    prerendering and pre-hydration E2E read only the shell, so they would miss it.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      페이지 본문에는 <code>suspense: true</code>를 쓰지 않습니다.
                    </strong>{" "}
                    스트리밍 SSR에서는 경계 안쪽이 shell에서 빠지고 나중에 도착합니다. SEO 스냅샷, 프리렌더링, hydration
                    전 E2E는 shell만 읽으므로 그 내용을 놓칩니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      <code>akanjs/ui</code> does the same.
                    </strong>{" "}
                    Every <code>Model.*</code> modal and wrapper is a <code>lazy()</code> export with{" "}
                    <code>suspense: true</code>.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      <code>akanjs/ui</code>도 이렇게 합니다.
                    </strong>{" "}
                    <code>Model.*</code>의 모달과 래퍼는 모두 <code>suspense: true</code>를 단 <code>lazy()</code>
                    export입니다.
                  </span>
                ),
              })}
            </li>
          </ul>
        </Docs.Description>
        <Docs.Alert type="warning">
          {l.trans({
            en: (
              <span>
                <strong>
                  <code>loading</code> alone shows nothing.
                </strong>{" "}
                Without <code>suspense: true</code> or <code>ssr: false</code> the component has no boundary of its own,
                so the placeholder you passed is never rendered.
              </span>
            ),
            ko: (
              <span>
                <strong>
                  <code>loading</code>만으로는 아무것도 보이지 않습니다.
                </strong>{" "}
                <code>suspense: true</code>나 <code>ssr: false</code>가 없으면 컴포넌트에 자기 경계가 없어서, 넘긴 자리
                표시가 한 번도 그려지지 않습니다.
              </span>
            ),
          })}
        </Docs.Alert>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="server" title={l.trans({ en: "Server Adapters", ko: "서버 어댑터" })}>
        <Docs.Title>{l.trans({ en: "Server Adapters", ko: "서버 어댑터" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "The same idea applies on the server, where the cost is memory instead of bundle size. A heavy SDK imported at module scope stays resident in every replica and every batch worker, even when the app never configures it.",
              ko: "서버에도 같은 원리가 적용되며, 여기서는 비용이 번들 크기가 아니라 메모리입니다. 모듈 최상위에서 import한 무거운 SDK는 앱이 설정하지 않아도 모든 replica와 batch worker에 상주합니다.",
            })}
          </div>
          <Docs.SubSubTitle>
            {l.trans({ en: "Why one import costs so much", ko: "import 하나가 비싼 이유" })}
          </Docs.SubSubTitle>
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>The barrel loads everything.</strong> The generated <code>srvkit/index.ts</code> re-exports
                    every adapter, so importing one helper evaluates every SDK the folder imports.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>barrel이 전부 불러옵니다.</strong> 생성된 <code>srvkit/index.ts</code>는 모든 adapter를
                    re-export하므로, helper 하나만 import해도 그 폴더가 import하는 SDK가 모두 로드됩니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Gating construction is not enough.</strong>{" "}
                    <code>options.discord ? new DiscordApi(...) : null</code> skips the object, but the import at the
                    top of the file has already run.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>생성만 막아서는 부족합니다.</strong>{" "}
                    <code>options.discord ? new DiscordApi(...) : null</code>은 객체만 건너뛸 뿐, 파일 맨 위의 import는
                    이미 실행된 뒤입니다.
                  </span>
                ),
              })}
            </li>
          </ul>
          <Docs.SubSubTitle>{l.trans({ en: "What to defer", ko: "무엇을 미룰까" })}</Docs.SubSubTitle>
          <div>
            {l.trans({
              en: "Measured in this workspace with each SDK imported eagerly, the first four below cost about 61 MiB before a single request arrives.",
              ko: "이 워크스페이스에서 SDK를 바로 import한 채로 측정하면, 아래 표의 처음 네 개만으로 요청이 하나도 오기 전에 약 61 MiB가 상주합니다.",
            })}
          </div>
          <Docs.Matrix
            type={l.trans({ en: "Package", ko: "패키지" })}
            columns={deferColumns}
            groups={deferGroups}
            markLabel={l.trans({ en: "Import it this way", ko: "이렇게 import합니다" })}
            emptyLabel={l.trans({ en: "Not this way", ko: "이렇게 하지 않습니다" })}
          />
          <Docs.SubSubTitle>{l.trans({ en: "How to defer it", ko: "미루는 방법" })}</Docs.SubSubTitle>
          <ol className={stepList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      Keep types as <code>import type</code>.
                    </strong>{" "}
                    It is erased at build, so signatures stay as they are.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      타입은 <code>import type</code>으로 남깁니다.
                    </strong>{" "}
                    빌드에서 지워지므로 시그니처는 그대로입니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Hold the value import in a module-level promise</strong> memoized with <code>??=</code>.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>값 import는 모듈 수준 promise에 담고</strong> <code>??=</code>로 한 번만 만듭니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Reach the SDK inside an async method</strong>, so the first call is what loads it.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>SDK는 async 메서드 안에서 꺼냅니다.</strong> 그러면 첫 호출 때 로드됩니다.
                  </span>
                ),
              })}
            </li>
          </ol>
          <div>
            {l.trans({
              en: (
                <span>
                  In an <code>adapt()</code> class it looks like this:
                </span>
              ),
              ko: (
                <span>
                  <code>adapt()</code> 클래스에서는 이렇게 씁니다.
                </span>
              ),
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="apps/koyo/srvkit/discordApi.ts"
          code={`import { adapt } from "akanjs/service";
import type * as discord from "discord.js";

let discordLoad: Promise<typeof import("discord.js")> | null = null;
const loadDiscord = () => {
  discordLoad ??= import("discord.js");
  return discordLoad;
};

export class DiscordApi extends adapt("discordApi" as const, ({ env }) => ({
  token: env(() => process.env.DISCORD_TOKEN ?? ""),
})) {
  #clientLoad: Promise<discord.Client> | null = null;

  async #connect() {
    const { Client, GatewayIntentBits } = await loadDiscord();
    const client = new Client({ intents: [GatewayIntentBits.Guilds] });
    await client.login(this.token);
    return client;
  }

  #getClient() {
    this.#clientLoad ??= this.#connect();
    return this.#clientLoad;
  }

  async send(channelId: string, content: string) {
    const client = await this.#getClient();
    const channel = await client.channels.fetch(channelId);
    if (!channel?.isSendable()) return null;
    return await channel.send(content);
  }
}`}
        />
        <Docs.Description>
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Nothing loads until the first call.</strong> A process that never sends a message never
                    loads <code>discord.js</code>.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>첫 호출 전에는 아무것도 불러오지 않습니다.</strong> 메시지를 한 번도 보내지 않는 프로세스는{" "}
                    <code>discord.js</code>를 끝내 불러오지 않습니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Concurrent callers share one load.</strong> <code>??=</code> keeps the first promise, so two{" "}
                    <code>send()</code> calls neither import twice nor log in twice.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>동시에 불러도 로딩은 한 번입니다.</strong> <code>??=</code>가 첫 promise를 붙잡아 두므로,{" "}
                    <code>send()</code>를 두 번 동시에 불러도 import도 로그인도 한 번만 합니다.
                  </span>
                ),
              })}
            </li>
          </ul>
          <Docs.SubSubTitle>{l.trans({ en: "Measure it", ko: "측정하기" })}</Docs.SubSubTitle>
          <div>
            {l.trans({
              en: "Check what a process actually pays before and after the change with these env vars.",
              ko: "바꾸기 전과 후에 프로세스가 실제로 치르는 비용은 아래 환경 변수로 확인합니다.",
            })}
          </div>
          <Docs.OptionTable items={memoryEnv} />
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide
        id="ssr"
        title={l.trans({ en: "Server Render Or Client Only", ko: "서버 렌더링 또는 클라이언트 전용" })}
      >
        <Docs.Title>
          {l.trans({ en: "Server Render Or Client Only", ko: "서버 렌더링 또는 클라이언트 전용" })}
        </Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "The three settings differ in whether the server renders the component and whether the placeholder shows. Pick by what the component needs.",
              ko: "세 가지 설정은 서버가 컴포넌트를 그리는지, 자리 표시가 보이는지가 다릅니다. 컴포넌트에 필요한 것을 보고 고릅니다.",
            })}
          </div>
          <Docs.Matrix
            type={l.trans({ en: "Setting", ko: "설정" })}
            columns={modeColumns}
            groups={modeGroups}
            markLabel={l.trans({ en: "Yes", ko: "예" })}
            emptyLabel={l.trans({ en: "No", ko: "아니요" })}
          />
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Default: the nearest boundary waits.</strong> It has no boundary of its own, so the one
                    above it waits for the chunk (the route, if nothing is closer) and <code>loading</code> never shows.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>기본값에서는 가장 가까운 경계가 기다립니다.</strong> 자기 경계가 없어서 바깥 경계가 청크를
                    기다리고(더 가까운 경계가 없으면 route), <code>loading</code>은 보이지 않습니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      <code>suspense: true</code>: only this spot waits.
                    </strong>{" "}
                    On the server, its content streams in after the shell.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      <code>suspense: true</code>는 이 자리만 기다립니다.
                    </strong>{" "}
                    서버에서는 내용이 shell 뒤에 스트리밍으로 도착합니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      <code>ssr: false</code>: the server sends only <code>loading</code>.
                    </strong>{" "}
                    It stays until mount and while the chunk downloads. This setting always has its own Suspense, so
                    adding <code>suspense: true</code> changes nothing.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      <code>ssr: false</code>면 서버는 <code>loading</code>만 보냅니다.
                    </strong>{" "}
                    자리 표시는 마운트 전까지, 그리고 청크를 받는 동안 계속 보입니다. 이 설정에는 항상 전용 Suspense가
                    있어서 <code>suspense: true</code>를 더해도 달라지는 것이 없습니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Give a placeholder when a blank gap would confuse.</strong> Size it like the real thing (
                    <code>h-64 w-full</code>) so the page does not jump when the component arrives.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>빈자리가 어색하면 자리 표시를 둡니다.</strong> 실제 컴포넌트와 같은 크기(
                    <code>h-64 w-full</code>)로 두면 컴포넌트가 도착할 때 화면이 튀지 않습니다.
                  </span>
                ),
              })}
            </li>
          </ul>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="tips" title={l.trans({ en: "Tips", ko: "팁" })}>
        <Docs.Title>{l.trans({ en: "Tips", ko: "팁" })}</Docs.Title>
        <Docs.Description>
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Split by user intent.</strong> An editor, a map, a chart, a modal and a viewer are good
                    units.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>사용자 의도 단위로 나눕니다.</strong> 에디터, 지도, 차트, 모달, 뷰어가 좋은 단위입니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Do not lazy-load the first thing users need to see.</strong> It only adds a wait before it
                    appears.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>사용자가 처음 봐야 하는 것은 lazy로 불러오지 않습니다.</strong> 보이기 전까지 기다림만
                    늘어납니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Shared, always-used components gain nothing.</strong> If many pages render the same
                    component right away, lazy may only add delay.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>여러 곳에서 늘 쓰는 컴포넌트는 얻는 것이 없습니다.</strong> 많은 페이지가 같은 컴포넌트를
                    바로 그린다면, lazy는 지연만 더할 수 있습니다.
                  </span>
                ),
              })}
            </li>
          </ul>
          <Docs.SubSubTitle>{l.trans({ en: "Read next", ko: "이어서 볼 문서" })}</Docs.SubSubTitle>
          <Docs.LinkGrid items={moreLinks} />
        </Docs.Description>
      </Scroll.Slide>
      <DocsToc />
    </Scroll>
  );
});
