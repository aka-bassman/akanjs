import { usePage } from "@apps/akan/client";
import { Code, Divider, Docs, DocsList, DocsToc, panelRecipe } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";
import { Link } from "akanjs/ui";

export default page().render(() => {
  const { l } = usePage();

  return (
    <Scroll>
      <Scroll.Slide id="overview" title={l.trans({ en: "MCP Server", ko: "MCP 서버" })}>
        <Docs.Title>{l.trans({ en: "MCP Server", ko: "MCP 서버" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  Every signal you already wrote is served to AI agents at <code>POST /mcp</code>. There is no second
                  API and nothing to write in a signal file: the same endpoint runs through the same guards, middleware,
                  and service. The in-page chat is a different surface —{" "}
                  <Link href="/docs/arch/agentic" className="text-primary">
                    In-Page Agent
                  </Link>
                  .
                </span>
              ),
              ko: (
                <span>
                  이미 작성한 signal이 <code>POST /mcp</code>에서 AI agent에게 그대로 제공됩니다. 별도의 API도, signal
                  파일에 적을 옵션도 없습니다. 같은 endpoint가 같은 guard·middleware·service를 탑니다. 페이지 안 채팅은
                  다른 표면입니다 —{" "}
                  <Link href="/docs/arch/agentic" className="text-primary">
                    인페이지 에이전트
                  </Link>
                  .
                </span>
              ),
            })}
          </div>
          <div className="space-y-1">
            {[
              {
                title: "query · mutation",
                desc: l.trans({
                  en: "Become tools. A generated read also gets a resource URI.",
                  ko: "tool이 됩니다. 생성된 조회에는 resource URI도 붙습니다.",
                }),
              },
              {
                title: "page().prompt()",
                desc: l.trans({
                  en: "A screen published from its page file as a slash command the user invokes, not the model.",
                  ko: "page 파일에서 게시되는 화면입니다. model이 고르는 것이 아니라 사용자가 호출하는 slash command입니다.",
                }),
              },
              {
                title: "pubsub · message",
                desc: l.trans({
                  en: "Never exposed — their arguments read a socket MCP does not have.",
                  ko: "노출되지 않습니다. 인자가 MCP 요청에 없는 socket을 읽습니다.",
                }),
              },
            ].map(({ title, desc }) => (
              <div key={title} className={panelRecipe({ padding: "row" })}>
                <span className="font-mono font-semibold text-primary">{title}: </span>
                <span className="text-foreground/70 text-sm">{desc}</span>
              </div>
            ))}
          </div>
          <div>
            {l.trans({
              en: "Exposure follows the guards, and there is no per-endpoint opt-in. Every candidate walks one ordered ladder at boot, first match wins, and whichever rung it stopped on is the sentence the boot log prints:",
              ko: "노출은 guard를 따르고, endpoint별 opt-in은 없습니다. 모든 후보는 부팅 때 순서가 정해진 사다리 하나를 지나며, 먼저 걸리는 곳에서 멈춥니다. 멈춘 자리가 그대로 부팅 로그에 찍히는 문장입니다:",
            })}
          </div>
          <Docs.Mermaid
            title={l.trans({ en: "Published, or refused and why", ko: "게시되거나, 거부되거나" })}
            highlightNodes={["ok"]}
            chart={`flowchart TB
  start["Endpoint at boot"] --> d1{"declares mcp: false?"}
  d1 -->|yes| off["Refused — curated off, HTTP unchanged"]
  d1 -->|no| d2{"a guard with agents = false?"}
  d2 -->|yes| person["Refused — an act reserved for a person"]
  d2 -->|no| d3{"guards empty or absent?"}
  d3 -->|yes| noguard["Refused — no decision was ever made"]
  d3 -->|no| d4{"the generated light read?"}
  d4 -->|yes| dup["Refused — call the full read instead"]
  d4 -->|no| d5{"pubsub or message?"}
  d5 -->|yes| ws["Refused — it reads a socket"]
  d5 -->|no| d6{"read-only deployment, and not a query?"}
  d6 -->|yes| ro["Refused — deployment valve"]
  d6 -->|no| d7{"returns Any, Upload or Binary, or takes a file?"}
  d7 -->|yes| shape["Refused — it cannot be described"]
  d7 -->|no| d8{"a mutation whose only guard is Public?"}
  d8 -->|yes| pub["Refused — that is having no guard"]
  d8 -->|no| d9{"a required argument typed Any?"}
  d9 -->|yes| opaque["Refused — expose a named filter slice"]
  d9 -->|no| ok["Published"]`}
          />
          <Docs.Alert type="info">
            {l.trans({
              en: (
                <span>
                  A refused endpoint answers the <em>same</em> unknown-tool error as one that does not exist, and a
                  guard's refusal is generalized to <code>You are not permitted to perform this action.</code> — never
                  the guard's name. Never make either message more helpful: the difference is exactly what enumerates
                  your private surface.
                </span>
              ),
              ko: (
                <span>
                  거부된 endpoint는 존재하지 않는 endpoint와 <em>같은</em> unknown tool 에러를 돌려주고, guard의 거절은{" "}
                  <code>You are not permitted to perform this action.</code>으로 일반화됩니다. guard 이름은 실리지
                  않습니다. 두 메시지를 더 친절하게 만들지 마세요. 그 차이가 바로 비공개 표면을 열거해 주는 단서입니다.
                </span>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="enable" title={l.trans({ en: "1. Turn The Server On", ko: "1. 서버 켜기" })}>
        <Docs.Title>{l.trans({ en: "1. Turn The Server On", ko: "1. 서버 켜기" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "/mcp is mounted by default. Configure it in lib/option.ts — not main.ts — so the process that mounts the route actually receives the settings. Every lib's option is read in mount order with the app's last. A value written in code wins over the env of the same name, but writing undefined does not erase one.",
              ko: "/mcp는 기본으로 마운트됩니다. 설정은 main.ts가 아니라 lib/option.ts에 씁니다. 실제로 라우트를 마운트하는 프로세스에 전달되는 파일이기 때문입니다. 모든 lib의 option을 마운트 순서대로 읽고 앱의 것을 마지막에 얹습니다. 코드에 쓴 값이 같은 이름의 env를 이기지만, undefined를 쓴다고 env 값이 지워지지는 않습니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/myapp/lib/option.ts"
            code={`export const option = new AkanOption<ModulesOptions>().setMcp({
  instructions: "Domain tools for the akan app. Start from taskListInTodo.",
  language: "en",
  outputSchema: "shallow",
});

// setMcp also takes a function, for a value that has to come from the server env:
//   .setMcp((env) => ({ readOnly: env.environment !== "main" }))`}
          />
          <Docs.OptionTable
            items={[
              {
                key: "enabled",
                type: "boolean",
                default: "true",
                desc: l.trans({
                  en: "Whether the route is mounted at all. AKAN_MCP / AKAN_PUBLIC_MCP is an opt-out: only the literal false or 0 turns it off.",
                  ko: "라우트를 마운트할지 여부입니다. AKAN_MCP / AKAN_PUBLIC_MCP는 opt-out이라, 문자열 false나 0일 때만 꺼집니다.",
                }),
              },
              {
                key: "readOnly",
                type: "boolean",
                default: "false",
                desc: l.trans({
                  en: "Drops every endpoint that is not a query, whatever its guards allow — a deployment valve, not the exposure switch. AKAN_MCP_READONLY is an opt-in: only true or 1 turns it on.",
                  ko: "guard가 무엇을 허용하든 query가 아닌 endpoint를 전부 뺍니다. 노출 스위치가 아니라 배포 밸브입니다. AKAN_MCP_READONLY는 opt-in이라 true나 1일 때만 켜집니다.",
                }),
              },
              {
                key: "path",
                type: "string",
                default: "/mcp",
                desc: l.trans({
                  en: "Mount path. The published OAuth resource identifier follows it, so changing it changes the aud a token has to carry. AKAN_MCP_PATH, normalized to a leading slash.",
                  ko: "마운트 경로입니다. 게시되는 OAuth resource 식별자가 이 값을 따르므로, 바꾸면 토큰이 실어야 하는 aud도 바뀝니다. AKAN_MCP_PATH이며 앞에 슬래시가 붙도록 정규화됩니다.",
                }),
              },
              {
                key: "version",
                type: "string",
                default: "0.0.0",
                desc: l.trans({
                  en: "Reported as serverInfo.version — the same placeholder the OpenAPI document uses. AKAN_MCP_VERSION.",
                  ko: "serverInfo.version으로 보고됩니다. OpenAPI 문서가 쓰는 것과 같은 자리표시자입니다. AKAN_MCP_VERSION.",
                }),
              },
              {
                key: "instructions",
                type: "string",
                default: "Domain tools for the <app> app.",
                desc: l.trans({
                  en: "What this app is for and which tool to reach for first, handed to the model with the tool list. AKAN_MCP_INSTRUCTIONS.",
                  ko: "이 앱이 무엇을 위한 것인지, 어떤 tool부터 잡아야 하는지를 tool 목록과 함께 model에게 전달합니다. AKAN_MCP_INSTRUCTIONS.",
                }),
              },
              {
                key: "allowedOrigins",
                type: "string[]",
                default: "[]",
                desc: l.trans({
                  en: "Extra origins past the DNS-rebinding check, beyond the server's own host. Only a browser-hosted client sends Origin. AKAN_MCP_ALLOWED_ORIGINS, comma-separated.",
                  ko: "DNS rebinding 검사에서 서버 자신의 호스트 외에 추가로 허용할 origin입니다. Origin을 보내는 것은 브라우저 client뿐입니다. AKAN_MCP_ALLOWED_ORIGINS, 쉼표로 구분합니다.",
                }),
              },
              {
                key: "pageSize",
                type: "number",
                default: "100",
                desc: l.trans({
                  en: "Entries per catalogue page. A client that wants the whole list follows nextCursor until it stops. AKAN_MCP_PAGE_SIZE.",
                  ko: "카탈로그 페이지당 항목 수입니다. 전체 목록이 필요한 client는 nextCursor가 끝날 때까지 따라갑니다. AKAN_MCP_PAGE_SIZE.",
                }),
              },
              {
                key: "language",
                type: "string",
                default: "en",
                desc: l.trans({
                  en: "The one language the catalogue and its error text are written in. Server-wide on purpose: the document is built once at boot and read by a model, not a person. AKAN_MCP_LANGUAGE.",
                  ko: "카탈로그와 그 에러 문구를 쓰는 언어 하나입니다. 문서는 부팅 때 한 번 만들어지고 사람이 아니라 model이 읽으므로, 의도적으로 서버 전체 설정입니다. AKAN_MCP_LANGUAGE.",
                }),
              },
              {
                key: "outputSchema",
                type: '"full" | "shallow" | "none"',
                default: "shallow",
                desc: l.trans({
                  en: "How much of a result's shape each tool advertises. shallow names a nested model instead of inlining it, full inlines the whole closure, none publishes no outputSchema and keeps the text block on. AKAN_MCP_OUTPUT_SCHEMA.",
                  ko: "결과 모양을 tool이 어디까지 광고할지입니다. shallow는 중첩 model을 인라인하지 않고 이름만 적고, full은 폐포 전체를 인라인하며, none은 outputSchema를 아예 게시하지 않고 text block을 켜 둡니다. AKAN_MCP_OUTPUT_SCHEMA.",
                }),
              },
              {
                key: "legacyTextBlock",
                type: "boolean",
                default: "true",
                desc: l.trans({
                  en: "Whether a structured result also ships as serialized JSON in the text block — a flat doubling of every model-returning call. AKAN_MCP_LEGACY_TEXT can only turn it off; there is no env spelling that turns it back on.",
                  ko: "구조화된 결과를 text block에 직렬화 JSON으로 한 번 더 실을지 여부입니다. model을 반환하는 모든 호출이 그대로 두 배가 됩니다. AKAN_MCP_LEGACY_TEXT는 끄기만 할 수 있고, 다시 켜는 env 철자는 없습니다.",
                }),
              },
              {
                key: "rateLimit",
                type: "{ calls?, windowMs?, concurrent? } | false",
                default: "120 calls / 60s, 8 in flight",
                desc: l.trans({
                  en: "Per-caller budget for tools/call, resources/read and prompts/get, counted per process — so replicas do not share it. Listings are not counted. false takes it off and warns at boot. AKAN_MCP_RATE_LIMIT and AKAN_MCP_CONCURRENT.",
                  ko: "tools/call, resources/read, prompts/get에 대한 호출자별 예산이며 프로세스 단위로 셉니다. replica끼리 공유하지 않습니다. 목록 조회는 세지 않습니다. false면 끄고 부팅 때 경고합니다. AKAN_MCP_RATE_LIMIT, AKAN_MCP_CONCURRENT.",
                }),
              },
              {
                key: "promptBudget",
                type: "number",
                default: "60000",
                desc: l.trans({
                  en: "Characters of screen data one page prompt may attach before its lists are cut, largest first. A page's own limit is right for a screen and wrong for a model's window. AKAN_MCP_PROMPT_BUDGET.",
                  ko: "page prompt 하나가 붙일 수 있는 화면 데이터 글자 수이며, 넘으면 큰 목록부터 잘립니다. page 자신의 limit은 화면에는 맞고 model의 컨텍스트에는 맞지 않습니다. AKAN_MCP_PROMPT_BUDGET.",
                }),
              },
              {
                key: "auth",
                type: "{ authorizationServers?, scopes?, resource?, verify? }",
                default: "{}",
                desc: l.trans({
                  en: "OAuth resource-server identity. Naming an authorization server makes a credential mandatory rather than advertising one. AKAN_MCP_AUTH_SERVERS, AKAN_MCP_SCOPES, AKAN_MCP_RESOURCE; verify is a function and has no env spelling.",
                  ko: "OAuth resource server 신원입니다. authorization server를 적으면 광고에 그치지 않고 credential이 필수가 됩니다. AKAN_MCP_AUTH_SERVERS, AKAN_MCP_SCOPES, AKAN_MCP_RESOURCE이며, verify는 함수라 env 철자가 없습니다.",
                }),
              },
            ]}
          />
          <Docs.Alert type="warning">
            {l.trans({
              en: (
                <span>
                  <code>outputSchema: "none"</code> silently turns <code>legacyTextBlock</code> back on and warns at
                  boot if you wrote both — a result with no schema has to arrive as text or the client cannot read it at
                  all.
                </span>
              ),
              ko: (
                <span>
                  <code>outputSchema: "none"</code>은 <code>legacyTextBlock</code>을 조용히 다시 켜고, 둘을 같이 적으면
                  부팅 때 경고합니다. schema가 없는 결과는 text로 오지 않으면 client가 아예 읽을 수 없기 때문입니다.
                </span>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="tool" title={l.trans({ en: "2. Write An Endpoint", ko: "2. Endpoint 작성하기" })}>
        <Docs.Title>{l.trans({ en: "2. Write An Endpoint", ko: "2. Endpoint 작성하기" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Name the guards and you are done. The tool name is the endpoint key, the input schema comes from the declared arguments, and the output schema from the return model.",
              ko: "guard만 적으면 끝입니다. tool 이름은 endpoint key 그대로이고, input schema는 선언한 인자에서, output schema는 반환 model에서 나옵니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/myapp/lib/task/task.signal.ts"
            code={`export class TaskEndpoint extends endpoint(srv.task, ({ query, mutation }) => ({
  taskSummary: query(cnst.TaskInsight, { guards: [SignedIn] })
    .search("status", cnst.TaskStatus)
    .exec(async function (status) {
      return await this.taskService.insightByStatuses([status ?? "todo"]);
    }),
  startTask: mutation(cnst.Task, { guards: [CanWriteTask] })
    .param("taskId", ID)
    .exec(async function (taskId) {
      return await this.taskService.startTask(taskId);
    }),
})) {}`}
          />
          <div>
            {l.trans({
              en: "Write the dictionary entry at the same time. An agent picks a tool by its description, so a missing one is a broken tool — the boot log warns for every published entry that has none.",
              ko: "dictionary 항목도 같이 씁니다. agent는 설명을 보고 tool을 고르므로, 설명이 없는 tool은 고장난 tool입니다. 설명 없이 게시된 항목마다 부팅 로그가 경고를 남깁니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/myapp/lib/task/task.dictionary.ts"
            code={`.endpoint<TaskEndpoint>((fn) => ({
  startTask: fn(["Start Task", "작업 시작"])
    .desc(["Moves one task from todo to in progress", "할 일 하나를 진행중으로 옮깁니다"])
    .arg((t) => ({ taskId: t(["Task ID", "할 일 ID"]).desc(["The task to start", "시작할 할 일"]) })),
}))`}
          />
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="slice" title={l.trans({ en: "3. Slices And CRUD", ko: "3. Slice와 CRUD" })}>
        <Docs.Title>{l.trans({ en: "3. Slices And CRUD", ko: "3. Slice와 CRUD" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Generated CRUD publishes from the slice() guards map — get, cru, and the per-verb entries. A named slice does not inherit that map: write its own guards, or it is refused and named in the boot log.",
              ko: "생성된 CRUD는 slice() guards map — get·cru·verb별 항목 — 으로 게시됩니다. 이름 있는 slice는 그 맵을 물려받지 않습니다. 자기 guard를 직접 적으세요. 없으면 거부되고 부팅 로그에 이름이 남습니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "mcp: false keeps an entry off the shelf without touching its guards. On slice() it mirrors the guards map key for key — root, get, cru, create, update, remove — and reaches exactly as far: the root slice and generated CRUD, never a named slice or a custom endpoint. Those write their own. A bare mcp: false expands to root, get and cru only; create, update and remove then inherit cru.",
              ko: "mcp: false는 guard를 건드리지 않고 항목만 선반에서 뺍니다. slice()에서는 guards map을 키 단위로 그대로 따라갑니다. root, get, cru, create, update, remove이며, 범위도 같습니다. 루트 slice와 생성 CRUD까지이고, 이름 있는 slice나 커스텀 endpoint에는 닿지 않습니다. 그쪽은 각자 적습니다. 그냥 mcp: false라고 쓰면 root·get·cru만 펼쳐지고, create·update·remove는 cru를 물려받습니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/myapp/lib/task/task.signal.ts"
            code={`export class TaskSlice extends slice(
  srv.task,
  {
    guards: { root: Admin, get: SignedIn, cru: SignedIn },
    mcp: { cru: false }, // [!code highlight]
  },
  (init) => ({
    inTodo: init({ guards: [SignedIn] }).exec(function () {
      return this.taskService.queryByStatuses(["todo"]);
    }),
  }),
) {}

// A named slice and a custom endpoint carry a plain boolean, never the map.
requestPhoneCode: mutation(Boolean, { guards: [SignedIn], mcp: false })`}
          />
          <div>
            {l.trans({
              en: "Every published read also gets a resource URI. An insight does not — it is an aggregate with nothing to point at. A custom endpoint keeps its tool and gets no template, and the refused lightX read gets neither. The root list is the bare .../list, with no third segment, because that segment is the slice key.",
              ko: "게시된 조회에는 resource URI도 붙습니다. insight는 예외입니다. 집계값이라 가리킬 대상이 없습니다. 커스텀 endpoint는 tool은 갖고 template은 받지 않으며, 거부된 lightX 조회는 둘 다 없습니다. 모델 자체의 목록은 세 번째 segment 없이 .../list입니다. 그 자리는 slice key의 몫이기 때문입니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title={l.trans({ en: "generated resource uris", ko: "생성되는 resource uri" })}
            code={`akan://task/{taskId}
akan://task/list{?skip,limit,sort}
akan://task/list/inTodo{?skip,limit,sort}`}
          />
          <Docs.Alert type="info">
            {l.trans({
              en: "The root list's raw query argument is typed Any, so it is left out of the schema. Declare a named filter slice when an agent should narrow a list.",
              ko: "루트 목록의 원본 query 인자는 Any라 schema에서 빠집니다. agent가 목록을 좁히게 하려면 이름 있는 filter slice를 선언하세요.",
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide
        id="prompt"
        title={l.trans({ en: "4. Publish A Screen As A Prompt", ko: "4. 화면을 Prompt로 게시하기" })}
      >
        <Docs.Title>{l.trans({ en: "4. Publish A Screen As A Prompt", ko: "4. 화면을 Prompt로 게시하기" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A prompt is a screen, not an endpoint. Declare it in the page file with .prompt(name, description): the user invokes it as a slash command, and the model receives what the page loads. There is no prompt() builder in a signal, and Msg is not a public API.",
              ko: "prompt는 endpoint가 아니라 화면입니다. page 파일에 .prompt(name, description)으로 선언합니다. 사용자가 slash command로 호출하면 model은 그 page가 불러오는 것을 받습니다. signal에 prompt() builder는 없고, Msg는 public API가 아닙니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/myapp/page/project/[projectId]/tickets.tsx"
            code={`export default page()
  .param("projectId", ID, { desc: "The project to brief." })
  .search("statuses", [String], { desc: "Statuses to include." })
  .prompt("briefProjectTickets", "Brief the ticket board of one project.")
  .render(async ({ projectId, statuses }) => {
    const [{ project }, { ticketInitInProject }] = await Promise.all([
      fetch.viewProject(projectId),
      fetch.initTicketInProject(projectId, statuses),
    ]);
    return <Ticket.Zone.Card init={ticketInitInProject} project={project} />;
  });`}
          />
          <DocsList>
            <li>
              {l.trans({
                en: "The description is the whole instruction the model receives — English, in API vocabulary. Agent.Guide text is never used for MCP.",
                ko: "description이 model이 받는 지시의 전부입니다. API 어휘로, 영어로 씁니다. Agent.Guide 문구는 MCP에 쓰이지 않습니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "Arguments are the declaration: .param() is required, .search() optional, and desc is the argument's description. A list argument gets Comma-separated list. appended and is typed comma-separated in prompts/get. An ID, Int, or enum value is validated by the page's own declaration.",
                ko: "인자는 선언 그대로입니다. .param()은 필수, .search()는 optional이고 desc가 인자 설명이 됩니다. 배열 인자에는 Comma-separated list.가 덧붙고 prompts/get에서는 쉼표로 구분해 입력합니다. ID, Int, enum 값은 page 자신의 선언으로 검증합니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "prompts/list lists every page with .prompt(). A name matches ^[A-Za-z0-9_-]{1,64}$ and is unique across pages.",
                ko: "prompts/list는 .prompt()가 있는 모든 page를 나열합니다. 이름은 ^[A-Za-z0-9_-]{1,64}$에 맞고 page 전체에서 유일해야 합니다.",
              })}
            </li>
          </DocsList>
          <div>
            {l.trans({
              en: "prompts/get runs the page's body — root layouts, layouts, then the render function — in the RSC worker under the caller's bearer token. No JSX is rendered and no client component runs; every fetch.* query the page makes is recorded and becomes the answer.",
              ko: "prompts/get은 page의 body — root layout, layout, 그다음 render 함수 — 를 호출자의 bearer token으로 RSC worker에서 실행합니다. JSX는 렌더링되지 않고 client component도 돌지 않습니다. page가 보낸 fetch.* 조회 하나하나가 기록되어 응답이 됩니다.",
            })}
          </div>
          <div className="space-y-1">
            {[
              {
                title: "user",
                desc: l.trans({
                  en: "The description, as the first user message.",
                  ko: "description이 첫 user message로 들어갑니다.",
                }),
              },
              {
                title: "resource",
                desc: l.trans({
                  en: "One per query, embedded and masked by that endpoint's return model — hidden, secret, and visual fields stripped — at the akan:// uri the tool answers to, or akan://<toolKey>?args for a custom read.",
                  ko: "조회마다 하나씩 값을 실어 보내며, 해당 endpoint의 반환 model로 hidden·secret·visual field를 벗깁니다. 주소는 그 tool이 응답하는 akan:// uri이고, 커스텀 조회는 akan://<toolKey>?args입니다.",
                }),
              },
              {
                title: "tools",
                desc: l.trans({
                  en: "A final line, Tools for this screen: a, b, c. — the published tools of the modules the page fetched from, filtered to what the caller may see.",
                  ko: "마지막 줄 Tools for this screen: a, b, c. 에 page가 조회한 module들의 게시된 tool을, 호출자가 볼 수 있는 것만 골라 적습니다.",
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

      <Scroll.Slide id="prompt-failures" title={l.trans({ en: "When A Prompt Cannot Run", ko: "Prompt가 못 돌 때" })}>
        <Docs.Title>{l.trans({ en: "When A Prompt Cannot Run", ko: "Prompt가 못 돌 때" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A prompt cannot re-run itself and there is no fallback context, so every way a screen can decline has to arrive as a message the caller can act on. Each of these is answered instead of the page's data, not alongside it:",
              ko: "prompt는 스스로 다시 돌 수 없고 대체 컨텍스트도 없으므로, 화면이 거절하는 모든 경우는 호출자가 다음 행동을 고를 수 있는 메시지로 돌아와야 합니다. 아래 각각은 page의 데이터와 함께가 아니라, 그 대신 응답됩니다:",
            })}
          </div>
          <Docs.IntroTable
            type={l.trans({ en: "What happened", ko: "무슨 일이 일어났나" })}
            items={[
              {
                name: (
                  <span className="font-sans">
                    {l.trans({ en: "A required argument was left out", ko: "필수 인자가 빠졌다" })}
                  </span>
                ),
                desc: l.trans({
                  en: 'No <arg> was named for "<prompt>". Find it with <model>List…, then run this prompt again with <arg>=<id>. The page is not run at all, and the answer points at the tool that finds the id rather than guessing one.',
                  ko: 'No <arg> was named for "<prompt>". Find it with <model>List…, then run this prompt again with <arg>=<id>. page를 아예 돌리지 않고, 값을 추측하는 대신 그 id를 찾을 수 있는 tool을 가리킵니다.',
                }),
              },
              {
                name: (
                  <span className="font-sans">
                    {l.trans({ en: "The page redirects, with no token", ko: "page가 redirect하고, 토큰이 없다" })}
                  </span>
                ),
                desc: l.trans({
                  en: "A 401 credential challenge, so the client authenticates instead of concluding the screen does not exist.",
                  ko: "401 credential challenge입니다. client가 화면이 없다고 결론짓지 않고 인증하러 갑니다.",
                }),
              },
              {
                name: (
                  <span className="font-sans">
                    {l.trans({ en: "The page redirects, with a token", ko: "page가 redirect하고, 토큰은 있다" })}
                  </span>
                ),
                desc: l.trans({
                  en: "This screen is not available to the signed-in account. A guard refusing a query inside the body reads the same way a redirect does — as the screen declining this account.",
                  ko: "This screen is not available to the signed-in account. body 안의 조회를 guard가 거절한 경우도 redirect와 똑같이 읽힙니다. 화면이 이 계정을 거절한 것입니다.",
                }),
              },
              {
                name: (
                  <span className="font-sans">{l.trans({ en: "router.notFound()", ko: "router.notFound()" })}</span>
                ),
                desc: l.trans({
                  en: "No screen exists for these arguments.",
                  ko: "No screen exists for these arguments.",
                }),
              },
              {
                name: <span className="font-sans">{l.trans({ en: "Any other throw", ko: "그 밖의 throw" })}</span>,
                desc: l.trans({
                  en: "The page failed to load. — and the real error is logged server-side, where it does not describe your internals to a caller.",
                  ko: "The page failed to load. 실제 에러는 서버에 로그로 남습니다. 호출자에게 내부 구조를 설명하지 않는 자리입니다.",
                }),
              },
            ]}
          />
          <DocsList>
            <li>
              {l.trans({
                en: "Lists are cut, largest first, to promptBudget — 60,000 characters by default — with a note: Attached the first N of M rows of `key`; call it for the rest.",
                ko: "목록은 큰 것부터 promptBudget에 맞게 잘립니다. 기본 60,000자입니다. 잘리면 Attached the first N of M rows of `key`; call it for the rest. 한 줄이 붙습니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "Tool exposure is unchanged — guards decide, and mcp: false and Person still apply. The in-page chat keeps only its six built-in slash commands; app prompts are not listed there.",
                ko: "tool 노출은 그대로입니다. guard가 정하고, mcp: false와 Person도 그대로 적용됩니다. 페이지 안 채팅은 내장 slash command 여섯 개만 유지하며, 앱 prompt는 거기에 나열되지 않습니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "Prompts come from the RSC worker, so an API-only build serves none at all.",
                ko: "prompt는 RSC worker에서 나오므로, API 전용 빌드에는 하나도 없습니다.",
              })}
            </li>
          </DocsList>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="progress" title={l.trans({ en: "5. Report Progress", ko: "5. 진행률 보고하기" })}>
        <Docs.Title>{l.trans({ en: "5. Report Progress", ko: "5. 진행률 보고하기" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Report from wherever the work happens. Outside a streamed call it is a no-op, so the same service runs unchanged over HTTP, a websocket, and in tests.",
              ko: "실제 작업이 일어나는 곳에서 바로 보고하세요. streaming이 아닐 때는 no-op이라, 같은 service가 HTTP·websocket·test에서 그대로 동작합니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/myapp/lib/task/task.service.ts"
            code={`async importTasks(rows: cnst.TaskInput[]) {
  for (const [idx, row] of rows.entries()) {
    McpProgress.report(idx + 1, { total: rows.length, message: \`importing \${row.title}\` });
    await this.createTask(row);
  }
  return rows.length;
}`}
          />
          <DocsList>
            <li>
              {l.trans({
                en: "The client must send both Accept: text/event-stream and a progressToken. The server switches only after the first report.",
                ko: "client는 Accept: text/event-stream과 progressToken을 모두 보내야 합니다. server는 첫 보고가 온 뒤에야 전환합니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "Cancellation is the client closing the stream. Watch McpProgress.signal; the framework cannot stop an exec already in flight.",
                ko: "취소는 client가 스트림을 닫는 것입니다. McpProgress.signal을 보세요. 이미 실행 중인 exec을 프레임워크가 멈출 수는 없습니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "McpProgress.streaming is true while anyone is reading, so an expensive message can be skipped.",
                ko: "누군가 읽고 있으면 McpProgress.streaming이 true입니다. 만들기 비싼 메시지는 그때만 조립하면 됩니다.",
              })}
            </li>
          </DocsList>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="auth" title={l.trans({ en: "Authorization", ko: "인가" })}>
        <Docs.Title>{l.trans({ en: "Authorization", ko: "인가" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "MCP arrives over HTTP and runs the ordinary pipeline, so guards, Self, and account middleware behave as they do for a browser call. One difference: the cookie header is stripped at the door, so the Authorization header is the only credential the route accepts.",
              ko: "MCP는 HTTP로 도착해 평소 파이프라인을 탑니다. guard, Self, account middleware는 브라우저 호출과 같습니다. 한 가지만 다릅니다. cookie 헤더는 문 앞에서 버려지므로, 이 라우트가 받는 credential은 Authorization 헤더뿐입니다.",
            })}
          </div>
          <div className="space-y-1">
            {[
              {
                title: 'scope: "account"',
                desc: l.trans({
                  en: "The verdict reads the caller only. Evaluated when filtering a listing, so an anonymous agent is not offered admin tools it can only fail at.",
                  ko: "판정이 caller에만 의존합니다. 목록 필터링에 평가되므로, 익명 agent에게 실패만 할 admin tool을 내밀지 않습니다.",
                }),
              },
              {
                title: 'scope: "resource"',
                desc: l.trans({
                  en: "Needs the call's arguments, so it is never evaluated for a listing. The entry stays visible and is stopped at call time.",
                  ko: "호출 인자가 필요해서 목록에서는 평가되지 않습니다. 항목은 목록에 남고 호출 단계에서 막힙니다.",
                }),
              },
            ].map(({ title, desc }) => (
              <div key={title} className={panelRecipe({ padding: "row" })}>
                <span className="font-mono font-semibold text-primary">{title}: </span>
                <span className="text-foreground/70 text-sm">{desc}</span>
              </div>
            ))}
          </div>
          <div>
            {l.trans({
              en: "Every guard must declare static scope with no default. SignedIn / Admin are account; every Can<Verb><Model> is resource. The listing is a UX filter — the call still runs every guard.",
              ko: "모든 guard는 기본값 없이 static scope를 선언합니다. SignedIn / Admin은 account, 모든 Can<Verb><Model>은 resource입니다. 목록은 UX 필터일 뿐, 호출은 여전히 모든 guard를 거칩니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title={l.trans({ en: "OAuth resource server, by env", ko: "OAuth 리소스 서버, env로" })}
            language="bash"
            code={`AKAN_MCP_AUTH_SERVERS=https://auth.example.com
AKAN_MCP_SCOPES=akan.read,akan.write
AKAN_MCP_RESOURCE=https://api.example.com/mcp`}
          />
          <DocsList>
            <li>
              {l.trans({
                en: "Unauthenticated calls get a WWW-Authenticate challenge, so a client authenticates instead of concluding the tool does not exist.",
                ko: "인증 없는 호출에는 WWW-Authenticate 챌린지가 나가므로, client는 tool이 없다고 결론짓지 않고 인증합니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "insufficient_scope is enforced only once AKAN_MCP_SCOPES is set. First-party Akan tokens carry no scope claim.",
                ko: "insufficient_scope는 AKAN_MCP_SCOPES를 설정했을 때만 강제됩니다. 자체 발급 Akan 토큰에는 scope claim이 없습니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "A token with no aud is refused once AKAN_MCP_AUTH_SERVERS names an issuer, and accepted while none is named.",
                ko: "aud가 없는 토큰은 AKAN_MCP_AUTH_SERVERS로 발급자를 지정한 순간부터 거부하고, 지정하지 않은 동안은 통과합니다.",
              })}
            </li>
          </DocsList>
          <div>
            {l.trans({
              en: (
                <span>
                  Those three env names point <code>/mcp</code> at somebody else's issuer. An app that mounts{" "}
                  <code>libs/shared</code> needs none of them: it serves the OAuth 2.1 authorization server itself —
                  metadata, consent page, registration, token and revocation — names itself as the issuer, and that is
                  what makes <code>/mcp</code> demand a bearer in the first place.{" "}
                  <Link href="/cheatsheet/general/mcp-auth" className="text-primary">
                    OAuth For Agents
                  </Link>{" "}
                  is where a token comes from.
                </span>
              ),
              ko: (
                <span>
                  위의 env 세 개는 <code>/mcp</code>를 남의 issuer로 향하게 하는 설정입니다. <code>libs/shared</code>를
                  마운트한 앱에는 하나도 필요 없습니다. 그 앱이 OAuth 2.1 인가 서버 자체를 제공하기 때문입니다.
                  메타데이터, 동의 페이지, 클라이언트 등록, 토큰 발급, 폐기까지 갖추고 자기 자신을 issuer로 이름 붙이며,
                  애초에 <code>/mcp</code>가 bearer를 요구하게 만드는 것도 그것입니다. 토큰이 어디서 오는지는{" "}
                  <Link href="/cheatsheet/general/mcp-auth" className="text-primary">
                    에이전트를 위한 OAuth
                  </Link>
                  에 있습니다.
                </span>
              ),
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="tips" title={l.trans({ en: "Tips", ko: "꿀팁" })}>
        <Docs.Title>{l.trans({ en: "Tips", ko: "꿀팁" })}</Docs.Title>
        <Docs.Description>
          <DocsList>
            <li>
              {l.trans({
                en: "A missing tool is explained in the boot log: MCP catalogue: tools=… then one verbose line per refusal. Turn verbose on, because there is no opt-in to notice — that log is the only place the answer exists.",
                ko: "기대한 tool이 없으면 부팅 로그를 보세요. MCP catalogue: tools=… 아래로 거부마다 verbose 한 줄입니다. verbose를 켜 두세요. 빠진 opt-in 같은 단서가 없어서 답이 있는 곳은 그 로그뿐입니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "Write the model's .desc(). Generated CRUD tools append it to Get X, and the root list borrows the .of() label — those entries have no other text.",
                ko: "model의 .desc()를 쓰세요. 생성된 CRUD tool은 Get X 뒤에 그것을 붙이고, 루트 목록은 .of() 라벨을 빌립니다. 그 항목들이 실을 수 있는 문구는 그것뿐입니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "Narrow by cost, and read the boot log first. MCP forbids a $ref across entries, so every entry inlines the schema of every model it mentions and the listing is re-sent whole to every agent that connects. A per-signal MCP catalogue cost: line says where the bytes went.",
                ko: "비용을 기준으로 좁히고, 부팅 로그부터 읽으세요. MCP는 항목 간 $ref를 금지하므로 항목마다 언급한 model의 schema를 통째로 인라인하고, 그 목록은 접속하는 agent마다 통째로 다시 전송됩니다. signal별 MCP catalogue cost: 줄이 바이트가 어디로 갔는지 알려줍니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "Two endpoints cannot share a tool name. The first in candidate order — refName then key — keeps it, and the other is refused with another endpoint is already published under this name.",
                ko: "두 endpoint가 tool 이름을 공유할 수 없습니다. 후보 순서(refName 다음 key)에서 먼저 온 쪽이 이름을 갖고, 나머지는 another endpoint is already published under this name으로 거부됩니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "An unknown argument is reported as the caller's mistake. A missing document is too — No <Model> found for the arguments given. Only a genuine failure answers that the server failed.",
                ko: "선언되지 않은 인자는 호출자 오류로 돌아옵니다. 없는 document도 마찬가지입니다. No <Model> found for the arguments given. 실제 장애만 서버 실패로 응답합니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "A field.visual field is stripped from every MCP result and from the readable schema, so the two agree. Reach for it whenever a field is bulky and useless to a model.",
                ko: "field.visual 필드는 모든 MCP 결과와 readable schema에서 함께 빠지므로 둘이 어긋나지 않습니다. 부피가 크고 model에게는 쓸모없는 필드에는 이것을 쓰세요.",
              })}
            </li>
          </DocsList>
        </Docs.Description>
      </Scroll.Slide>
      <DocsToc />
    </Scroll>
  );
});
