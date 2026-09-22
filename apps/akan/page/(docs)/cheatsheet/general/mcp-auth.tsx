import { usePage } from "@apps/akan/client";
import { Code, Divider, Docs, DocsList, DocsToc, panelRecipe } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";
import { Link } from "akanjs/ui";

export default page().render(() => {
  const { l } = usePage();

  return (
    <Scroll>
      <Scroll.Slide id="overview" title={l.trans({ en: "The Agent Has No Cookie", ko: "에이전트에게는 쿠키가 없다" })}>
        <Docs.Title>{l.trans({ en: "The Agent Has No Cookie", ko: "에이전트에게는 쿠키가 없다" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "You mounted /mcp, signed in to your own app in the browser, and pointed Claude Code at the URL. Every call comes back 401. The browser is signed in because it holds a session cookie, and the CLI has neither a browser nor that cookie — and /mcp deletes the cookie header before anything reads it anyway.",
              ko: "/mcp를 붙이고 브라우저로 내 앱에 로그인한 다음 Claude Code에 그 URL을 물렸습니다. 호출마다 401이 돌아옵니다. 브라우저가 로그인 상태인 것은 세션 쿠키를 들고 있기 때문이고, CLI에는 브라우저도 그 쿠키도 없습니다. 게다가 /mcp는 무엇이 읽기 전에 cookie 헤더를 지워 버립니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "So the agent needs a token, and there is no sign-in form that hands one out. An app that mounts libs/shared already serves the thing that does: the OAuth 2.1 authorization server sits beside /mcp, in the same process, and names itself as the issuer. Two roles, one deployment — /mcp is the resource server that spends tokens, and the app is the authorization server that mints them.",
              ko: "그래서 agent에게는 토큰이 필요한데, 그 토큰을 내어 주는 로그인 폼은 없습니다. libs/shared를 마운트한 앱은 그 역할을 하는 것을 이미 제공하고 있습니다. OAuth 2.1 인가 서버가 같은 프로세스 안에서 /mcp 옆에 서 있고, 자기 자신을 issuer로 이름 붙입니다. 배포는 하나인데 역할은 둘입니다. /mcp는 토큰을 쓰는 resource server이고, 앱 자신이 토큰을 발행하는 authorization server입니다.",
            })}
          </div>
          <Docs.Mermaid
            title={l.trans({ en: "One handshake, start to finish", ko: "핸드셰이크 전체" })}
            chart={`sequenceDiagram
  participant Client as MCP client
  participant Browser
  participant App as Your app
  Client->>App: POST /mcp with no token
  App-->>Client: 401 WWW-Authenticate resource_metadata
  Client->>App: GET /.well-known/oauth-protected-resource/mcp
  App-->>Client: authorization_servers names this same app
  Client->>App: GET /.well-known/oauth-authorization-server
  Client->>App: POST /oauth/register
  App-->>Client: client_id
  Client->>Browser: open /oauth/authorize with code_challenge
  Browser->>App: GET /oauth/authorize
  App-->>Browser: 302 to the sign-in page, then to consent
  Browser->>App: POST approveOAuthConsent
  App-->>Browser: 302 to redirect_uri with code and iss
  Browser-->>Client: code on the loopback redirect
  Client->>App: POST /oauth/token with code_verifier
  App-->>Client: access token and refresh token
  Client->>App: POST /mcp with Bearer
  App-->>Client: tools/list`}
          />
          <div>
            {l.trans({
              en: "Nothing in that diagram is yours to write. What is yours is deciding which clients may start it, where the consent page lives, and how a grant is cut off — and one secret, without which every token in it is forgeable.",
              ko: "이 그림에서 직접 작성할 것은 하나도 없습니다. 직접 정하는 것은 어떤 client가 이 흐름을 시작할 수 있는지, 동의 페이지가 어디에 있는지, 권한을 어떻게 끊는지입니다. 그리고 시크릿 하나가 더 있는데, 그것이 없으면 이 흐름의 모든 토큰을 위조할 수 있습니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="endpoints" title={l.trans({ en: "What The App Serves", ko: "앱이 제공하는 것" })}>
        <Docs.Title>{l.trans({ en: "What The App Serves", ko: "앱이 제공하는 것" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "The protocol endpoints are ordinary signal endpoints in libs/shared, declared with three options that take them out of the usual routing: no service prefix, no global API prefix, and no MCP exposure. They land at the origin's root, which is where RFC 8414 and every MCP client look for them.",
              ko: "프로토콜 endpoint들은 libs/shared 안의 평범한 signal endpoint이며, 평소의 라우팅에서 빠져나오는 세 가지 옵션을 답니다. service prefix 없음, 전역 API prefix 없음, MCP 노출 없음입니다. 그래서 origin 루트에 놓이고, RFC 8414과 모든 MCP client가 찾는 자리가 바로 거기입니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="libs/shared/lib/_oauth/oauth.signal.ts"
            code={`import { Any } from "akanjs/base";
import { endpoint, Public, Req } from "akanjs/signal";

import * as srv from "../srv";

// [Public] is the decision: a client holds no credential yet, which is what it is here to obtain.
const protocolRoute = { guards: [Public], prefix: false as const, globalPrefix: false as const, mcp: false as const }; // [!code highlight]

export class OauthEndpoint extends endpoint(srv.oauth, ({ query, mutation }) => ({
  oauthAuthorizationServerMetadata: query(Any, {
    ...protocolRoute,
    path: ".well-known/oauth-authorization-server",
  }).exec(function () {
    return this.oauthService.metadata();
  }),

  exchangeOAuthToken: mutation(Any, { ...protocolRoute, path: "oauth/token" })
    .with(Req)
    .exec(async function (req) {
      return await this.oauthService.exchange(req);
    }),
})) {}`}
          />
          <div>
            {l.trans({
              en: "Six routes come with the lib, and you write none of them:",
              ko: "라이브러리와 함께 여섯 개의 라우트가 따라오며, 직접 작성하는 것은 하나도 없습니다:",
            })}
          </div>
          <Docs.IntroTable
            type={l.trans({ en: "Route", ko: "라우트" })}
            items={[
              {
                name: "/.well-known/oauth-authorization-server",
                desc: l.trans({
                  en: (
                    <span>
                      RFC 8414 metadata. Three fields are load-bearing for MCP clients:{" "}
                      <code>code_challenge_methods_supported</code> (<code>S256</code> only),{" "}
                      <code>client_id_metadata_document_supported</code>, and{" "}
                      <code>authorization_response_iss_parameter_supported</code>.
                    </span>
                  ),
                  ko: (
                    <span>
                      RFC 8414 메타데이터입니다. MCP client에게 결정적인 필드가 셋 있습니다.{" "}
                      <code>code_challenge_methods_supported</code>(<code>S256</code>만),{" "}
                      <code>client_id_metadata_document_supported</code>,{" "}
                      <code>authorization_response_iss_parameter_supported</code>.
                    </span>
                  ),
                }),
              },
              {
                name: "/oauth/authorize",
                desc: l.trans({
                  en: "Validates the client, its redirect URI and the PKCE challenge, then redirects the browser to the consent page — or to the sign-in page first, with a redirect back.",
                  ko: "client와 redirect URI, PKCE 챌린지를 검증한 뒤 브라우저를 동의 페이지로 보냅니다. 로그인하지 않았다면 로그인 페이지를 먼저 거쳐 돌아옵니다.",
                }),
              },
              {
                name: "/oauth/consent",
                desc: l.trans({
                  en: (
                    <span>
                      The consent page from <code>libs/shared/page/oauth/consent</code>. Two plain form posts and no
                      script: the cookie session authenticates it, and the page shows the redirect host — the one thing
                      that tells a real client from an impostor.
                    </span>
                  ),
                  ko: (
                    <span>
                      <code>libs/shared/page/oauth/consent</code>의 동의 페이지입니다. 스크립트 없이 form post 둘뿐이며,
                      쿠키 세션이 인증합니다. 화면에는 redirect host를 보여 주는데, 진짜 client와 사칭을 가르는 단서는
                      그것 하나입니다.
                    </span>
                  ),
                }),
              },
              {
                name: "/oauth/token",
                desc: l.trans({
                  en: "Exchanges an authorization code (sixty seconds, consumed on first use whether or not the exchange succeeded) or a refresh token for a new pair.",
                  ko: "인가 코드(60초, 교환 성공 여부와 무관하게 첫 사용에서 소진)나 refresh token을 새 토큰 쌍으로 교환합니다.",
                }),
              },
              {
                name: "/oauth/register",
                desc: l.trans({
                  en: "RFC 7591 dynamic registration, on by default and rate-limited per address. Claude Code and claude.ai register themselves here.",
                  ko: "RFC 7591 동적 등록입니다. 기본으로 켜져 있고 주소별로 요청량이 제한됩니다. Claude Code와 claude.ai가 여기서 스스로 등록합니다.",
                }),
              },
              {
                name: "/oauth/revoke",
                desc: l.trans({
                  en: "RFC 7009. The client hands a token back and the whole grant closes. Answers 200 whether or not the token was live, so it cannot double as a token oracle.",
                  ko: "RFC 7009입니다. client가 토큰을 반납하면 그 grant 전체가 닫힙니다. 토큰이 살아 있었든 아니든 200을 돌려주므로, 토큰 존재 여부를 떠보는 수단이 되지 않습니다.",
                }),
              },
            ]}
          />
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="token" title={l.trans({ en: "What The Token Is", ko: "토큰의 정체" })}>
        <Docs.Title>{l.trans({ en: "What The Token Is", ko: "토큰의 정체" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "The access token is the app's own access JWT — the same claims a browser session carries — plus three OAuth ones: iss, aud naming the MCP endpoint, and client_id. So AccountMiddleware reads self and me exactly as before, the ordinary guards judge the call unchanged, and nothing in a service or a signal has to know the caller arrived over OAuth.",
              ko: "access token은 앱 자신의 access JWT입니다. 브라우저 세션이 싣는 것과 같은 claim에 OAuth용 셋이 더해집니다. iss, MCP endpoint를 가리키는 aud, 그리고 client_id입니다. 그래서 AccountMiddleware는 self와 me를 이전과 똑같이 읽고, 평소의 guard가 그대로 판정하며, service나 signal 어느 쪽도 이 호출이 OAuth로 왔다는 사실을 알 필요가 없습니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "There is no scope. The guards are the authorization decision and a scope would be a second, weaker copy of it, so the metadata advertises none and the tokens carry none — the consent page says as much to the user. The token is minted from the live account rather than from a snapshot, so a role change reaches the next token.",
              ko: "scope는 없습니다. 권한 부여 결정은 guard가 하고 scope는 그것의 두 번째 약한 사본일 뿐이므로, 메타데이터도 토큰도 scope를 싣지 않습니다. 동의 페이지도 사용자에게 그렇게 말합니다. 토큰은 스냅샷이 아니라 살아 있는 계정에서 발행되므로, role 변경은 다음 토큰에 반영됩니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="Terminal"
            language="bash"
            code={`curl -i -X POST https://koyo.com/mcp -d '{"jsonrpc":"2.0","id":1,"method":"initialize"}'
# HTTP/1.1 401 Unauthorized
# WWW-Authenticate: Bearer resource_metadata="https://koyo.com/.well-known/oauth-protected-resource/mcp"

curl -X POST https://koyo.com/mcp -H "Authorization: Bearer <access token>" ...`}
          />
          <div>
            {l.trans({
              en: "Three properties of that exchange are worth keeping in mind:",
              ko: "이 주고받음에서 기억해 둘 성질이 셋 있습니다:",
            })}
          </div>
          <div className="my-4 space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-primary">🍪</span>
              <div>
                <strong>{l.trans({ en: "Header only", ko: "헤더만" })}</strong>:{" "}
                {l.trans({
                  en: "the cookie header is deleted before the account middleware runs. A same-site page would otherwise be able to drive tools/call on a visitor's ambient session, and this route never passes through CrossSiteGuard.",
                  ko: "cookie 헤더는 account middleware가 돌기 전에 지워집니다. 그러지 않으면 같은 사이트의 페이지가 방문자의 세션으로 tools/call을 몰 수 있고, 이 라우트는 CrossSiteGuard를 지나지 않습니다.",
                })}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary">🎯</span>
              <div>
                <strong>{l.trans({ en: "A token with no aud is refused", ko: "aud 없는 토큰은 거부" })}</strong>:{" "}
                {l.trans({
                  en: "once an issuer is named, the same issuer mints tokens for its other resources too, and one arriving here carrying no audience at all is the confused-deputy case RFC 8707 exists for.",
                  ko: "issuer가 지정된 뒤에는 같은 issuer가 다른 resource용 토큰도 발행하므로, audience가 아예 없는 토큰이 여기 도달하는 것은 RFC 8707이 막으려는 confused deputy 상황입니다.",
                })}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary">⏱️</span>
              <div>
                <strong>{l.trans({ en: "An hour, then rotate", ko: "한 시간, 그 뒤 회전" })}</strong>:{" "}
                {l.trans({
                  en: "the access token lives accessTokenSeconds — an hour by default — and the refresh token rotates on every use for thirty days.",
                  ko: "access token은 accessTokenSeconds 동안(기본 한 시간) 살고, refresh token은 30일간 쓸 때마다 회전합니다.",
                })}
              </div>
            </div>
          </div>
          <Docs.Alert type="error">
            {l.trans({
              en: (
                <span>
                  Set <code>JWT_SECRET</code> outside <code>local</code>. With neither it nor{" "}
                  <code>security.jwtSecret</code> configured, the secret is derived from the app name, the environment
                  and the repo name — three strings anyone can read off a URL — so every token above becomes forgeable,
                  admin sessions included. Boot refuses rather than warns: a warning is read after the leak.
                </span>
              ),
              ko: (
                <span>
                  <code>local</code> 밖에서는 <code>JWT_SECRET</code>을 설정해야 합니다. 이것도{" "}
                  <code>security.jwtSecret</code>도 없으면 시크릿은 앱 이름, 환경, 레포 이름에서 파생됩니다. URL만 봐도
                  알 수 있는 문자열 셋이므로, 위의 모든 토큰이 위조 가능해지고 admin 세션도 예외가 아닙니다. 경고가
                  아니라 부팅 자체를 거부합니다. 경고는 유출된 뒤에 읽히기 때문입니다.
                </span>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="clients" title={l.trans({ en: "How A Client Becomes Known", ko: "Client가 알려지는 경로" })}>
        <Docs.Title>{l.trans({ en: "How A Client Becomes Known", ko: "Client가 알려지는 경로" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Before anything is authorized the server has to recognise the client_id, and there are three ways it can. They are tried in that order, and a client that matches none is answered with a page rather than a redirect — nothing may be sent to an unverified destination.",
              ko: "무엇을 허가하기 전에 서버는 client_id를 알아봐야 하고, 그 경로가 셋 있습니다. 아래 순서로 시도되며, 어디에도 걸리지 않는 client에게는 redirect가 아니라 페이지로 답합니다. 검증되지 않은 목적지로는 아무것도 보내지 않습니다.",
            })}
          </div>
          <div className="my-4 space-y-3">
            <div className={panelRecipe({ radius: "lg", padding: "sm" })}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-primary">📌</span>
                <strong className="text-primary">static</strong>
              </div>
              <div className="text-foreground/70 text-sm">
                {l.trans({
                  en: "A client you listed yourself in oauth.clients. Give it a clientSecret to make it confidential — plaintext in configuration, hashed before it is held — or omit one for a public client.",
                  ko: "oauth.clients에 직접 적어 둔 client입니다. clientSecret을 주면 confidential client가 되고(설정에는 평문, 보관 전에 해시), 생략하면 public client입니다.",
                })}
              </div>
            </div>
            <div className={panelRecipe({ radius: "lg", padding: "sm" })}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-primary">📝</span>
                <strong className="text-primary">dynamic</strong>
              </div>
              <div className="text-foreground/70 text-sm">
                {l.trans({
                  en: "A client that registered itself over RFC 7591. Registration is open and rate-limited per address, and the record it creates lives ninety days. This is how Claude Code and claude.ai arrive.",
                  ko: "RFC 7591로 스스로 등록한 client입니다. 등록은 열려 있고 주소별로 제한되며, 만들어진 기록은 90일간 유지됩니다. Claude Code와 claude.ai가 오는 경로입니다.",
                })}
              </div>
            </div>
            <div className={panelRecipe({ radius: "lg", padding: "sm" })}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-primary">🌐</span>
                <strong className="text-primary">metadataDocument</strong>
              </div>
              <div className="text-foreground/70 text-sm">
                {l.trans({
                  en: "A client_id that is an HTTPS URL hosting the client's own registration. The host is resolved before the document is fetched and one pointing into a private range is refused, so the server cannot be aimed at its own network.",
                  ko: "client_id 자체가 HTTPS URL이고 그 자리에 client의 등록 정보가 있는 경우입니다. 문서를 가져오기 전에 호스트를 먼저 resolve하고 사설 대역을 가리키면 거부하므로, 서버를 자기 네트워크로 겨눌 수 없습니다.",
                })}
              </div>
            </div>
          </div>
          <div>
            {l.trans({
              en: "Whichever way it arrived, the redirect URI is the part that decides where a code can land, and it is checked hard:",
              ko: "어느 경로로 왔든 코드가 어디로 떨어질지를 정하는 것은 redirect URI이고, 이 검사는 엄격합니다:",
            })}
          </div>
          <DocsList>
            <li>
              {l.trans({
                en: "HTTPS, or loopback HTTP — 127.0.0.1, [::1] and localhost, which RFC 8252 discourages but Claude Code uses.",
                ko: "HTTPS이거나 loopback HTTP입니다. 127.0.0.1, [::1], 그리고 RFC 8252가 권하지 않지만 Claude Code가 쓰는 localhost입니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "The match is exact, except that a loopback redirect may vary its port: a native client binds whichever port is free at the time, and Claude Code picks a new one per session.",
                ko: "일치는 정확히 같아야 하지만, loopback redirect만은 포트가 달라도 됩니다. 네이티브 client는 그때 비어 있는 포트를 잡고, Claude Code는 세션마다 새로 고릅니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "A private-use scheme is admitted only when allowedRedirectSchemes names it. It defaults to cursor, because Cursor's desktop client registers cursor://…/oauth/callback and a server that refuses it cannot be used from Cursor at all.",
                ko: "private-use scheme은 allowedRedirectSchemes에 적힌 것만 허용합니다. 기본값이 cursor인 이유는, Cursor 데스크톱 client가 cursor://…/oauth/callback으로 등록하기 때문입니다. 이것을 거부하는 서버는 Cursor에서 아예 쓸 수 없습니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "PKCE S256 is the only method, and a request that omits code_challenge_method is refused even when the challenge itself is well formed.",
                ko: "PKCE는 S256만 지원하며, challenge 자체가 멀쩡해도 code_challenge_method를 빠뜨린 요청은 거부됩니다.",
              })}
            </li>
          </DocsList>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="configure" title={l.trans({ en: "Configure It Per App", ko: "앱별 설정" })}>
        <Docs.Title>{l.trans({ en: "Configure It Per App", ko: "앱별 설정" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Everything above is configured in one place — an oauth key on the app's server env, beside the other module options. Leave it out entirely and the defaults are already a working server on the app's own domain.",
              ko: "위의 모든 것은 한 곳에서 설정합니다. 앱의 server env에 있는 oauth 키이며, 다른 모듈 옵션 옆에 놓입니다. 아예 적지 않아도 기본값만으로 앱 자신의 도메인 위에서 동작하는 서버가 됩니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/koyo/env/env.server.main.ts"
            code={`import type { ModulesOptions } from "../lib/option";
import { libEnv } from "./env.server.type";

export const env: ModulesOptions = {
  ...libEnv,
  oauth: { // [!code ++:12]
    issuer: "https://koyo.com",
    consentPath: "/oauth/consent",
    allowedRedirectSchemes: ["cursor", "koyo"],
    clients: [
      {
        clientId: "koyo-desktop",
        clientName: "Ko-yo Desktop",
        redirectUris: ["koyo://oauth/callback"],
      },
    ],
  },
};`}
          />
          <Docs.OptionTable
            items={[
              {
                key: "enabled",
                type: "boolean",
                default: "true",
                desc: l.trans({
                  en: "Off takes the authorization server and the /mcp credential requirement away together: the protocol routes answer 404 and no issuer is named, so /mcp goes back to anonymous.",
                  ko: "끄면 인가 서버와 /mcp의 credential 요구가 함께 사라집니다. 프로토콜 라우트는 404를 돌려주고 issuer도 지정되지 않으므로, /mcp는 다시 익명 접근이 됩니다.",
                }),
              },
              {
                key: "issuer",
                type: "string",
                default: l.trans({ en: "the serve domain", ko: "서비스 도메인" }),
                desc: l.trans({
                  en: "The one string an MCP client compares byte for byte, so it is fixed from configuration and never read off a request header a proxy may have rewritten. Set it for a tunnel in front of a laptop or an edge that renames the host.",
                  ko: "MCP client가 바이트 단위로 비교하는 유일한 문자열이므로, 설정에서 고정하고 프록시가 고쳤을 수 있는 요청 헤더에서는 읽지 않습니다. 노트북 앞에 터널이 있거나 edge가 호스트 이름을 바꾸는 경우에 지정합니다.",
                }),
              },
              {
                key: "resource",
                type: "string",
                default: "<issuer>/mcp",
                desc: l.trans({
                  en: "The MCP endpoint's canonical URL and every token's aud. Set it when the app moved the MCP path off /mcp.",
                  ko: "MCP endpoint의 정규 URL이자 모든 토큰의 aud입니다. MCP 경로를 /mcp에서 옮겼다면 지정합니다.",
                }),
              },
              {
                key: "consentPath",
                type: "string",
                default: "/oauth/consent",
                desc: l.trans({
                  en: "Route of the consent page, basePath included when the app has one: /office/oauth/consent. The redirect the sign-in page hands back has the basePath stripped, because the router puts it back in front.",
                  ko: "동의 페이지의 경로이며, basePath가 있는 앱은 포함해서 적습니다. /office/oauth/consent처럼입니다. 로그인 페이지에 넘기는 redirect에서는 basePath가 빠지는데, router가 앞에 다시 붙이기 때문입니다.",
                }),
              },
              {
                key: "signinPath",
                type: "string",
                default: "/signin",
                desc: l.trans({
                  en: "Where an anonymous browser is sent first, with ?redirect= back to the consent page. Carries the basePath the same way.",
                  ko: "로그인하지 않은 브라우저가 먼저 가는 곳이며, ?redirect=로 동의 페이지로 돌아옵니다. basePath는 같은 방식으로 포함합니다.",
                }),
              },
              {
                key: "clients",
                type: "OAuthStaticClient[]",
                default: "[]",
                desc: l.trans({
                  en: "Clients you declare yourself: clientId, redirectUris, an optional clientName, and a clientSecret for a confidential one.",
                  ko: "직접 선언하는 client 목록입니다. clientId, redirectUris, 선택적인 clientName, 그리고 confidential client라면 clientSecret입니다.",
                }),
              },
              {
                key: "dynamicRegistration",
                type: "boolean",
                default: "true",
                desc: l.trans({
                  en: "RFC 7591 self-registration. Off drops registration_endpoint from the metadata and answers the route 404, which leaves only the clients you listed and the metadata-document ones.",
                  ko: "RFC 7591 자가 등록입니다. 끄면 메타데이터에서 registration_endpoint가 빠지고 라우트는 404가 되어, 직접 적은 client와 metadata document로 오는 것만 남습니다.",
                }),
              },
              {
                key: "allowedRedirectSchemes",
                type: "string[]",
                default: '["cursor"]',
                desc: l.trans({
                  en: "Private-use redirect schemes accepted besides HTTPS and loopback.",
                  ko: "HTTPS와 loopback 외에 허용할 private-use redirect scheme입니다.",
                }),
              },
              {
                key: "accessTokenSeconds",
                type: "number",
                default: "3600",
                desc: l.trans({
                  en: "Access token lifetime. Refresh tokens rotate for thirty days regardless, and this value is also how long a revoked grant's id stays denylisted.",
                  ko: "access token의 수명입니다. refresh token은 이 값과 무관하게 30일간 회전하며, 폐기된 grant의 id가 거부 목록에 남는 기간도 이 값입니다.",
                }),
              },
              {
                key: "clientIdMetadata",
                type: "{ enabled, refusePrivateAddresses }",
                default: l.trans({ en: "both true", ko: "둘 다 true" }),
                desc: l.trans({
                  en: "Client ID Metadata Documents. Turning enabled off also stops the metadata advertising the feature; refusePrivateAddresses off trusts the name alone, for a deployment whose egress policy already closes the private range.",
                  ko: "Client ID Metadata Document 설정입니다. enabled를 끄면 메타데이터에서도 이 기능을 알리지 않습니다. refusePrivateAddresses를 끄면 이름만 믿는데, egress 정책이 이미 사설 대역을 막아 둔 배포를 위한 것입니다.",
                }),
              },
            ]}
          />
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="revoke" title={l.trans({ en: "Revocation Is Whole-Grant", ko: "폐기는 Grant 통째로" })}>
        <Docs.Title>{l.trans({ en: "Revocation Is Whole-Grant", ko: "폐기는 Grant 통째로" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "There is no revoking one token. A grant is the unit — its refresh lineage and every access token minted from it — and two parties can close one: the client that holds it, and the account it acts as.",
              ko: "토큰 하나를 폐기하는 일은 없습니다. 단위는 grant이고, 거기에는 refresh 계보와 그로부터 발행된 모든 access token이 들어갑니다. 닫을 수 있는 쪽은 둘입니다. 토큰을 쥔 client와, 그 토큰이 대신하는 계정입니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="Terminal"
            language="bash"
            code={`# RFC 7009 - either token names the grant, and the grant is what closes
curl -X POST https://koyo.com/oauth/revoke \\
  -d token=<access or refresh token> \\
  -d client_id=koyo-desktop`}
          />
          <div>
            {l.trans({
              en: "From the account's side the two endpoints are ordinary fetches, guarded by Every and kept off the MCP shelf on purpose — an agent that could list and cut every other connector from inside a tool call is exactly the lever a connected-apps page exists to keep human:",
              ko: "계정 쪽에서는 평범한 fetch 두 개입니다. guard는 Every이고, 일부러 MCP 선반에는 올리지 않습니다. tool 호출 안에서 다른 연결을 전부 나열하고 끊을 수 있는 agent야말로, 연결된 앱 페이지가 사람 손에 남겨 두려는 바로 그 레버이기 때문입니다:",
            })}
          </div>
          <div className="my-4 space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-primary">📋</span>
              <div>
                <strong>fetch.listOAuthConnections()</strong>:{" "}
                {l.trans({
                  en: "the applications currently holding a grant to act as the signed-in account — one row per grant, with the client name, the user agent it connected from, and whether it is this connection. Browser sessions are not among them.",
                  ko: "지금 로그인한 계정으로 동작할 권한을 가진 애플리케이션들입니다. grant마다 한 줄이며 client 이름, 접속한 user agent, 그리고 그것이 현재 연결인지를 함께 담습니다. 브라우저 세션은 목록에 들어가지 않습니다.",
                })}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary">✂️</span>
              <div>
                <strong>fetch.revokeOAuthConnection(sessionId)</strong>:{" "}
                {l.trans({
                  en: "closes one application's grant and returns false when the id names no live grant of theirs. The account's other grants, and the browser session, are untouched.",
                  ko: "애플리케이션 하나의 grant를 닫고, 그 id가 자기 grant를 가리키지 않으면 false를 돌려줍니다. 그 계정의 다른 grant와 브라우저 세션은 그대로입니다.",
                })}
              </div>
            </div>
          </div>
          <div className={panelRecipe({ radius: "lg" }, "my-4")}>
            <div className="mb-2 font-semibold text-primary">
              {l.trans({ en: "What a revoked grant means:", ko: "폐기된 grant가 뜻하는 것:" })}
            </div>
            <ul className="list-disc space-y-1 pl-5 text-foreground/70 text-sm">
              <li>
                {l.trans({
                  en: "An access token is stateless, so it cannot be deleted. The grant's lineage id — the sid every one of its tokens carries — is denylisted for accessTokenSeconds instead, and a revoked token is refused at its next call.",
                  ko: "access token은 stateless라 삭제할 수 없습니다. 대신 grant의 계보 id, 즉 그 토큰들이 모두 싣고 있는 sid를 accessTokenSeconds 동안 거부 목록에 올립니다. 폐기된 토큰은 다음 호출에서 거절됩니다.",
                })}
              </li>
              <li>
                {l.trans({
                  en: "A refresh token reused within thirty seconds of its rotation is answered with a rotation of its own — a client that holds it twice is not a thief. Reused later, it revokes that grant's lineage and nothing else.",
                  ko: "회전 직후 30초 안에 다시 쓰인 refresh token에는 회전으로 답합니다. 같은 토큰을 두 번 들고 있는 client는 도둑이 아니기 때문입니다. 그보다 늦게 재사용되면 그 grant의 계보만 폐기되고 다른 것은 건드리지 않습니다.",
                })}
              </li>
              <li>
                {l.trans({
                  en: "A refresh token presented by a client other than the one it was issued to is refused outright.",
                  ko: "발급받은 client가 아닌 다른 client가 제시한 refresh token은 그대로 거부됩니다.",
                })}
              </li>
            </ul>
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide
        id="person"
        title={l.trans({ en: "A Person May, A Model May Not", ko: "사람은 되고 모델은 안 되는 일" })}
      >
        <Docs.Title>{l.trans({ en: "A Person May, A Model May Not", ko: "사람은 되고 모델은 안 되는 일" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Now that agents hold real tokens, some acts need a distinction the guards were never asked for: refunding an order is fine when the shop owner clicks it and not fine when a model decides to. A token this server minted names its client and the MCP resource; a browser session names neither, and a call through /mcp is marked at the door. That is the whole signal.",
              ko: "이제 agent가 진짜 토큰을 들고 있으니, guard에게 한 번도 물은 적 없는 구분이 필요한 행위가 생깁니다. 주문 환불은 사장이 직접 누르면 괜찮지만 모델이 그러기로 하면 곤란합니다. 이 서버가 발행한 토큰은 자기 client와 MCP resource를 이름으로 싣고, 브라우저 세션은 둘 다 싣지 않으며, /mcp로 들어온 호출은 문 앞에서 표시됩니다. 단서는 그것이 전부입니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/koyo/lib/icecreamOrder/icecreamOrder.signal.ts"
            code={`import { AgentCall, Every, Person, Self } from "@libs/shared/srvkit";
import { ID } from "akanjs/base";
import { endpoint } from "akanjs/signal";

import * as cnst from "../cnst";
import * as srv from "../srv";

export class IcecreamOrderEndpoint extends endpoint(srv.icecreamOrder, ({ mutation }) => ({
  refundIcecreamOrder: mutation(cnst.IcecreamOrder, { guards: [Every, Person] }) // [!code highlight]
    .param("icecreamOrderId", ID)
    .with(Self)
    .exec(async function (icecreamOrderId, self) {
      return await this.icecreamOrderService.refund(icecreamOrderId, self.id);
    }),

  serveIcecreamOrder: mutation(cnst.IcecreamOrder, { guards: [Every] })
    .param("icecreamOrderId", ID)
    .with(Self)
    .with(AgentCall) // [!code highlight]
    .exec(async function (icecreamOrderId, self, isAgentCall) {
      return await this.icecreamOrderService.serve(icecreamOrderId, self.id, { notifyCustomer: !isAgentCall });
    }),
})) {}`}
          />
          <div>
            {l.trans({
              en: "Two levers, and they answer different questions:",
              ko: "레버는 둘이고, 서로 다른 질문에 답합니다:",
            })}
          </div>
          <div className="my-4 space-y-3">
            <div className={panelRecipe({ radius: "lg", padding: "sm" })}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-primary">🙅</span>
                <strong className="text-primary">{"guards: [Every, Person]"}</strong>
              </div>
              <div className="text-foreground/70 text-sm">
                {l.trans({
                  en: "Refuses the call outright. Person also declares static agents = false, so the MCP catalogue refuses every endpoint it guards: the act is absent from the document rather than hidden per caller, and the boot log names it.",
                  ko: "호출을 아예 거부합니다. Person은 static agents = false도 선언하므로 MCP 카탈로그는 이 guard가 지키는 endpoint를 통째로 거부합니다. 호출자별로 숨기는 것이 아니라 문서에서 사라지고, 부팅 로그에 이름이 남습니다.",
                })}
              </div>
            </div>
            <div className={panelRecipe({ radius: "lg", padding: "sm" })}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-primary">🤖</span>
                <strong className="text-primary">.with(AgentCall)</strong>
              </div>
              <div className="text-foreground/70 text-sm">
                {l.trans({
                  en: "Hands the handler the same verdict as a boolean. The endpoint stays callable and stays on the shelf; what narrows is what the call sets in motion — no customer mail, no push, no irreversible side effect.",
                  ko: "같은 판정을 boolean으로 handler에 넘깁니다. endpoint는 여전히 호출할 수 있고 선반에도 남습니다. 좁아지는 것은 그 호출이 일으키는 일입니다. 고객 메일도, push도, 되돌릴 수 없는 부수 효과도 없습니다.",
                })}
              </div>
            </div>
          </div>
          <Docs.Alert type="warning">
            {l.trans({
              en: (
                <span>
                  Both read one function — <code>isAgentCall(context)</code> from <code>@libs/shared/srvkit</code>,
                  which is <code>context.origin === "mcp"</code> or a token naming a client. Never sniff{" "}
                  <code>aud</code> or <code>client_id</code> yourself through a cast: the two claims are checked
                  together, an absent one means different things on different transports, and a hand-rolled check is a
                  second answer that drifts from the one the guards give.
                </span>
              ),
              ko: (
                <span>
                  둘 다 함수 하나를 읽습니다. <code>@libs/shared/srvkit</code>의 <code>isAgentCall(context)</code>이며,{" "}
                  <code>context.origin === "mcp"</code>이거나 토큰이 client를 이름으로 싣고 있는지를 봅니다.{" "}
                  <code>aud</code>나 <code>client_id</code>를 cast로 직접 들여다보지 마세요. 두 claim은 함께 검사되고,
                  어느 하나가 없다는 사실은 transport마다 다른 뜻이며, 직접 만든 검사는 guard가 내놓는 답과 어긋나는 두
                  번째 답이 됩니다.
                </span>
              ),
            })}
          </Docs.Alert>
          <div>
            {l.trans({
              en: (
                <span>
                  What each guard publishes to an agent, and how a refusal is worded, is on{" "}
                  <Link href="/cheatsheet/general/auth" className="text-primary">
                    Authorization
                  </Link>
                  ; the catalogue, resource URIs and rate limits are on{" "}
                  <Link href="/cheatsheet/interface/mcp" className="text-primary">
                    MCP Server
                  </Link>
                  .
                </span>
              ),
              ko: (
                <span>
                  각 guard가 agent에게 무엇을 게시하는지, 거절이 어떤 문구로 나가는지는{" "}
                  <Link href="/cheatsheet/general/auth" className="text-primary">
                    권한 부여
                  </Link>
                  에 있고, 카탈로그와 resource URI, rate limit은{" "}
                  <Link href="/cheatsheet/interface/mcp" className="text-primary">
                    MCP 서버
                  </Link>
                  에 있습니다.
                </span>
              ),
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <DocsToc />
    </Scroll>
  );
});
