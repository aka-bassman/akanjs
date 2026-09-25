import { usePage } from "@apps/akan/client";
import { badgeRecipe, Code, cardGridRecipe, Divider, Docs, DocsToc, panelRecipe } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();

  const chip = "rounded-md bg-muted/60 px-2 py-0.5 font-mono text-foreground/80 text-xs";

  const areaRows = [
    {
      name: "Local",
      desc: l.trans({
        en: "Your own machine, for fast iteration: MVP screens, feature prototypes and debugging.",
        ko: "내 PC입니다. MVP 화면, 기능 프로토타입, 디버깅처럼 빠르게 만들고 확인할 때 씁니다.",
      }),
    },
    {
      name: "Cloud Cluster",
      desc: l.trans({
        en: "A Kubernetes runtime for shared team environments and production-like workloads.",
        ko: "팀 공용 환경과 운영에 가까운 워크로드를 위한 Kubernetes 기반 실행 환경입니다.",
      }),
    },
    {
      name: "Master",
      desc: l.trans({
        en: "The deployment control area: CI/CD, environment files, secrets and release automation.",
        ko: "배포 제어 영역입니다. CI/CD, 환경 파일, 비밀값, 릴리스 자동화를 관리합니다.",
      }),
    },
  ];

  const termRows = [
    {
      name: "container",
      desc: l.trans({
        en: "The app packaged with everything it needs, so it starts the same way on any server.",
        ko: "앱과 실행에 필요한 것을 한 묶음으로 포장한 것입니다. 어느 서버에서나 같은 방식으로 실행됩니다.",
      }),
    },
    {
      name: "pod",
      desc: l.trans({
        en: "Kubernetes's unit of running: one or more containers placed together on one server (a node).",
        ko: "Kubernetes가 실행하는 단위입니다. 서버(node) 하나에 함께 올라가는 컨테이너 한 개 이상의 묶음입니다.",
      }),
    },
    {
      name: "Ingress",
      desc: l.trans({
        en: "The cluster's front door. It takes outside traffic for a domain and routes it inward.",
        ko: "클러스터의 정문입니다. 도메인으로 들어온 외부 트래픽을 받아 안쪽으로 보냅니다.",
      }),
    },
    {
      name: "Service",
      desc: l.trans({
        en: "A stable address inside the cluster that forwards to whichever pods run the app.",
        ko: "클러스터 안의 고정 주소입니다. 앱을 실행 중인 pod로 요청을 넘겨 줍니다.",
      }),
    },
    {
      name: "chart",
      desc: l.trans({
        en: "A Helm package of Kubernetes manifests. The one Akan ships lives in infra/app.",
        ko: "Kubernetes 매니페스트를 묶은 Helm 패키지입니다. Akan이 제공하는 차트는 infra/app에 있습니다.",
      }),
    },
    {
      name: "WAL",
      desc: l.trans({
        en: "SQLite's write-ahead log mode, which lets reads keep going while a write is in progress.",
        ko: "SQLite의 write-ahead log 모드입니다. 쓰기가 진행되는 동안에도 읽기가 계속될 수 있게 합니다.",
      }),
    },
  ];

  const situations = [
    {
      title: l.trans({ en: "MVP or feature prototype", ko: "MVP 또는 기능 프로토타입" }),
      pick: l.trans({ en: "Local", ko: "로컬" }),
      desc: l.trans({
        en: "Use local development first. Keep the setup small until the product needs shared data, shared testing, or deployment automation.",
        ko: "먼저 로컬 개발을 사용합니다. 제품에 공용 데이터, 팀 테스트, 배포 자동화가 필요해질 때까지 구성을 작게 유지합니다.",
      }),
    },
    {
      title: l.trans({ en: "Team QA or staging", ko: "팀 QA 또는 스테이징" }),
      pick: l.trans({ en: "Cloud · debug / develop", ko: "클라우드 · debug / develop" }),
      desc: l.trans({
        en: "Use cloud deployment with debug or develop environments so the team can test the same service together.",
        ko: "debug 또는 develop 환경의 클라우드 배포를 사용해 팀이 같은 서비스를 함께 검증할 수 있게 합니다.",
      }),
    },
    {
      title: l.trans({ en: "Production service", ko: "운영 서비스" }),
      pick: l.trans({ en: "Cloud · main", ko: "클라우드 · main" }),
      desc: l.trans({
        en: "Use the main branch of the same cloud deployment. The shipped chart runs one pod per app, so plan the database and cache layer before traffic outgrows it.",
        ko: "같은 클라우드 배포의 main branch를 사용합니다. 제공되는 차트는 앱당 pod 하나를 실행하므로, 트래픽이 그 한계를 넘기 전에 데이터베이스와 캐시 계층을 먼저 계획해야 합니다.",
      }),
    },
  ];

  const requestRows = [
    {
      name: "Page",
      desc: l.trans({
        en: "An SSR or CSR page response for browser users.",
        ko: "브라우저 사용자를 위한 SSR 또는 CSR 페이지 응답입니다.",
      }),
    },
    {
      name: "API",
      desc: l.trans({
        en: "A business operation, run through signal and service logic.",
        ko: "signal과 service 로직을 거치는 비즈니스 작업입니다.",
      }),
    },
    {
      name: "WebSocket",
      desc: l.trans({
        en: "Realtime updates over a client connection that stays open.",
        ko: "계속 열려 있는 클라이언트 연결로 주고받는 실시간 업데이트입니다.",
      }),
    },
    {
      name: "Asset",
      desc: l.trans({
        en: "Static files, client bundles, images and generated output, served as files.",
        ko: "정적 파일, 클라이언트 번들, 이미지, 생성 산출물을 파일 그대로 응답합니다.",
      }),
    },
  ];

  const modeColumns = [
    { key: "mode", label: l.trans({ en: "Mode", ko: "모드" }), code: true },
    { key: "database", label: l.trans({ en: "Database", ko: "데이터베이스" }), code: true },
    { key: "queue", label: l.trans({ en: "Queue / PubSub", ko: "큐 / PubSub" }) },
    { key: "cache", label: l.trans({ en: "Cache", ko: "캐시" }) },
  ];
  const modeRows = [
    {
      mode: "single",
      database: "SQLite",
      queue: l.trans({ en: "SQLite based, Bun IPC accelerated", ko: "SQLite 기반, Bun IPC 가속 처리" }),
      cache: l.trans({ en: "SQLite key-value cache", ko: "SQLite 기반 키-값 캐시" }),
    },
    { mode: "multiple", database: "libsql", queue: "Redis", cache: "Redis" },
    { mode: "cluster", database: "Postgres", queue: "Redis", cache: "Redis" },
  ];
  const modeUseRows = [
    {
      name: "single",
      desc: (
        <>
          <div>
            {l.trans({
              en: "The best start for MVPs, internal tools, admin pages, content sites and small-to-medium services.",
              ko: "MVP, 초기 내부 도구, 관리자 화면, 콘텐츠 사이트, 많은 중소규모 서비스의 출발점으로 가장 적합합니다.",
            })}
          </div>
          <div className="font-medium text-foreground">
            →{" "}
            {l.trans({
              en: "Enough for most products under roughly 10k DAU, especially with WAL mode.",
              ko: "WAL 모드 기준으로 DAU 약 1만 명 이하의 웬만한 제품에는 충분한 성능입니다.",
            })}
          </div>
        </>
      ),
    },
    {
      name: "multiple",
      desc: (
        <>
          <div>
            {l.trans({
              en: "When you need a separate cache, pub/sub, queue-like work, or realistic service boundaries.",
              ko: "분리된 캐시, pub/sub, 큐성 작업, 더 현실적인 서비스 경계가 필요해질 때 씁니다.",
            })}
          </div>
          <div className="font-medium text-foreground">
            →{" "}
            {l.trans({
              en: "Cache and background work are separated, while staying lighter than cluster storage.",
              ko: "클러스터형 저장소보다 가볍게 유지하면서 캐시와 백그라운드 작업을 분리합니다.",
            })}
          </div>
        </>
      ),
    },
    {
      name: "cluster",
      desc: (
        <>
          <div>
            {l.trans({
              en: "When local runs should match the production cluster, or you need heavier relational storage.",
              ko: "로컬 동작을 운영 클러스터와 비슷하게 맞추고 싶거나, 더 무거운 관계형 영속성이 필요할 때 씁니다.",
            })}
          </div>
          <div className="font-medium text-foreground">
            →{" "}
            {l.trans({
              en: "The most production-like mode, for heavier concurrent work and cluster validation.",
              ko: "가장 운영에 가까운 모드입니다. 무거운 동시 처리와 클러스터 지향 검증에 맞습니다.",
            })}
          </div>
        </>
      ),
    },
  ];

  const stableBadge = (
    <span className={badgeRecipe({ variant: "success", size: "sm" })}>{l.trans({ en: "Stable", ko: "안정" })}</span>
  );
  const experimentalBadge = (
    <span className={badgeRecipe({ variant: "warning", size: "sm" })}>
      {l.trans({ en: "Experimental", ko: "실험적" })}
    </span>
  );

  const stageColumns = [
    { key: "stage", label: l.trans({ en: "Stage", ko: "단계" }) },
    { key: "servers", label: l.trans({ en: "Servers", ko: "서버" }) },
    { key: "containers", label: l.trans({ en: "Containers", ko: "컨테이너" }) },
    { key: "mode", label: l.trans({ en: "Database mode", ko: "데이터베이스 모드" }), code: true },
  ];
  const stageRows = [
    {
      stage: (
        <span className="flex flex-wrap items-center gap-2">
          {l.trans({ en: "1. Single server", ko: "1. 싱글 서버" })}
          {stableBadge}
        </span>
      ),
      servers: l.trans({ en: "one", ko: "1대" }),
      containers: l.trans({ en: "one", ko: "1개" }),
      mode: "single",
    },
    {
      stage: (
        <span className="flex flex-wrap items-center gap-2">
          {l.trans({ en: "2. Multiple containers", ko: "2. 다중 컨테이너" })}
          {experimentalBadge}
        </span>
      ),
      servers: l.trans({ en: "one", ko: "1대" }),
      containers: l.trans({ en: "several", ko: "여러 개" }),
      mode: "multiple / cluster",
    },
    {
      stage: (
        <span className="flex flex-wrap items-center gap-2">
          {l.trans({ en: "3. Cloud cluster", ko: "3. 클라우드 클러스터" })}
          {experimentalBadge}
        </span>
      ),
      servers: l.trans({ en: "several", ko: "여러 대" }),
      containers: l.trans({ en: "several", ko: "여러 개" }),
      mode: "cluster",
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="infra-overview" title={l.trans({ en: "Infra Architecture", ko: "인프라 아키텍처" })}>
        <Docs.Title>{l.trans({ en: "Infra Architecture", ko: "인프라 아키텍처" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "The business code you write is the same wherever it runs. What changes between a laptop and a cloud is everything around it: where traffic enters, where the app runs, and how data and deployments are managed. That surrounding layer is what this page calls infrastructure.",
              ko: "내가 쓴 비즈니스 코드는 어디서 실행되든 똑같습니다. 내 PC와 클라우드 사이에서 달라지는 것은 그 둘레입니다. 트래픽이 어디로 들어오는지, 앱이 어디서 실행되는지, 데이터와 배포를 어떻게 관리하는지요. 이 페이지는 그 둘레를 인프라라고 부릅니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "Akan apps run on a developer machine or in a cloud cluster, and the same application code is packaged for both. The infrastructure falls into three areas:",
              ko: "Akan 앱은 개발자 PC 또는 클라우드 클러스터에서 실행되고, 같은 애플리케이션 코드를 두 환경에 맞게 패키징합니다. 인프라는 세 영역으로 나뉩니다:",
            })}
          </div>
          <Docs.IntroTable type={l.trans({ en: "Area", ko: "영역" })} items={areaRows} />
          <Docs.Figure
            title={l.trans({ en: "Infrastructure shape", ko: "인프라 형태" })}
            image="infra-shape"
            prompt={`
              Left to right, joined by long arrows. A person seated behind a laptop at the far left, labelled
              "Developer". A small square box holding a gear and a small key, left of centre, labelled "Master" with a
              smaller second line "ci/cd · env · secrets". A large cloud outline spanning the middle and right of the
              frame, labelled "Cloud Cluster". Inside the cloud, three containers side by side, their outlines traced as
              the red accent, labelled once "Akan App Runtime". At the right edge, just outside the cloud, a browser and
              a phone standing together, labelled once "Users". Arrows run from the developer to the master box, from
              the master box into the cloud, and from the cloud out to the browser and phone.
            `}
            alt={l.trans({
              en: "A developer ships through the master infra — CI/CD, environment files and secrets — into a cloud cluster, where the Akan app runtime serves users and their devices.",
              ko: "개발자가 마스터 인프라(CI/CD, 환경 파일, 비밀값)를 거쳐 클라우드 클러스터로 배포하고, 그 안의 Akan 앱 런타임이 사용자와 기기를 응대합니다.",
            })}
          />
          <Docs.SubSubTitle>{l.trans({ en: "Words used on this page", ko: "이 페이지에서 쓰는 말" })}</Docs.SubSubTitle>
          <Docs.IntroTable type={l.trans({ en: "Term", ko: "용어" })} items={termRows} />
          <Docs.Alert type="info">
            {l.trans({
              en: (
                <span>
                  <strong>There is no edge infrastructure to set up.</strong> edge is an operation mode an app can be
                  built and run in, and an endpoint can be scoped to it, but Akan ships no edge infrastructure: infra/
                  carries the cluster chart and the deployment control area only. An on-site deployment is yours to
                  build.
                </span>
              ),
              ko: (
                <span>
                  <strong>따로 준비된 엣지 인프라는 없습니다.</strong> edge는 앱을 빌드하고 실행할 수 있는 operation
                  mode이고 endpoint를 그 모드로 한정할 수도 있지만, Akan이 제공하는 엣지 인프라는 없습니다. infra/에는
                  클러스터 차트와 배포 제어 영역만 들어 있습니다. 현장 배포 구성은 직접 만들어야 합니다.
                </span>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide
        id="choose-option"
        title={l.trans({ en: "Which Option Should I Use?", ko: "어떤 구성을 선택할까?" })}
      >
        <Docs.Title>{l.trans({ en: "Which Option Should I Use?", ko: "어떤 구성을 선택할까?" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Start from the product situation, not from the infrastructure name. A small internal tool, a team QA environment and a production service need different levels of infrastructure, so start from the one that describes where you are today:",
              ko: "인프라 이름보다 제품 상황에서 먼저 출발하세요. 작은 내부 도구, 팀 QA 환경, 운영 서비스는 서로 다른 수준의 인프라가 필요합니다. 지금 내 상황에 맞는 칸을 찾으면 됩니다:",
            })}
          </div>
          <div className="my-4 space-y-3">
            {situations.map(({ title, pick, desc }) => (
              <div key={title} className={panelRecipe({ radius: "lg", padding: "sm" })}>
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-primary">{title}</span>
                  <span className={chip}>→ {pick}</span>
                </div>
                <div className="text-foreground/70 text-sm">{desc}</div>
              </div>
            ))}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="traffic-flow" title={l.trans({ en: "How Traffic Moves", ko: "트래픽 흐름" })}>
        <Docs.Title>{l.trans({ en: "How Traffic Moves", ko: "트래픽 흐름" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Infrastructure does not change the business code inside your app. It decides how a request reaches the Akan runtime. The path is simple on your laptop and goes through a structured layer in a cloud cluster.",
              ko: "인프라는 앱 내부의 비즈니스 코드를 바꾸지 않습니다. 대신 요청이 어떤 경로로 Akan 런타임에 도착할지를 결정합니다. 내 PC에서는 경로가 단순하고, 클라우드 클러스터에서는 구조화된 계층을 거칩니다.",
            })}
          </div>
          <Docs.Flow
            title={l.trans({ en: "Request paths", ko: "요청 경로" })}
            direction="TB"
            nodes={{
              browser: { label: l.trans({ en: "Browser Or Device", ko: "브라우저 또는 기기" }) },
              domain: { label: l.trans({ en: "Domain Or Local Address", ko: "도메인 또는 로컬 주소" }) },
              local: { label: l.trans({ en: "Local Dev Server", ko: "로컬 개발 서버" }) },
              ingress: { label: l.trans({ en: "Cloud Ingress", ko: "클라우드 Ingress" }) },
              service: { label: l.trans({ en: "Kubernetes Service", ko: "Kubernetes Service" }) },
              runtime: { label: l.trans({ en: "Akan App Runtime", ko: "Akan 앱 런타임" }) },
              response: {
                label: l.trans({ en: "Page · API · WebSocket · Asset", ko: "페이지 · API · 웹소켓 · 에셋" }),
              },
            }}
            edges={[
              ["browser", "domain"],
              ["domain", "local"],
              ["domain", "ingress"],
              ["local", "runtime"],
              ["ingress", "service"],
              ["service", "runtime"],
              ["runtime", "response"],
            ]}
          />
          <div className={cardGridRecipe({ cols: "mdTwo" }, "my-4")}>
            <div className={panelRecipe({ radius: "lg", padding: "sm" })}>
              <div className="mb-1 font-semibold text-primary">{l.trans({ en: "Local path", ko: "로컬 경로" })}</div>
              <div className="text-foreground/70 text-sm">
                {l.trans({
                  en: "A developer opens localhost and talks almost directly to the Akan dev runtime. This is the fastest path for building screens and checking business flows.",
                  ko: "개발자는 localhost로 접속하고 Akan 개발 런타임에 거의 직접 연결됩니다. 화면을 만들고 비즈니스 흐름을 확인하기에 가장 빠른 경로입니다.",
                })}
              </div>
            </div>
            <div className={panelRecipe({ radius: "lg", padding: "sm" })}>
              <div className="mb-1 font-semibold text-primary">
                {l.trans({ en: "Cloud path", ko: "클라우드 경로" })}
              </div>
              <div className="text-foreground/70 text-sm">
                {l.trans({
                  en: "A user enters through a public domain. Kubernetes Ingress receives the request, Service finds the right app pod, and the Akan runtime handles the actual page or API response.",
                  ko: "사용자는 공개 도메인으로 들어옵니다. Kubernetes Ingress가 요청을 받고, Service가 적절한 앱 pod를 찾은 뒤, Akan 런타임이 실제 페이지나 API 응답을 처리합니다.",
                })}
              </div>
            </div>
          </div>
          <div>
            {l.trans({
              en: "Once a request reaches the Akan App Runtime, the runtime sorts it by kind of work. Each kind gets its own kind of answer:",
              ko: "요청이 Akan App Runtime에 도착하면 런타임은 어떤 종류의 작업인지 분류합니다. 종류마다 응답하는 방식이 다릅니다:",
            })}
          </div>
          <Docs.IntroTable type={l.trans({ en: "Request", ko: "요청 종류" })} items={requestRows} />
          <Docs.Alert type="info">
            {l.trans({
              en: (
                <span>
                  <strong>Key idea:</strong> infrastructure chooses the route into the app, not the business behavior
                  inside the app. The local and cloud paths look different, but both eventually hand work to the same
                  Akan runtime.
                </span>
              ),
              ko: (
                <span>
                  <strong>핵심:</strong> 인프라는 앱 안의 비즈니스 동작을 바꾸는 것이 아니라 앱으로 들어오는 경로를
                  선택합니다. 로컬 경로와 클라우드 경로는 서로 다르게 보이지만 결국 같은 Akan 런타임에 작업을
                  전달합니다.
                </span>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="database-mode" title={l.trans({ en: "Database Mode", ko: "데이터베이스 모드" })}>
        <Docs.Title>{l.trans({ en: "Database Mode", ko: "데이터베이스 모드" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Besides the app itself, a service needs somewhere to keep data, a queue for background work and a cache. The database mode decides which engine fills each of those three roles.",
              ko: "앱 말고도 서비스에는 데이터를 저장할 곳, 백그라운드 작업을 위한 큐, 그리고 캐시가 필요합니다. 데이터베이스 모드는 이 세 역할을 각각 어떤 엔진이 맡을지 정합니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "Start with single mode. Most services do not need a separate database cluster on day one. When real performance limits, queue needs or multi-instance operation appear, move up to multiple or cluster mode without changing the business shape of the app.",
              ko: "처음에는 single 모드로 시작하세요. 대부분의 서비스는 첫날부터 별도 데이터베이스 클러스터가 필요하지 않습니다. 실제 성능 한계, 큐 처리, 다중 인스턴스 운영 요구가 생기면 앱의 비즈니스 구조를 바꾸지 않고 multiple 또는 cluster 모드로 올리면 됩니다.",
            })}
          </div>
          <Docs.Table columns={modeColumns} rows={modeRows} />
          <Docs.Alert type="info">
            {l.trans({
              en: (
                <span>
                  <strong>SQLite is not only for toys.</strong> It is the default database in single mode, and with WAL
                  mode its practical performance is very strong. For many ordinary services under about 10,000 DAU,
                  single mode is usually enough until real usage data proves otherwise.
                </span>
              ),
              ko: (
                <span>
                  <strong>SQLite는 장난감 서비스용이 아닙니다.</strong> single 모드의 기본 데이터베이스는 SQLite이고,
                  WAL 모드를 기본 지원하기 때문에 실제 성능은 상당히 좋습니다. DAU 1만 명 이하의 웬만한 일반 서비스는
                  실제 사용 데이터가 병목을 증명하기 전까지 single 모드로도 충분한 경우가 많습니다.
                </span>
              ),
            })}
          </Docs.Alert>
          <Docs.SubSubTitle>{l.trans({ en: "When to pick each mode", ko: "모드마다 언제 고르는가" })}</Docs.SubSubTitle>
          <Docs.IntroTable
            type={l.trans({ en: "Mode", ko: "모드" })}
            descLabel={l.trans({ en: "When → what you get", ko: "언제 → 얻는 것" })}
            items={modeUseRows}
          />
          <div>
            {l.trans({
              en: "The default mode lives in akan.config.ts:",
              ko: "기본 모드는 akan.config.ts에 적습니다:",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="akan.config.ts"
            code={`const config: AppConfig = {
  defaultDatabaseMode: "single",
};`}
          />
          <div>
            {l.trans({
              en: "multiple and cluster need their database and Redis running beside the app on your machine. akan dbup starts the local database for the mode you name:",
              ko: "multiple과 cluster는 내 PC에서 앱 옆에 데이터베이스와 Redis가 떠 있어야 합니다. akan dbup은 지정한 모드의 로컬 데이터베이스를 띄웁니다:",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="Local database commands"
            language="bash"
            code={`akan dbup --mode multiple
akan dbup --mode cluster`}
          />
          <Docs.Alert>
            {l.trans({
              en: (
                <span>
                  <strong>Do not upgrade just because it feels safer.</strong> Stay on single until you see real needs
                  such as Redis-backed pub/sub, separate queue/cache behavior, heavier concurrent writes, or a
                  deployment shape that must resemble production.
                </span>
              ),
              ko: (
                <span>
                  <strong>막연히 더 안전해 보인다는 이유로 올리지 마세요.</strong> Redis 기반 pub/sub, 분리된 큐/캐시
                  동작, 더 무거운 동시 쓰기, 운영과 비슷한 배포 검증이 실제로 필요해질 때까지 single을 유지하면 됩니다.
                </span>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="growth-stage" title={l.trans({ en: "Growth Stages", ko: "성장 단계" })}>
        <Docs.Title>{l.trans({ en: "Growth Stages", ko: "성장 단계" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Infrastructure does not need to start big. A business can begin with one server and one container, then grow step by step as traffic and reliability requirements increase. The three stages at a glance:",
              ko: "인프라는 처음부터 크게 시작할 필요가 없습니다. 비즈니스는 서버 하나와 컨테이너 하나로 시작하고, 트래픽과 안정성 요구가 커질 때 단계적으로 확장하면 됩니다. 세 단계를 한눈에 보면 이렇습니다:",
            })}
          </div>
          <Docs.Table columns={stageColumns} rows={stageRows} />
          <div>
            {l.trans({
              en: "Stage 1 is stable. Stages 2 and 3 are experimental: they describe where the shape goes next, not a chart you can apply today.",
              ko: "1단계는 안정화되어 있습니다. 2, 3단계는 실험적입니다. 구조가 어디로 가는지를 설명할 뿐, 지금 바로 적용할 수 있는 차트가 아닙니다.",
            })}
          </div>
          <div className="my-4 space-y-3">
            <div className={panelRecipe({}, "gap-2 lg:grid")}>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 font-bold text-foreground">
                  {l.trans({ en: "1. Single server", ko: "1. 싱글 서버" })}
                  {stableBadge}
                </div>
                <div className="text-foreground/70 text-sm">
                  {l.trans({
                    en: "A small product, MVP, internal tool or early admin page runs on one server with one Akan container. That single container serves the database, API, web, CSR, image optimization, cache and queue, and single database mode is usually enough.",
                    ko: "작은 제품, MVP, 내부 도구, 초기 관리자 화면은 서버 하나와 Akan 컨테이너 하나로 충분히 운영할 수 있습니다. 컨테이너 하나가 데이터베이스, API, 웹, CSR, 이미지 최적화, 캐시, 큐를 모두 처리하고, 데이터베이스도 보통 single 모드면 충분합니다.",
                  })}
                </div>
                <div className="text-foreground/70 text-sm">
                  {l.trans({
                    en: "The chart asks a debug or develop pod for 0.05 CPU and 250M, capped at 0.5 CPU and 1G.",
                    ko: "차트는 debug/develop pod에 0.05 CPU와 250M을 요청하고, 상한을 0.5 CPU, 1G로 둡니다.",
                  })}
                </div>
              </div>
              <Docs.Figure
                className="col-span-2"
                title={l.trans({ en: "1. Single server", ko: "1. 싱글 서버" })}
                image="infra-stage-single"
                prompt={`
                  A person at the far left labelled "Users", with one arrow into one server drawn large in the centre,
                  about two thirds of the frame tall, labelled "Single Server". Inside the server, one container drawn
                  as a big square, its outline traced as the red accent, labelled "Akan Runtime Container". Inside the
                  container, three small shapes in a row, not joined to each other: a database cylinder labelled "SQLite
                  WAL", a cache labelled "Local Cache", a queue labelled "Local Queue".
                `}
                alt={l.trans({
                  en: "Users reach one server that holds one Akan runtime container, and SQLite WAL storage, the local cache and the local queue all live inside that container.",
                  ko: "사용자는 서버 한 대에 닿고, 그 서버에는 Akan 런타임 컨테이너 하나가 있으며 SQLite WAL 스토리지, 로컬 캐시, 로컬 큐가 모두 그 컨테이너 안에 있습니다.",
                })}
              />
            </div>

            <div className={panelRecipe({}, "gap-2 lg:grid")}>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 font-bold text-foreground">
                  {l.trans({ en: "2. Single server, multiple containers", ko: "2. 싱글 서버 다중 컨테이너" })}
                  {experimentalBadge}
                </div>
                <div className="text-foreground/70 text-sm">
                  {l.trans({
                    en: "When traffic grows but one machine is still enough, run multiple containers on the same server. This is vertical scaling: a stronger server, more containers, and multiple or cluster database mode.",
                    ko: "트래픽은 늘었지만 서버 한 대로 아직 충분하다면 같은 서버 안에서 여러 컨테이너를 실행합니다. 더 강한 서버, 더 많은 컨테이너, multiple 또는 cluster 데이터베이스 모드로 올리는 수직 확장 단계입니다.",
                  })}
                </div>
                <Docs.Alert type="info">
                  {l.trans({
                    en: (
                      <span>
                        <strong>You do not need several runtimes for load balancing.</strong> One Akan Runtime starts
                        several child servers, as many as the AKAN_REPLICA environment variable sets, and balances load
                        across them. Run several runtimes when you need better stability.
                      </span>
                    ),
                    ko: (
                      <span>
                        <strong>로드밸런싱 때문에 런타임을 여러 개 띄울 필요는 없습니다.</strong> Akan Runtime 하나가
                        AKAN_REPLICA 환경변수 설정에 따라 여러 child 서버를 실행해 로드밸런싱을 합니다. 안정성 향상이
                        필요하다면 그때 여러 런타임을 실행하면 됩니다.
                      </span>
                    ),
                  })}
                </Docs.Alert>
              </div>
              <Docs.Figure
                className="col-span-2"
                title={l.trans({ en: "2. Single server, multiple containers", ko: "2. 싱글 서버 다중 컨테이너" })}
                image="infra-stage-containers"
                prompt={`
                  A person at the far left labelled "Users", with an arrow into a small square labelled "Reverse Proxy".
                  One server drawn wide across the middle and right, labelled "Single Large Server" at its top. In the
                  left half of the server, three containers stacked vertically, lettered "A", "B" and "C" inside, with a
                  red accent bracket beside the stack labelled "Akan Runtime Containers". Three arrows fan out from the
                  proxy, one into each container. In the right half of the server, a cache labelled "Redis" with a
                  smaller second line "cache · pubsub · queue" above a database cylinder labelled "libsql / Postgres"; a
                  thin line joins every container to both.
                `}
                alt={l.trans({
                  en: "Users pass a reverse proxy into one large server running Akan runtime containers A, B and C, and every container shares Redis for cache, pubsub and queue plus libsql or Postgres on the same server.",
                  ko: "사용자는 리버스 프록시를 거쳐 대형 서버 한 대로 들어오고, 그 안의 Akan 런타임 컨테이너 A, B, C가 같은 서버의 Redis(캐시, PubSub, 큐)와 libsql 또는 Postgres를 함께 씁니다.",
                })}
              />
            </div>

            <div className={panelRecipe({}, "gap-2 lg:grid")}>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 font-bold text-foreground">
                  {l.trans({ en: "3. Cloud cluster scale", ko: "3. 클라우드 클러스터 확장" })}
                  {experimentalBadge}
                </div>
                <div className="text-foreground/70 text-sm">
                  {l.trans({
                    en: "When one server is no longer enough, move to a cloud cluster. Multiple servers run multiple containers, and cluster mode keeps the database/cache layer closer to production operation.",
                    ko: "서버 한 대로 부족해지면 클라우드 클러스터로 이동합니다. 여러 서버에서 여러 컨테이너가 실행되고, cluster 모드로 데이터베이스/캐시 계층도 운영에 가까운 형태가 됩니다.",
                  })}
                </div>
                <Docs.Alert type="warning">
                  {l.trans({
                    en: (
                      <span>
                        <strong>The chart in infra/app does not reach this stage.</strong> It deploys one pod behind
                        Ingress and Service, with SQLite on a ReadWriteOnce volume, and there is no Redis or Postgres
                        manifest under infra/. Fanning out to several pods means bringing your own database and cache
                        first, because a ReadWriteOnce volume cannot be mounted by a second pod.
                      </span>
                    ),
                    ko: (
                      <span>
                        <strong>infra/app의 차트는 이 단계까지 가지 않습니다.</strong> Ingress와 Service 뒤에 pod 하나를
                        배포하고 ReadWriteOnce 볼륨에 SQLite를 둘 뿐이며, infra/ 아래에 Redis나 Postgres 매니페스트는
                        없습니다. pod를 여러 개로 늘리려면 먼저 데이터베이스와 캐시를 직접 준비해야 합니다.
                        ReadWriteOnce 볼륨은 두 번째 pod가 마운트할 수 없기 때문입니다.
                      </span>
                    ),
                  })}
                </Docs.Alert>
              </div>
              <Docs.Figure
                className="col-span-2"
                title={l.trans({ en: "3. Cloud cluster scale", ko: "3. 클라우드 클러스터 확장" })}
                image="infra-cluster-scale"
                prompt={`
                  A large cloud outline filling most of the frame. A person at the far left, outside the cloud, labelled
                  "Users", with an arrow entering the cloud. Inside the cloud near the top: a small archway labelled
                  "Ingress", then a small circle with three short spokes labelled "Service". Three arrows fan down from
                  the circle to three servers standing side by side, their outlines traced as the red accent, labelled
                  "Node A", "Node B" and "Node C". Inside each server one container lettered "Pod". Below the cloud,
                  outside it, a cache labelled "Redis Cluster" and a database cylinder labelled "Postgres"; each server
                  has a thin line down to both.
                `}
                alt={l.trans({
                  en: "Inside a cloud cluster, users enter through a Kubernetes Ingress and Service that fan out to cloud nodes A, B and C, each running one Akan runtime pod against a shared Redis cluster and Postgres database.",
                  ko: "클라우드 클러스터 안에서 사용자는 Kubernetes Ingress와 Service를 거쳐 클라우드 노드 A, B, C로 분산되고, 각 노드의 Akan 런타임 Pod가 공유 Redis 클러스터와 Postgres 데이터베이스를 씁니다.",
                })}
              />
            </div>
          </div>
          <Docs.Alert type="info">
            {l.trans({
              en: (
                <span>
                  <strong>Grow only when the business asks for it.</strong> Start small, measure real usage, then move
                  from single server to multiple containers and on to a cloud cluster.
                </span>
              ),
              ko: (
                <span>
                  <strong>비즈니스가 요구할 때만 확장하세요.</strong> 작게 시작하고 실제 사용량을 측정한 뒤, 싱글
                  서버에서 다중 컨테이너로, 그리고 클라우드 클러스터로 이동하면 됩니다.
                </span>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <DocsToc />
    </Scroll>
  );
});
