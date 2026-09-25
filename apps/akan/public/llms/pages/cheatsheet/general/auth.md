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

What the middleware leaves on the call. A guest's account holds neither `self` nor `me`.

The two identities an account can carry: `self` is the user, `me` is the admin.

What a guard needs to answer: the caller alone (`account`) or the call's arguments (`resource`).

An AI model calling through the MCP endpoint or on an OAuth token, instead of a person.

The root slice: an admin list API that takes a filter name and its args. Always `Admin`.

The single-document reads `icecreamOrder(id)` and `lightIcecreamOrder(id)`.

`createIcecreamOrder`, `updateIcecreamOrder` and `removeIcecreamOrder` together.

Overrides `cru` for `createIcecreamOrder` alone.

Overrides `cru` for `updateIcecreamOrder` alone.

Overrides `cru` for `removeIcecreamOrder` alone.

Guest

Passes everyone, guests and agents included. For a slice `get:`, never a mutation.

Refuses everyone: the explicit way to close a generated endpoint.

Any signed-in caller: `user`, `admin` or `superAdmin`.

The `user` role only. An admin who is not also a user is refused.

`admin` or `superAdmin`. The admin-console guard, and every slice's `root:`.

`superAdmin` only.

The roles of `Every`, but `resource` scope: judged at call time, never in a listing.

`resource` scope. The user the `userId` argument names, or an admin; no `userId` refuses all.

Passes any person and refuses an agent. Pair it with a role guard: `guards: [Every, Person]`.

Role guard: no identity at all

An MCP client reads this status as “obtain a token”.

Role guard: signed in, lacks the role

Names the roles required and the roles the caller holds.

Any guard: returns `false`

Names the guard that refused, by its `static name`.

Internal argument: a required `.with()` value is `null`

Names the missing argument; mark it `{ nullable: true }` if the handler can do without it.

The verdict reads the caller and nothing about the call, so it runs with no arguments. An agent listing uses it to hide what this caller certainly cannot use.

The signed-in user, or `null`. The one to reach for in a user-facing endpoint.

The signed-in admin, or `null`. `Self` and `Me` are two identities on one account, not two roles.

The whole account, for a handler that branches on both identities at once.

`true` when an agent drives the call. It narrows what the call does, not who may make it.

The workspace scaffold writes it to `srvkit/SessionInternalArg.ts`, for handlers needing only an id.

From `akanjs/signal`: the caller's IP, the websocket, and the raw HTTP request and response.

Decided by the guards

A real guard publishes the endpoint, and the same guard judges every call on both.

no guards

Anyone may call it over HTTP, and it is never published. Write `guards: [Public]` if that is the intent.

Anonymous access, written down: a query publishes.

Not published: `[Public]` on a mutation is having no guard, spelled out.

`Person` sets `static agents = false`: the act is gone from the catalogue, not hidden per caller.

Your own choice

Off the shelf, guards untouched. Curation, not authorization: HTTP serves it as before.

The same on `slice()`, as a map keyed like its `guards` map.

You ship the order list for a shop with several branches, and every row looks right because the branch id comes from the URL. Then a customer edits the URL, and the same endpoint hands them somebody else's orders.

Authorization answers two questions in front of every endpoint: who is calling, and may they do this? Three steps answer them, the same over HTTP, a websocket or the MCP endpoint:

Words used on this page

Term

One call, from the door to the handler

Request

Arguments parsed

Middleware

guards array

in declaration order

Internal arguments

exec() handler

hidden and secret fields masked

first refusal

The Guards That Ship

Keys of the slice guards map

Each key guards the endpoints the slice generates for the model:

Guards on the shelf

Guard

Passes

Refused

401 or 403

Which status a refused call gets depends on where it was refused:

Refused because

Status

What the caller learns

Declare The Scope

Marking it wrong

Mistake

What happens

A resource guard marked `"account"`

A listing runs it argument-free; it refuses or throws and hides the entry from legitimate callers.

An account guard marked `"resource"`

It filters nothing: the entry is listed to every caller, even one it will refuse at call time.

Resource Guards Fail Closed

1. Write the guard

Four things in that body are the pattern, not this model's details:

Three more hold for every guard you write, not only resource guards:

2. Name it on the endpoint

Two independent gates

The Acting User Comes From The Server

Two endpoints that read the caller:

Internal arguments on the shelf

Internal argument

Guards Are Also The Agent Decision

Guards are already the authorization decision, so a second switch would add nothing. It would only keep every endpoint added later invisible to agents until somebody remembered to flip it.

Endpoint

Served

Left out

Related pages

MCP Server

Resource URIs, OAuth metadata, rate limits and the rest of the wire.

OAuth For Agents

How an agent signs in and gets the token these guards judge.

## Code Examples

### apps/koyo/lib/icecreamOrder/icecreamOrder.signal.ts

```ts
import { Admin, Every, Self } from "@libs/shared/srvkit";
import { ID } from "akanjs/base";
import { endpoint, internal, slice } from "akanjs/signal";

import * as cnst from "../cnst";
import * as srv from "../srv";

export class IcecreamOrderInternal extends internal(srv.icecreamOrder, () => ({})) {}

export class IcecreamOrderSlice extends slice(
  srv.icecreamOrder,
  { guards: { root: Admin, get: Admin, cru: Admin } }, // [!code highlight]
  () => ({}),
) {}

export class IcecreamOrderEndpoint extends endpoint(srv.icecreamOrder, ({ mutation }) => ({
  cancelIcecreamOrder: mutation(cnst.IcecreamOrder, { guards: [Every] }) // [!code highlight]
    .param("icecreamOrderId", ID)
    .with(Self)
    .exec(async function (icecreamOrderId, self) {
      return await this.icecreamOrderService.cancel(icecreamOrderId, self.id);
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

export class CanCancelIcecreamOrder implements Guard { // [!code ++:21]
  static name = "CanCancelIcecreamOrder";
  static scope: GuardScope = "resource";
  static #logger = new Logger("CanCancelIcecreamOrder");

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
      CanCancelIcecreamOrder.#logger.warn(`cancel guard could not load ${icecreamOrderId}: ${String(error)}`);
      return false;
    }
  }
}
```

### apps/koyo/lib/icecreamOrder/icecreamOrder.signal.ts

```ts
import { CanCancelIcecreamOrder } from "@apps/koyo/srvkit"; // [!code ++]
import { Every, Self } from "@libs/shared/srvkit";
import { ID } from "akanjs/base";
import { endpoint } from "akanjs/signal";

import * as cnst from "../cnst";
import * as srv from "../srv";

export class IcecreamOrderEndpoint extends endpoint(srv.icecreamOrder, ({ mutation }) => ({
  cancelIcecreamOrder: mutation(cnst.IcecreamOrder, { guards: [Every, CanCancelIcecreamOrder] }) // [!code highlight]
    .param("icecreamOrderId", ID)
    .with(Self)
    .exec(async function (icecreamOrderId, self) {
      return await this.icecreamOrderService.cancel(icecreamOrderId, self.id);
    }),
})) {}
```

### apps/koyo/lib/icecreamOrder/icecreamOrder.signal.ts

```ts
import { AgentCall, Every, Me, Self, User } from "@libs/shared/srvkit";
import { ID } from "akanjs/base";
import { endpoint } from "akanjs/signal";

import * as cnst from "../cnst";
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
      return await this.icecreamOrderService.refund(icecreamOrderId, {
        byAdmin: !!me,
        notifyCustomer: !isAgentCall,
      });
    }),
})) {}
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Use this page as a task recipe, then verify with the relevant lint, test, or build command.

