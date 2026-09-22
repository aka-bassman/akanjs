import { usePage } from "@apps/akan/client";
import { Code, Divider, Docs, DocsList, DocsToc } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();

  return (
    <Scroll>
      <Scroll.Slide id="overview" title={l.trans({ en: "Docker", ko: "Docker" })}>
        <Docs.Title>{l.trans({ en: "Docker", ko: "Docker" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "You have a built app and a machine at the edge of a factory floor. It needs to come back up after a power cut with its data intact, and you need to see why it fell over in the first place. For a small edge server, start with one Akan app container.",
              ko: "빌드된 앱과 공장 한쪽 끝에 놓인 기기가 있습니다. 정전이 나도 데이터를 지킨 채 다시 올라와야 하고, 애초에 왜 죽었는지도 볼 수 있어야 합니다. 작은 edge server에서는 Akan app 컨테이너 하나로 시작하세요.",
            })}
          </div>
          <DocsList>
            <li>
              {l.trans({
                en: "The image binds port 8282 — `akan build` bakes `ENV PORT=8282` into the Dockerfile it generates.",
                ko: "이미지는 8282 포트에 바인딩합니다. `akan build`가 생성하는 Dockerfile에 `ENV PORT=8282`가 구워집니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "Mount sqlite data so local data survives container restarts.",
                ko: "컨테이너가 재시작되어도 local data가 남도록 sqlite 데이터를 mount합니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "The image turns file logging off, because a container's writable layer is ephemeral. Turn it back on and mount a volume, or collect stdout instead.",
                ko: "이미지는 파일 로깅을 꺼 둡니다. 컨테이너의 쓰기 레이어는 사라지기 때문입니다. 다시 켜고 볼륨을 붙이거나, 대신 stdout을 수집하세요.",
              })}
            </li>
          </DocsList>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="compose" title={l.trans({ en: "Minimal Compose", ko: "최소 compose" })}>
        <Docs.Title>{l.trans({ en: "Minimal Compose", ko: "최소 compose" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "This is a simplified example for one app. Replace `myapp` and the image name with your app.",
              ko: "아래는 app 하나를 위한 단순화된 예시입니다. `myapp`과 image 이름을 자신의 app에 맞게 바꾸세요.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="docker-compose.yaml"
            code={`services:
  myapp:
    image: registry.mydomain.com/myorg/myapp:latest
    container_name: myapp
    restart: unless-stopped
    ports:
      - "8282:8282"
    environment:
      AKAN_PUBLIC_APP_NAME: myapp
      AKAN_PUBLIC_REPO_NAME: myorg
      AKAN_PUBLIC_SERVE_DOMAIN: example.com
      AKAN_PUBLIC_ENV: main
      AKAN_PUBLIC_OPERATION_MODE: edge
      AKAN_REPLICA: "0,0,1"
      AKAN_SQLITE_DIR: /workspace/sqlite
      AKAN_LOG_TO_FILE: "1"
      AKAN_LOG_DIR: /workspace/logs
    volumes:
      - ./sqlite:/workspace/sqlite
      - ./logs:/workspace/logs`}
          />
          <Docs.Alert type="warning">
            {l.trans({
              en: (
                <span>
                  The published port's container side must be <code>8282</code>, not <code>80</code>. Nothing in the
                  image listens on 80 — <code>AkanApp</code> binds <code>PORT</code>, which the Dockerfile already set.
                  Map <code>"8282:8282"</code>, or set <code>PORT: 80</code> as well.
                </span>
              ),
              ko: (
                <span>
                  게시한 포트의 컨테이너 쪽은 <code>80</code>이 아니라 <code>8282</code>여야 합니다. 이미지 안에서 80을
                  듣는 것은 없습니다. <code>AkanApp</code>은 Dockerfile이 이미 설정한 <code>PORT</code>에 바인딩합니다.{" "}
                  <code>"8282:8282"</code>로 매핑하거나 <code>PORT: 80</code>을 함께 주세요.
                </span>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="env" title={l.trans({ en: "Container Env", ko: "컨테이너 env" })}>
        <Docs.Title>{l.trans({ en: "Container Env", ko: "컨테이너 env" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Three names are mandatory and the boot throws without them. The build bakes all three into the image from akan.config.ts, so a container only has to set one that differs from what was built.",
              ko: "세 이름은 필수이고, 없으면 부팅이 예외로 끝납니다. 빌드가 akan.config.ts에서 셋 다 이미지에 구워 넣으므로, 컨테이너는 빌드 때와 다른 값만 주면 됩니다.",
            })}
          </div>
          <Docs.OptionTable
            items={[
              {
                key: "AKAN_PUBLIC_APP_NAME",
                type: "string",
                default: "baked by akan build",
                desc: l.trans({
                  en: "The app's codename. getEnv() throws without it.",
                  ko: "앱의 코드네임입니다. 없으면 getEnv()가 예외를 던집니다.",
                }),
              },
              {
                key: "AKAN_PUBLIC_REPO_NAME",
                type: "string",
                default: "baked by akan build",
                desc: l.trans({
                  en: "The workspace name. Also required, and also thrown on.",
                  ko: "workspace 이름입니다. 마찬가지로 필수이고 없으면 예외가 납니다.",
                }),
              },
              {
                key: "AKAN_PUBLIC_SERVE_DOMAIN",
                type: "string",
                default: "baked by akan build",
                desc: l.trans({
                  en: "The base serving domain the app derives its own origins from.",
                  ko: "앱이 자기 origin들을 유도해 내는 기준 도메인입니다.",
                }),
              },
              {
                key: "AKAN_PUBLIC_ENV",
                type: "local | testing | debug | develop | main",
                default: "debug",
                desc: l.trans({
                  en: "Which deployment this is. The image bakes whatever the build was for; a chart overrides it per namespace.",
                  ko: "어떤 배포인지입니다. 이미지에는 빌드 당시 값이 구워지고, chart가 네임스페이스마다 덮어씁니다.",
                }),
              },
              {
                key: "AKAN_PUBLIC_OPERATION_MODE",
                type: "local | edge | cloud | module",
                default: "cloud in the image",
                desc: l.trans({
                  en: "Where it runs. edge is the on-premise box in this page's example; the generated Dockerfile writes cloud.",
                  ko: "어디서 도는지입니다. 이 문서 예시의 온프레미스 장비가 edge이고, 생성된 Dockerfile은 cloud를 씁니다.",
                }),
              },
              {
                key: "PORT",
                type: "number",
                default: "8282",
                desc: l.trans({
                  en: "The port the gateway or solo process binds. Baked into the image, so the published port must match it.",
                  ko: "gateway나 단독 프로세스가 바인딩하는 포트입니다. 이미지에 구워져 있으므로 게시하는 포트가 이 값과 맞아야 합니다.",
                }),
              },
              {
                key: "AKAN_SQLITE_DIR",
                type: "string",
                default: "<cwd>/sqlite in production",
                desc: l.trans({
                  en: "Where sqlite files land. Point it at a mounted volume or the data dies with the container.",
                  ko: "sqlite 파일이 놓이는 곳입니다. 마운트된 볼륨을 가리키지 않으면 데이터가 컨테이너와 함께 사라집니다.",
                }),
              },
              {
                key: "AKAN_LOG_TO_FILE",
                type: "0 | 1",
                default: "0 in the image",
                desc: l.trans({
                  en: "The generated Dockerfile bakes 0. Set 1 and mount AKAN_LOG_DIR to get rotating files back — 50MB x 100 per process key at the default trace level.",
                  ko: "생성된 Dockerfile은 0을 구워 넣습니다. 1로 두고 AKAN_LOG_DIR을 마운트하면 회전 로그 파일이 돌아옵니다. 기본 trace 레벨에서 process key당 50MB x 100입니다.",
                }),
              },
              {
                key: "AKAN_CONSOLE",
                type: "1",
                default: "unset",
                desc: l.trans({
                  en: "Required to open console.js in a production-like environment. Set it on the exec command, never in the service definition.",
                  ko: "production 계열 환경에서 console.js를 열려면 필요합니다. 서비스 정의가 아니라 exec 명령에만 설정하세요.",
                }),
              },
            ]}
          />
          <Docs.Alert type="info">
            {l.trans({
              en: (
                <span>
                  <code>USE_AKANJS_PKGS</code> is not a container variable. It is a workspace-development flag the CLI
                  reads, and setting it in a deployment does nothing.
                </span>
              ),
              ko: (
                <span>
                  <code>USE_AKANJS_PKGS</code>는 컨테이너 변수가 아닙니다. CLI가 읽는 workspace 개발용 플래그이고,
                  배포에 설정해도 아무 일도 하지 않습니다.
                </span>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="replica" title={l.trans({ en: "Scale With AKAN_REPLICA", ko: "AKAN_REPLICA로 확장" })}>
        <Docs.Title>{l.trans({ en: "Scale With AKAN_REPLICA", ko: "AKAN_REPLICA로 확장" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "AKAN_REPLICA is three counts separated by commas, and the positions are what carry the meaning. It decides both how many processes run and whether a gateway exists at all.",
              ko: "AKAN_REPLICA는 쉼표로 구분된 세 개의 수이고, 의미를 지니는 것은 자리입니다. 프로세스를 몇 개 띄울지와 gateway가 아예 있을지 없을지를 함께 정합니다.",
            })}
          </div>
          <Docs.OptionTable
            items={[
              {
                key: "1st — federation",
                type: "number",
                default: "0",
                desc: l.trans({
                  en: "Request-serving replicas. Each listens and gets a websocket upstream; none of them runs a scheduled task.",
                  ko: "요청을 처리하는 replica 수입니다. 각각 수신하고 websocket upstream을 받으며, 예약 작업은 하나도 돌리지 않습니다.",
                }),
              },
              {
                key: "2nd — batch",
                type: "number",
                default: "0",
                desc: l.trans({
                  en: "Worker replicas. A batch replica never listens and gets no websocket upstream, so asking for one always keeps the gateway.",
                  ko: "워커 replica 수입니다. batch replica는 수신하지 않고 websocket upstream도 받지 않으므로, 하나라도 요청하면 gateway가 반드시 남습니다.",
                }),
              },
              {
                key: "3rd — all",
                type: "number",
                default: "1",
                desc: l.trans({
                  en: "All-purpose replicas: they serve requests and run batch work. A route or task declared for either role runs here.",
                  ko: "범용 replica 수입니다. 요청도 처리하고 batch 작업도 돌립니다. 어느 역할로 선언된 라우트나 작업이든 여기서 돕니다.",
                }),
              },
              {
                key: "AKAN_SOLO",
                type: "false | 0",
                default: "unset",
                desc: l.trans({
                  en: "Forces the gateway back with a single replica. Only those two strings are read — true is a no-op, and it can never fold a real multi-replica gateway into one process.",
                  ko: "replica가 하나여도 gateway를 되살립니다. 읽는 값은 이 두 문자열뿐이라 true는 아무 효과가 없고, 진짜 다중 replica gateway를 한 프로세스로 접을 수도 없습니다.",
                }),
              },
            ]}
          />
          <div>
            {l.trans({
              en: "Fewer than three slots is legal and the missing ones are zero, so 2 alone means two federation replicas. All zeroes is normalized to one all-purpose replica — you can never ask for none.",
              ko: "자리를 셋 다 채우지 않아도 되고 빠진 자리는 0입니다. 그래서 2만 적으면 federation replica 두 개라는 뜻입니다. 전부 0이면 범용 replica 하나로 정규화됩니다. 0개를 요청할 수는 없습니다.",
            })}
          </div>
          <Docs.Mermaid
            title={l.trans({
              en: "One process, or a gateway and its children",
              ko: "프로세스 하나, 또는 gateway와 자식들",
            })}
            highlightNodes={["solo"]}
            chart={`flowchart TB
  d{"total = 1 and batch = 0?"}
  d -->|yes| solo["Solo: the container's only process<br/>SERVER_MODE=all · binds PORT"]
  d -->|no| gw["Gateway: binds PORT and proxies"]
  solo --> srsc["RSC worker"]
  gw --> c1["federation child<br/>unix socket"]
  gw --> c2["batch child<br/>never listens"]
  c1 --> crsc["RSC worker"]
  d -.->|"AKAN_SOLO=false, or akan start"| gw`}
          />
          <div>
            {l.trans({
              en: "A solo process has nothing to balance, so it skips the gateway and its proxy hop, and answers /_akan/app/health, /_akan/app/metrics and /_akan/bench/ping itself in the gateway's own shape. That also means nothing supervises it but the orchestrator's probes.",
              ko: "단독 프로세스는 분산할 대상이 없으므로 gateway와 프록시 홉을 건너뛰고, /_akan/app/health, /_akan/app/metrics, /_akan/bench/ping을 gateway와 같은 형태로 직접 응답합니다. 그리고 그 말은, 이 프로세스를 감시하는 것이 오케스트레이터의 probe뿐이라는 뜻이기도 합니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="web-surface" title={l.trans({ en: "Trim The Web Surface", ko: "웹 surface 줄이기" })}>
        <Docs.Title>{l.trans({ en: "Trim The Web Surface", ko: "웹 surface 줄이기" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A deployment that only answers API calls does not need the web half at all. `AKAN_SSR=false` takes down the RSC worker and the render routes; `AKAN_CSR=false` takes down only the mobile SPA bundle. Both narrow what the build produced and can never widen it, and the boot log names what the process ended up serving.",
              ko: "API만 응답하는 배포에는 웹 절반이 필요 없습니다. `AKAN_SSR=false`는 RSC worker와 렌더 라우트를 내리고, `AKAN_CSR=false`는 모바일 SPA bundle만 내립니다. 둘 다 빌드가 만든 범위를 좁히기만 하고 넓히지는 못하며, 부팅 로그가 이 프로세스가 실제로 무엇을 서비스하는지 남깁니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "The two are not independent: the CSR bundle inlines the stylesheet the SSR build compiles, so AKAN_SSR=false takes CSR down with it whatever AKAN_CSR says. There is no CSR-without-SSR deployment.",
              ko: "둘은 독립적이지 않습니다. CSR 번들은 SSR 빌드가 컴파일한 스타일시트를 인라인하므로, AKAN_CSR이 무엇이든 AKAN_SSR=false는 CSR까지 함께 내립니다. SSR 없는 CSR 배포는 없습니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "Declare it in akan.config.ts as `web: false` to also keep the artifacts out of the image: no route artifact, no CSR bundle, no RSC worker entrypoint, and no public/ folder. Measured on this docs app, that is 86MB down to 6.2MB.",
              ko: "akan.config.ts에 `web: false`로 선언하면 산출물 자체가 이미지에서 빠집니다. 라우트 산출물, CSR bundle, RSC worker entrypoint, public/ 폴더가 모두 들어가지 않습니다. 이 문서 앱 기준 86MB에서 6.2MB로 줄었습니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="Terminal"
            language="bash"
            code={`docker run -e AKAN_SSR=false -e AKAN_REPLICA="1,0,0" -p 8282:8282 myapp`}
          />
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="dockerfile" title={l.trans({ en: "The Generated Dockerfile", ko: "생성되는 Dockerfile" })}>
        <Docs.Title>{l.trans({ en: "The Generated Dockerfile", ko: "생성되는 Dockerfile" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "You do not write a Dockerfile. akan build writes one into dist/apps/<app>/ from the docker key in akan.config.ts, and the generated image installs ca-certificates and tzdata and nothing else — so an app that needs ffmpeg or Chromium has to say so.",
              ko: "Dockerfile은 직접 쓰지 않습니다. akan build가 akan.config.ts의 docker 키를 읽어 dist/apps/<app>/에 하나를 씁니다. 생성된 이미지가 설치하는 것은 ca-certificates와 tzdata뿐이므로, ffmpeg이나 Chromium이 필요한 앱은 그렇게 적어야 합니다.",
            })}
          </div>
          <Docs.OptionTable
            items={[
              {
                key: "image",
                type: "string | { amd64?, arm64? }",
                default: "oven/bun:1-slim",
                desc: l.trans({
                  en: "The base image. The object form emits one FROM per architecture, and an arch left out falls back to the default.",
                  ko: "베이스 이미지입니다. 객체 형태는 아키텍처마다 FROM을 하나씩 내보내고, 빠진 아키텍처는 기본값으로 떨어집니다.",
                }),
              },
              {
                key: "preRuns",
                type: "(string | { amd64?, arm64? })[]",
                default: "[]",
                desc: l.trans({
                  en: "Steps before bun install, so a system package a native dependency needs is already there for the install.",
                  ko: "bun install 앞에 오는 단계입니다. 네이티브 의존성이 필요로 하는 시스템 패키지를 설치 시점에 미리 놓아 둡니다.",
                }),
              },
              {
                key: "postRuns",
                type: "(string | { amd64?, arm64? })[]",
                default: "[]",
                desc: l.trans({
                  en: "Steps after bun install and before the app files are copied — the place for something that needs the installed modules but not the source.",
                  ko: "bun install 뒤, 앱 파일 복사 전의 단계입니다. 설치된 모듈은 필요하지만 소스는 필요 없는 작업의 자리입니다.",
                }),
              },
              {
                key: "command",
                type: "string[]",
                default: '["bun", "main.js"]',
                desc: l.trans({
                  en: "The CMD. Each element is JSON-quoted into the exec form.",
                  ko: "CMD입니다. 각 원소가 JSON 문자열로 감싸져 exec 형태로 들어갑니다.",
                }),
              },
            ]}
          />
          <Code.Snippet
            className="w-full"
            title="apps/myapp/akan.config.ts"
            code={`export default {
  docker: {
    preRuns: ["RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg"],
    postRuns: [{ arm64: "RUN echo aarch64 image" }],
  },
  assets: {
    pruneFonts: true,
    keepFonts: ["fonts/Assistant-*.woff2"],
  },
};`}
          />
          <DocsList>
            <li>
              {l.trans({
                en: "A lib declares the steps its own runtime needs and every mounting app inherits them, prepended and deduplicated. A lib never picks the base image or the command.",
                ko: "lib은 자기 런타임에 필요한 단계를 선언하고, 그 lib을 마운트한 모든 앱이 앞쪽에 중복 없이 물려받습니다. lib이 베이스 이미지나 command를 고르는 일은 없습니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "Writing `docker` as a whole Dockerfile string takes it verbatim — and silently drops every step a lib contributed. Reach for the object form unless you genuinely need the whole file.",
                ko: "`docker`에 Dockerfile 전체를 문자열로 쓰면 그대로 쓰이고, lib이 기여한 단계는 조용히 전부 사라집니다. 파일 전체가 정말 필요한 경우가 아니면 객체 형태를 쓰세요.",
              })}
            </li>
            <li>
              {l.trans({
                en: "`assets.pruneFonts` is on by default and trims from the dist copy of public/ the fonts nothing reads; `keepFonts` globs are relative to the declaring app's or lib's own public/. Source trees are never touched.",
                ko: "`assets.pruneFonts`는 기본으로 켜져 있고, dist에 복사된 public/에서 아무도 읽지 않는 폰트를 덜어냅니다. `keepFonts` glob은 그것을 선언한 앱이나 lib 자신의 public/ 기준입니다. 원본 트리는 건드리지 않습니다.",
              })}
            </li>
          </DocsList>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="console" title={l.trans({ en: "Open Console", ko: "Console 열기" })}>
        <Docs.Title>{l.trans({ en: "Open Console", ko: "Console 열기" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "`akan build` embeds `console.js` next to `main.js`, so you can open an operator console without creating files inside the container.",
              ko: "`akan build`는 `main.js` 옆에 `console.js`를 포함하므로 container 안에 파일을 만들지 않고 operator console을 열 수 있습니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "Set `AKAN_CONSOLE=1` only on the exec command for production-like environments.",
              ko: "Production 계열 환경에서는 exec 명령에서만 `AKAN_CONSOLE=1`을 설정하세요.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="Terminal"
            language="bash"
            code="docker exec -it myapp sh -lc 'AKAN_CONSOLE=1 bun console.js'"
          />
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="tips" title={l.trans({ en: "Tips", ko: "꿀팁" })}>
        <Docs.Title>{l.trans({ en: "Tips", ko: "꿀팁" })}</Docs.Title>
        <Docs.Description>
          <DocsList>
            <li>
              {l.trans({
                en: "Keep the first compose file boring. Add extra services only when the app really needs them.",
                ko: "처음 compose는 단순하게 유지하세요. 앱이 정말 필요할 때만 추가 서비스를 붙입니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "Back up the sqlite volume before replacing edge hardware.",
                ko: "Edge 장비를 교체하기 전 sqlite volume을 백업하세요.",
              })}
            </li>
            <li>
              {l.trans({
                en: "When the container restarts repeatedly, read stdout rather than the mounted folder — file logging is off in the image unless you turned it back on.",
                ko: "컨테이너가 반복 재시작되면 마운트한 폴더가 아니라 stdout을 보세요. 직접 켜지 않았다면 이미지에서 파일 로깅은 꺼져 있습니다.",
              })}
            </li>
          </DocsList>
        </Docs.Description>
      </Scroll.Slide>
      <DocsToc />
    </Scroll>
  );
});
