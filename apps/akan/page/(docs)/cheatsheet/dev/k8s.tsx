import { usePage } from "@apps/akan/client";
import { Code, Divider, Docs, DocsList, DocsToc } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();

  return (
    <Scroll>
      <Scroll.Slide id="overview" title={l.trans({ en: "Kubernetes", ko: "Kubernetes" })}>
        <Docs.Title>{l.trans({ en: "Kubernetes", ko: "Kubernetes" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Akan Kubernetes deployment is built around one app container, a Service, an Ingress, and persistent storage for sqlite data.",
              ko: "Akan Kubernetes 배포는 하나의 app 컨테이너, Service, Ingress, sqlite 데이터를 위한 persistent storage를 중심으로 구성됩니다.",
            })}
          </div>
          <DocsList>
            <li>{l.trans({ en: "Deployment runs the app image.", ko: "Deployment는 app image를 실행합니다." })}</li>
            <li>
              {l.trans({
                en: "Service exposes the app inside the cluster.",
                ko: "Service는 cluster 내부에서 app을 노출합니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "Ingress connects domains to the Service.",
                ko: "Ingress는 domain을 Service에 연결합니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "PVC keeps sqlite data across pod restarts.",
                ko: "PVC는 pod 재시작 후에도 sqlite 데이터를 유지합니다.",
              })}
            </li>
          </DocsList>
          <div>
            {l.trans({
              en: "The branch is not a value you set — the chart reads it out of the release namespace, splitting <appName>-<branch> and selecting the values block of that name. Deploying to the wrong namespace silently picks the wrong block.",
              ko: "branch는 직접 적는 값이 아닙니다. chart가 release 네임스페이스에서 읽어 옵니다. <appName>-<branch>를 쪼개 그 이름의 values 블록을 고릅니다. 네임스페이스를 잘못 지정하면 조용히 다른 블록이 선택됩니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="architecture" title={l.trans({ en: "Architecture", ko: "구조" })}>
        <Docs.Title>{l.trans({ en: "Architecture", ko: "구조" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Think of the chart as four connected pieces. Users enter through Ingress, the Service routes traffic to the Pod, and the Pod stores local data through a PVC.",
              ko: "Chart를 네 조각으로 이해하면 쉽습니다. 사용자는 Ingress로 들어오고, Service가 Pod로 트래픽을 보내며, Pod는 PVC를 통해 local data를 저장합니다.",
            })}
          </div>
          <Docs.Mermaid
            title={l.trans({ en: "Mental model", ko: "이해 모델" })}
            highlightNodes={["pod"]}
            chart={`flowchart TB
  domain["Domain<br/>appName-branch.serveDomain"] --> ing["Ingress<br/>TLS, one host per subRoute and domain"]
  ing --> svc["Service :8282"]
  svc --> pod["Deployment pod<br/>replicas: 1"]
  pod --> pvc[("PVC<br/>/workspace/sqlite")]
  kubelet["kubelet"] -.->|"/_akan/app/health"| pod`}
          />
          <div>
            {l.trans({
              en: "The Deployment always carries replicas: 1. Scaling an Akan app is AKAN_REPLICA inside the pod, not more pods — the sqlite PVC is ReadWriteOnce, so a second pod could not mount it.",
              ko: "Deployment는 언제나 replicas: 1입니다. Akan 앱의 확장은 pod 수가 아니라 pod 안의 AKAN_REPLICA입니다. sqlite PVC가 ReadWriteOnce라서, 두 번째 pod는 그것을 마운트할 수 없습니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="values" title={l.trans({ en: "Values", ko: "Values" })}>
        <Docs.Title>{l.trans({ en: "Values", ko: "Values" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "There is no single values.yaml. The chart is fed four files in order — the shared defaults, the shared secrets, then the app's own two — so an app usually writes nothing but its name and its production domains, and everything else comes from the common file.",
              ko: "values.yaml 하나가 있는 것이 아닙니다. chart는 파일 네 개를 순서대로 받습니다. 공용 기본값, 공용 비밀값, 그다음 앱 자신의 두 개입니다. 그래서 앱이 직접 적는 것은 보통 이름과 운영 도메인뿐이고, 나머지는 공용 파일에서 옵니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="infra/app/values/myapp-values.yaml"
            code={`appName: myapp
subRoutes: [admin]

main:
  domains:
    - myapp.example.com
  app:
    replica: "2,1,0"
    resources:
      requests:
        memory: 1G
        cpu: "1"
      limits:
        memory: 4G
        cpu: "4"
      storage: 5Gi`}
          />
          <Docs.OptionTable
            items={[
              {
                key: "appName",
                type: "string",
                desc: l.trans({
                  en: "The namespace is <appName>-<branch>, the image path segment, and the default ingress host. Everything else is derived from it.",
                  ko: "네임스페이스는 <appName>-<branch>이고, 이미지 경로의 한 조각이자 기본 ingress 호스트이기도 합니다. 나머지가 여기서 유도됩니다.",
                }),
              },
              {
                key: "repoName",
                type: "string",
                default: "from _common-secret.yaml",
                desc: l.trans({
                  en: "The workspace segment of the image path: <registry>/<repoName>/<appName>.",
                  ko: "이미지 경로의 workspace 조각입니다. <registry>/<repoName>/<appName>.",
                }),
              },
              {
                key: "serveDomain",
                type: "string",
                default: "from _common-secret.yaml",
                desc: l.trans({
                  en: "The base host. The chart serves <appName>-<branch>.<serveDomain> without anything else being declared.",
                  ko: "기준 호스트입니다. 다른 것을 적지 않아도 chart는 <appName>-<branch>.<serveDomain>을 서비스합니다.",
                }),
              },
              {
                key: "subRoutes",
                type: "string[]",
                default: "[]",
                desc: l.trans({
                  en: "Extra <subRoute>-<branch>.<serveDomain> ingress hosts and TLS SANs, one per basePath the app ships.",
                  ko: "추가 ingress 호스트와 TLS SAN입니다. 앱이 배포하는 basePath마다 하나씩 <subRoute>-<branch>.<serveDomain>이 생깁니다.",
                }),
              },
              {
                key: "image.registry",
                type: "string",
                default: "from _common-secret.yaml",
                desc: l.trans({ en: "The registry host.", ko: "레지스트리 호스트입니다." }),
              },
              {
                key: "image.tag",
                type: "string",
                default: "<branch>-live",
                desc: l.trans({
                  en: "Pin a specific build. The default is a moving tag, which is why a deploy also has to restart the rollout.",
                  ko: "특정 빌드를 고정합니다. 기본값이 움직이는 태그라서, 배포할 때 rollout을 함께 재시작해야 합니다.",
                }),
              },
              {
                key: "<branch>.domains",
                type: "string[]",
                default: "[]",
                desc: l.trans({
                  en: "Custom ingress hosts and TLS SANs for that branch, on top of the derived ones. This is where a production domain goes.",
                  ko: "해당 branch의 추가 ingress 호스트와 TLS SAN입니다. 유도된 것들 위에 얹힙니다. 운영 도메인이 들어가는 자리입니다.",
                }),
              },
              {
                key: "<branch>.app.replica",
                type: "string",
                default: '"0,0,1"',
                desc: l.trans({
                  en: "Becomes AKAN_REPLICA inside the pod — federation, batch, all.",
                  ko: "pod 안에서 AKAN_REPLICA가 됩니다. federation, batch, all입니다.",
                }),
              },
              {
                key: "<branch>.app.solo",
                type: "string",
                default: "not written",
                desc: l.trans({
                  en: "Becomes AKAN_SOLO, and only when the key is present. Write false to keep the gateway in front of a single replica.",
                  ko: "AKAN_SOLO가 됩니다. 키가 있을 때만 주입됩니다. replica 하나 앞에 gateway를 남기려면 false를 적습니다.",
                }),
              },
              {
                key: "<branch>.app.resources.requests",
                type: "{ memory, cpu }",
                default: "250M / 0.05, or 1G / 1 on main",
                desc: l.trans({
                  en: "The pod request. Start conservative and watch metrics before raising it.",
                  ko: "pod의 request입니다. 보수적으로 시작하고 metrics를 본 뒤 올리세요.",
                }),
              },
              {
                key: "<branch>.app.resources.limits",
                type: "{ memory, cpu }",
                default: "1G / 0.5, or 4G / 4 on main",
                desc: l.trans({
                  en: "The pod limit. The CPU limit is also what the image optimizer sizes its encode pool from, so a tight limit narrows that too.",
                  ko: "pod의 limit입니다. CPU limit은 이미지 optimizer가 인코딩 풀 크기를 정하는 근거이기도 하므로, 빡빡하게 잡으면 그쪽도 함께 좁아집니다.",
                }),
              },
              {
                key: "<branch>.app.resources.storage",
                type: "string",
                default: "2Gi, or 5Gi on main",
                desc: l.trans({
                  en: "The PVC size, ReadWriteOnce, mounted at /workspace/sqlite.",
                  ko: "PVC 크기입니다. ReadWriteOnce이며 /workspace/sqlite에 마운트됩니다.",
                }),
              },
            ]}
          />
          <Docs.Alert type="info">
            {l.trans({
              en: "The container port, the Service port, replicas: 1, the 40s termination grace period and the three probes are fixed in the template, not values. Changing any of them is a chart edit.",
              ko: "컨테이너 포트, Service 포트, replicas: 1, 40초 종료 유예, 세 개의 probe는 values가 아니라 template에 고정되어 있습니다. 바꾸려면 chart를 고쳐야 합니다.",
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="scale" title={l.trans({ en: "Scale", ko: "확장" })}>
        <Docs.Title>{l.trans({ en: "Scale", ko: "확장" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "`app.replica` becomes `AKAN_REPLICA` inside the pod. Use it with CPU and memory values to scale work safely.",
              ko: "`app.replica`는 pod 안에서 `AKAN_REPLICA`가 됩니다. CPU, memory 값과 함께 사용해 작업을 안전하게 확장하세요.",
            })}
          </div>
          <DocsList>
            <li>
              {l.trans({
                en: "`0,0,1`: one all-purpose child, and the chart default. No gateway.",
                ko: "`0,0,1`: 범용 child 하나이며 chart 기본값입니다. gateway가 없습니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "`1,0,0`: one request child and nothing scheduled. Also no gateway.",
                ko: "`1,0,0`: request child 하나이고 예약 작업은 없습니다. 이것도 gateway가 없습니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "`2,1,0`: more request capacity plus one batch worker, behind a gateway.",
                ko: "`2,1,0`: request 처리량을 늘리고 batch worker 하나를 추가하며, gateway 뒤에 놓입니다.",
              })}
            </li>
          </DocsList>
          <div>
            {l.trans({
              en: "A single request-serving replica (`1,0,0` or `0,0,1`) runs in the pod's only process, with no gateway in front of it. That leaves the kubelet as the only thing that can restart a wedged server, so the chart ships liveness, readiness, and startup probes on /_akan/app/health, which a solo process answers itself.",
              ko: "요청을 처리하는 replica가 하나(`1,0,0` 또는 `0,0,1`)면 pod의 유일한 프로세스에서 gateway 없이 실행됩니다. 멈춘 서버를 재시작할 수 있는 것이 kubelet뿐이므로, chart는 /_akan/app/health에 liveness, readiness, startup probe를 함께 배포하며 solo 프로세스가 이 경로에 직접 응답합니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "The startup probe carries the boot at 5-second intervals for up to two minutes, because an SSR replica loads its route artifacts before it listens. The 40-second termination grace period is deliberately longer than the server's own 30-second drain budget, so a SIGKILL never lands the instant that budget expires.",
              ko: "startup probe가 5초 간격으로 최대 2분까지 부팅을 감당합니다. SSR replica는 수신을 시작하기 전에 라우트 산출물을 불러오기 때문입니다. 종료 유예 40초는 서버 자신의 드레인 예산 30초보다 일부러 길게 잡혀 있어, 그 예산이 끝나는 순간 SIGKILL이 떨어지지 않습니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="console" title={l.trans({ en: "Open Console", ko: "Console 열기" })}>
        <Docs.Title>{l.trans({ en: "Open Console", ko: "Console 열기" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Use `kubectl exec` to run the generated `console.js` already embedded in the built app image.",
              ko: "`kubectl exec`로 build된 app image 안에 이미 포함된 generated `console.js`를 실행합니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "The console starts a separate no-listen server process in the same pod; it does not attach to the running `main.js` memory. Its `.tail` and `.trace` do reach the running server, through the control socket in the runtime directory.",
              ko: "Console은 같은 pod 안에서 별도의 no-listen server process를 시작합니다. 실행 중인 `main.js` memory에 attach하지는 않습니다. 다만 `.tail`과 `.trace`는 runtime 디렉터리의 제어 소켓을 통해 실행 중인 서버에 닿습니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="Terminal"
            language="bash"
            code="kubectl exec -it -n prod pod/myapp-xxxxx -c myapp -- sh -lc 'AKAN_CONSOLE=1 bun console.js'"
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
                en: "Start with conservative requests and watch metrics before raising limits.",
                ko: "처음에는 보수적인 requests로 시작하고 metrics를 본 뒤 limits를 올리세요.",
              })}
            </li>
            <li>
              {l.trans({
                en: "Resize sqlite storage before it becomes urgent.",
                ko: "sqlite storage는 급해지기 전에 여유 있게 늘리세요.",
              })}
            </li>
            <li>
              {l.trans({
                en: "Keep domain and subRoute values explicit so Ingress rules stay predictable.",
                ko: "Ingress rule을 예측 가능하게 유지하려면 domain과 subRoute 값을 명확히 적으세요.",
              })}
            </li>
            <li>
              {l.trans({
                en: "The default image tag is <branch>-live and does not move on its own, so a deploy has to restart the rollout for the pod to pick up a new build.",
                ko: "기본 이미지 태그는 <branch>-live이고 저절로 옮겨 가지 않으므로, pod가 새 빌드를 집으려면 배포가 rollout을 재시작해야 합니다.",
              })}
            </li>
          </DocsList>
        </Docs.Description>
      </Scroll.Slide>
      <DocsToc />
    </Scroll>
  );
});
