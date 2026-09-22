import { usePage } from "@apps/akan/client";
import { Code, Divider, Docs, DocsToc, panelRecipe } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

const facets = [
  {
    name: "page/",
    side: "client",
    en: "Route modules only — nothing else compiles here. A library can hold one too, and an app that opts in with syncPageLibs serves its routes.",
    ko: "라우트 모듈만 둡니다. 다른 파일은 여기서 컴파일되지 않습니다. 라이브러리도 page 폴더를 가질 수 있고, syncPageLibs로 사용을 선언한 앱이 그 라우트를 제공합니다.",
  },
  {
    name: "lib/",
    side: "shared",
    en: "One folder per business concept: user, product, order, invoice, payment, notification. Each folder is a module, and a module's files stay inside it.",
    ko: "비즈니스 개념마다 폴더 하나입니다. user, product, order, invoice, payment, notification 같은 것들이며, 각 폴더가 모듈이고 모듈의 파일은 그 안에 머뭅니다.",
  },
  {
    name: "ui/",
    side: "client",
    en: "Renders JSX and is not bound to one model. PascalCase component files, camelCase sidecars. A tokens.css here is a library's one stylesheet, for colors that must not follow the theme.",
    ko: "JSX를 그리되 특정 모델에 매이지 않는 코드입니다. 컴포넌트 파일은 PascalCase, 보조 파일은 camelCase입니다. 여기 두는 tokens.css는 테마를 따라가면 안 되는 색을 위한 라이브러리의 유일한 스타일시트입니다.",
  },
  {
    name: "webkit/",
    side: "client",
    en: "Touches window, navigator, or Capacitor, or is a React hook. Files are use<Thing>.tsx — .tsx even when there is no JSX.",
    ko: "window, navigator, Capacitor를 건드리거나 React hook인 코드입니다. 파일명은 use<Thing>.tsx이며 JSX가 없어도 .tsx로 씁니다.",
  },
  {
    name: "common/",
    side: "shared",
    en: "Pure, isomorphic, zero-dependency. It may import only sibling common files and akanjs/base — which means it cannot import Err, so keep throwing code out of it. camelCase file, filename equal to its single export.",
    ko: "순수하고 양쪽에서 동작하며 의존성이 없는 코드입니다. 형제 common 파일과 akanjs/base만 import할 수 있어서 Err도 가져올 수 없으므로, 예외를 던지는 코드는 두지 않습니다. 파일명은 camelCase이며 유일한 export 이름과 같습니다.",
  },
  {
    name: "srvkit/",
    side: "server",
    en: "Touches node:*, Bun, process.env, a secret, or a server SDK. camelCase file, PascalCase class. Vendor clients and guards live here.",
    ko: "node:*, Bun, process.env, 비밀값, 서버 SDK를 건드리는 코드입니다. 파일명은 camelCase, 클래스는 PascalCase입니다. 벤더 클라이언트와 guard가 여기 있습니다.",
  },
  {
    name: "env/",
    side: "shared",
    en: "The runtime values, one file per environment, plus the type files that keep them honest. Server env files are gitignored; client env files are not.",
    ko: "런타임 값을 환경별 파일 하나씩 두고, 그 형태를 지켜 주는 type 파일을 함께 둡니다. server env 파일은 gitignore 대상이고 client env 파일은 아닙니다.",
  },
  {
    name: "plugin/",
    side: "shared",
    en: "Build- and CLI-time AkanPlugin declarations, named <name>.plugin.ts and registered in akan.config.ts.",
    ko: "빌드·CLI 시점에 동작하는 AkanPlugin 선언입니다. 파일명은 <name>.plugin.ts이고 akan.config.ts에 등록합니다.",
  },
  {
    name: "public/",
    side: "client",
    en: "Static files served as they are: logos, icons, fonts, downloadable PDFs. A library's public/ is mounted into every app that reaches it.",
    ko: "그대로 제공되는 정적 파일입니다. 로고, 아이콘, 폰트, 다운로드용 PDF 같은 것들입니다. 라이브러리의 public/은 그 라이브러리를 쓰는 모든 앱에 마운트됩니다.",
  },
  {
    name: "private/",
    side: "server",
    en: "Implementation-only code that must not become part of the public app or library API.",
    ko: "앱이나 라이브러리의 공개 API가 되면 안 되는 내부 구현 코드입니다.",
  },
  {
    name: "script/",
    side: "server",
    en: "Development scripts you run against a live Akan server. An app has this folder; a library does not, because a library is never booted.",
    ko: "실행 중인 Akan 서버를 대상으로 돌리는 개발 스크립트입니다. 앱에는 이 폴더가 있고 라이브러리에는 없습니다. 라이브러리는 부팅되지 않기 때문입니다.",
  },
];

export default page().render(() => {
  const { l } = usePage();
  return (
    <Scroll>
      <Scroll.Slide id="folder-rule" title={l.trans({ en: "Folder Rule", ko: "폴더 규칙" })}>
        <Docs.Title>{l.trans({ en: "Folder Rule", ko: "폴더 규칙" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Akan folders are designed around business ownership. When you add a new feature, first ask a simple question: is this a page customers visit, business data the app owns, shared UI, or server-only integration code?",
              ko: "Akan의 폴더는 비즈니스 소유 범위를 기준으로 나뉩니다. 새 기능을 만들 때는 먼저 간단히 물어보면 됩니다. 고객이 방문하는 페이지인가요, 앱이 소유하는 비즈니스 데이터인가요, 공유 UI인가요, 아니면 서버에서만 쓰는 연동 코드인가요?",
            })}
          </div>
          <div className="space-y-1">
            {[
              {
                title: l.trans({ en: "Find ownership", ko: "소유 범위 찾기" }),
                desc: l.trans({
                  en: "If only one product uses it, put it in that app. If several products share it, move it to a library.",
                  ko: "한 제품만 쓰면 해당 앱에 둡니다. 여러 제품이 함께 쓰면 라이브러리로 옮깁니다.",
                }),
              },
              {
                title: l.trans({ en: "Keep pages separate", ko: "페이지 분리" }),
                desc: l.trans({
                  en: "Screens such as /orders or /admin/users go under page/. Reusable components and logic go elsewhere.",
                  ko: "/orders, /admin/users 같은 화면은 page/ 아래에 둡니다. 재사용 컴포넌트와 로직은 다른 폴더에 둡니다.",
                }),
              },
              {
                title: l.trans({ en: "Model the business", ko: "비즈니스 모델링" }),
                desc: l.trans({
                  en: "Business nouns such as user, order, product, and invoice usually become folders under lib/.",
                  ko: "user, order, product, invoice 같은 비즈니스 명사는 보통 lib/ 아래 폴더가 됩니다.",
                }),
              },
            ].map(({ title, desc }) => (
              <div key={title} className={panelRecipe({ padding: "row" })}>
                <span className="font-bold text-foreground">{title}: </span>

                <span className="text-foreground/70 text-sm">{desc}</span>
              </div>
            ))}
          </div>
          <Docs.Mermaid
            title="Which folder does this file go in"
            highlightNodes={["role"]}
            chart={`flowchart TD
  owner{"Who uses it?"} -->|"one product"| app["apps/myapp/"]
  owner -->|"several products"| lib["libs/shared/"]
  app --> role{"What does the file do?"}
  lib --> role
  role -->|"a URL a user visits"| pageDir["page/"]
  role -->|"data the business stores"| modelDir["lib/model/"]
  role -->|"something the business does"| serviceDir["lib/_service/"]
  role -->|"reusable markup"| uiDir["ui/"]
  role -->|"browser API or React hook"| webkitDir["webkit/"]
  role -->|"node, Bun, or a secret"| srvkitDir["srvkit/"]
  role -->|"pure and isomorphic"| commonDir["common/"]`}
          />
          <Code.Snippet
            className="w-full"
            title="Commerce app example"
            language="bash"
            code={`apps/commerce/
├── page/
│   ├── store/          # customer storefront pages
│   └── admin/          # admin console pages
├── lib/
│   ├── product/        # product data and behavior
│   ├── order/          # order data and behavior
│   └── _payment/       # payment workflow
├── ui/
│   └── ProductCard.tsx
├── srvkit/
│   └── paymentGateway.ts
└── public/
    └── brand-logo.svg`}
          />
        </Docs.Description>
      </Scroll.Slide>
      <Divider />
      <Scroll.Slide id="workspace-rule" title={l.trans({ en: "Workspace Rule", ko: "워크스페이스 규칙" })}>
        <Docs.Title>{l.trans({ en: "Workspace Rule", ko: "워크스페이스 규칙" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "At the workspace root, choose the folder by how widely the code is used. A single product goes to apps/. Shared product code goes to libs/. Framework code goes to pkgs/.",
              ko: "워크스페이스 루트에서는 코드가 얼마나 넓게 사용되는지를 기준으로 폴더를 선택합니다. 하나의 제품 코드는 apps/에, 여러 제품이 공유하는 코드는 libs/에, 프레임워크 코드는 pkgs/에 둡니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="Workspace"
            language="bash"
            code={`.
├── apps/   # runnable applications
├── libs/   # shared product libraries
└── pkgs/   # Akan framework packages and tools`}
          />
          <div className="space-y-1">
            {[
              {
                title: "apps/",
                desc: l.trans({
                  en: "A business product that can run by itself. Examples: customer web, admin portal, brand site, or mobile-backed service.",
                  ko: "독립적으로 실행되는 비즈니스 제품입니다. 예: 커머스 플랫폼, SaaS 앱, ERP 시스템, 개인용 앱 등",
                }),
              },
              {
                title: "libs/",
                desc: l.trans({
                  en: "Reusable product code shared by several apps. Examples: user account, billing, file upload, social features, security, admin features, etc.",
                  ko: "여러 앱이 공유하는 제품 코드입니다. 예: 사용자 계정, 결제, 파일 업로드, 소셜, 채팅, 보안, 관리자 기능 등.",
                }),
              },
              {
                title: "pkgs/",
                desc: l.trans({
                  en: "Code with special purpose, used or published as npm packages. Examples: payment gateway, robot control code, blockchain integration code, etc.",
                  ko: "특수한 목적을 가진 코드로써, npm 패키지처럼 사용하거나 배포되는 폴더입니다. 예: 결제 연동 라이브러리, 로봇 특화 제어 코드, 블록체인 연동 코드 등",
                }),
              },
            ].map(({ title, desc }) => (
              <div key={title} className={panelRecipe({ padding: "row" })}>
                <span className="font-mono font-semibold text-primary">{title}: </span>

                <span className="text-foreground/70 text-sm">{desc}</span>
              </div>
            ))}
          </div>
          <Docs.Alert type="info">
            {l.trans({
              en: "Generated folders such as .akan/ and dist/ are build outputs. They help Akan run fast, but you normally do not edit them by hand.",
              ko: ".akan/과 dist/ 같은 생성 폴더는 빌드 결과물입니다. Akan이 빠르게 실행되도록 돕지만, 일반적으로 직접 수정하지 않습니다.",
            })}
          </Docs.Alert>
          <Docs.Alert>
            {l.trans({
              en: "Use pkgs/ only when the code should feel like a separate installable package. Ordinary one-app business logic belongs in apps/, and shared product logic usually belongs in libs/ first.",
              ko: "pkgs/는 코드가 별도 설치 패키지처럼 독립적으로 느껴질 때만 사용합니다. 한 앱의 일반 비즈니스 로직은 apps/에, 여러 제품이 공유하는 제품 로직은 보통 먼저 libs/에 둡니다.",
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />
      <Scroll.Slide
        id="app-lib-folder-rule"
        title={l.trans({ en: "App/Library Folder Rule", ko: "앱/라이브러리 폴더 규칙" })}
      >
        <Docs.Title>{l.trans({ en: "App/Library Folder Rule", ko: "앱/라이브러리 폴더 규칙" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "An app is where a product becomes visible to users. A library is where reusable business capabilities live. They look similar because both can have domain modules, UI, assets, and server helpers.",
              ko: "앱은 제품이 사용자에게 보이는 공간입니다. 라이브러리는 재사용 가능한 비즈니스 기능이 사는 공간입니다. 둘 다 도메인 모듈, UI, 자산, 서버 헬퍼를 가질 수 있기 때문에 구조가 비슷합니다.",
            })}
          </div>
          <div className="space-y-1">
            <Code.Snippet
              className="w-full"
              title="apps/myapp/"
              language="bash"
              code={`apps/myapp/
├── akan.config.ts
├── main.ts
├── page/
├── lib/
├── ui/
├── common/
├── webkit/
├── env/
├── plugin/
├── public/
├── srvkit/
├── private/
├── script/
├── client.ts
└── server.ts`}
            />
            <Code.Snippet
              className="w-full"
              title="libs/shared/"
              language="bash"
              code={`libs/shared/
├── akan.config.ts
├── lib/
├── page/
├── ui/
├── env/
├── public/
├── srvkit/
├── private/
├── common/
├── webkit/
├── plugin/
├── client.ts
├── server.ts
└── index.ts`}
            />
          </div>
          <div>
            {l.trans({
              en: "Each folder has an admission test rather than a theme, and the first column says which side of the client boundary its code runs on. A client folder ships to the browser, so nothing secret may reach one; a shared folder is read from both sides, so it must stay pure and environment-safe. A file that fails every test does not belong in the app or library root at all — akan sync refuses an unknown root folder by name.",
              ko: "각 폴더에는 분위기가 아니라 들어올 수 있는 조건이 있고, 첫 열은 그 코드가 클라이언트 경계의 어느 쪽에서 도는지를 말합니다. client 폴더는 브라우저까지 전송되므로 비밀값이 닿아서는 안 되고, shared 폴더는 양쪽에서 읽으므로 순수하고 환경에 안전해야 합니다. 어떤 조건에도 맞지 않는 파일은 애초에 앱·라이브러리 루트에 들어갈 수 없습니다. akan sync는 모르는 루트 폴더를 이름으로 짚어 거부합니다.",
            })}
          </div>
          <Docs.IntroTable
            type={l.trans({ en: "Folder", ko: "폴더" })}
            items={facets.map(({ name, side, en, ko }) => ({
              name,
              desc: (
                <>
                  <code>{side}</code>
                  {" — "}
                  {l.trans({ en, ko })}
                </>
              ),
            }))}
          />
          <Docs.Alert type="info">
            {l.trans({
              en: "When you are unsure, ask what the file does: screen goes to page/, reusable visual piece goes to ui/, saved business data goes to lib/<model>/, and private server integration goes to srvkit/ or lib/_<service>/.",
              ko: "헷갈릴 때는 파일이 하는 일을 물어보세요. 화면은 page/, 재사용 화면 조각은 ui/, 저장되는 비즈니스 데이터는 lib/<model>/, 비공개 서버 연동은 srvkit/ 또는 lib/_<service>/에 둡니다.",
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />
      <Scroll.Slide id="module-folder-rule" title={l.trans({ en: "Module Folder Rule", ko: "모듈 폴더 규칙" })}>
        <Docs.Title>{l.trans({ en: "Module Folder Rule", ko: "모듈 폴더 규칙" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Inside lib/, folder names describe the kind of business concept you are building. Use a normal folder for data your business owns, an underscore folder for a capability or integration, and __scalar for reusable value shapes.",
              ko: "lib/ 안에서는 폴더 이름이 만들고 있는 비즈니스 개념의 종류를 설명합니다. 비즈니스가 소유하는 데이터는 일반 폴더, 기능이나 외부 연동은 밑줄 폴더, 재사용 값 형태는 __scalar에 둡니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="lib/"
            language="bash"
            code={`lib/
├── user/             # database module
│   └── user.abstract.md
├── project/          # database module
├── _payment/         # service module
│   └── payment.abstract.md
├── _notification/    # service module
└── __scalar/
    ├── address/
    └── money/
        └── money.abstract.md`}
          />
          <div className="space-y-1">
            {[
              {
                title: "lib/<model>/",
                desc: l.trans({
                  en: "Use this for nouns your business owns and saves. Keep model.abstract.md here for business intent, domain rules, workflows, and agent notes.",
                  ko: "비즈니스가 소유하고 저장하는 명사에 사용합니다. business intent, domain rule, workflow, agent note를 위해 model.abstract.md를 함께 둡니다.",
                }),
              },
              {
                title: "lib/_<service>/",
                desc: l.trans({
                  en: "Use this for actions, workflows, or integrations. The folder keeps the underscore, but the abstract file drops it, such as lib/_payment/payment.abstract.md.",
                  ko: "행동, 워크플로우, 연동 기능에 사용합니다. 폴더에는 밑줄을 유지하지만 abstract 파일명은 lib/_payment/payment.abstract.md처럼 밑줄을 제외합니다.",
                }),
              },
              {
                title: "lib/__scalar/<type>/",
                desc: l.trans({
                  en: "Use this for reusable value shapes shared by models. Keep scalar.abstract.md here when validation meaning or reuse rules need explanation.",
                  ko: "여러 모델이 함께 쓰는 값 형태에 사용합니다. validation 의미나 재사용 규칙 설명이 필요하면 scalar.abstract.md를 함께 둡니다.",
                }),
              },
            ].map(({ title, desc }) => (
              <div key={title} className={panelRecipe({ padding: "row" })}>
                <span className="font-mono font-semibold text-primary">{title}: </span>

                <span className="text-foreground/70 text-sm">{desc}</span>
              </div>
            ))}
          </div>
          <Docs.Alert type="info">
            {l.trans({
              en: "A simple rule of thumb: if you can say 'this is a thing we store', use lib/<model>/. If you can say 'this is something we do', use lib/_<service>/.",
              ko: "간단한 기준은 이렇습니다. '저장하는 대상'이라면 lib/<model>/을, '수행하는 기능'이라면 lib/_<service>/를 사용하세요.",
            })}
          </Docs.Alert>
          <Docs.Alert>
            {l.trans({
              en: "For external integrations, keep raw vendor clients in srvkit/ and business-facing workflows in lib/_<service>/. For example, paymentGateway.ts calls the vendor API, while lib/_payment creates a payment for an order.",
              ko: "외부 연동에서는 벤더 API를 직접 다루는 낮은 수준의 클라이언트는 srvkit/에 두고, 앱이 이해하는 비즈니스 워크플로우는 lib/_<service>/에 둡니다. 예를 들어 paymentGateway.ts는 결제사 API를 호출하고, lib/_payment는 주문 결제를 생성합니다.",
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />
      <Scroll.Slide id="growth-path" title={l.trans({ en: "Growth Path", ko: "성장에 따른 이동" })}>
        <Docs.Title>{l.trans({ en: "Growth Path", ko: "성장에 따른 이동" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Folder choice can change as the business grows. Start close to the product, then move code outward only when sharing or packaging becomes real.",
              ko: "비즈니스가 성장하면 코드의 위치도 바뀔 수 있습니다. 처음에는 제품 가까이에 두고, 실제로 공유나 패키징이 필요해질 때 바깥으로 옮기면 됩니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="Code movement"
            language="bash"
            code={`apps/commerce/lib/order/
  # used only by commerce

libs/order/
  # reused by commerce, admin, and partner apps

pkgs/order-sdk/
  # installable or publishable as a standalone package`}
          />
          <div className="space-y-1">
            {[
              {
                title: "apps/",
                desc: l.trans({
                  en: "Start here when the feature belongs to one product. This keeps early business code easy to find.",
                  ko: "기능이 하나의 제품에만 속한다면 여기서 시작합니다. 초기 비즈니스 코드를 찾기 쉽습니다.",
                }),
              },
              {
                title: "libs/",
                desc: l.trans({
                  en: "Move here when two or more apps need the same business model, UI, or service flow.",
                  ko: "두 개 이상의 앱이 같은 비즈니스 모델, UI, 서비스 흐름을 필요로 할 때 옮깁니다.",
                }),
              },
              {
                title: "pkgs/",
                desc: l.trans({
                  en: "Move here only when the code should stand alone with its own package boundary.",
                  ko: "자체 패키지 경계를 가진 독립 코드가 되어야 할 때만 옮깁니다.",
                }),
              },
            ].map(({ title, desc }) => (
              <div key={title} className={panelRecipe({ padding: "row" })}>
                <span className="font-mono font-semibold text-primary">{title}: </span>

                <span className="text-foreground/70 text-sm">{desc}</span>
              </div>
            ))}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />
      <DocsToc />
    </Scroll>
  );
});
