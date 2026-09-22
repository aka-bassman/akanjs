import { usePage } from "@apps/akan/client";
import { Code, Divider, Docs, DocsToc, panelRecipe } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";
import { Link } from "akanjs/ui";

const configKeys = [
  {
    key: "routes",
    type: "AkanRouteConfig[]",
    default: "—",
    en: "Public domains for the app, optionally split per client with basePath.",
    ko: "앱이 사용할 공개 도메인이며, basePath로 클라이언트를 나눌 수 있습니다.",
  },
  {
    key: "api",
    type: "{ prefix, websocketPrefix }",
    default: "/api, /ws",
    en: "Where signal endpoints and the websocket upgrade are mounted. Baked into every client bundle.",
    ko: "signal 엔드포인트와 웹소켓 업그레이드가 마운트될 경로입니다. 모든 클라이언트 번들에 구워집니다.",
  },
  {
    key: "web",
    type: "boolean | { csr: boolean }",
    default: "true",
    en: "Which web surfaces the build produces and the app mounts at boot.",
    ko: "빌드가 만들고 앱이 부팅 때 마운트하는 웹 표면을 정합니다.",
  },
  {
    key: "i18n",
    type: "{ defaultLocale, locales }",
    default: 'en, ["en", "ko"]',
    en: "The locale segment every route sits under. defaultLocale must be one of locales.",
    ko: "모든 라우트가 놓이는 locale 세그먼트입니다. defaultLocale은 locales 안에 있어야 합니다.",
  },
  {
    key: "mobile",
    type: "AkanMobileConfig",
    default: "—",
    en: "Native app identity plus one entry per mobile package that Android and iOS commands read.",
    ko: "Android·iOS 명령이 읽는 네이티브 앱 정보와 모바일 패키지별 target 정의입니다.",
  },
  {
    key: "images",
    type: "AkanImageConfig",
    default: "webp, quality 75",
    en: "Allow-list, sizes, and limits for the image optimizer. A remote host not listed is refused.",
    ko: "이미지 최적화의 허용 목록·크기·제한입니다. 목록에 없는 원격 호스트는 거부됩니다.",
  },
  {
    key: "publicEnv",
    type: "string[]",
    default: "[]",
    en: "Extra process.env names the browser build may inline, beyond the built-in AKAN_PUBLIC_* pattern.",
    ko: "기본 AKAN_PUBLIC_* 패턴 외에 브라우저 빌드가 인라인해도 되는 process.env 이름입니다.",
  },
  {
    key: "secrets",
    type: "string[]",
    default: "[]",
    en: "Globs for files that cannot live inside env.server.*.ts. Shipped by upload-env and git-ignored.",
    ko: "env.server.*.ts 안에 담을 수 없는 파일의 glob입니다. upload-env가 함께 보내고 git-ignore됩니다.",
  },
  {
    key: "assets",
    type: "{ pruneFonts, keepFonts }",
    default: "true, []",
    en: "How akan build trims the public/ copy it ships. Source trees are never touched.",
    ko: "akan build가 배포용 public/ 복사본을 어떻게 줄일지 정합니다. 원본 트리는 건드리지 않습니다.",
  },
  {
    key: "syncPageLibs",
    type: "string[] | boolean",
    default: "false",
    en: "Which library page folders akan sync mounts into this app under page/(libs).",
    ko: "akan sync가 이 앱의 page/(libs) 아래로 마운트할 라이브러리 page 폴더를 정합니다.",
  },
  {
    key: "plugins",
    type: "AkanPlugin[]",
    default: "[]",
    en: "Akan plugins this app contributes. Plugins carry functions, so they never reach the serialized config.",
    ko: "이 앱이 등록하는 Akan 플러그인입니다. 함수를 담고 있어 직렬화된 config에는 들어가지 않습니다.",
  },
  {
    key: "docker",
    type: "string | DockerImageConfig",
    default: "oven/bun:1-slim",
    en: "A whole Dockerfile as a string, or the parts akan build assembles one from.",
    ko: "Dockerfile 전체 문자열이거나, akan build가 Dockerfile을 조립할 재료입니다.",
  },
  {
    key: "defaultDatabaseMode",
    type: "single | multiple | cluster",
    default: "single",
    en: "Database mode for commands that receive no AKAN_DATABASE_MODE. It also decides which driver packages the production package.json declares.",
    ko: "AKAN_DATABASE_MODE를 받지 못한 명령이 쓸 데이터베이스 모드입니다. 프로덕션 package.json에 어떤 드라이버 패키지를 넣을지도 이 값이 정합니다.",
  },
  {
    key: "externalLibs",
    type: "string[]",
    default: "[]",
    en: "Packages kept as production runtime dependencies instead of being bundled. Libraries contribute to this list too.",
    ko: "번들에 넣지 않고 프로덕션 런타임 의존성으로 유지할 패키지입니다. 라이브러리도 이 목록에 값을 더합니다.",
  },
  {
    key: "barrelImports",
    type: "string[]",
    default: "akanjs + workspace",
    en: "Barrel paths Akan flattens while scanning and bundling. Every akanjs facet and every app/lib facet is already in the list.",
    ko: "스캔과 번들링에서 Akan이 펼치는 barrel 경로입니다. akanjs facet과 모든 앱·라이브러리 facet은 이미 들어 있습니다.",
  },
  {
    key: "optimizeImports",
    type: "string[]",
    default: "built-in list",
    en: "Extra packages whose imports the client build rewrites to the exact source file. About thirty icon and UI packages ship in the default list.",
    ko: "클라이언트 빌드가 정확한 원본 파일 import로 바꿔 줄 추가 패키지입니다. 아이콘·UI 패키지 서른 개 정도가 기본으로 들어 있습니다.",
  },
];

const mobileFields = [
  {
    key: "appName",
    type: "string",
    default: "the app name",
    en: "Display name of the native app. At the mobile root it is the default for every target; inside a target it overrides that package's display name.",
    ko: "네이티브 앱 표시 이름입니다. mobile 루트에서는 모든 target의 기본값이고, target 안에서는 그 패키지의 표시 이름을 덮어씁니다.",
  },
  {
    key: "appId",
    type: "string",
    default: "com.<repo>.<app>",
    en: "Native package identifier. Android uses it as applicationId, iOS as bundle id, and Firebase app registration must use the same value.",
    ko: "네이티브 패키지 식별자입니다. Android는 applicationId로, iOS는 bundle id로 쓰며, Firebase 앱 등록도 같은 값을 써야 합니다.",
  },
  {
    key: "version",
    type: "string",
    default: "0.0.1",
    en: "User-facing app version, written to Android versionName and iOS MARKETING_VERSION.",
    ko: "사용자에게 보이는 앱 버전이며, Android versionName과 iOS MARKETING_VERSION에 기록됩니다.",
  },
  {
    key: "buildNum",
    type: "number",
    default: "1",
    en: "Store build number, written to Android versionCode and iOS CURRENT_PROJECT_VERSION. Raise it for every store release.",
    ko: "스토어 제출 빌드 번호이며, Android versionCode와 iOS CURRENT_PROJECT_VERSION에 기록됩니다. 출시할 때마다 올립니다.",
  },
  {
    key: "targets",
    type: "Record<string, Target>",
    default: "one target",
    en: "Named mobile packages built from the same Akan app. With no targets declared, Akan synthesizes one — named after a basePath matching the app name, otherwise default.",
    ko: "같은 Akan 앱에서 만드는 이름 있는 모바일 패키지입니다. 선언하지 않으면 Akan이 하나를 만듭니다. 앱 이름과 같은 basePath가 있으면 그 이름, 없으면 default입니다.",
  },
  {
    key: "targets.*.basePath",
    type: "string",
    default: "—",
    en: "The client this native package opens. It must name a basePath declared in routes; an unknown one fails the config load.",
    ko: "이 네이티브 패키지가 여는 클라이언트입니다. routes에 선언된 basePath여야 하며, 모르는 값이면 config 로드가 실패합니다.",
  },
  {
    key: "targets.*.indexPath",
    type: "string",
    default: "—",
    en: "Start and fallback CSR path for the target: mobile startup, deep-link stack recovery, back-button fallback. It is read per target only — one written at the mobile root is dropped.",
    ko: "target의 시작·fallback CSR 경로입니다. 모바일 시작, 딥링크 스택 복원, 뒤로가기 fallback에 씁니다. target 안에서만 읽히며, mobile 루트에 쓴 값은 버려집니다.",
  },
  {
    key: "targets.*.permissions",
    type: "camera | contacts | location | push | speech",
    default: "[]",
    en: "Native permission hints. Each one activates the matching plugin's native configuration, so declare push before using push notifications on a device.",
    ko: "네이티브 권한 힌트입니다. 각 값이 해당 플러그인의 네이티브 설정을 켜므로, 기기에서 푸시 알림을 쓰려면 push를 먼저 선언합니다.",
  },
  {
    key: "targets.*.assets",
    type: "{ icon, splash }",
    default: "—",
    en: "App icon and splash source paths, relative to the app root.",
    ko: "앱 루트 기준의 앱 아이콘·splash 이미지 경로입니다.",
  },
  {
    key: "targets.*.files",
    type: "{ ios, android }",
    default: "—",
    en: "Native file copy map: the key is the path inside the generated native project, the value is an app-relative source file.",
    ko: "네이티브 파일 복사 매핑입니다. key는 생성된 네이티브 프로젝트 안의 경로, value는 앱 기준 원본 파일입니다.",
  },
  {
    key: "targets.*.deepLinks",
    type: "AkanMobileTargetDeepLinks",
    default: "—",
    en: "Native URL schemes and verified HTTPS app links for this target.",
    ko: "이 target이 받을 네이티브 URL scheme과 검증된 HTTPS 앱 링크입니다.",
  },
  {
    key: "deepLinks.schemes",
    type: "string[]",
    default: "—",
    en: "Custom URL schemes such as example://. Use a simple lower-case app scheme and avoid one another app already owns.",
    ko: "example:// 같은 커스텀 URL scheme입니다. 단순한 소문자 scheme을 쓰고, 다른 앱이 이미 가진 scheme은 피합니다.",
  },
  {
    key: "deepLinks.domains",
    type: "string[]",
    default: "—",
    en: "App-link and universal-link hosts. Akan normalizes each to its bare host, so a scheme or path written here is stripped.",
    ko: "app link·universal link 호스트입니다. Akan이 호스트만 남기므로 여기 적은 scheme이나 경로는 제거됩니다.",
  },
  {
    key: "deepLinks.ios.teamId",
    type: "string",
    default: "—",
    en: "Apple Developer Team ID for apple-app-site-association. Universal links on a real iOS app do not work without it.",
    ko: "apple-app-site-association에 쓰는 Apple Developer Team ID입니다. 실제 iOS 앱의 universal link는 이 값 없이는 동작하지 않습니다.",
  },
  {
    key: "deepLinks.android.sha256CertFingerprints",
    type: "string[]",
    default: "—",
    en: "Signing certificate fingerprints for assetlinks.json. Debug fingerprints verify a local build, release fingerprints a Play Store one.",
    ko: "assetlinks.json에 쓰는 서명 인증서 fingerprint입니다. debug fingerprint는 로컬 빌드를, release fingerprint는 Play Store 빌드를 검증합니다.",
  },
  {
    key: "plugins · android · ios",
    type: "Record<string, unknown>",
    default: "—",
    en: "Passthrough Capacitor config, merged target over root. Reach for it only when a plugin needs native configuration Akan has no field for.",
    ko: "Capacitor config로 그대로 전달되는 값이며, root 위에 target을 얹어 병합합니다. Akan에 해당 필드가 없는 플러그인 설정에만 씁니다.",
  },
];

const buildFields = [
  {
    key: "externalLibs",
    type: "string[]",
    default: "[]",
    en: "Packages kept as production runtime dependencies instead of being bundled. Each one is written into the generated package.json at the version the workspace pins.",
    ko: "번들에 넣지 않고 프로덕션 런타임 의존성으로 유지할 패키지입니다. 워크스페이스가 고정한 버전으로 생성된 package.json에 기록됩니다.",
  },
  {
    key: "optimizeImports",
    type: "string[]",
    default: "built-in list",
    en: "Extra packages whose imports the client build rewrites to the exact source file, so an icon set does not ship whole.",
    ko: "클라이언트 빌드가 정확한 원본 파일 import로 바꿔 줄 추가 패키지입니다. 아이콘 세트를 통째로 싣지 않게 해 줍니다.",
  },
  {
    key: "barrelImports",
    type: "string[]",
    default: "akanjs + workspace",
    en: "Barrel paths Akan flattens while scanning and bundling. Add one only for a barrel outside the workspace.",
    ko: "스캔과 번들링에서 Akan이 펼치는 barrel 경로입니다. 워크스페이스 밖의 barrel일 때만 추가합니다.",
  },
  {
    key: "defaultDatabaseMode",
    type: "single | multiple | cluster",
    default: "single",
    en: "Fallback database mode for commands that receive no AKAN_DATABASE_MODE. multiple adds the libsql, queue, and protobuf drivers; cluster swaps libsql for postgres.",
    ko: "AKAN_DATABASE_MODE를 받지 못한 명령이 쓸 기본 데이터베이스 모드입니다. multiple은 libsql·queue·protobuf 드라이버를 더하고, cluster는 libsql 대신 postgres를 씁니다.",
  },
  {
    key: "assets.pruneFonts",
    type: "boolean",
    default: "true",
    en: "Drops font files no built surface references from the dist copy of public/. A font with optimize on is a build input the image never reads, so it goes.",
    ko: "빌드된 화면 어디서도 참조하지 않는 폰트 파일을 dist의 public/ 복사본에서 제거합니다. optimize가 켜진 폰트는 이미지가 읽지 않는 빌드 입력이므로 함께 제거됩니다.",
  },
  {
    key: "assets.keepFonts",
    type: "string[]",
    default: "[]",
    en: "Globs of fonts to keep whatever the scan concludes — a URL assembled at runtime, for instance. Write it in the akan.config.ts that owns the font: a library's globs travel with the library.",
    ko: "스캔 결과와 무관하게 남길 폰트 glob입니다. 런타임에 조립되는 URL 같은 경우에 씁니다. 폰트를 소유한 akan.config.ts에 쓰며, 라이브러리의 glob은 라이브러리와 함께 이동합니다.",
  },
  {
    key: "syncPageLibs",
    type: "string[] | boolean",
    default: "false",
    en: "true takes every lib dependency that ships a page folder, an array takes exactly the libs listed, and false removes what a previous sync created.",
    ko: "true는 page 폴더를 가진 모든 라이브러리 의존성을, 배열은 적은 라이브러리만 가져옵니다. false는 이전 sync가 만든 링크를 제거합니다.",
  },
  {
    key: "plugins",
    type: "AkanPlugin[]",
    default: "[]",
    en: "Plugins declared here are read live by the CLI: runtimePackages installs what the plugin needs, capacitor configures the native project, and syncAssets generates files into public/.",
    ko: "여기 선언한 플러그인은 CLI가 실행 시점에 읽습니다. runtimePackages는 필요한 패키지를 설치하고, capacitor는 네이티브 프로젝트를 설정하며, syncAssets는 public/에 파일을 생성합니다.",
  },
  {
    key: "docker",
    type: "string | DockerImageConfig",
    default: "oven/bun:1-slim",
    en: "A string is the whole Dockerfile, taken verbatim. The object form gives Akan the parts: image (one per arch is allowed), preRuns before bun install, postRuns after it, and command.",
    ko: "문자열은 Dockerfile 전체이며 그대로 사용됩니다. 객체 형태는 재료를 넘깁니다. image(아키텍처별로 나눌 수 있음), bun install 앞의 preRuns, 뒤의 postRuns, 그리고 command입니다.",
  },
];

export default page().render(() => {
  const { l } = usePage();
  return (
    <Scroll>
      <Scroll.Slide id="app-config" title={l.trans({ en: "App Config", ko: "앱 설정" })}>
        <Docs.Title>{l.trans({ en: "App Config", ko: "앱 설정" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "akan.config.ts is the app-level settings file. You do not need to understand every option on day one. Start with an empty file, then add only the fields your app actually needs.",
              ko: "akan.config.ts는 앱 단위 설정 파일입니다. 처음부터 모든 옵션을 이해할 필요는 없습니다. 빈 파일로 시작하고, 앱에 필요한 필드만 하나씩 추가하면 됩니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/minimal/akan.config.ts"
            code={`import type { AppConfig } from "akanjs";

const config: AppConfig = {};

export default config;`}
          />
          <div>
            {l.trans({
              en: "This is the whole key set. Every one of them has a default that a working app can live with, and the slides below cover the ones you are most likely to change:",
              ko: "설정 가능한 키는 아래가 전부입니다. 모두 앱이 그대로 동작하는 기본값을 갖고 있으며, 그중 자주 바꾸게 되는 것들을 이어지는 슬라이드에서 다룹니다:",
            })}
          </div>
          <Docs.OptionTable
            items={configKeys.map(({ key, type, default: fallback, en, ko }) => ({
              key,
              type,
              default: fallback,
              desc: l.trans({ en, ko }),
            }))}
          />
          <div className="space-y-1">
            {[
              {
                title: l.trans({ en: "Start small", ko: "작게 시작" }),
                desc: l.trans({
                  en: "Most defaults are already prepared, so an empty config is valid.",
                  ko: "대부분의 기본값은 준비되어 있으므로 빈 config도 유효합니다.",
                }),
              },
              {
                title: l.trans({ en: "Add only what changes", ko: "필요한 것만 추가" }),
                desc: l.trans({
                  en: "Define only the parts your app actually needs to customize.",
                  ko: "앱에서 실제로 바꿔야 하는 부분만 선언하면 됩니다.",
                }),
              },
              {
                title: l.trans({ en: "One source of truth", ko: "하나의 기준점" }),
                desc: l.trans({
                  en: "CLI commands, production builds, and mobile commands all read this file.",
                  ko: "CLI 명령, 프로덕션 빌드, 모바일 명령이 모두 이 파일을 기준으로 동작합니다.",
                }),
              },
            ].map(({ title, desc }) => (
              <div key={title} className={panelRecipe({ padding: "row" })}>
                <span className="font-bold text-foreground">{title}: </span>

                <span className="text-foreground/70 text-sm">{desc}</span>
              </div>
            ))}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="config-shape" title={l.trans({ en: "Config Shape", ko: "설정 파일 형태" })}>
        <Docs.Title>{l.trans({ en: "Config Shape", ko: "설정 파일 형태" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "The default export can be a plain object or a function. Use an object for most apps. Use a function only when the config needs app metadata while it is being loaded.",
              ko: "default export는 일반 객체이거나 함수일 수 있습니다. 대부분의 앱은 객체로 충분합니다. config를 읽는 시점에 앱 메타데이터가 필요할 때만 함수를 사용합니다.",
            })}
          </div>
        </Docs.Description>
        <div className="space-y-1">
          <Code.Snippet
            className="w-full"
            title={l.trans({ en: "Object config", ko: "객체 설정" })}
            code={`import type { AppConfig } from "akanjs";

const config: AppConfig = {
  routes: [{ domains: { main: ["www.example.com"] }, basePath: "store" }],
};

export default config;`}
          />
          <Code.Snippet
            className="w-full"
            title={l.trans({ en: "Function config", ko: "함수 설정" })}
            code={`import type { AppConfig } from "akanjs";

const config: AppConfig = (app) => ({
  mobile: {
    appName: app.name,
    appId: "com.example.app",
  },
});

export default config;`}
          />
        </div>
        <Docs.Alert type="info">
          {l.trans({
            en: "Akan treats config as partial settings. Missing fields are filled with framework defaults.",
            ko: "Akan은 config를 부분 설정으로 다룹니다. 선언하지 않은 값은 프레임워크 기본값으로 채워집니다.",
          })}
        </Docs.Alert>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="app-env" title={l.trans({ en: "Application Env", ko: "애플리케이션 환경설정" })}>
        <Docs.Title>{l.trans({ en: "Application Env", ko: "애플리케이션 환경설정" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "akan.config.ts describes how the app is built and routed. The env/ folder describes the actual values the app uses at runtime, such as public client keys, server-only options, and environment-specific service settings.",
              ko: "akan.config.ts가 앱을 어떻게 빌드하고 라우팅할지 설명한다면, env/ 폴더는 앱이 실행 중 사용할 실제 값을 설명합니다. 공개 가능한 클라이언트 키, 서버 전용 옵션, 환경별 서비스 설정 같은 값이 여기에 들어갑니다.",
            })}
          </div>
        </Docs.Description>
        <div className="space-y-1">
          <Code.Snippet
            className="w-full"
            title="env/env.client.local.ts"
            code={`import type { AppClientEnv } from "./env.client.type";

export const env: AppClientEnv = {
  google: {
    mapKey: "local-map-key",
  },
} as const;`}
          />
          <Code.Snippet
            className="w-full"
            title="env/env.server.local.ts"
            code={`import type { ModulesOptions } from "../lib/option";
import { libEnv } from "./env.server.type";

export const env: ModulesOptions = {
  ...libEnv,
  hostname: null,
  security: {
    verifies: [["password", "phone"]],
    sso: {},
  },
};`}
          />
        </div>
        <Docs.IntroTable
          type={l.trans({ en: "File", ko: "파일" })}
          items={[
            {
              name: "env.client.*",
              desc: l.trans({
                en: "Values used by browser or client-side code. Keep only public-safe values here, such as map keys, site keys, or feature switches.",
                ko: "브라우저나 클라이언트 코드에서 사용하는 값입니다. 지도 키, 사이트 키, 기능 스위치처럼 공개되어도 되는 값만 둡니다.",
              }),
            },
            {
              name: "env.server.*",
              desc: l.trans({
                en: "Values used only by server-side modules. Put server options, connection settings, and private service configuration here.",
                ko: "서버 모듈에서만 사용하는 값입니다. 서버 옵션, 연결 설정, 비공개 서비스 설정을 여기에 둡니다.",
              }),
            },
            {
              name: "local · testing · debug · develop · main",
              desc: l.trans({
                en: "Each suffix is selected by AKAN_PUBLIC_ENV. Use local for your machine, testing for tests, debug and develop for shared stages, and main for production.",
                ko: "각 suffix는 AKAN_PUBLIC_ENV 값으로 선택됩니다. local은 내 PC, testing은 테스트, debug와 develop은 공유 개발 단계, main은 운영 환경에 사용합니다.",
              }),
            },
            {
              name: "env.*.type.ts",
              desc: l.trans({
                en: "Type files define the shape of env values, so missing or misspelled settings can be caught while coding.",
                ko: "type 파일은 env 값의 형태를 정의합니다. 필요한 값이 빠지거나 이름이 틀린 설정을 코딩 중에 잡을 수 있습니다.",
              }),
            },
          ]}
        />
        <Docs.Alert type="warning">
          {l.trans({
            en: "Client env and publicEnv are different. env.client.* stores app values for each environment, while publicEnv only allows selected process.env names to be exposed to browser builds.",
            ko: "client env와 publicEnv는 다릅니다. env.client.*는 환경별 앱 값을 저장하고, publicEnv는 process.env 중 어떤 이름을 브라우저 빌드에 노출할지 허용하는 목록입니다.",
          })}
        </Docs.Alert>
        <Docs.Alert type="info">
          {l.trans({
            en: "Server env can also include options from shared libraries through env.server.type.ts. This lets an app keep one final server env object while reusing library-level defaults.",
            ko: "server env는 env.server.type.ts를 통해 shared library의 옵션을 함께 포함할 수 있습니다. 덕분에 앱은 라이브러리 기본값을 재사용하면서 최종 서버 env 객체 하나를 유지할 수 있습니다.",
          })}
        </Docs.Alert>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="server-option" title={l.trans({ en: "Server Option", ko: "서버 옵션" })}>
        <Docs.Title>{l.trans({ en: "Server Option", ko: "서버 옵션" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "lib/option.ts is where the app configures its server. env/ holds the values, akan.config.ts holds the build, and this file wires them into the runtime: use objects, signal middleware, adaptor overrides, web proxies, the MCP server, the agent relay's access policy, and the LLM that relay speaks to. Every library the app depends on brings its own option.ts, read in mount order with the app's last — so an app tightens what a library declared without restating it.",
              ko: "lib/option.ts는 앱이 서버를 설정하는 자리입니다. env/는 값을, akan.config.ts는 빌드를 담고, 이 파일은 그것을 런타임에 연결합니다. use 객체, signal middleware, adaptor override, web proxy에 더해 MCP 서버, agent relay 접근 정책, 그 relay가 말을 거는 LLM까지 여기서 정합니다. 앱이 의존하는 모든 라이브러리도 각자 option.ts를 가지며, 마운트 순서대로 읽고 앱의 것을 마지막에 얹습니다. 그래서 앱은 라이브러리가 선언한 값을 다시 쓰지 않고 조일 수 있습니다.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="lib/option.ts"
          code={`import { AkanOption } from "akanjs/server";
import type { LlmOption } from "akanjs/service";

import { SignedIn } from "../srvkit";
import type { LibOptions } from "./srv";

export type ModulesOptions = LibOptions & {
  llm?: LlmOption;
};

export const option = new AkanOption<ModulesOptions>()
  .setLlm((options) => options.llm ?? {})
  .setAgentAccess(SignedIn)
  .setMcp({ instructions: "Domain tools for the app. Start from taskInTodo." });`}
        />
        <Docs.IntroTable
          type={l.trans({ en: "Stage", ko: "단계" })}
          items={[
            {
              name: "setLlm",
              desc: l.trans({
                en: "apiKey, model, and host for whichever adaptor holds LlmAdaptorRole. Take the key from the env object rather than writing it here — env.server.* is gitignored, this file is not.",
                ko: "LlmAdaptorRole을 차지한 어댑터가 쓸 apiKey·model·host입니다. 키는 이 파일에 적지 말고 env 객체에서 받으세요. env.server.*는 gitignore 대상이지만 이 파일은 아닙니다.",
              }),
            },
            {
              name: "setAgentAccess",
              desc: l.trans({
                en: "Who may spend the LLM key through the runAgentTurn relay, named as the guards any other endpoint would name. Several are ANDed. With none the call is refused — the same answer None gives — because the framework has no account model to gate on.",
                ko: "runAgentTurn 릴레이로 LLM 키를 쓸 수 있는 caller를, 다른 엔드포인트와 똑같이 가드로 지정합니다. 여러 개는 AND로 묶입니다. 프레임워크에는 기준으로 삼을 계정 모델이 없어, 가드가 없으면 호출은 None 가드와 같이 거절됩니다.",
              }),
            },
            {
              name: "setMcp",
              desc: l.trans({
                en: "MCP server settings — instructions, readOnly, path, pageSize, language, auth, and promptBudget, the characters of page data one prompts/get answer may carry (default 60,000; env AKAN_MCP_PROMPT_BUDGET). Not main.ts: the gateway there only spawns children, while this file is handed to the process that mounts /mcp.",
                ko: "MCP 서버 설정입니다. instructions·readOnly·path·pageSize·language·auth와, prompts/get 응답 하나에 실을 페이지 데이터의 글자 수인 promptBudget(기본 60,000, env AKAN_MCP_PROMPT_BUDGET)을 받습니다. main.ts가 아닙니다. main.ts의 gateway는 child를 띄우기만 하고, 이 파일이 /mcp를 마운트하는 프로세스에 전달됩니다.",
              }),
            },
            {
              name: "use · applyMiddleware · applyAdaptor · applyWebProxy",
              desc: l.trans({
                en: "The registration half: env-derived singletons a service reaches with use<T>(), signal middleware, a predefined adaptor role rebound to the app's own implementation, and web proxies.",
                ko: "등록 쪽입니다. service가 use<T>()로 잡는 env 기반 싱글턴, signal middleware, 미리 정의된 adaptor role을 앱 구현으로 다시 묶는 override, web proxy를 등록합니다.",
              }),
            },
          ]}
        />
        <Docs.Alert type="info">
          {l.trans({
            en: "Each of these has an env spelling too (AKAN_MCP_*, AKAN_AGENT), for a deployment that must configure what the source does not. A value written in option.ts wins over the env of the same name.",
            ko: "이 설정들에는 env 이름도 하나씩 있습니다(AKAN_MCP_*, AKAN_AGENT). 소스에 없는 값을 배포 시점에 정해야 할 때를 위한 것이며, option.ts에 쓴 값이 같은 이름의 env를 이깁니다.",
          })}
        </Docs.Alert>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="routes" title={l.trans({ en: "Routes and Domains", ko: "Route와 Domain" })}>
        <Docs.Title>{l.trans({ en: "Routes and Domains", ko: "Route와 Domain" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "routes is where you list the public domains for the app. If your app has several clients, each route can also name the client with basePath. The multi-client page explains that structure in detail; here we focus on the config fields.",
              ko: "routes는 앱에서 사용할 공개 도메인을 적는 곳입니다. 앱에 여러 클라이언트가 있다면 각 route에 basePath로 클라이언트 이름도 적을 수 있습니다. 다중 클라이언트 구조 자체는 Multi Client 페이지에서 자세히 다루고, 여기서는 설정 필드에 집중합니다.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="apps/myapp/akan.config.ts"
          code={`import type { AppConfig } from "akanjs";

const config: AppConfig = {
  externalLibs: ["shiki"],
  routes: [
    { domains: { main: ["www.akanjs.com", "akanjs.com"] }, basePath: "akanjs" },
    { domains: { main: ["soft.akanjs.com"] }, basePath: "soft" },
    { domains: { main: ["office.akanjs.com"] }, basePath: "office" },
  ],
};

export default config;`}
        />
        <Docs.OptionTable
          items={[
            {
              key: "basePath",
              type: "string",
              default: "—",
              desc: l.trans({
                en: "The client this route opens, and the first page folder its routes live under. Akan strips the slashes, so /store/ and store are the same value. A route without one is the app itself.",
                ko: "이 route가 여는 클라이언트이자, 그 라우트들이 놓이는 첫 page 폴더입니다. Akan이 슬래시를 떼어내므로 /store/와 store는 같은 값입니다. basePath가 없는 route는 앱 자체를 뜻합니다.",
              }),
            },
            {
              key: "domains",
              type: "Record<branch, string[]>",
              default: "{}",
              desc: l.trans({
                en: "Hosts that open this route, keyed by deployment branch. debug, develop, and main always exist, and naming any other key adds that branch. Each host is lower-cased and a port is dropped. Akan also derives one host per basePath per branch, so a route with an empty map still has an address.",
                ko: "이 route를 여는 호스트이며, 배포 branch를 키로 씁니다. debug·develop·main은 항상 있고, 다른 키를 적으면 그 branch가 추가됩니다. 각 호스트는 소문자로 바뀌고 포트는 제거됩니다. Akan은 basePath마다 branch별 호스트도 만들어 주므로, 빈 맵을 적은 route에도 주소가 있습니다.",
              }),
            },
          ]}
        />
        <Docs.Alert type="warning">
          {l.trans({
            en: "If you declare basePath, the page folder must follow the same name. See Multi Client for the full page layout rule.",
            ko: "basePath를 선언했다면 page 폴더도 같은 이름을 따라야 합니다. 자세한 page 배치 규칙은 Multi Client 페이지를 참고하세요.",
          })}
        </Docs.Alert>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="web-surfaces" title={l.trans({ en: "Web Surfaces And Prefixes", ko: "웹 표면과 경로 접두사" })}>
        <Docs.Title>{l.trans({ en: "Web Surfaces And Prefixes", ko: "웹 표면과 경로 접두사" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "web decides which web surfaces the build produces, and api decides where the server mounts its endpoints. Both are declared here rather than only in main.ts, because both are baked into the client bundles: a prebuilt CSR shell or a mobile package never reaches a server that could tell it otherwise.",
              ko: "web은 빌드가 어떤 웹 표면을 만들지 정하고, api는 서버가 엔드포인트를 어디에 마운트할지 정합니다. 둘 다 main.ts만이 아니라 여기에 선언합니다. 두 값 모두 클라이언트 번들에 구워지며, 미리 빌드된 CSR 셸이나 모바일 패키지는 이를 알려 줄 서버에 닿지 못하기 때문입니다.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="apps/myapp/akan.config.ts"
          code={`import type { AppConfig } from "akanjs";

const config: AppConfig = {
  web: { csr: false },
  api: { prefix: "/backend", websocketPrefix: "/socket" },
};

export default config;`}
        />
        <Docs.OptionTable
          items={[
            {
              key: "web",
              type: "boolean | { csr: boolean }",
              default: "true",
              desc: l.trans({
                en: "true builds both surfaces. false is an API-only app: no web artifact is built and no web route is mounted. { csr: false } keeps SSR and drops the single-file shell that the mobile build ships and /__csr serves. There is no CSR-without-SSR option, by type — the CSR bundle inlines the stylesheet the SSR build compiles.",
                ko: "true는 두 표면을 모두 빌드합니다. false는 API 전용 앱으로, 웹 산출물을 만들지 않고 웹 라우트도 마운트하지 않습니다. { csr: false }는 SSR을 두고, 모바일 빌드가 싣고 /__csr이 제공하는 단일 파일 셸만 뺍니다. 타입상 SSR 없는 CSR은 없습니다. CSR 번들이 SSR 빌드가 컴파일한 스타일시트를 인라인하기 때문입니다.",
              }),
            },
            {
              key: "api.prefix",
              type: "string",
              default: "/api",
              desc: l.trans({
                en: "Where signal endpoints are mounted. A blank value and a bare / are both refused — / would swallow every page route. Read it back with getApiPrefix() from akanjs/base; never write the literal.",
                ko: "signal 엔드포인트가 마운트될 경로입니다. 빈 값과 / 하나는 거부됩니다. /는 모든 페이지 라우트를 삼키기 때문입니다. 값은 akanjs/base의 getApiPrefix()로 읽고, 문자열을 직접 적지 마세요.",
              }),
            },
            {
              key: "api.websocketPrefix",
              type: "string",
              default: "/ws",
              desc: l.trans({
                en: "Where the websocket upgrade sits. Read it back with getWsPrefix(). new AkanApp({ prefix, websocketPrefix }) still overrides both for the server and every page it renders.",
                ko: "웹소켓 업그레이드가 놓이는 경로입니다. 값은 getWsPrefix()로 읽습니다. new AkanApp({ prefix, websocketPrefix })는 서버와 그 서버가 렌더링하는 모든 페이지에서 두 값을 덮어씁니다.",
              }),
            },
          ]}
        />
        <div>
          {l.trans({
            en: "AKAN_SSR and AKAN_CSR narrow the same choice at boot, and can only narrow it: a deployment cannot switch on a surface the build left out. akan build writes whichever of the two the config already turned off into the generated Dockerfile, and akan start ignores web entirely so the dev surface stays whole.",
            ko: "AKAN_SSR과 AKAN_CSR은 같은 선택을 부팅 시점에 좁히며, 좁히기만 합니다. 빌드가 빼놓은 표면을 배포가 다시 켤 수는 없습니다. akan build는 config가 이미 끈 쪽을 생성되는 Dockerfile에 기록하고, akan start는 web을 무시하므로 개발 화면은 그대로 유지됩니다.",
          })}
        </div>
        <Docs.Alert type="error">
          {l.trans({
            en: "web: { csr: false } together with a mobile section fails the config load. The Capacitor build copies that CSR shell into the native project, so the two declarations cancel each other out — drop the mobile section or leave CSR on.",
            ko: "web: { csr: false }와 mobile 섹션을 함께 선언하면 config 로드가 실패합니다. Capacitor 빌드가 그 CSR 셸을 네이티브 프로젝트로 복사하므로 두 선언은 서로를 무효로 만듭니다. mobile 섹션을 빼거나 CSR을 켠 채로 두세요.",
          })}
        </Docs.Alert>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="mobile" title={l.trans({ en: "Mobile Metadata", ko: "모바일 메타데이터" })}>
        <Docs.Title>{l.trans({ en: "Mobile Metadata", ko: "모바일 메타데이터" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "mobile describes the native app identity used by Android and iOS commands. Think of it as the name, package id, and version information that will appear in native app projects. Values at the mobile root are defaults; a target overrides the ones it names.",
              ko: "mobile은 Android와 iOS 명령에서 사용할 네이티브 앱 정보를 설명합니다. 네이티브 앱 프로젝트에 들어갈 이름, 패키지 ID, 버전 정보를 적는 곳이라고 생각하면 됩니다. mobile 루트의 값은 기본값이고, target이 적은 값이 그 위를 덮습니다.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="Mobile config"
          code={`const config: AppConfig = {
  mobile: {
    appName: "Example",
    appId: "com.example.app",
    version: "1.0.0",
    buildNum: 1,
    targets: {
      default: {
        basePath: "store",
        indexPath: "/explore",
        permissions: ["camera", "push"],
        assets: {
          icon: "public/icon.png",
          splash: "public/splash.png",
        },
        files: {
          android: {
            "app/google-services.json": "public/google-services.json",
          },
          ios: {
            "App/GoogleService-Info.plist": "public/GoogleService-Info.plist",
          },
        },
        deepLinks: {
          schemes: ["example"],
          domains: ["example.com"],
          ios: {
            teamId: "TEAMID",
          },
          android: {
            sha256CertFingerprints: [
              "00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00",
            ],
          },
        },
      },
    },
    android: {
      buildOptions: {
        releaseType: "APK",
      },
    },
  },
};`}
        />
        <Docs.OptionTable
          items={mobileFields.map(({ key, type, default: fallback, en, ko }) => ({
            key,
            type,
            default: fallback,
            desc: l.trans({ en, ko }),
          }))}
        />
        <Docs.Alert type="info">
          <span>
            {l.trans({
              en: "files maps native target paths to app-relative source files. It is useful for Firebase push config files such as google-services.json and GoogleService-Info.plist. Keep server service account JSON out of client/native file mappings. For platform setup steps, see ",
              ko: "files는 네이티브 target path를 앱 기준 source file에 매핑합니다. google-services.json, GoogleService-Info.plist 같은 Firebase push 설정 파일에 유용합니다. 서버 service account JSON은 client/native file mapping에 넣지 마세요. 플랫폼별 설정 절차는 ",
            })}
          </span>
          <Link
            href="/cheatsheet/mobile/setup"
            className="text-primary underline underline-offset-4 hover:no-underline"
          >
            {l.trans({ en: "Mobile Development", ko: "모바일 개발" })}
          </Link>
          <span>{l.trans({ en: ".", ko: " 문서를 참고하세요." })}</span>
        </Docs.Alert>
        <Docs.Alert type="info">
          {l.trans({
            en: "When a multi-client app needs separate mobile apps per client, define mobile targets with basePath. The Multi Client page shows that pattern.",
            ko: "다중 클라이언트 앱에서 클라이언트별 모바일 앱이 필요하다면 basePath가 있는 mobile target을 정의합니다. 이 패턴은 Multi Client 페이지에서 다룹니다.",
          })}
        </Docs.Alert>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="images-env" title={l.trans({ en: "Images And Public Env", ko: "이미지와 공개 환경변수" })}>
        <Docs.Title>{l.trans({ en: "Images And Public Env", ko: "이미지와 공개 환경변수" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "images controls the allow-list for optimized remote images. publicEnv is an allow-list for extra browser-visible environment variables beyond the built-in AKAN_PUBLIC_* pattern.",
              ko: "images는 최적화할 수 있는 원격 이미지의 허용 목록을 정합니다. publicEnv는 기본 AKAN_PUBLIC_* 패턴 외에 브라우저에 노출할 환경변수 패턴을 추가하는 허용 목록입니다.",
            })}
          </div>
        </Docs.Description>
        <div className="space-y-1">
          <Code.Snippet
            className="w-full"
            title="images"
            code={`const config: AppConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "asset.example.com" }],
    qualities: [75, 90],
    dangerouslyAllowSVG: false,
  },
};`}
          />
          <Code.Snippet
            className="w-full"
            title="publicEnv"
            code={`const config: AppConfig = {
  publicEnv: ["AKAN_PUBLIC_FEATURE", "BUN_PUBLIC_*"],
};`}
          />
        </div>
        <Docs.Alert type="warning">
          {l.trans({
            en: "publicEnv does not store values. It only says which environment variable names are safe to expose to browser builds.",
            ko: "publicEnv는 값을 저장하는 곳이 아닙니다. 어떤 환경변수 이름을 브라우저 빌드에 노출해도 되는지 정하는 목록입니다.",
          })}
        </Docs.Alert>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="secret-files" title={l.trans({ en: "Secret Files", ko: "시크릿 파일" })}>
        <Docs.Title>{l.trans({ en: "Secret Files", ko: "시크릿 파일" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Some private values cannot live inside env.server.*.ts, such as service-account JSON, TLS certificates, or private key files. The secrets field lists glob patterns for these files so Akan ships them together with the env/ folder.",
              ko: "service-account JSON, TLS 인증서, private key 파일처럼 env.server.*.ts 안에 담을 수 없는 비공개 값이 있습니다. secrets 필드는 이런 파일의 glob 패턴을 나열해 Akan이 env/ 폴더와 함께 전송하도록 합니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "akan upload-env archives every matched file, and akan download-env restores them. Patterns are resolved relative to the app directory, and Akan syncs them into a managed block in the root .gitignore, so one declaration both deploys and git-ignores the files.",
              ko: "akan upload-env는 매칭된 모든 파일을 아카이브하고, akan download-env는 이를 복원합니다. 패턴은 앱 디렉터리 기준으로 resolve되며, Akan이 root .gitignore의 managed block에 동기화하므로 한 번의 선언으로 배포와 git-ignore가 함께 처리됩니다.",
            })}
          </div>
        </Docs.Description>
        <div className="space-y-1">
          <Code.Snippet
            className="w-full"
            title="secrets"
            code={`const config: AppConfig = {
  secrets: ["secrets/**/*", "certs/*.pem"],
};`}
          />
          <Code.Snippet
            className="w-full"
            title=".gitignore (auto-synced on upload-env)"
            code={`# akan:secrets (managed by akan.config.ts — do not edit)
apps/api/certs/*.pem
apps/api/secrets/**/*
# akan:secrets:end`}
          />
        </div>
        <Docs.Alert type="warning">
          {l.trans({
            en: "publicEnv exposes variable names to the browser; secrets does the opposite. Only glob patterns live in config — the matched files stay local and git-ignored, so never commit their contents.",
            ko: "publicEnv는 변수 이름을 브라우저에 노출하지만, secrets는 그 반대입니다. config에는 glob 패턴만 존재하며, 매칭된 파일은 로컬에 남고 git-ignore되므로 내용을 절대 commit하지 마세요.",
          })}
        </Docs.Alert>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="build-runtime" title={l.trans({ en: "Build And Runtime", ko: "빌드와 런타임" })}>
        <Docs.Title>{l.trans({ en: "Build And Runtime", ko: "빌드와 런타임" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "The rest of the config is for the build system and the production image. Most apps never touch it, but it is where a package stays external, a font survives pruning, a library's routes join the app, and the image gains a system dependency.",
              ko: "나머지 설정은 빌드 시스템과 프로덕션 이미지를 위한 것입니다. 대부분의 앱은 건드릴 일이 없지만, 특정 패키지를 외부 의존성으로 남기거나, 폰트를 정리 대상에서 빼거나, 라이브러리 라우트를 앱에 합치거나, 이미지에 시스템 의존성을 더할 때 사용합니다.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="Build and runtime fields"
          code={`import { pushNotificationPlugin } from "./plugin/pushNotification.plugin";

const config: AppConfig = {
  externalLibs: ["shiki"],
  optimizeImports: ["custom-icons"],
  barrelImports: ["@acme/ui"],
  defaultDatabaseMode: "single",
  assets: { pruneFonts: true, keepFonts: ["fonts/Assistant-*.woff2"] },
  syncPageLibs: ["shared"],
  plugins: [pushNotificationPlugin],
  docker: {
    image: { amd64: "oven/bun:amd64", arm64: "oven/bun:arm64" },
    preRuns: ["apt-get install -y ffmpeg"],
    postRuns: ["echo after"],
    command: ["bun", "main.js"],
  },
};`}
        />
        <Docs.OptionTable
          items={buildFields.map(({ key, type, default: fallback, en, ko }) => ({
            key,
            type,
            default: fallback,
            desc: l.trans({ en, ko }),
          }))}
        />
        <div>
          {l.trans({
            en: "A library contributes to three of these. Its own externalLibs, docker.preRuns and docker.postRuns, and assets.keepFonts are read off every libs/*/akan.config.ts and merged into the app's — first occurrence wins, so a step a library and its app both declare becomes one image layer. The generated image installs ca-certificates and tzdata and nothing else, which is why an app that needs ffmpeg or a headless browser declares it.",
            ko: "라이브러리가 이 중 셋에 값을 더합니다. 라이브러리 자신의 externalLibs, docker.preRuns·docker.postRuns, assets.keepFonts를 모든 libs/*/akan.config.ts에서 읽어 앱 설정에 합칩니다. 먼저 나온 값이 이기므로 라이브러리와 앱이 함께 선언한 단계는 이미지 레이어 하나가 됩니다. 생성되는 이미지에는 ca-certificates와 tzdata만 설치되므로, ffmpeg나 헤드리스 브라우저가 필요한 앱은 직접 선언해야 합니다.",
          })}
        </div>
        <Docs.Alert type="warning">
          {l.trans({
            en: "A docker written as a string is the whole Dockerfile, taken verbatim. Nothing is merged into it — including the preRuns and postRuns your libraries declared, which are silently dropped rather than silently unapplied.",
            ko: "docker를 문자열로 쓰면 그것이 Dockerfile 전체이며 그대로 사용됩니다. 아무것도 병합되지 않습니다. 라이브러리가 선언한 preRuns와 postRuns도 포함이며, 적용되지 않은 채 남지 않고 아예 버려집니다.",
          })}
        </Docs.Alert>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="defaults" title={l.trans({ en: "Defaults And Rules", ko: "기본값과 규칙" })}>
        <Docs.Title>{l.trans({ en: "Defaults And Rules", ko: "기본값과 규칙" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Akan resolves the final app config by merging your file with framework defaults. For a first app, keep these rules in mind before adding advanced options.",
              ko: "Akan은 사용자가 작성한 파일과 프레임워크 기본값을 합쳐 최종 앱 설정을 만듭니다. 처음 앱을 만들 때는 고급 옵션을 추가하기 전에 아래 규칙만 기억하면 됩니다.",
            })}
          </div>
        </Docs.Description>
        <div className="space-y-1">
          {[
            {
              title: l.trans({ en: "Environment values", ko: "환경별 값" }),
              desc: l.trans({
                en: "Put runtime values in env/ before adding config fields. Use client env for public values and server env for private server options.",
                ko: "config 필드를 추가하기 전에 런타임 값은 env/에 둡니다. 공개 값은 client env에, 서버 전용 비공개 옵션은 server env에 둡니다.",
              }),
            },
            {
              title: l.trans({ en: "Routes", ko: "라우트" }),
              desc: l.trans({
                en: "Skip routes until you need custom domains or multiple clients.",
                ko: "커스텀 도메인이나 여러 클라이언트가 필요해지기 전까지는 routes를 생략해도 됩니다.",
              }),
            },
            {
              title: l.trans({ en: "Mobile", ko: "모바일" }),
              desc: l.trans({
                en: "appName defaults to the app name, appId defaults to com.<repoName>.<appName>, version defaults to 0.0.1, and buildNum defaults to 1. Pin a real reverse-DNS appId before you ship: akan doctor rejects placeholder ids such as com.example.app, which Apple's portal has almost always already claimed.",
                ko: "appName은 앱 이름, appId는 com.<repoName>.<appName>, version은 0.0.1, buildNum은 1이 기본값입니다. 출시 전에는 조직의 실제 reverse-DNS appId를 지정해야 합니다. akan doctor는 com.example.app 같은 placeholder id를 거부하며, 이런 id는 Apple 포털에서 이미 선점되어 있는 경우가 대부분입니다.",
              }),
            },
            {
              title: l.trans({ en: "Images", ko: "이미지" }),
              desc: l.trans({
                en: "Remote images are blocked unless remotePatterns allow them. WebP and quality 75 are used by default.",
                ko: "remotePatterns가 허용하지 않은 원격 이미지는 차단됩니다. 기본 포맷은 WebP이고 기본 quality는 75입니다.",
              }),
            },
            {
              title: l.trans({ en: "i18n", ko: "다국어" }),
              desc: l.trans({
                en: "Locales default to en and ko with en first. Change it only to move the default locale or to serve a different set — defaultLocale must be one of locales, or the config load fails.",
                ko: "locale 기본값은 en과 ko이며 기본 locale은 en입니다. 기본 locale을 옮기거나 다른 목록을 제공할 때만 바꿉니다. defaultLocale이 locales 안에 없으면 config 로드가 실패합니다.",
              }),
            },
          ].map(({ title, desc }) => (
            <div key={title} className={panelRecipe({ padding: "row" })}>
              <span className="font-bold text-foreground">{title}: </span>

              <span className="text-foreground/70 text-sm">{desc}</span>
            </div>
          ))}
        </div>
        <Docs.Alert type="info">
          {l.trans({
            en: "Recommended order: start with an empty config, fill env/ values as the app needs them, add routes when domains are needed, add mobile when native apps are needed, and add advanced build options only after the default build is not enough.",
            ko: "추천 순서: 빈 config로 시작하고, 앱에 필요한 env/ 값을 채운 뒤, 도메인이 필요할 때 routes를 추가하고, 네이티브 앱이 필요할 때 mobile을 추가하고, 기본 빌드로 부족할 때만 고급 빌드 옵션을 추가하세요.",
          })}
        </Docs.Alert>
      </Scroll.Slide>
      <DocsToc />
    </Scroll>
  );
});
