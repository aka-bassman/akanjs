import { usePage } from "@apps/akan/client";
import type { PageConfig } from "akanjs/client";
import { Link } from "akanjs/ui";
import { BsArrowRight, BsCheckCircle, BsCloud, BsCodeSlash, BsTerminal } from "react-icons/bs";

const highlightCode = (code: string) => {
  const tokenPattern =
    /("(?:[^"\\]|\\.)*"|\b(?:export|class|extends|const|type|interface)\b|\b(?:via|field|String|Number|Boolean)\b|\bbunx\b|create-akan-workspace@latest)/g;
  return code.split(tokenPattern).map((token, index) => {
    if (!token) return null;
    if (/^"/.test(token)) {
      return (
        <span key={`${token}-${index}`} className="text-emerald-300">
          {token}
        </span>
      );
    }
    if (/^(export|class|extends|const|type|interface)$/.test(token)) {
      return (
        <span key={`${token}-${index}`} className="text-pink-300">
          {token}
        </span>
      );
    }
    if (/^(via|field|String|Number|Boolean)$/.test(token)) {
      return (
        <span key={`${token}-${index}`} className="text-sky-300">
          {token}
        </span>
      );
    }
    if (token === "bunx") {
      return (
        <span key={`${token}-${index}`} className="text-violet-300">
          {token}
        </span>
      );
    }
    if (token === "create-akan-workspace@latest") {
      return (
        <span key={`${token}-${index}`} className="text-sky-300">
          {token}
        </span>
      );
    }
    return token;
  });
};

const RawCode = ({ code, prompt, className = "" }: { code: string; prompt?: string; className?: string }) => {
  return (
    <pre
      className={`w-full overflow-x-auto rounded-lg bg-slate-800 p-4 text-left font-mono text-sm ${className}`}
      style={{ overflowWrap: "break-word", whiteSpace: "pre-wrap" }}
    >
      <code className="block text-slate-100">
        {prompt && (
          <span className="select-none text-slate-400" aria-hidden="true">
            {prompt}{" "}
          </span>
        )}
        {highlightCode(code)}
      </code>
    </pre>
  );
};

export default function Page() {
  const { l } = usePage();
  const features = [
    {
      icon: <BsTerminal className="size-7" />,
      iconClassName: "text-primary",
      title: l.trans({ en: "Config Hell Ends", ko: "config 파일 지옥은 그만" }),
      description: l.trans({
        en: "Configure everything in akan.config.ts. Even when you configure nothing, the defaults keep your product moving.",
        ko: "akan.config.ts 하나로 모든 것을 설정합니다. 하물며 설정하지 않아도 잘 굴러갑니다.",
      }),
    },
    {
      icon: <BsCloud className="size-7" />,
      iconClassName: "text-secondary",
      title: l.trans({ en: "Monorepo Shared Code", ko: "모노리포 공통코드 관리" }),
      description: l.trans({
        en: "Use verified code everywhere. Share domain logic without reinventing the wheel for every surface.",
        ko: "검증된 코드를 모든 곳에 사용하세요. 바퀴를 재발명하지 않아도 됩니다.",
      }),
    },
    {
      icon: <BsCodeSlash className="size-7" />,
      iconClassName: "text-accent",
      title: l.trans({ en: "Strict Rules, Unified Style", ko: "엄격한 규칙, 통일된 스타일" }),
      description: l.trans({
        en: "File paths, names, structures, and declarations stay consistent. Code reads like you wrote it, no matter who did.",
        ko: "파일위치, 파일명, 코드구조, 선언 방식까지 통일. 누가 짜도 내가 짠 것처럼 읽힙니다.",
      }),
    },
    {
      icon: <BsCheckCircle className="size-7" />,
      iconClassName: "text-success",
      title: l.trans({ en: "Less Code, Better Review", ko: "적은 코드, 즐거운 리뷰" }),
      description: l.trans({
        en: "Fewer lines mean fewer tokens, clearer intent, and updates that are easier to read, review, and ship.",
        ko: "적은 코드량은 적은 토큰소모, 읽기 쉬운 코드, 리뷰하기 즐거운 업데이트로 이어집니다.",
      }),
    },
  ];
  const platformSurfaces = [
    l.trans({ en: "SEO-ready server-side rendering", ko: "SEO 최적화 서버사이드 렌더링" }),
    l.trans({ en: "iOS / Android client rendering", ko: "iOS / Android 클라이언트 렌더링" }),
    l.trans({ en: "Bun HTTP / WebSocket server", ko: "Bun HTTP / WebSocket 서버" }),
    l.trans({ en: "SQLite first, Postgres / Redis ready", ko: "SQLite 우선, Postgres / Redis 확장" }),
    l.trans({ en: "Schema validation and secure middleware", ko: "스키마 검증과 보안 미들웨어" }),
    l.trans({ en: "Type-safe from DB to UI", ko: "DB부터 UI까지 타입 안전" }),
    l.trans({ en: "Built-in internationalization", ko: "다국어 지원 기본 탑재" }),
    l.trans({ en: "Official plugin blocks", ko: "공식 플러그인 기능 블록" }),
  ];
  const automationItems = [
    {
      title: l.trans({ en: "Schema becomes DB documentation", ko: "스키마를 짜면 DB 테이블 정의서가 나옵니다" }),
      description: l.trans({
        en: "Business schema is not only runtime code. It becomes documentation your team can inspect together.",
        ko: "비즈니스 스키마는 실행 코드에 그치지 않습니다. 팀이 함께 확인할 수 있는 정의서가 됩니다.",
      }),
    },
    {
      title: l.trans({ en: "Endpoint becomes live API docs", ko: "엔드포인트를 짜면 API 정의서가 실시간으로" }),
      description: l.trans({
        en: "API contracts stay close to implementation, and the generated surface can be tested as you build.",
        ko: "API 계약은 구현 가까이에 머물고, 생성된 표면은 개발 중 바로 테스트할 수 있습니다.",
      }),
    },
    {
      title: l.trans({ en: "Query condition expands into reads", ko: "쿼리조건 하나로 조회 기능 자동생성" }),
      description: l.trans({
        en: "One query condition can power list, detail, and statistics reads without repeating the same plumbing.",
        ko: "쿼리조건 하나로 리스트, 단일조회, 통계조회가 이어집니다. 반복작업은 이제 그만.",
      }),
    },
    {
      title: l.trans({ en: "Slice removes spaghetti state", ko: "슬라이스 하나로 스파게티 상태관리 제거" }),
      description: l.trans({
        en: "Declare a slice once and get list loading, pagination, statistics, state, and loading behavior together.",
        ko: "슬라이스 하나로 리스트 조회, 페이지네이션, 통계조회, 상태관리, 로딩처리가 함께 생성됩니다.",
      }),
    },
  ];
  const procedureItems = [
    {
      title: l.trans({ en: "Cross-Platform Development", ko: "크로스 플랫폼 개발" }),
      description: l.trans({
        en: "One page can become SEO-ready web and app-ready client screens with native-feeling transitions.",
        ko: "하나의 페이지가 SEO 가능한 웹과 앱에 어울리는 클라이언트 화면으로 함께 배포됩니다.",
      }),
      src: "/cross_platform_dev_web.mp4",
    },
    {
      title: l.trans({ en: "Database & API Integration", ko: "데이터베이스 & API 통합" }),
      description: l.trans({
        en: "Schema changes flow into database, validation, API contracts, and generated clients without hand wiring.",
        ko: "스키마 변경이 데이터베이스, 검증, API 계약, 생성된 클라이언트까지 수작업 연결 없이 이어집니다.",
      }),
      src: "/database_api_en.mp4",
    },
    {
      title: l.trans({ en: "Full-Stack Type Safety", ko: "전체 스택 타입 안전" }),
      description: l.trans({
        en: "Database schema changes automatically influence server, API, state management, and UI types.",
        ko: "데이터베이스 스키마 설정이 서버, API, 상태관리, UI 타입까지 타입안전하게 반영됩니다.",
      }),
      src: "/fullstack_type_en.mp4",
    },
    {
      title: l.trans({ en: "Domain-Driven State Management", ko: "도메인 기반 상태 관리" }),
      description: l.trans({
        en: "State, loading, pagination, and statistics follow the domain so UI code stays predictable.",
        ko: "상태, 로딩, 페이지네이션, 통계가 도메인을 따라가므로 UI 코드가 예측 가능해집니다.",
      }),
      src: "/domain_based.mp4",
    },
    {
      title: l.trans({ en: "Agent-Ready Code Generation", ko: "에이전트 친화적 코드 생성" }),
      description: l.trans({
        en: "Official patterns and plugins give agents predictable blocks for upload, login, admin, chat, boards, and alerts.",
        ko: "업로드, 로그인, 관리자, 채팅, 게시판, 알림 같은 검증된 기능블록을 예측 가능한 구조로 조립합니다.",
      }),
      src: "/create_scalar.mp4",
    },
  ];
  const transitionItems = [
    {
      title: "bottomup",
      description: l.trans({
        en: "Open focused flows from the bottom without leaving the CSR client.",
        ko: "CSR 클라이언트를 벗어나지 않고 하단에서 집중 흐름을 열 수 있습니다.",
      }),
      src: l.trans({
        en: "/csr/bottomup_en.mp4",
        ko: "/csr/bottomup_ko.mp4",
      }),
    },
    {
      title: "fade",
      description: l.trans({
        en: "Change context calmly when the next screen is not a deeper page.",
        ko: "다음 화면이 더 깊은 계층이 아닐 때 차분하게 맥락을 전환합니다.",
      }),
      src: l.trans({
        en: "/csr/fade_en.mp4",
        ko: "/csr/fade_ko.mp4",
      }),
    },
    {
      title: "scale",
      description: l.trans({
        en: "Guide attention into the next page with a light zoom transition.",
        ko: "가벼운 확대 전환으로 다음 페이지에 시선을 자연스럽게 모읍니다.",
      }),
      src: l.trans({
        en: "/csr/scale_en.mp4",
        ko: "/csr/scale_ko.mp4",
      }),
    },
    {
      title: "stack",
      description: l.trans({
        en: "Push detail screens over lists with layered client navigation.",
        ko: "목록 위로 상세 화면을 쌓아 올리는 클라이언트 내비게이션을 만듭니다.",
      }),
      src: l.trans({
        en: "/csr/stack_en.mp4",
        ko: "/csr/stack_ko.mp4",
      }),
    },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-base-100 text-base-content">
      <div className="absolute inset-x-0 top-20 h-px bg-linear-to-r from-transparent via-primary/60 to-transparent" />

      <section className="relative mx-auto grid min-h-screen w-full max-w-7xl items-center gap-10 px-6 pt-32 pb-20 lg:grid-cols-[1.02fr_0.98fr] lg:px-8">
        <div>
          <div className="badge mb-6 border-primary/20 bg-primary/10 px-4 py-3 text-primary">
            <BsCheckCircle />
            {l.trans({ en: "One business, every platform", ko: "하나의 비즈니스, 모든 플랫폼" })}
          </div>
          <h1 className="max-w-4xl font-black text-5xl text-base-content tracking-tight sm:text-5xl lg:text-6xl">
            {l.trans({
              en: "A convention-over-configuration framework",
              ko: "에이전틱 풀스택 TypeScript를 위한",
            })}
            <br />
            <span className="text-primary">
              {l.trans({
                en: "for agentic full-stack TypeScript.",
                ko: "컨벤션 우선 프레임워크.",
              })}
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-base-content/70 text-lg leading-8">
            {l.trans({
              en: "Web, app, server, fragmented frameworks, integrations, and duplicated declarations wear teams down. Akan lets one line of business code describe web, iOS, Android, server, and database surfaces together.",
              ko: "웹, 앱, 서버, 파편화된 프레임워크들, 연동과 중복 선언은 팀을 지치게 합니다. Akan은 한 줄의 비즈니스 코드로 웹, iOS, Android, 서버, DB 표면을 함께 표현합니다.",
            })}
          </p>
          <p className="mt-3 max-w-2xl text-base text-base-content/60 leading-7">
            {l.trans({
              en: "Configure less, repeat less, and keep business intent readable from database to UI.",
              ko: "설정은 줄이고, 반복은 없애고, 데이터베이스부터 UI까지 비즈니스 의도를 읽기 쉽게 유지하세요.",
            })}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {["akan.config.ts", "Web", "iOS", "Android", "Server", "DB", "Type-safe", "Plugins"].map((surface) => (
              <span
                key={surface}
                className="badge badge-lg border-base-content/10 bg-base-content/10 text-base-content"
              >
                {surface}
              </span>
            ))}
          </div>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link href="/docs/intro/quickstart">
              <button className="btn border-none bg-primary text-base-100 hover:bg-primary/80">
                {l.trans({ en: "Get Started", ko: "시작하기" })} <BsArrowRight className="ml-2" />
              </button>
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 rotate-3 rounded-4xl bg-primary/20 blur-2xl" />
          <div className="relative overflow-hidden rounded-4xl border border-base-content/10 bg-base-content/6 p-5 shadow-2xl backdrop-blur">
            <div className="mb-5 flex items-center justify-between rounded-2xl border border-base-content/10 bg-base-100/70 px-4 py-3">
              <div>
                <p className="text-base-content/40 text-xs tracking-[0.24em]">Akan.js</p>
                <p className="font-semibold text-base-content text-lg">
                  {l.trans({ en: "Business code becomes the whole product", ko: "비즈니스 코드가 제품 전체가 됩니다" })}
                </p>
              </div>
              <div className="rounded-xl bg-primary/10 px-3 py-2 font-medium text-primary text-sm">1 → All</div>
            </div>
            <RawCode
              code={`export class ProductInput extends via((field) => ({
  name: field(String),
})) {}`}
            />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                {
                  title: l.trans({ en: "Web / App", ko: "웹 / 앱" }),
                  description: l.trans({
                    en: "SEO web and native-feeling client transitions.",
                    ko: "SEO 가능한 웹과 앱다운 페이지 전환.",
                  }),
                },
                {
                  title: l.trans({ en: "Server / Realtime", ko: "서버 / 실시간" }),
                  description: l.trans({
                    en: "Bun-powered HTTP and WebSocket surfaces.",
                    ko: "Bun 기반 HTTP와 WebSocket 표면.",
                  }),
                },
                {
                  title: l.trans({ en: "Database / Validation", ko: "DB / 검증" }),
                  description: l.trans({
                    en: "SQLite first, scalable, and schema validated.",
                    ko: "SQLite 우선, 확장 가능, 스키마 검증.",
                  }),
                },
                {
                  title: l.trans({ en: "Docs / Plugins", ko: "문서 / 플러그인" }),
                  description: l.trans({
                    en: "Live docs and official feature blocks.",
                    ko: "실시간 문서와 공식 기능 블록.",
                  }),
                },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-base-content/10 bg-base-100/80 p-4">
                  <p className="font-bold text-base-content">{item.title}</p>
                  <p className="mt-1 text-base-content/60 text-sm leading-6">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto w-full max-w-7xl px-6 pb-20 lg:px-8">
        <div className="mb-10 text-center">
          <div className="badge mb-4 border-base-content/10 bg-base-content/10 text-base-content">
            {l.trans({ en: "Developer Experience", ko: "개발자 경험" })}
          </div>
          <h2 className="font-black text-3xl tracking-tight md:text-5xl">
            {l.trans({ en: "Designed to make developers happier", ko: "개발자의 행복에 최적화하여 설계되었습니다" })}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base-content/60 leading-7">
            {l.trans({
              en: "Akan keeps decisions consistent so teams can spend more energy on business code and less on framework assembly.",
              ko: "Akan은 결정들을 일관되게 유지해 팀이 프레임워크 조립보다 비즈니스 코드에 더 집중하게 합니다.",
            })}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-3xl border border-base-content/10 bg-base-content/4 p-6 backdrop-blur"
            >
              <div
                className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-base-100/80 ${feature.iconClassName}`}
              >
                {feature.icon}
              </div>
              <h3 className="font-bold text-base-content text-lg">{feature.title}</h3>
              <p className="mt-2 text-base-content/60 text-sm leading-6">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative mx-auto w-full max-w-7xl px-6 py-20 lg:px-8">
        <div className="mb-8 text-center md:mb-12">
          <div className="badge mb-4 border-primary/20 bg-primary/10 text-primary">
            {l.trans({ en: "Generated From Intent", ko: "의도에서 자동 생성" })}
          </div>
          <h2 className="font-black text-3xl tracking-tight md:text-5xl">
            {l.trans({ en: "Stop repeating the same plumbing", ko: "반복작업은 이제 그만" })}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base-content/60 leading-7">
            {l.trans({
              en: "Akan turns business declarations into docs, APIs, queries, state, and loading behavior so repetitive work disappears.",
              ko: "Akan은 비즈니스 선언을 문서, API, 쿼리, 상태, 로딩 처리로 확장해 반복작업을 줄입니다.",
            })}
          </p>
        </div>
        <div className="relative overflow-hidden rounded-4xl border border-primary/20 bg-base-content/5 p-5 shadow-2xl backdrop-blur md:p-8">
          <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/70 to-transparent" />
          <div className="grid gap-4 md:grid-cols-2">
            {automationItems.map((item, index) => (
              <div key={item.title} className="rounded-3xl border border-base-content/10 bg-base-100/80 p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 font-black text-primary">
                  {index + 1}
                </div>
                <h3 className="font-bold text-lg">{item.title}</h3>
                <p className="mt-2 text-base-content/60 text-sm leading-6">{item.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 grid items-center gap-6 rounded-3xl border border-base-content/10 bg-base-100/80 p-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <h3 className="font-bold text-2xl text-primary">
                {l.trans({ en: "One declaration, many generated surfaces", ko: "하나의 선언, 여러 생성 표면" })}
              </h3>
              <p className="mt-3 text-base-content/60 text-sm leading-6">
                {l.trans({
                  en: "A single business field can drive schema, validation, API contracts, fetch types, state, and UI contracts without scattering intent across the stack.",
                  ko: "하나의 비즈니스 필드가 스키마, 검증, API 계약, fetch 타입, 상태, UI 계약으로 이어져 의도가 스택 전반에 흩어지지 않습니다.",
                })}
              </p>
            </div>
            <RawCode
              code={`export class ProductInput extends via((field) => ({
  name: field(String),
})) {}`}
            />
          </div>
        </div>
      </section>

      <section className="relative mx-auto w-full max-w-7xl px-6 py-20 lg:px-8">
        <div className="mb-8 rounded-4xl border border-base-content/10 bg-base-content/4 p-6 backdrop-blur md:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <div className="badge mb-4 border-primary/20 bg-primary/10 text-primary">
                {l.trans({ en: "Platform Surfaces", ko: "플랫폼 표면" })}
              </div>
              <h2 className="font-black text-3xl tracking-tight md:text-5xl">
                {l.trans({
                  en: "Everything a business app needs, connected",
                  ko: "비즈니스 앱에 필요한 모든 것을 연결합니다",
                })}
              </h2>
              <p className="mt-4 text-base-content/60 leading-7">
                {l.trans({
                  en: "Akan supports web, iOS, Android, server, database, validation, internationalization, and official plugins as one coherent stack.",
                  ko: "Akan은 웹, iOS, Android, 서버, 데이터베이스, 검증, 다국어, 공식 플러그인을 하나의 일관된 스택으로 지원합니다.",
                })}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {platformSurfaces.map((surface) => (
                <div key={surface} className="rounded-2xl border border-base-content/10 bg-base-100/80 px-4 py-3">
                  <p className="font-medium text-base-content text-sm">{surface}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-10 rounded-4xl border border-base-content/10 bg-base-content/4 p-5 backdrop-blur md:p-8">
          <div className="mb-6 max-w-3xl">
            <div className="badge mb-4 border-primary/20 bg-primary/10 text-primary">
              {l.trans({ en: "Client Rendering Detail", ko: "클라이언트 렌더링 디테일" })}
            </div>
            <h3 className="font-black text-2xl tracking-tight md:text-4xl">
              {l.trans({ en: "Same page, smoother navigation", ko: "같은 페이지, 더 부드러운 내비게이션" })}
            </h3>
            <p className="mt-3 text-base-content/60 leading-7">
              {l.trans({
                en: "When a page is opened as a CSR client, pageConfig can add transition presets for list-detail flows, overlays, and context changes. It is one detail in the web/app surface, not a separate UI rewrite.",
                ko: "페이지가 CSR 클라이언트로 열릴 때 pageConfig로 목록-상세 흐름, 오버레이, 맥락 전환에 맞는 transition preset을 더할 수 있습니다. 별도 UI 재작성 없이 web/app 표면에 얹히는 디테일입니다.",
              })}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {transitionItems.map((item) => (
              <div
                key={item.title}
                className="overflow-hidden rounded-3xl border border-base-content/10 bg-base-100/80"
              >
                <div className="p-4">
                  <div className="font-bold font-mono text-primary">{item.title}</div>
                  <p className="mt-2 text-base-content/60 text-sm leading-6">{item.description}</p>
                </div>
                <div className="border-base-content/10 border-t bg-base-content/5 p-3">
                  <video
                    src={item.src}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="mx-auto aspect-9/16 max-h-[460px] w-full rounded-2xl object-contain"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto mb-10 max-w-3xl text-center">
          <RawCode code="bunx create-akan-workspace@latest" prompt="$" className="mx-auto mb-8 max-w-full md:w-fit" />
          <h2 className="font-black text-3xl tracking-tight md:text-5xl">
            {l.trans({ en: "See the business, not the system", ko: "시스템이 아니라 비즈니스를 보세요" })}
          </h2>
          <p className="mt-4 text-base-content/60 leading-7">
            {l.trans({
              en: "These demos show how one convention-driven workspace carries business intent through multiple surfaces.",
              ko: "아래 데모는 하나의 컨벤션 기반 워크스페이스가 비즈니스 의도를 여러 표면으로 이어가는 방식을 보여줍니다.",
            })}
          </p>
          <div className="mt-8">
            <Link href="/docs/intro/quickstart">
              <button className="btn btn-primary btn-lg">
                {l.trans({ en: "Get Started", ko: "시작하기" })} <BsArrowRight className="ml-2" />
              </button>
            </Link>
          </div>
        </div>

        <div className="rounded-4xl border border-base-content/10 bg-base-content/4 p-5 backdrop-blur md:p-8">
          <h2 className="mb-8 text-center font-black text-3xl tracking-tight md:mb-12 md:text-5xl">
            {l.trans({
              en: "How Conventions Expand Your Business Definition",
              ko: "컨벤션이 비즈니스 정의를 확장하는 방식",
            })}
          </h2>
          <div className="space-y-6 md:space-y-8">
            {procedureItems.map((item, index) => (
              <div
                key={item.title}
                className="overflow-hidden rounded-3xl border border-base-content/10 bg-base-100/80 shadow-xl"
              >
                <div className="grid items-center gap-6 p-5 md:p-6 lg:grid-cols-[0.8fr_1.2fr]">
                  <div className={index % 2 === 1 ? "lg:order-2" : ""}>
                    <div className="badge mb-4 border-primary/20 bg-primary/10 text-primary">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <h3 className="font-bold text-2xl">{item.title}</h3>
                    <p className="mt-3 text-base-content/65 text-sm leading-6">{item.description}</p>
                  </div>
                  <div className="overflow-hidden rounded-2xl border border-base-content/10 bg-base-content/5">
                    <video src={item.src} autoPlay muted loop playsInline className="size-full object-cover" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative mx-auto w-full max-w-7xl px-6 py-20 lg:px-8">
        <div className="overflow-hidden rounded-4xl border border-base-content/10 bg-base-content/6 p-8 text-center shadow-2xl backdrop-blur md:p-12">
          <div className="badge mb-5 border-primary/20 bg-primary/10 text-primary">
            {l.trans({ en: "Built for developer happiness", ko: "개발자의 행복을 위해 설계" })}
          </div>
          <h2 className="font-black text-3xl tracking-tight md:text-5xl">
            {l.trans({
              en: "Run the business with one quarter of the code.",
              ko: "기존 대비 1/4의 코드로 비즈니스를 운영하세요.",
            })}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base-content/65 leading-7">
            {l.trans({
              en: "Less code means fewer tokens, clearer intent, easier reviews, and calmer updates. Akan is optimized for the happiness of developers who ship real products.",
              ko: "적은 코드량은 적은 토큰소모, 선명한 의도, 쉬운 리뷰, 안정적인 업데이트로 이어집니다. Akan은 실제 제품을 출시하는 개발자의 행복에 최적화되어 있습니다.",
            })}
          </p>
          <div className="mt-8">
            <Link href="/docs/intro/quickstart">
              <button className="btn btn-primary btn-lg">
                {l.trans({ en: "Get Started", ko: "시작하기" })} <BsArrowRight className="ml-2" />
              </button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export const pageConfig: PageConfig = {
  safeArea: true,
  topInset: true,
  bottomInset: true,
};
