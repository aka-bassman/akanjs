import { usePage } from "@apps/akan/client";
import { Code, Divider, Docs, DocsToc, panelRecipe } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";

export default function Page() {
  const { l } = usePage();
  return (
    <Scroll>
      <Scroll.Slide id="logging-overview" title={l.trans({ en: "Runtime Logging", ko: "런타임 로깅" })}>
        <Docs.Title>{l.trans({ en: "Runtime Logging", ko: "런타임 로깅" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Akan uses Logger for structured runtime output and AkanApp stores gateway and child process logs as files. Terminal logging stays concise for development, while file logging keeps richer records for later inspection.",
              ko: "Akan은 structured runtime output을 위해 Logger를 사용하고, AkanApp은 gateway와 child process 로그를 파일로 저장합니다. 터미널 로그는 개발 중 보기 좋게 유지하고, 파일 로그는 사후 확인을 위해 더 자세한 기록을 남깁니다.",
            })}
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            {[
              [
                l.trans({ en: "Logger API", ko: "Logger API" }),
                "new Logger(name)",
                l.trans({
                  en: "Use named loggers in services, adaptors, scripts, and runtime code.",
                  ko: "서비스, 어댑터, 스크립트, 런타임 코드에서 이름이 있는 logger를 사용합니다.",
                }),
              ],
              [
                l.trans({ en: "Terminal level", ko: "터미널 레벨" }),
                "AKAN_PUBLIC_LOG_LEVEL",
                l.trans({
                  en: "Controls what is printed to stdout and stderr.",
                  ko: "stdout과 stderr에 출력할 로그 범위를 제어합니다.",
                }),
              ],
              [
                l.trans({ en: "File level", ko: "파일 레벨" }),
                "AKAN_LOG_FILE_LEVEL",
                l.trans({
                  en: "Controls what Logger output is written to log files. Defaults to trace.",
                  ko: "Logger 출력 중 파일에 저장할 범위를 제어합니다. 기본값은 trace입니다.",
                }),
              ],
            ].map(([title, code, desc]) => (
              <div key={title} className={panelRecipe()}>
                <div className="font-bold text-foreground">{title}</div>
                <div className="my-2 font-mono text-primary text-sm">{code}</div>
                <div className="text-foreground/70 text-sm">{desc}</div>
              </div>
            ))}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="using-logger" title={l.trans({ en: "Using Logger", ko: "Logger 사용법" })}>
        <Docs.Title>{l.trans({ en: "Using Logger", ko: "Logger 사용법" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Create a Logger with a component or service name, then write logs at the level that matches the intent. Add context when the same logger handles several jobs.",
              ko: "컴포넌트나 서비스 이름으로 Logger를 만들고, 의도에 맞는 level로 로그를 남깁니다. 하나의 logger가 여러 작업을 처리한다면 context를 함께 넣습니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="Service logging"
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
          <div className={panelRecipe({}, "text-foreground/70 text-sm")}>
            {l.trans({
              en: "Use trace or debug for detailed diagnosis, info/log for normal lifecycle events, warn for recoverable issues, and error when an operation failed or needs attention.",
              ko: "상세 진단에는 trace/debug를, 일반 라이프사이클 이벤트에는 info/log를, 복구 가능한 문제에는 warn을, 작업 실패나 확인이 필요한 상황에는 error를 사용합니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="log-levels" title={l.trans({ en: "Log Levels", ko: "로그 레벨" })}>
        <Docs.Title>{l.trans({ en: "Log Levels", ko: "로그 레벨" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Terminal output and file output are intentionally separated. A production server can keep the terminal at info or warn while still writing trace-level Logger records to files. The ladder is trace, verbose, debug, info, warn, error; logger.log() is kept for compatibility and emits at info, and AKAN_PUBLIC_LOG_LEVEL=log means info.",
              ko: "터미널 출력과 파일 출력은 의도적으로 분리되어 있습니다. 운영 서버는 터미널을 info 또는 warn으로 유지하면서도 파일에는 trace 수준의 Logger 기록을 남길 수 있습니다. 레벨은 trace, verbose, debug, info, warn, error 순서이며, logger.log()는 호환을 위해 남아 info로 출력되고 AKAN_PUBLIC_LOG_LEVEL=log는 info와 같습니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title=".env"
            language="bash"
            code={`# Terminal output
AKAN_PUBLIC_LOG_LEVEL=info

# File output for structured Logger messages
AKAN_LOG_FILE_LEVEL=trace

# Turn file logging off when needed
AKAN_LOG_TO_FILE=0`}
          />
          <div className="grid gap-3 lg:grid-cols-2">
            {[
              [
                l.trans({ en: "Terminal", ko: "터미널" }),
                l.trans({
                  en: "Controlled by AKAN_PUBLIC_LOG_LEVEL. Lower-priority messages are not printed to stdout/stderr.",
                  ko: "AKAN_PUBLIC_LOG_LEVEL로 제어합니다. 낮은 우선순위 메시지는 stdout/stderr에 출력하지 않습니다.",
                }),
              ],
              [
                l.trans({ en: "Files", ko: "파일" }),
                l.trans({
                  en: "Controlled by AKAN_LOG_FILE_LEVEL. Defaults to trace so structured Logger messages are preserved even when the terminal is quiet.",
                  ko: "AKAN_LOG_FILE_LEVEL로 제어합니다. 기본값은 trace라서 터미널이 조용해도 structured Logger 메시지를 보존합니다.",
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

      <Scroll.Slide id="file-logging" title={l.trans({ en: "File Logging & Rotation", ko: "파일 로그와 로테이션" })}>
        <Docs.Title>{l.trans({ en: "File Logging & Rotation", ko: "파일 로그와 로테이션" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "When AkanApp starts, it writes file logs under the app runtime directory by default. Gateway logs and child process logs are separated, and each process key rotates independently by local date and file size.",
              ko: "AkanApp이 시작되면 기본적으로 앱 runtime 디렉터리 아래에 파일 로그를 저장합니다. gateway 로그와 child process 로그는 분리되고, 각 process key는 로컬 날짜와 파일 크기 기준으로 독립적으로 회전합니다.",
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
          <Code.Snippet
            className="w-full"
            title="Rotation configuration"
            language="bash"
            code={`# Override the log directory
AKAN_LOG_DIR=/var/log/akan

# Create the next sequence file after this size
AKAN_LOG_MAX_SIZE_MB=50

# Keep this many files per process key
AKAN_LOG_MAX_FILES=100`}
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
rg "ERROR|Unhandled|Failed" local/apps/myapp/runtime/logs`}
          />
          <Code.Snippet
            className="w-full"
            title="Server lookup"
            language="bash"
            code={`# When AKAN_LOG_DIR is configured
ls -lh /var/log/akan
tail -f /var/log/akan/*-gateway-*.log
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
              en: "Every Logger call is a record before it is a line: level, logger name, process role, replica index, and — inside a request — the traceId, the endpoint (mutation:signScContract) and the origin (http, websocket, mcp, internal, page). The running gateway, or the replica itself when it runs alone, keeps a ring buffer of them and serves a unix control socket in the runtime directory. akan logs attaches to it, and so does .tail inside akan console.",
              ko: "모든 Logger 호출은 문자열이 되기 전에 레코드입니다. 레벨, 로거 이름, 프로세스 역할, replica 번호, 그리고 요청 안에서는 traceId, 엔드포인트(mutation:signScContract), origin(http, websocket, mcp, internal, page)이 함께 실립니다. 실행 중인 gateway(단독 replica라면 replica 자신)가 링 버퍼에 이를 담아 runtime 디렉터리의 unix 제어 소켓으로 제공하고, akan logs와 akan console의 .tail이 여기에 붙습니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="akan logs"
            language="bash"
            code={`# Only warn and above whose message mentions payment, from any mutation
akan logs myapp --level warn --grep payment --endpoint "mutation:*"

# One request, start to finish
akan logs myapp --trace m8x1k2-a9f3c1

# What the RSC worker rendered, with the last 50 buffered records first
akan logs myapp --role rsc-worker --origin page --replay 50

# History only, as NDJSON
akan logs myapp --since 5m --follow false --json`}
          />
          <Code.Snippet
            className="w-full"
            title="akan console"
            language="bash"
            code={`akan:myapp> .tail level=warn grep=payment endpoint=mutation:*
akan:myapp> .trace m8x1k2-a9f3c1
akan:myapp> .tail off`}
          />
          <div className="grid gap-3 lg:grid-cols-3">
            {[
              [
                l.trans({ en: "Filters combine", ko: "필터는 결합됩니다" }),
                l.trans({
                  en: "Every flag ANDs with the others; a comma-separated list inside a flag is an OR. Globs use * only.",
                  ko: "모든 플래그는 AND로 결합되고, 플래그 안의 쉼표 목록은 OR입니다. 글롭은 *만 지원합니다.",
                }),
              ],
              [
                l.trans({ en: "Zero cost when nobody is watching", ko: "구독자가 없으면 비용 0" }),
                l.trans({
                  en: "A child forwards records over IPC only while a subscriber wants that level. AKAN_LOG_STREAM=1 keeps forwarding on; AKAN_LOG_BUFFER and AKAN_LOG_BUFFER_MB size the ring.",
                  ko: "child는 구독자가 그 레벨을 원하는 동안만 IPC로 레코드를 올립니다. AKAN_LOG_STREAM=1은 항상 전송하고, AKAN_LOG_BUFFER와 AKAN_LOG_BUFFER_MB가 링 버퍼 크기를 정합니다.",
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
                l.trans({ en: "Preserve file detail", ko: "파일 상세도 보존" }),
                l.trans({
                  en: "Keep AKAN_LOG_FILE_LEVEL=trace unless log volume or sensitive fields require a narrower level.",
                  ko: "로그량이나 민감 필드 때문에 범위를 줄여야 하는 경우가 아니라면 AKAN_LOG_FILE_LEVEL=trace를 유지합니다.",
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
                  en: "Do not log tokens, passwords, database URLs, or private payloads. File logs are designed to last longer than terminal output.",
                  ko: "토큰, 비밀번호, database URL, private payload는 로그로 남기지 않습니다. 파일 로그는 터미널 출력보다 오래 보관되도록 설계되어 있습니다.",
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
}
