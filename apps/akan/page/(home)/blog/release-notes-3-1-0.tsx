import { usePage } from "@apps/akan/client";
import { Code, DocsToc, JellyKicker } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";
import { badgeRecipe, Link } from "akanjs/ui";
import { BsArrowRight, BsChevronDown } from "react-icons/bs";

const requirements = [
  {
    name: "Bun",
    version: "1.4.4+",
    note: { en: "Akan stops on an older Bun.", ko: "그보다 오래된 Bun에서는 akan이 멈춥니다." },
  },
  {
    name: "React",
    version: "19.3.1",
    note: {
      en: "Pin react, react-dom and react-server-dom-webpack to this version.",
      ko: "react, react-dom, react-server-dom-webpack을 이 버전으로 고정합니다.",
    },
  },
  {
    name: "akanjs · @akanjs/cli",
    version: "3.1.0",
    note: {
      en: "Install both at the same version; the new CLI will not build native apps against an older akanjs.",
      ko: "둘을 같은 버전으로 설치합니다. 새 CLI는 이전 akanjs로는 네이티브 앱을 빌드하지 않습니다.",
    },
  },
] as const;

const upgradeSteps = `bun upgrade
akan update
akan sync <app-or-lib>
akan lint <app-or-lib>
akan typecheck <app-or-lib>`;

const securityItems = [
  {
    en: "Visitors' sessions never mix. Under heavy traffic, part of a page streamed to one visitor could read another visitor's login cookie; each render now sees only its own request.",
    ko: "방문자끼리 세션이 섞이지 않습니다. 트래픽이 몰릴 때 한 방문자에게 스트리밍되던 화면 일부가 다른 방문자의 로그인 쿠키를 읽을 수 있었는데, 이제 각 렌더는 자기 요청만 봅니다.",
  },
  {
    en: "Your users' login stays home. A server-side call to another company's API no longer forwards the visitor's login token, cookie or address; only calls to your own server carry them.",
    ko: "사용자의 로그인 정보가 밖으로 새지 않습니다. 서버가 외부 API를 호출할 때 더는 방문자의 로그인 토큰, 쿠키, 주소를 보내지 않고, 내 서버로 가는 호출만 이를 싣습니다.",
  },
  {
    en: "No more redirect tricks. A crafted link such as ?redirect=evil.com can no longer use the app's navigation to send a visitor to another site.",
    ko: "리다이렉트 낚시를 막습니다. ?redirect=evil.com 같은 조작된 링크가 앱의 화면 이동을 이용해 방문자를 다른 사이트로 보낼 수 없습니다.",
  },
  {
    en: "Requests can't grant themselves extra rights. Fields a form was never meant to send, such as a role or a deleted flag, are dropped before they reach your code.",
    ko: "요청이 스스로 권한을 올릴 수 없습니다. 역할이나 삭제 표시처럼 폼이 보내면 안 되는 필드는 코드에 닿기 전에 버려집니다.",
  },
  {
    en: "Switching accounts leaves nothing behind. Pages kept for the previous account are dropped at sign-in, and a redirect raised while a page renders is never cached by a CDN.",
    ko: "계정을 바꾸면 이전 화면이 남지 않습니다. 로그인하는 순간 이전 계정을 위해 보관한 화면을 버리고, 페이지를 그리다 발생한 리다이렉트는 CDN에 캐시되지 않습니다.",
  },
  {
    en: "Login headers are read one strict way everywhere: the API, the AI endpoint, device tokens, the ops channel and the log stream all accept only 'Bearer' followed by a single token.",
    ko: "로그인 헤더를 어디서나 같은 엄격한 방식으로 읽습니다. API, AI 엔드포인트, 기기 토큰, ops 채널, 로그 스트림 모두 'Bearer'와 토큰 하나만 받습니다.",
  },
  {
    en: "Fewer secrets in your logs: more kinds are masked, such as webhook URLs, database connection strings and signing keys.",
    ko: "로그에 남는 시크릿이 줄었습니다. 웹훅 주소, 데이터베이스 연결 문자열, 서명 키 등 더 많은 종류를 가립니다.",
  },
  {
    en: "Updates nobody can tamper with. A CDN in between can no longer alter a signed app update, and a signed desktop app refuses an update signed by anyone else.",
    ko: "누구도 손댈 수 없는 업데이트. 중간의 CDN이 서명된 앱 업데이트를 바꿀 수 없고, 서명된 데스크톱 앱은 다른 사람이 서명한 업데이트를 거절합니다.",
  },
  {
    en: "A server running on an edge device starts with its AI endpoint turned off.",
    ko: "edge 기기에서 도는 서버는 AI 엔드포인트를 끈 채로 시작합니다.",
  },
  {
    en: "The in-page agent acts only on what is on screen: if the screen changes while it is acting, its call is refused instead of running against the wrong thing.",
    ko: "인페이지 에이전트는 화면에 보이는 대로만 움직입니다. 동작하는 사이 화면이 바뀌면 엉뚱한 대상에 실행되지 않도록 그 호출을 거절합니다.",
  },
  {
    en: "A security scan hardened text matching against input crafted to stall the server, keeps unsafe link types out of what the agent reads, and escapes values written into native app settings.",
    ko: "보안 점검으로, 서버를 멈추게 하려고 조작한 입력에도 텍스트 검사가 버티게 했고, 에이전트가 읽는 화면에서 위험한 종류의 링크를 빼며, 네이티브 앱 설정에 쓰는 값을 이스케이프합니다.",
  },
] as const;

const featureAreas = [
  {
    id: "pages",
    title: { en: "Pages and navigation", ko: "화면과 이동" },
    href: "/docs/core/routing",
    items: [
      {
        en: "Access control before render: a guard on a layout or page decides who may open it before anything is drawn. A guest goes straight to sign-in, and a record they may not see answers as if it did not exist.",
        ko: "그리기 전에 하는 접근 제어. 레이아웃이나 페이지의 가드가 무엇이든 그리기 전에 누가 열 수 있는지 정합니다. 손님은 곧바로 로그인 화면으로 가고, 볼 권한이 없는 레코드는 처음부터 없는 것처럼 응답합니다.",
      },
      {
        en: "Give each theme its own colour, and the browser bar and the iOS status bar follow it the moment the theme switches.",
        ko: "테마마다 색을 지정하면 브라우저 상단 막대와 iOS 상태 표시줄이 테마를 바꾸는 즉시 그 색을 따릅니다.",
      },
      {
        en: "A change of only the URL's query, such as a filter, can update the screen without reloading the page from the server.",
        ko: "필터처럼 URL의 쿼리만 바뀌면 서버에서 페이지를 다시 불러오지 않고 화면만 바꿀 수 있습니다.",
      },
      {
        en: "A back button always has somewhere to go: give it a fallback page for the first screen after a reload.",
        ko: "뒤로 가기 버튼에 언제나 갈 곳이 있습니다. 새로고침 직후 첫 화면을 위한 대체 페이지를 지정할 수 있습니다.",
      },
      {
        en: "Headers, tab bars and other frame parts arrive in the first HTML, so text typed before the page finishes loading keeps its place.",
        ko: "헤더, 탭 바 같은 프레임 요소가 첫 HTML에 함께 오므로, 페이지가 다 뜨기 전에 입력한 글자가 그대로 남습니다.",
      },
      {
        en: "Titles and meta tags from nested layouts merge predictably: the deepest one wins, and the rest are kept.",
        ko: "중첩된 레이아웃의 제목과 메타 태그가 예측대로 합쳐집니다. 가장 안쪽 것이 이기고 나머지는 유지됩니다.",
      },
    ],
  },
  {
    id: "ai",
    title: { en: "AI agents and MCP", ko: "AI 에이전트와 MCP" },
    href: "/cheatsheet/interface/mcp",
    items: [
      {
        en: "MCP Apps: show a page's component inside AI chats such as claude.ai. It is the same component your site shows, runs with the user's own permissions and can only read.",
        ko: "MCP Apps. 페이지의 컴포넌트를 claude.ai 같은 AI 채팅 안에 띄웁니다. 사이트에 보이는 바로 그 컴포넌트이고, 사용자 본인의 권한으로 동작하며 조회만 할 수 있습니다.",
      },
      {
        en: "Each of those views is built small, carrying only what it needs, and rebuilds as you save during development.",
        ko: "이런 뷰는 필요한 것만 담아 작게 빌드되고, 개발 중에는 저장할 때마다 다시 만들어집니다.",
      },
      {
        en: "Endpoints can return images that an AI model receives as pictures, such as a chart or a product photo.",
        ko: "엔드포인트가 차트나 상품 사진 같은 이미지를 돌려주면 AI 모델이 그림으로 받습니다.",
      },
      {
        en: "The in-page agent can look at images on the screen, and your own tools can attach files to what they return.",
        ko: "인페이지 에이전트가 화면의 이미지를 직접 보고, 직접 만든 도구가 결과에 파일을 붙일 수 있습니다.",
      },
      {
        en: "Give each screen action a human-friendly name, and list the screen's one-click actions for a command palette.",
        ko: "화면 동작마다 사람이 읽기 좋은 이름을 붙이고, 화면의 원클릭 동작을 커맨드 팔레트용으로 나열할 수 있습니다.",
      },
      {
        en: "Run a single AI turn on a different model, such as the one the user picked, without extra setup.",
        ko: "사용자가 고른 모델처럼 다른 모델로 AI 한 턴을 돌릴 때 따로 설정할 것이 없습니다.",
      },
    ],
  },
  {
    id: "server",
    title: { en: "Server and API", ko: "서버와 API" },
    href: "/cheatsheet/interface/endpoint",
    items: [
      {
        en: "Every request is checked against your models before your code runs, over HTTP, WebSocket and MCP alike. An error names the exact field, and fields the input does not declare are dropped.",
        ko: "HTTP, 웹소켓, MCP 어디로 오든 모든 요청을 코드 실행 전에 모델 정의와 대조합니다. 에러는 문제의 필드를 정확히 짚고, 입력에 선언되지 않은 필드는 버립니다.",
      },
      {
        en: "List the errors an endpoint returns on purpose. They appear in your API docs and in AI tool descriptions, and a caller can check for one by name.",
        ko: "엔드포인트가 의도해서 내는 에러를 선언합니다. API 문서와 AI 도구 설명에 실리고, 호출하는 쪽은 이름으로 그 에러인지 확인할 수 있습니다.",
      },
      {
        en: "Calls to other servers retry by themselves through brief outages and busy responses, within the deadline you set. Send a payment or an order with a duplicate-protection key and it runs exactly once.",
        ko: "다른 서버로 가는 호출이 잠깐의 장애나 과부하 응답에도 정한 제한 시간 안에서 스스로 재시도합니다. 결제나 주문에 중복 방지 키를 붙이면 정확히 한 번만 실행됩니다.",
      },
      {
        en: "Live connections reconnect gently, and right away when the device comes back online or the tab becomes visible. Missed updates are detected and filled in.",
        ko: "실시간 연결이 부드럽게 재연결하고, 기기가 다시 온라인이 되거나 탭이 보이면 바로 재연결합니다. 놓친 업데이트는 찾아서 채워 넣습니다.",
      },
      {
        en: "Clear an endpoint's cached answers on every server the moment the data behind them changes.",
        ko: "데이터가 바뀌는 순간 모든 서버에서 엔드포인트의 캐시된 응답을 비울 수 있습니다.",
      },
      {
        en: "Background jobs can cap how long they wait between retries and run a hook when they finally fail, and a server can start without scheduled jobs for tests and scripts.",
        ko: "백그라운드 작업이 재시도 사이의 최대 대기 시간을 정하고, 끝내 실패하면 훅을 실행할 수 있습니다. 테스트나 스크립트용으로 예약 작업 없이 서버를 띄울 수도 있습니다.",
      },
    ],
  },
  {
    id: "data",
    title: { en: "Data", ko: "데이터" },
    href: "/cheatsheet/dev/migration",
    items: [
      {
        en: "Data migrations that preview, apply, verify and roll back. A migration refuses to run if the data changed after you reviewed it, only one runs at a time, and it works the same in development and in deployed containers.",
        ko: "미리 보기, 적용, 확인, 되돌리기를 갖춘 데이터 마이그레이션. 검토한 뒤 데이터가 바뀌었으면 실행을 거절하고, 한 번에 하나만 돌며, 개발 환경과 배포된 컨테이너에서 똑같이 동작합니다.",
      },
      {
        en: "Akan Cloud can start a migration on a server it has no shell access to.",
        ko: "Akan Cloud가 셸로 접속할 수 없는 서버에서도 마이그레이션을 시작할 수 있습니다.",
      },
      {
        en: "Delete data past its retention, such as old logs, for good and in safe batches. A delete with no conditions is refused.",
        ko: "오래된 로그처럼 보존 기간이 지난 데이터를 안전한 묶음 단위로 영구 삭제합니다. 조건 없는 삭제는 거절합니다.",
      },
      {
        en: "Import records under their original ids and timestamps, and let summary fields add values up.",
        ko: "레코드를 원래의 id와 시각 그대로 가져올 수 있고, 요약(insight) 필드가 값을 합산할 수 있습니다.",
      },
    ],
  },
  {
    id: "ui",
    title: { en: "UI and forms", ko: "UI와 폼" },
    href: "/references/ui/forms",
    items: [
      {
        en: "A modal can open as a full-screen sheet on phones that you swipe down to close, or slide in from the right as a side panel.",
        ko: "모달이 휴대폰에서 아래로 쓸어내려 닫는 전체 화면 시트로 열리거나, 오른쪽에서 밀려 나오는 사이드 패널로 열릴 수 있습니다.",
      },
      {
        en: "Uploads belong to the form that started them, and the submit button waits until every upload is done.",
        ko: "업로드가 그것을 시작한 폼에 묶이고, 모든 업로드가 끝날 때까지 제출 버튼이 기다립니다.",
      },
      {
        en: "Mark every list of a model stale in one call, so each refreshes the next time it is shown.",
        ko: "한 번의 호출로 모델의 모든 목록을 오래된 것으로 표시해, 다음에 보일 때 새로 불러오게 합니다.",
      },
      {
        en: "Layouts can follow the on-screen keyboard and the safe areas, with different spacing per screen size, and the bottom tab bar tells screen readers which tab is current.",
        ko: "레이아웃이 화면 키보드와 안전 영역을 따르고 화면 크기마다 여백을 달리할 수 있으며, 하단 탭 바는 스크린 리더에 현재 탭을 알려 줍니다.",
      },
      {
        en: "Tooltips flip to the side with room, bottom sheets lock the page behind them, and the agent's launcher button can move or hide on small screens.",
        ko: "툴팁이 공간이 있는 쪽으로 뒤집히고, 바텀 시트는 뒤의 페이지를 잠그며, 에이전트 런처 버튼은 위치를 바꾸거나 작은 화면에서 숨길 수 있습니다.",
      },
      {
        en: "Generated API reference pages render on the server and can be grouped by library.",
        ko: "자동 생성되는 API 레퍼런스 페이지가 서버에서 렌더링되고, 라이브러리별로 묶을 수 있습니다.",
      },
    ],
  },
  {
    id: "native",
    title: { en: "Native apps", ko: "네이티브 앱" },
    href: "/cheatsheet/mobile/setup",
    items: [
      {
        en: "Phone app updates are signed so no CDN can tamper with them, with up to three signing keys to rotate between and revocations every device remembers for good.",
        ko: "폰 앱 업데이트를 CDN이 손댈 수 없도록 서명하고, 서명 키를 최대 세 개까지 두고 교체할 수 있으며, 키 폐기는 모든 기기가 영구히 기억합니다.",
      },
      {
        en: "See how each release landed on devices (downloaded, applied, rolled back or failed) through a random install id and nothing about the user.",
        ko: "릴리즈가 기기마다 다운로드, 적용, 롤백, 실패 중 어떻게 됐는지 볼 수 있습니다. 무작위 설치 id만 쓰고 사용자에 관한 정보는 모으지 않습니다.",
      },
      {
        en: "Publish a phone update straight to Akan Cloud, which signs and ships it, and register store builds the same way. The same commit always packs to the same bytes, settings included.",
        ko: "폰 업데이트를 Akan Cloud에 바로 올리면 서명해서 배포하고, 스토어 빌드도 같은 방식으로 등록합니다. 같은 커밋은 설정까지 포함해 언제나 같은 결과물로 묶입니다.",
      },
      {
        en: "Kiosk mode for desktop apps: pages cannot open print or file dialogs, downloads, share sheets or other programs.",
        ko: "데스크톱 앱용 키오스크 모드. 페이지가 인쇄·파일 대화상자, 다운로드, 공유 시트, 다른 프로그램을 열 수 없습니다.",
      },
      {
        en: "A desktop app's built-in server restarts itself, is watched by a health check, and can be built without your secrets. Devices can prove who they are with signed device tokens, and a module can run only on edge devices.",
        ko: "데스크톱 앱에 내장된 서버가 스스로 재시작하고, 헬스 체크가 지켜보며, 시크릿 없이 빌드할 수 있습니다. 기기는 서명된 기기 토큰으로 자신을 증명하고, 모듈을 edge 기기에서만 켤 수도 있습니다.",
      },
      {
        en: "Show a third-party web page inside your desktop app as if it were your own, with its own browser profile, and place windows on a chosen display, frameless if you like.",
        ko: "서드파티 웹 페이지를 전용 브라우저 프로필로 데스크톱 앱 안에 내 화면처럼 띄우고, 창을 원하는 디스플레이에 프레임 없이 배치할 수 있습니다.",
      },
      {
        en: "Windows paint their background before the page loads, so there is no white flash. Windows apps name your company as publisher, installers can bundle WebView2, installed apps can switch update channels, and internal builds can open developer tools.",
        ko: "창이 페이지보다 먼저 배경색을 칠해 흰 화면 깜빡임이 없습니다. Windows 앱의 게시자로 회사 이름이 나오고, 설치 프로그램에 WebView2를 넣을 수 있으며, 설치된 앱은 업데이트 채널을 바꿀 수 있고, 내부용 빌드에서는 개발자 도구를 열 수 있습니다.",
      },
      {
        en: "Publish desktop releases for both arm64 and x64, and upload them straight to S3.",
        ko: "데스크톱 릴리즈를 arm64와 x64 모두로 게시하고 S3에 바로 올릴 수 있습니다.",
      },
    ],
  },
  {
    id: "cli",
    title: { en: "CLI and deployment", ko: "CLI와 배포" },
    href: "/cheatsheet/dev/pipeline",
    items: [
      {
        en: "Declare your build pipeline in akan.config.ts, from build and test to Docker and deploy, with shell steps of your own, and preview locally what Akan Cloud will run.",
        ko: "빌드와 테스트부터 Docker, 배포까지 빌드 파이프라인을 akan.config.ts에 선언하고 직접 만든 셸 단계를 넣으며, Akan Cloud가 실행할 내용을 로컬에서 미리 봅니다.",
      },
      {
        en: "Pipeline secrets are write-only, kept per project and branch, and never accepted as a command-line argument.",
        ko: "파이프라인 시크릿은 쓰기 전용이고 프로젝트·브랜치별로 보관되며, 명령줄 인자로는 받지 않습니다.",
      },
      {
        en: "akan typecheck covers libraries and your tests, and a new lint rule catches hooks a render can skip, a classic cause of production-only crashes.",
        ko: "akan typecheck이 라이브러리와 테스트까지 검사하고, 새 린트 규칙이 프로덕션에서만 터지는 대표적 원인인, 렌더 중 건너뛸 수 있는 훅을 잡습니다.",
      },
      {
        en: "akan code, the built-in coding agent, compacts its conversation at a point you choose and can search the web when the workspace has a DeepSeek key.",
        ko: "내장 코딩 에이전트 akan code가 원하는 시점에 대화를 압축하고, 워크스페이스에 DeepSeek 키가 있으면 웹을 검색합니다.",
      },
      {
        en: "The AGENTS.md the CLI writes is about 60% smaller, so coding agents spend less of their context on rules.",
        ko: "CLI가 쓰는 AGENTS.md가 약 60% 작아져, 코딩 에이전트가 규칙에 쓰는 컨텍스트가 줄었습니다.",
      },
    ],
  },
] as const;

const performanceStats = [
  { value: "2.5×", label: { en: "faster list responses", ko: "더 빨라진 목록 응답" }, detail: "16 µs → 6.5 µs" },
  { value: "1.5×", label: { en: "faster simple API calls", ko: "더 빨라진 단순 API 호출" }, detail: "3.0 µs → 2.0 µs" },
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

const performanceNotes = [
  {
    en: "Each endpoint is prepared once and reused, and a call skips caching, duplicate protection and rate limiting when it does not use them.",
    ko: "엔드포인트를 한 번 준비해 재사용하고, 호출은 쓰지 않는 캐시·중복 방지·요청 제한 단계를 건너뜁니다.",
  },
  {
    en: "Responses follow a plan made once per model, in a single pass when no related data is involved.",
    ko: "응답은 모델마다 한 번 만든 계획을 따르고, 관련 데이터가 없으면 한 번에 끝납니다.",
  },
  {
    en: "A signed-in live connection checks its login once per connection instead of on every message; a sign-out still takes effect at once.",
    ko: "로그인한 실시간 연결은 메시지마다가 아니라 연결당 한 번 로그인을 확인하고, 로그아웃은 여전히 즉시 반영됩니다.",
  },
  {
    en: "The API description is built once per process, and startup logs how long each step took.",
    ko: "API 명세는 프로세스당 한 번만 만들고, 서버는 시작할 때 단계별 소요 시간을 기록합니다.",
  },
] as const;

const fixAreas = [
  {
    id: "pages",
    title: { en: "Pages and navigation", ko: "화면과 이동" },
    items: [
      {
        en: "Missing pages and redirects return real 404 and 3xx status codes, even while a layout is still loading, so search engines and link previews read them right. An invalid value in the URL answers 404 instead of a blank page.",
        ko: "없는 페이지와 리다이렉트가 레이아웃이 아직 로딩 중이어도 실제 404와 3xx로 응답하므로, 검색 엔진과 링크 미리보기가 제대로 읽습니다. URL의 잘못된 값은 빈 페이지 대신 404로 응답합니다.",
      },
      {
        en: "A page whose head fails still renders instead of failing the whole request, and loading indicators on group layouts show up.",
        ko: "head에서 오류가 난 페이지도 요청 전체를 실패시키지 않고 렌더링되며, 그룹 레이아웃의 로딩 표시가 제대로 나타납니다.",
      },
      {
        en: "Back and forward return to where you left off, in Safari too, while images and streamed sections settle.",
        ko: "뒤로·앞으로 이동하면 Safari에서도 떠났던 위치로 돌아가고, 이미지와 스트리밍 섹션이 자리를 잡는 동안에도 그 위치를 지킵니다.",
      },
      {
        en: "In native app screens, not-found pages, redirects and stacked screens behave correctly.",
        ko: "네이티브 앱 화면에서 없는 페이지, 리다이렉트, 쌓인 화면이 올바르게 동작합니다.",
      },
      {
        en: "External links with unusual casing or no scheme (//host) open outside the app, unchanged.",
        ko: "대소문자가 섞였거나 스킴이 없는(//host) 외부 링크도 앱 밖에서 그대로 열립니다.",
      },
      {
        en: "A base path matches only whole segments, so /officers is no longer mistaken for /office, and Chrome finds the install manifest.",
        ko: "base path가 세그먼트 단위로만 맞으므로 /officers가 더는 /office로 오인되지 않고, Chrome이 설치용 manifest를 찾습니다.",
      },
    ],
  },
  {
    id: "server",
    title: { en: "Server and API", ko: "서버와 API" },
    items: [
      {
        en: "Bad or missing arguments answer 400 and missing records 404, instead of 500, and links to deleted records drop out of lists.",
        ko: "잘못되거나 빠진 인자는 400, 없는 레코드는 404로 500 대신 응답하고, 삭제된 레코드로의 연결은 목록에서 빠집니다.",
      },
      {
        en: "A cached answer is identical to a fresh one, dates and binary data included.",
        ko: "캐시된 응답이 날짜와 바이너리 데이터까지 새 응답과 똑같습니다.",
      },
      {
        en: "Live rooms no longer keep subscribers that already left, and server-to-server live connections recover within one heartbeat.",
        ko: "실시간 방에 이미 떠난 구독자가 남지 않고, 서버 사이의 실시간 연결은 하트비트 한 번 안에 회복합니다.",
      },
      {
        en: "Errors from a proxy in between show as readable messages, a 'retry after 0 seconds' means now, and a cloned client keeps its timeout.",
        ko: "중간 프록시의 에러가 읽을 수 있는 메시지로 보이고, '0초 뒤 재시도'는 즉시로 읽으며, 복제한 클라이언트가 타임아웃을 유지합니다.",
      },
      {
        en: "Turning a module off also turns off the modules that depend on it instead of erroring, memory limits inside containers are read correctly, and a crashed replica is restarted reliably.",
        ko: "모듈을 끄면 그에 기대는 모듈도 에러 없이 함께 꺼지고, 컨테이너 안의 메모리 한도를 올바르게 읽으며, 죽은 레플리카를 확실히 다시 띄웁니다.",
      },
      {
        en: "Type fixes: in-memory values keep their class, and an endpoint that returns anything is typed unknown on the client.",
        ko: "타입 수정. 메모리에 둔 값이 자기 클래스를 유지하고, 무엇이든 돌려주는 엔드포인트는 클라이언트에서 unknown 타입이 됩니다.",
      },
    ],
  },
  {
    id: "data",
    title: { en: "Data", ko: "데이터" },
    items: [
      {
        en: "Conditional updates are atomic on Postgres: two simultaneous withdrawals can no longer both pass the same balance check.",
        ko: "Postgres에서 조건부 업데이트가 원자적으로 동작합니다. 동시에 들어온 두 출금이 같은 잔액 검사를 함께 통과할 수 없습니다.",
      },
      {
        en: "Index names stay stable, so adding one no longer rebuilds the rest. Indexes Akan created and no longer needs are removed; ones you made by hand are left alone.",
        ko: "인덱스 이름이 바뀌지 않으므로 하나를 추가해도 나머지를 다시 만들지 않습니다. akan이 만들었지만 더는 필요 없는 인덱스는 지우고, 직접 만든 인덱스는 건드리지 않습니다.",
      },
      {
        en: "Partial indexes are real on SQLite and Postgres, so a deleted record can give its unique value back, such as an email address.",
        ko: "SQLite와 Postgres에서 부분 인덱스가 실제로 만들어지므로, 삭제된 레코드가 이메일 주소 같은 고유 값을 돌려줄 수 있습니다.",
      },
      {
        en: "A queued job that crashed on its last attempt is marked failed instead of running again.",
        ko: "마지막 시도에서 죽은 작업은 다시 실행되지 않고 실패로 처리됩니다.",
      },
      {
        en: "Cascading deletes finish cleanly even when two owners share a target, with no files left behind.",
        ko: "두 소유자가 같은 대상을 가리켜도 연쇄 삭제가 깔끔하게 끝나고 파일이 남지 않습니다.",
      },
      {
        en: "Filtering by a model's own kind field works, counts on searchable models are accurate, SQLite waits only for real writes, and live lists that send only ids update.",
        ko: "모델 자신의 kind 필드로 필터링할 수 있고, 검색 필드가 있는 모델의 개수가 정확하며, SQLite는 실제 쓰기만 기다리고, id만 보내는 실시간 목록도 갱신됩니다.",
      },
    ],
  },
  {
    id: "ui",
    title: { en: "UI and forms", ko: "UI와 폼" },
    items: [
      {
        en: "Modals stack above everything else, dropdowns inside them open on top, toasts sit above modals, and the agent's launcher sits under menus.",
        ko: "모달이 모든 것 위에 쌓이고, 모달 안의 드롭다운은 그 위에 열리며, 토스트는 모달보다 위, 에이전트 런처는 메뉴 아래에 놓입니다.",
      },
      {
        en: "Buttons inside built-in components, such as a password toggle or a copy button, no longer submit the surrounding form.",
        ko: "비밀번호 보기나 복사 버튼처럼 기본 컴포넌트 안의 버튼이 더는 바깥 폼을 제출하지 않습니다.",
      },
      {
        en: "An open edit form keeps what you typed when the page refreshes, and a searchable select searches once after you stop typing.",
        ko: "열린 편집 폼은 페이지가 새로고침돼도 입력한 내용을 지키고, 검색 가능한 셀렉트는 입력을 멈춘 뒤 한 번만 검색합니다.",
      },
      {
        en: "Live lists keep all their rows and stay put through updates, and a list shown again after going back in a native app reloads its own data.",
        ko: "실시간 목록이 모든 행을 유지하고 업데이트에도 흔들리지 않으며, 네이티브 앱에서 뒤로 가서 다시 보이는 목록은 자기 데이터를 새로 불러옵니다.",
      },
      {
        en: "Selects show options by their translated names, and edit modals show only the actions you are allowed to take.",
        ko: "셀렉트가 옵션을 번역된 이름으로 보여 주고, 편집 모달은 허용된 동작만 보여 줍니다.",
      },
      {
        en: "Installed web apps stop bouncing, small inputs no longer make iOS zoom in, and the back link is a real button a keyboard can reach.",
        ko: "홈 화면에 설치한 웹 앱이 출렁이지 않고, 작은 입력 칸이 iOS 확대를 일으키지 않으며, 뒤로 가기 링크는 키보드로 닿는 진짜 버튼입니다.",
      },
      {
        en: "In the agent chat on phones, picking from the @ and / menus keeps the keyboard up, and mentions with brackets in their title work.",
        ko: "휴대폰의 에이전트 채팅에서 @와 / 메뉴를 골라도 키보드가 내려가지 않고, 제목에 대괄호가 든 멘션도 동작합니다.",
      },
    ],
  },
  {
    id: "native",
    title: { en: "Native apps", ko: "네이티브 앱" },
    items: [
      {
        en: "A signed desktop app refuses updates signed by someone else, and stops offering them.",
        ko: "서명된 데스크톱 앱이 다른 사람이 서명한 업데이트를 거절하고, 다시 제안하지 않습니다.",
      },
      {
        en: "A phone release that freezes rolls back while the app runs, background launches no longer cause false rollbacks, and apps built with the iOS 26 SDK run on iOS 18.5 again.",
        ko: "폰에서 멈춘 릴리즈는 앱이 실행 중일 때 롤백하고, 백그라운드 실행이 엉뚱한 롤백을 일으키지 않으며, iOS 26 SDK로 빌드한 앱이 iOS 18.5에서 다시 실행됩니다.",
      },
      {
        en: "Windows installs and uninstalls survive automatic restarts, a silent install shows no window over a kiosk, only one instance runs across sessions, and the app's own name appears on its executable.",
        ko: "Windows 설치와 제거가 자동 재시작에도 실패하지 않고, 조용한 설치는 키오스크 위에 창을 띄우지 않으며, 세션이 달라도 하나만 실행되고, 실행 파일에 앱 이름이 표시됩니다.",
      },
      {
        en: "A window can no longer be placed off every display.",
        ko: "창이 모든 디스플레이 밖에 놓이는 일이 없어졌습니다.",
      },
    ],
  },
  {
    id: "cli",
    title: { en: "CLI and build", ko: "CLI와 빌드" },
    items: [
      {
        en: "No command waits for keyboard input in CI: a missing argument fails right away and says what to pass.",
        ko: "어떤 명령도 CI에서 키보드 입력을 기다리지 않습니다. 빠진 인자는 바로 실패하며 무엇을 넘길지 알려 줍니다.",
      },
      {
        en: "Builds are reproducible, and the default Docker image is pinned to Bun 1.4.4 instead of a moving tag.",
        ko: "빌드가 재현 가능해졌고, 기본 Docker 이미지가 움직이는 태그 대신 Bun 1.4.4로 고정됩니다.",
      },
      {
        en: "Script, console and database import and export commands run from the workspace root against the same database as akan start.",
        ko: "스크립트, 콘솔, 데이터베이스 가져오기·내보내기 명령이 워크스페이스 루트에서 akan start와 같은 데이터베이스로 동작합니다.",
      },
      {
        en: "Tailwind classes with nested brackets compile, and code highlighting inside a lazily loaded editor works in app bundles.",
        ko: "대괄호가 중첩된 Tailwind 클래스가 컴파일되고, 지연 로딩한 에디터의 코드 하이라이팅이 앱 번들에서도 동작합니다.",
      },
      {
        en: "Failed builds print their errors once, and a child server's errors show in the akan start terminal.",
        ko: "실패한 빌드는 에러를 한 번만 출력하고, 자식 서버의 에러가 akan start 터미널에 보입니다.",
      },
      {
        en: "Generated files pass lint, the CLI runs without a root .env, generated paths use / on Windows, installing a library is faster, and warnings no longer break JSON output.",
        ko: "생성된 파일이 린트를 통과하고, CLI가 루트 .env 없이도 동작하며, Windows에서도 생성 경로에 /를 쓰고, 라이브러리 설치가 빨라졌으며, 경고가 JSON 출력을 깨지 않습니다.",
      },
    ],
  },
] as const;

const upgradeGroups = [
  {
    title: { en: "Every app", ko: "모든 앱" },
    desc: { en: "Check these whatever your app does.", ko: "앱이 무엇을 하든 확인하세요." },
    notes: [
      {
        en: "Requests are checked strictly now. A client that sends a number as text, an { id } object where an id belongs, or leaves out a required field gets 400. If your service read a field its input does not declare, declare it.",
        ko: "요청을 이제 엄격하게 검사합니다. 숫자를 문자열로 보내거나, id 자리에 { id } 객체를 보내거나, 필수 필드를 빠뜨린 클라이언트는 400을 받습니다. 서비스가 입력에 선언되지 않은 필드를 읽고 있었다면 선언하세요.",
        href: "/cheatsheet/interface/endpoint",
      },
      {
        en: "Bad or missing arguments answer 400 instead of 500: update tests or clients that expected 500.",
        ko: "잘못되거나 빠진 인자는 500 대신 400으로 응답합니다. 500을 기대하던 테스트나 클라이언트를 고치세요.",
        href: "/cheatsheet/observability/error",
      },
      {
        en: "akan typecheck checks your tests too (--tests false restores the old scope), and lint flags hooks a render can skip.",
        ko: "akan typecheck이 테스트까지 검사하고(예전 범위는 --tests false), 린트는 렌더 중 건너뛸 수 있는 훅을 잡습니다.",
        href: "/conventions/workspace/lint",
      },
      {
        en: "Quote any .env value that contains #: an unquoted value now ends at the #, the way Bun reads it.",
        ko: "#이 들어간 .env 값은 따옴표로 감싸세요. 따옴표 없는 값은 이제 Bun처럼 # 앞에서 끝납니다.",
        href: "/docs/core/config",
      },
      {
        en: "A CI step that answered a prompt through stdin now fails fast: pass the argument on the command line.",
        ko: "stdin으로 프롬프트에 답하던 CI 단계는 이제 바로 실패합니다. 인자를 명령줄로 넘기세요.",
        href: "/references/cli/workspace",
      },
    ],
  },
  {
    title: { en: "If your server calls other servers", ko: "다른 서버를 호출한다면" },
    notes: [
      {
        en: "A server-side call to another origin no longer sends the visitor's login. Pass the token it should send with fetch.clone({ origin, jwt }), and deploy client and server together.",
        ko: "다른 출처로 가는 서버 쪽 호출은 더는 방문자의 로그인 정보를 보내지 않습니다. 보낼 토큰은 fetch.clone({ origin, jwt })로 직접 넘기고, 클라이언트와 서버를 함께 배포하세요.",
        href: "/cheatsheet/interface/endpoint",
      },
      {
        en: "A login header other than 'Bearer <token>' counts as no login.",
        ko: "'Bearer <토큰>' 형태가 아닌 로그인 헤더는 로그인하지 않은 것으로 봅니다.",
        href: "/docs/core/runtime",
      },
    ],
  },
  {
    title: { en: "Pages and UI", ko: "페이지와 UI" },
    notes: [
      {
        en: "router.push, replace and redirect to another site need { external: true }. A Link to another site is unchanged.",
        ko: "다른 사이트로 가는 router.push, replace, redirect에는 { external: true }가 필요합니다. 다른 사이트로 가는 Link는 그대로입니다.",
        href: "/references/akanjs/client",
      },
      {
        en: "A page no longer inherits its layout's canonical link or og:url: declare them in each page's own head.",
        ko: "페이지가 레이아웃의 canonical 링크와 og:url을 더는 물려받지 않습니다. 페이지마다 자기 head에 선언하세요.",
        href: "/docs/core/routing",
      },
      {
        en: "Modals now sit above other overlays. An element that used a z-index between 10 and 120 to sit above a modal now sits under it, and a custom agent launcher must apply its new style prop.",
        ko: "모달이 이제 다른 오버레이보다 위에 놓입니다. 10~120 사이 z-index로 모달 위에 있던 요소는 이제 모달 아래에 놓이고, 직접 만든 에이전트 런처는 새 style prop을 적용해야 합니다.",
        href: "/references/ui/customize",
      },
      {
        en: "A Link's active state matches whole path segments, and / is active only on the home page.",
        ko: "Link의 활성 상태는 경로 세그먼트 단위로 맞고, /는 홈 화면에서만 활성입니다.",
        href: "/references/ui/overlays",
      },
      {
        en: "Constant.Doc given an empty list now shows nothing; leave the prop out to show every model.",
        ko: "Constant.Doc에 빈 목록을 주면 이제 아무것도 보이지 않습니다. 모든 모델을 보이려면 prop을 빼세요.",
        href: "/cheatsheet/dev/docs",
      },
    ],
  },
  {
    title: { en: "MCP and agents", ko: "MCP와 에이전트" },
    notes: [
      {
        en: "Pages with .prompt() also appear as tools. In an app that serves its CSR bundle, AI clients that support MCP Apps can call the read endpoints a screen needs, under their guards, and an app with an .app() page uses the older MCP protocol revisions unless you set option.setMcp({ modern: true }). option.setMcp({ apps: false }) turns all of this off.",
        ko: ".prompt() 페이지가 도구 목록에도 나옵니다. CSR 번들을 제공하는 앱에서는 MCP Apps를 지원하는 AI 클라이언트가 화면에 필요한 조회 엔드포인트를 가드 아래에서 호출할 수 있고, .app() 페이지가 있는 앱은 option.setMcp({ modern: true })를 주지 않는 한 이전 MCP 프로토콜 리비전을 씁니다. option.setMcp({ apps: false })를 주면 모두 꺼집니다.",
        href: "/cheatsheet/interface/mcp",
      },
      {
        en: "The agent's image viewer is now one of its default tools; list the built-ins you want to leave it out.",
        ko: "에이전트의 이미지 보기 도구가 기본 도구에 들어갑니다. 빼려면 원하는 기본 도구를 나열하세요.",
        href: "/references/ui/agent",
      },
      {
        en: "A server running on an edge device serves /mcp only with AKAN_MCP=true or option.setMcp(true).",
        ko: "edge 기기에서 도는 서버는 AKAN_MCP=true나 option.setMcp(true)일 때만 /mcp를 제공합니다.",
        href: "/cheatsheet/general/edge",
      },
    ],
  },
  {
    title: { en: "Data and server", ko: "데이터와 서버" },
    notes: [
      {
        en: "Cache lifetimes are capped at one day, and answers cached before the upgrade are fetched fresh once.",
        ko: "캐시 수명은 최대 하루이고, 업그레이드 전에 캐시된 응답은 한 번 새로 불러옵니다.",
        href: "/cheatsheet/performance/caching",
      },
      {
        en: "LibsqlDatabase is removed: use SqliteDatabase for a local file, or cluster mode for a shared server.",
        ko: "LibsqlDatabase가 제거됐습니다. 로컬 파일은 SqliteDatabase를, 공유 서버는 cluster 모드를 쓰세요.",
        href: "/docs/core/config",
      },
      {
        en: "Indexes that declared a where are rebuilt once, as real partial indexes, on the next boot. A where no index can hold, or two different indexes with the same name, stops the boot.",
        ko: "where를 선언한 인덱스는 다음 부팅 때 실제 부분 인덱스로 한 번 다시 만들어집니다. 인덱스가 담을 수 없는 where나, 이름이 같은 서로 다른 두 인덱스는 부팅을 멈춥니다.",
        href: "/cheatsheet/general/schema",
      },
      {
        en: "In single database mode, a job whose process dies on its last attempt now fails instead of running again: use attempts: 2 to keep that retry.",
        ko: "single 데이터베이스 모드에서 마지막 시도 중에 프로세스가 죽은 작업은 다시 실행되지 않고 실패합니다. 그 재시도가 필요하면 attempts: 2를 주세요.",
        href: "/cheatsheet/performance/queue",
      },
      {
        en: "A memory() value of a model class is now an instance: copy it with new cnst.X().set(value), never a spread.",
        ko: "모델 클래스로 선언한 memory() 값은 이제 인스턴스입니다. 스프레드가 아니라 new cnst.X().set(value)로 복사하세요.",
        href: "/cheatsheet/performance/caching",
      },
      {
        en: "Turning a module off also leaves out the modules that relate to it, and log searches for a newly masked key see [redacted].",
        ko: "모듈을 끄면 그와 연결된 모듈도 함께 빠지고, 새로 가려진 키를 찾던 로그 검색에는 [redacted]가 보입니다.",
        href: "/cheatsheet/observability/logging",
      },
    ],
  },
  {
    title: { en: "Native apps", ko: "네이티브 앱" },
    notes: [
      {
        en: "Desktop signing is opt-in: add --sign true to akan build-desktop and akan publish-update, plus --notarize true on macOS. Sign each release the same way as the installed app, which refuses anything else.",
        ko: "데스크톱 서명은 이제 직접 켭니다. akan build-desktop과 akan publish-update에 --sign true를, macOS는 --notarize true까지 주세요. 설치된 앱은 다르게 서명된 릴리즈를 거절하므로 같은 방식으로 서명합니다.",
        href: "/cheatsheet/mobile/desktop-release",
      },
      {
        en: "Phone apps that receive updates need one new store binary before you publish an update in the new format, and a signing tool of your own must read the new layout.",
        ko: "업데이트를 받는 폰 앱은 새 형식의 업데이트를 배포하기 전에 스토어 바이너리를 한 번 다시 빌드해야 하고, 직접 쓰는 서명 도구가 있다면 새 구조를 읽게 바꿔야 합니다.",
        href: "/cheatsheet/mobile/setup",
      },
      {
        en: "In kiosk mode, pages cannot print, pick files, download or open the system browser: open those through the opener or file-picker plugin.",
        ko: "키오스크 모드에서는 페이지가 인쇄, 파일 선택, 다운로드, 시스템 브라우저 열기를 할 수 없습니다. 필요하면 opener나 file-picker 플러그인으로 여세요.",
        href: "/cheatsheet/mobile/setup",
      },
      {
        en: "A desktop app that carries its server is refused a release build while that server holds a secret from your server env files: build it with native.desktop.server.profile.",
        ko: "서버를 싣는 데스크톱 앱은 그 서버에 서버 env 파일의 시크릿이 들어 있으면 릴리즈 빌드가 거절됩니다. native.desktop.server.profile로 빌드하세요.",
        href: "/cheatsheet/general/edge",
      },
      {
        en: "akan pack-update --against exits 2 when a new store build is needed, and 1 for any other failure.",
        ko: "akan pack-update --against는 새 스토어 빌드가 필요하면 2로, 그 밖의 실패는 1로 끝납니다.",
        href: "/references/cli/application",
      },
    ],
  },
  {
    title: { en: "Workspace and tooling", ko: "워크스페이스와 도구" },
    notes: [
      {
        en: "A workspace with the shared or util library adds their type packages: bun add -d @types/react @types/react-dom, plus @types/nodemailer with util.",
        ko: "shared나 util 라이브러리를 쓰는 워크스페이스는 타입 패키지를 추가하세요. bun add -d @types/react @types/react-dom, util을 쓰면 @types/nodemailer도 넣습니다.",
        href: "/references/cli/library",
      },
      {
        en: "akan.subspace.ts is no longer read: move it under subspace in the workspace-root akan.config.ts and delete it. A subspace no longer receives the workspace's Jenkinsfile.",
        ko: "akan.subspace.ts는 더는 읽지 않습니다. 워크스페이스 루트 akan.config.ts의 subspace로 옮기고 파일을 지우세요. subspace는 더는 워크스페이스의 Jenkinsfile을 받지 않습니다.",
        href: "/references/cli/workspace",
      },
      {
        en: "Script, console and database import and export commands resolve relative paths from the workspace root: build a script's paths from import.meta.dir.",
        ko: "스크립트, 콘솔, 데이터베이스 가져오기·내보내기 명령은 상대 경로를 워크스페이스 루트에서 풉니다. 스크립트의 경로는 import.meta.dir로 만드세요.",
        href: "/cheatsheet/dev/script",
      },
      {
        en: "Run akan login again if your saved host ended in a slash, used capitals or :443, and set docker.image to run a Bun other than 1.4.4 in your image.",
        ko: "저장된 호스트에 끝 슬래시, 대문자, :443이 붙어 있었다면 akan login을 다시 하고, 이미지에서 1.4.4가 아닌 Bun을 쓰려면 docker.image를 지정하세요.",
        href: "/cheatsheet/dev/docker",
      },
      {
        en: "Optional peers move up: happy-dom 21, which loads no CSS files or iframes by default, and firebase 13.",
        ko: "선택적 peer가 올라갑니다. happy-dom은 기본으로 CSS 파일과 iframe을 불러오지 않는 21로, firebase는 13으로 바뀝니다.",
        href: "/cheatsheet/dev/test",
      },
    ],
  },
] as const;

const navItems = [
  { id: "requirements", title: { en: "Requirements", ko: "요구 사항" } },
  { id: "security", title: { en: "Security", ko: "보안" } },
  { id: "features", title: { en: "New features", ko: "새 기능" } },
  { id: "performance", title: { en: "Performance", ko: "성능" } },
  { id: "fixes", title: { en: "Fixes", ko: "버그 수정" } },
] as const;

export default page()
  .config({ transition: "stack" })
  .head(({ lang }) => {
    const title =
      lang === "ko" ? "Akan.js 3.1.0 릴리즈 노트 | Akan.js 블로그" : "Akan.js 3.1.0 release notes | Akan.js Blog";
    const description =
      lang === "ko"
        ? "3.1.0에서 바뀐 모든 것을 보안, 새 기능, 성능, 버그 수정으로 쉽게 정리하고, 업그레이드 체크리스트를 모았습니다."
        : "Everything in 3.1.0 in plain terms, by security, new features, performance and fixes, with a short upgrade checklist.";
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
              <JellyKicker>Akan.js 3.1.0</JellyKicker>
            </div>
            <p className="mb-4 text-foreground/50 text-sm">
              {l.trans({ en: "Release notes · Oct 25, 2026", ko: "릴리즈 노트 · 2026년 10월 25일" })}
            </p>
            <h1 className="font-black text-4xl leading-[1.08] md:text-[3.25rem]">
              {l.trans({ en: "Akan.js 3.1.0 release notes", ko: "Akan.js 3.1.0 릴리즈 노트" })}
            </h1>
            <p className="mt-6 text-foreground/70 text-lg leading-8">
              {l.trans({
                en: "Everything that changed in 3.1.0, in plain terms: what got safer, what is new, what got faster and what got fixed, followed by a short checklist for upgrading. Each package's CHANGELOG.md keeps the full technical entries.",
                ko: "3.1.0에서 바뀐 모든 것을 쉽게 정리했습니다. 무엇이 더 안전해졌고, 무엇이 새로 생겼고, 무엇이 빨라졌고, 무엇을 고쳤는지 본 뒤 짧은 업그레이드 체크리스트로 마무리합니다. 기술적인 전체 항목은 패키지마다 CHANGELOG.md에 있습니다.",
              })}
            </p>
            <Link
              href="/blog/v3-1release"
              className="mt-4 inline-flex items-center gap-2 font-semibold text-primary hover:underline"
            >
              {l.trans({ en: "Read the 3.1 announcement", ko: "3.1 발표 글 읽기" })} <BsArrowRight />
            </Link>
            <nav className="mt-8 flex flex-wrap gap-2">
              {navItems.map((item) => (
                <a
                  key={item.id}
                  href={`#notes-${item.id}`}
                  className={badgeRecipe(
                    undefined,
                    "border-foreground/10 bg-foreground/5 text-foreground/70 hover:text-primary",
                  )}
                >
                  {l.trans(item.title)}
                </a>
              ))}
              <a
                href="#notes-upgrade"
                className={badgeRecipe(undefined, "border-primary/20 bg-primary/10 text-primary hover:bg-primary/15")}
              >
                {l.trans({ en: "Upgrade checklist", ko: "업그레이드 체크리스트" })}
              </a>
            </nav>
          </header>

          <Scroll className="mt-14">
            <Scroll.Slide id="notes-requirements" title={l.trans({ en: "Requirements", ko: "요구 사항" })}>
              <h2 className="font-black text-2xl md:text-3xl">{l.trans({ en: "Requirements", ko: "요구 사항" })}</h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {requirements.map((row) => (
                  <div key={row.name} className="jelly-glass rounded-3xl p-5">
                    <p className="font-semibold text-foreground/60 text-sm">{row.name}</p>
                    <p className="mt-1 font-black font-mono text-2xl text-primary">{row.version}</p>
                    <p className="mt-2 text-foreground/65 text-sm leading-6">{l.trans(row.note)}</p>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-foreground/75 leading-7">
                {l.trans({
                  en: "Upgrade Bun, update the workspace and the global CLI, then run these once on every app and library:",
                  ko: "Bun을 올리고 워크스페이스와 전역 CLI를 업데이트한 다음, 모든 앱과 라이브러리에서 한 번씩 실행하세요:",
                })}
              </p>
              <Code.Snippet className="mt-5 w-full" title="Terminal" code={upgradeSteps} showLineNumbers={false} />
            </Scroll.Slide>

            <Scroll.Slide id="notes-security" title={l.trans({ en: "Security", ko: "보안" })} className="mt-16">
              <h2 className="font-black text-2xl md:text-3xl">{l.trans({ en: "Security", ko: "보안" })}</h2>
              <p className="jelly-callout tint-primary mt-6 rounded-3xl p-6 text-foreground/75 leading-7">
                {l.trans({
                  en: "None of these needs a code change, and several close a gap between visitors or between servers. Every 3.0 app should take 3.1.0.",
                  ko: "어느 것도 코드를 바꿀 필요가 없고, 여럿은 방문자 사이나 서버 사이의 틈을 막습니다. 3.0 앱은 모두 3.1.0으로 올리기를 권합니다.",
                })}
              </p>
              <ul className="mt-6 list-disc space-y-3 pl-5 text-foreground/75 leading-7">
                {securityItems.map((item) => (
                  <li key={item.en}>{l.trans(item)}</li>
                ))}
              </ul>
            </Scroll.Slide>

            <Scroll.Slide id="notes-features" title={l.trans({ en: "New features", ko: "새 기능" })} className="mt-16">
              <h2 className="font-black text-2xl md:text-3xl">{l.trans({ en: "New features", ko: "새 기능" })}</h2>
              {featureAreas.map((area) => (
                <section key={area.id} id={`notes-features-${area.id}`} className="mt-8">
                  <h3 className="font-bold text-primary text-sm uppercase tracking-[0.2em]">{l.trans(area.title)}</h3>
                  <ul className="mt-3 list-disc space-y-3 pl-5 text-foreground/75 leading-7">
                    {area.items.map((item) => (
                      <li key={item.en}>{l.trans(item)}</li>
                    ))}
                  </ul>
                  <Link
                    href={area.href}
                    className="mt-3 inline-flex items-center gap-1 font-semibold text-primary text-sm hover:underline"
                  >
                    {l.trans({ en: "Read the docs", ko: "문서 보기" })} <BsArrowRight />
                  </Link>
                </section>
              ))}
            </Scroll.Slide>

            <Scroll.Slide id="notes-performance" title={l.trans({ en: "Performance", ko: "성능" })} className="mt-16">
              <h2 className="font-black text-2xl md:text-3xl">{l.trans({ en: "Performance", ko: "성능" })}</h2>
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
              <h3 className="mt-8 font-bold text-primary text-sm uppercase tracking-[0.2em]">
                {l.trans({ en: "Where it comes from", ko: "어디서 빨라졌나" })}
              </h3>
              <ul className="mt-3 list-disc space-y-3 pl-5 text-foreground/75 leading-7">
                {performanceNotes.map((item) => (
                  <li key={item.en}>{l.trans(item)}</li>
                ))}
              </ul>
            </Scroll.Slide>

            <Scroll.Slide id="notes-fixes" title={l.trans({ en: "Fixes", ko: "버그 수정" })} className="mt-16">
              <h2 className="font-black text-2xl md:text-3xl">{l.trans({ en: "Fixes", ko: "버그 수정" })}</h2>
              <p className="mt-3 text-foreground/65 leading-7">
                {l.trans({
                  en: "Grouped by area. Open one to see what was fixed.",
                  ko: "영역별로 묶었습니다. 펼쳐서 무엇을 고쳤는지 보세요.",
                })}
              </p>
              <div className="mt-6 grid gap-3">
                {fixAreas.map((area) => (
                  <details key={area.id} className="group jelly-glass rounded-3xl px-5 py-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold">
                      <span>
                        {l.trans(area.title)}
                        <span className="ml-2 font-mono font-normal text-foreground/40 text-sm">
                          {area.items.length}
                        </span>
                      </span>
                      <BsChevronDown className="shrink-0 text-foreground/40 transition-transform group-open:rotate-180" />
                    </summary>
                    <ul className="mt-4 list-disc space-y-3 pl-5 text-foreground/75 text-sm leading-6">
                      {area.items.map((item) => (
                        <li key={item.en}>{l.trans(item)}</li>
                      ))}
                    </ul>
                  </details>
                ))}
              </div>
            </Scroll.Slide>

            <Scroll.Slide
              id="notes-upgrade"
              title={l.trans({ en: "Upgrade checklist", ko: "업그레이드 체크리스트" })}
              className="mt-16"
            >
              <h2 className="font-black text-2xl md:text-3xl">
                {l.trans({ en: "Upgrade checklist", ko: "업그레이드 체크리스트" })}
              </h2>
              <p className="mt-3 text-foreground/65 leading-7">
                {l.trans({
                  en: "Most apps need only the first group. Skim the rest for the features you use; akan lint and akan typecheck point at most of it.",
                  ko: "대부분의 앱은 첫 묶음만 확인하면 됩니다. 나머지는 쓰는 기능만 훑어보세요. 대부분은 akan lint와 akan typecheck가 위치를 짚어 줍니다.",
                })}
              </p>
              {upgradeGroups.map((group, groupIdx) => (
                <div
                  key={group.title.en}
                  className={
                    groupIdx === 0 ? "jelly-callout tint-primary mt-8 rounded-3xl p-5 md:p-6" : "mt-8 px-1 md:px-2"
                  }
                >
                  <h3 className="font-bold text-xl">{l.trans(group.title)}</h3>
                  {"desc" in group ? <p className="mt-1 text-foreground/60 text-sm">{l.trans(group.desc)}</p> : null}
                  <ol className="mt-4 grid gap-3">
                    {group.notes.map((note, idx) => (
                      <li key={note.en} className="jelly-glass flex gap-4 rounded-3xl p-4">
                        <span className="font-black font-mono text-foreground/30">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <div className="text-sm leading-6">
                          <p className="text-foreground/80">{l.trans(note)}</p>
                          <Link
                            href={note.href}
                            className="mt-1 inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                          >
                            {l.trans({ en: "Details", ko: "자세히" })} <BsArrowRight />
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
              <p className="mt-6 text-foreground/45 text-xs leading-5">
                {l.trans({
                  en: "Rarely used internals that were removed or renamed are left out here; akan typecheck points at them.",
                  ko: "드물게 쓰이는 내부 API의 제거·이름 변경은 여기서 뺐습니다. akan typecheck이 위치를 짚어 줍니다.",
                })}
              </p>
            </Scroll.Slide>
            <DocsToc />
          </Scroll>
        </article>
      </main>
    );
  });
