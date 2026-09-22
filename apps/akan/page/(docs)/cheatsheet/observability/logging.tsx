import { usePage } from "@apps/akan/client";
import { Code, Divider, Docs, DocsToc, panelRecipe } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

const levels = [
  {
    name: "trace",
    sev: 1,
    en: "Every step, including the ones that are only interesting once.",
    ko: "모든 단계. 딱 한 번만 궁금할 것들까지 포함합니다.",
  },
  {
    name: "verbose",
    sev: 3,
    en: "Detail a developer asks for on purpose. TRACE's upper tier, not a band of its own.",
    ko: "개발자가 일부러 요청하는 상세 내역입니다. 자기 대역이 아니라 TRACE의 윗칸입니다.",
  },
  {
    name: "debug",
    sev: 5,
    en: "Diagnosis for one subsystem while you are working on it.",
    ko: "작업 중인 하위 시스템 하나를 진단할 때 쓰는 레벨입니다.",
  },
  {
    name: "info",
    sev: 9,
    en: "Normal lifecycle events. The production default.",
    ko: "정상 라이프사이클 이벤트입니다. 운영 기본값입니다.",
  },
  {
    name: "warn",
    sev: 13,
    en: "Recoverable — it kept going, and somebody should know.",
    ko: "복구된 문제입니다. 계속 진행됐지만 누군가는 알아야 합니다.",
  },
  {
    name: "error",
    sev: 17,
    en: "An operation failed or needs attention. Written to stderr rather than stdout.",
    ko: "작업이 실패했거나 확인이 필요합니다. stdout이 아니라 stderr로 나갑니다.",
  },
];

export default page().render(() => {
  const { l } = usePage();
  return (
    <Scroll>
      <Scroll.Slide id="logging-overview" title={l.trans({ en: "Runtime Logging", ko: "런타임 로깅" })}>
        <Docs.Title>{l.trans({ en: "Runtime Logging", ko: "런타임 로깅" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A customer says their refund failed at about four o'clock. You have the container's stdout, twelve replicas' worth of it, and no way to tell which lines belonged to that one call. Every line is true and none of them is an answer.",
              ko: "고객이 네 시쯤 환불이 실패했다고 합니다. 가진 것은 컨테이너 stdout이고, 그것도 replica 열두 개 분량이며, 그중 어느 줄이 그 호출의 것인지 알 방법이 없습니다. 모든 줄이 사실이지만 어느 줄도 답이 아닙니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "Akan's answer is that a log line is a record before it is a line. Every Logger call carries a level, a logger name, a process role, a replica index and — inside a request — a traceId, the endpoint, and the origin. One request's lines share a trace, so the question above becomes one command.",
              ko: "Akan의 답은, 로그 한 줄은 줄이기 이전에 레코드라는 것입니다. 모든 Logger 호출은 레벨, 로거 이름, 프로세스 역할, replica 번호를, 그리고 요청 안에서는 traceId, 엔드포인트, origin을 함께 싣습니다. 한 요청의 줄들은 trace를 공유하므로, 위 질문은 명령 하나가 됩니다.",
            })}
          </div>
          <Docs.Mermaid
            title={l.trans({
              en: "One record, from the call to the collector",
              ko: "레코드 하나, 호출부터 수집기까지",
            })}
            highlightNodes={["owner"]}
            chart={`flowchart TB
  call["this.logger.info(...)"] --> rec["LogRecord<br/>level · name · role · replicaIdx<br/>traceId · endpoint · origin · attrs"]
  rec --> sinks["Sinks<br/>floor = minLevel, else AKAN_LOG_FILE_LEVEL"]
  sinks --> child["Child replica<br/>LogForwarder over IPC"]
  sinks --> owner["Hub owner<br/>gateway, or the solo replica"]
  child --> owner
  owner --> ring["Ring buffer<br/>AKAN_LOG_BUFFER records"]
  owner --> out["Container stdout<br/>text or ndjson"]
  owner --> file["Rotating file<br/>AKAN_LOG_TO_FILE"]
  ring --> sock["akan-control.sock<br/>akan logs · .tail"]
  ring --> sse["GET /_akan/app/logs<br/>SSE"]`}
          />
          <Docs.Alert type="warning">
            {l.trans({
              en: (
                <span>
                  Never call <code>logger.log()</code>. It reads as a level of its own and emits at <code>info</code>,
                  which is how a line meant to be quiet ends up in production output. The lint rule{" "}
                  <code>no-deprecated-log-level</code> fails the build on it.
                </span>
              ),
              ko: (
                <span>
                  <code>logger.log()</code>은 호출하지 마세요. 별도 레벨처럼 읽히지만 실제로는 <code>info</code>로
                  나가고, 조용하려던 줄이 그렇게 운영 출력에 남습니다. <code>no-deprecated-log-level</code> 린트 규칙이
                  build를 깨뜨립니다.
                </span>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="using-logger" title={l.trans({ en: "Using Logger", ko: "Logger 사용법" })}>
        <Docs.Title>{l.trans({ en: "Using Logger", ko: "Logger 사용법" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Create a Logger with a component or service name, then write logs at the level that matches the intent. The second argument is a context string — add it when the same logger handles several jobs.",
              ko: "컴포넌트나 서비스 이름으로 Logger를 만들고, 의도에 맞는 level로 로그를 남깁니다. 두 번째 인자는 context 문자열입니다. 하나의 logger가 여러 작업을 처리한다면 함께 넣으세요.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/myapp/lib/billing/billing.service.ts"
            code={`import { Logger } from "akanjs/common";

export class BillingService {
  readonly logger = new Logger("BillingService");

  async syncInvoice(invoiceId: string) {
    this.logger.debug(\`sync start invoiceId=\${invoiceId}\`, "invoice-sync");

    try {
      await this.pushInvoice(invoiceId);
      this.logger.info(\`sync complete invoiceId=\${invoiceId}\`, "invoice-sync");
    } catch (error) {
      this.logger.error(
        \`sync failed invoiceId=\${invoiceId} message=\${error instanceof Error ? error.message : String(error)}\`,
        "invoice-sync",
      );
      throw error;
    }
  }
}`}
          />
          <div>
            {l.trans({
              en: "Structured values do not belong in the message. Logger.emit puts them in LogRecord.attrs, where they render as key=value after the text and ride the JSON as an object — greppable in a terminal and queryable in a collector, from one call.",
              ko: "구조화된 값은 메시지에 넣지 않습니다. Logger.emit은 그 값들을 LogRecord.attrs에 담고, 텍스트에서는 메시지 뒤에 key=value로, JSON에서는 객체로 실립니다. 호출 한 번으로 터미널에서는 grep되고 수집기에서는 쿼리됩니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/myapp/lib/billing/billing.service.ts"
            code={`import { Logger } from "akanjs/common";

Logger.emit({
  level: "info",
  name: "BillingService",
  message: "invoice pushed",
  attrs: { invoiceId, vendor: "stripe", ms: elapsed },
});
// An attr key naming a secret — token, password, authorization, cookie, api_key, private_key —
// is replaced with "[redacted]" while the record is built, so no sink can ever see the value.`}
          />
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="log-levels" title={l.trans({ en: "Log Levels", ko: "로그 레벨" })}>
        <Docs.Title>{l.trans({ en: "Log Levels", ko: "로그 레벨" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Six levels, and the numbers beside them are OpenTelemetry severity bands rather than 0 through 5. They are what ndjson output, the SSE payload and a numeric --level filter all carry, so a table that renumbers them disagrees with the wire.",
              ko: "레벨은 여섯 개이고, 옆의 숫자는 0~5가 아니라 OpenTelemetry severity 대역입니다. ndjson 출력, SSE 페이로드, 숫자로 준 --level 필터가 모두 이 값을 싣기 때문에, 이 숫자를 다시 매긴 표는 실제 와이어와 어긋납니다.",
            })}
          </div>
          <Docs.IntroTable
            type={l.trans({ en: "Level", ko: "레벨" })}
            items={levels.map((level) => ({
              name: level.name,
              desc: l.trans({
                en: (
                  <span>
                    <code>{level.sev}</code> — {level.en}
                  </span>
                ),
                ko: (
                  <span>
                    <code>{level.sev}</code> — {level.ko}
                  </span>
                ),
              }),
            }))}
          />
          <div>
            {l.trans({
              en: "Three levels are configured separately because they answer different questions: what a human watching the terminal wants, what the container's stdout should carry to a collector, and how deep a sink that asked for nothing is allowed to go.",
              ko: "세 레벨을 따로 설정하는 이유는 서로 다른 질문에 답하기 때문입니다. 터미널을 보는 사람이 원하는 범위, 컨테이너 stdout이 수집기로 보내야 하는 범위, 그리고 아무것도 요청하지 않은 sink가 어디까지 내려갈 수 있는지입니다.",
            })}
          </div>
          <Docs.OptionTable
            items={[
              {
                key: "AKAN_PUBLIC_LOG_LEVEL",
                type: "trace | verbose | debug | info | warn | error",
                default: "info",
                desc: l.trans({
                  en: "The console level. log is accepted and means info, with a one-time deprecation warning at boot; an unrecognised name falls back silently.",
                  ko: "콘솔 레벨입니다. log도 받아들여지며 info를 뜻하고, 부팅 때 한 번 폐기 경고가 나갑니다. 인식되지 않는 이름은 조용히 기본값으로 떨어집니다.",
                }),
              },
              {
                key: "AKAN_LOG_STDOUT_LEVEL",
                type: "trace | verbose | debug | info | warn | error",
                default: "AKAN_PUBLIC_LOG_LEVEL",
                desc: l.trans({
                  en: "What the container's stdout carries, and the floor a child forwards from before the hub has asked for anything. It has no literal default — it tracks the console level.",
                  ko: "컨테이너 stdout이 싣는 범위이자, 허브가 아직 아무것도 요청하지 않았을 때 child가 올리는 기준선입니다. 고정 기본값이 없고 콘솔 레벨을 따라갑니다.",
                }),
              },
              {
                key: "AKAN_LOG_FILE_LEVEL",
                type: "trace | verbose | debug | info | warn | error",
                default: "trace",
                desc: l.trans({
                  en: "The floor for every sink that declared no minLevel — the rotating file and the hub included, not only the file. This is the most expensive default in the system.",
                  ko: "minLevel을 선언하지 않은 모든 sink의 기준선입니다. 파일만이 아니라 회전 로그 파일과 허브까지 포함합니다. 시스템에서 가장 비싼 기본값입니다.",
                }),
              },
            ]}
          />
          <Docs.Alert type="warning">
            {l.trans({
              en: (
                <span>
                  Give every sink a floor: <code>Logger.addSink(sink, {'{ minLevel: "info" }'})</code>. A sink that
                  supplies none follows <code>AKAN_LOG_FILE_LEVEL</code>, which defaults to <code>trace</code> — so one
                  floorless sink makes every <code>trace</code> and <code>verbose</code> call in the process build its
                  record instead of being rejected at the level check.
                </span>
              ),
              ko: (
                <span>
                  모든 sink에 기준선을 주세요. <code>Logger.addSink(sink, {'{ minLevel: "info" }'})</code>입니다. 값을
                  주지 않은 sink는 <code>AKAN_LOG_FILE_LEVEL</code>을 따르고 그 기본값은 <code>trace</code>입니다.
                  기준선 없는 sink 하나 때문에 프로세스의 모든 <code>trace</code>·<code>verbose</code> 호출이 레벨
                  검사에서 걸러지지 않고 레코드를 만들게 됩니다.
                </span>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="file-logging" title={l.trans({ en: "File Logging & Rotation", ko: "파일 로그와 로테이션" })}>
        <Docs.Title>{l.trans({ en: "File Logging & Rotation", ko: "파일 로그와 로테이션" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A supervised session writes file logs under the app's runtime directory. Gateway logs and child process logs are separated, and each process key rotates independently by local date and file size.",
              ko: "관리되는 세션은 앱 runtime 디렉터리 아래에 파일 로그를 씁니다. gateway 로그와 child process 로그는 분리되고, 각 process key는 로컬 날짜와 파일 크기 기준으로 독립적으로 회전합니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="Default log files"
            language="bash"
            code={`local/apps/myapp/runtime/logs/
  myapp-local-local-2026-05-25-gateway-0001.log
  myapp-local-local-2026-05-25-0-all-0001.log
  myapp-local-local-2026-05-25-1-federation-0001.log`}
          />
          <Docs.OptionTable
            items={[
              {
                key: "AKAN_LOG_TO_FILE",
                type: "0",
                default: "on, except in the generated image",
                desc: l.trans({
                  en: "Only the exact string 0 disables file logging — false does not. The Dockerfile Akan generates bakes 0, because a container's writable layer is ephemeral.",
                  ko: "정확히 문자열 0일 때만 파일 로깅이 꺼집니다. false로는 꺼지지 않습니다. Akan이 생성하는 Dockerfile은 0을 구워 넣습니다. 컨테이너의 쓰기 레이어는 사라지기 때문입니다.",
                }),
              },
              {
                key: "AKAN_LOG_DIR",
                type: "string",
                default: "<runtimeDir>/logs",
                desc: l.trans({
                  en: "Where the files are written. The runtime directory is runtime/ under NODE_ENV=production and local/apps/<app>/runtime otherwise.",
                  ko: "파일을 쓰는 위치입니다. runtime 디렉터리는 NODE_ENV=production이면 runtime/, 그 외에는 local/apps/<app>/runtime입니다.",
                }),
              },
              {
                key: "AKAN_LOG_MAX_SIZE_MB",
                type: "number",
                default: "50",
                desc: l.trans({
                  en: "Roll to the next sequence file past this size. A non-positive or unparseable value falls back to the default.",
                  ko: "이 크기를 넘으면 다음 sequence 파일로 넘어갑니다. 0 이하이거나 해석할 수 없는 값은 기본값으로 떨어집니다.",
                }),
              },
              {
                key: "AKAN_LOG_MAX_FILES",
                type: "number",
                default: "100",
                desc: l.trans({
                  en: "Files retained per process key. Applied per key, so replicas multiply the maximum disk usage.",
                  ko: "process key마다 보관하는 파일 수입니다. key별로 적용되므로 replica 수만큼 최대 디스크 사용량이 늘어납니다.",
                }),
              },
            ]}
          />
          <div>
            {l.trans({
              en: "The file name format is appName-environment-operationMode-YYYY-MM-DD-processKey-sequence.log. If the date changes, sequence starts again at 0001 for that date. If an app restarts, Akan continues from the next available sequence instead of overwriting old files.",
              ko: "파일명 형식은 appName-environment-operationMode-YYYY-MM-DD-processKey-sequence.log입니다. 날짜가 바뀌면 해당 날짜의 sequence는 0001부터 다시 시작합니다. 앱이 재시작되면 기존 파일을 덮어쓰지 않고 다음 sequence부터 이어 씁니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="reading-logs" title={l.trans({ en: "Reading Logs", ko: "로그 조회" })}>
        <Docs.Title>{l.trans({ en: "Reading Logs", ko: "로그 조회" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Start with the gateway log when the app cannot accept traffic, then inspect the child log that handled the request or background job. Child files include stdout and stderr prefixes.",
              ko: "앱이 트래픽을 받지 못한다면 gateway 로그부터 확인하고, 이후 요청이나 백그라운드 작업을 처리한 child 로그를 확인합니다. child 파일에는 stdout과 stderr prefix가 포함됩니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="Local lookup"
            language="bash"
            code={`# List current log files
ls -lh local/apps/myapp/runtime/logs

# Follow gateway logs
tail -f local/apps/myapp/runtime/logs/*-gateway-*.log

# Follow a child process log
tail -f local/apps/myapp/runtime/logs/*-0-all-*.log

# Search errors
rg "ERROR|Unhandled|Failed" local/apps/myapp/runtime/logs

# On a server, when AKAN_LOG_DIR is configured
ls -lh /var/log/akan
rg "invoice-sync|ERROR" /var/log/akan`}
          />
          <div className={panelRecipe({}, "text-foreground/70 text-sm")}>
            {l.trans({
              en: "Direct console.log calls from child servers are captured through stdout/stderr pipes. Direct console.log calls from the gateway process are not part of Logger sink capture, so prefer Logger in runtime code.",
              ko: "child server의 직접 console.log 호출은 stdout/stderr pipe를 통해 저장됩니다. gateway process의 직접 console.log 호출은 Logger sink 캡처 대상이 아니므로 runtime code에서는 Logger 사용을 권장합니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="live-tail" title={l.trans({ en: "Live Tail", ko: "실시간 조회" })}>
        <Docs.Title>{l.trans({ en: "Live Tail", ko: "실시간 조회" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "The running gateway — or the replica itself when it runs alone — keeps a ring buffer of records and serves a unix control socket in the runtime directory, chmod 0600, with no TCP port. Filesystem permission is the whole authentication. akan logs attaches to it, and so does .tail inside akan console.",
              ko: "실행 중인 gateway(단독 replica라면 replica 자신)가 레코드를 링 버퍼에 담고, runtime 디렉터리에 chmod 0600 unix 제어 소켓을 엽니다. TCP 포트는 없고, 파일시스템 권한이 인증의 전부입니다. akan logs와 akan console의 .tail이 여기에 붙습니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="Terminal"
            language="bash"
            code={`# Only warn and above whose message mentions payment, from any mutation
akan logs myapp --level warn --grep payment --endpoint "mutation:*"

# One request, start to finish
akan logs myapp --trace m8x1k2-a9f3c1

# What the RSC worker rendered, with the last 50 buffered records first
akan logs myapp --role rsc-worker --origin page --replay 50

# History only, as NDJSON
akan logs myapp --since 5m --follow false --json

# The same vocabulary inside the operator console
akan:myapp> .tail level=warn grep=payment endpoint=mutation:*
akan:myapp> .trace m8x1k2-a9f3c1
akan:myapp> .tail off`}
          />
          <Docs.OptionTable
            items={[
              {
                key: "--level",
                type: "string",
                desc: l.trans({
                  en: "Minimum level: trace, verbose, debug, info, warn, error. A bare severity number works too.",
                  ko: "최소 레벨입니다. trace, verbose, debug, info, warn, error. severity 숫자를 그대로 줘도 됩니다.",
                }),
              },
              {
                key: "--grep",
                type: "string",
                desc: l.trans({
                  en: "Substring the message must contain.",
                  ko: "메시지에 반드시 포함되어야 하는 부분 문자열입니다.",
                }),
              },
              {
                key: "--endpoint",
                type: "string",
                desc: l.trans({
                  en: "Endpoint glob(s), comma-separated: mutation:*, query:userList. Passing it always prints a notice that the primitive query fast path carries no endpoint and is not shown.",
                  ko: "endpoint glob 목록입니다. 쉼표로 구분합니다. mutation:*, query:userList. 이 플래그를 주면, primitive query fast path는 endpoint를 싣지 않아 표시되지 않는다는 안내가 항상 함께 출력됩니다.",
                }),
              },
              {
                key: "--trace",
                type: "string",
                desc: l.trans({ en: "One request's traceId.", ko: "요청 하나의 traceId입니다." }),
              },
              {
                key: "--child",
                type: "string",
                desc: l.trans({
                  en: "Replica index(es), comma-separated.",
                  ko: "replica 번호 목록입니다. 쉼표로 구분합니다.",
                }),
              },
              {
                key: "--role, -R",
                type: "string",
                desc: l.trans({
                  en: "Process role(s): gateway, all, batch, rsc-worker.",
                  ko: "프로세스 역할 목록입니다. gateway, all, batch, rsc-worker.",
                }),
              },
              {
                key: "--origin",
                type: "string",
                desc: l.trans({
                  en: "Call origin(s): http, websocket, mcp, internal, page.",
                  ko: "호출 origin 목록입니다. http, websocket, mcp, internal, page.",
                }),
              },
              {
                key: "--since",
                type: "string",
                desc: l.trans({
                  en: "Only records newer than this: 5m, 30s, or epoch ms. A value older than the ring prints what the buffer actually covers.",
                  ko: "이보다 새로운 레코드만 봅니다. 5m, 30s 또는 epoch ms. 링이 닿지 않는 값을 주면 버퍼가 실제로 담고 있는 구간을 알려줍니다.",
                }),
              },
              {
                key: "--replay, -n",
                type: "number",
                default: "0",
                desc: l.trans({
                  en: "Records to replay from the buffer before following. The default shows nothing historical unless you ask.",
                  ko: "따라가기 전에 버퍼에서 되감아 보여줄 레코드 수입니다. 기본값에서는 요청하지 않는 한 과거 기록이 나오지 않습니다.",
                }),
              },
              {
                key: "--json",
                type: "boolean",
                default: "false",
                desc: l.trans({
                  en: "Print NDJSON records instead of rendered lines.",
                  ko: "렌더링된 줄 대신 NDJSON 레코드를 출력합니다.",
                }),
              },
              {
                key: "--follow",
                type: "boolean",
                default: "true",
                desc: l.trans({
                  en: "Keep streaming; pass --follow false for history only.",
                  ko: "계속 스트리밍합니다. 과거 기록만 보려면 --follow false를 줍니다.",
                }),
              },
              {
                key: "--runtime-dir, -d",
                type: "string",
                default: "local/apps/<app>/runtime",
                desc: l.trans({
                  en: "Runtime dir holding akan-control.sock. Pass it for a built app running somewhere else.",
                  ko: "akan-control.sock이 있는 runtime 디렉터리입니다. 다른 곳에서 도는 빌드된 앱에는 이 값을 줍니다.",
                }),
              },
            ]}
          />
          <div className="grid gap-3 lg:grid-cols-3">
            {[
              [
                l.trans({ en: "Filters combine", ko: "필터는 결합됩니다" }),
                l.trans({
                  en: "Every flag ANDs with the others; a comma-separated list inside a flag is an OR. Globs use * only, and apply to the logger name and the endpoint.",
                  ko: "모든 플래그는 AND로 결합되고, 플래그 안의 쉼표 목록은 OR입니다. 글롭은 *만 지원하며 logger 이름과 endpoint에 적용됩니다.",
                }),
              ],
              [
                l.trans({ en: "Zero cost when nobody is watching", ko: "구독자가 없으면 비용 0" }),
                l.trans({
                  en: "A child forwards records over IPC only while a subscriber wants that level. AKAN_LOG_STREAM=1 keeps forwarding on; AKAN_LOG_BUFFER and AKAN_LOG_BUFFER_MB size the ring, 2000 records and 4MB by default, and only in the hub owner.",
                  ko: "child는 구독자가 그 레벨을 원하는 동안만 IPC로 레코드를 올립니다. AKAN_LOG_STREAM=1은 항상 전송하고, AKAN_LOG_BUFFER와 AKAN_LOG_BUFFER_MB가 링 크기를 정합니다. 기본값은 2000 레코드와 4MB이며, 허브 소유 프로세스에서만 의미가 있습니다.",
                }),
              ],
              [
                l.trans({ en: "What carries no context", ko: "문맥이 붙지 않는 경로" }),
                l.trans({
                  en: "Gateway-internal lines, the scheduler's own started/finished lines, and unauthenticated primitive GET queries served by the fast path have no traceId or endpoint. AKAN_LOG_CONTEXT=0 switches request context off everywhere.",
                  ko: "gateway 내부 로그, 스케줄러 자체의 started/finished 줄, fast path로 처리되는 비인증 primitive GET 쿼리는 traceId와 엔드포인트가 없습니다. AKAN_LOG_CONTEXT=0은 요청 문맥을 전부 끕니다.",
                }),
              ],
            ].map(([title, desc]) => (
              <div key={title} className={panelRecipe()}>
                <div className="font-bold text-foreground">{title}</div>
                <div className="mt-2 text-foreground/70 text-sm">{desc}</div>
              </div>
            ))}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide
        id="request-line"
        title={l.trans({ en: "Request Line & Flight Recorder", ko: "요청 요약 줄과 flight recorder" })}
      >
        <Docs.Title>
          {l.trans({ en: "Request Line & Flight Recorder", ko: "요청 요약 줄과 flight recorder" })}
        </Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Two opt-ins reduce noise instead of filtering it. The canonical request line writes one record per call at its end — ok or error, the endpoint, ms, status, userId, and under AKAN_TRACE=1 the db and cache figures — so a request is one line to grep, not a dozen.",
              ko: "두 가지 옵트인은 노이즈를 걸러내는 대신 줄입니다. 요청 요약 줄(canonical line)은 호출이 끝날 때 레코드 하나를 씁니다. ok 또는 error, 엔드포인트, ms, status, userId, 그리고 AKAN_TRACE=1이면 db·cache 수치까지 담겨서 요청 하나가 열두 줄이 아니라 grep 한 줄이 됩니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "The flight recorder is the other half. It keeps each call's own sub-level records and promotes them, marked flight=true, only when the call failed or ran past the threshold: trace-level detail for the request that went wrong, with the process level left at info.",
              ko: "flight recorder는 나머지 절반입니다. 호출마다 레벨 아래로 떨어진 자기 레코드를 들고 있다가, 실패했거나 임계를 넘긴 경우에만 flight=true로 표시해 올립니다. 프로세스 레벨은 info로 두고도 잘못된 요청에 대해서만 trace 상세를 얻습니다.",
            })}
          </div>
          <Docs.OptionTable
            items={[
              {
                key: "AKAN_LOG_CANONICAL",
                type: "1 | true | all | slow",
                default: "off",
                desc: l.trans({
                  en: "One summary record per call. slow writes it only for failed calls and those over AKAN_LOG_FLIGHT_MS.",
                  ko: "호출당 요약 레코드 하나입니다. slow는 실패한 호출과 AKAN_LOG_FLIGHT_MS를 넘긴 호출에만 씁니다.",
                }),
              },
              {
                key: "AKAN_LOG_FLIGHT",
                type: "1 | true",
                default: "off",
                desc: l.trans({
                  en: "Keep each call's last 64 sub-level records and promote them only when it failed or ran long.",
                  ko: "호출마다 레벨 아래 레코드를 최근 64개까지 들고 있다가, 실패했거나 오래 걸렸을 때만 올립니다.",
                }),
              },
              {
                key: "AKAN_LOG_FLIGHT_MS",
                type: "number",
                default: "1000",
                desc: l.trans({
                  en: "The slow threshold, shared by the flight recorder and canonical slow mode.",
                  ko: "느림 임계값입니다. flight recorder와 canonical의 slow 모드가 함께 씁니다.",
                }),
              },
              {
                key: "AKAN_LOG_FLIGHT_MAX",
                type: "number",
                default: "65536",
                desc: l.trans({
                  en: "Records held at once — records, not traces. Divided by the 64-record ring, that is about a thousand concurrent recorded calls; one past the cap runs unrecorded.",
                  ko: "동시에 보관하는 레코드 수입니다. trace 수가 아니라 레코드 수입니다. 호출당 링 64개로 나누면 동시에 기록되는 호출은 약 천 개이고, 상한을 넘긴 호출은 기록 없이 실행됩니다.",
                }),
              },
              {
                key: "AKAN_LOG_DEBUG_HEADER",
                type: "string",
                default: "unset",
                desc: l.trans({
                  en: "The secret an x-akan-debug header must match to lower one request to trace. Unset, the header is honoured only when AKAN_PUBLIC_ENV is local.",
                  ko: "요청 하나를 trace로 낮추기 위해 x-akan-debug 헤더가 맞춰야 하는 비밀값입니다. 설정하지 않으면 AKAN_PUBLIC_ENV가 local일 때만 헤더가 받아들여집니다.",
                }),
              },
              {
                key: "AKAN_TRACE",
                type: "1",
                default: "off",
                desc: l.trans({
                  en: "Adds span, db and cache figures to the canonical line.",
                  ko: "canonical 줄에 span·db·cache 수치를 더합니다.",
                }),
              },
            ]}
          />
          <Code.Snippet
            className="w-full"
            title="Terminal"
            language="bash"
            code={`curl -H "x-akan-debug: <secret>" https://api.example.com/api/refundPayment/ord_1
# stdout now carries that request's trace lines, marked debug=true, and nothing else changes`}
          />
          <div className="grid gap-3 lg:grid-cols-2">
            {[
              [
                l.trans({ en: "Promoted lines pass every floor", ko: "승격된 줄은 모든 floor를 통과" }),
                l.trans({
                  en: "A flight=true or debug=true record was asked for below the level, so a forwarder's floor, the stdout writer's level and a --level filter all let it through.",
                  ko: "flight=true 또는 debug=true 레코드는 레벨 아래에서 요청된 것이므로, forwarder의 floor, stdout writer의 레벨, --level 필터가 모두 통과시킵니다.",
                }),
              ],
              [
                l.trans({ en: "Cost", ko: "비용" }),
                l.trans({
                  en: "Measured: the recorder adds about 190ns to a clean call, the gate about 20ns per rejected log call inside a trace. Both are off by default; the memory cap is an operator's decision.",
                  ko: "측정치: recorder는 정상 호출에 약 190ns, 게이트는 trace 안의 거부된 로그 호출당 약 20ns를 더합니다. 둘 다 기본 off이며, 메모리 상한은 운영자의 결정입니다.",
                }),
              ],
            ].map(([title, desc]) => (
              <div key={title} className={panelRecipe()}>
                <div className="font-bold text-foreground">{title}</div>
                <div className="mt-2 text-foreground/70 text-sm">{desc}</div>
              </div>
            ))}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="collection" title={l.trans({ en: "Collection: NDJSON stdout", ko: "수집: NDJSON stdout" })}>
        <Docs.Title>{l.trans({ en: "Collection: NDJSON stdout", ko: "수집: NDJSON stdout" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Collection and live viewing are different problems. Collection must be lossless and restart-safe, so it is the container's stdout — and under AKAN_LOG_FORMAT=ndjson the hub owner becomes that stream's only writer. Every other server process turns its console off and forwards; the RSC worker is piped rather than inherited; and whatever either wrote past its Logger, a crash stack included, is wrapped as a raw=true record so the stream stays valid JSON.",
              ko: "수집과 실시간 조회는 다른 문제입니다. 수집은 무손실이고 재시작에 안전해야 하므로 컨테이너 stdout이 맡습니다. AKAN_LOG_FORMAT=ndjson이면 허브 소유 프로세스가 그 스트림의 유일한 writer가 됩니다. 나머지 서버 프로세스는 콘솔을 끄고 위로 올리며, RSC 워커는 상속 대신 파이프로 읽고, 둘 중 누가 Logger를 거치지 않고 쓴 것(크래시 스택 포함)도 raw=true 레코드로 감싸 스트림이 유효한 JSON으로 유지됩니다.",
            })}
          </div>
          <Docs.OptionTable
            items={[
              {
                key: "AKAN_LOG_FORMAT",
                type: "text | ndjson | ndjson-only",
                default: "text",
                desc: l.trans({
                  en: "ndjson makes stdout one JSON record per line; ndjson-only writes the rotating file as JSON too. Anything else parses as text. It is a whole-deployment setting — giving processes different values corrupts the stream.",
                  ko: "ndjson은 stdout을 한 줄에 JSON 하나로 만들고, ndjson-only는 회전 로그 파일까지 JSON으로 씁니다. 그 밖의 값은 text로 해석됩니다. 배포 전체에 걸린 설정이라, 프로세스마다 다른 값을 주면 스트림이 깨집니다.",
                }),
              },
              {
                key: "AKAN_LOG_STREAM",
                type: "1",
                default: "off",
                desc: l.trans({
                  en: "Pins a child's IPC forwarder on instead of letting it follow the hub's floor. Only a child has a forwarder, so it does nothing in a solo process.",
                  ko: "child의 IPC forwarder를 허브 기준선에 맡기지 않고 항상 켜 둡니다. forwarder는 child에만 있으므로 단독 프로세스에서는 아무 일도 하지 않습니다.",
                }),
              },
              {
                key: "AKAN_LOG_BUFFER",
                type: "number",
                default: "2000",
                desc: l.trans({
                  en: "Records the hub owner's ring holds. Evicted whenever either this or the byte cap is reached.",
                  ko: "허브 소유 프로세스의 링이 보관하는 레코드 수입니다. 이 값이나 바이트 상한 중 하나에 닿으면 밀려납니다.",
                }),
              },
              {
                key: "AKAN_LOG_BUFFER_MB",
                type: "number",
                default: "4",
                desc: l.trans({
                  en: "Byte cap on the same ring. Ignored unless it is a positive number.",
                  ko: "같은 링의 바이트 상한입니다. 양수가 아니면 무시됩니다.",
                }),
              },
            ]}
          />
          <Code.Snippet
            className="w-full"
            title="docker-compose.yml"
            code={`services:
  app:
    environment:
      AKAN_LOG_FORMAT: ndjson
      AKAN_LOG_TO_FILE: "0"              # the image default; the writable layer is ephemeral
      AKAN_LOG_STDOUT_LEVEL: info        # kubelet and json-file rotate by size, so trace can outrun the agent
    logging:
      driver: json-file
      options: { max-size: "50m", max-file: "5" }   # json-file never rotates unless told to`}
          />
          <Code.Snippet
            className="w-full"
            title="fluent-bit.conf"
            code={`[INPUT]
    name    tail
    path    /var/log/containers/*.log
    parser  cri
[FILTER]
    name          parser
    match         *
    key_name      log
    parser        json
    reserve_data  true
# Keep traceId and userId as JSON fields, not Loki labels: labels must stay low-cardinality.`}
          />
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="log-stream" title={l.trans({ en: "The SSE Stream", ko: "SSE 스트림" })}>
        <Docs.Title>{l.trans({ en: "The SSE Stream", ko: "SSE 스트림" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Live viewing is a session tool. GET /_akan/app/logs serves the hub as text/event-stream to a bearer token, resumable with Last-Event-ID, taking the same filter vocabulary as akan logs. Without AKAN_LOG_STREAM_TOKEN the route is not mounted at all — not mounted and answering 403, absent.",
              ko: "실시간 조회는 세션 도구입니다. GET /_akan/app/logs가 허브를 bearer 토큰에게 text/event-stream으로 제공하고, Last-Event-ID로 재개하며, akan logs와 같은 필터 어휘를 받습니다. AKAN_LOG_STREAM_TOKEN이 없으면 라우트는 아예 마운트되지 않습니다. 403을 답하는 것이 아니라 존재하지 않습니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="Terminal"
            language="bash"
            code={`curl -N -H "Authorization: Bearer $AKAN_LOG_STREAM_TOKEN" \\
     "http://<pod>:8282/_akan/app/logs?level=warn&endpoint=mutation:*"

# Reconnect where you left off; an evicted range arrives as an explicit gap event
curl -N -H "Authorization: Bearer $AKAN_LOG_STREAM_TOKEN" -H "Last-Event-ID: 84213" \\
     "http://<pod>:8282/_akan/app/logs?level=warn"`}
          />
          <div className="grid gap-3 lg:grid-cols-3">
            {[
              [
                l.trans({ en: "Only the hub owner has it", ko: "허브 소유 프로세스에만 있음" }),
                l.trans({
                  en: "The route is mounted by the gateway, or by a solo replica. A non-solo child does not serve it, so a token alone is not enough to reach one.",
                  ko: "라우트는 gateway 또는 단독 replica가 마운트합니다. 단독이 아닌 child는 제공하지 않으므로, 토큰만으로는 그 프로세스에 닿을 수 없습니다.",
                }),
              ],
              [
                l.trans({ en: "Gaps are explicit", ko: "갭은 명시" }),
                l.trans({
                  en: "Every SSE event's id is the hub seq. A Last-Event-ID the ring no longer reaches answers with a gap event naming the missed range, and one from before a restart with sequence-reset — never a silent skip.",
                  ko: "SSE 이벤트의 id는 허브 seq입니다. 링이 더 이상 닿지 않는 Last-Event-ID에는 놓친 구간을 적은 gap 이벤트로, 재시작 이전의 id에는 sequence-reset으로 답합니다. 조용히 건너뛰지 않습니다.",
                }),
              ],
              [
                l.trans({ en: "Not the collection path", ko: "수집 경로가 아님" }),
                l.trans({
                  en: "A subscription loses the whole gap of a pod restart and needs a route to every pod. Use it to watch one process now; what must be kept goes through stdout and the node agent.",
                  ko: "구독은 pod 재시작 구간을 통째로 잃고 모든 pod에 개별로 붙어야 합니다. 지금 프로세스 하나를 보는 용도로 쓰고, 보관해야 하는 것은 stdout과 노드 에이전트로 보냅니다.",
                }),
              ],
            ].map(([title, desc]) => (
              <div key={title} className={panelRecipe()}>
                <div className="font-bold text-foreground">{title}</div>
                <div className="mt-2 text-foreground/70 text-sm">{desc}</div>
              </div>
            ))}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="operational-checklist" title={l.trans({ en: "Operational Checklist", ko: "운영 체크리스트" })}>
        <Docs.Title>{l.trans({ en: "Operational Checklist", ko: "운영 체크리스트" })}</Docs.Title>
        <Docs.Description>
          <div className="space-y-3">
            {[
              [
                l.trans({ en: "Keep terminal logs readable", ko: "터미널 로그는 읽기 쉽게 유지" }),
                l.trans({
                  en: "Use AKAN_PUBLIC_LOG_LEVEL=info or warn in production and increase it temporarily during live debugging.",
                  ko: "운영에서는 AKAN_PUBLIC_LOG_LEVEL=info 또는 warn을 사용하고, 실시간 디버깅이 필요할 때만 임시로 올립니다.",
                }),
              ],
              [
                l.trans({ en: "Give every sink a floor", ko: "모든 sink에 floor 주기" }),
                l.trans({
                  en: "Pass minLevel to Logger.addSink. A floorless sink follows AKAN_LOG_FILE_LEVEL, which is trace, and makes every trace call in the process build a record.",
                  ko: "Logger.addSink에 minLevel을 넘기세요. floor 없는 sink는 AKAN_LOG_FILE_LEVEL을 따르고 그 값은 trace이며, 프로세스의 모든 trace 호출이 레코드를 만들게 됩니다.",
                }),
              ],
              [
                l.trans({ en: "Never log per delivered record", ko: "레코드마다 로그 남기지 않기" }),
                l.trans({
                  en: "Anything that delivers records — a forwarder, a sink, the stream route — must not log per item, or it feeds on its own output.",
                  ko: "레코드를 전달하는 것 — forwarder, sink, 스트림 라우트 — 은 항목마다 로그를 남기면 안 됩니다. 자기 출력을 다시 먹습니다.",
                }),
              ],
              [
                l.trans({ en: "Plan disk usage", ko: "디스크 사용량 계획" }),
                l.trans({
                  en: "AKAN_LOG_MAX_SIZE_MB and AKAN_LOG_MAX_FILES are applied per process key, so replicas multiply the maximum disk usage.",
                  ko: "AKAN_LOG_MAX_SIZE_MB와 AKAN_LOG_MAX_FILES는 process key별로 적용되므로 replica 수만큼 최대 디스크 사용량이 늘어납니다.",
                }),
              ],
              [
                l.trans({ en: "Avoid secrets", ko: "비밀값 로깅 금지" }),
                l.trans({
                  en: "Key-name redaction only covers attrs, and only keys naming a secret. A token interpolated into the message text is not redacted, and file logs outlive terminal output.",
                  ko: "키 이름 기반 가림은 attrs에만, 그것도 비밀값을 뜻하는 키에만 적용됩니다. 메시지 문자열에 끼워 넣은 토큰은 가려지지 않으며, 파일 로그는 터미널 출력보다 오래 남습니다.",
                }),
              ],
            ].map(([title, desc]) => (
              <div key={title} className={panelRecipe()}>
                <div className="font-bold text-foreground">{title}</div>
                <div className="mt-2 text-foreground/70 text-sm">{desc}</div>
              </div>
            ))}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <DocsToc />
    </Scroll>
  );
});
