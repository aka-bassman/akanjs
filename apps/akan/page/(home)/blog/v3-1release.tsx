import { usePage } from "@apps/akan/client";
import { Code, Docs, DocsToc, JellyKicker, panelRecipe } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";
import { badgeRecipe, Link } from "akanjs/ui";
import { BsArrowRight } from "react-icons/bs";

const glance = [
  {
    href: "#v31-security",
    value: "8",
    label: { en: "security fixes, no code changes", ko: "코드 수정 없이 적용되는 보안 강화" },
  },
  {
    href: "#v31-features",
    value: "7",
    label: { en: "headline features for running real apps", ko: "실제 운영을 위한 핵심 신규 기능" },
  },
  {
    href: "#v31-performance",
    value: "2.5×",
    label: { en: "faster list responses", ko: "더 빨라진 목록 응답" },
  },
] as const;

const securityItems = [
  {
    title: { en: "Visitors' sessions never mix", ko: "방문자끼리 세션이 섞이지 않습니다" },
    desc: {
      en: "Under heavy traffic, part of a page streamed to one visitor could read another visitor's login cookie. Each render now sees only its own request.",
      ko: "트래픽이 몰릴 때 한 방문자에게 스트리밍되던 화면 일부가 다른 방문자의 로그인 쿠키를 읽을 수 있었습니다. 이제 각 렌더는 자기 요청만 봅니다.",
    },
  },
  {
    title: { en: "Your users' login stays home", ko: "사용자의 로그인 정보가 밖으로 새지 않습니다" },
    desc: {
      en: "When your server calls another company's API, it no longer forwards the visitor's login token or address. Only calls to your own server carry them.",
      ko: "서버가 외부 API를 호출할 때 더는 방문자의 로그인 토큰이나 주소를 함께 보내지 않습니다. 내 서버로 가는 호출만 이를 싣습니다.",
    },
  },
  {
    title: { en: "No more redirect tricks", ko: "리다이렉트 낚시를 막습니다" },
    desc: {
      en: "A crafted link such as ?redirect=evil.com can no longer use your app's navigation to send a visitor to another site.",
      ko: "?redirect=evil.com 같은 조작된 링크가 앱의 화면 이동을 이용해 방문자를 다른 사이트로 보낼 수 없습니다.",
    },
  },
  {
    title: { en: "Requests can't grant themselves extra rights", ko: "요청이 스스로 권한을 올릴 수 없습니다" },
    desc: {
      en: "Fields a form was never meant to send, such as a role or a deleted flag, are dropped before they reach your code.",
      ko: "역할이나 삭제 표시처럼 폼이 보내면 안 되는 필드는 코드에 닿기 전에 버려집니다.",
    },
  },
  {
    title: { en: "Switching accounts leaves nothing behind", ko: "계정을 바꾸면 이전 화면이 남지 않습니다" },
    desc: {
      en: "Pages kept for the previous account are dropped the moment someone signs in as someone else.",
      ko: "다른 계정으로 로그인하는 순간 이전 계정을 위해 보관해 둔 화면을 모두 버립니다.",
    },
  },
  {
    title: { en: "Fewer secrets in your logs", ko: "로그에 남는 시크릿이 줄었습니다" },
    desc: {
      en: "Logs mask more kinds of secrets, such as webhook URLs, database connection strings and signing keys.",
      ko: "웹훅 주소, 데이터베이스 연결 문자열, 서명 키 등 더 많은 종류의 시크릿을 로그에서 가립니다.",
    },
  },
  {
    title: { en: "Updates nobody can tamper with", ko: "누구도 손댈 수 없는 업데이트" },
    desc: {
      en: "A CDN in between can no longer alter a signed app update, and a signed desktop app refuses an update signed by anyone else.",
      ko: "중간의 CDN이 서명된 앱 업데이트를 바꿀 수 없고, 서명된 데스크톱 앱은 다른 사람이 서명한 업데이트를 거절합니다.",
    },
  },
  {
    title: { en: "The agent acts only on what's on screen", ko: "에이전트는 화면에 보이는 대로만 움직입니다" },
    desc: {
      en: "If the screen changes while the in-page agent is acting, its call is refused instead of running against the wrong thing.",
      ko: "인페이지 에이전트가 동작하는 사이 화면이 바뀌면, 엉뚱한 대상에 실행되지 않도록 그 호출을 거절합니다.",
    },
  },
] as const;

const performanceStats = [
  {
    value: "2.5×",
    label: { en: "faster list responses", ko: "더 빨라진 목록 응답" },
    detail: "16 µs → 6.5 µs",
  },
  {
    value: "1.5×",
    label: { en: "faster simple API calls", ko: "더 빨라진 단순 API 호출" },
    detail: "3.0 µs → 2.0 µs",
  },
  {
    value: "+15%",
    label: { en: "more pages served per second", ko: "초당 처리하는 페이지 증가" },
    detail: "26.7k → 30.8k req/s",
  },
  {
    value: "−14%",
    label: { en: "shorter slowest responses", ko: "가장 느린 응답 시간 단축" },
    detail: "p99 3.7 ms → 3.2 ms",
  },
] as const;

const userImprovements = [
  {
    title: { en: "No half-uploaded submits", ko: "업로드가 끝나야 제출됩니다" },
    desc: {
      en: "The submit button waits while a file is still uploading, so a form never saves without its image.",
      ko: "파일이 올라가는 동안 제출 버튼이 기다리므로, 이미지 없이 폼이 저장되는 일이 없습니다.",
    },
    href: "/references/ui/forms",
  },
  {
    title: { en: "Back lands where you left", ko: "뒤로 가면 보던 자리로" },
    desc: {
      en: "Back and forward return to the exact scroll position, in Safari too, even while images are still loading.",
      ko: "뒤로·앞으로 이동하면 Safari에서도, 이미지가 아직 로딩 중이어도 보던 스크롤 위치로 정확히 돌아갑니다.",
    },
    href: "/docs/core/routing",
  },
  {
    title: { en: "Nothing typed is lost while loading", ko: "로딩 중에 입력한 글자도 그대로" },
    desc: {
      en: "Text typed into the header before the page finishes loading keeps its text, focus and cursor.",
      ko: "페이지가 다 뜨기 전에 상단 영역에 입력한 글자와 포커스, 커서가 그대로 유지됩니다.",
    },
    href: "/docs/core/routing",
  },
  {
    title: { en: "Buttons that don't submit by accident", ko: "실수로 제출되지 않는 버튼" },
    desc: {
      en: "A password toggle, a copy button or an add button inside a form no longer submits it.",
      ko: "폼 안의 비밀번호 보기, 복사, 추가 버튼을 눌러도 더는 폼이 제출되지 않습니다.",
    },
    href: "/references/ui/forms",
  },
  {
    title: { en: "Feels native on iPhone", ko: "아이폰에서 더 앱처럼" },
    desc: {
      en: "Installed web apps stop bouncing, small inputs no longer make iOS zoom in, and the status bar follows the theme.",
      ko: "홈 화면에 설치한 웹 앱이 출렁이지 않고, 작은 입력 칸을 눌러도 iOS가 확대하지 않으며, 상태 표시줄이 테마를 따라 바뀝니다.",
    },
    href: "/cheatsheet/mobile/setup",
  },
  {
    title: { en: "Overlays stack in the right order", ko: "겹치는 창이 올바른 순서로" },
    desc: {
      en: "A dropdown opens above its modal, toasts sit above modals, and tooltips flip to the side with room.",
      ko: "모달 안의 드롭다운은 모달 위에, 토스트는 모달보다 위에 뜨고, 툴팁은 공간이 있는 쪽으로 뒤집힙니다.",
    },
    href: "/references/ui/overlays",
  },
  {
    title: { en: "Filters without a reload", ko: "새로고침 없는 필터" },
    desc: {
      en: "A search or filter change in the URL can update the screen without asking the server for the whole page again.",
      ko: "URL의 검색어나 필터만 바뀌면 서버에 페이지 전체를 다시 요청하지 않고 화면만 바꿀 수 있습니다.",
    },
    href: "/docs/core/routing",
  },
  {
    title: { en: "An agent that sees pictures", ko: "그림을 보는 에이전트" },
    desc: {
      en: "The in-page agent can look at images on the screen, and your own tools can hand it files.",
      ko: "인페이지 에이전트가 화면의 이미지를 직접 보고, 직접 만든 도구가 에이전트에게 파일을 건넬 수 있습니다.",
    },
    href: "/references/ui/agent",
  },
] as const;

const teamImprovements = [
  {
    title: { en: "Balances that can't go negative", ko: "음수가 되지 않는 잔액" },
    desc: {
      en: "On Postgres, two withdrawals arriving at the same moment can no longer both pass the same balance check.",
      ko: "Postgres에서 동시에 들어온 두 출금이 같은 잔액 검사를 함께 통과하는 일이 없어졌습니다.",
    },
    href: "/docs/core/data-layer",
  },
  {
    title: { en: "Adding an index stays quick", ko: "인덱스를 추가해도 빠른 배포" },
    desc: {
      en: "Adding or reordering an index no longer rebuilds all the others on the next deploy.",
      ko: "인덱스를 추가하거나 순서를 바꿔도 다음 배포 때 나머지 인덱스를 다시 만들지 않습니다.",
    },
    href: "/cheatsheet/general/schema",
  },
  {
    title: { en: "Clean up by retention", ko: "보존 기간에 맞춘 정리" },
    desc: {
      en: "Delete old logs and expired data for good, in safe batches, with an empty filter refused.",
      ko: "오래된 로그와 만료된 데이터를 안전한 묶음 단위로 영구 삭제하고, 조건이 빈 삭제는 거절합니다.",
    },
    href: "/docs/core/data-layer",
  },
  {
    title: { en: "Fresh cache on demand", ko: "필요할 때 바로 캐시 비우기" },
    desc: {
      en: "Clear an endpoint's cached answers on every server the moment the data behind them changes.",
      ko: "데이터가 바뀌는 순간 모든 서버에서 엔드포인트의 캐시된 응답을 비웁니다.",
    },
    href: "/cheatsheet/performance/caching",
  },
  {
    title: { en: "Lint that catches crashes early", ko: "크래시를 미리 잡는 린트" },
    desc: {
      en: "A new rule flags hooks a render can skip, a classic cause of production-only crashes, and typecheck now covers your tests.",
      ko: "프로덕션에서만 터지는 대표적 원인인, 렌더 중 건너뛸 수 있는 훅을 새 규칙이 잡고, 타입 검사는 테스트까지 봅니다.",
    },
    href: "/conventions/workspace/lint",
  },
  {
    title: { en: "A lighter guide for coding agents", ko: "AI 코딩 에이전트를 위한 가벼운 가이드" },
    desc: {
      en: "The AGENTS.md the CLI writes is about 60% smaller, so a coding agent spends less of its context on rules.",
      ko: "CLI가 쓰는 AGENTS.md가 약 60% 작아져, 코딩 에이전트가 규칙을 읽는 데 쓰는 컨텍스트가 줄었습니다.",
    },
    href: "/conventions/workspace/lint",
  },
] as const;

const featureNav = [
  { id: "guard", title: { en: "Access control", ko: "접근 제어" } },
  { id: "chat", title: { en: "Apps in AI chat", ko: "AI 채팅 속 앱" } },
  { id: "migration", title: { en: "Safe migrations", ko: "안전한 마이그레이션" } },
  { id: "errors", title: { en: "Clear errors", ko: "명확한 에러" } },
  { id: "network", title: { en: "Shaky networks", ko: "불안한 네트워크" } },
  { id: "devices", title: { en: "Unattended devices", ko: "무인 기기" } },
  { id: "pipeline", title: { en: "Pipeline", ko: "파이프라인" } },
] as const;

const upgradeSteps = `bun upgrade
akan update
akan sync <app-or-lib>
akan lint <app-or-lib>
akan typecheck <app-or-lib>`;

export default page()
  .config({ transition: "stack" })
  .head(({ lang }) => {
    const title =
      lang === "ko"
        ? "Akan.js 3.1: 프로덕션을 위해 더 단단하게 | Akan.js 블로그"
        : "Akan.js 3.1: hardened for production | Akan.js Blog";
    const description =
      lang === "ko"
        ? "업그레이드만으로 더 안전하고 최대 2.5배 빨라집니다. 화면이 뜨기 전에 막는 접근 제어, AI 채팅 안에 뜨는 내 앱 화면, 되돌릴 수 있는 데이터 마이그레이션, 스스로 업데이트하는 무인 기기까지."
        : "Safer and up to 2.5× faster just by upgrading, plus access control before a page appears, your app's screens inside the AI chat, migrations you can undo, and devices that update themselves.";
    return (
      <>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
      </>
    );
  })
  .render(() => {
    const { l } = usePage();

    return (
      <main className="min-h-screen text-foreground">
        <article className="mx-auto max-w-3xl px-6 py-10 lg:px-8">
          <header>
            <div className="mb-10 flex items-end justify-between gap-4">
              <JellyKicker>Akan.js 3.1</JellyKicker>
            </div>
            <p className="mb-4 text-foreground/50 text-sm">
              {l.trans({ en: "Release note · Oct 25, 2026", ko: "릴리즈 노트 · 2026년 10월 25일" })}
            </p>
            <h1 className="font-black text-4xl leading-[1.08] md:text-[3.25rem]">
              {l.trans({
                en: "Akan.js 3.1: hardened for production",
                ko: "Akan.js 3.1: 프로덕션을 위해 더 단단하게",
              })}
            </h1>
            <p className="mt-6 text-foreground/70 text-lg leading-8">
              {l.trans({
                en: "v3 let AI agents use your app alongside people. 3.1 is about running that app for real, with confidence. Upgrading alone makes it safer and faster, and the new features cover what production asks for: keeping the wrong people out, changing data safely, riding out bad networks, and updating devices nobody watches.",
                ko: "v3가 사람과 AI 에이전트가 함께 쓰는 앱을 열었다면, 3.1은 그 앱을 실제로, 안심하고 운영하는 데 집중합니다. 업그레이드만 해도 더 안전하고 빨라지며, 새 기능은 운영에서 꼭 필요한 일을 채웁니다. 들어오면 안 되는 사람을 막고, 데이터를 안전하게 바꾸고, 불안한 네트워크를 견디고, 아무도 지켜보지 않는 기기를 업데이트합니다.",
              })}
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {glance.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={panelRecipe(
                    { tone: "jelly", radius: "3xl", padding: "none" },
                    "group squish hover:tint-primary p-5 transition-shadow",
                  )}
                >
                  <p className="font-black text-4xl text-primary">{item.value}</p>
                  <p className="mt-2 text-foreground/70 text-sm leading-6 group-hover:text-foreground">
                    {l.trans(item.label)}
                  </p>
                </a>
              ))}
            </div>
            <nav className="mt-6 flex flex-wrap gap-2">
              {featureNav.map((item) => (
                <a
                  key={item.id}
                  href={`#v31-${item.id}`}
                  className={badgeRecipe(
                    undefined,
                    "border-foreground/10 bg-foreground/5 text-foreground/70 hover:text-primary",
                  )}
                >
                  {l.trans(item.title)}
                </a>
              ))}
              <a
                href="#v31-upgrade"
                className={badgeRecipe(undefined, "border-primary/20 bg-primary/10 text-primary hover:bg-primary/15")}
              >
                {l.trans({ en: "Upgrading from 3.0", ko: "3.0에서 올라올 때" })}
              </a>
            </nav>
          </header>

          <Scroll className="mt-14">
            <Scroll.Slide id="v31-security" title={l.trans({ en: "Security", ko: "보안" })}>
              <p className="font-bold text-primary text-sm uppercase tracking-[0.2em]">
                {l.trans({ en: "Security", ko: "보안" })}
              </p>
              <h2 className="mt-3 font-black text-3xl">
                {l.trans({ en: "Safer the moment you upgrade", ko: "올리기만 해도 더 안전해집니다" })}
              </h2>
              <p className="mt-4 text-foreground/75 leading-7">
                {l.trans({
                  en: "Most of these close a gap between visitors, or between your server and others. None of them asks you to change a line of code, which makes them the best reason to upgrade even if you never touch a new feature.",
                  ko: "대부분은 방문자 사이, 또는 내 서버와 다른 서버 사이의 틈을 막습니다. 어느 것도 코드 한 줄 바꾸라고 하지 않으므로, 새 기능을 하나도 쓰지 않더라도 업그레이드해야 할 가장 큰 이유입니다.",
                })}
              </p>
              <Docs.Figure
                title={l.trans({ en: "Each visitor in their own lane", ko: "방문자마다 따로 가는 길" })}
                image="v31-visitor-lanes"
                prompt={`
                Two people stacked on the left, the upper one labelled "Visitor A" and the lower one labelled
                "Visitor B". From each person a long straight arrow runs to the right, through one wide server in
                the middle labelled "Server", and on to a browser on the far right: the upper arrow ends at an upper
                browser and the lower arrow at a lower browser, so there are two parallel lanes that never cross.
                Inside the server, a thick horizontal wall runs between the two lanes from its left edge to its
                right edge; the wall is the red accent and is labelled "Kept apart".
              `}
                alt={l.trans({
                  en: "Two visitors pass through the same server in separate lanes divided by a wall, so neither ever sees the other's session.",
                  ko: "두 방문자가 같은 서버를 지나지만 벽으로 나뉜 각자의 길로 가므로, 서로의 세션을 볼 수 없습니다.",
                })}
              />
              <ul className="mt-6 grid gap-3 md:grid-cols-2">
                {securityItems.map((item) => (
                  <li key={item.title.en} className="jelly-glass rounded-3xl p-5">
                    <p className="font-bold">{l.trans(item.title)}</p>
                    <p className="mt-2 text-foreground/65 text-sm leading-6">{l.trans(item.desc)}</p>
                  </li>
                ))}
              </ul>
              <Link
                href="/blog/release-notes-3-1-0#notes-security"
                className="mt-4 inline-flex items-center gap-2 font-semibold text-primary text-sm hover:underline"
              >
                {l.trans({ en: "Every security fix in 3.1.0", ko: "3.1.0의 보안 강화 전체 보기" })} <BsArrowRight />
              </Link>
            </Scroll.Slide>

            <Scroll.Slide id="v31-features" title={l.trans({ en: "New features", ko: "새 기능" })} className="mt-20">
              <p className="font-bold text-primary text-sm uppercase tracking-[0.2em]">
                {l.trans({ en: "New features", ko: "새 기능" })}
              </p>
              <h2 className="mt-3 font-black text-3xl">
                {l.trans({ en: "Seven things production asked for", ko: "운영이 요구한 일곱 가지" })}
              </h2>
            </Scroll.Slide>

            <Scroll.Slide id="v31-guard" title={l.trans({ en: "Access control", ko: "접근 제어" })} className="mt-12">
              <p className="font-black font-mono text-primary text-sm">01</p>
              <h3 className="mt-2 font-black text-3xl">
                {l.trans({ en: "Stop strangers before the page appears", ko: "화면이 뜨기 전에 막는 접근 제어" })}
              </h3>
              <p className="mt-3 font-semibold text-foreground/85 text-lg leading-7">
                {l.trans({
                  en: "No more flash of a private page before the redirect to sign-in.",
                  ko: "로그인 화면으로 튕기기 전에 비공개 화면이 잠깐 보이는 일이 사라집니다.",
                })}
              </p>
              <p className="mt-4 text-foreground/75 leading-7">
                {l.trans({
                  en: "Add one guard to a section's layout and every page under it checks who is asking before anything is drawn. A visitor who may not enter goes straight to the sign-in page, and a record they may not see answers as if it did not exist. AI agents connected to your app see only the screens they are allowed to open.",
                  ko: "섹션 레이아웃에 가드 한 줄을 두면 그 아래 모든 페이지가 무엇이든 그리기 전에 누가 들어오는지 확인합니다. 들어올 수 없는 방문자는 곧바로 로그인 화면으로 가고, 볼 권한이 없는 레코드는 처음부터 없는 것처럼 응답합니다. 앱에 연결된 AI 에이전트에게도 열 수 있는 화면만 보입니다.",
                })}
              </p>
              <Docs.Figure
                title={l.trans({ en: "The guard checks first", ko: "가드가 먼저 확인합니다" })}
                image="v31-route-guard"
                prompt={`
                On the left, two people stacked one above the other. The upper person wears a small round badge on
                the chest and is labelled "Signed in"; the lower person has no badge and is labelled "Guest". Both
                walk toward a gate in the middle, drawn as two posts with a barrier arm between them; the gate is
                the red accent and is labelled "Guard". The upper person's arrow passes through the gate and ends at
                a large browser at the upper right labelled "Your page". The lower person's arrow stops at the
                barrier and bends down to a small browser at the lower right labelled "Sign in".
              `}
                alt={l.trans({
                  en: "A signed-in person passes the guard and reaches the page, while a guest is stopped at the guard and sent to the sign-in page before anything renders.",
                  ko: "로그인한 사람은 가드를 지나 페이지에 닿고, 손님은 아무것도 그려지기 전에 가드에서 멈춰 로그인 화면으로 갑니다.",
                })}
              />
              <Code.Snippet
                className="mt-2 w-full"
                title="page/(app)/_layout.tsx"
                code={`export default layout()
  .guard(() => signedIn())
  .render(({ children }) => <>{children}</>);`}
                showLineNumbers={false}
              />
              <Link
                href="/docs/core/routing"
                className="mt-4 inline-flex items-center gap-1 font-semibold text-primary text-sm hover:underline"
              >
                {l.trans({ en: "Routing", ko: "라우팅" })} <BsArrowRight />
              </Link>
            </Scroll.Slide>

            <Scroll.Slide
              id="v31-chat"
              title={l.trans({ en: "Apps in AI chat", ko: "AI 채팅 속 앱" })}
              className="mt-16"
            >
              <p className="font-black font-mono text-primary text-sm">02</p>
              <h3 className="mt-2 font-black text-3xl">
                {l.trans({ en: "Your app's screens, inside the AI chat", ko: "AI 채팅 안에 그대로 뜨는 내 앱 화면" })}
              </h3>
              <p className="mt-3 font-semibold text-foreground/85 text-lg leading-7">
                {l.trans({
                  en: "Ask Claude about a ticket and get the real ticket card, not a wall of text.",
                  ko: "Claude에게 티켓을 물으면 긴 텍스트 대신 실제 티켓 카드가 대화 안에 뜹니다.",
                })}
              </p>
              <p className="mt-4 text-foreground/75 leading-7">
                {l.trans({
                  en: "Mark one component of a page as an app, and AI hosts such as claude.ai draw it right inside the conversation. It is the very component your website shows, so there is nothing to build twice. It runs with the user's own permissions and can only read, so it never changes data behind anyone's back.",
                  ko: "페이지의 컴포넌트 하나를 앱으로 지정하면 claude.ai 같은 AI 호스트가 대화 안에 그 화면을 그대로 그립니다. 웹사이트에 보이는 바로 그 컴포넌트라 두 번 만들 것이 없습니다. 사용자 본인의 권한으로 동작하고 조회만 할 수 있으므로, 누구 몰래 데이터를 바꾸는 일도 없습니다.",
                })}
              </p>
              <p className="mt-4 text-foreground/75 leading-7">
                {l.trans({
                  en: "Your endpoints can hand an AI a picture as well, such as a chart or a product photo, instead of describing it in words.",
                  ko: "엔드포인트가 차트나 상품 사진 같은 이미지를 말로 설명하는 대신 AI에게 그대로 건넬 수도 있습니다.",
                })}
              </p>
              <Docs.Figure
                title={l.trans({ en: "A real screen in the conversation", ko: "대화 속의 진짜 화면" })}
                image="v31-chat-app"
                prompt={`
                One large chat window drawn as a rounded rectangle with a title bar labelled "AI chat", and draw
                nothing at all outside it. Inside, from top to bottom: a speech bubble on the right side holding
                three short squiggly lines; a speech bubble on the left side holding two short squiggly lines; then,
                on the left, a small app card sitting in the conversation, drawn as a rounded rectangle containing a
                bold title line, a small pill-shaped status tag and a small circle avatar; the card outline is the
                red accent and is labelled "Your app's screen". Under the card, one more speech bubble on the right
                side holding one squiggly line.
              `}
                alt={l.trans({
                  en: "An AI chat window where, between the messages, the app's own screen appears as an interactive card.",
                  ko: "AI 채팅 창의 메시지 사이에 앱 자신의 화면이 카드로 그대로 나타납니다.",
                })}
              />
              <Link
                href="/cheatsheet/interface/mcp"
                className="mt-2 inline-flex items-center gap-1 font-semibold text-primary text-sm hover:underline"
              >
                MCP Apps <BsArrowRight />
              </Link>
            </Scroll.Slide>

            <Scroll.Slide
              id="v31-migration"
              title={l.trans({ en: "Safe migrations", ko: "안전한 마이그레이션" })}
              className="mt-16"
            >
              <p className="font-black font-mono text-primary text-sm">03</p>
              <h3 className="mt-2 font-black text-3xl">
                {l.trans({ en: "Change your data's shape, safely", ko: "데이터 구조 변경도 안전하게" })}
              </h3>
              <p className="mt-3 font-semibold text-foreground/85 text-lg leading-7">
                {l.trans({
                  en: "Preview it, apply it, check it, and undo it if you need to.",
                  ko: "미리 보고, 적용하고, 확인하고, 필요하면 되돌립니다.",
                })}
              </p>
              <p className="mt-4 text-foreground/75 leading-7">
                {l.trans({
                  en: "When a release changes how data is stored, ship a migration script with it. It first shows what it would change without touching anything, refuses to run if the data moved after you reviewed it, and checks the result when it is done. Every value it changes is recorded, so a bad run can be rolled back.",
                  ko: "새 릴리즈가 데이터 저장 방식을 바꾼다면 마이그레이션 스크립트를 함께 내보내세요. 먼저 아무것도 건드리지 않고 무엇을 바꿀지 보여 주고, 검토한 뒤 데이터가 달라졌으면 실행을 거절하며, 끝나면 결과를 검사합니다. 바꾼 값은 모두 기록되므로 잘못된 실행은 되돌릴 수 있습니다.",
                })}
              </p>
              <p className="mt-4 text-foreground/75 leading-7">
                {l.trans({
                  en: "Two servers never run the same migration at once, and the same script runs on your laptop and in your deployed containers.",
                  ko: "두 서버가 같은 마이그레이션을 동시에 돌리는 일은 없고, 노트북에서도 배포된 컨테이너에서도 같은 스크립트가 똑같이 돕니다.",
                })}
              </p>
              <Docs.Figure
                title={l.trans({ en: "Preview, apply, verify, undo", ko: "미리 보기, 적용, 확인, 되돌리기" })}
                image="v31-migration-steps"
                prompt={`
                Three steps in one row from left to right, joined by two arrows. First, a small table grid with a
                magnifying glass over it, labelled "Preview". Second, the same small table grid with a pencil over
                it, labelled "Apply". Third, the same table grid with a large check mark over it, labelled "Verify";
                the check mark is the red accent. Under the row, one long curved arrow loops back from the second
                step to the first step, labelled "Undo".
              `}
                alt={l.trans({
                  en: "A migration first previews its changes, then applies them, then verifies the result, and an applied change can be undone.",
                  ko: "마이그레이션은 먼저 변경을 미리 보여 주고, 적용한 뒤, 결과를 확인하며, 적용한 변경은 되돌릴 수 있습니다.",
                })}
              />
              <Link
                href="/cheatsheet/dev/migration"
                className="mt-2 inline-flex items-center gap-1 font-semibold text-primary text-sm hover:underline"
              >
                {l.trans({ en: "Data migrations", ko: "데이터 마이그레이션" })} <BsArrowRight />
              </Link>
            </Scroll.Slide>

            <Scroll.Slide id="v31-errors" title={l.trans({ en: "Clear errors", ko: "명확한 에러" })} className="mt-16">
              <p className="font-black font-mono text-primary text-sm">04</p>
              <h3 className="mt-2 font-black text-3xl">
                {l.trans({
                  en: "Bad requests stopped at the door, with a clear reason",
                  ko: "잘못된 요청은 입구에서, 이유와 함께",
                })}
              </h3>
              <p className="mt-3 font-semibold text-foreground/85 text-lg leading-7">
                {l.trans({
                  en: "Fewer mysterious server errors, more answers that say exactly what went wrong.",
                  ko: "원인 모를 서버 에러 대신, 무엇이 잘못됐는지 정확히 알려 주는 응답.",
                })}
              </p>
              <p className="mt-4 text-foreground/75 leading-7">
                {l.trans({
                  en: "Every request is checked against your models before your code runs. A wrong type or a missing field gets an error that names the exact field, and anything the request was not supposed to send is quietly dropped. Invalid input and missing records now answer 400 and 404 instead of a server error.",
                  ko: "모든 요청을 코드가 실행되기 전에 모델 정의와 대조합니다. 타입이 틀리거나 필드가 빠지면 어떤 필드가 문제인지 정확히 짚어 알려 주고, 보내면 안 되는 값은 조용히 버립니다. 잘못된 입력과 없는 데이터는 이제 서버 에러가 아니라 400과 404로 응답합니다.",
                })}
              </p>
              <p className="mt-4 text-foreground/75 leading-7">
                {l.trans({
                  en: "The errors an endpoint can return are now part of its contract. They appear in your API docs and in the tool descriptions AI agents read, so people and agents alike know what to expect before they call.",
                  ko: "엔드포인트가 낼 수 있는 에러도 이제 계약의 일부입니다. API 문서와 AI 에이전트가 읽는 도구 설명에 함께 실리므로, 사람도 에이전트도 호출하기 전에 무엇을 예상해야 할지 압니다.",
                })}
              </p>
              <Link
                href="/cheatsheet/observability/error"
                className="mt-4 inline-flex items-center gap-1 font-semibold text-primary text-sm hover:underline"
              >
                {l.trans({ en: "Errors", ko: "에러" })} <BsArrowRight />
              </Link>
            </Scroll.Slide>

            <Scroll.Slide
              id="v31-network"
              title={l.trans({ en: "Shaky networks", ko: "불안한 네트워크" })}
              className="mt-16"
            >
              <p className="font-black font-mono text-primary text-sm">05</p>
              <h3 className="mt-2 font-black text-3xl">
                {l.trans({ en: "Calls that hold up on a shaky network", ko: "불안한 네트워크에서도 끄떡없는 호출" })}
              </h3>
              <p className="mt-3 font-semibold text-foreground/85 text-lg leading-7">
                {l.trans({
                  en: "Retry as often as the network needs, and still charge the customer once.",
                  ko: "네트워크 때문에 몇 번을 다시 보내도, 결제는 한 번만.",
                })}
              </p>
              <p className="mt-4 text-foreground/75 leading-7">
                {l.trans({
                  en: "A call to another server now retries by itself when that server is briefly down or busy, waiting a little longer each time and giving up within the deadline you set. Send a payment or an order with a duplicate-protection key, and it runs exactly once however many times it arrives.",
                  ko: "다른 서버로 가는 호출이 상대가 잠깐 내려가 있거나 바쁠 때 스스로 재시도하고, 매번 조금씩 더 기다리며, 정한 제한 시간 안에서 멈춥니다. 결제나 주문에 중복 방지 키를 붙여 보내면 몇 번이 도착하든 정확히 한 번만 실행됩니다.",
                })}
              </p>
              <p className="mt-4 text-foreground/75 leading-7">
                {l.trans({
                  en: "Live screens recover as well. After a dropped connection the app reconnects as soon as the device is back online, and fills in whatever changed in the meantime.",
                  ko: "실시간 화면도 회복합니다. 연결이 끊기면 기기가 다시 온라인이 되는 즉시 재연결하고, 그사이 바뀐 내용을 채워 넣습니다.",
                })}
              </p>
              <Docs.Figure
                title={l.trans({ en: "Retried, but charged once", ko: "재시도해도 결제는 한 번" })}
                image="v31-retry-once"
                prompt={`
                On the left, a phone labelled "App". A long arrow runs to the right toward a server labelled
                "Payment server", but in the middle the line breaks into a jagged lightning zigzag. Above the
                zigzag, three short curved arrows in a row show the call being sent again, labelled "Retry". To the
                right of the server, a single receipt, drawn as a small paper slip with a torn bottom edge and a few
                short lines, labelled "Charged once"; the receipt is the red accent.
              `}
                alt={l.trans({
                  en: "An app's payment call crosses a broken network and is retried several times, yet the payment server charges only once.",
                  ko: "앱의 결제 호출이 끊긴 네트워크를 지나며 여러 번 재시도되지만, 결제 서버는 한 번만 결제합니다.",
                })}
              />
              <Code.Snippet
                className="mt-2 w-full"
                title="order.service.ts"
                code={`await remote.placeOrder(order, { idempotencyKey: order.receiptNo });`}
                showLineNumbers={false}
              />
              <Link
                href="/cheatsheet/interface/endpoint"
                className="mt-4 inline-flex items-center gap-1 font-semibold text-primary text-sm hover:underline"
              >
                {l.trans({ en: "Calling another server", ko: "다른 서버 호출" })} <BsArrowRight />
              </Link>
            </Scroll.Slide>

            <Scroll.Slide
              id="v31-devices"
              title={l.trans({ en: "Unattended devices", ko: "무인 기기" })}
              className="mt-16"
            >
              <p className="font-black font-mono text-primary text-sm">06</p>
              <h3 className="mt-2 font-black text-3xl">
                {l.trans({
                  en: "Devices that update themselves safely, with nobody watching",
                  ko: "아무도 지켜보지 않는 기기도 안전하게 스스로 업데이트",
                })}
              </h3>
              <p className="mt-3 font-semibold text-foreground/85 text-lg leading-7">
                {l.trans({
                  en: "Built for kiosks, signage and devices in the field.",
                  ko: "키오스크, 사이니지, 현장 단말을 위해.",
                })}
              </p>
              <p className="mt-4 text-foreground/75 leading-7">
                {l.trans({
                  en: "Over-the-air updates for phone apps are now signed so that no CDN or middleman can tamper with them. You can rotate the signing key without shipping a new app, revoke a leaked key for good, and see how each release landed across devices without collecting anything about your users. A release that freezes on a phone rolls itself back.",
                  ko: "폰 앱의 무선(OTA) 업데이트는 이제 CDN이나 중간자가 손댈 수 없도록 서명됩니다. 새 앱을 내지 않고도 서명 키를 교체하고, 유출된 키는 영구히 폐기하며, 사용자 정보는 하나도 모으지 않고 릴리즈가 기기마다 어떻게 적용됐는지 볼 수 있습니다. 폰에서 멈춘 릴리즈는 스스로 롤백합니다.",
                })}
              </p>
              <p className="mt-4 text-foreground/75 leading-7">
                {l.trans({
                  en: "Desktop apps gain a kiosk mode in which pages cannot open print or file dialogs, downloads or other programs. The server a desktop app carries restarts itself when it crashes or hangs, and it can be built without your secrets, so nothing sensitive sits on the installed machine.",
                  ko: "데스크톱 앱에는 페이지가 인쇄·파일 대화상자나 다운로드, 다른 프로그램을 열 수 없는 키오스크 모드가 생겼습니다. 데스크톱 앱이 함께 싣는 서버는 죽거나 멈추면 스스로 다시 뜨고, 시크릿을 빼고 빌드할 수 있어 설치된 컴퓨터에 민감한 정보가 남지 않습니다.",
                })}
              </p>
              <Docs.Figure
                title={l.trans({ en: "Sealed on the way, locked on arrival", ko: "오는 길엔 봉인, 도착해선 잠금" })}
                image="v31-signed-update"
                prompt={`
                On the left, a cloud labelled "Release". An arrow runs right to a sealed envelope in the middle whose
                round wax seal is the red accent; the envelope is labelled "Signed update". A second arrow runs from
                the envelope to a tall kiosk on the right, drawn as a screen on a slim stand with a flat base,
                labelled "Kiosk". A small padlock sits on the kiosk's screen. Just under the kiosk's base, a small
                circular arrow labelled "Self-restart".
              `}
                alt={l.trans({
                  en: "A release travels to a kiosk as a sealed, signed update; the kiosk is locked down and restarts itself if anything stops.",
                  ko: "릴리즈가 봉인된 서명 업데이트로 키오스크에 전달되고, 키오스크는 잠겨 있으며 무언가 멈추면 스스로 다시 시작합니다.",
                })}
              />
              <div className="mt-2 flex flex-wrap gap-4 text-sm">
                <Link
                  href="/cheatsheet/mobile/setup"
                  className="flex items-center gap-1 font-semibold text-primary hover:underline"
                >
                  {l.trans({ en: "Native apps", ko: "네이티브 앱" })} <BsArrowRight />
                </Link>
                <Link
                  href="/cheatsheet/mobile/desktop-release"
                  className="flex items-center gap-1 font-semibold text-primary hover:underline"
                >
                  {l.trans({ en: "Desktop releases", ko: "데스크톱 릴리즈" })} <BsArrowRight />
                </Link>
              </div>
            </Scroll.Slide>

            <Scroll.Slide id="v31-pipeline" title={l.trans({ en: "Pipeline", ko: "파이프라인" })} className="mt-16">
              <p className="font-black font-mono text-primary text-sm">07</p>
              <h3 className="mt-2 font-black text-3xl">
                {l.trans({ en: "Your deploy pipeline, right next to your code", ko: "코드 옆에 두는 배포 파이프라인" })}
              </h3>
              <p className="mt-3 font-semibold text-foreground/85 text-lg leading-7">
                {l.trans({
                  en: "Build, test and deploy steps live in your repo and get reviewed like code.",
                  ko: "빌드·테스트·배포 단계가 저장소 안에서 코드처럼 리뷰됩니다.",
                })}
              </p>
              <p className="mt-4 text-foreground/75 leading-7">
                {l.trans({
                  en: "List your pipeline's steps in akan.config.ts, from build and test to Docker and deploy, and add shell steps of your own. Before you push, preview exactly what Akan Cloud will run, locally and without running anything. Pipeline secrets are write-only: once uploaded they are never shown again, and each step reads only the secrets it names.",
                  ko: "akan.config.ts에 빌드와 테스트부터 Docker, 배포까지 파이프라인 단계를 적고, 직접 만든 셸 단계도 끼워 넣으세요. 푸시하기 전에 Akan Cloud가 실행할 내용을 아무것도 실행하지 않고 로컬에서 미리 볼 수 있습니다. 파이프라인 시크릿은 쓰기 전용이라 한 번 올리면 다시 보이지 않고, 각 단계는 자기가 이름을 적은 시크릿만 읽습니다.",
                })}
              </p>
              <Code.Snippet
                className="mt-5 w-full"
                title="apps/web/akan.config.ts"
                code={`pipeline: {
  stages: [
    { use: "build" },
    { name: "Test", sh: "bun run akan test web" },
    { use: "docker" },
    { use: "deploy" },
  ],
},`}
                showLineNumbers={false}
              />
              <Link
                href="/cheatsheet/dev/pipeline"
                className="mt-4 inline-flex items-center gap-1 font-semibold text-primary text-sm hover:underline"
              >
                {l.trans({ en: "Pipelines", ko: "파이프라인" })} <BsArrowRight />
              </Link>
            </Scroll.Slide>

            <Scroll.Slide id="v31-performance" title={l.trans({ en: "Performance", ko: "성능" })} className="mt-20">
              <p className="font-bold text-primary text-sm uppercase tracking-[0.2em]">
                {l.trans({ en: "Performance", ko: "성능" })}
              </p>
              <h2 className="mt-3 font-black text-3xl">
                {l.trans({ en: "Stricter, and faster anyway", ko: "더 꼼꼼해졌는데, 더 빨라졌습니다" })}
              </h2>
              <p className="mt-4 text-foreground/75 leading-7">
                {l.trans({
                  en: "Checking every request had to come for free, so the path a request takes was rebuilt. Each endpoint is prepared once, responses follow a plan made once per model, and every call skips the work it does not need. Live connections got lighter too: a signed-in socket checks its login once per connection instead of on every message, while a sign-out still takes effect at once.",
                  ko: "모든 요청을 검사하는 일이 비용이 되면 안 되었기에, 요청이 지나가는 길을 새로 짰습니다. 엔드포인트는 한 번만 준비하고, 응답은 모델마다 한 번 만든 계획을 따르며, 호출마다 필요 없는 일은 건너뜁니다. 실시간 연결도 가벼워졌습니다. 로그인한 소켓은 메시지마다가 아니라 연결당 한 번 로그인을 확인하고, 로그아웃은 여전히 즉시 반영됩니다.",
                })}
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {performanceStats.map((stat) => (
                  <div key={stat.label.en} className="jelly-glass rounded-3xl p-5">
                    <p className="font-black text-4xl text-primary">{stat.value}</p>
                    <p className="mt-2 font-semibold text-foreground/80 text-sm leading-6">{l.trans(stat.label)}</p>
                    <p className="mt-1 font-mono text-foreground/45 text-xs">{stat.detail}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-foreground/45 text-xs leading-5">
                {l.trans({
                  en: "Each figure was measured on one machine just before and just after the change behind it: API calls in process, pages on a cached page of the sample app.",
                  ko: "각 수치는 해당 변경 직전과 직후를 한 머신에서 측정한 값입니다. API 호출은 프로세스 안에서, 페이지는 샘플 앱의 캐시된 페이지로 측정했습니다.",
                })}
              </p>
            </Scroll.Slide>

            <Scroll.Slide
              id="v31-users"
              title={l.trans({ en: "For your users", ko: "사용자가 느끼는 변화" })}
              className="mt-20"
            >
              <p className="font-bold text-primary text-sm uppercase tracking-[0.2em]">
                {l.trans({ en: "Everyday polish", ko: "일상의 다듬음" })}
              </p>
              <h2 className="mt-3 font-black text-3xl">
                {l.trans({ en: "What your users will notice", ko: "사용자가 느끼는 변화" })}
              </h2>
              <p className="mt-4 text-foreground/75 leading-7">
                {l.trans({
                  en: "Modals adapt to the screen: on a phone a modal can open as a full-screen sheet you swipe down to close, and on any screen it can slide in from the right as a side panel.",
                  ko: "모달이 화면에 맞춰 바뀝니다. 휴대폰에서는 아래로 쓸어내려 닫는 전체 화면 시트로, 어느 화면에서든 오른쪽에서 밀려 나오는 사이드 패널로 열 수 있습니다.",
                })}
              </p>
              <Docs.Figure
                title={l.trans({ en: "Dialog on desktop, sheet on phone", ko: "데스크톱엔 대화상자, 폰엔 시트" })}
                image="v31-modal-sheet"
                prompt={`
                Two devices side by side with plenty of space between them, and draw nothing at all outside them. On
                the left, a wide laptop whose screen shows a small dialog box floating in its centre, labelled
                "Desktop: dialog". On the right, a phone whose lower two thirds are covered by a sheet with rounded
                top corners and a short drag handle bar at its top edge, with a small downward arrow beside the
                sheet showing it being swiped away; the sheet is the red accent and is labelled "Phone: sheet".
              `}
                alt={l.trans({
                  en: "The same modal floats as a dialog on a laptop and opens as a swipe-to-close bottom sheet on a phone.",
                  ko: "같은 모달이 노트북에서는 가운데 뜨는 대화상자로, 휴대폰에서는 쓸어내려 닫는 바텀 시트로 열립니다.",
                })}
              />
              <div className="mt-2 grid gap-3 md:grid-cols-2">
                {userImprovements.map((item) => (
                  <Link
                    key={item.title.en}
                    href={item.href}
                    className={panelRecipe(
                      { tone: "jelly", radius: "3xl", padding: "none" },
                      "group squish hover:tint-primary p-5 transition-shadow",
                    )}
                  >
                    <p className="font-bold group-hover:text-primary">{l.trans(item.title)}</p>
                    <p className="mt-2 text-foreground/65 text-sm leading-6">{l.trans(item.desc)}</p>
                  </Link>
                ))}
              </div>
            </Scroll.Slide>

            <Scroll.Slide
              id="v31-team"
              title={l.trans({ en: "For your team", ko: "개발팀이 느끼는 변화" })}
              className="mt-16"
            >
              <h2 className="font-black text-2xl md:text-3xl">
                {l.trans({ en: "What your team will notice", ko: "개발팀이 느끼는 변화" })}
              </h2>
              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {teamImprovements.map((item) => (
                  <Link
                    key={item.title.en}
                    href={item.href}
                    className={panelRecipe(
                      { tone: "jelly", radius: "3xl", padding: "none" },
                      "group squish hover:tint-primary p-5 transition-shadow",
                    )}
                  >
                    <p className="font-bold group-hover:text-primary">{l.trans(item.title)}</p>
                    <p className="mt-2 text-foreground/65 text-sm leading-6">{l.trans(item.desc)}</p>
                  </Link>
                ))}
              </div>
            </Scroll.Slide>

            <Scroll.Slide
              id="v31-upgrade"
              title={l.trans({ en: "Upgrading from 3.0", ko: "3.0에서 올라올 때" })}
              className="mt-16"
            >
              <h2 className="font-black text-2xl md:text-3xl">
                {l.trans({ en: "Upgrading from 3.0", ko: "3.0에서 올라올 때" })}
              </h2>
              <p className="mt-3 text-foreground/65 leading-7">
                {l.trans({
                  en: "3.1 needs Bun 1.4.4 and React 19.3.1. Upgrade Bun, update the workspace, and run the commands below on each app and library. Most apps need nothing more. If yours accepts loosely shaped requests, calls other servers, or ships desktop or phone updates, the release notes have a short checklist, and lint and typecheck point at most of it.",
                  ko: "3.1은 Bun 1.4.4와 React 19.3.1이 필요합니다. Bun을 올리고 워크스페이스를 업데이트한 다음, 앱과 라이브러리마다 아래 명령을 실행하세요. 대부분의 앱은 이것으로 끝납니다. 느슨한 모양의 요청을 받거나, 다른 서버를 호출하거나, 데스크톱·폰 업데이트를 배포한다면 릴리즈 노트의 짧은 체크리스트를 확인하세요. 대부분은 lint와 typecheck가 위치를 짚어 줍니다.",
                })}
              </p>
              <Code.Snippet className="mt-5 w-full" title="Terminal" code={upgradeSteps} showLineNumbers={false} />
              <Link
                href="/blog/release-notes-3-1-0#notes-upgrade"
                className="mt-4 inline-flex items-center gap-2 font-semibold text-primary hover:underline"
              >
                {l.trans({ en: "See the upgrade checklist", ko: "업그레이드 체크리스트 보기" })} <BsArrowRight />
              </Link>
            </Scroll.Slide>

            <Scroll.Slide
              id="v31-next"
              title={l.trans({ en: "What comes next", ko: "다음은" })}
              className="jelly-callout tint-primary mt-16 rounded-3xl p-6 md:p-8"
            >
              <h2 className="font-black text-2xl md:text-3xl">{l.trans({ en: "What comes next", ko: "다음은" })}</h2>
              <p className="mt-4 text-foreground/75 leading-7">
                {l.trans({
                  en: "3.1 makes everything v3 introduced safe to run for real. It already works hand in hand with Akan Cloud, which runs your pipeline, keeps your secrets and signs your phone updates. The roadmap shows where the cloud and the agent features go from here.",
                  ko: "3.1은 v3가 연 모든 것을 실제로 운영할 수 있게 다졌습니다. 그리고 파이프라인을 실행하고, 시크릿을 보관하고, 폰 업데이트에 서명하는 Akan Cloud와 이미 손발을 맞춥니다. 클라우드와 에이전트 기능이 어디로 가는지는 로드맵에 있습니다.",
                })}
              </p>
              <Link
                href="/roadmap"
                className="mt-4 inline-flex items-center gap-2 font-semibold text-primary hover:underline"
              >
                {l.trans({ en: "See the roadmap", ko: "로드맵 보기" })} <BsArrowRight />
              </Link>
            </Scroll.Slide>
            <DocsToc />
          </Scroll>
        </article>
      </main>
    );
  });
