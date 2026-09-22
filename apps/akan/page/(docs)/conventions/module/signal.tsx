import { usePage } from "@apps/akan/client";
import { Code, Divider, Docs, DocsToc, type IntroItem, type OptionItem, panelRecipe } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();

  const endpointOptions: OptionItem[] = [
    {
      key: "guards",
      type: "GuardCls[]",
      default: "none",
      desc: l.trans({
        en: "Runs in declaration order after every middleware; the first refusal wins. An empty list is a loop that never runs, not a default policy. It is also the MCP exposure decision.",
        ko: "모든 middleware 뒤에 선언 순서대로 실행되고, 첫 거절이 이깁니다. 빈 배열은 기본 정책이 아니라 한 번도 돌지 않는 루프입니다. MCP 노출 결정이기도 합니다.",
      }),
    },
    {
      key: "timeout",
      type: "number (ms)",
      default: "client's 30 s",
      desc: l.trans({
        en: "Bounds both ends: the Timeout middleware rejects the call with base.error.gatewayTimeout, and the same value is serialized to the client as that call's request budget. Losing the race does not cancel the work — the handler runs to completion with nobody holding its result.",
        ko: "양쪽 끝을 모두 제한합니다. Timeout middleware가 base.error.gatewayTimeout으로 호출을 거절하고, 같은 값이 그 호출의 요청 예산으로 클라이언트에 직렬화됩니다. 경주에서 져도 작업은 취소되지 않습니다. handler는 결과를 받을 사람 없이 끝까지 실행됩니다.",
      }),
    },
    {
      key: "cache",
      type: "number (ms)",
      default: "nothing cached",
      desc: l.trans({
        en: "Only a query taking no internal argument may carry one — an endpoint that learns who is asking would hand one caller's answer to the next. Guards run on every hit, and resolveReturn still masks per call. A cache backend that is down is warned about and the call runs uncached.",
        ko: "internal argument를 받지 않는 query만 쓸 수 있습니다. 누가 묻는지를 아는 endpoint라면 한 호출자의 답을 다음 호출자에게 건네게 됩니다. hit마다 guard가 실행되고, resolveReturn은 호출마다 여전히 마스킹합니다. 캐시 backend가 죽어 있으면 경고를 남기고 캐시 없이 실행됩니다.",
      }),
    },
    {
      key: "mcp",
      type: "boolean",
      default: "true",
      desc: l.trans({
        en: "An opt-out from the agent catalogue that leaves the guards alone. Curation, not authorization: HTTP serves the endpoint exactly as before. Reach for it on a step of a UI-driven state machine that is perfectly guarded and still a mistake for a model to reach.",
        ko: "guard는 그대로 두고 agent 카탈로그에서만 빠지는 opt-out입니다. 권한 부여가 아니라 큐레이션이며 HTTP는 이전과 똑같이 제공합니다. guard는 완벽하지만 모델이 닿아서는 곤란한, UI가 이끄는 상태 기계의 한 단계에 씁니다.",
      }),
    },
    {
      key: "method",
      type: '"POST" | "PATCH" | "PUT" | "DELETE"',
      default: '"POST"',
      desc: l.trans({
        en: "A mutation only; declared on a query or a realtime endpoint it is ignored and named in the boot log. One path may carry several verbs, and two endpoints claiming the same path and verb fail the boot. Reach for it only when a foreign wire protocol forces the verb.",
        ko: "mutation에만 적용됩니다. query나 realtime endpoint에 적으면 무시되고 부팅 로그에 이름이 남습니다. 경로 하나가 여러 verb를 가질 수 있고, 같은 경로와 같은 verb를 주장하는 endpoint가 둘이면 부팅이 실패합니다. 외부 와이어 프로토콜이 verb를 강제할 때만 씁니다.",
      }),
    },
    {
      key: "fileUpload",
      type: "boolean",
      default: "false",
      desc: l.trans({
        en: "Marks the one mutation that is the framework's upload endpoint. The generated upload action refuses to run when no endpoint carries it, and warns when more than one does. The shared file library already marks one.",
        ko: "framework의 업로드 endpoint가 될 mutation 하나를 표시합니다. 이 표시를 단 endpoint가 없으면 생성된 업로드 action이 실행을 거부하고, 둘 이상이면 경고합니다. shared file 라이브러리가 이미 하나를 표시해 두었습니다.",
      }),
    },
    {
      key: "path",
      type: "string",
      default: "the endpoint name",
      desc: l.trans({
        en: "A literal route, for a protocol that looks in a fixed place. A trailing * captures the rest of the path.",
        ko: "정해진 자리를 들여다보는 프로토콜을 위한 리터럴 경로입니다. 끝의 *는 경로의 나머지를 잡습니다.",
      }),
    },
    {
      key: "prefix",
      type: "false | string",
      default: "the module refName",
      desc: l.trans({
        en: "Drops or replaces the module segment Akan puts in front of the path.",
        ko: "Akan이 경로 앞에 붙이는 module 구간을 없애거나 다른 것으로 바꿉니다.",
      }),
    },
    {
      key: "globalPrefix",
      type: "false",
      default: "the api prefix",
      desc: l.trans({
        en: "Drops the api segment, which puts the route at the origin root. Needed together with prefix for a well-known document.",
        ko: "api 구간을 없애 route를 origin 루트에 둡니다. well-known 문서라면 prefix와 함께 필요합니다.",
      }),
    },
    {
      key: "nullable",
      type: "boolean",
      default: "false",
      desc: l.trans({
        en: "The return may be null. Without it, a handler resolving to null raises rather than answering one.",
        ko: "반환이 null일 수 있습니다. 이것이 없으면 null로 끝난 handler는 null을 답하는 대신 예외를 냅니다.",
      }),
    },
    {
      key: "backpressure",
      type: '"coalesce" | "queue"',
      default: '"coalesce"',
      desc: l.trans({
        en: "A pubsub(Binary) room under load: keep only the newest frame, which is what telemetry and video want, or queue every one when the frames are a sequence a subscriber must see in full.",
        ko: "부하를 받는 pubsub(Binary) room의 동작입니다. 최신 frame만 남기거나 — 텔레메트리와 영상이 원하는 쪽입니다 — 구독자가 빠짐없이 봐야 하는 연속된 frame이라면 전부 큐에 쌓습니다.",
      }),
    },
    {
      key: "middlewares",
      type: "MiddlewareCls[]",
      default: "none",
      desc: l.trans({
        en: "Appended after the registered chain, for this endpoint only.",
        ko: "등록된 체인 뒤에 덧붙으며, 이 endpoint에만 적용됩니다.",
      }),
    },
  ];

  const internalTypes: IntroItem[] = [
    {
      name: "resolveField(ReturnType)",
      desc: l.trans({
        en: "Calculates a resolved field declared in the constant model. The parent document is passed to exec by default.",
        ko: "constant model에 선언된 resolved field를 계산합니다. parent document가 exec에 기본으로 전달됩니다.",
      }),
      example: "like: resolveField(Int).exec(...)",
    },
    {
      name: "interval(ms)",
      desc: l.trans({
        en: "Runs a recurring server task every given number of milliseconds.",
        ko: "지정한 millisecond 간격으로 server task를 반복 실행합니다.",
      }),
      example: "sync: interval(1000 * 60).exec(...)",
    },
    {
      name: "cron(expression)",
      desc: l.trans({
        en: "Runs scheduled work with a cron expression. Commonly used with serverMode options for batch jobs.",
        ko: "cron expression으로 scheduled work를 실행합니다. batch job에는 serverMode option과 함께 자주 사용합니다.",
      }),
      example: 'cleanup: cron("0 0 * * *").exec(...)',
    },
    {
      name: "initialize(options?) / destroy(options?)",
      desc: l.trans({
        en: "Runs setup or teardown logic when the server process starts or stops.",
        ko: "server process가 시작되거나 종료될 때 setup 또는 teardown logic을 실행합니다.",
      }),
      example: "initialize().exec(...)",
    },
    {
      name: "process(ReturnType)",
      desc: l.trans({
        en: "Defines a background queue job. Use msg(...) to describe the job payload.",
        ko: "background queue job을 정의합니다. msg(...)로 job payload를 설명합니다.",
      }),
      example: "archive: process(Boolean).msg(...)",
    },
    {
      name: "timeout(ms)",
      desc: l.trans({
        en: "Runs once, this many milliseconds after the process starts. Locked by default like the other timers, so two replicas do not both run it.",
        ko: "프로세스 시작 뒤 이만큼의 millisecond가 지나면 한 번 실행됩니다. 다른 timer처럼 기본으로 잠기므로 replica 둘이 함께 돌지 않습니다.",
      }),
      example: "warmup: timeout(5000).exec(...)",
    },
  ];

  const endpointTypes: IntroItem[] = [
    {
      name: "query(ReturnType, options?)",
      desc: l.trans({
        en: "Read API. Use it for loading one model, computed data, or public files.",
        ko: "읽기 API입니다. 단일 model, 계산된 데이터, public file을 불러올 때 사용합니다.",
      }),
      example: "story: query(Story).param(...).exec(...)",
    },
    {
      name: "mutation(ReturnType, options?)",
      desc: l.trans({
        en: "Write API. Use it for create, update, delete, or business actions.",
        ko: "쓰기 API입니다. create, update, delete 또는 business action에 사용합니다.",
      }),
      example: "createStory: mutation(Story).body(...).exec(...)",
    },
    {
      name: "message(ReturnType, options?)",
      desc: l.trans({
        en: "WebSocket message handler. Use msg(...) for incoming payload fields.",
        ko: "WebSocket message handler입니다. msg(...)로 들어오는 payload field를 정의합니다.",
      }),
      example: "readChat: message(Boolean).msg(...).exec(...)",
    },
    {
      name: "pubsub(ReturnType, options?)",
      desc: l.trans({
        en: 'Realtime subscription channel. Use room(...) to describe the subscription room. A Binary return sends raw bytes in a websocket binary frame and coalesces under backpressure; name backpressure: "queue" when every frame has to arrive.',
        ko: 'Realtime subscription channel입니다. room(...)으로 subscription room을 정의합니다. return이 Binary면 raw byte를 websocket binary frame으로 보내고 backpressure 시 최신 frame만 남깁니다. 모든 frame이 도착해야 하면 backpressure: "queue"를 지정합니다.',
      }),
      example: "chatAdded: pubsub(Chat).room(...).exec(...)",
    },
  ];

  const paramBuilders: IntroItem[] = [
    {
      name: ".param(name, Type, options?)",
      desc: l.trans({
        en: "Required path-style argument. Common in query, mutation, and slice list methods.",
        ko: "필수 path-style argument입니다. query, mutation, slice list method에서 자주 사용합니다.",
      }),
      example: '.param("storyId", ID)',
    },
    {
      name: ".search(name, Type, options?)",
      desc: l.trans({
        en: "Optional search/query argument. It is nullable by default.",
        ko: "optional search/query argument입니다. 기본적으로 nullable입니다.",
      }),
      example: '.search("title", String)',
    },
    {
      name: ".body(name, Type, options?)",
      desc: l.trans({
        en: "Request body value, commonly used by mutation APIs.",
        ko: "request body 값이며 mutation API에서 주로 사용합니다.",
      }),
      example: '.body("data", StoryInput)',
    },
    {
      name: ".msg(name, Type, options?)",
      desc: l.trans({
        en: "Message or process payload argument.",
        ko: "message 또는 process payload argument입니다.",
      }),
      example: '.msg("root", ID)',
    },
    {
      name: ".room(name, Type, options?)",
      desc: l.trans({
        en: "Realtime room key for pubsub subscription channels.",
        ko: "pubsub subscription channel의 realtime room key입니다.",
      }),
      example: '.room("root", ID)',
    },
    {
      name: ".with(InternalArg, options?)",
      desc: l.trans({
        en: "Server-derived context such as Self, Req, Res, Ws, or custom internal args.",
        ko: "Self, Req, Res, Ws 또는 custom internal arg처럼 server에서 주입되는 context입니다.",
      }),
      example: ".with(Self, { nullable: true })",
    },
  ];

  const moduleAutoMethods: IntroItem[] = [
    {
      name: "view[Model](id)",
      desc: l.trans({
        en: "Fetch detail-view data generated from the model module. Returns a handle: destructure it for one promise per field, or await it for the resolved object.",
        ko: "model module에서 생성된 detail-view 데이터를 불러옵니다. handle을 반환하므로, 구조분해하면 field별 promise를, await하면 해소된 객체를 얻습니다.",
      }),
      example: "const { storyView } = fetch.viewStory(storyId)",
    },
    {
      name: "edit[Model](id)",
      desc: l.trans({
        en: "Fetch edit-view data generated from the model module. Same handle shape as view[Model].",
        ko: "model module에서 생성된 edit-view 데이터를 불러옵니다. view[Model]과 같은 handle 형태입니다.",
      }),
      example: "const { storyEdit } = fetch.editStory(storyId)",
    },
    {
      name: "merge[Model](id, data)",
      desc: l.trans({
        en: "Create or update model data through the generated module API.",
        ko: "generated module API를 통해 model data를 생성하거나 수정합니다.",
      }),
      example: "await fetch.mergeStory(storyId, data)",
    },
  ];

  const sliceAutoMethods: IntroItem[] = [
    {
      name: "[model]List[Suffix](...args, skip, limit, sort)",
      desc: l.trans({
        en: "Loads a paginated list for a slice definition.",
        ko: "slice definition에 대한 paginated list를 불러옵니다.",
      }),
      example: 'await fetch.storyListInRoot(rootId, 0, 20, "latest")',
    },
    {
      name: "[model]Insight[Suffix](...args)",
      desc: l.trans({
        en: "Loads aggregation data for the same slice query.",
        ko: "같은 slice query에 대한 aggregation data를 불러옵니다.",
      }),
      example: "await fetch.storyInsightInRoot(rootId)",
    },
    {
      name: "init[Model](queryKey?, args?)",
      desc: l.trans({
        en: "Initializes the root slice list with list and insight data. queryKey names one of the model's own filters and args are that filter's arguments; no key at all is the any filter. Both queries leave at call time, and the handle hands out storyInit, storyList, and storyInsight as separate promises.",
        ko: "root slice list를 list와 insight data로 초기화합니다. queryKey는 model이 선언한 filter 중 하나의 이름이고 args는 그 filter의 인자입니다. key를 생략하면 any filter입니다. 두 query는 호출 시점에 출발하고, handle은 storyInit, storyList, storyInsight를 각각의 promise로 제공합니다.",
      }),
      example: 'const { storyInit } = fetch.initStory("byOwner", [ownerId])',
    },
    {
      name: "init[Model][Suffix](...args)",
      desc: l.trans({
        en: "Initializes a named slice list with args declared in signal.ts. Pass storyInitInRoot to a Zone; consume storyListInRoot on the server, since it holds hydrated model instances.",
        ko: "signal.ts에 선언한 arg를 사용해 named slice list를 초기화합니다. storyInitInRoot는 Zone에 넘기고, storyListInRoot는 hydrate된 model instance를 담고 있으므로 server에서 사용합니다.",
      }),
      example: "const { storyInitInRoot } = fetch.initStoryInRoot(rootId)",
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="signal-overview" title="model.signal.ts">
        <Docs.Title>model.signal.ts</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Signals define the external interface of a module. They connect service logic to generated client APIs, list stores, realtime channels, and server-side jobs.",
              ko: "Signal은 module의 외부 interface를 정의합니다. service logic을 generated client API, list store, realtime channel, server-side job에 연결합니다.",
            })}
          </div>
          <div className="space-y-3">
            {[
              {
                title: "Internal",
                desc: l.trans({
                  en: "Server-only work such as resolved fields, cron jobs, lifecycle hooks, and background processes.",
                  ko: "resolved field, cron job, lifecycle hook, background process 같은 server-only 작업입니다.",
                }),
              },
              {
                title: "Endpoint",
                desc: l.trans({
                  en: "Public APIs and realtime handlers exposed through fetch, websocket message, or pubsub.",
                  ko: "fetch, websocket message, pubsub으로 노출되는 public API와 realtime handler입니다.",
                }),
              },
              {
                title: "Slice",
                desc: l.trans({
                  en: "Frontend-facing list surfaces used by generated stores, pagination, and insight loading.",
                  ko: "generated store, pagination, insight loading이 사용하는 frontend-facing list surface입니다.",
                }),
              },
            ].map(({ title, desc }) => (
              <div key={title} className={panelRecipe({ padding: "row" })}>
                <div className="font-bold text-foreground">{title}</div>
                <div className="text-foreground/70">{desc}</div>
              </div>
            ))}
          </div>
          <Code.Snippet
            className="w-full"
            title="story.signal.ts"
            code={`export class StoryInternal extends internal(srv.story, () => ({})) {}

export class StorySlice extends slice(srv.story, { guards: { root: Admin, get: Public, cru: Admin } }, () => ({})) {}

export class StoryEndpoint extends endpoint(srv.story, ({ query }) => ({
  story: query(cnst.Story, { guards: [Public] }).exec(async function () {
    return await this.storyService.getStory();
  }),
})) {}`}
          />
          <div>
            {l.trans({
              en: (
                <span>
                  Every <code>slice()</code> names an explicit <code>guards</code> map with <code>root: Admin</code>,
                  and every custom endpoint names its own <code>guards</code> array. The guards are also the MCP
                  exposure decision: an endpoint that names none is unauthorized and silently refused from the agent
                  catalogue.
                </span>
              ),
              ko: (
                <span>
                  모든 <code>slice()</code>는 <code>root: Admin</code>을 포함한 <code>guards</code> map을 명시하고, 모든
                  custom endpoint는 자기 <code>guards</code> 배열을 적습니다. guard는 MCP 노출 결정이기도 해서, 아무
                  guard도 적지 않은 endpoint는 인가되지 않을 뿐 아니라 agent catalogue에서도 조용히 거부됩니다.
                </span>
              ),
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide
        id="signal-extension"
        title={l.trans({ en: "Extending Generated Signals", ko: "Generated signal 확장" })}
      >
        <Docs.Title>{l.trans({ en: "Extending Generated Signals", ko: "Generated signal 확장" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "When an app domain extends generated or library behavior, spread inherited signals at the end. This keeps base internals, slices, and endpoints while adding app-specific methods.",
              ko: "app domain이 generated 또는 library 동작을 확장할 때는 inherited signal을 마지막에 spread합니다. base internal, slice, endpoint를 유지하면서 app 전용 method를 추가할 수 있습니다.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="user.signal.ts"
          code={`export class UserInternal extends internal(srv.user, () => ({}), ...user.internals) {}

export class UserSlice extends slice(
  srv.user,
  { guards: { root: Admin, get: Public, cru: SelfOrAdmin } },
  () => ({}),
  ...user.slices,
) {}

export class UserEndpoint extends endpoint(
  srv.user,
  ({ query }) => ({
    authCallback: query(String, { guards: [Public] }).search("code", String).exec(async function (code) {
      return await this.userService.authCallback(code);
    }),
  }),
  ...user.endpoints,
) {}`}
        />
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="internal-signal" title={l.trans({ en: "Defining Internal Tasks", ko: "Internal 작업 정의" })}>
        <Docs.Title>{l.trans({ en: "Defining Internal Tasks", ko: "Internal 작업 정의" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Use internal() for work that belongs to the server runtime rather than a direct page call. This includes resolved fields, scheduled tasks, lifecycle hooks, and queue jobs.",
              ko: "page에서 직접 호출하는 API가 아니라 server runtime에 속하는 작업에는 internal()을 사용합니다. resolved field, scheduled task, lifecycle hook, queue job이 여기에 포함됩니다.",
            })}
          </div>
        </Docs.Description>
        <Docs.IntroTable type="method" items={internalTypes} />
        <Code.Snippet
          className="w-full"
          title="story.signal.ts"
          code={`export class StoryInternal extends internal(srv.story.with(srv.actionLog), ({ resolveField, cron }) => ({
  like: resolveField(Int)
    .with(Self, { nullable: true })
    .exec(async function (story, self) {
      if (!self) return 0;
      return await this.actionLogService.getLike(story.id, self.id);
    }),
  cleanup: cron("0 0 * * *").exec(async function () {
    await this.storyService.cleanup();
  }),
})) {}`}
        />
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="endpoint-signal" title={l.trans({ en: "Defining Public APIs", ko: "Public API 정의" })}>
        <Docs.Title>{l.trans({ en: "Defining Public APIs", ko: "Public API 정의" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Use endpoint() for API methods that the client can call. Endpoint builders cover read/write APIs and realtime surfaces.",
              ko: "client가 호출할 수 있는 API method에는 endpoint()를 사용합니다. endpoint builder는 read/write API와 realtime surface를 다룹니다.",
            })}
          </div>
        </Docs.Description>

        <Docs.SubTitle>Method Types</Docs.SubTitle>
        <Docs.IntroTable type="method" items={endpointTypes} />

        <Docs.SubTitle>Parameter Builders</Docs.SubTitle>
        <Docs.Description>
          {l.trans({
            en: "Parameter builders describe where each value comes from. The order becomes the order of exec arguments. Put nullable arguments near the end because required arguments cannot follow nullable ones.",
            ko: "parameter builder는 각 값이 어디에서 오는지 설명합니다. 선언 순서가 exec argument 순서가 됩니다. required argument가 nullable argument 뒤에 올 수 없으므로 nullable argument는 뒤쪽에 두세요.",
          })}
        </Docs.Description>
        <Docs.IntroTable type="field" items={paramBuilders} />

        <Docs.SubTitle>Endpoint Example</Docs.SubTitle>
        <Code.Snippet
          className="w-full"
          title="story.signal.ts"
          code={`export class StoryEndpoint extends endpoint(srv.story, ({ query, mutation }) => ({
  story: query(cnst.Story, { guards: [Public] })
    .param("storyId", ID)
    .exec(async function (storyId) {
      return await this.storyService.getStory(storyId);
    }),
  createStory: mutation(cnst.Story, { guards: [Every] })
    .body("data", cnst.StoryInput)
    .exec(async function (data) {
      return await this.storyService.createStory(data);
    }),
})) {}`}
        />

        <Docs.SubTitle>Realtime Example</Docs.SubTitle>
        <Code.Snippet
          className="w-full"
          title="chatRoom.signal.ts"
          code={`export class ChatRoomEndpoint extends endpoint(srv.chatRoom, ({ message, pubsub }) => ({
  readChat: message(Boolean, { guards: [Every] }).msg("root", ID).exec(async function (root) {
    return await this.chatRoomService.read(root);
  }),
  chatAdded: pubsub(cnst.Chat, { guards: [Every] }).room("root", ID).exec(async function () {}),
})) {}`}
        />
        <Docs.Description>
          {l.trans({
            en: "A slice-level guards map only reaches the generated query and mutation endpoints. A message or pubsub endpoint is unguarded unless it declares its own guards, and its guards are re-run whenever the socket's credential changes.",
            ko: "slice의 guards map은 generated query와 mutation endpoint에만 닿습니다. message와 pubsub endpoint는 자기 guards를 선언하지 않으면 무방비이며, socket의 credential이 바뀔 때마다 guard가 다시 실행됩니다.",
          })}
        </Docs.Description>

        <Docs.SubTitle>Public Path Endpoints</Docs.SubTitle>
        <Docs.Description>
          {l.trans({
            en: "Use endpoint options when a method should be exposed at a public path, such as sitemap.xml or other non-standard API routes.",
            ko: "sitemap.xml처럼 일반 API route가 아닌 public path로 method를 노출해야 할 때 endpoint option을 사용합니다.",
          })}
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="site.signal.ts"
          code={`export class SiteEndpoint extends endpoint(srv.site, ({ query }) => ({
  sitemapXml: query(Any, { guards: [Public], path: "sitemap.xml", prefix: false }).exec(async function () {
    return new Response(null, { headers: { "Content-Type": "application/xml" } });
  }),
})) {}`}
        />

        <Docs.SubTitle>Client Usage (fetch)</Docs.SubTitle>
        <Docs.Description>
          {l.trans({
            en: "Generated fetch methods call endpoint methods from page loaders, components, stores, or client actions.",
            ko: "generated fetch method는 page loader, component, store, client action에서 endpoint method를 호출할 때 사용합니다.",
          })}
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="page.tsx"
          code={`const story = await fetch.story(storyId);
const created = await fetch.createStory(data);

await fetch.readChat(rootId);
const unsubscribe = fetch.subscribeChatAdded(rootId, (chat) => {
  console.info(chat);
});`}
        />
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="endpoint-options" title={l.trans({ en: "The Options Object", ko: "옵션 객체" })}>
        <Docs.Title>{l.trans({ en: "The Options Object", ko: "옵션 객체" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "The second argument to query, mutation, message and pubsub is the same object in all four, and it is where an endpoint declares everything about itself that is not an argument. Most of it decides what happens before your handler runs.",
              ko: "query, mutation, message, pubsub의 두 번째 인자는 넷 모두 같은 객체이고, endpoint가 인자가 아닌 모든 것을 선언하는 자리입니다. 그 대부분은 handler가 실행되기 전에 무슨 일이 일어날지를 정합니다.",
            })}
          </div>
          <Docs.Mermaid
            title={l.trans({ en: "What runs before exec", ko: "exec 앞에서 도는 것" })}
            highlightNodes={["guards"]}
            chart={`flowchart TB
  call["fetch.createStory(data)"] --> logging["Logging<br/>one record per call"]
  logging --> timeout["Timeout<br/>the endpoint's own timeout ms"]
  timeout --> cache["Cache<br/>a query with no internal argument only"]
  cache --> account["AccountMiddleware<br/>and any the app registered"]
  account --> guards["guards, in declaration order"]
  guards --> internal["Internal arguments<br/>.with(Self) · .with(Me)"]
  internal --> handler["exec() handler"]
  handler --> resolve["resolveReturn<br/>hidden and secret fields masked"]
  guards -.->|"first false"| denied["403 Forbidden"]
  timeout -.->|"budget spent"| gateway["gatewayTimeout<br/>the handler keeps running"]
  cache -.->|"hit"| hit["stored result<br/>guards run anyway"]`}
          />
          <div>
            {l.trans({
              en: "Logging, Timeout and Cache are registered by default and stand aside for every endpoint that declares nothing, so the chain costs nothing until an option turns one of them on. Guards run last, inside the handler's own wrapper — which is why a cache hit has to re-run them explicitly rather than skipping them with the handler.",
              ko: "Logging, Timeout, Cache는 기본으로 등록되어 있고 아무것도 선언하지 않은 endpoint에서는 비켜섭니다. 그래서 옵션 하나가 켜기 전까지 이 체인에는 비용이 없습니다. guard는 handler 자신의 wrapper 안에서 마지막에 돕니다. cache hit이 handler를 건너뛰면서도 guard만은 다시 실행해야 하는 이유입니다.",
            })}
          </div>
          <Docs.OptionTable items={endpointOptions} />
          <Docs.Alert type="error">
            {l.trans({
              en: (
                <span>
                  Never re-declare a generated CRUD name. Every model already has <code>{"<model>"}</code> plus{" "}
                  <code>light</code>, <code>create</code>, <code>update</code>, <code>remove</code>, <code>view</code>,{" "}
                  <code>edit</code> and <code>merge</code> forms of it. The service layer surfaces the collision as a
                  typecheck error, but the signal layer can pass sync, typecheck and build and fail only at runtime —
                  treat it as an error whether or not the build is green. <code>no-redeclare-predefined-endpoint</code>{" "}
                  catches it in <code>*.signal.ts</code>.
                </span>
              ),
              ko: (
                <span>
                  생성된 CRUD 이름을 다시 선언하지 마세요. 모든 model에는 이미 <code>{"<model>"}</code>과{" "}
                  <code>light</code>, <code>create</code>, <code>update</code>, <code>remove</code>, <code>view</code>,{" "}
                  <code>edit</code>, <code>merge</code> 형태가 있습니다. service 계층은 충돌을 typecheck 에러로
                  드러내지만, signal 계층은 sync·typecheck·build를 모두 통과하고 runtime에서만 실패할 수 있습니다.
                  빌드가 초록색인지와 무관하게 에러로 다루세요. <code>*.signal.ts</code>에서는{" "}
                  <code>no-redeclare-predefined-endpoint</code>가 잡아 줍니다.
                </span>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="argument-types" title={l.trans({ en: "What An Argument May Be", ko: "인자가 될 수 있는 것" })}>
        <Docs.Title>{l.trans({ en: "What An Argument May Be", ko: "인자가 될 수 있는 것" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Every parameter builder takes the same kinds of type: a registered scalar, a model reference, an enumOf class, or an array of one of those. Three of the mistakes are worth knowing in advance, because two of them are not type errors.",
              ko: "모든 parameter builder는 같은 종류의 타입을 받습니다. 등록된 scalar, model 참조, enumOf class, 또는 그중 하나의 배열입니다. 실수 세 가지는 미리 알아 둘 만한데, 그중 둘은 타입 에러가 아니기 때문입니다.",
            })}
          </div>
          <div className="my-4 space-y-3">
            <div className={panelRecipe({ radius: "lg", padding: "sm" })}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-primary">🔢</span>
                <strong className="text-primary">
                  {l.trans({ en: "Int or Float, never Number", ko: "Number가 아니라 Int 또는 Float" })}
                </strong>
              </div>
              <div className="text-foreground/70 text-sm">
                {l.trans({
                  en: "String, Boolean and Date are monkey-patched into scalars and pass; the Number constructor is deliberately left alone, so it is not in the accepted union and the call does not typecheck. Choose the one the field actually is — a count is Int, a price is Float.",
                  ko: "String, Boolean, Date는 scalar로 패치되어 통과하지만 Number 생성자는 일부러 건드리지 않았습니다. 허용된 union에 없으므로 호출이 typecheck를 통과하지 못합니다. 그 값이 실제로 무엇인지 고르세요. 개수는 Int, 가격은 Float입니다.",
                })}
              </div>
            </div>
            <div className={panelRecipe({ radius: "lg", padding: "sm" })}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-primary">📎</span>
                <strong className="text-primary">
                  {l.trans({ en: "Upload is a body, never a field", ko: "Upload는 body이지 field가 아니다" })}
                </strong>
              </div>
              <div className="text-foreground/70 text-sm">
                {l.trans({
                  en: "An Upload body argument on a mutation is what switches request parsing to multipart, and the mutation that owns the upload flow declares fileUpload: true. A model never declares one — an image or file field is a relation to the File model instead.",
                  ko: "mutation의 Upload body 인자가 요청 파싱을 multipart로 바꾸고, 업로드 흐름을 소유한 mutation은 fileUpload: true를 선언합니다. model은 절대 선언하지 않습니다. 이미지나 파일 field는 File model에 대한 관계입니다.",
                })}
              </div>
            </div>
            <div className={panelRecipe({ radius: "lg", padding: "sm" })}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-primary">🧬</span>
                <strong className="text-primary">
                  {l.trans({ en: "Bytes are Binary, never Any", ko: "바이트는 Any가 아니라 Binary" })}
                </strong>
              </div>
              <div className="text-foreground/70 text-sm">
                {l.trans({
                  en: "Binary is Uint8Array on both sides and accepts base64 in either direction, so one declaration serves a JSON body and a websocket binary frame. Any passes a Buffer through untouched, and JSON.stringify then spells it as a type-and-data object that JSON.parse never restores — 3.6x the wire and a shape that only breaks at the first byte-offset read.",
                  ko: "Binary는 양쪽에서 Uint8Array이고 어느 방향으로든 base64를 받으므로, 선언 하나가 JSON body와 websocket binary frame 모두를 감당합니다. Any는 Buffer를 그대로 통과시키고, JSON.stringify는 그것을 type과 data를 가진 객체로 적는데 JSON.parse는 결코 되돌리지 못합니다. 와이어는 3.6배가 되고, 그 모양은 첫 바이트 오프셋을 읽는 순간에야 깨집니다.",
                })}
              </div>
            </div>
          </div>
          <Docs.Alert type="warning">
            {l.trans({
              en: (
                <span>
                  <code>Binary</code> is not storable. The class build refuses <code>field(Binary)</code> and names the{" "}
                  <code>File</code> model instead, because every non-base field lives in the document's JSON column and
                  bytes would sit there as base64 and ride every read of the row. MCP refuses a <code>Binary</code>{" "}
                  return and an <code>Any</code> one for the same reason.
                </span>
              ),
              ko: (
                <span>
                  <code>Binary</code>는 저장할 수 없습니다. class 빌드가 <code>field(Binary)</code>를 거부하고 대신{" "}
                  <code>File</code> model을 알려 줍니다. base가 아닌 모든 field는 document의 JSON 열에 살고, 바이트는
                  거기에 base64로 앉아 그 행의 모든 읽기에 함께 실려 다니기 때문입니다. MCP도 같은 이유로{" "}
                  <code>Binary</code> 반환과 <code>Any</code> 반환을 거부합니다.
                </span>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="standard-signal" title={l.trans({ en: "Standard Model APIs", ko: "표준 Model API" })}>
        <Docs.Title>{l.trans({ en: "Standard Model APIs", ko: "표준 Model API" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Akan generates standard model APIs for common view, edit, and merge flows. You usually add custom endpoints only when the business action needs its own name or behavior.",
              ko: "Akan은 일반적인 view, edit, merge 흐름을 위한 표준 model API를 생성합니다. 비즈니스 action에 고유한 이름이나 동작이 필요할 때 custom endpoint를 추가합니다.",
            })}
          </div>
        </Docs.Description>
        <Docs.IntroTable type="method" items={moduleAutoMethods} />
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="slice-signal" title={l.trans({ en: "Defining Slices And Stores", ko: "Slice와 Store 정의" })}>
        <Docs.Title>{l.trans({ en: "Defining Slices And Stores", ko: "Slice와 Store 정의" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Use slice() to define list surfaces for pages. A slice starts from init(), receives params, search values, or internal args, and returns a service query.",
              ko: "page용 list surface를 정의할 때 slice()를 사용합니다. slice는 init()에서 시작해 param, search value, internal arg를 받고 service query를 반환합니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "Root guards apply to the generated slice surface. Method guards passed to init({ guards }) narrow a specific list.",
              ko: "root guard는 generated slice surface에 적용됩니다. init({ guards })에 전달한 method guard는 특정 list에만 적용됩니다.",
            })}
          </div>
        </Docs.Description>

        <Docs.SubTitle>Server Definition</Docs.SubTitle>
        <Code.Snippet
          className="w-full"
          title="story.signal.ts"
          code={`export class StorySlice extends slice(srv.story, { guards: { root: Admin, get: Public, cru: Admin } }, (init) => ({
  inRoot: init({ guards: [Public] }).param("root", ID).exec(function (root) {
    return this.storyService.queryInRoot(root);
  }),
})) {}`}
        />

        <Docs.SubTitle>Slice Auto-Generated Methods</Docs.SubTitle>
        <Docs.Description>
          {l.trans({
            en: "A slice definition generates list, insight, and init fetch methods. These methods are usually consumed by store and zone UI code.",
            ko: "slice definition은 list, insight, init fetch method를 생성합니다. 이 method들은 보통 store와 zone UI code에서 사용합니다.",
          })}
        </Docs.Description>
        <Docs.IntroTable type="method" items={sliceAutoMethods} />

        <Docs.SubTitle>Client Usage</Docs.SubTitle>
        <Code.Snippet
          className="w-full"
          title="page.tsx"
          code={`const { storyInitInRoot, storyListInRoot } = fetch.initStoryInRoot(rootId);

<Story.Zone.Card init={storyInitInRoot} />
<Load.Stream of={storyListInRoot}>{(storyList) => <Story.Unit.Total count={storyList.length} />}</Load.Stream>`}
        />
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="practical-rules" title={l.trans({ en: "Practical Rules", ko: "실전 규칙" })}>
        <Docs.Title>{l.trans({ en: "Practical Rules", ko: "실전 규칙" })}</Docs.Title>
        <Docs.Description>
          <div className="space-y-1">
            {[
              l.trans({
                en: "Use ...model.internals, ...model.slices, and ...model.endpoints when extending generated or library domains.",
                ko: "generated 또는 library domain을 확장할 때는 ...model.internals, ...model.slices, ...model.endpoints를 사용합니다.",
              }),
              l.trans({
                en: "Use srv.model.with(otherSrv) when the signal needs another service in this.*Service.",
                ko: "signal에서 다른 service를 this.*Service로 사용해야 하면 srv.model.with(otherSrv)를 사용합니다.",
              }),
              l.trans({
                en: "An endpoint that names a real guard is reachable by an AI agent; one that names none is not. There is no per-endpoint opt-in — mcp: false only opts an already-guarded endpoint out, and on a slice mcp: { cru: false } mirrors the guards map for the root slice and generated CRUD.",
                ko: "실질 guard를 적은 endpoint는 AI agent가 닿고, 아무 guard도 적지 않은 endpoint는 닿지 않습니다. endpoint별 opt-in은 없습니다. mcp: false는 이미 guard된 endpoint를 빼는 opt-out이고, slice의 mcp: { cru: false }는 root slice와 generated CRUD에 한해 guards map을 그대로 따라 적습니다.",
              }),
              l.trans({
                en: "There is no prompt builder on endpoint(). A screen is published as an MCP prompt from its page file with page().prompt(name, description). See the MCP Server cheatsheet.",
                ko: "endpoint()에는 prompt builder가 없습니다. 화면은 page 파일에서 page().prompt(name, description)으로 MCP prompt로 게시됩니다. MCP Server cheatsheet을 참고하세요.",
              }),
            ].map((rule) => (
              <div key={rule} className={panelRecipe({ padding: "row" }, "text-foreground/70")}>
                {rule}
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
