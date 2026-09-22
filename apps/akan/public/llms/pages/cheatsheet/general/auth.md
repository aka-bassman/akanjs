# Authorization

- Source: /cheatsheet/general/auth
- Mirror: /llms/pages/cheatsheet/general/auth.md
- Section: cheatsheet
- Category: General
- Priority: P2

## Headings

- Authorization (#overview)
- The Guards That Ship (#guards)
- Declare The Scope (#scope)
- Resource Guards Fail Closed (#resource-guard)
- The Acting User Comes From The Server (#acting-user)
- Guards Are Also The Agent Decision (#agent-exposure)

## Content

Authorization

You are shipping the order list for a shop that has more than one branch. The page renders, every row on screen belongs to the right branch, and it all looks correct — because the branch id came out of the URL. Then a customer edits the URL, and the same endpoint hands them somebody else's orders.

Authorization answers two questions in front of every endpoint: who is calling, and may they do this? Middleware reads the caller off the request, guards decide, and internal arguments hand the handler values the client never typed. The same three steps run whether the call arrived over HTTP, a websocket frame, or the MCP endpoint.

One call, from the door to the handler

The Guards That Ship

A guard is a class with one method. Two places ship them: akanjs/signal carries the two that decide nothing about identity, and @libs/shared/srvkit carries the role ladder every app mounting libs/shared inherits. Name them in the slice guards map and in every custom endpoint's own guards array.

Every slice() takes an explicit guards map as its second argument and root: is always Admin — the root slice is an admin API that takes a query key and its arguments. A custom endpoint never inherits the slice default; it names its own array, and an empty one is the hole above. Here is what is on the shelf:

Guard

The role guards share one helper, and it separates the two refusals a caller can hit: no identity at all answers 401, which is the status an MCP client reads as “obtain a token”, and a signed-in caller who merely lacks the role answers 403 naming the roles required and the roles held. Keep the array beside the endpoint so a reader can see who may call it without opening another file.

Declare The Scope

Every guard class also declares static scope: GuardScope, and it is required with no default. The value says what the guard needs in order to answer, which is what lets an agent catalogue evaluate some guards before a call exists.

Two values, and the difference is what the method touches:

The verdict reads the caller and nothing about the call, so it can be evaluated with no arguments. That is what lets an agent listing hide what this caller certainly cannot use.

It reads the call's arguments through context.getArg() and fails closed without them, so it is never evaluated for a listing. The entry stays visible and the call is stopped at call time.

Getting it wrong is not a type error. Both strings satisfy GuardScope on any guard, and nothing in the type system knows whether canPass reaches for an argument — so the compiler accepts either marking on either kind of guard. The two mistakes fail differently, and neither one looks like a mistake from the call site.

⚠️ The two failure modes:

A resource guard marked "account" throws when a listing evaluates it with no arguments. The entry is hidden from every caller and the guard is named once per endpoint in the boot log as mismarked.

An account guard marked "resource" filters nothing. The endpoint is listed to every caller, including one it will refuse, and is only stopped at call time.

The rule of thumb is short: SignedIn, Admin and every role check are "account"; every Can<Verb><Model> is "resource".

Resource Guards Fail Closed

A role guard answers who you are; it cannot answer whether this record is yours. That is a Can<Verb><Model> class in srvkit/guards.ts, and it loads the record the call names before it decides.

Four things in that body are the pattern, not this model's details:

Admin bypass goes first

an admin never owns the record, so an ownership test placed above the bypass locks the admin console out of its own data

No resource named ⇒ false

a missing argument is the one case where returning true would pass every call that forgot to send one

A load that throws ⇒ warn, then false

a database hiccup must not read as permission granted, and the warn is what tells you the guard is refusing for the wrong reason

it looks like dead code next to the class name, but fetch serializes guard names onto every endpoint and the API explorer filters on them — deleting it breaks that UI

Guards ship with the library that owns the model and are imported by that library's own signals, so an app that mounts the library inherits the authorization and cannot forget it. The service then re-checks ownership even though the guard already gated the call — two independent gates, because a service method is also reachable from another service, a cron trigger, and a queue job, none of which passed through a guard.

The Acting User Comes From The Server

A guard decides whether the call runs at all. An internal argument tells the handler who is running it, and it never comes off the wire: .with(...) resolves the value from the account the middleware already verified, after the guards have passed.

Four internal arguments ship from @libs/shared/srvkit, and an app adds its own in srvkit/ when it needs a narrower shape:

the signed-in user, or null. This is the one to reach for in a user-facing endpoint.

the signed-in admin, or null. Self and Me are separate identities on one account, not two roles on one identity.

the whole account object, for a handler that has to branch on both identities at once.

a boolean — is a model driving this call, rather than a person. Narrows what the call sets in motion without changing who may make it.

the app scaffold writes this one into srvkit/ for handlers that only need the id. Write your own the same way — a class with one getArg(context).

Guards Are Also The Agent Decision

Every signal is served to AI agents as an MCP server on POST /mcp, mounted by default. There is no per-endpoint opt-in and nothing extra to write: the guards are already the authorization decision, so a second switch would say nothing they do not — while guaranteeing that every endpoint added later is invisible to agents until somebody remembers it.

What the guards decide for agents:

An endpoint that declares a real guard is published. An endpoint that declares none is refused, and the boot log names it: write guards: [Public] if anonymous access is the intent.

A mutation whose only guard is Public is refused too — [Public] on a mutation is having no guard, spelled out.

A guard that admits no model at all — Person — declares static agents = false, and the catalogue then refuses every endpoint it guards outright, so the act is absent from the document rather than hidden per caller.

mcp: false takes an endpoint off the shelf without touching its guards. That is curation, not authorization — HTTP serves it exactly as before.

## Code Examples

### apps/koyo/lib/icecreamOrder/icecreamOrder.signal.ts

```ts
import { Admin, Every, Self, SelfOrAdmin } from "@libs/shared/srvkit";
import { ID } from "akanjs/base";
import { endpoint, internal, Public, slice } from "akanjs/signal";

import * as cnst from "../cnst";
import * as srv from "../srv";

export class IcecreamOrderInternal extends internal(srv.icecreamOrder, () => ({})) {}

export class IcecreamOrderSlice extends slice(
  srv.icecreamOrder,
  { guards: { root: Admin, get: Public, cru: SelfOrAdmin } },
  () => ({}),
) {}

export class IcecreamOrderEndpoint extends endpoint(srv.icecreamOrder, ({ mutation }) => ({
  serveIcecreamOrder: mutation(cnst.IcecreamOrder, { guards: [Every] })
    .param("icecreamOrderId", ID)
    .with(Self)
    .exec(async function (icecreamOrderId, self) {
      return await this.icecreamOrderService.serve(icecreamOrderId, self.id);
    }),
})) {}
```

### apps/koyo/srvkit/guards.ts

```ts
import type { Guard, GuardScope, SignalContext } from "akanjs/signal";

export class SignedIn implements Guard {
  // fetch serializes guard names and the API explorer filters on them; deleting this breaks that UI.
  static name = "SignedIn";
  static scope: GuardScope = "account"; // [!code highlight]

  canPass(context: SignalContext): boolean {
    return !!context.get<{ self?: { id: string } }>("account")?.self;
  }
}
```

### apps/koyo/srvkit/guards.ts

```ts
import { Logger } from "akanjs/common"; // [!code ++]
import type { Guard, GuardScope, SignalContext } from "akanjs/signal";
import type * as srv from "../lib/srv"; // [!code ++]

export class SignedIn implements Guard { // [!code collapse:9]
  // fetch serializes guard names and the API explorer filters on them; deleting this breaks that UI.
  static name = "SignedIn";
  static scope: GuardScope = "account";

  canPass(context: SignalContext): boolean {
    return !!context.get<{ self?: { id: string } }>("account")?.self;
  }
}

export class CanServeIcecreamOrder implements Guard { // [!code ++:21]
  static name = "CanServeIcecreamOrder";
  static scope: GuardScope = "resource";
  static #logger = new Logger("CanServeIcecreamOrder");

  async canPass(context: SignalContext): Promise<boolean> {
    const account = context.get<{ self?: { id: string }; me?: { id: string } }>("account");
    if (account?.me) return true;
    const selfId = account?.self?.id;
    const icecreamOrderId = context.getArg<string>("icecreamOrderId");
    if (!selfId || !icecreamOrderId) return false;
    try {
      const service = context.getService<srv.IcecreamOrderService>("icecreamOrder");
      const icecreamOrder = await service.getIcecreamOrder(icecreamOrderId);
      return icecreamOrder.owner === selfId;
    } catch (error) {
      CanServeIcecreamOrder.#logger.warn(`serve guard could not load ${icecreamOrderId}: ${String(error)}`);
      return false;
    }
  }
}
```

### apps/koyo/lib/icecreamOrder/icecreamOrder.signal.ts

```ts
import { AgentCall, Every, Me, Self, User } from "@libs/shared/srvkit";
import { ID } from "akanjs/base";
import { endpoint } from "akanjs/signal";

import * as cnst from "../cnst";
import { Err } from "../dict";
import * as srv from "../srv";

export class IcecreamOrderEndpoint extends endpoint(srv.icecreamOrder, ({ query, mutation }) => ({
  listMyIcecreamOrders: query([cnst.LightIcecreamOrder], { guards: [User] })
    .with(Self) // [!code highlight]
    .exec(async function (self) {
      return await this.icecreamOrderService.listByOwner(self.id);
    }),
  refundIcecreamOrder: mutation(cnst.IcecreamOrder, { guards: [Every] })
    .param("icecreamOrderId", ID)
    .with(Me, { nullable: true }) // [!code highlight]
    .with(AgentCall)
    .exec(async function (icecreamOrderId, me, isAgentCall) {
      if (isAgentCall) throw new Err("koyo.error.refundNeedsPerson");
      return await this.icecreamOrderService.refund(icecreamOrderId, !!me);
    }),
})) {}
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Use this page as a task recipe, then verify with the relevant lint, test, or build command.

