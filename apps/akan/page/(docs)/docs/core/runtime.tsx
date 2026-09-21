import { usePage } from "@apps/akan/client";
import { Code, Divider, Docs, DocsToc, panelRecipe } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();
  return (
    <Scroll>
      <Scroll.Slide id="akan-runtime" title={l.trans({ en: "Akan Runtime", ko: "Akan 런타임" })}>
        <Docs.Title>{l.trans({ en: "Akan Runtime", ko: "Akan 런타임" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Akan applications run on a Bun-based runtime that connects app code, generated artifacts, server routes, and pages. The app entry point (main.ts) starts the runtime, and Akan handles the server shape behind it.",
              ko: "Akan 애플리케이션은 앱 코드, 생성 산출물, 서버 라우트, 페이지를 연결하는 Bun 기반 런타임 위에서 실행됩니다. 앱 엔트리 포인트(main.ts)는 런타임을 시작하고, 그 뒤의 서버 구성은 Akan이 담당합니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/myapp/main.ts"
            code={`import { AkanApp } from "akanjs/server/akanApp";

const run = async () => {
  await new AkanApp().start();
};
void run();`}
          />
          <div>
            {l.trans({
              en: "When Akan App starts, Akan Server prepares everything the app can serve. In practice, the runtime exposes four kinds of work.",
              ko: "Akan App이 실행되면 Akan Server가 앱이 제공할 기능들을 준비합니다. 실제 런타임은 크게 네 가지 작업을 제공합니다.",
            })}
          </div>
          <ul className="list-disc space-y-1 pl-6 md:pl-12">
            <li>
              {l.trans({
                en: "Internal API (Queue, Timer, etc.): internal work that runs without a browser request.",
                ko: "Internal API (Queue, Timer, etc.): 브라우저 요청 없이 내부에서 실행되는 큐, 타이머 같은 작업입니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "API (HTTP, WebSocket): public communication for data requests and realtime updates.",
                ko: "API (HTTP, WebSocket): 데이터 요청과 실시간 업데이트를 처리하는 HTTP, 웹소켓 통신 경로입니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "SSR Pages (Web): web pages rendered by the server and sent to the browser.",
                ko: "SSR Pages (Web): 서버가 렌더링해서 브라우저로 보내는 웹 페이지입니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "CSR Page (Android, iOS): client-rendered pages used by mobile targets.",
                ko: "CSR Page (Android, iOS): Android, iOS 같은 모바일 대상에서 사용하는 클라이언트 렌더링 페이지입니다.",
              })}
            </li>
          </ul>
          <Docs.Mermaid
            title="Runtime overview"
            chart={`flowchart LR
  appCode[App Code] --> app[Akan App]
  app --> server[Akan Server]
  server --> internalApi["Internal API (Queue, Timer, etc.)"]
  server --> api["API (HTTP, WebSocket)"]
  server --> ssr["SSR Pages (Web)"]
  server --> csr["CSR Page (Android, iOS)"]`}
          />

          <div>
            {l.trans({
              en: "AKAN_REPLICA decides how many server processes each role gets, and it defaults to 0,0,1 everywhere: one all server and nothing else. With a single traffic replica there is nothing to balance, so Akan App runs that server inside its own process instead of spawning it and proxying to it. The container holds one process, and every request skips a proxy hop.",
              ko: "AKAN_REPLICA는 역할별 서버 프로세스 개수를 정하며, 어디서나 기본값은 0,0,1입니다. all 서버 하나만 실행한다는 뜻입니다. 트래픽 replica가 하나면 분산할 대상이 없으므로, Akan App은 그 서버를 spawn해서 프록시하지 않고 자기 프로세스 안에서 직접 실행합니다. 컨테이너는 프로세스 하나만 갖고, 모든 요청이 프록시 홉을 건너뜁니다.",
            })}
          </div>
          <ul className="list-disc space-y-1 pl-6 md:pl-12">
            <li>
              {l.trans({
                en: "all: runs both federation and batch behavior in one server process. This is the default, and the shape almost every deployment ships.",
                ko: "all: 하나의 서버 프로세스에서 federation과 batch 역할을 함께 실행합니다. 기본값이며, 대부분의 배포가 이 형태로 나갑니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "federation: serves browser traffic such as pages, API calls, and WebSocket connections.",
                ko: "federation: 페이지, API 호출, 웹소켓 연결 같은 브라우저 요청을 처리합니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "batch: runs background work such as queues, timers, and scheduled jobs.",
                ko: "batch: 큐, 타이머, 예약 작업 같은 백그라운드 작업을 실행합니다.",
              })}
            </li>
          </ul>
          <Docs.Mermaid
            title="Default: one process, no gateway"
            highlightNodes={["solo"]}
            chart={`flowchart LR
  browser[Browser] --> solo["Akan App + Akan Server<br/>(one process)"]
  solo --> webTraffic["Pages, API, WebSocket"]
  solo --> background["Queue, Timer, Jobs"]
  solo -.->|"web only"| rsc["RSC Worker"]`}
          />
          <div>
            {l.trans({
              en: "Five things bring the gateway back: two or more replicas, a batch-only replica that never listens, AKAN_SOLO=false, passing replica to new AkanApp(...), and akan start, which always runs it because the gateway is also the dev server's build relay and error overlay. Then Akan App spawns the servers and load-balances browser traffic across the ready federation and all processes.",
              ko: "gateway가 다시 사용되는 경우는 다섯 가지입니다. replica가 둘 이상일 때, listen하지 않는 batch 전용 replica가 있을 때, AKAN_SOLO=false일 때, new AkanApp(...)에 replica를 넘겼을 때, 그리고 akan start일 때입니다. akan start는 gateway가 개발 서버의 빌드 릴레이이자 에러 오버레이이기도 하므로 언제나 gateway로 실행됩니다. 이때 Akan App은 서버들을 spawn하고 준비된 federation/all 프로세스로 브라우저 요청을 로드밸런싱합니다.",
            })}
          </div>
          <Docs.Mermaid
            title="Replica and server modes"
            highlightNodes={["app"]}
            chart={`flowchart LR
  browser[Browser] --> app["Akan App<br/>(Gateway, Load Balancer)"]
  app -->|"traffic"| federation1["Akan Server (federation)"]
  app -->|"traffic"| federation2["Akan Server (federation)"]
  app -->|"traffic"| federation3["Akan Server (federation)"]
  app --> batch["Akan Server (batch)"]
  federation1 --> webTraffic["Pages, API, WebSocket"]
  federation2 --> webTraffic
  federation3 --> webTraffic
  batch --> background["Queue, Timer, Jobs"]`}
          />
          <Docs.Alert type="info">
            {l.trans({
              en: "A single Akan App has built-in clustering. You can run multiple server replicas and let Akan App distribute traffic, without setting up separate local load-balancing tools such as nginx, docker compose, or pm2.",
              ko: "단일 Akan App은 clustering 기능을 기본으로 지원합니다. 여러 server replica를 실행하고 Akan App이 트래픽을 분산할 수 있으므로, nginx, docker compose, pm2 같은 별도 로컬 load-balancing 도구를 직접 구성하지 않아도 됩니다.",
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />
      <Scroll.Slide id="env-identity" title={l.trans({ en: "Identity And Environment", ko: "정체성과 환경" })}>
        <Docs.Title>{l.trans({ en: "Identity And Environment", ko: "정체성과 환경" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "The root .env file decides which organization, domain, environment, operation mode, and log level the app uses while it runs. Most projects keep these values stable, but changing them lets the same app behave like a local, debug, develop, or production-like service.",
              ko: "루트 .env 파일은 앱이 실행될 때 사용할 조직, 도메인, 환경, 동작 모드, 로그 수준을 정합니다. 대부분의 프로젝트에서는 이 값을 자주 바꾸지 않지만, 값을 바꾸면 같은 앱을 로컬용, 디버그용, 개발 서버용, 운영에 가까운 형태로 실행할 수 있습니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title=".env"
            language="bash"
            code={`AKAN_PUBLIC_REPO_NAME=myorg
AKAN_PUBLIC_SERVE_DOMAIN="mydomain.com"
AKAN_PUBLIC_ENV=local
AKAN_PUBLIC_OPERATION_MODE=local
AKAN_PUBLIC_LOG_LEVEL=debug
AKAN_SEARCH_ENABLED=1
AKAN_SEARCH_TOKENIZER="unicode61 remove_diacritics 2"`}
          />
          <Docs.Alert type="warning">
            {l.trans({
              en: "Environment variables prefixed with AKAN_PUBLIC_ are public. They can be read by browser code, so never store secrets, private tokens, or credentials in them.",
              ko: "AKAN_PUBLIC_ 접두사가 붙은 환경변수는 공개 값입니다. 브라우저 코드에서도 읽을 수 있으므로 비밀키, 개인 토큰, 인증 정보는 절대 넣지 마세요.",
            })}
          </Docs.Alert>
          <div>
            {l.trans({
              en: "Four of those names answer who this app is and where it runs. getEnv() reads them once and caches the result, and it throws rather than guessing when the first two are missing:",
              ko: "이 중 네 개는 이 앱이 누구이며 어디서 도는지에 답합니다. getEnv()가 한 번 읽어 캐시하고, 앞의 두 개가 없으면 추측하지 않고 예외를 냅니다:",
            })}
          </div>
          <Docs.OptionTable
            items={[
              {
                key: "AKAN_PUBLIC_REPO_NAME",
                type: "string",
                default: l.trans({ en: "required", ko: "필수" }),
                desc: l.trans({
                  en: "Organization or repository namespace, usually fixed for the life of the project. getEnv() throws when it is missing instead of falling back.",
                  ko: "조직 또는 저장소 네임스페이스이며, 보통 프로젝트 수명 내내 고정입니다. 값이 없으면 getEnv()가 대체값을 쓰지 않고 예외를 냅니다.",
                }),
              },
              {
                key: "AKAN_PUBLIC_SERVE_DOMAIN",
                type: "string",
                default: l.trans({ en: "required", ko: "필수" }),
                desc: l.trans({
                  en: "The domain the app builds links, callbacks, and domain-based routes from. Also throws when missing.",
                  ko: "앱이 링크, 콜백, 도메인 기반 라우팅을 만들 때 쓰는 도메인입니다. 이 값도 없으면 예외를 냅니다.",
                }),
              },
              {
                key: "AKAN_PUBLIC_ENV",
                type: "local | debug | develop | main | testing",
                default: "debug",
                desc: l.trans({
                  en: "Which data set the app runs against. local is your machine and your test data, debug is shared test data for reproduction, develop is the team integration check, and main is production-like behavior.",
                  ko: "앱이 어떤 데이터 기준으로 도는지를 정합니다. local은 내 컴퓨터와 로컬 테스트 데이터, debug는 재현을 위한 공용 테스트 데이터, develop은 팀 통합 상태 확인, main은 운영에 가까운 동작입니다.",
                }),
              },
              {
                key: "AKAN_PUBLIC_OPERATION_MODE",
                type: "local | edge | cloud | module",
                default: l.trans({ en: "local when ENV=local, else cloud", ko: "ENV=local이면 local, 아니면 cloud" }),
                desc: l.trans({
                  en: "Where clients connect. local talks to the local runtime, cloud talks to cloud services, and edge uses the edge-facing paths. module is in the type and no runtime branch reads it.",
                  ko: "클라이언트가 어디에 연결되는지를 정합니다. local은 로컬 런타임, cloud는 클라우드 서비스, edge는 엣지 경로를 사용합니다. module은 타입에만 있고 이를 분기하는 런타임 코드는 없습니다.",
                }),
              },
            ]}
          />
          <div>
            {l.trans({
              en: "In practice you move two of them together. Build a feature with ENV=local and OPERATION_MODE=local, switch ENV to debug or develop when you need shared data or shared services, and deploy with ENV=main against whichever operation mode the cluster serves:",
              ko: "실제로는 두 개를 같이 움직입니다. 기능을 만들 때는 ENV=local, OPERATION_MODE=local로 작업하고, 공용 데이터나 공용 서비스가 필요해지면 ENV를 debug나 develop으로 바꾸며, 배포할 때는 클러스터가 제공하는 operation mode에 맞춰 ENV=main으로 올립니다:",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title=".env"
            language="bash"
            code={`# Build a feature locally
AKAN_PUBLIC_ENV=local
AKAN_PUBLIC_OPERATION_MODE=local
AKAN_PUBLIC_LOG_LEVEL=debug

# Reproduce with shared test data
AKAN_PUBLIC_ENV=debug
AKAN_PUBLIC_OPERATION_MODE=local
AKAN_PUBLIC_LOG_LEVEL=debug

# Deploy production to a cloud server
AKAN_PUBLIC_ENV=main
AKAN_PUBLIC_OPERATION_MODE=cloud
AKAN_PUBLIC_LOG_LEVEL=info

# Deploy production to an edge server
AKAN_PUBLIC_ENV=main
AKAN_PUBLIC_OPERATION_MODE=edge
AKAN_PUBLIC_LOG_LEVEL=info`}
          />
        </Docs.Description>
      </Scroll.Slide>
      <Divider />
      <Scroll.Slide id="env-search" title={l.trans({ en: "Text Search Variables", ko: "텍스트 검색 환경변수" })}>
        <Docs.Title>{l.trans({ en: "Text Search Variables", ko: "텍스트 검색 환경변수" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Full-text search is on unless you switch it off, and both of its variables are deployment-wide decisions rather than per-process ones. A process cannot clean up triggers for models it does not mount, so give every process in one deployment the same pair.",
              ko: "전문 검색은 끄지 않는 한 켜져 있고, 두 변수 모두 프로세스별이 아니라 배포 전체의 결정입니다. 프로세스는 자신이 마운트하지 않은 모델의 trigger를 정리할 수 없으므로, 한 배포의 모든 프로세스에 같은 값을 주세요.",
            })}
          </div>
          <Docs.OptionTable
            items={[
              {
                key: "AKAN_SEARCH_ENABLED",
                type: "0 | 1 | false | true",
                default: l.trans({ en: "unset means on", ko: "미설정이면 on" }),
                desc: l.trans({
                  en: "Switches the full-text index off. Indexed data is kept and re-enabling reconciles every model, so turning it off is reversible. An unrecognised value fails the boot rather than guessing.",
                  ko: "전문 검색 색인을 끕니다. 색인된 데이터는 그대로 남고 다시 켜면 모든 모델을 재정합하므로, 끄는 것은 되돌릴 수 있습니다. 인식할 수 없는 값은 추측하지 않고 부팅을 실패시킵니다.",
                }),
              },
              {
                key: "AKAN_SEARCH_TOKENIZER",
                type: "string",
                default: "unicode61 remove_diacritics 2",
                desc: l.trans({
                  en: "The fts5 tokenizer the index is built with; database.search.tokenizer in the app config takes precedence. Changing it rebuilds the index from the mirror on the next boot, so no data is re-read from the model tables — but the rebuild takes no cross-process claim, so a fleet restarted at once repeats it in every process. Stagger the restart when the mirror is large. A value this SQLite build cannot provide fails the boot and names the fix, rather than starting a server whose every search would raise; writes are left alone, so the models on that database keep accepting them and the next healthy boot recovers the index in full.",
                  ko: "색인을 만들 때 쓰는 fts5 토크나이저이며, 앱 설정의 database.search.tokenizer가 우선합니다. 값을 바꾸면 다음 부팅에서 미러로부터 색인을 다시 만들고 모델 테이블을 다시 읽지는 않습니다. 다만 이 재생성에는 프로세스 간 클레임이 없어서, 한 번에 재시작한 여러 프로세스가 각자 다시 만듭니다. 미러가 크다면 재시작을 나눠서 하세요. 이 SQLite 빌드가 제공할 수 없는 값이면, 모든 검색이 에러를 내는 서버를 띄우는 대신 부팅을 실패시키고 고칠 방법을 알려줍니다. 이때 쓰기는 그대로라서 해당 데이터베이스의 모델은 계속 쓰기를 받고, 다음 정상 부팅이 색인을 온전히 복구합니다.",
                }),
              },
            ]}
          />
        </Docs.Description>
      </Scroll.Slide>
      <Divider />
      <Scroll.Slide id="env-logging" title={l.trans({ en: "Logging Variables", ko: "로깅 환경변수" })}>
        <Docs.Title>{l.trans({ en: "Logging Variables", ko: "로깅 환경변수" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "The level ladder is trace, verbose, debug, info, warn, error, and three destinations read it independently: the container's stdout, the rotating log file, and any sink the app registered. Everything else here decides how much structure travels with a record and who is allowed to ask for more.",
              ko: "레벨 사다리는 trace, verbose, debug, info, warn, error이고, 세 목적지가 이를 각각 따로 읽습니다. 컨테이너 stdout, 회전 로그 파일, 그리고 앱이 등록한 sink입니다. 나머지 변수들은 레코드에 얼마나 많은 구조가 함께 실려 가는지, 그리고 누가 더 많은 것을 요구할 수 있는지를 정합니다.",
            })}
          </div>
          <Docs.OptionTable
            items={[
              {
                key: "AKAN_PUBLIC_LOG_LEVEL",
                type: "trace | verbose | debug | info | warn | error",
                default: "info",
                desc: l.trans({
                  en: "How much runtime output the console carries. log is a deprecated seventh name that now means info and warns once.",
                  ko: "콘솔에 어느 정도 자세한 런타임 로그를 보낼지 정합니다. log는 폐기된 일곱 번째 이름으로, 지금은 info를 뜻하며 한 번 경고합니다.",
                }),
              },
              {
                key: "AKAN_LOG_STDOUT_LEVEL",
                type: "trace | verbose | debug | info | warn | error",
                default: "AKAN_PUBLIC_LOG_LEVEL",
                desc: l.trans({
                  en: "What goes to the container's stdout, in either format. kubelet and the docker json-file driver rotate container logs by size, so a stdout at trace can outrun the collector; info is the production recommendation, with the flight recorder promoting detail for failed calls only.",
                  ko: "형식과 무관하게 컨테이너 stdout으로 나가는 레벨입니다. kubelet과 docker json-file 드라이버는 컨테이너 로그를 크기로 회전시키므로 trace 수준의 stdout은 수집기보다 빨리 밀려날 수 있습니다. 운영 권장은 info이고, 실패한 호출의 상세는 flight recorder가 올립니다.",
                }),
              },
              {
                key: "AKAN_LOG_FILE_LEVEL",
                type: "trace | verbose | debug | info | warn | error",
                default: "trace",
                desc: l.trans({
                  en: "How much structured Logger output is written to files, independent from the terminal log level.",
                  ko: "파일에 저장할 structured Logger 출력 범위이며, 터미널 로그 레벨과 별도로 동작합니다.",
                }),
              },
              {
                key: "AKAN_LOG_FORMAT",
                type: "text | ndjson | ndjson-only",
                default: "text",
                desc: l.trans({
                  en: "text is the human console line. ndjson makes the container's stdout one JSON record per line, written only by the gateway or the solo replica: every other server process turns its console off and forwards its records instead, and a child's crash stack is wrapped as a raw record so the stream stays valid JSON. ndjson-only writes the rotating file as JSON too. Give every process the same value.",
                  ko: "text는 사람이 읽는 콘솔 줄입니다. ndjson은 컨테이너 stdout을 한 줄에 JSON 레코드 하나로 만들며, gateway(또는 단독 replica)만 씁니다. 다른 모든 서버 프로세스는 콘솔을 끄고 레코드를 위로 올리고, child의 크래시 스택은 raw 레코드로 감싸서 스트림이 항상 유효한 JSON으로 남습니다. ndjson-only는 회전 파일도 JSON으로 씁니다. 모든 프로세스에 같은 값을 줍니다.",
                }),
              },
              {
                key: "AKAN_LOG_TO_FILE",
                type: "0 | 1",
                default: "1",
                desc: l.trans({
                  en: "AkanApp writes gateway and child process logs to runtime/logs by default. Set 0 to disable file logging; the generated Dockerfile sets 0, because a container's writable layer is ephemeral and stdout is the collection path.",
                  ko: "AkanApp은 기본적으로 gateway와 child process 로그를 runtime/logs에 저장합니다. 0으로 두면 파일 로그를 끕니다. 생성되는 Dockerfile은 0을 넣는데, 컨테이너의 쓰기 레이어는 휘발성이고 수집 경로는 stdout이기 때문입니다.",
                }),
              },
              {
                key: "AKAN_LOG_DIR",
                type: "string",
                default: "runtime/logs",
                desc: l.trans({
                  en: "Where file logging writes, when the default directory is not where the volume is mounted.",
                  ko: "볼륨이 기본 디렉터리에 마운트되어 있지 않을 때, 파일 로그가 쓸 경로입니다.",
                }),
              },
              {
                key: "AKAN_LOG_MAX_SIZE_MB",
                type: "number",
                default: "50",
                desc: l.trans({
                  en: "Create the next sequence file when a process log reaches this size.",
                  ko: "프로세스별 로그 파일이 이 크기에 도달하면 다음 sequence 파일을 만듭니다.",
                }),
              },
              {
                key: "AKAN_LOG_MAX_FILES",
                type: "number",
                default: "100",
                desc: l.trans({
                  en: "Keep this many rotated files per process key, such as gateway or child-0.",
                  ko: "gateway 또는 child-0 같은 process key별로 보관할 회전 로그 파일 개수입니다.",
                }),
              },
              {
                key: "AKAN_LOG_CONTEXT",
                type: "0 | 1",
                default: "1",
                desc: l.trans({
                  en: "Every request, websocket call, MCP call, internal trigger and page render runs under a lightweight trace, so its log records carry traceId, endpoint and origin. 0 switches it off. Independent from AKAN_TRACE, which adds span and query aggregation.",
                  ko: "모든 요청, 웹소켓 호출, MCP 호출, 내부 트리거, 페이지 렌더는 가벼운 trace 아래에서 실행되어 로그 레코드에 traceId, 엔드포인트, origin이 붙습니다. 0으로 끕니다. 스팬·쿼리 집계를 켜는 AKAN_TRACE와는 별개입니다.",
                }),
              },
              {
                key: "AKAN_LOG_STREAM",
                type: "0 | 1",
                default: "0",
                desc: l.trans({
                  en: "A child forwards log records to the gateway over IPC only while akan logs or a console .tail is subscribed at that level. 1 keeps forwarding on regardless.",
                  ko: "child는 akan logs나 console .tail이 그 레벨을 구독하는 동안만 IPC로 gateway에 레코드를 올립니다. 1이면 항상 전송합니다.",
                }),
              },
              {
                key: "AKAN_LOG_STREAM_TOKEN",
                type: "string",
                default: l.trans({ en: "unset — route absent", ko: "미설정 — 라우트 없음" }),
                desc: l.trans({
                  en: "Set it and GET /_akan/app/logs serves the ring buffer and live records as text/event-stream to a matching bearer token; the LogQuery is the query string, each event's id is the hub seq, Last-Event-ID resumes and an evicted range arrives as an explicit gap event. Unset, the route does not exist. A session tool for one pod — collection is stdout.",
                  ko: "설정하면 GET /_akan/app/logs가 링 버퍼와 실시간 레코드를 일치하는 bearer 토큰에게 text/event-stream으로 제공합니다. 쿼리스트링이 LogQuery이고, 각 이벤트의 id는 허브 seq이며, Last-Event-ID로 재개하고 밀려난 구간은 명시적인 gap 이벤트로 옵니다. 미설정이면 라우트 자체가 없습니다. pod 하나를 보는 세션 도구이고, 수집은 stdout입니다.",
                }),
              },
              {
                key: "AKAN_LOG_CANONICAL",
                type: "0 | 1 | all | slow",
                default: "0",
                desc: l.trans({
                  en: "One record per call at its end: ok or error, the endpoint, ms, status, userId, and under AKAN_TRACE=1 the db and cache figures. 1 or all writes every call; slow keeps only failed calls and those over AKAN_LOG_FLIGHT_MS. Off by default because it grows with QPS.",
                  ko: "호출이 끝날 때 레코드 하나: ok 또는 error, 엔드포인트, ms, status, userId, 그리고 AKAN_TRACE=1이면 db·cache 수치. 1 또는 all은 모든 호출을, slow는 실패했거나 AKAN_LOG_FLIGHT_MS를 넘은 호출만 씁니다. QPS에 비례해 늘기 때문에 기본은 off입니다.",
                }),
              },
              {
                key: "AKAN_LOG_FLIGHT",
                type: "0 | 1",
                default: "0",
                desc: l.trans({
                  en: "Keeps each call's own last 64 records that fell below the level and promotes them, marked flight=true, only when the call failed or ran past the threshold. Measured cost on a clean call: about 190ns.",
                  ko: "호출마다 레벨 아래로 떨어진 자기 레코드 최근 64건을 들고 있다가, 실패했거나 임계값을 넘긴 경우에만 flight=true로 표시해 올립니다. 정상 호출의 측정 비용은 약 190ns입니다.",
                }),
              },
              {
                key: "AKAN_LOG_FLIGHT_MS",
                type: "number",
                default: "1000",
                desc: l.trans({
                  en: "A call at least this long is slow, for both the flight recorder and the slow canonical mode.",
                  ko: "이 시간 이상 걸린 호출을 느린 호출로 봅니다. flight recorder와 canonical의 slow 모드가 함께 씁니다.",
                }),
              },
              {
                key: "AKAN_LOG_FLIGHT_MAX",
                type: "number",
                default: "65536",
                desc: l.trans({
                  en: "Caps the records the process holds at once; a call past the cap runs unrecorded.",
                  ko: "프로세스가 동시에 들고 있을 레코드 상한이고, 넘치면 그 호출은 기록 없이 진행합니다.",
                }),
              },
              {
                key: "AKAN_LOG_DEBUG_HEADER",
                type: "string",
                default: l.trans({ en: "unset — local only", ko: "미설정 — local에서만" }),
                desc: l.trans({
                  en: "A request carrying x-akan-debug logs at trace for its own duration, whatever the process level. Honoured unconditionally in local; elsewhere only when the header value equals this secret, compared in constant time, because a client that can lower a server's log level is a log-volume vector.",
                  ko: "x-akan-debug 헤더를 단 요청은 프로세스 레벨과 무관하게 자기 구간 동안 trace로 로그를 남깁니다. local에서는 무조건 허용되고, 그 밖에서는 헤더 값이 이 비밀값과 같을 때만(상수 시간 비교) 허용됩니다. 클라이언트가 서버 로그 레벨을 낮출 수 있다는 것은 로그 폭탄 벡터이기 때문입니다.",
                }),
              },
            ]}
          />
          <div>
            {l.trans({
              en: "The ring the gateway (or the solo replica) keeps for akan logs --replay and .trace is not an environment decision: it holds 2,000 records or 4 MB, whichever fills first, and the older record goes first.",
              ko: "gateway(또는 단독 replica)가 akan logs --replay와 .trace를 위해 유지하는 링은 환경변수로 정하지 않습니다. 레코드 2,000건 또는 4MB 중 먼저 차는 쪽까지 보관하고, 오래된 레코드부터 밀려납니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />
      <Scroll.Slide id="get-env" title={l.trans({ en: "getEnv()", ko: "getEnv()" })}>
        <Docs.Title>{l.trans({ en: "getEnv()", ko: "getEnv()" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "getEnv() is the runtime helper that turns .env values into the information your app actually uses. Instead of hand-writing API URLs or WebSocket URLs, app code can read the prepared values from getEnv().",
              ko: "getEnv()는 .env 값을 앱이 실제로 사용할 런타임 정보로 정리해 주는 helper입니다. API URL이나 웹소켓 URL을 직접 조합하지 않고, 앱 코드에서는 getEnv()가 준비한 값을 읽어 사용할 수 있습니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="Using getEnv()"
            code={`import { getEnv } from "akanjs/base";

const env = getEnv();

env.clientHttpUri; // app URL
env.serverHttpUri; // API URL
env.serverWsUri;   // WebSocket URL`}
          />
          <div className="space-y-1">
            <div className={panelRecipe()}>
              <div className="font-bold">{l.trans({ en: "Local mode", ko: "로컬 모드" })}</div>
              <div className="mt-2 text-foreground/70 text-sm leading-relaxed">
                {l.trans({
                  en: "When OPERATION_MODE is local, getEnv() points the browser and API client to your local Akan runtime, usually localhost:8282.",
                  ko: "OPERATION_MODE가 local이면 getEnv()는 브라우저와 API 클라이언트가 내 로컬 Akan 런타임을 바라보도록 합니다. 보통 localhost:8282를 사용합니다.",
                })}
              </div>
              <Code.Snippet
                className="w-full"
                title="local"
                language="bash"
                code={`AKAN_PUBLIC_OPERATION_MODE=local
clientHttpUri=http://localhost:8282
serverHttpUri=http://localhost:8282/api
serverWsUri=ws://localhost:8282`}
              />
            </div>
            <div className={panelRecipe()}>
              <div className="font-bold">{l.trans({ en: "Cloud / edge mode", ko: "클라우드 / 엣지 모드" })}</div>
              <div className="mt-2 text-foreground/70 text-sm leading-relaxed">
                {l.trans({
                  en: "When OPERATION_MODE is cloud or edge, getEnv() builds service URLs from the app name, environment, and serve domain.",
                  ko: "OPERATION_MODE가 cloud 또는 edge이면 getEnv()는 앱 이름, 환경, 서비스 도메인을 조합해 서비스 URL을 만듭니다.",
                })}
              </div>
              <Code.Snippet
                className="w-full"
                title="cloud / edge"
                language="bash"
                code={`AKAN_PUBLIC_APP_NAME=myapp
AKAN_PUBLIC_ENV=main
AKAN_PUBLIC_SERVE_DOMAIN=akanjs.com

serverHttpUri=https://myapp-main.mydomain.com/api
serverWsUri=wss://myapp-main.mydomain.com`}
              />
            </div>
          </div>
          <Docs.Alert type="info">
            {l.trans({
              en: "Use getEnv() when application code needs runtime addresses or environment identity. It keeps URL decisions in one place and makes local, cloud, and edge modes easier to switch.",
              ko: "앱 코드에서 런타임 주소나 환경 식별 정보가 필요할 때는 getEnv()를 사용하세요. URL 결정이 한곳에 모이기 때문에 local, cloud, edge 모드를 더 쉽게 전환할 수 있습니다.",
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />
      <Scroll.Slide id="openapi-json" title={l.trans({ en: "OpenAPI JSON", ko: "OpenAPI JSON" })}>
        <Docs.Title>{l.trans({ en: "OpenAPI JSON", ko: "OpenAPI JSON" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Akan can expose the HTTP query and mutation surface declared in signal files as an OpenAPI 3.1 document. This is useful when you want to connect Swagger, Redoc, external clients, or SDK generation tools to the same API shape Akan already uses.",
              ko: "Akan은 signal 파일에 선언된 HTTP query/mutation 표면을 OpenAPI 3.1 문서로 노출할 수 있습니다. Swagger, Redoc, 외부 클라이언트, SDK 생성 도구를 Akan이 이미 사용하는 API 형태에 연결할 때 유용합니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/myapp/main.ts"
            code={`import { AkanApp } from "akanjs/server/akanApp";

const run = async () => {
  await new AkanApp("./server", { openapi: true }).start();
};
void run();`}
          />
          <div>
            {l.trans({
              en: "After enabling it, request /openapi.json from the app origin. In local mode, the document is usually available at localhost:8282/openapi.json. The normal API prefix stays at /api; OpenAPI JSON is served as a framework metadata route.",
              ko: "활성화한 뒤 앱 origin에서 /openapi.json을 요청하면 됩니다. 로컬 모드에서는 보통 localhost:8282/openapi.json에서 확인할 수 있습니다. 일반 API prefix는 /api를 유지하고, OpenAPI JSON은 프레임워크 메타데이터 route로 제공됩니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="Read the OpenAPI document"
            language="bash"
            code={`curl http://localhost:8282/openapi.json`}
          />
          <div className="space-y-1">
            {[
              {
                title: l.trans({ en: "App option", ko: "앱 옵션" }),
                desc: l.trans({
                  en: "Use this when the app should always expose OpenAPI JSON in that entry point.",
                  ko: "해당 앱 엔트리 포인트에서 항상 OpenAPI JSON을 노출해야 할 때 사용합니다.",
                }),
                value: `new AkanApp("./server", { openapi: true })`,
              },
              {
                title: l.trans({ en: "Environment variable", ko: "환경변수" }),
                desc: l.trans({
                  en: "Use this when deployment or local scripts should decide whether the endpoint is available.",
                  ko: "배포 환경이나 로컬 스크립트에서 endpoint 노출 여부를 결정해야 할 때 사용합니다.",
                }),
                value: "AKAN_OPENAPI=true",
              },
              {
                title: l.trans({ en: "Server option", ko: "서버 옵션" }),
                desc: l.trans({
                  en: "Use this when you start AkanServer directly instead of going through AkanApp.",
                  ko: "AkanApp을 거치지 않고 AkanServer를 직접 시작할 때 사용합니다.",
                }),
                value: `new AkanServer("myapp", env, "all", lib, { openapi: true })`,
              },
            ].map(({ title, desc, value }) => (
              <div key={title} className={panelRecipe()}>
                <div className="font-bold text-foreground">{title}</div>
                <div className="mt-2 text-foreground/70 text-sm leading-relaxed">{desc}</div>
                <div className="mt-3 break-all rounded bg-muted px-2 py-1 font-mono text-foreground/80 text-xs">
                  {value}
                </div>
              </div>
            ))}
          </div>
          <Docs.Alert type="warning">
            {l.trans({
              en: "OpenAPI JSON is opt-in. Enable it only for environments where exposing API structure is acceptable, because it describes routes, request fields, response schemas, and guard metadata.",
              ko: "OpenAPI JSON은 명시적으로 켜야 노출됩니다. route, 요청 필드, 응답 schema, guard 메타데이터를 설명하므로 API 구조 노출이 허용되는 환경에서만 켜세요.",
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />
      <Scroll.Slide id="module-selection" title={l.trans({ en: "Selective Module Boot", ko: "모듈 선택 실행" })}>
        <Docs.Title>{l.trans({ en: "Selective Module Boot", ko: "모듈 선택 실행" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "An app mounts every module its libraries declare. The modules option narrows that: name the modules a process should serve and Akan boots those plus the ones they depend on, leaving the rest out of the container entirely. A module left out has no service, no signal, no route, and no scheduled job. This is how one codebase runs as several small processes, such as a batch worker that only needs its own domain.",
              ko: "앱은 라이브러리가 선언한 모든 모듈을 마운트합니다. modules 옵션은 그 범위를 좁힙니다. 이 프로세스가 담당할 모듈을 지정하면 Akan은 그 모듈과 의존하는 모듈만 부팅하고 나머지는 컨테이너에 아예 올리지 않습니다. 빠진 모듈은 service, signal, route, 예약 작업이 모두 존재하지 않습니다. 하나의 코드베이스를 여러 개의 작은 프로세스로 나눠 실행하는 방법이며, 자기 도메인만 필요한 batch worker 같은 경우에 씁니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/myapp/main.ts"
            code={`import { AkanApp } from "akanjs/server/akanApp";

const run = async () => {
  await new AkanApp("./server", { modules: ["article"] }).start();
};
void run();`}
          />
          <div>
            {l.trans({
              en: "Dependencies are followed for you, so you list entry points instead of the whole graph. A named module pulls in every service and signal it injects, and every model its cascade removes. The boot log prints what was mounted.",
              ko: "의존성은 프레임워크가 따라가므로 전체 그래프가 아니라 진입점만 적으면 됩니다. 지정한 모듈은 자신이 주입하는 service와 signal, 그리고 cascade로 삭제하는 model을 함께 끌어옵니다. 무엇이 마운트되었는지는 부팅 로그에 표시됩니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title={l.trans({ en: "Boot log", ko: "부팅 로그" })}
            language="bash"
            code={`[DiLifecycle] INFO  Mounting 3 of 12 module(s): article, file, user`}
          />
          <div>
            {l.trans({
              en: "disableModules and disableLibs are the same idea from the other end: mount everything except what you name and whatever reaches it. disableModules takes module names, disableLibs takes the name of a library and stands for every module that library registered, so it does not drift as the library gains modules. Reach for either when the process serves most of the app and a library it depends on is one it does not use — server.ts is generated from the dependency graph, so a library cannot be dropped by editing it. Both are accepted in all three places modules is, as AKAN_DISABLE_MODULES and AKAN_DISABLE_LIBS in the environment. Naming a module in both modules and an exclusion leaves it out, because modules says what a process is for and the exclusions say what it must not run.",
              ko: "disableModules와 disableLibs는 같은 발상을 반대편에서 적용합니다. 지정한 대상과 그것을 참조하는 모듈만 빼고 나머지를 전부 마운트합니다. disableModules는 모듈 이름을, disableLibs는 라이브러리 이름을 받아 그 라이브러리가 등록한 모듈 전부를 뜻하므로 라이브러리에 모듈이 추가되어도 목록이 어긋나지 않습니다. 프로세스가 앱 대부분을 담당하는데 의존하는 라이브러리 중 쓰지 않는 것이 있을 때 씁니다. server.ts는 의존성 그래프에서 생성되므로 파일을 고쳐서 라이브러리를 뺄 수는 없습니다. 둘 다 modules와 같은 세 곳에서 쓸 수 있고, 환경변수 이름은 AKAN_DISABLE_MODULES와 AKAN_DISABLE_LIBS입니다. modules와 제외 옵션에 같은 모듈을 적으면 빠집니다. modules는 이 프로세스가 무엇을 위한 것인지를, 제외 옵션은 무엇을 실행하면 안 되는지를 말하기 때문입니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/myapp/main.ts"
            code={`import { AkanApp } from "akanjs/server/akanApp";

const run = async () => {
  await new AkanApp("./server", { disableLibs: ["social"], disableModules: ["legacyImport"] }).start();
};
void run();`}
          />
          <Code.Snippet
            className="w-full"
            title={l.trans({ en: "Boot log", ko: "부팅 로그" })}
            language="bash"
            code={`[DiLifecycle] INFO  disableModules/disableLibs also dropped 2 dependent module(s): digest, notification`}
          />
          <div className="space-y-1">
            {[
              {
                title: l.trans({ en: "App option", ko: "앱 옵션" }),
                desc: l.trans({
                  en: "Use this when the entry point itself decides which modules the process serves. Every replica it spawns gets the same selection.",
                  ko: "이 엔트리 포인트가 담당할 모듈을 코드에서 정할 때 사용합니다. 여기서 생성되는 모든 replica가 같은 선택을 받습니다.",
                }),
                value: `new AkanApp("./server", { modules: ["article"] })`,
              },
              {
                title: l.trans({ en: "Environment variable", ko: "환경변수" }),
                desc: l.trans({
                  en: "Use this when deployment decides the split, so one image can run as different processes without a second entry point.",
                  ko: "배포 환경에서 분리 방식을 정할 때 사용합니다. 엔트리 포인트를 새로 만들지 않고 같은 이미지를 다른 프로세스로 실행할 수 있습니다.",
                }),
                value: "AKAN_MODULES=article,file",
              },
              {
                title: l.trans({ en: "Server option", ko: "서버 옵션" }),
                desc: l.trans({
                  en: "Use this when you start AkanServer directly instead of going through AkanApp.",
                  ko: "AkanApp을 거치지 않고 AkanServer를 직접 시작할 때 사용합니다.",
                }),
                value: `new AkanServer("myapp", env, "all", lib, { modules: ["article"] })`,
              },
            ].map(({ title, desc, value }) => (
              <div key={title} className={panelRecipe()}>
                <div className="font-bold text-foreground">{title}</div>
                <div className="mt-2 text-foreground/70 text-sm leading-relaxed">{desc}</div>
                <div className="mt-3 break-all rounded bg-muted px-2 py-1 font-mono text-foreground/80 text-xs">
                  {value}
                </div>
              </div>
            ))}
          </div>
          <Docs.Alert type="warning">
            {l.trans({
              en: "An unregistered name fails the boot instead of being ignored, in all three options: a typo in modules quietly drops a module, and a typo in an exclusion quietly keeps one running. Selection narrows the enabled set rather than replacing it, so it never turns on a module whose service is disabled. A module that reaches a disabled one goes with it, and the boot log names the ones you did not ask for. Endpoints of a module left out do not exist, so a client that calls one gets a 404.",
              ko: "등록되지 않은 이름은 세 옵션 모두 무시되지 않고 부팅을 실패시킵니다. modules의 오타는 모듈을 조용히 빠뜨리고, 제외 옵션의 오타는 모듈을 조용히 남겨두기 때문입니다. 선택은 활성화된 모듈 집합을 좁힐 뿐이라 service가 비활성화된 모듈을 켜지는 않습니다. 빠진 모듈을 참조하는 모듈은 함께 빠지며, 직접 지정하지 않은 것들은 부팅 로그에 이름이 남습니다. 빠진 모듈의 endpoint는 존재하지 않으므로 클라이언트가 호출하면 404가 됩니다.",
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />
      <Scroll.Slide
        id="health-metrics-logs"
        title={l.trans({ en: "Health, Metrics, Logs", ko: "상태 확인, 메트릭, 로그" })}
      >
        <Docs.Title>{l.trans({ en: "Health, Metrics, Logs", ko: "상태 확인, 메트릭, 로그" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Akan runtime exposes simple ways to check whether the app is alive, how busy it is, and what it is doing. In local development, these are mostly useful when a page does not load or a background job seems stuck.",
              ko: "Akan 런타임은 앱이 살아있는지, 얼마나 바쁜지, 지금 무엇을 하고 있는지 확인할 수 있는 간단한 방법을 제공합니다. 로컬 개발에서는 페이지가 열리지 않거나 백그라운드 작업이 멈춘 것처럼 보일 때 유용합니다.",
            })}
          </div>
          <div className="space-y-1">
            <div className={panelRecipe({ padding: "row" })}>
              <div className="font-bold">{l.trans({ en: "Health", ko: "상태 확인" })}</div>
              <div className="mt-2 text-foreground/70 text-sm leading-relaxed">
                {l.trans({
                  en: "Use this to check whether the server processes are running and ready. A solo replica answers it itself, in the same shape the gateway uses, so a probe reads one contract either way.",
                  ko: "서버 프로세스가 실행 중이고 준비되었는지 확인할 때 사용합니다. solo replica는 gateway와 같은 형태로 직접 응답하므로, probe는 두 경우 모두 같은 형식을 읽습니다.",
                })}
              </div>
              <Code.Snippet
                className="w-full"
                title="health"
                language="bash"
                code={`curl http://localhost:8282/_akan/app/health`}
              />
            </div>
            <div className={panelRecipe({ padding: "row" })}>
              <div className="font-bold">{l.trans({ en: "Metrics", ko: "메트릭" })}</div>
              <div className="mt-2 text-foreground/70 text-sm leading-relaxed">
                {l.trans({
                  en: "Use this to see runtime counts such as active requests, WebSocket connections, rooms, and process metrics.",
                  ko: "활성 요청, 웹소켓 연결, room, 프로세스 지표 같은 런타임 수치를 확인할 때 사용합니다.",
                })}
              </div>
              <Code.Snippet
                className="w-full"
                title="metrics"
                language="bash"
                code={`curl http://localhost:8282/_akan/app/metrics`}
              />
            </div>
            <div className={panelRecipe({ padding: "row" })}>
              <div className="font-bold">{l.trans({ en: "Logs", ko: "로그" })}</div>
              <div className="mt-2 text-foreground/70 text-sm leading-relaxed">
                {l.trans({
                  en: "Use AKAN_PUBLIC_LOG_LEVEL to choose how much detail appears in the terminal. AkanApp also stores gateway and child process output in runtime/logs by default, using AKAN_LOG_FILE_LEVEL for structured Logger output and rotating files by date and size.",
                  ko: "터미널에 어느 정도 자세한 로그를 볼지는 AKAN_PUBLIC_LOG_LEVEL로 조절합니다. AkanApp은 기본적으로 gateway와 child process 출력을 runtime/logs에 저장하며, structured Logger 출력은 AKAN_LOG_FILE_LEVEL 기준으로 저장하고 날짜와 크기 기준으로 파일을 회전합니다.",
                })}
              </div>
              <Code.Snippet
                className="w-full"
                title="logs"
                language="bash"
                code={`AKAN_PUBLIC_LOG_LEVEL=debug
AKAN_LOG_FILE_LEVEL=trace
AKAN_MEMORY_LOG=1
AKAN_LOG_MAX_SIZE_MB=50
AKAN_LOG_MAX_FILES=100`}
              />
              <div className="mt-2 text-foreground/70 text-sm leading-relaxed">
                {l.trans({
                  en: "File names include app name, environment, operation mode, local date, process key, and sequence. Direct console.log calls from child servers are captured through stdout/stderr pipes; direct gateway console.log calls are not part of Logger sink capture.",
                  ko: "파일명에는 app name, environment, operation mode, 로컬 날짜, process key, sequence가 포함됩니다. child server의 직접 console.log 호출은 stdout/stderr pipe를 통해 저장되지만, gateway process의 직접 console.log 호출은 Logger sink 캡처 대상이 아닙니다.",
                })}
              </div>
            </div>
          </div>
          <Docs.Mermaid
            title="Runtime checks"
            chart={`flowchart LR
  developer[Developer] --> gateway["Akan App<br/>(gateway or solo)"]
  gateway --> health["/_akan/app/health"]
  gateway --> metrics["/_akan/app/metrics"]
  gateway --> logs["Terminal Logs"]
  health --> status["Running / Ready"]
  metrics --> numbers["Requests, Sockets, Memory"]
  logs --> details["Debug Details"]`}
          />
          <Docs.Alert type="info">
            {l.trans({
              en: "Start with health when the app does not respond. Use metrics when the app responds but feels busy. Increase LOG_LEVEL or enable AKAN_MEMORY_LOG when you need more terminal detail.",
              ko: "앱이 응답하지 않으면 먼저 health를 확인하세요. 응답은 하지만 바빠 보이면 metrics를 확인합니다. 더 자세한 터미널 정보가 필요할 때는 LOG_LEVEL을 올리거나 AKAN_MEMORY_LOG를 켭니다.",
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <DocsToc />
    </Scroll>
  );
});
