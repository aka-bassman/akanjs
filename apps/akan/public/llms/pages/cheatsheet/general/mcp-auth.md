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

The Agent Has No Cookie

You mounted /mcp, signed in to your own app in the browser, and pointed Claude Code at the URL. Every call comes back 401. The browser is signed in because it holds a session cookie, and the CLI has neither a browser nor that cookie — and /mcp deletes the cookie header before anything reads it anyway.

So the agent needs a token, and there is no sign-in form that hands one out. An app that mounts libs/shared already serves the thing that does: the OAuth 2.1 authorization server sits beside /mcp, in the same process, and names itself as the issuer. Two roles, one deployment — /mcp is the resource server that spends tokens, and the app is the authorization server that mints them.

One handshake, start to finish

Nothing in that diagram is yours to write. What is yours is deciding which clients may start it, where the consent page lives, and how a grant is cut off — and one secret, without which every token in it is forgeable.

What The App Serves

The protocol endpoints are ordinary signal endpoints in libs/shared, declared with three options that take them out of the usual routing: no service prefix, no global API prefix, and no MCP exposure. They land at the origin's root, which is where RFC 8414 and every MCP client look for them.

Six routes come with the lib, and you write none of them:

Route

Validates the client, its redirect URI and the PKCE challenge, then redirects the browser to the consent page — or to the sign-in page first, with a redirect back.

Exchanges an authorization code (sixty seconds, consumed on first use whether or not the exchange succeeded) or a refresh token for a new pair.

RFC 7591 dynamic registration, on by default and rate-limited per address. Claude Code and claude.ai register themselves here.

RFC 7009. The client hands a token back and the whole grant closes. Answers 200 whether or not the token was live, so it cannot double as a token oracle.

What The Token Is

The access token is the app's own access JWT — the same claims a browser session carries — plus three OAuth ones: iss, aud naming the MCP endpoint, and client_id. So AccountMiddleware reads self and me exactly as before, the ordinary guards judge the call unchanged, and nothing in a service or a signal has to know the caller arrived over OAuth.

There is no scope. The guards are the authorization decision and a scope would be a second, weaker copy of it, so the metadata advertises none and the tokens carry none — the consent page says as much to the user. The token is minted from the live account rather than from a snapshot, so a role change reaches the next token.

Three properties of that exchange are worth keeping in mind:

Header only

the cookie header is deleted before the account middleware runs. A same-site page would otherwise be able to drive tools/call on a visitor's ambient session, and this route never passes through CrossSiteGuard.

A token with no aud is refused

once an issuer is named, the same issuer mints tokens for its other resources too, and one arriving here carrying no audience at all is the confused-deputy case RFC 8707 exists for.

An hour, then rotate

the access token lives accessTokenSeconds — an hour by default — and the refresh token rotates on every use for thirty days.

How A Client Becomes Known

Before anything is authorized the server has to recognise the client_id, and there are three ways it can. They are tried in that order, and a client that matches none is answered with a page rather than a redirect — nothing may be sent to an unverified destination.

A client you listed yourself in oauth.clients. Give it a clientSecret to make it confidential — plaintext in configuration, hashed before it is held — or omit one for a public client.

A client that registered itself over RFC 7591. Registration is open and rate-limited per address, and the record it creates lives ninety days. This is how Claude Code and claude.ai arrive.

A client_id that is an HTTPS URL hosting the client's own registration. The host is resolved before the document is fetched and one pointing into a private range is refused, so the server cannot be aimed at its own network.

Whichever way it arrived, the redirect URI is the part that decides where a code can land, and it is checked hard:

HTTPS, or loopback HTTP — 127.0.0.1, [::1] and localhost, which RFC 8252 discourages but Claude Code uses.

The match is exact, except that a loopback redirect may vary its port: a native client binds whichever port is free at the time, and Claude Code picks a new one per session.

A private-use scheme is admitted only when allowedRedirectSchemes names it. It defaults to cursor, because Cursor's desktop client registers cursor://…/oauth/callback and a server that refuses it cannot be used from Cursor at all.

PKCE S256 is the only method, and a request that omits code_challenge_method is refused even when the challenge itself is well formed.

Configure It Per App

Everything above is configured in one place — an oauth key on the app's server env, beside the other module options. Leave it out entirely and the defaults are already a working server on the app's own domain.

Off takes the authorization server and the /mcp credential requirement away together: the protocol routes answer 404 and no issuer is named, so /mcp goes back to anonymous.

the serve domain

The one string an MCP client compares byte for byte, so it is fixed from configuration and never read off a request header a proxy may have rewritten. Set it for a tunnel in front of a laptop or an edge that renames the host.

The MCP endpoint's canonical URL and every token's aud. Set it when the app moved the MCP path off /mcp.

Route of the consent page, basePath included when the app has one: /office/oauth/consent. The redirect the sign-in page hands back has the basePath stripped, because the router puts it back in front.

Where an anonymous browser is sent first, with ?redirect= back to the consent page. Carries the basePath the same way.

Clients you declare yourself: clientId, redirectUris, an optional clientName, and a clientSecret for a confidential one.

RFC 7591 self-registration. Off drops registration_endpoint from the metadata and answers the route 404, which leaves only the clients you listed and the metadata-document ones.

Private-use redirect schemes accepted besides HTTPS and loopback.

Access token lifetime. Refresh tokens rotate for thirty days regardless, and this value is also how long a revoked grant's id stays denylisted.

both true

Client ID Metadata Documents. Turning enabled off also stops the metadata advertising the feature; refusePrivateAddresses off trusts the name alone, for a deployment whose egress policy already closes the private range.

Revocation Is Whole-Grant

There is no revoking one token. A grant is the unit — its refresh lineage and every access token minted from it — and two parties can close one: the client that holds it, and the account it acts as.

From the account's side the two endpoints are ordinary fetches, guarded by Every and kept off the MCP shelf on purpose — an agent that could list and cut every other connector from inside a tool call is exactly the lever a connected-apps page exists to keep human:

the applications currently holding a grant to act as the signed-in account — one row per grant, with the client name, the user agent it connected from, and whether it is this connection. Browser sessions are not among them.

closes one application's grant and returns false when the id names no live grant of theirs. The account's other grants, and the browser session, are untouched.

What a revoked grant means:

An access token is stateless, so it cannot be deleted. The grant's lineage id — the sid every one of its tokens carries — is denylisted for accessTokenSeconds instead, and a revoked token is refused at its next call.

A refresh token reused within thirty seconds of its rotation is answered with a rotation of its own — a client that holds it twice is not a thief. Reused later, it revokes that grant's lineage and nothing else.

A refresh token presented by a client other than the one it was issued to is refused outright.

A Person May, A Model May Not

Now that agents hold real tokens, some acts need a distinction the guards were never asked for: refunding an order is fine when the shop owner clicks it and not fine when a model decides to. A token this server minted names its client and the MCP resource; a browser session names neither, and a call through /mcp is marked at the door. That is the whole signal.

Two levers, and they answer different questions:

Refuses the call outright. Person also declares static agents = false, so the MCP catalogue refuses every endpoint it guards: the act is absent from the document rather than hidden per caller, and the boot log names it.

Hands the handler the same verdict as a boolean. The endpoint stays callable and stays on the shelf; what narrows is what the call sets in motion — no customer mail, no push, no irreversible side effect.

## Code Examples

### libs/shared/lib/_oauth/oauth.signal.ts

```ts
import { Any } from "akanjs/base";
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
})) {}
```

### Terminal

```bash
curl -i -X POST https://koyo.com/mcp -d '{"jsonrpc":"2.0","id":1,"method":"initialize"}'
# HTTP/1.1 401 Unauthorized
# WWW-Authenticate: Bearer resource_metadata="https://koyo.com/.well-known/oauth-protected-resource/mcp"

curl -X POST https://koyo.com/mcp -H "Authorization: Bearer <access token>" ...
```

### apps/koyo/env/env.server.main.ts

```ts
import type { ModulesOptions } from "../lib/option";
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
      return await this.icecreamOrderService.serve(icecreamOrderId, self.id, { notifyCustomer: !isAgentCall });
    }),
})) {}
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Use this page as a task recipe, then verify with the relevant lint, test, or build command.

