import { usePage } from "@apps/akan/client";
import { Code, Docs } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";

export default function Page() {
  const { l } = usePage();

  return (
    <Scroll>
      <Scroll.Slide id="overview" title={l.trans({ en: "MCP Server", ko: "MCP 서버" })}>
        <Docs.Title>{l.trans({ en: "MCP Server", ko: "MCP 서버" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Every signal you already wrote can be served to AI agents over the Model Context Protocol. There is no second API to build: the same endpoint runs through the same guards, the same middleware, and the same service, and its dictionary entries become the text an agent reads to decide what to call.",
              ko: "이미 작성해 둔 signal을 그대로 Model Context Protocol로 AI agent에게 제공할 수 있습니다. 별도의 API를 만들 필요가 없습니다. 같은 endpoint가 같은 guard, 같은 middleware, 같은 service를 거쳐 실행되고, dictionary 항목이 agent가 무엇을 호출할지 판단하는 문구가 됩니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "Exposure is opt-in everywhere. Turning the server on publishes nothing: an endpoint appears only after it declares mcp: { expose: true }, and an endpoint that did not declare it answers the same 'unknown tool' as one that does not exist.",
              ko: "노출은 전부 opt-in입니다. 서버를 켜는 것만으로는 아무것도 공개되지 않습니다. endpoint는 mcp: { expose: true }를 선언해야 목록에 나타나며, 선언하지 않은 endpoint는 존재하지 않는 것과 똑같은 'unknown tool' 응답을 돌려줍니다.",
            })}
          </div>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              {l.trans({
                en: "query and mutation become tools; a readable query also becomes a resource.",
                ko: "query와 mutation은 tool이 되고, 읽기 query는 resource로도 노출됩니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "prompt becomes a slash command the user invokes.",
                ko: "prompt는 사용자가 호출하는 slash command가 됩니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "pubsub and message are never exposed — their arguments read a socket an MCP request does not have.",
                ko: "pubsub과 message는 노출되지 않습니다. 두 타입의 인자는 MCP 요청에 없는 socket을 읽습니다.",
              })}
            </li>
          </ul>
        </Docs.Description>
      </Scroll.Slide>
      <div className="divider" />

      <Scroll.Slide id="enable" title={l.trans({ en: "1. Turn The Server On", ko: "1. 서버 켜기" })}>
        <Docs.Title>{l.trans({ en: "1. Turn The Server On", ko: "1. 서버 켜기" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "The server mounts at POST /mcp, at the root rather than under the API prefix: the canonical resource a client authenticates against is the endpoint's own URL.",
              ko: "서버는 API prefix 아래가 아니라 root의 POST /mcp에 마운트됩니다. client가 인증 대상으로 삼는 정식 리소스는 endpoint 자신의 URL이기 때문입니다.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          title="main.ts"
          code={`await new AkanApp("./server", {
  openapi: true,
  mcp: {
    instructions: "Domain tools for the akan app. Start from taskListInTodo.",
    readOnly: false,
    pageSize: 100,
    language: "en",
  },
}).start();`}
        />
        <Code.Snippet
          title={l.trans({ en: "or by env", ko: "또는 env로" })}
          code={`AKAN_MCP=true
AKAN_MCP_INSTRUCTIONS="Domain tools for the akan app."
AKAN_MCP_LANGUAGE=en`}
        />
        <Docs.Description>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              {l.trans({
                en: "main.ts is where this goes, because server.ts is generated and constructs AkanServer with no options. The gateway configures the child that actually mounts /mcp through its environment, so every field has an env spelling too — an option written in code wins over the env of the same name.",
                ko: "이 설정은 main.ts에 씁니다. server.ts는 생성 파일이고 AkanServer를 옵션 없이 만들기 때문입니다. gateway는 실제로 /mcp를 마운트하는 child를 환경변수로 설정하므로 모든 필드에 env 이름이 하나씩 있습니다. 코드에 쓴 값이 같은 이름의 env를 이깁니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "instructions is the one place to say what this app is for and which tool to reach for first. It goes to the model alongside the tool list.",
                ko: "instructions는 이 앱이 무엇을 위한 것이고 어떤 tool부터 잡아야 하는지 말할 수 있는 유일한 자리입니다. tool 목록과 함께 model에게 전달됩니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "AKAN_MCP_READONLY=true drops every mutation whatever it declared. It is the valve for a deployment that must not be able to write, not the exposure switch.",
                ko: "AKAN_MCP_READONLY=true는 선언 여부와 무관하게 모든 mutation을 뺍니다. 노출 스위치가 아니라, 쓰기가 불가능해야 하는 배포를 위한 밸브입니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "Both switches answer to AKAN_PUBLIC_MCP and AKAN_PUBLIC_MCP_READONLY as well, the pairing AKAN_OPENAPI already has. AKAN_MCP_PATH is normalized to a leading slash: the route key and the OAuth metadata path are both built by concatenation, so mcp served a route named mcp and published its metadata where no client would look for it.",
                ko: "두 스위치는 AKAN_PUBLIC_MCP, AKAN_PUBLIC_MCP_READONLY로도 켜집니다. AKAN_OPENAPI가 이미 가진 짝입니다. AKAN_MCP_PATH는 앞의 슬래시를 붙여 정규화합니다. 라우트 키와 OAuth 메타데이터 경로가 모두 문자열 이어붙이기로 만들어지므로, mcp라고 주면 라우트 이름이 mcp가 되고 메타데이터는 아무 client도 찾지 않을 자리에 올라갔습니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "allowedOrigins is needed only for a browser-hosted client, which is also the only caller that sends an Origin at all. Those origins get the CORS preflight answer and the matching header on the response, without which the request never leaves the browser. The comparison uses the forwarded host, so a reverse proxy does not turn every such call into a 403.",
                ko: "allowedOrigins는 브라우저에서 동작하는 client에만 필요하며, Origin을 보내는 것도 그 client뿐입니다. 해당 origin에는 CORS preflight 응답과 응답 헤더가 함께 나가고, 이것이 없으면 요청 자체가 브라우저를 떠나지 못합니다. 비교는 forwarded host 기준이라 reverse proxy 뒤에서도 403이 되지 않습니다.",
              })}
            </li>
          </ul>
        </Docs.Description>
      </Scroll.Slide>
      <div className="divider" />

      <Scroll.Slide id="tool" title={l.trans({ en: "2. Expose An Endpoint", ko: "2. Endpoint 노출하기" })}>
        <Docs.Title>{l.trans({ en: "2. Expose An Endpoint", ko: "2. Endpoint 노출하기" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Add mcp to the signal option next to guards. The tool name is the endpoint key unchanged, its input schema comes from the declared arguments, and its output schema from the return model.",
              ko: "guards 옆 signal option에 mcp를 추가합니다. tool 이름은 endpoint key 그대로이고, input schema는 선언한 인자에서, output schema는 반환 model에서 나옵니다.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          title="task.signal.ts"
          code={`export class TaskEndpoint extends endpoint(srv.task, ({ query, mutation }) => ({
  taskSummary: query(cnst.TaskInsight, { guards: [SignedIn], mcp: { expose: true } })
    .search("status", cnst.TaskStatus)
    .exec(async function (status) {
      return await this.taskService.insightByStatuses([status ?? "todo"]);
    }),
  startTask: mutation(cnst.Task, { guards: [CanWriteTask], mcp: { expose: true } })
    .param("taskId", ID)
    .exec(async function (taskId) {
      return await this.taskService.startTask(taskId);
    }),
})) {}`}
        />
        <Docs.Description>
          <div>
            {l.trans({
              en: "Write the dictionary entry at the same time. An agent picks a tool by its description, so a missing one is a broken tool — akan quality scan reports it as akan.mcp.missing-description.",
              ko: "dictionary 항목도 같이 씁니다. agent는 설명을 보고 tool을 고르므로, 설명이 없는 tool은 고장난 tool입니다 — akan quality scan이 akan.mcp.missing-description으로 보고합니다.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          title="task.dictionary.ts"
          code={`.endpoint<TaskEndpoint>((fn) => ({
  startTask: fn(["Start Task", "작업 시작"])
    .desc(["Moves one task from todo to in progress", "할 일 하나를 진행중으로 옮깁니다"])
    .arg((t) => ({ taskId: t(["Task ID", "할 일 ID"]).desc(["The task to start", "시작할 할 일"]) })),
}))`}
        />
      </Scroll.Slide>
      <div className="divider" />

      <Scroll.Slide id="slice" title={l.trans({ en: "3. Expose A Slice And CRUD", ko: "3. Slice와 CRUD 노출하기" })}>
        <Docs.Title>{l.trans({ en: "3. Expose A Slice And CRUD", ko: "3. Slice와 CRUD 노출하기" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A slice opts in through its own init option. Generated CRUD carries no option of its own, so it opts in on the slice class instead — one flag per verb, so that reading a model never quietly brings write access with it.",
              ko: "slice는 자신의 init option으로 opt-in합니다. 생성된 CRUD는 자체 option이 없으므로 slice class에서 opt-in하며, verb마다 플래그가 따로 있습니다. 읽기를 여는 것이 조용히 쓰기까지 함께 열지 않도록 하기 위해서입니다.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          title="task.signal.ts"
          code={`export class TaskSlice extends slice(
  srv.task,
  { guards: { root: Admin, get: SignedIn, cru: SignedIn }, mcp: { get: true, update: true, list: true } },
  (init) => ({
    inTodo: init({ guards: [SignedIn], mcp: { expose: true } }).exec(function () {
      return this.taskService.queryByStatuses(["todo"]);
    }),
  }),
) {}`}
        />
        <Docs.Description>
          <div>
            {l.trans({
              en: "list is the model's own unfiltered list and insight — one flag publishes both, and there is no switch that gives an agent the list while holding back the aggregate. It sits on the same verb map because slice() generates that slice itself, leaving nowhere for an author to write expose. Its raw query argument is not published: an Any argument tells a model nothing, so it is left out of the schema, and a value sent for it is refused by name rather than read. Expose a named filter slice when an agent should be able to narrow a list.",
              ko: "list는 모델 자체의 필터 없는 목록과 insight입니다. 플래그 하나가 둘을 함께 게시하며, 목록만 주고 집계는 빼는 스위치는 없습니다. 그 slice는 slice()가 직접 생성하므로 expose를 적을 자리가 없어 verb map에 함께 놓았습니다. 원본 query 인자는 공개되지 않습니다. Any 인자는 model에게 아무 정보도 주지 못하므로 schema에서 빠지고, 그 이름으로 값을 보내면 읽는 대신 거부합니다. agent가 목록을 좁힐 수 있게 하려면 이름 있는 filter slice를 노출하세요.",
            })}
          </div>
        </Docs.Description>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A named slice inherits no guards from the slice() call: that map's root, get and cru reach the root slice and generated CRUD only, so an exposed slice writes its own guards — which is what the line above does. Leave it off and the read is unguarded, the same access an explicit [Public] grants but with nobody having decided it. The boot log names every published entry that declares none.",
              ko: "이름 있는 slice는 slice() 호출의 guards를 물려받지 않습니다. 그 맵의 root·get·cru는 root slice와 생성된 CRUD까지만 닿기 때문에, 노출하는 slice는 위 코드처럼 자기 guards를 직접 적습니다. 적지 않으면 가드 없는 읽기가 됩니다. 명시적인 [Public]과 접근 범위는 같지만, 그것을 결정한 사람이 없습니다. 부팅 로그는 guards를 선언하지 않은 채 게시된 항목을 모두 이름으로 남깁니다.",
            })}
          </div>
        </Docs.Description>
        <Docs.Description>
          <div>
            {l.trans({
              en: "libs/shared's banner is the worked example in this repo: mcp: { get: true } on the slice plus guards: [Public] and expose on inPublic, and nothing else. Those are exactly the reads whose guard is already Public, so an agent reaches what an anonymous browser reaches — exposure adds a transport, not an audience. Exposing anything else a library owns is the mounting app's decision.",
              ko: "이 저장소의 실제 예시는 libs/shared의 banner입니다. slice에 mcp: { get: true }, inPublic에 guards: [Public]과 expose, 그게 전부입니다. 모두 가드가 이미 Public인 읽기라서, agent가 닿는 범위는 익명 브라우저가 닿는 범위와 같습니다. 노출은 청중이 아니라 전송 수단을 하나 더하는 일입니다. 라이브러리가 가진 나머지를 노출할지는 그것을 마운트하는 app이 정합니다.",
            })}
          </div>
        </Docs.Description>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Every readable list and single read also gets a resource URI, so a client can attach one to a conversation instead of calling a tool. An insight does not: it is an aggregate with nothing to point a URI at.",
              ko: "읽을 수 있는 목록과 단건 조회에는 resource URI도 함께 생깁니다. client가 tool을 호출하는 대신 대화에 첨부할 수 있습니다. insight는 예외입니다. 집계값이라 URI가 가리킬 대상이 없습니다.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          title={l.trans({ en: "generated resource uris", ko: "생성되는 resource uri" })}
          code={`akan://task/{taskId}
akan://task/light/{taskId}
akan://task/list{?skip,limit,sort}
akan://task/list/inTodo{?skip,limit,sort}`}
        />
        <Docs.Description>
          <div>
            {l.trans({
              en: "The model's own list is the bare .../list, with no third segment. A slice key occupies that segment, and a slice may legally be named anything — so any token put there for the root list would be one a slice could also take, and the two would publish the same URI with only one of them readable.",
              ko: "모델 자체의 목록은 세 번째 segment 없이 .../list입니다. 세 번째 자리는 slice key의 몫이고 slice 이름에는 제약이 없으므로, 루트 목록을 위해 그 자리에 어떤 토큰을 두든 slice가 같은 이름을 가질 수 있습니다. 그러면 두 목록이 같은 URI를 발행하고 한쪽만 읽힙니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "Those four shapes are the whole set, so mcp: { resource: true } is honoured only on the reads that have one. Write it on a custom endpoint and the tool is published as usual, the resource template is not, and the boot log names the endpoint saying so — it used to fall back to the model's own URI, publishing a template that parse routed to the model's own get and that named none of the endpoint's arguments.",
              ko: "URI 모양은 이 넷이 전부이므로, mcp: { resource: true }는 그 모양을 가진 조회에서만 반영됩니다. 커스텀 endpoint에 적으면 tool은 평소대로 게시되고 resource template만 빠지며, 부팅 로그에 그 endpoint의 이름이 남습니다. 예전에는 모델 자신의 URI로 폴백해서, parse가 모델의 get으로 보내버리고 그 endpoint의 인자는 어디에도 없는 template을 발행했습니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <div className="divider" />

      <Scroll.Slide id="prompt" title={l.trans({ en: "4. Write A Prompt", ko: "4. Prompt 작성하기" })}>
        <Docs.Title>{l.trans({ en: "4. Write A Prompt", ko: "4. Prompt 작성하기" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A prompt is invoked by the user, not chosen by the model — a client renders it as a slash command. exec returns PromptMessage[], or a bare string that is wrapped into one user message.",
              ko: "prompt는 model이 고르는 것이 아니라 사용자가 호출합니다. client는 slash command로 렌더링합니다. exec은 PromptMessage[]를 반환하며, 문자열 하나면 user message 하나로 감쌉니다.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          title="task.signal.ts"
          code={`reviewTask: prompt({ guards: [SignedIn], mcp: { expose: true } })
  .param("taskId", ID)
  .search("tone", String)
  .exec(async function (taskId, tone) {
    const task = await this.taskService.getLightTask(taskId);
    return [
      Msg.user(\`Review this task in a \${tone ?? "neutral"} tone and suggest next steps.\`),
      Msg.resource(\`akan://task/\${taskId}\`, task),
    ];
  }),`}
        />
        <Docs.Description>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              {l.trans({
                en: "Msg.user and Msg.assistant carry text, Msg.link points at something without paying for it, Msg.resource embeds a value, and Msg.image / Msg.imageOf inline bytes.",
                ko: "Msg.user와 Msg.assistant는 텍스트를, Msg.link는 비용 없이 참조를, Msg.resource는 값 자체를 싣고, Msg.image / Msg.imageOf는 바이트를 인라인합니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "A prompt takes .param() and .search() only. prompts/get sends a flat string map, so there is nowhere to put a body, and .search() is the only way to declare an optional argument.",
                ko: "prompt는 .param()과 .search()만 받습니다. prompts/get은 flat string map을 보내므로 body를 둘 자리가 없고, optional 인자를 선언하는 유일한 방법이 .search()입니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "A prompt's payload is not field-masked. It travels on the Any carrier, so hidden and secret fields would survive — pass a Light model or an object you assembled, never a full document.",
                ko: "prompt의 payload는 field masking이 되지 않습니다. Any carrier로 전달되므로 hidden, secret field가 그대로 남습니다. full document 대신 Light model이나 직접 구성한 object를 넘기세요.",
              })}
            </li>
          </ul>
        </Docs.Description>
      </Scroll.Slide>
      <div className="divider" />

      <Scroll.Slide id="progress" title={l.trans({ en: "5. Report Progress", ko: "5. 진행률 보고하기" })}>
        <Docs.Title>{l.trans({ en: "5. Report Progress", ko: "5. 진행률 보고하기" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A long tool call can stream progress while it runs. McpProgress reaches the call through AsyncLocalStorage, so you report from wherever the work happens — a service, an adapter, a loop several frames down — without threading a channel through every signature.",
              ko: "오래 걸리는 tool call은 실행 중에 진행률을 스트리밍할 수 있습니다. McpProgress는 AsyncLocalStorage로 호출에 접근하므로, service든 adapter든 몇 프레임 아래 loop든 실제 작업이 일어나는 곳에서 바로 보고할 수 있고 그 사이 signature에 channel을 달 필요가 없습니다.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          title="task.service.ts"
          code={`async importTasks(rows: cnst.TaskInput[]) {
  for (const [idx, row] of rows.entries()) {
    McpProgress.report(idx + 1, { total: rows.length, message: \`importing \${row.title}\` });
    await this.createTask(row);
  }
  return rows.length;
}`}
        />
        <Docs.Description>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              {l.trans({
                en: "Outside a streamed call it is a no-op, so the same service code runs unchanged over plain HTTP, over a websocket, and in tests.",
                ko: "streaming이 아닐 때는 no-op이라, 같은 service 코드가 일반 HTTP, websocket, test에서 그대로 동작합니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "Streaming needs the client to ask with both Accept: text/event-stream and a progressToken, and the server switches to it only once the first report arrives.",
                ko: "streaming은 client가 Accept: text/event-stream과 progressToken을 모두 보내야 하고, server는 첫 보고가 도착한 뒤에야 전환합니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "Cancellation is the client closing the stream. Long work may watch McpProgress for the abort signal; the framework cannot stop an exec already in flight.",
                ko: "취소는 client가 스트림을 닫는 것입니다. 긴 작업은 McpProgress의 abort signal을 볼 수 있습니다. 프레임워크가 이미 실행 중인 exec을 강제로 멈출 수는 없습니다.",
              })}
            </li>
          </ul>
        </Docs.Description>
      </Scroll.Slide>
      <div className="divider" />

      <Scroll.Slide id="auth" title={l.trans({ en: "Authorization", ko: "인가" })}>
        <Docs.Title>{l.trans({ en: "Authorization", ko: "인가" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "MCP arrives over HTTP and runs through the ordinary pipeline, so guards, Self, and the account middleware all behave exactly as they do for a browser call. Two things are specific to the catalogue.",
              ko: "MCP는 HTTP로 도착해 평소 파이프라인을 그대로 탑니다. guard, Self, account middleware 모두 브라우저 호출과 똑같이 동작합니다. 카탈로그와 관련해서만 두 가지가 다릅니다.",
            })}
          </div>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              {l.trans({
                en: 'Mark static scope = "account" on a guard whose verdict depends only on the caller. Only those are evaluated when filtering a listing, so an anonymous agent is not offered a shelf of admin tools it can only fail at. Unmarked means "resource", which has no arguments there and would fail closed on every entry.',
                ko: '판정이 caller에만 의존하는 guard에는 static scope = "account"를 표기합니다. 목록 필터링에는 이런 guard만 평가되므로, 익명 agent에게 실패만 할 admin tool 목록을 내밀지 않게 됩니다. 미표기는 "resource"이며, 목록에서는 인자가 없어 모든 항목이 fail closed 됩니다.',
              })}
            </li>
            <li>
              {l.trans({
                en: "The listing is a UX filter, never the access decision. The call itself still runs every guard, so a resource guard stops it there.",
                ko: "목록은 UX 필터일 뿐 접근 판정이 아닙니다. 호출 자체는 여전히 모든 guard를 거치므로 resource guard는 그 시점에 막습니다.",
              })}
            </li>
          </ul>
        </Docs.Description>
        <Docs.SubTitle>{l.trans({ en: "OAuth Resource Server", ko: "OAuth 리소스 서버" })}</Docs.SubTitle>
        <Docs.Description>
          <div>
            {l.trans({
              en: "The server publishes RFC 9728 protected-resource metadata and answers an unauthenticated call with a WWW-Authenticate challenge pointing at it, so a client knows to authenticate rather than concluding the tool does not exist.",
              ko: "서버는 RFC 9728 protected-resource 메타데이터를 게시하고, 인증 없는 호출에는 그 주소를 가리키는 WWW-Authenticate 챌린지로 응답합니다. client가 tool이 없다고 결론짓는 대신 인증해야 한다는 것을 알 수 있습니다.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          title={l.trans({ en: "env", ko: "env" })}
          code={`AKAN_MCP_AUTH_SERVERS=https://auth.example.com
AKAN_MCP_SCOPES=akan.read,akan.write
AKAN_MCP_RESOURCE=https://api.example.com/mcp`}
        />
        <Docs.Description>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              {l.trans({
                en: "insufficient_scope is enforced only once AKAN_MCP_SCOPES is set. First-party Akan tokens carry no scope claim, so enforcing by default would lock out every internal caller.",
                ko: "insufficient_scope는 AKAN_MCP_SCOPES를 설정했을 때만 강제됩니다. 자체 발급 Akan 토큰에는 scope claim이 없어서, 기본 강제는 내부 호출자를 전부 잠급니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "AKAN_MCP_RESOURCE overrides the published identifier. Leave it unset behind a normal proxy — the server reads the public host from x-forwarded-host rather than from the address the proxy dialed. That header arrives from the caller, so both the resource identifier and the same-origin comparison are only as trustworthy as an edge that overwrites it rather than appending; set this where you cannot guarantee that.",
                ko: "AKAN_MCP_RESOURCE는 게시되는 식별자를 덮어씁니다. 일반적인 프록시 뒤에서는 비워 두세요. 서버는 프록시가 접속한 내부 주소가 아니라 x-forwarded-host에서 공개 host를 읽습니다. 이 헤더는 호출자가 보내는 것이라, 리소스 식별자와 same-origin 비교는 그 헤더를 덧붙이는 대신 덮어쓰는 엣지만큼만 신뢰할 수 있습니다. 그것을 보장할 수 없다면 이 값을 지정하세요.",
              })}
            </li>
            <li>
              {l.trans({
                en: "A token carrying no aud at all is refused once AKAN_MCP_AUTH_SERVERS names an issuer, and accepted while none is named. That issuer mints tokens for its other resources too, which is the confused-deputy case RFC 8707 is a MUST for — whereas a first-party Akan token is bound by app and environment rather than by a resource URI, so refusing it by default would lock out every internal caller.",
                ko: "aud가 아예 없는 토큰은 AKAN_MCP_AUTH_SERVERS로 발급자를 지정한 순간부터 거부하고, 지정하지 않은 동안은 통과시킵니다. 같은 발급자는 자기 다른 리소스용 토큰도 민팅하며, 그것이 RFC 8707을 MUST로 건 confused-deputy 시나리오입니다. 반면 자체 발급 Akan 토큰은 리소스 URI가 아니라 앱과 환경으로 묶이므로, 기본으로 거부하면 내부 호출자를 전부 잠급니다.",
              })}
            </li>
          </ul>
        </Docs.Description>
      </Scroll.Slide>
      <div className="divider" />

      <Scroll.Slide id="gotchas" title={l.trans({ en: "Gotchas", ko: "주의할 점" })}>
        <Docs.Title>{l.trans({ en: "Gotchas", ko: "주의할 점" })}</Docs.Title>
        <Docs.Description>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              {l.trans({
                en: "A mutation with no real guards is refused whatever it declared, and [Public] counts as none — it answers true unconditionally, so it is having no guard spelled out. An unguarded write reaching an agent is an accident every time.",
                ko: "실질적인 guards가 없는 mutation은 선언과 무관하게 거부되며, [Public]도 없는 것으로 칩니다. 무조건 true를 반환하니 가드 없음을 적어둔 것과 같습니다. 가드 없는 쓰기가 agent에 닿는 것은 언제나 사고입니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "An Any or Upload return is refused too: there is no schema to publish, and a tool whose shape cannot be described is not usable by a model.",
                ko: "Any나 Upload 반환도 거부됩니다. 게시할 schema가 없고, 형태를 설명할 수 없는 tool은 model이 쓸 수 없습니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "An Any argument is dropped from the schema for the same reason, and an endpoint whose Any argument must be filled is refused outright — the tool would be unusable either way. Dropped means unsendable: what the schema declares is what the server accepts, so a value sent under that name is refused like any other undeclared one. additionalProperties: false would not have done that on its own.",
                ko: "같은 이유로 Any 인자는 schema에서 빠지며, 반드시 채워야 하는 Any 인자를 가진 endpoint는 아예 거부됩니다. 어느 쪽이든 쓸 수 없는 tool이기 때문입니다. 빠졌다는 것은 보낼 수 없다는 뜻입니다. schema가 선언한 것이 곧 server가 받는 것이라, 그 이름으로 온 값은 선언되지 않은 다른 이름과 똑같이 거부됩니다. additionalProperties: false 혼자서는 그 일을 하지 못합니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "A prompt refuses two more argument types, because its arguments arrive as one string per name with no schema beside them: a list argument, which could never carry a second value, and any Any argument — a tool can leave that out of its schema, and a prompt has no schema to leave it out of.",
                ko: "prompt는 인자 타입 둘을 더 거부합니다. prompt의 인자는 이름마다 문자열 하나로 도착하고 옆에 schema가 없기 때문입니다. 배열 인자는 두 번째 값을 담을 길이 없고, Any 인자는 설명할 자리가 없습니다. tool은 schema에서 빼버릴 수 있지만 prompt에는 뺄 schema 자체가 없습니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "An argument nobody declared is a caller mistake and is reported as one: 'Unknown argument \"status\".' additionalProperties: false travels in the published schema, but nothing on the wire enforces it and plenty of clients do not validate — so an extra name used to be read by nobody, and a filter the model believed it had applied came back as a successful, unfiltered list.",
                ko: "선언되지 않은 인자는 호출자 잘못이므로 그렇게 보고합니다. 'Unknown argument \"status\".' 게시되는 schema에는 additionalProperties: false가 실리지만 와이어에서 강제하는 것은 없고 검증하지 않는 client도 많습니다. 그래서 여분의 이름은 아무도 읽지 않았고, model이 걸었다고 믿은 필터는 필터 없는 목록을 성공으로 돌려받았습니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "A resources/read uri whose percent escapes do not decode — a stray % — is Unknown resource, the same answer a uri naming nothing gets. Left to propagate, the decoder's URIError became 'the server failed' with a stack in the log, on a method an agent may call with any string it likes.",
                ko: "percent escape가 해독되지 않는 resources/read uri, 예를 들어 % 하나만 남은 uri는 아무것도 가리키지 않는 uri와 같은 Unknown resource 를 받습니다. 그대로 두면 decoder의 URIError가 '서버 실패'가 되어 로그에 스택을 남겼습니다. agent가 아무 문자열이나 넣어 호출할 수 있는 method에서 말입니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "Every refusal above is named in the boot log — one warn per endpoint, under a line counting what was published. Fail-closed is the right default, but a silent one left the author of a deliberate mcp: { expose: true } nothing to read but the framework source. The API explorer badges the per-endpoint rules beside the guards, running the same function, so it agrees on those and on nothing else: a name another endpoint already published, a resource: true with no uri shape to honour, and the read-only deployment valve are decided while the catalogue assembles itself and appear in that log alone.",
                ko: "위의 거부는 모두 부팅 로그에 이름과 함께 남습니다. 게시된 개수를 세는 줄 아래로 endpoint마다 warn 한 줄씩입니다. fail-closed는 옳은 기본값이지만 조용한 fail-closed는 mcp: { expose: true }를 일부러 적은 작성자에게 프레임워크 소스 말고는 읽을 것을 주지 않았습니다. API explorer는 endpoint 단위 규칙을 같은 함수로 돌려 가드 옆에 뱃지로 붙이므로 거기까지만 일치합니다. 이미 다른 endpoint가 가져간 이름, 실을 uri 모양이 없는 resource: true, 그리고 read-only 배포 밸브는 카탈로그가 조립되는 동안 정해지므로 그 로그에만 남습니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "akan quality scan reads the two of those a source file can answer: akan.mcp.missing-description, and akan.mcp.unguarded-exposure for an exposure whose option object names no guards. The second one is worth having statically because the omission is syntactic — guards sits in the same literal as mcp: { expose: true }, and a named slice inherits nothing from the slice() call's own guards map. A refusal is the class no scanner can reach: it turns on a resolved return type, so the boot log is the only place it is decided.",
                ko: "akan quality scan은 그중 소스 파일이 답할 수 있는 둘을 봅니다. akan.mcp.missing-description, 그리고 option 객체에 guards가 없는 노출에 대한 akan.mcp.unguarded-exposure입니다. 두 번째를 정적으로 잡을 수 있는 이유는 누락이 문법적이기 때문입니다. guards는 mcp: { expose: true }와 같은 literal 안에 있고, named slice는 slice() 호출의 guards map에서 아무것도 물려받지 않습니다. 거부는 어떤 scanner도 닿을 수 없는 부류입니다. 해석된 반환 타입에 달려 있어서 부팅 로그만이 그것을 정합니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "resource: true on a prompt is refused and said so. resources/read resolves a template to a tool and a prompt is not one — so it is refused by kind, not by key shape: a prompt keyed like a generated list computed a uri and then dropped it on the way out, which was the last place an unhonoured option went quietly.",
                ko: "prompt에 붙은 resource: true는 거부되고 그 사실이 로그에 남습니다. resources/read는 template을 tool로 해석하고 prompt는 tool이 아니므로, key 모양이 아니라 종류로 거부합니다. 생성된 목록처럼 이름이 붙은 prompt는 uri를 계산해 놓고 나가는 길에 버려졌는데, 반영되지 않은 옵션이 조용히 사라지던 마지막 자리였습니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: 'A scalar return ships as the value itself, not as JSON. Mirroring the payload as text is what the spec asks for when there is a structured result to mirror; a scalar has none, so encoding one anyway spent the block on syntax — a tool returning an id answered "507f…" with the quotes, which a model then has to know to strip.',
                ko: '스칼라 반환은 JSON이 아니라 값 그대로 실립니다. payload를 텍스트로 한 번 더 싣는 것은 구조화된 결과가 있을 때 스펙이 요구하는 일입니다. 스칼라에는 그것이 없으므로, 그래도 JSON으로 감싸면 블록을 문법에 쓰는 셈입니다. id를 돌려주는 tool이 따옴표까지 붙은 "507f…"로 답했고, model은 그걸 벗겨야 한다는 것을 알아야 했습니다.',
              })}
            </li>
            <li>
              {l.trans({
                en: "A prompt's plain GET route now describes what it returns in the app's OpenAPI document. Its declared return is Any, which reads as {} — a documented route whose body the document could not describe — so the fixed PromptMessage[] shape is published once as a component instead. The shape belongs to the protocol, not to the endpoint.",
                ko: "prompt의 평범한 GET 라우트는 이제 앱 OpenAPI 문서에서 무엇을 돌려주는지 설명합니다. 선언된 반환은 Any이고 그것은 {} 로 읽히므로, 문서에 있는 라우트인데 본문을 설명할 수 없었습니다. 그래서 고정된 PromptMessage[] 모양을 component 하나로 게시합니다. 이 모양은 endpoint의 것이 아니라 프로토콜의 것입니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "The same log names every published entry that has no description, generated ones included. akan quality scan warns too, but it reads source: it sees expose only where you wrote it as a literal in the builder call, and a model .desc() is not written as any entry's description. The boot log holds the resolved catalogue, so it can simply look.",
                ko: "같은 로그가 설명 없이 게시된 항목의 이름도 모두 남깁니다. 생성된 항목까지 포함해서입니다. akan quality scan도 경고하지만 그쪽은 소스를 읽습니다. expose를 builder 호출 안에 리터럴로 적은 자리에서만 볼 수 있고, model의 .desc()는 어떤 항목의 설명으로도 적혀 있지 않습니다. 부팅 로그는 해석된 카탈로그를 들고 있으니 그냥 보면 됩니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "A guard's refusal reads 'You are not permitted to perform this action.' rather than the framework's own 'Access denied by guard: Admin', which names the authorization structure to the one caller barred from it — the same reason an unexposed tool and a nonexistent one share a message. A domain Err resolves through the dictionary first and keeps its own words.",
                ko: "가드 거부는 프레임워크 원문인 'Access denied by guard: Admin' 대신 '이 작업을 수행할 권한이 없습니다'라는 문구로 나갑니다. 원문은 허용되지 않은 바로 그 호출자에게 인가 구조를 알려주는 셈이며, 미노출 tool과 존재하지 않는 tool이 같은 메시지를 쓰는 것과 같은 이유입니다. 도메인 Err는 먼저 사전에서 해석되어 자기 문구를 그대로 유지합니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "A prompt is mounted as a plain HTTP GET whether or not the app enabled MCP: that route is what lets a web UI preview one, so MCP exposure gates the catalogue rather than the surface. It is in the app's OpenAPI document like any other GET, for the same reason — a contract that left it out described fewer routes than the app serves. Guard it like any other read, and remember its payload is not field-masked.",
                ko: "prompt는 앱이 MCP를 켰든 아니든 평범한 HTTP GET 라우트로 발행됩니다. 웹 UI에서 미리보기를 하려면 그 라우트가 필요하기 때문이며, 따라서 MCP 노출은 표면이 아니라 카탈로그를 여닫는 스위치입니다. 같은 이유로 앱의 OpenAPI 문서에도 다른 GET과 똑같이 실립니다. 빼두면 앱이 실제로 서비스하는 것보다 적은 라우트를 기술하는 문서가 됩니다. 다른 조회와 똑같이 가드를 달고, 페이로드에 필드 마스킹이 없다는 점도 잊지 마세요.",
              })}
            </li>
            <li>
              {l.trans({
                en: "Every Msg builder takes optional annotations last: audience, priority between 0 and 1, and lastModified. A prompt this server assembles is mostly context around one instruction, and without priority a client with a full window drops blocks by position — keeping the attachment and losing the ask.",
                ko: "Msg 빌더는 모두 마지막 인자로 annotations를 받습니다. audience, 0에서 1 사이의 priority, lastModified입니다. 서버가 조립하는 prompt는 대개 지시 한 줄을 둘러싼 맥락 덩어리이고, priority가 없으면 컨텍스트가 꽉 찬 client는 위치 순으로 블록을 버립니다. 첨부가 남고 정작 요청이 사라지는 식입니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "A wrong argument and a missing document come back as the caller's error, naming what to fix. Only a genuine failure answers 'the server failed' and logs a stack — an agent can trigger the other two at will, so they must not be a log-spam path.",
                ko: "잘못된 인자와 존재하지 않는 document는 호출자 오류로, 무엇을 고쳐야 하는지 이름과 함께 돌아옵니다. 실제 장애만 '서버 실패'로 응답하며 스택을 남깁니다. 앞의 둘은 agent가 마음대로 유발할 수 있으므로 로그 스팸 경로가 되어서는 안 됩니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "An arguments field that is not an object is refused as -32602 rather than read as having none. Coerced to {}, a caller's own typo came back as 'Missing required argument', sending the model to look for a value it did send.",
                ko: "객체가 아닌 arguments는 인자 없음으로 읽지 않고 -32602로 거부합니다. {}로 뭉개면 호출자 자신의 오타가 '필수 인자 누락'으로 돌아와, model이 이미 보낸 값을 찾아 헤매게 됩니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "A nullable model return publishes no outputSchema, and its empty answer ships as the text null with no structuredContent. That field is an object by definition — null cannot ride in it any more than an array can, which is why a list is wrapped as { items: … } — and a declared schema obliges every result to match it, so a client SDK throws on the first call that finds nothing. A nullable list keeps its schema.",
                ko: "nullable한 model 반환은 outputSchema를 게시하지 않고, 빈 결과는 structuredContent 없이 텍스트 null로만 나갑니다. 이 필드는 정의상 객체라서 배열과 마찬가지로 null을 실을 수 없고(그래서 목록은 { items: … }로 감쌉니다), schema를 선언하면 모든 결과가 그에 맞아야 하므로 아무것도 못 찾은 첫 호출에서 client SDK가 예외를 던집니다. nullable한 목록은 schema를 그대로 유지합니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "An outputSchema names no hidden or secret field. Every response has both stripped, so publishing them promises a property no answer can carry — and on a model like user the names are themselves the leak, password and accountId read as readable properties. The input schema keeps them: they are legal to send, and the same model describes a request body.",
                ko: "outputSchema에는 hidden·secret field 이름이 실리지 않습니다. 모든 응답에서 두 종류는 제거되므로, 게시하면 어떤 응답도 담을 수 없는 속성을 약속하는 셈입니다. user 같은 model에서는 이름 자체가 유출입니다. password와 accountId가 읽을 수 있는 속성으로 보이게 됩니다. input schema는 그대로 둡니다. 보내는 것은 정당하고, 같은 model이 요청 바디를 서술하기 때문입니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "A modern-era request mirrors MCP-Protocol-Version and Mcp-Method into headers, plus Mcp-Name when the body names one, and a mirror that is absent is refused just like one that contradicts the body: a gateway rule keyed on a header never fires for the request that omitted it. A legacy request is not checked.",
                ko: "modern 시대의 요청은 MCP-Protocol-Version과 Mcp-Method를, 바디가 이름을 담으면 Mcp-Name까지 헤더로 미러링합니다. 미러가 아예 없는 요청도 바디와 어긋나는 요청과 똑같이 거부합니다. 헤더를 기준으로 쓰인 게이트웨이 규칙은 그 헤더를 빼고 온 요청에는 발동하지 않기 때문입니다. legacy 요청은 검사하지 않습니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "A prompt has no isError result to carry a refusal, so the JSON-RPC code is the only place left to say whose fault it was: a caller's mistake answers -32602, the same code the missing-argument check uses, and -32603 stays for a genuine failure.",
                ko: "prompt에는 거부를 담을 isError 결과가 없어서, 누구의 잘못인지 말할 수 있는 곳은 JSON-RPC 코드뿐입니다. 호출자 잘못은 인자 누락 검사와 같은 -32602로, -32603은 실제 장애에만 남습니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "The catalogue is written in one language, en by default and settable with the language option. It is built once at boot and cached by clients, so there is no Accept-Language negotiation.",
                ko: "카탈로그는 한 언어로 작성됩니다. 기본은 en이고 language 옵션으로 바꿉니다. 부팅 시 한 번 만들어 client가 캐시하므로 Accept-Language 협상은 없습니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "The two entries mcp: { list: true } publishes take their text from the model's own .of() label. The root slice is generated by slice() and its dictionary entry is written by the framework, so it would otherwise read 'Slice List - Universal' with nowhere for you to write over it — a placeholder in the one field a model picks a tool by.",
                ko: "mcp: { list: true }가 게시하는 두 항목은 model 자신의 .of() 라벨에서 문구를 가져옵니다. 루트 slice는 slice()가 생성하고 그 사전 항목은 프레임워크가 쓰기 때문에, 그대로 두면 'Slice List - Universal'로 나가고 작성자가 덮어쓸 자리도 없습니다. model이 tool을 고르는 유일한 필드에 placeholder가 놓이는 셈입니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "The base CRUD tools have the same problem and the same answer: their dictionary text is written last by the framework as 'Get Banner' for both title and description, so the model's own .desc() is appended to it. 'Get Banner' names the verb and says nothing about what a Banner is, and description is the field a model picks a tool by — so write that model .desc(); it is the only text those six generated entries can carry.",
                ko: "base CRUD tool도 사정이 같고 처방도 같습니다. 사전 문구를 프레임워크가 마지막에 'Get Banner'로 제목과 설명 양쪽에 써버리므로, model 자신의 .desc()를 뒤에 덧붙입니다. 'Get Banner'는 동사만 말할 뿐 Banner가 무엇인지는 말하지 않고, 설명은 model이 tool을 고르는 필드입니다. 그러니 model의 .desc()를 쓰세요. 생성된 여섯 항목이 실을 수 있는 문구는 그것뿐입니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "Three revisions are spoken: the modern 2026-07-28, which is stateless by design, and the legacy 2025-11-25 and 2025-06-18, which are wire-identical over the POST-only surface this server implements. A client whose proposed version is not listed is told to disconnect, so listing only the revision that was measured refused every other shipping client. An unknown proposal is answered at whichever end of the list it is closer to, and an unimplemented method answers 404 to a modern client but 200 to a legacy one, whose era spends 404 on 'your session is gone, start a new one'.",
                ko: "이 서버가 말하는 개정판은 셋입니다. 설계상 무상태인 modern 2026-07-28, 그리고 legacy 2025-11-25와 2025-06-18입니다. 뒤의 둘은 이 서버가 실제로 구현한 POST 전용 표면에서 와이어가 동일합니다. 제안한 버전이 목록에 없는 client는 연결을 끊게 되어 있으므로, 실측한 개정판 하나만 적어두면 나머지 모든 client를 거부하는 셈이었습니다. 모르는 제안에는 목록의 가까운 쪽 끝으로 답하고, 구현하지 않은 method는 modern client에게 404, legacy client에게는 200으로 답합니다. legacy 시대의 404는 '세션이 사라졌으니 다시 시작하라'는 뜻이기 때문입니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "A prompt that declares no guards at all is named in the boot log, because its plain GET route is mounted whether or not MCP is on. An explicit [Public] is a decision and stays quiet. Msg.resource says the same kind of thing about its payload: a value whose model declares a hidden or secret field is named once per model class, and one level into a plain object too, because { order } is how a document usually arrives. It warns rather than masks even where it can read the metadata: masking would rebuild a value the caller still holds, and it could only ever reach the payloads that arrived with a class behind them — a spread or a toJSON() has already thrown the metadata away, so half would be masked and half would not, and an author who believes prompts are masked is worse off on the half that is not.",
                ko: "guards를 아예 선언하지 않은 prompt는 부팅 로그에 이름이 남습니다. MCP를 켰든 아니든 평범한 GET 라우트가 올라가기 때문입니다. 명시적인 [Public]은 하나의 결정이므로 조용히 넘어갑니다. Msg.resource도 payload에 대해 같은 일을 합니다. hidden이나 secret field를 선언한 model의 값이 실리면 model class마다 한 번씩 이름을 남기고, plain object 한 겹 안까지 봅니다. { order }가 document가 도착하는 보통의 모양이기 때문입니다. metadata를 읽을 수 있는 자리에서도 마스킹이 아니라 경고에 머무는 이유는 이렇습니다. 마스킹은 호출자가 아직 들고 있는 값을 다시 만드는 일이고, 클래스가 남아 있는 payload에만 닿을 수 있습니다. spread나 toJSON()은 이미 metadata를 버렸으므로 절반은 마스킹되고 절반은 되지 않으며, prompt가 마스킹된다고 믿는 작성자는 되지 않는 절반에서 더 위험해집니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "An expired or wrongly-audienced bearer token is refused before the pipeline sees it, so an agent is told to authenticate rather than that the tool does not exist. The signature is not checked — that needs the app's own secret — so a token signed wrong still degrades to an anonymous caller, as an opaque one does.",
                ko: "만료됐거나 다른 리소스를 대상으로 발급된 bearer 토큰은 파이프라인 이전에 거부되어, agent는 tool이 없다는 말 대신 인증하라는 응답을 받습니다. 서명은 검증하지 않습니다. 앱 자신의 secret이 필요하기 때문입니다. 그래서 서명이 틀린 토큰은 opaque 토큰과 마찬가지로 조용히 익명으로 강등됩니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "mcp: { readOnly, destructive, idempotent } only override the hints a client renders. Clients are told to distrust hints; they are never a gate.",
                ko: "mcp: { readOnly, destructive, idempotent }는 client가 표시하는 힌트만 바꿉니다. client는 힌트를 신뢰하지 않도록 안내받으며, 힌트는 결코 게이트가 아닙니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "Do not give an unknown tool a more helpful error. An endpoint that opted out has to be indistinguishable from one that does not exist, or the error itself enumerates the private surface.",
                ko: "unknown tool에 더 친절한 에러를 주지 마세요. opt-out한 endpoint는 존재하지 않는 것과 구분되지 않아야 합니다. 그렇지 않으면 에러 자체가 비공개 표면을 열거합니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "A pubsub subscription has no MCP equivalent. The transport carries no channel that outlives a single request, so a subscription would be accepted and never delivered.",
                ko: "pubsub 구독에는 MCP 대응물이 없습니다. 트랜스포트에 요청 하나보다 오래 사는 채널이 없어서, 구독을 받아도 영원히 배달되지 않습니다.",
              })}
            </li>
          </ul>
        </Docs.Description>
      </Scroll.Slide>
      <Scroll.TitleNavigator className="fixed top-32 right-0 hidden w-[250px] flex-col gap-2 lg:flex" />
    </Scroll>
  );
}
