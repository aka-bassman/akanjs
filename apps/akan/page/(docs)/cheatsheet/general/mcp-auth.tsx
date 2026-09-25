import { usePage } from "@apps/akan/client";
import { Code, cardGridRecipe, Divider, Docs, DocsToc, panelRecipe } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();
  const bulletList = "my-4 list-disc space-y-2 pl-5";

  const roleCards = [
    {
      title: l.trans({ en: "Resource Server", ko: "리소스 서버" }),
      chip: "/mcp",
      desc: l.trans({
        en: "Spends tokens. A call without one gets a 401 that tells the client where to sign in.",
        ko: "토큰을 받아 쓰는 쪽입니다. 토큰 없는 호출에는 어디서 로그인할지 알려 주는 401로 답합니다.",
      }),
    },
    {
      title: l.trans({ en: "Authorization Server", ko: "인가 서버" }),
      chip: "/oauth/*",
      desc: l.trans({
        en: "Mints tokens. It is your own app, in the same process, and it names itself as the issuer.",
        ko: "토큰을 발행하는 쪽입니다. 같은 프로세스에서 도는 내 앱 자신이며, 스스로를 issuer로 내세웁니다.",
      }),
    },
  ];

  const termRows = [
    {
      name: l.trans({ en: "MCP client", ko: "MCP 클라이언트" }),
      desc: l.trans({
        en: "The agent program that calls `/mcp`, such as Claude Code, claude.ai or Cursor.",
        ko: "`/mcp`를 호출하는 에이전트 프로그램입니다. Claude Code, claude.ai, Cursor가 그렇습니다.",
      }),
    },
    {
      name: "issuer (iss)",
      desc: l.trans({
        en: "The authorization server's public origin. Clients compare it byte for byte.",
        ko: "인가 서버의 공개 origin입니다. 클라이언트는 이 값을 바이트 단위로 비교합니다.",
      }),
    },
    {
      name: "aud",
      desc: l.trans({
        en: "The token claim naming the resource it was issued for; here, the `/mcp` URL.",
        ko: "토큰이 어느 리소스용인지 적는 클레임입니다. 여기서는 `/mcp`의 URL입니다.",
      }),
    },
    {
      name: "grant",
      desc: l.trans({
        en: "One client's permission to act as one account: a refresh lineage and every token minted from it.",
        ko: "한 클라이언트가 한 계정으로 동작할 권한입니다. refresh 계보와 거기서 발행된 모든 토큰을 묶은 단위입니다.",
      }),
    },
    {
      name: "PKCE",
      desc: l.trans({
        en: "A one-time secret proving that whoever exchanges a code is who asked for it. S256 only.",
        ko: "코드를 교환하는 쪽이 코드를 요청한 쪽과 같다는 것을 증명하는 일회용 비밀입니다. S256만 씁니다.",
      }),
    },
    {
      name: l.trans({ en: "consent page", ko: "동의 페이지" }),
      desc: l.trans({
        en: "The screen where the signed-in user approves or denies a client.",
        ko: "로그인한 사용자가 클라이언트를 승인하거나 거절하는 화면입니다.",
      }),
    },
  ];

  const setupSteps = [
    l.trans({
      en: (
        <>
          <strong>
            Start from an app that uses <code>libs/shared</code>.
          </strong>{" "}
          The OAuth routes, and the 401 on <code>/mcp</code> that starts the flow, come with it.
        </>
      ),
      ko: (
        <>
          <strong>
            <code>libs/shared</code>를 쓰는 앱에서 시작합니다.
          </strong>{" "}
          OAuth 라우트와, 흐름을 시작하는 <code>/mcp</code>의 401이 함께 따라옵니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>Sync the consent page.</strong> It lives in <code>libs/shared/page</code>, so the app opts in with{" "}
          <code>syncPageLibs</code> in <code>akan.config.ts</code> and runs <code>akan sync</code>.
        </>
      ),
      ko: (
        <>
          <strong>동의 페이지를 동기화합니다.</strong> 이 페이지는 <code>libs/shared/page</code>에 있으므로,{" "}
          <code>akan.config.ts</code>의 <code>syncPageLibs</code>로 가져온 뒤 <code>akan sync</code>를 실행합니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>
            Set <code>JWT_SECRET</code>
          </strong>{" "}
          in every deployment outside <code>local</code>.
        </>
      ),
      ko: (
        <>
          <code>local</code> 밖의 모든 배포에{" "}
          <strong>
            <code>JWT_SECRET</code>을 설정합니다.
          </strong>
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>
            Add an <code>oauth</code> key only where a default is wrong:
          </strong>{" "}
          which clients may start the flow, or where the consent page lives.
        </>
      ),
      ko: (
        <>
          <strong>
            기본값이 맞지 않을 때만 <code>oauth</code> 키를 추가합니다.
          </strong>{" "}
          어떤 클라이언트가 흐름을 시작할 수 있는지, 동의 페이지가 어디 있는지 같은 것입니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>
            Point the MCP client at <code>{"https://<host>/mcp"}</code>.
          </strong>{" "}
          It registers, opens the browser for sign-in and consent, and receives a token.
        </>
      ),
      ko: (
        <>
          <strong>
            MCP 클라이언트에 <code>{"https://<host>/mcp"}</code>를 연결합니다.
          </strong>{" "}
          클라이언트가 스스로 등록하고, 브라우저를 열어 로그인과 동의를 받은 뒤 토큰을 받습니다.
        </>
      ),
    }),
  ];

  const routeRows = [
    {
      name: "/.well-known/oauth-protected-resource/mcp",
      desc: l.trans({
        en: "RFC 9728 metadata from `/mcp` itself, also served without the suffix; it names this app.",
        ko: "`/mcp`가 직접 제공하는 RFC 9728 메타데이터이며, 접미사 없는 경로로도 답합니다. 이 앱을 인가 서버로 알립니다.",
      }),
    },
    {
      name: "/.well-known/oauth-authorization-server",
      desc: l.trans({
        en: "RFC 8414 metadata: S256-only PKCE, metadata-document client ids, and the `iss` parameter.",
        ko: "RFC 8414 메타데이터입니다. S256 전용 PKCE, metadata document client id, `iss` 파라미터를 알립니다.",
      }),
    },
    {
      name: "/oauth/authorize",
      desc: l.trans({
        en: "Checks the client, redirect URI and PKCE challenge, then sends the browser to consent.",
        ko: "클라이언트, redirect URI, PKCE challenge를 검증한 뒤 브라우저를 동의 페이지로 보냅니다.",
      }),
    },
    {
      name: "/oauth/consent",
      desc: l.trans({
        en: "The consent page from `libs/shared/page/oauth/consent`, served once the app syncs it.",
        ko: "`libs/shared/page/oauth/consent`의 동의 페이지이며, 앱이 동기화해야 제공됩니다.",
      }),
    },
    {
      name: "/oauth/token",
      desc: l.trans({
        en: "Exchanges an authorization code or a refresh token for a new token pair.",
        ko: "인가 코드나 리프레시 토큰을 새 토큰 쌍으로 교환합니다.",
      }),
    },
    {
      name: "/oauth/register",
      desc: l.trans({
        en: "RFC 7591 dynamic registration, on by default; Claude Code and claude.ai register here.",
        ko: "RFC 7591 동적 등록이며 기본으로 켜져 있습니다. Claude Code와 claude.ai가 여기서 등록합니다.",
      }),
    },
    {
      name: "/oauth/revoke",
      desc: l.trans({
        en: "RFC 7009: the client hands a token back and the whole grant closes.",
        ko: "RFC 7009입니다. 클라이언트가 토큰을 반납하면 그 grant 전체가 닫힙니다.",
      }),
    },
  ];

  const protocolRouteRows = [
    {
      name: "guards: [Public]",
      desc: l.trans({
        en: "A client holds no credential yet; a credential is what it came for.",
        ko: "클라이언트는 아직 자격 증명이 없고, 바로 그것을 받으러 온 것입니다.",
      }),
    },
    {
      name: "prefix: false",
      desc: l.trans({
        en: "Drops the service prefix from the path.",
        ko: "경로에서 service prefix를 뺍니다.",
      }),
    },
    {
      name: "globalPrefix: false",
      desc: l.trans({
        en: "Drops the global API prefix too, so the route sits at the origin root.",
        ko: "전역 API prefix도 빼서 라우트가 origin 루트에 놓입니다.",
      }),
    },
    {
      name: "mcp: false",
      desc: l.trans({
        en: "Keeps it off the MCP list: these routes are the way onto the shelf, not a tool on it.",
        ko: "MCP 목록에서 뺍니다. 이 라우트는 목록에 오르는 통로이지 목록 위의 툴이 아닙니다.",
      }),
    },
  ];

  const safetyNotes = [
    l.trans({
      en: (
        <>
          <strong>The consent page shows the redirect host.</strong> It is the one thing that tells a real client from
          an impostor, and a loopback redirect adds a "runs on your computer" warning.
        </>
      ),
      ko: (
        <>
          <strong>동의 페이지는 redirect host를 보여 줍니다.</strong> 진짜 클라이언트와 사칭을 가르는 유일한 단서이고,
          루프백 redirect라면 "내 컴퓨터에서 실행되는 앱"이라는 경고가 붙습니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>A request is short-lived.</strong> An authorization request lives ten minutes and binds to the first
          signed-in account that opens it.
        </>
      ),
      ko: (
        <>
          <strong>인가 요청은 짧게 삽니다.</strong> 10분간 유효하며, 처음 연 로그인 계정에 묶입니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>A code works once.</strong> It lives sixty seconds and is consumed on first use, even by a failed
          exchange.
        </>
      ),
      ko: (
        <>
          <strong>인가 코드는 한 번만 씁니다.</strong> 60초간 유효하며, 교환이 실패해도 첫 사용에서 소진됩니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>Revoking never tells.</strong> <code>/oauth/revoke</code> answers 200 whether or not the token was
          live, so it cannot double as a token oracle.
        </>
      ),
      ko: (
        <>
          <strong>폐기 응답은 아무것도 알려 주지 않습니다.</strong> <code>/oauth/revoke</code>는 토큰이 살아 있었든
          아니든 200을 돌려주므로, 토큰이 유효한지 떠보는 수단이 되지 않습니다.
        </>
      ),
    }),
  ];

  const claimRows = [
    {
      name: ["self", "me"],
      desc: l.trans({
        en: "The same identity a browser session carries; `AccountMiddleware` reads it as before.",
        ko: "브라우저 세션과 같은 신원 정보입니다. `AccountMiddleware`가 전처럼 읽습니다.",
      }),
    },
    {
      name: "iss",
      desc: l.trans({
        en: "The issuer: your app's public origin.",
        ko: "발행자, 곧 내 앱의 공개 origin입니다.",
      }),
    },
    {
      name: "aud",
      desc: l.trans({
        en: "The MCP endpoint's URL (`oauth.resource`); `/mcp` refuses a token without one.",
        ko: "MCP 엔드포인트의 URL(`oauth.resource`)입니다. `/mcp`는 이 값이 없는 토큰을 거부합니다.",
      }),
    },
    {
      name: "client_id",
      desc: l.trans({
        en: "The client the grant was issued to.",
        ko: "grant를 발급받은 클라이언트입니다.",
      }),
    },
    {
      name: "sub",
      desc: l.trans({
        en: "`user:<id>` or `admin:<id>`, the account the token acts as.",
        ko: "`user:<id>` 또는 `admin:<id>`이며, 토큰이 대신하는 계정입니다.",
      }),
    },
    {
      name: "sid",
      desc: l.trans({
        en: "The grant's lineage id; revoking the grant denylists it.",
        ko: "grant의 계보 id입니다. grant를 폐기하면 이 값이 거부 목록에 오릅니다.",
      }),
    },
  ];

  const tokenNotes = [
    l.trans({
      en: (
        <>
          <strong>No scope.</strong> Guards already decide what a caller may do, so a scope would only be a second,
          weaker copy. Neither the metadata nor the token carries one, and the consent page says so to the user.
        </>
      ),
      ko: (
        <>
          <strong>scope는 없습니다.</strong> 호출자가 무엇을 할 수 있는지는 이미 guard가 정하므로, scope는 그보다 약한
          사본일 뿐입니다. 메타데이터도 토큰도 scope를 싣지 않고, 동의 페이지도 사용자에게 그렇게 알립니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>Minted from the live account.</strong> Not from a snapshot, so a role change reaches the next token.
        </>
      ),
      ko: (
        <>
          <strong>살아 있는 계정에서 발행합니다.</strong> 스냅샷이 아니므로 role을 바꾸면 다음 토큰에 반영됩니다.
        </>
      ),
    }),
  ];

  const checkNotes = [
    l.trans({
      en: (
        <>
          <strong>Header only.</strong> <code>/mcp</code> deletes the <code>cookie</code> header before the account
          middleware runs. Otherwise a same-site page could drive <code>tools/call</code> on a visitor's session, and
          this route never passes through <code>CrossSiteGuard</code>.
        </>
      ),
      ko: (
        <>
          <strong>헤더만 읽습니다.</strong> <code>/mcp</code>는 account middleware가 돌기 전에 <code>cookie</code>{" "}
          헤더를 지웁니다. 그러지 않으면 같은 사이트의 페이지가 방문자의 세션으로 <code>tools/call</code>을 부를 수
          있는데, 이 라우트는 <code>CrossSiteGuard</code>를 거치지 않기 때문입니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>
            No <code>aud</code>, no entry.
          </strong>{" "}
          Once an issuer is named it mints tokens for its other resources too, so a token with no audience is the
          confused-deputy case RFC 8707 exists for. A token issued for another resource is refused as well.
        </>
      ),
      ko: (
        <>
          <strong>
            <code>aud</code>가 없으면 들어오지 못합니다.
          </strong>{" "}
          issuer를 지정하면 같은 issuer가 다른 리소스용 토큰도 발행하므로, audience가 없는 토큰은 RFC 8707이 막으려는
          confused deputy 상황입니다. 다른 리소스용으로 발급된 토큰도 거부합니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>An hour, then rotate.</strong> The access token lives <code>accessTokenSeconds</code>, an hour by
          default. The refresh token rotates on every use and lasts thirty days.
        </>
      ),
      ko: (
        <>
          <strong>수명은 한 시간이고, 리프레시 토큰은 회전합니다.</strong> 액세스 토큰은 <code>accessTokenSeconds</code>{" "}
          동안(기본 한 시간) 유효합니다. 리프레시 토큰은 쓸 때마다 회전하며 30일간 유지됩니다.
        </>
      ),
    }),
  ];

  const clientRows = [
    {
      name: "static",
      desc: l.trans({
        en: "Listed by you in `oauth.clients`; a `clientSecret` makes it confidential.",
        ko: "`oauth.clients`에 직접 적은 클라이언트입니다. `clientSecret`을 주면 confidential 클라이언트가 됩니다.",
      }),
    },
    {
      name: "dynamic",
      desc: l.trans({
        en: "Registered itself at `/oauth/register` (RFC 7591), as Claude Code and claude.ai do.",
        ko: "`/oauth/register`에 스스로 등록한 클라이언트입니다(RFC 7591). Claude Code와 claude.ai가 이렇게 옵니다.",
      }),
    },
    {
      name: "metadataDocument",
      desc: l.trans({
        en: "Its `client_id` is an HTTPS URL that hosts its own registration.",
        ko: "`client_id` 자체가 등록 정보를 담은 HTTPS URL인 클라이언트입니다.",
      }),
    },
  ];

  const clientNotes = [
    l.trans({
      en: (
        <>
          <strong>Secrets are hashed.</strong> A static <code>clientSecret</code> is plaintext in configuration and
          hashed before the server holds it. Omit it for a public client.
        </>
      ),
      ko: (
        <>
          <strong>시크릿은 해시로 보관합니다.</strong> static 클라이언트의 <code>clientSecret</code>은 설정에는 평문으로
          적지만, 서버가 보관하기 전에 해시합니다. 생략하면 public 클라이언트입니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>Registration is open, but bounded.</strong> Anyone may register, 20 times an hour per address, and a
          registration is kept for 90 days.
        </>
      ),
      ko: (
        <>
          <strong>등록은 열려 있지만 제한이 있습니다.</strong> 누구나 등록할 수 있지만 주소당 시간당 20회까지이고, 등록
          정보는 90일간 유지됩니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>The server cannot be aimed inward.</strong> A metadata document's host is resolved before the fetch,
          and one pointing into a private range is refused.
        </>
      ),
      ko: (
        <>
          <strong>서버를 내부로 겨눌 수 없습니다.</strong> metadata document는 가져오기 전에 호스트를 먼저 확인하고,
          사설 대역을 가리키면 거부합니다.
        </>
      ),
    }),
  ];

  const redirectRows = [
    {
      name: "https://…",
      desc: l.trans({
        en: "Always accepted, and must match exactly.",
        ko: "항상 허용하며, 정확히 같아야 합니다.",
      }),
    },
    {
      name: ["http://127.0.0.1", "http://[::1]", "http://localhost"],
      desc: l.trans({
        en: "Loopback: always accepted, and only the port may differ.",
        ko: "루프백이라 항상 허용하며, 포트만 달라도 됩니다.",
      }),
    },
    {
      name: ["cursor://…", "<scheme>://…"],
      desc: l.trans({
        en: "Accepted only when `allowedRedirectSchemes` names the scheme, then matched exactly.",
        ko: "`allowedRedirectSchemes`에 적힌 scheme만 허용하며, 정확히 같아야 합니다.",
      }),
    },
    {
      name: "http://<other host>",
      desc: l.trans({ en: "Never accepted.", ko: "허용하지 않습니다." }),
    },
  ];

  const redirectNotes = [
    l.trans({
      en: (
        <>
          <strong>
            <code>localhost</code> counts as loopback.
          </strong>{" "}
          RFC 8252 discourages it, but Claude Code redirects there.
        </>
      ),
      ko: (
        <>
          <strong>
            <code>localhost</code>도 루프백으로 칩니다.
          </strong>{" "}
          RFC 8252는 권하지 않지만 Claude Code가 이 주소로 redirect합니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>Why the port may vary.</strong> A native client binds whichever port is free, and Claude Code picks a
          new one each session.
        </>
      ),
      ko: (
        <>
          <strong>포트가 달라도 되는 이유.</strong> 네이티브 클라이언트는 그때 비어 있는 포트를 잡고, Claude Code는
          세션마다 새 포트를 고릅니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>
            Why <code>cursor</code> is the default scheme.
          </strong>{" "}
          Cursor's desktop client registers <code>cursor://…/oauth/callback</code>, and a server that refuses it cannot
          be used from Cursor at all.
        </>
      ),
      ko: (
        <>
          <strong>
            기본 scheme이 <code>cursor</code>인 이유.
          </strong>{" "}
          Cursor 데스크톱 클라이언트는 <code>cursor://…/oauth/callback</code>으로 등록하므로, 이를 거부하는 서버는
          Cursor에서 아예 쓸 수 없습니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>No fragments.</strong> A redirect URI carrying a <code>#fragment</code> is refused at registration.
        </>
      ),
      ko: (
        <>
          <strong>fragment는 안 됩니다.</strong> <code>#fragment</code>가 붙은 redirect URI는 등록할 수 없습니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>A static client skips the scheme check.</strong> Its <code>redirectUris</code> come from your own
          config, so only the exact match applies, with the same loopback port exception.
        </>
      ),
      ko: (
        <>
          <strong>static 클라이언트는 scheme 검사를 거치지 않습니다.</strong> <code>redirectUris</code>를 내 설정에 직접
          적으므로, 정확히 같은지만 봅니다. 루프백의 포트 예외는 똑같이 적용됩니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>PKCE is S256 only.</strong> A request that omits <code>code_challenge_method</code> is refused even
          when the challenge itself is well formed.
        </>
      ),
      ko: (
        <>
          <strong>PKCE는 S256만 받습니다.</strong> challenge가 멀쩡해도 <code>code_challenge_method</code>를 빠뜨린
          요청은 거부합니다.
        </>
      ),
    }),
  ];

  const optionRows = [
    {
      key: "enabled",
      type: "boolean",
      default: "true",
      desc: l.trans({
        en: "Off removes the authorization server and `/mcp`'s credential check, so `/mcp` goes anonymous.",
        ko: "끄면 인가 서버와 `/mcp`의 자격 증명 확인이 함께 사라져 `/mcp`가 익명으로 열립니다.",
      }),
    },
    {
      key: "issuer",
      type: "string",
      default: l.trans({ en: "the app's host", ko: "앱의 호스트" }),
      desc: l.trans({
        en: "The public origin clients compare byte for byte; set it behind a tunnel or a host-renaming edge.",
        ko: "클라이언트가 바이트 단위로 비교하는 공개 origin입니다. 터널이나 호스트를 바꾸는 edge 뒤에서 지정합니다.",
      }),
    },
    {
      key: "resource",
      type: "string",
      default: "<issuer>/mcp",
      desc: l.trans({
        en: "The MCP endpoint's canonical URL and every token's `aud`; set it if MCP moved off `/mcp`.",
        ko: "MCP 엔드포인트의 정규 URL이자 모든 토큰의 `aud`입니다. MCP를 `/mcp`에서 옮겼다면 지정합니다.",
      }),
    },
    {
      key: "consentPath",
      type: "string",
      default: "/oauth/consent",
      desc: l.trans({
        en: "Route of the consent page, basePath included: `/office/oauth/consent`.",
        ko: "동의 페이지의 경로이며 basePath를 포함합니다. 예: `/office/oauth/consent`.",
      }),
    },
    {
      key: "signinPath",
      type: "string",
      default: "/signin",
      desc: l.trans({
        en: "Where an anonymous browser goes first, with `?redirect=` back to consent; basePath included.",
        ko: "로그인하지 않은 브라우저가 먼저 가는 경로이며, `?redirect=`로 동의 페이지에 돌아옵니다. basePath를 포함합니다.",
      }),
    },
    {
      key: "clients",
      type: "OAuthStaticClient[]",
      default: "[]",
      desc: l.trans({
        en: "Clients you declare yourself; the fields are listed below.",
        ko: "직접 선언하는 클라이언트 목록입니다. 필드는 아래에 있습니다.",
      }),
    },
    {
      key: "dynamicRegistration",
      type: "boolean",
      default: "true",
      desc: l.trans({
        en: "RFC 7591 self-registration; off answers 404, leaving static and metadata-document clients.",
        ko: "RFC 7591 자가 등록입니다. 끄면 404로 답하고 static과 metadata document 클라이언트만 남습니다.",
      }),
    },
    {
      key: "allowedRedirectSchemes",
      type: "string[]",
      default: '["cursor"]',
      desc: l.trans({
        en: "Private-use redirect schemes accepted besides HTTPS and loopback.",
        ko: "HTTPS와 루프백 외에 허용할 private-use redirect scheme입니다.",
      }),
    },
    {
      key: "accessTokenSeconds",
      type: "number",
      default: "3600",
      desc: l.trans({
        en: "Access token lifetime, and how long a revoked grant's id stays denylisted.",
        ko: "액세스 토큰의 수명이자, 폐기된 grant의 id가 거부 목록에 남는 기간입니다.",
      }),
    },
    {
      key: "clientIdMetadata.enabled",
      type: "boolean",
      default: "true",
      desc: l.trans({
        en: "Reads an HTTPS `client_id` as a metadata document; off also stops advertising it.",
        ko: "HTTPS `client_id`를 metadata document로 읽습니다. 끄면 메타데이터에서도 알리지 않습니다.",
      }),
    },
    {
      key: "clientIdMetadata.refusePrivateAddresses",
      type: "boolean",
      default: "true",
      desc: l.trans({
        en: "Resolves the document's host before fetching; off trusts the host name alone.",
        ko: "문서를 가져오기 전에 호스트를 확인합니다. 끄면 호스트 이름만 믿습니다.",
      }),
    },
  ];

  const configNotes = [
    l.trans({
      en: (
        <>
          <strong>The default issuer</strong> is <code>{"http://localhost:<port>"}</code> in <code>local</code>, and{" "}
          <code>{"https://<host>"}</code> elsewhere, where the host is <code>HOST_NAME</code>, then{" "}
          <code>hostname</code>, then <code>{"<app>-<environment>.<serveDomain>"}</code>.
        </>
      ),
      ko: (
        <>
          <strong>기본 issuer는</strong> <code>local</code>에서 <code>{"http://localhost:<port>"}</code>, 그 밖에서는{" "}
          <code>{"https://<host>"}</code>입니다. host는 <code>HOST_NAME</code>, <code>hostname</code>,{" "}
          <code>{"<app>-<environment>.<serveDomain>"}</code> 순서로 정해집니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>Paths carry the basePath.</strong> An app served under <code>/office</code> writes{" "}
          <code>/office/oauth/consent</code> and <code>/office/signin</code>.
        </>
      ),
      ko: (
        <>
          <strong>경로에는 basePath가 붙습니다.</strong> <code>/office</code> 아래에서 도는 앱은{" "}
          <code>/office/oauth/consent</code>, <code>/office/signin</code>으로 적습니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>
            <code>koyo://</code> above needs no <code>allowedRedirectSchemes</code> entry.
          </strong>{" "}
          A static client's <code>redirectUris</code> skip the scheme check; the option only widens what dynamic and
          metadata-document clients may register.
        </>
      ),
      ko: (
        <>
          <strong>
            위의 <code>koyo://</code>는 <code>allowedRedirectSchemes</code>에 적지 않아도 됩니다.
          </strong>{" "}
          static 클라이언트의 <code>redirectUris</code>는 scheme 검사를 거치지 않습니다. 이 옵션은 dynamic 클라이언트와
          metadata document 클라이언트가 등록할 수 있는 범위만 넓힙니다.
        </>
      ),
    }),
  ];

  const staticClientRows = [
    {
      key: "clientId",
      type: "string",
      tags: [l.trans({ en: "required", ko: "필수" })],
      desc: l.trans({
        en: "The `client_id` this client presents.",
        ko: "이 클라이언트가 내미는 `client_id`입니다.",
      }),
    },
    {
      key: "redirectUris",
      type: "string[]",
      tags: [l.trans({ en: "required", ko: "필수" })],
      desc: l.trans({
        en: "Every redirect URI it may use; a request must name one exactly, a loopback one on any port.",
        ko: "쓸 수 있는 모든 redirect URI입니다. 요청은 이 중 하나와 정확히 같아야 하며, 루프백은 포트만 달라도 됩니다.",
      }),
    },
    {
      key: "clientName",
      type: "string",
      desc: l.trans({
        en: "The name the consent page shows the user.",
        ko: "동의 페이지가 사용자에게 보여 주는 이름입니다.",
      }),
    },
    {
      key: "clientSecret",
      type: "string",
      desc: l.trans({
        en: "Makes the client confidential; omit it for a public client.",
        ko: "주면 confidential 클라이언트가 되고, 생략하면 public 클라이언트입니다.",
      }),
    },
    {
      key: "tokenEndpointAuthMethod",
      type: '"none" | "client_secret_post" | "client_secret_basic"',
      default: "client_secret_post",
      desc: l.trans({
        en: "How a confidential client sends its secret; a client without one is always `none`.",
        ko: "confidential 클라이언트가 시크릿을 보내는 방식입니다. 시크릿이 없으면 항상 `none`입니다.",
      }),
    },
  ];

  const connectionRows = [
    {
      name: (
        <>
          fetch.listOAuthConnections
          <wbr />
          ()
        </>
      ),
      desc: l.trans({
        en: "Lists the applications holding a grant for the signed-in account, one row per grant.",
        ko: "로그인한 계정에 대해 grant를 가진 애플리케이션을 grant마다 한 줄씩 나열합니다.",
      }),
    },
    {
      name: (
        <>
          fetch.revokeOAuthConnection
          <wbr />
          (sessionId)
        </>
      ),
      desc: l.trans({
        en: "Closes one application's grant; `false` when the id names no live grant of this account.",
        ko: "애플리케이션 하나의 grant를 닫습니다. id가 이 계정의 살아 있는 grant가 아니면 `false`입니다.",
      }),
    },
  ];

  const connectionNotes = [
    l.trans({
      en: (
        <>
          <strong>Each row</strong> carries the client name, the user agent it connected from, when it started and
          expires, and <code>isCurrent</code> for the connection making the call. Browser sessions are not listed.
        </>
      ),
      ko: (
        <>
          <strong>각 줄에는</strong> 클라이언트 이름, 접속한 user agent, 시작과 만료 시각, 그리고 지금 호출한 연결인지를
          뜻하는 <code>isCurrent</code>가 담깁니다. 브라우저 세션은 목록에 없습니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>Nothing else is touched.</strong> Revoking one grant leaves the account's other grants and its browser
          session alone.
        </>
      ),
      ko: (
        <>
          <strong>다른 것은 건드리지 않습니다.</strong> grant 하나를 폐기해도 그 계정의 다른 grant와 브라우저 세션은
          그대로입니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>
            Guarded by <code>Every</code>, kept off MCP.
          </strong>{" "}
          Both are <code>mcp: false</code>: an agent that could list and cut every other connector from inside a tool
          call is exactly the lever a connected-apps page exists to keep human.
        </>
      ),
      ko: (
        <>
          <strong>
            guard는 <code>Every</code>이고, MCP에는 올리지 않습니다.
          </strong>{" "}
          둘 다 <code>mcp: false</code>입니다. 툴 호출 안에서 다른 연결을 모두 나열하고 끊을 수 있는 에이전트야말로,
          연결된 앱 페이지가 사람 손에 남겨 두려는 바로 그 레버이기 때문입니다.
        </>
      ),
    }),
  ];

  const revokedNotes = [
    l.trans({
      en: (
        <>
          <strong>Access tokens die at their next call.</strong> An access token is stateless and cannot be deleted, so
          the grant's lineage id, the <code>sid</code> each token carries, is denylisted for{" "}
          <code>accessTokenSeconds</code>.
        </>
      ),
      ko: (
        <>
          <strong>액세스 토큰은 다음 호출에서 거절됩니다.</strong> 액세스 토큰은 서버에 상태를 남기지 않아 지울 수
          없으므로, 대신 모든 토큰이 싣고 있는 grant의 계보 id(<code>sid</code>)를 <code>accessTokenSeconds</code> 동안
          거부 목록에 올립니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>A quick reuse is forgiven.</strong> A refresh token reused within thirty seconds of its rotation is
          answered with a rotation of its own: a client that holds it twice is not a thief.
        </>
      ),
      ko: (
        <>
          <strong>회전 직후의 재사용은 허용합니다.</strong> 회전 후 30초 안에 다시 쓰인 리프레시 토큰에는 회전으로
          답합니다. 같은 토큰을 두 번 들고 있는 클라이언트는 도둑이 아니기 때문입니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>A late reuse revokes the lineage.</strong> Reused later, it revokes that grant's lineage and nothing
          else.
        </>
      ),
      ko: (
        <>
          <strong>늦게 다시 쓰면 계보를 폐기합니다.</strong> 그보다 늦게 재사용되면 그 grant의 계보만 폐기하고 다른 것은
          건드리지 않습니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>Another client's refresh token is refused</strong> outright.
        </>
      ),
      ko: (
        <>
          <strong>다른 클라이언트에게 발급된 리프레시 토큰은</strong> 그대로 거부합니다.
        </>
      ),
    }),
  ];

  const signalNotes = [
    l.trans({
      en: (
        <>
          <strong>
            A call through <code>/mcp</code>
          </strong>{" "}
          is marked at the door: <code>context.origin</code> is <code>"mcp"</code>.
        </>
      ),
      ko: (
        <>
          <strong>
            <code>/mcp</code>로 들어온 호출은
          </strong>{" "}
          문 앞에서 표시됩니다. <code>context.origin</code>이 <code>"mcp"</code>입니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>A token this server minted</strong> names its <code>client_id</code> and the MCP resource as{" "}
          <code>aud</code>, over any transport.
        </>
      ),
      ko: (
        <>
          <strong>이 서버가 발행한 토큰은</strong> 어떤 전송 방식으로 오든 <code>client_id</code>와, MCP 리소스를
          가리키는 <code>aud</code>를 싣고 있습니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>A browser session</strong> names neither, so it reads as a person.
        </>
      ),
      ko: (
        <>
          <strong>브라우저 세션은</strong> 둘 다 싣지 않으므로 사람으로 읽힙니다.
        </>
      ),
    }),
  ];

  const leverColumns = [
    { key: "refuse", label: l.trans({ en: "Refuses", ko: "거부" }) },
    { key: "listed", label: l.trans({ en: "Listed", ko: "목록 노출" }) },
    { key: "branch", label: l.trans({ en: "Branches", ko: "분기" }) },
  ];

  const leverGroups = [
    {
      label: l.trans({ en: "What each lever does to an agent's call", ko: "에이전트 호출에 각 레버가 하는 일" }),
      rows: [
        {
          name: "guards: [Every, Person]",
          desc: l.trans({
            en: "Refuses the call, and takes the endpoint out of the MCP catalogue.",
            ko: "호출을 거부하고, endpoint를 MCP 카탈로그에서 뺍니다.",
          }),
          marks: { refuse: true, listed: false, branch: false },
        },
        {
          name: ".with(AgentCall)",
          desc: l.trans({
            en: "Hands the handler the verdict as a boolean to branch on.",
            ko: "같은 판정을 boolean으로 handler에 넘겨 분기하게 합니다.",
          }),
          marks: { refuse: false, listed: true, branch: true },
        },
      ],
    },
  ];

  const leverNotes = [
    l.trans({
      en: (
        <>
          <strong>
            <code>Person</code> makes the act absent, not hidden.
          </strong>{" "}
          It declares <code>static agents = false</code>, so the MCP catalogue refuses every endpoint it guards instead
          of hiding it per caller.
        </>
      ),
      ko: (
        <>
          <strong>
            <code>Person</code>은 숨기는 것이 아니라 없앱니다.
          </strong>{" "}
          <code>static agents = false</code>를 선언하므로, MCP 카탈로그는 이 guard가 지키는 endpoint를 호출자별로 숨기지
          않고 통째로 거부합니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>
            <code>AgentCall</code> narrows the side effects, not the endpoint.
          </strong>{" "}
          The endpoint stays callable and listed; what changes is what the call sets in motion: no customer mail, no
          push, no irreversible side effect.
        </>
      ),
      ko: (
        <>
          <strong>
            <code>AgentCall</code>은 endpoint가 아니라 부수 효과를 좁힙니다.
          </strong>{" "}
          endpoint는 그대로 호출할 수 있고 목록에도 남습니다. 달라지는 것은 그 호출이 일으키는 일로, 고객 메일도 push도
          되돌릴 수 없는 부수 효과도 없습니다.
        </>
      ),
    }),
  ];

  return (
    <Scroll>
      <Scroll.Slide
        id="overview"
        title={l.trans({ en: "The Agent Has No Cookie", ko: "에이전트에게는 쿠키가 없습니다" })}
      >
        <Docs.Title>{l.trans({ en: "The Agent Has No Cookie", ko: "에이전트에게는 쿠키가 없습니다" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  You pointed Claude Code at your app's <code>/mcp</code>, and every call comes back 401. Your browser
                  is signed in with a session cookie; a CLI agent has neither a browser nor that cookie, and{" "}
                  <code>/mcp</code> deletes the <code>cookie</code> header anyway.
                </span>
              ),
              ko: (
                <span>
                  Claude Code에 내 앱의 <code>/mcp</code>를 연결했더니 호출마다 401이 돌아옵니다. 브라우저는 세션 쿠키로
                  로그인돼 있지만, CLI 에이전트에게는 브라우저도 그 쿠키도 없습니다. 게다가 <code>/mcp</code>는{" "}
                  <code>cookie</code> 헤더를 아예 지웁니다.
                </span>
              ),
            })}
          </div>
          <div>
            {l.trans({
              en: (
                <span>
                  So the agent needs a token, and no sign-in form hands one out. An app that uses{" "}
                  <code>libs/shared</code> already serves an OAuth 2.1 server that issues one, in the same process as{" "}
                  <code>/mcp</code>. One deployment plays two roles:
                </span>
              ),
              ko: (
                <span>
                  그래서 에이전트에게는 토큰이 필요한데, 토큰을 내어 주는 로그인 폼은 없습니다. <code>libs/shared</code>
                  를 쓰는 앱은 토큰을 발행하는 OAuth 2.1 서버를 <code>/mcp</code>와 같은 프로세스에서 이미 제공합니다.
                  배포는 하나, 역할은 둘입니다:
                </span>
              ),
            })}
          </div>
          <div className={cardGridRecipe({ cols: "mdTwo" }, "my-4")}>
            {roleCards.map(({ title, chip, desc }) => (
              <div key={chip} className={panelRecipe({ radius: "lg", padding: "sm" }, "min-w-0")}>
                <div className="mb-1 font-semibold text-primary">{title}</div>
                <div className="text-foreground/70 text-sm">{desc}</div>
                <code className="mt-2 block overflow-x-auto whitespace-nowrap rounded-md bg-muted/60 px-2.5 py-1.5 font-mono text-xs">
                  {chip}
                </code>
              </div>
            ))}
          </div>

          <Docs.SubSubTitle>{l.trans({ en: "Words used on this page", ko: "이 페이지에서 쓰는 말" })}</Docs.SubSubTitle>
          <Docs.IntroTable type={l.trans({ en: "Term", ko: "용어" })} items={termRows} />

          <Docs.SubSubTitle>{l.trans({ en: "What is yours to do", ko: "직접 할 일" })}</Docs.SubSubTitle>
          <div>
            {l.trans({
              en: "Your part is small: which clients may start the flow, where the consent page lives, and one secret. In order:",
              ko: "직접 할 일은 많지 않습니다. 어떤 클라이언트가 흐름을 시작할 수 있는지, 동의 페이지가 어디 있는지, 그리고 시크릿 하나입니다. 순서는 다음과 같습니다:",
            })}
          </div>
          <ol className="my-4 list-decimal space-y-2 pl-5">
            {setupSteps.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ol>
          <div>
            {l.trans({
              en: "Step 2 is one line in the app's config:",
              ko: "2단계는 앱 설정의 한 줄입니다:",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/koyo/akan.config.ts"
            code={`import type { AppConfig } from "akanjs";

const config: AppConfig = {
  syncPageLibs: ["shared"], // [!code highlight]
};

export default config;`}
          />
          <div>
            {l.trans({
              en: (
                <span>
                  Cutting a grant off later is covered in <strong>Revocation Is Whole-Grant</strong> below.
                </span>
              ),
              ko: (
                <span>
                  나중에 grant를 끊는 방법은 아래 <strong>폐기는 grant 단위로</strong>에서 다룹니다.
                </span>
              ),
            })}
          </div>

          <Docs.SubSubTitle>{l.trans({ en: "The whole handshake", ko: "핸드셰이크 전체" })}</Docs.SubSubTitle>
          <div>
            {l.trans({
              en: "Once step 5 connects the client, it and your app run every step below on their own. You write none of it.",
              ko: "5단계에서 클라이언트를 연결하면, 아래 단계는 모두 MCP 클라이언트와 앱이 알아서 진행합니다. 직접 작성할 것은 없습니다.",
            })}
          </div>
          <Docs.Sequence
            title={l.trans({ en: "One handshake, start to finish", ko: "처음부터 끝까지, 핸드셰이크 한 번" })}
            actors={{
              client: { label: l.trans({ en: "MCP client", ko: "MCP 클라이언트" }) },
              browser: { label: l.trans({ en: "Browser", ko: "브라우저" }) },
              app: { label: l.trans({ en: "Your app", ko: "내 앱" }) },
            }}
            messages={[
              {
                from: "client",
                to: "app",
                label: l.trans({ en: "POST /mcp with no token", ko: "토큰 없이 POST /mcp" }),
              },
              { from: "app", to: "client", dashed: true, label: "401 WWW-Authenticate resource_metadata" },
              { from: "client", to: "app", label: "GET /.well-known/oauth-protected-resource/mcp" },
              {
                from: "app",
                to: "client",
                dashed: true,
                label: l.trans({
                  en: "authorization_servers names this same app",
                  ko: "authorization_servers가 이 앱 자신을 가리킵니다",
                }),
              },
              { from: "client", to: "app", label: "GET /.well-known/oauth-authorization-server" },
              { from: "client", to: "app", label: "POST /oauth/register" },
              { from: "app", to: "client", dashed: true, label: "client_id" },
              {
                from: "client",
                to: "browser",
                label: l.trans({
                  en: "open /oauth/authorize with code_challenge",
                  ko: "code_challenge와 함께 /oauth/authorize를 엽니다",
                }),
              },
              { from: "browser", to: "app", label: "GET /oauth/authorize" },
              {
                from: "app",
                to: "browser",
                dashed: true,
                label: l.trans({
                  en: "302 to the sign-in page, then to consent",
                  ko: "로그인 페이지로 302, 그다음 동의 페이지로",
                }),
              },
              { from: "browser", to: "app", label: "POST approveOAuthConsent" },
              {
                from: "app",
                to: "browser",
                dashed: true,
                label: l.trans({
                  en: "302 to redirect_uri with code and iss",
                  ko: "code와 iss를 담아 redirect_uri로 302",
                }),
              },
              {
                from: "browser",
                to: "client",
                dashed: true,
                label: l.trans({ en: "code on the loopback redirect", ko: "루프백 redirect로 code 전달" }),
              },
              {
                from: "client",
                to: "app",
                label: l.trans({
                  en: "POST /oauth/token with code_verifier",
                  ko: "code_verifier와 함께 POST /oauth/token",
                }),
              },
              {
                from: "app",
                to: "client",
                dashed: true,
                label: l.trans({ en: "access token and refresh token", ko: "액세스 토큰과 리프레시 토큰" }),
              },
              {
                from: "client",
                to: "app",
                label: l.trans({ en: "POST /mcp with Bearer", ko: "Bearer 토큰으로 POST /mcp" }),
              },
              { from: "app", to: "client", dashed: true, label: "tools/list" },
            ]}
          />
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="endpoints" title={l.trans({ en: "What The App Serves", ko: "앱이 제공하는 라우트" })}>
        <Docs.Title>{l.trans({ en: "What The App Serves", ko: "앱이 제공하는 라우트" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  These routes sit at the origin root, where RFC 8414 and every MCP client look for them. They come with{" "}
                  <code>libs/shared</code> and <code>/mcp</code>; you write none of them.
                </span>
              ),
              ko: (
                <span>
                  아래 라우트는 RFC 8414와 모든 MCP 클라이언트가 찾는 origin 루트에 놓입니다. <code>libs/shared</code>와{" "}
                  <code>/mcp</code>에 함께 들어 있어서 직접 작성할 것은 없습니다.
                </span>
              ),
            })}
          </div>
          <Docs.IntroTable type={l.trans({ en: "Route", ko: "라우트" })} items={routeRows} />

          <Docs.SubSubTitle>{l.trans({ en: "How they are declared", ko: "선언 방식" })}</Docs.SubSubTitle>
          <div>
            {l.trans({
              en: (
                <span>
                  The protocol routes are ordinary signal endpoints in <code>libs/shared/lib/_oauth</code>. Each spreads
                  the same four options:
                </span>
              ),
              ko: (
                <span>
                  프로토콜 라우트는 <code>libs/shared/lib/_oauth</code>의 평범한 signal endpoint입니다. 모두 같은 옵션
                  네 개를 펼쳐 씁니다:
                </span>
              ),
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="libs/shared/lib/_oauth/oauth.signal.ts"
            code={`import { Any } from "akanjs/base";
import { endpoint, Public, Req } from "akanjs/signal";

import * as srv from "../srv";

// [Public] is the decision: a client holds no credential yet,
// which is what it is here to obtain.
const protocolRoute = { // [!code highlight:6]
  guards: [Public],
  prefix: false as const,
  globalPrefix: false as const,
  mcp: false as const,
};

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
          <Docs.IntroTable type={l.trans({ en: "Option", ko: "옵션" })} items={protocolRouteRows} />

          <Docs.SubSubTitle>{l.trans({ en: "Safety built in", ko: "기본으로 들어 있는 안전장치" })}</Docs.SubSubTitle>
          <ul className={bulletList}>
            {safetyNotes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="token" title={l.trans({ en: "What The Token Is", ko: "토큰에 담기는 것" })}>
        <Docs.Title>{l.trans({ en: "What The Token Is", ko: "토큰에 담기는 것" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  The access token is your app's own access JWT: the claims a browser session carries, plus four OAuth
                  ones. So <code>AccountMiddleware</code> and the guards judge the call unchanged, and no service or
                  signal needs to know it came over OAuth.
                </span>
              ),
              ko: (
                <span>
                  액세스 토큰은 앱 자신의 access JWT입니다. 브라우저 세션과 같은 클레임에 OAuth용 클레임 넷이
                  더해집니다. 그래서 <code>AccountMiddleware</code>와 guard는 평소대로 판정하고, service나 signal은 이
                  호출이 OAuth로 왔다는 사실을 몰라도 됩니다.
                </span>
              ),
            })}
          </div>
          <Docs.IntroTable type={l.trans({ en: "Claim", ko: "클레임" })} items={claimRows} />
          <ul className={bulletList}>
            {tokenNotes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>

          <Docs.SubSubTitle>{l.trans({ en: "What /mcp checks", ko: "/mcp가 확인하는 것" })}</Docs.SubSubTitle>
          <div>
            {l.trans({
              en: (
                <span>
                  Without a token, <code>/mcp</code> answers 401 and points the client at its metadata. With one, the
                  token rides the <code>Authorization</code> header:
                </span>
              ),
              ko: (
                <span>
                  토큰이 없으면 <code>/mcp</code>는 401로 답하며 메타데이터 위치를 알려 줍니다. 토큰이 있으면
                  클라이언트가 <code>Authorization</code> 헤더에 실어 보냅니다:
                </span>
              ),
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="Terminal"
            language="bash"
            code={`curl -i -X POST https://koyo.com/mcp \\
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize"}'
# HTTP/1.1 401 Unauthorized
# WWW-Authenticate: Bearer
#   resource_metadata="https://koyo.com/.well-known/oauth-protected-resource/mcp"

curl -X POST https://koyo.com/mcp \\
  -H "Authorization: Bearer <access token>" ...`}
          />
          <ul className={bulletList}>
            {checkNotes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>
          <Docs.Alert type="error">
            {l.trans({
              en: (
                <span>
                  <strong>
                    <code>JWT_SECRET</code> is required outside <code>local</code>.
                  </strong>{" "}
                  Set it, or <code>security.jwtSecret</code>, in every deployment. Without either, the secret would be
                  derived from the app name, the environment and the repo name, three strings anyone can read off a URL,
                  and every token on this page would be forgeable, admin sessions included.
                </span>
              ),
              ko: (
                <span>
                  <strong>
                    <code>local</code> 밖에서는 <code>JWT_SECRET</code>이 필수입니다.
                  </strong>{" "}
                  모든 배포에 이 값이나 <code>security.jwtSecret</code>을 설정하세요. 둘 다 없으면 시크릿이 앱 이름,
                  환경, 레포 이름에서 파생됩니다. URL만 봐도 알 수 있는 문자열 셋이므로, 이 페이지의 모든 토큰을 admin
                  세션까지 위조할 수 있게 됩니다.
                </span>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide
        id="clients"
        title={l.trans({ en: "How A Client Becomes Known", ko: "클라이언트를 알아보는 방법" })}
      >
        <Docs.Title>{l.trans({ en: "How A Client Becomes Known", ko: "클라이언트를 알아보는 방법" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  Before anything is authorized, the server has to recognise the <code>client_id</code>. It tries three
                  sources in this order, and a client that matches none gets an error page instead of a redirect:
                  nothing is sent to an unverified destination.
                </span>
              ),
              ko: (
                <span>
                  무엇을 허가하기 전에 서버는 <code>client_id</code>를 알아봐야 합니다. 아래 세 출처를 순서대로
                  확인하고, 어디에도 없는 클라이언트에게는 redirect 대신 오류 페이지로 답합니다. 검증되지 않은
                  목적지로는 아무것도 보내지 않습니다.
                </span>
              ),
            })}
          </div>
          <Docs.IntroTable
            type={l.trans({ en: "Source, in the order tried", ko: "출처(확인 순서)" })}
            items={clientRows}
          />
          <ul className={bulletList}>
            {clientNotes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>

          <Docs.SubSubTitle>{l.trans({ en: "Redirect URI rules", ko: "redirect URI 규칙" })}</Docs.SubSubTitle>
          <div>
            {l.trans({
              en: "A redirect URI decides where a code can land, so it is checked hard. A dynamic or metadata-document client may register only these:",
              ko: "코드가 어디로 떨어질지는 redirect URI가 정하므로 검사가 엄격합니다. dynamic 클라이언트와 metadata document 클라이언트는 아래 URI만 등록할 수 있습니다:",
            })}
          </div>
          <Docs.IntroTable type={l.trans({ en: "Redirect URI", ko: "redirect URI" })} items={redirectRows} />
          <ul className={bulletList}>
            {redirectNotes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="configure" title={l.trans({ en: "Configure It Per App", ko: "앱별 설정" })}>
        <Docs.Title>{l.trans({ en: "Configure It Per App", ko: "앱별 설정" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  Everything lives under one <code>oauth</code> key in the app's server env, beside the other module
                  options. Leave it out, and the defaults already make a working server on the app's own domain.
                </span>
              ),
              ko: (
                <span>
                  모든 설정은 앱 server env의 <code>oauth</code> 키 하나에 다른 모듈 옵션과 나란히 둡니다. 아예 적지
                  않아도 기본값만으로 앱 자신의 도메인에서 동작하는 서버가 됩니다.
                </span>
              ),
            })}
          </div>
          <div>
            {l.trans({
              en: "An app that ships its own desktop client, with its own URL scheme, adds this:",
              ko: "자체 URL scheme을 쓰는 데스크톱 클라이언트를 따로 내놓는 앱이라면 이렇게 추가합니다:",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/koyo/env/env.server.main.ts"
            code={`import type { ModulesOptions } from "../lib/option";
import { libEnv } from "./env.server.type";

export const env: ModulesOptions = {
  ...libEnv,
  oauth: { // [!code ++:11]
    issuer: "https://koyo.com",
    consentPath: "/oauth/consent",
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
          <Docs.OptionTable items={optionRows} />
          <ul className={bulletList}>
            {configNotes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>

          <Docs.Alert type="warning">
            {l.trans({
              en: (
                <span>
                  <strong>
                    Turn <code>refusePrivateAddresses</code> off only behind an egress policy.
                  </strong>{" "}
                  Unless the network already closes the private range, a <code>client_id</code> URL can aim the server
                  at its own network.
                </span>
              ),
              ko: (
                <span>
                  <strong>
                    <code>refusePrivateAddresses</code>는 egress 정책이 있는 곳에서만 끄세요.
                  </strong>{" "}
                  네트워크가 사설 대역을 이미 막아 두지 않았다면, <code>client_id</code> URL로 서버를 자기 네트워크에
                  겨눌 수 있습니다.
                </span>
              ),
            })}
          </Docs.Alert>

          <Docs.SubSubTitle>{l.trans({ en: "A static client", ko: "직접 선언하는 클라이언트" })}</Docs.SubSubTitle>
          <div>
            {l.trans({
              en: (
                <span>
                  Each entry of <code>clients</code> is an <code>OAuthStaticClient</code>:
                </span>
              ),
              ko: (
                <span>
                  <code>clients</code>의 각 항목은 <code>OAuthStaticClient</code>입니다:
                </span>
              ),
            })}
          </div>
          <Docs.OptionTable items={staticClientRows} />
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="revoke" title={l.trans({ en: "Revocation Is Whole-Grant", ko: "폐기는 grant 단위로" })}>
        <Docs.Title>{l.trans({ en: "Revocation Is Whole-Grant", ko: "폐기는 grant 단위로" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "There is no revoking one token. The unit is the grant: its refresh lineage plus every access token minted from it. Two parties can close one: the client that holds it, and the account it acts as.",
              ko: "토큰 하나만 폐기하는 일은 없습니다. 단위는 grant, 즉 refresh 계보와 거기서 발행된 모든 액세스 토큰입니다. 닫을 수 있는 쪽은 둘입니다. 토큰을 쥔 클라이언트와, 그 토큰이 대신하는 계정입니다.",
            })}
          </div>

          <Docs.SubSubTitle>{l.trans({ en: "From the client", ko: "클라이언트 쪽에서" })}</Docs.SubSubTitle>
          <div>
            {l.trans({
              en: "The client hands either token back over RFC 7009, and the grant it names closes:",
              ko: "클라이언트는 RFC 7009로 둘 중 어느 토큰이든 반납하고, 그 토큰이 가리키는 grant가 닫힙니다:",
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

          <Docs.SubSubTitle>{l.trans({ en: "From the account", ko: "계정 쪽에서" })}</Docs.SubSubTitle>
          <div>
            {l.trans({
              en: "A connected-apps page needs two ordinary fetches:",
              ko: "연결된 앱 페이지에는 평범한 fetch 두 개면 됩니다:",
            })}
          </div>
          <Docs.IntroTable type={l.trans({ en: "Call", ko: "호출" })} items={connectionRows} />
          <ul className={bulletList}>
            {connectionNotes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>

          <Docs.SubSubTitle>
            {l.trans({ en: "What a revoked grant means", ko: "grant를 폐기하면 일어나는 일" })}
          </Docs.SubSubTitle>
          <ul className={bulletList}>
            {revokedNotes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>
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
              en: "Once agents hold real tokens, some acts need a distinction the guards were never asked for. Refunding an order is fine when the shop owner clicks it, and not when a model decides to.",
              ko: "에이전트가 진짜 토큰을 들게 되면, guard에게 한 번도 묻지 않았던 구분이 필요한 일이 생깁니다. 주문 환불은 사장이 직접 누르면 괜찮지만, 모델이 그러기로 하면 곤란합니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "The server tells the two apart by three facts, and that is the whole signal:",
              ko: "서버는 다음 세 가지로 둘을 구분하며, 단서는 이것이 전부입니다:",
            })}
          </div>
          <ul className={bulletList}>
            {signalNotes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>
          <div>
            {l.trans({
              en: "Two levers read that signal, and they answer different questions:",
              ko: "이 단서를 읽는 레버는 둘이고, 서로 다른 질문에 답합니다:",
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
      return await this.icecreamOrderService.serve(icecreamOrderId, self.id, {
        notifyCustomer: !isAgentCall,
      });
    }),
})) {}`}
          />
          <Docs.Matrix
            type={l.trans({ en: "Lever", ko: "레버" })}
            columns={leverColumns}
            groups={leverGroups}
            markLabel={l.trans({ en: "Yes", ko: "예" })}
            emptyLabel={l.trans({ en: "No", ko: "아니요" })}
          />
          <ul className={bulletList}>
            {leverNotes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>
          <Docs.Alert type="warning">
            {l.trans({
              en: (
                <span>
                  <strong>
                    Read the verdict through <code>isAgentCall(context)</code>.
                  </strong>{" "}
                  Both levers call it from <code>@libs/shared/srvkit</code>: <code>context.origin === "mcp"</code>, or a
                  token naming a <code>client_id</code> or an <code>aud</code>. Never sniff those claims through a cast;
                  an absent one means different things on different transports, and a hand-rolled check drifts from the
                  answer the guards give.
                </span>
              ),
              ko: (
                <span>
                  <strong>
                    판정은 <code>isAgentCall(context)</code>로 읽으세요.
                  </strong>{" "}
                  두 레버 모두 <code>@libs/shared/srvkit</code>의 이 함수를 씁니다.{" "}
                  <code>context.origin === "mcp"</code>
                  이거나, 토큰이 <code>client_id</code>나 <code>aud</code>를 싣고 있는지를 봅니다. 이 클레임을 cast로
                  직접 들여다보지 마세요. 클레임이 없다는 사실은 전송 방식마다 뜻이 다르고, 직접 만든 검사는 guard의
                  답과 어긋나게 됩니다.
                </span>
              ),
            })}
          </Docs.Alert>

          <Docs.SubSubTitle>{l.trans({ en: "Related pages", ko: "함께 볼 페이지" })}</Docs.SubSubTitle>
          <Docs.LinkGrid
            items={[
              {
                href: "/cheatsheet/general/auth",
                title: l.trans({ en: "Authorization", ko: "권한 부여" }),
                desc: l.trans({
                  en: "What each guard publishes to an agent, and how a refusal is worded.",
                  ko: "각 guard가 에이전트에게 무엇을 공개하는지, 거절 문구가 어떻게 나가는지.",
                }),
              },
              {
                href: "/cheatsheet/interface/mcp",
                title: l.trans({ en: "MCP Server", ko: "MCP 서버" }),
                desc: l.trans({
                  en: "The catalogue, resource URIs and rate limits.",
                  ko: "카탈로그, resource URI, rate limit.",
                }),
              },
            ]}
          />
        </Docs.Description>
      </Scroll.Slide>
      <DocsToc />
    </Scroll>
  );
});
