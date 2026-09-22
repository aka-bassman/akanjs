import { usePage } from "@apps/akan/client";
import { Code, Divider, Docs, DocsToc, panelRecipe } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";
import { Link } from "akanjs/ui";

export default page().render(() => {
  const { l } = usePage();

  return (
    <Scroll>
      <Scroll.Slide id="signal-file" title="service.signal.ts">
        <Docs.Title>service.signal.ts</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A model signal declares three classes. A service signal declares two, and the missing one is Slice — a slice is a window onto a table with pagination and an insight query behind it, and a module with no table has nothing to put in the window.",
              ko: "model signal은 class 세 개를 선언합니다. service signal은 둘이고, 빠진 하나가 Slice입니다. slice는 pagination과 insight query를 뒤에 둔, 테이블을 들여다보는 창인데, 테이블이 없는 module은 그 창에 넣을 것이 없습니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="libs/util/lib/_security/security.signal.ts"
            code={`import { endpoint, internal } from "akanjs/signal";

import * as srv from "../srv";

export class SecurityInternal extends internal(srv.security, () => ({})) {}

export class SecurityEndpoint extends endpoint(srv.security, ({ mutation }) => ({
  encrypt: mutation(String)
    .body("data", String)
    .exec(async function (data) {
      return await this.securityService.encrypt(data);
    }),
})) {}`}
          />
          <div>
            {l.trans({
              en: "The Internal class is empty and stays in the file. The Endpoint class holds one mutation, and the body of that mutation is one line — the signal decides who may call and what the arguments are, and the service decides what happens.",
              ko: "Internal class는 비어 있고 파일에 그대로 남습니다. Endpoint class는 mutation 하나를 담고, 그 mutation의 본문은 한 줄입니다. 누가 호출할 수 있고 인자가 무엇인지는 signal이 정하고, 무슨 일이 일어나는지는 service가 정합니다.",
            })}
          </div>
          <Docs.Alert type="error">
            {l.trans({
              en: (
                <span>
                  That file is missing its <code>guards</code> array, and it is not the only one in this workspace —{" "}
                  <code>localFile</code> and <code>minimal</code> are the same. An endpoint that names none runs{" "}
                  <strong>zero</strong> checks: the guard loop iterates an empty list. Encrypting arbitrary input with
                  the app's own key is an oracle, so this one wants <code>{"{ guards: [Admin] }"}</code>. Read the older
                  library signals as history, not as a pattern.
                </span>
              ),
              ko: (
                <span>
                  그 파일에는 <code>guards</code> 배열이 없고, 이 워크스페이스에서 그런 파일은 이것만이 아닙니다.{" "}
                  <code>localFile</code>과 <code>minimal</code>도 같습니다. 아무 guard도 적지 않은 endpoint는 검사를{" "}
                  <strong>하나도</strong> 하지 않습니다. guard 루프가 빈 배열을 도는 것뿐입니다. 임의의 입력을 앱의
                  key로 암호화하는 것은 oracle이므로 이 endpoint에는 <code>{"{ guards: [Admin] }"}</code>이 필요합니다.
                  오래된 라이브러리 signal은 패턴이 아니라 이력으로 읽으세요.
                </span>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide
        id="guards"
        title={l.trans({ en: "Every Endpoint Names Its Guards", ko: "모든 endpoint가 guard를 적는다" })}
      >
        <Docs.Title>
          {l.trans({ en: "Every Endpoint Names Its Guards", ko: "모든 endpoint가 guard를 적는다" })}
        </Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A model module has a slice, and a slice carries a guards map that the generated CRUD endpoints inherit. A service module has neither, so there is no default to fall back on and no file to look in: every endpoint names its own array, beside itself.",
              ko: "model module에는 slice가 있고, slice는 생성된 CRUD endpoint가 물려받는 guards map을 들고 있습니다. service module에는 둘 다 없습니다. 기댈 기본값도, 찾아볼 파일도 없습니다. 모든 endpoint가 자기 배열을 자기 옆에 적습니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/akan/lib/_doc/doc.signal.ts"
            code={`import { Int } from "akanjs/base";
import { endpoint, internal, Public } from "akanjs/signal";

import * as cnst from "../cnst";
import { Err } from "../dict";
import * as srv from "../srv";

export class DocInternal extends internal(srv.doc, () => ({})) {}

/**
 * The framework's own documentation, served to agents.
 *
 * \`[Public]\` on every one of these is the decision, not an omission: the corpus is the same markdown the site
 * already serves anonymously under \`/llms/pages\`, so a guard here would protect nothing while making the tools
 * unusable to the agents they exist for.
 */
export class DocEndpoint extends endpoint(srv.doc, ({ query }) => ({
  listDocPages: query([cnst.DocPage], { guards: [Public] })
    .search("section", cnst.DocSection)
    .exec(async function (section) {
      return await this.docService.listPages(section);
    }),

  readDocPage: query(String, { guards: [Public] })
    .param("href", String, { example: "/references/akanjs/signal" })
    .exec(async function (href) {
      // An href that names nothing is the caller's own mistake, and an agent that gets it wrong needs to be told
      // so rather than handed an empty page it would go on to summarize.
      const body = await this.docService.readPage(href);
      if (!body) throw new Err("doc.error.docPageNotFound");
      return body;
    }),
})) {}`}
          />
          <div>
            {l.trans({
              en: "[Public] is a decision here, written down as one. The class comment says what would be true if the guard were tighter, which is the one kind of comment this codebase asks for: an obvious alternative was rejected, and here is why.",
              ko: "여기서 [Public]은 결정이고, 결정으로서 적혀 있습니다. class 주석은 guard가 더 좁았다면 무엇이 참이 되었을지를 말합니다. 이 코드베이스가 요구하는 유일한 종류의 주석입니다. 그럴듯한 대안을 버렸고, 그 이유가 여기 있다는 것입니다.",
            })}
          </div>
          <Docs.Alert type="warning">
            {l.trans({
              en: (
                <span>
                  The guards are also the MCP exposure decision. An endpoint that declares a real guard is published to
                  agents; one that declares none is refused, and so is a <code>mutation</code> whose only guard is{" "}
                  <code>Public</code> — <code>[Public]</code> on a mutation is having no guard, spelled out. The boot
                  log names every refusal. Full ladder on the{" "}
                  <Link href="/cheatsheet/general/auth" className="text-primary">
                    Authorization
                  </Link>{" "}
                  cheatsheet.
                </span>
              ),
              ko: (
                <span>
                  guard는 MCP 노출 결정이기도 합니다. 실질 guard를 선언한 endpoint는 agent에게 게시되고, 아무것도
                  선언하지 않은 endpoint는 거부됩니다. guard가 <code>Public</code> 하나뿐인 <code>mutation</code>도
                  마찬가지입니다. mutation에 붙은 <code>[Public]</code>은 guard가 없다는 말을 적어 놓은 것과 같습니다.
                  모든 거부는 부팅 로그에 이름이 남습니다. 전체 사다리는{" "}
                  <Link href="/cheatsheet/general/auth" className="text-primary">
                    권한 부여
                  </Link>{" "}
                  cheatsheet에 있습니다.
                </span>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="custom-routes" title={l.trans({ en: "Routes That Are Not Ours", ko: "우리 것이 아닌 경로" })}>
        <Docs.Title>{l.trans({ en: "Routes That Are Not Ours", ko: "우리 것이 아닌 경로" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Most endpoints are reached by their generated path and never by a literal. A protocol endpoint is the exception: RFC 8414 says the metadata document lives at /.well-known/oauth-authorization-server, and a client that cannot find it there has no way to ask.",
              ko: "대부분의 endpoint는 생성된 경로로 닿고 리터럴로는 닿지 않습니다. 프로토콜 endpoint가 예외입니다. RFC 8414은 메타데이터 문서가 /.well-known/oauth-authorization-server에 있다고 말하고, 거기서 찾지 못한 클라이언트에게는 물어볼 방법이 없습니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="libs/shared/lib/_oauth/oauth.signal.ts"
            code={`// The protocol endpoints live at the origin's root, where RFC 8414 and the clients look for them, and are \`mcp: false\`
// because they are the way onto the shelf rather than anything on it. \`[Public]\` is the decision: a client holds no
// credential yet, which is what it is here to obtain.
const protocolRoute = { guards: [Public], prefix: false as const, globalPrefix: false as const, mcp: false as const };

export class OauthEndpoint extends endpoint(srv.oauth, ({ query, mutation }) => ({
  oauthAuthorizationServerMetadata: query(Any, {
    ...protocolRoute,
    path: ".well-known/oauth-authorization-server",
  }).exec(function () {
    return this.oauthService.metadata();
  }),

  // Nullable: a child reached over a unix socket learns the caller only from the gateway's headers, and a
  // deployment that lost them should register under a shared, wider bucket rather than refuse every client.
  registerOAuthClient: mutation(Any, { ...protocolRoute, path: "oauth/register" })
    .with(Req)
    .with(Ip, { nullable: true })
    .exec(async function (req, ip) {
      return await this.oauthService.register(await req.json().catch(() => null), ip);
    }),
})) {}`}
          />
          <div>
            {l.trans({
              en: "Four options do that, and a shared const is how ten endpoints avoid disagreeing about them. path names the literal route; prefix: false drops the module name Akan would otherwise put in front of it; globalPrefix: false drops the api segment; mcp: false keeps the protocol off an agent's shelf without touching who may call it.",
              ko: "옵션 네 개가 그 일을 하고, 공유 const는 endpoint 열 개가 그 옵션들에 대해 서로 다른 말을 하지 않게 하는 방법입니다. path는 리터럴 경로를 지정합니다. prefix: false는 Akan이 앞에 붙였을 module 이름을 뗍니다. globalPrefix: false는 api 구간을 뗍니다. mcp: false는 누가 호출할 수 있는지는 그대로 두고 프로토콜을 agent의 선반에서만 내립니다.",
            })}
          </div>
          <div className="my-4 space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-primary">🌐</span>
              <div>
                <strong>.with(Req)</strong>:{" "}
                {l.trans({
                  en: "the raw Request, for a handler that has to read a form body or a header Akan does not parse for it",
                  ko: "raw Request입니다. Akan이 대신 파싱해 주지 않는 form body나 header를 읽어야 하는 handler에서 씁니다",
                })}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary">📍</span>
              <div>
                <strong>.with(Ip)</strong>:{" "}
                {l.trans({
                  en: "the caller's address as a proxy recorded it. Never read it off the socket — behind a gateway every peer is 127.0.0.1",
                  ko: "proxy가 기록한 호출자의 주소입니다. socket에서 직접 읽지 마세요. gateway 뒤에서는 모든 peer가 127.0.0.1입니다",
                })}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary">🪪</span>
              <div>
                <strong>.with(Account)</strong>:{" "}
                {l.trans({
                  en: "the verified account, or null when the option says nullable. Never take the acting identity as a body value",
                  ko: "검증된 account이고, nullable을 적으면 없을 때 null입니다. 행위자를 body 값으로 받지 마세요",
                })}
              </div>
            </div>
          </div>
          <div>
            {l.trans({
              en: "A Response returned from exec is sent as it stands. That is how localFile streams a blob back with no copy and how every OAuth endpoint answers with a redirect the client is waiting for.",
              ko: "exec이 돌려준 Response는 그대로 전송됩니다. localFile이 복사 없이 blob을 흘려보내는 방법이고, 모든 OAuth endpoint가 클라이언트가 기다리는 redirect로 답하는 방법입니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="libs/util/lib/_localFile/localFile.signal.ts"
            code={`export class LocalFileEndpoint extends endpoint(srv.localFile, ({ query }) => ({
  getBlob: query(Any, { guards: [Public], path: "localFile/getBlob/*" }) // [!code ++]
    .with(Req)
    .exec(async function (req) {
      const path = req.url.split("/localFile/getBlob/").slice(1).join("/localFile/getBlob/");
      const fileStream = await this.localFileService.readLocalFile(path);
      return new Response(fileStream);
    }),
})) {}`}
          />
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="internal" title={l.trans({ en: "Work Nobody Calls", ko: "아무도 호출하지 않는 일" })}>
        <Docs.Title>{l.trans({ en: "Work Nobody Calls", ko: "아무도 호출하지 않는 일" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "internal() is for work the runtime starts: a cron expression, an interval, a queue job, something that has to happen once at boot or once at shutdown. It takes no guards option at all, and that is not an omission — the runtime is the only caller, so there is no request to authorize.",
              ko: "internal()은 runtime이 시작하는 일을 위한 것입니다. cron 표현식, interval, queue job, 부팅 때 한 번 또는 종료 때 한 번 일어나야 하는 일 같은 것입니다. guards 옵션이 아예 없고, 빠뜨린 것이 아닙니다. 호출자가 runtime뿐이라 인가할 request가 없습니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="A cron scoped to the batch worker"
            code={`export class SecurityInternal extends internal(srv.security, ({ cron }) => ({
  cleanup: cron("0 0 * * *", { serverMode: "batch" }).exec(async function () {
    await this.securityService.pruneExpiredSessions();
  }),
})) {}`}
          />
          <div>
            {l.trans({
              en: "The serverMode there has to match the one the service declares, or the job is scheduled in a process where the service it calls was never loaded. All eight service modules in this workspace still have an empty internal class, which is what an internal class looks like until the first scheduled job arrives.",
              ko: "여기의 serverMode는 service가 선언한 것과 같아야 합니다. 그렇지 않으면 호출할 service가 적재되지 않은 프로세스에 job이 예약됩니다. 이 워크스페이스의 service module 여덟 개 모두 아직 internal class가 비어 있습니다. 첫 예약 job이 생기기 전까지 internal class의 모습입니다.",
            })}
          </div>
          <div className={panelRecipe({ radius: "lg" }, "my-4")}>
            <div className="mb-2 font-semibold text-primary">
              {l.trans({ en: "Builders internal() offers:", ko: "internal()이 제공하는 builder:" })}
            </div>
            <ul className="list-disc space-y-1 pl-5 text-foreground/70 text-sm">
              <li>
                {l.trans({
                  en: "cron(expression) and interval(ms) — recurring work, locked by default so two replicas do not both run it.",
                  ko: "cron(expression)과 interval(ms) — 반복 작업이며 기본으로 잠깁니다. replica 둘이 함께 돌지 않습니다.",
                })}
              </li>
              <li>
                {l.trans({
                  en: "initialize() and destroy() — once when the process starts, once when it stops.",
                  ko: "initialize()와 destroy() — 프로세스가 시작할 때 한 번, 멈출 때 한 번입니다.",
                })}
              </li>
              <li>
                {l.trans({
                  en: "process(Return).msg(...) — a background queue job, with msg naming the payload.",
                  ko: "process(Return).msg(...) — background queue job이며 msg가 payload에 이름을 붙입니다.",
                })}
              </li>
              <li>
                {l.trans({
                  en: "resolveField(Return) — a model module's viewer-specific field. A service module has no model, so it has no use for this one.",
                  ko: "resolveField(Return) — model module에서 조회자마다 달라지는 field입니다. service module에는 model이 없으니 쓸 일이 없습니다.",
                })}
              </li>
            </ul>
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="realtime" title={l.trans({ en: "Realtime Without A Model", ko: "Model 없는 실시간" })}>
        <Docs.Title>{l.trans({ en: "Realtime Without A Model", ko: "Model 없는 실시간" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "pubsub and message need no table either. A pubsub declares a room and a payload, a message handles one frame a client sends, and a service publishes into the room through its own injected signal.",
              ko: "pubsub과 message에도 테이블은 필요 없습니다. pubsub은 room과 payload를 선언하고, message는 클라이언트가 보낸 frame 하나를 처리하며, service는 주입받은 자기 signal을 통해 그 room으로 발행합니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/minimal/lib/_minimal/minimal.signal.ts"
            code={`export class MinimalEndpoint extends endpoint(srv.minimal, ({ query, message, pubsub }) => ({
  benchFanout: pubsub(Any)
    .room("roomId", String)
    .exec(() => undefined),
  benchPublish: message(Boolean)
    .msg("roomId", String)
    .msg("seq", Int)
    .msg("sentAt", Int)
    .exec(async function (roomId, seq, sentAt) {
      return await this.minimalService.publishBenchFanout(roomId, seq, sentAt);
    }),
})) {}`}
          />
          <Code.Snippet
            className="w-full"
            title="apps/minimal/lib/_minimal/minimal.service.ts"
            code={`export class MinimalService extends serve("minimal" as const, { serverMode: "batch" }, ({ signal }) => ({
  minimalSignal: signal<sig.Minimal>(),
})) {
  async publishBenchFanout(roomId: string, seq: number, sentAt: number) {
    await this.minimalSignal.benchFanout(roomId, { seq, sentAt });
    return true;
  }
}`}
          />
          <Docs.Alert type="warning">
            {l.trans({
              en: (
                <span>
                  Both of those are unguarded, and that is a benchmark app rather than an example. A <code>pubsub</code>{" "}
                  or <code>message</code> endpoint is never covered by anything above it — there is no slice default
                  even in a model module — so it is open until it declares <code>guards</code> of its own, and a room's
                  guards are re-run whenever the socket's credential changes. Declare <code>pubsub(Binary)</code> rather
                  than <code>Any</code> when the payload is bytes: the frame skips the JSON envelope, and a declared{" "}
                  <code>Binary</code> room coalesces under backpressure.
                </span>
              ),
              ko: (
                <span>
                  둘 다 guard가 없고, 그것은 벤치마크 앱이지 예시가 아닙니다. <code>pubsub</code>과 <code>message</code>{" "}
                  endpoint는 위쪽의 무엇으로도 덮이지 않습니다. model module에서도 slice 기본값이 닿지 않습니다. 자기{" "}
                  <code>guards</code>를 선언하기 전까지 열려 있고, room의 guard는 socket의 credential이 바뀔 때마다 다시
                  실행됩니다. payload가 바이트라면 <code>Any</code>가 아니라 <code>pubsub(Binary)</code>로 선언하세요.
                  frame이 JSON 봉투를 건너뛰고, 선언된 <code>Binary</code> room은 backpressure에서 최신 frame만
                  남깁니다.
                </span>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <DocsToc />
    </Scroll>
  );
});
