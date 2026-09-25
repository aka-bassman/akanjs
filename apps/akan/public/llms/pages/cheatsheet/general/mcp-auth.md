# OAuth For Agents

- Source: /cheatsheet/general/mcp-auth
- Mirror: /llms/pages/cheatsheet/general/mcp-auth.md
- Section: cheatsheet
- Category: General
- Priority: P2

## Headings

- The Agent Has No Cookie (#overview)
- What The App Serves (#endpoints)
- What The Token Is (#token)
- How A Client Becomes Known (#clients)
- Configure It Per App (#configure)
- Revocation Is Whole-Grant (#revoke)
- A Person May, A Model May Not (#person)

## Content

OAuth For Agents

Resource Server

Spends tokens. A call without one gets a 401 that tells the client where to sign in.

Authorization Server

Mints tokens. It is your own app, in the same process, and it names itself as the issuer.

MCP client

The agent program that calls `/mcp`, such as Claude Code, claude.ai or Cursor.

The authorization server's public origin. Clients compare it byte for byte.

The token claim naming the resource it was issued for; here, the `/mcp` URL.

One client's permission to act as one account: a refresh lineage and every token minted from it.

A one-time secret proving that whoever exchanges a code is who asked for it. S256 only.

consent page

The screen where the signed-in user approves or denies a client.

RFC 9728 metadata from `/mcp` itself, also served without the suffix; it names this app.

RFC 8414 metadata: S256-only PKCE, metadata-document client ids, and the `iss` parameter.

Checks the client, redirect URI and PKCE challenge, then sends the browser to consent.

The consent page from `libs/shared/page/oauth/consent`, served once the app syncs it.

Exchanges an authorization code or a refresh token for a new token pair.

RFC 7591 dynamic registration, on by default; Claude Code and claude.ai register here.

RFC 7009: the client hands a token back and the whole grant closes.

A client holds no credential yet; a credential is what it came for.

Drops the service prefix from the path.

Drops the global API prefix too, so the route sits at the origin root.

Keeps it off the MCP list: these routes are the way onto the shelf, not a tool on it.

The same identity a browser session carries; `AccountMiddleware` reads it as before.

The issuer: your app's public origin.

The MCP endpoint's URL (`oauth.resource`); `/mcp` refuses a token without one.

The client the grant was issued to.

`user:<id>` or `admin:<id>`, the account the token acts as.

The grant's lineage id; revoking the grant denylists it.

Listed by you in `oauth.clients`; a `clientSecret` makes it confidential.

Registered itself at `/oauth/register` (RFC 7591), as Claude Code and claude.ai do.

Its `client_id` is an HTTPS URL that hosts its own registration.

Always accepted, and must match exactly.

Loopback: always accepted, and only the port may differ.

Accepted only when `allowedRedirectSchemes` names the scheme, then matched exactly.

Never accepted.

Off removes the authorization server and `/mcp`'s credential check, so `/mcp` goes anonymous.

the app's host

The public origin clients compare byte for byte; set it behind a tunnel or a host-renaming edge.

The MCP endpoint's canonical URL and every token's `aud`; set it if MCP moved off `/mcp`.

Route of the consent page, basePath included: `/office/oauth/consent`.

Where an anonymous browser goes first, with `?redirect=` back to consent; basePath included.

Clients you declare yourself; the fields are listed below.

RFC 7591 self-registration; off answers 404, leaving static and metadata-document clients.

Private-use redirect schemes accepted besides HTTPS and loopback.

Access token lifetime, and how long a revoked grant's id stays denylisted.

Reads an HTTPS `client_id` as a metadata document; off also stops advertising it.

Resolves the document's host before fetching; off trusts the host name alone.

required

The `client_id` this client presents.

Every redirect URI it may use; a request must name one exactly, a loopback one on any port.

The name the consent page shows the user.

Makes the client confidential; omit it for a public client.

How a confidential client sends its secret; a client without one is always `none`.

Lists the applications holding a grant for the signed-in account, one row per grant.

Closes one application's grant; `false` when the id names no live grant of this account.

Refuses

Listed

Branches

What each lever does to an agent's call

Refuses the call, and takes the endpoint out of the MCP catalogue.

Hands the handler the verdict as a boolean to branch on.

The Agent Has No Cookie

Words used on this page

Term

What is yours to do

Your part is small: which clients may start the flow, where the consent page lives, and one secret. In order:

Step 2 is one line in the app's config:

The whole handshake

Once step 5 connects the client, it and your app run every step below on their own. You write none of it.

One handshake, start to finish

Browser

Your app

POST /mcp with no token

authorization_servers names this same app

open /oauth/authorize with code_challenge

302 to the sign-in page, then to consent

302 to redirect_uri with code and iss

code on the loopback redirect

POST /oauth/token with code_verifier

access token and refresh token

POST /mcp with Bearer

What The App Serves

Route

How they are declared

Option

Safety built in

What The Token Is

Claim

What /mcp checks

How A Client Becomes Known

Source, in the order tried

Redirect URI rules

A redirect URI decides where a code can land, so it is checked hard. A dynamic or metadata-document client may register only these:

Redirect URI

Configure It Per App

An app that ships its own desktop client, with its own URL scheme, adds this:

A static client

Revocation Is Whole-Grant

There is no revoking one token. The unit is the grant: its refresh lineage plus every access token minted from it. Two parties can close one: the client that holds it, and the account it acts as.

From the client

The client hands either token back over RFC 7009, and the grant it names closes:

From the account

A connected-apps page needs two ordinary fetches:

Call

What a revoked grant means

A Person May, A Model May Not

Once agents hold real tokens, some acts need a distinction the guards were never asked for. Refunding an order is fine when the shop owner clicks it, and not when a model decides to.

The server tells the two apart by three facts, and that is the whole signal:

Two levers read that signal, and they answer different questions:

Lever

Yes

No

Related pages

Authorization

What each guard publishes to an agent, and how a refusal is worded.

MCP Server

The catalogue, resource URIs and rate limits.

## Code Examples

### apps/koyo/akan.config.ts

```ts
import type { AppConfig } from "akanjs";

const config: AppConfig = {
  syncPageLibs: ["shared"], // [!code highlight]
};

export default config;
```

### libs/shared/lib/_oauth/oauth.signal.ts

```ts
import { Any } from "akanjs/base";
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
})) {}
```

### Terminal

```bash
curl -i -X POST https://koyo.com/mcp \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize"}'
# HTTP/1.1 401 Unauthorized
# WWW-Authenticate: Bearer
#   resource_metadata="https://koyo.com/.well-known/oauth-protected-resource/mcp"

curl -X POST https://koyo.com/mcp \
  -H "Authorization: Bearer <access token>" ...
```

### apps/koyo/env/env.server.main.ts

```ts
import type { ModulesOptions } from "../lib/option";
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
};
```

### Terminal

```bash
# RFC 7009 - either token names the grant, and the grant is what closes
curl -X POST https://koyo.com/oauth/revoke \
  -d token=<access or refresh token> \
  -d client_id=koyo-desktop
```

### apps/koyo/lib/icecreamOrder/icecreamOrder.signal.ts

```ts
import { AgentCall, Every, Person, Self } from "@libs/shared/srvkit";
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
})) {}
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Use this page as a task recipe, then verify with the relevant lint, test, or build command.

