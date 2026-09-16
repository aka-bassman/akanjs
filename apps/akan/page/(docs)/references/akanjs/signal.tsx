import { usePage } from "@apps/akan/client";
import { Code, Divider, Docs, DocsToc } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();
  const symbols = [
    {
      name: "Public / None / guard",
      desc: l.trans({
        en: 'Guard classes decide whether a request can pass before endpoint or slice execution. `Public` always passes, `None` blocks, and `guard(name)` creates a named guard base class for app-specific rules. Guards run on every transport, so read the caller with `context.get("account")` instead of branching on http/websocket. Slice `guards` cover only the generated query/mutation endpoints — declare `guards` on each `pubsub`/`message` endpoint to protect a socket. Every guard declares `static scope: GuardScope`, and it is required: `"account"` when the verdict depends only on the caller, `"resource"` when it needs the arguments of the call. Only `account` guards are evaluated when filtering an MCP catalogue, and since exposure follows the guards, a wrong mark would list an endpoint to callers who cannot use it.',
        ko: 'Guard class는 endpoint 또는 slice 실행 전에 request가 통과할 수 있는지 결정합니다. `Public`은 항상 통과하고, `None`은 막으며, `guard(name)`은 app-specific rule을 위한 named guard base class를 생성합니다. Guard는 모든 transport에서 실행되므로 http/websocket을 분기하지 말고 `context.get("account")`로 caller를 읽으세요. Slice `guards`는 생성된 query/mutation endpoint만 덮으므로, socket을 보호하려면 각 `pubsub`/`message` endpoint에 `guards`를 선언해야 합니다. 모든 guard는 `static scope: GuardScope`를 선언하며 필수입니다. 판정이 caller에만 의존하면 `"account"`, 호출 인자가 필요하면 `"resource"`입니다. MCP 카탈로그 필터링에는 `account` guard만 평가되고, 노출이 guard를 따르므로 잘못 표기하면 쓸 수 없는 caller에게도 endpoint가 목록에 나갑니다.',
      }),
      code: `import { guard, Public } from "akanjs/signal";

export class AdminOnly extends guard("AdminOnly") {
  static override scope = "account" as const;
  override canPass(context) {
    return context.get("account")?.role === "admin";
  }
}

export class RoomEndpoint extends endpoint(roomSrv, ({ pubsub }) => ({
  feed: pubsub(cnst.Message, { guards: [AdminOnly] })
    .room("roomId", ID)
    .exec(() => undefined),
})) {}`,
    },
    {
      name: "McpProgress",
      desc: l.trans({
        en: "Reports progress for a long-running MCP tool call. Reached through `AsyncLocalStorage`, so an endpoint reports from wherever the work happens — a service, an adapter, a loop several frames down — without threading a channel through every signature. Outside a streamed call it is a no-op, so the same code runs unchanged over plain HTTP, a websocket, and in tests. The server switches to an SSE response only once the first report arrives, and only when the client asked with both `Accept: text/event-stream` and a `_meta.progressToken`.",
        ko: "장기 실행 MCP tool call의 진행률을 보고합니다. `AsyncLocalStorage`로 접근하므로 service, adapter, 몇 프레임 아래 loop 등 실제 작업이 일어나는 곳에서 바로 보고할 수 있고, 그 사이 모든 signature에 channel을 달 필요가 없습니다. streaming이 아닐 때는 no-op이라 같은 code가 일반 HTTP, websocket, test에서 그대로 동작합니다. server는 첫 보고가 도착한 뒤에야 SSE 응답으로 전환하며, client가 `Accept: text/event-stream`과 `_meta.progressToken`을 모두 보냈을 때만 해당합니다.",
      }),
      code: `import { McpProgress } from "akanjs/signal";

export class ImportService extends serve(db.task, () => ({})) {
  async importTasks(rows: TaskInput[]) {
    for (const [idx, row] of rows.entries()) {
      McpProgress.report(idx + 1, { total: rows.length, message: \`importing \${row.title}\` });
      await this.createTask(row);
    }
    return rows.length;
  }
}`,
    },
    {
      name: "Req / Res / Ws",
      desc: l.trans({
        en: "Internal argument providers for advanced endpoints. `Req` gives the Bun request, `Res` gives the mutable response context, and `Ws` gives websocket subscription state and event hooks.",
        ko: "advanced endpoint를 위한 internal argument provider입니다. `Req`는 Bun request, `Res`는 mutable response context, `Ws`는 websocket subscription state와 event hook을 제공합니다.",
      }),
      code: `import { endpoint, Req, Res, Ws } from "akanjs/signal";

export class WallpadEndpoint extends endpoint(wallpadSrv, ({ mutation, message }) => ({
  proxy: mutation(String).internal("req", Req).internal("res", Res).exec((req, res) => "ok"),
  join: message(Boolean).internal("ws", Ws).exec((ws) => ws.subscribe),
})) {}`,
    },
    {
      name: "middleware / Middleware",
      desc: l.trans({
        en: "Middleware wraps endpoint execution. `Logging`, `Timeout`, and `Cache` are registered by default and each stands aside unless the endpoint declares the option it reads (`timeout`, `cache`), while custom middleware can read `SignalContext` and decide when to call `next()`.",
        ko: "Middleware는 endpoint execution을 감쌉니다. `Logging`, `Timeout`, `Cache`가 기본 등록되어 있으며 각각 endpoint가 해당 option(`timeout`, `cache`)을 선언했을 때만 동작하고, custom middleware는 `SignalContext`를 읽어 언제 `next()`를 호출할지 결정할 수 있습니다.",
      }),
      code: `import { middleware, type SignalContext } from "akanjs/signal";

export class TraceMiddleware extends middleware("Trace") {
  override async use() {
    return async (context: SignalContext, next) => {
      context.adaptor.logger.info(context.key);
      return next();
    };
  }
}`,
    },
    {
      name: "SignalRegistry",
      desc: l.trans({
        en: "Global registry for database and service signals. App `sig.ts` files register every module signal so serialized fetch metadata, server routes, and runtime signal lookup can be built consistently.",
        ko: "database 및 service signal을 위한 global registry입니다. app `sig.ts` 파일은 serialized fetch metadata, server route, runtime signal lookup을 일관되게 만들기 위해 모든 module signal을 등록합니다.",
      }),
      code: `import { SignalRegistry } from "akanjs/signal";

const userSignal = SignalRegistry.getDatabase("user");
const utilSignal = SignalRegistry.getService("util");`,
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="akanjs-signal" title="akanjs/signal">
        <Docs.Title>akanjs/signal</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "`akanjs/signal` declares the API boundary around services. Import it in `*.signal.ts` files to define endpoints, internal jobs, database slices, guards, middleware, request arguments, and registered server signals.",
              ko: "`akanjs/signal`은 service 주변의 API boundary를 선언합니다. `*.signal.ts`에서 endpoint, internal job, database slice, guard, middleware, request argument, registered server signal을 정의할 때 사용합니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "The endpoint builder kinds are `query`, `mutation`, `pubsub`, and `message`; an MCP prompt is declared on a page with `page().prompt(name, description)` — see the `akanjs/client` reference.",
              ko: "endpoint builder의 종류는 `query`, `mutation`, `pubsub`, `message`이며, MCP prompt는 page에서 `page().prompt(name, description)`로 선언합니다 — `akanjs/client` 레퍼런스를 참고하세요.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />
      {symbols.map((symbol) => (
        <Scroll.Slide key={symbol.name} id={symbol.name} title={symbol.name}>
          <Docs.Title>{symbol.name}</Docs.Title>
          <Docs.Description>
            <div>{symbol.desc}</div>
          </Docs.Description>
          <Code.Snippet
            className="w-full"
            title={l.trans({ en: "Usage", ko: "사용 예시" })}
            language="typescript"
            code={symbol.code}
          />
        </Scroll.Slide>
      ))}
      <DocsToc />
    </Scroll>
  );
});
