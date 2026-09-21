import { usePage } from "@apps/akan/client";
import { Code, Divider, Docs, DocsToc } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();

  return (
    <Scroll>
      <Scroll.Slide id="signal-file" title={l.trans({ en: "Signal File", ko: "Signal 파일" })}>
        <Docs.Title>{l.trans({ en: "Signal File", ko: "Signal 파일" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A service module signal file exposes the service workflow. It can define endpoint APIs for clients, internal tasks for the server, cron jobs for workers, and special routes that are not tied to a model.",
              ko: "Service module의 signal 파일은 service workflow를 외부로 노출합니다. client용 endpoint API, server용 internal task, worker용 cron job, model과 무관한 special route를 정의할 수 있습니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "The signal still points at the service module: `endpoint(srv.search, ...)` or `internal(srv.localFile, ...)`. The service method stays in service; the access shape stays in signal.",
              ko: "Signal은 여전히 `endpoint(srv.search, ...)`, `internal(srv.localFile, ...)`처럼 service module을 가리킵니다. service method는 service에, access shape은 signal에 둡니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="endpoint-query" title={l.trans({ en: "Endpoint Queries", ko: "Endpoint query" })}>
        <Docs.Title>{l.trans({ en: "Endpoint Queries", ko: "Endpoint query" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Service module endpoints can be ordinary typed queries or mutations even when there is no model CRUD. The `_search` endpoint receives params and search values, then calls `searchService`.",
              ko: "Service module endpoint는 model CRUD가 없어도 일반 typed query나 mutation이 될 수 있습니다. `_search` endpoint는 param과 search value를 받은 뒤 `searchService`를 호출합니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: (
                <span>
                  Every custom endpoint names its own <code>guards</code> array — a service module has no slice to
                  inherit a default from. The guards are also the MCP exposure decision: an endpoint that names none is
                  unauthorized and silently refused from the agent catalogue.
                </span>
              ),
              ko: (
                <span>
                  모든 custom endpoint는 자기 <code>guards</code> 배열을 적습니다. service module에는 기본값을 물려줄
                  slice가 없습니다. guard는 MCP 노출 결정이기도 해서, 아무 guard도 적지 않은 endpoint는 인가되지 않을 뿐
                  아니라 agent catalogue에서도 조용히 거부됩니다.
                </span>
              ),
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="minimal query endpoint"
          code={`export class SearchEndpoint extends endpoint(srv.search, ({ query }) => ({
  getSearchResult: query(cnst.SearchResult, { guards: [Public] })
    .param("searchIndexName", String)
    .search("searchString", String)
    .exec(async function (searchIndexName, searchString) {
      return await this.searchService.getSearchResult(searchIndexName, { searchString });
    }),
})) {}`}
        />
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="endpoint-mutation" title={l.trans({ en: "Endpoint Mutations", ko: "Endpoint mutation" })}>
        <Docs.Title>{l.trans({ en: "Endpoint Mutations", ko: "Endpoint mutation" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Use mutations for service actions that change data, create tokens, send messages, or run side effects. The endpoint should stay thin and delegate the actual work to the service.",
              ko: "data 변경, token 생성, message 전송, side effect 실행 같은 service action에는 mutation을 사용합니다. endpoint는 얇게 유지하고 실제 작업은 service에 위임합니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: (
                <span>
                  A crypto primitive is the clearest case for a narrow guard. Encrypting arbitrary input with the app's
                  own key is an oracle, so <code>encrypt</code> takes <code>Admin</code> rather than
                  <code> Public</code>; a mutation whose only guard is <code>Public</code> is refused from MCP outright.
                </span>
              ),
              ko: (
                <span>
                  crypto primitive는 좁은 guard가 가장 분명하게 필요한 경우입니다. 임의의 입력을 app의 key로 암호화하는
                  것은 oracle이므로 <code>encrypt</code>에는 <code>Public</code>이 아니라 <code>Admin</code>을 적습니다.
                  guard가 <code>Public</code> 하나뿐인 mutation은 MCP에서 아예 거부됩니다.
                </span>
              ),
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="minimal mutation endpoint"
          code={`export class SecurityEndpoint extends endpoint(srv.security, ({ mutation }) => ({
  encrypt: mutation(String, { guards: [Admin] })
    .body("data", String)
    .exec(async function (data) {
      return await this.securityService.encrypt(data);
    }),
})) {}`}
        />
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="internal-and-cron" title={l.trans({ en: "Internal And Cron", ko: "Internal과 cron" })}>
        <Docs.Title>{l.trans({ en: "Internal And Cron", ko: "Internal과 cron" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Internal signals are for server-side work that is not called directly from browser UI. Cron jobs can be scoped to a server mode, which is common for batch service modules.",
              ko: "Internal signal은 browser UI에서 직접 호출하지 않는 server-side work에 사용합니다. Cron job은 server mode에 묶을 수 있고, batch service module에서 자주 사용합니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: (
                <span>
                  An internal signal names no <code>guards</code>: the runtime is its only caller, so there is no
                  request to authorize and <code>internal()</code> takes no guards option at all.
                </span>
              ),
              ko: (
                <span>
                  Internal signal에는 <code>guards</code>를 적지 않습니다. 호출자가 runtime뿐이라 인가할 request가 없고,{" "}
                  <code>internal()</code>에는 guards option 자체가 없습니다.
                </span>
              ),
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="minimal cron"
          code={`export class SearchInternal extends internal(srv.search, ({ cron }) => ({
  refreshIndex: cron("0 * * * *", { serverMode: "batch" }).exec(async function () {
    await this.searchService.resyncSearchDocuments("story");
  }),
})) {}`}
        />
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="custom-routes" title={l.trans({ en: "Custom Routes", ko: "Custom route" })}>
        <Docs.Title>{l.trans({ en: "Custom Routes", ko: "Custom route" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A service endpoint can also expose a custom path, such as `localFile/getBlob/*`. Add `Req` or `Res` when the handler needs raw request context.",
              ko: "Service endpoint는 `localFile/getBlob/*` 같은 custom path도 노출할 수 있습니다. raw request context가 필요하면 `Req`나 `Res`를 추가합니다.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="prefixless endpoint"
          code={`export class LocalFileEndpoint extends endpoint(srv.localFile, ({ query }) => ({
  getBlob: query(Any, { guards: [Public], path: "localFile/getBlob/*" })
    .with(Req)
    .exec(async function (req) {
      return new Response(await this.localFileService.readLocalFile(req.url));
    }),
})) {}`}
        />
      </Scroll.Slide>
      <DocsToc />
    </Scroll>
  );
});
