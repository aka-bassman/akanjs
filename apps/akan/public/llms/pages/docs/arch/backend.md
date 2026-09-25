# Business Service

- Source: /docs/arch/backend
- Mirror: /llms/pages/docs/arch/backend.md
- Section: docs
- Category: Architecture
- Priority: P0

## Headings

- Business Service Architecture (#business-service-overview)
- Two Actions, End To End (#two-actions)
- Endpoint, Slice, Internal (#signal-shapes)
- Bounding A Call (#endpoint-options)
- Work That Outlives The Request (#beyond-the-request)
- What A Service Is Handed (#service-dependencies)
- Where An Error Belongs (#error-placement)
- The Same Endpoints, For Agents (#agent-shelf)

## Content

Business Service

The phone operator

May this caller ask at all?

Takes the call, refuses the ones that should never reach the floor, and hands valid work to the right service.

The business owner

What should happen?

Stock rules, payment status, reservation conflicts and external APIs are combined here into one meaningful action.

The archive and its rulebook

How is the record stored, and which changes will it accept?

The stored form, the query filters, and the state changes a record will accept. A chain method mutates and returns this; the caller saves.

A class that decides who may make a call. Every endpoint names its own in the signal file.

The create, read, update and remove endpoints every model already has. You never write them.

A state change on the document: it checks, mutates and returns this. The caller saves.

A singleton that wraps an outside system, such as a POS terminal, and is plugged into a service.

A pubsub channel. Every screen subscribed to it receives what the server publishes there.

The screen asks once and expects one result: load a list, save a form, approve a request, add stock.

An open screen keeps a websocket conversation going: device control, a live operation panel, a guided workflow.

One business change is pushed into a room that many screens, dashboards, devices or users subscribe to.

The work is queued, scheduled, repeated, or tied to the server lifecycle rather than to a caller.

Decided by the guards

An endpoint that declares a real guard is published to agents.

no guards

Refused. A missing guards array now costs visibility as well as authorization.

A mutation whose only guard is Public is refused too.

Decided by the shape

Refused.

A file upload is refused.

An endpoint returning Any or Binary is refused.

Your own choice

Takes the endpoint off the shelf without touching its guards. Right for a step of a UI-driven state machine: perfectly guarded, still no business of a model.

Business Service Architecture

A customer taps Order on the kiosk, and that one button has to do four things: refuse the order when the mango has run out, write the order down, hand back a receipt now, and put the ticket on the kitchen screen before the customer turns away.

One tap, four jobs

One tap on the kiosk reaches the business service, which checks the stock, saves the order, hands back a receipt, and puts a ticket on the kitchen screen.

None of that is drawing a screen. Together it is the business service: the action a request asks for, the business rule behind it, the background job it starts, and the change other screens must be told about.

Every module splits that work across the same three files, and the split never changes. A request arrives at the API port and passes through them in order:

One module, top to bottom

Browser · mobile app · agent

API port

rules · other services

schema · filters

Stored data

Each file answers one question, and only that one:

Words used on this page

Term

Two Actions, End To End

Let's follow two real actions from the counter through the three files:

A customer places an order

Creating an order is generated CRUD, so no endpoint is written for it. What you write is the rule: an order takes stock out of today's inventory.

Staff move it to the next status

This one is not generated. It is a mutation you declare, and only an admin may call it.

The decision lives in the service. This is where the order meets a second module, inventory, and where both documents are loaded before either is saved:

The manager's half is the mirror image: the same three files, a different guard, and no state machine, because refilling today's inventory is allowed whenever an admin asks. Its signal appears in Bounding A Call below.

Endpoint, Slice, Internal

A model's signal file exports exactly three classes, and every module declares all three even when two of them are empty. Which one you reach for depends on one thing: who starts the call.

Class

Who calls it

What goes in it

A screen

The server itself

Choosing by what the screen needs

Start from the product behavior, not from the class list. Does the user need an answer now, a live conversation, a broadcast to many screens, or a job that finishes later?

Signal shape choice

What does the screen need?

Answer now

Keep talking while open

Notify many screens

Finish later

Use query or mutation

Use message

Use pubsub

Use process or schedule

Bounding A Call

Every endpoint takes an option object, and guards is only its first field. The rest say how the call behaves: how long it may take, whether its answer may be reused, whether agents see it.

Here is the manager's half of the shift:

Who may call this. An endpoint that names none runs no check; there is no default policy.

Work That Outlives The Request

Some work has no caller waiting for it. Nobody presses a button to make ice cream melt, and nobody asks for last night's orders to be closed. That work goes in the Internal class, and the server starts it itself:

Both are internal signals, and the batch replica, the server process that runs background jobs, is what runs them.

The same file also gains a pubsub room. It is an endpoint nobody calls, because the server is what publishes into it:

Telling screens that are already open

When an order moves to processing, the kitchen screen is already open, and nobody is going to press refresh. So the service publishes the saved order into the room named after its new status, and every screen subscribed to that status appends the ticket.

One publish, every open screen

The business service publishes the processed order once into the room for its status, and every kitchen screen subscribed to that room receives the ticket.

The service reaches its own signal through an injected field, then publishes right after the save:

A heavy job uses all three at once:

A mutation starts the monthly settlement report and returns the queued record immediately.

An internal process, reached from the service through an injected signal, builds the file.

A slice lets the screen read progress, status, and the download result as the record changes.

What A Service Is Handed

A service never builds the things it needs. It lists them in the builder argument of serve(), and the container hands each one in before any handler runs.

That is what lets a payment provider, a cache backend or a whole sibling module be swapped without editing the business method that uses it.

Handed in, never built

Another module's service, an adaptor, an environment value and shared memory are each handed into the service from outside; the service builds none of them.

A value read out of the backend environment at wiring time.

Runtime state held in the cache adaptor, so every replica sees it. Takes a scalar or model class.

Writing an adaptor

An adaptor is the unit you plug. It is a class built on adapt(), and it registers itself under the name it is given.

It takes the same injectors as a service minus service and signal. So an adaptor can hold config, another adaptor and shared state, but not business logic:

Where An Error Belongs

Refusing an order because the mango ran out and refusing an order from a customer who is not signed in are not the same refusal, and they are not written in the same file. Each layer throws what only it can know:

A customer who is not signed in: the guard in signal.ts refuses before anything else runs.

The mango ran out: another document forbids it, so service.ts refuses.

An order that is not active cannot be processed: the record's own state forbids it, so document.ts refuses.

Which layer refuses

A call arrives

may this caller do this at all?

401 or 403 · the guard returns false

does another document forbid it?

is this record in a state that allows it?

chain method mutates · caller saves

translated for the caller

no

yes

A chain method is the smallest version of this. It validates, mutates, and returns this. It never saves, so chains compose and the caller decides when the write happens:

When failing is not an error

Best-effort code does not throw at all. It returns a plain value, and the caller decides whether that is an error:

An adaptor that cannot reach a provider logs and returns null.

A guard that cannot load a record warns and returns false.

There are no Result wrappers anywhere in the stack.

The Same Endpoints, For Agents

Every signal is also served to AI agents as an MCP server on POST /mcp, mounted by default. You write nothing extra in a signal file, and there is no per-endpoint switch to turn on.

Instead, exposure follows the guards. The guards are already the authorization decision, and a second switch would only guarantee that endpoints added later stay invisible until somebody remembers them.

Endpoint

Published

Left out

What agents get

Not this

## Code Examples

### apps/koyo/lib/icecreamOrder/icecreamOrder.signal.ts

```ts
import { Admin, Every } from "@libs/shared/srvkit";
import { ID } from "akanjs/base";
import { endpoint, internal, Public, slice } from "akanjs/signal";

import * as cnst from "../cnst";
import * as srv from "../srv";

export class IcecreamOrderInternal extends internal(srv.icecreamOrder, () => ({})) {}

export class IcecreamOrderSlice extends slice(
  srv.icecreamOrder,
  { guards: { root: Admin, get: Public, cru: Every } },
  (init) => ({
    byStatuses: init()
      .search("statuses", [cnst.IcecreamOrderStatus])
      .exec(function (statuses) {
        return this.icecreamOrderService.queryByStatuses(statuses);
      }),
  }),
) {}

export class IcecreamOrderEndpoint extends endpoint(srv.icecreamOrder, ({ mutation }) => ({
  processIcecreamOrder: mutation(cnst.IcecreamOrder, { guards: [Admin] })
    .param("icecreamOrderId", ID)
    .exec(async function (icecreamOrderId) {
      return await this.icecreamOrderService.processIcecreamOrder(icecreamOrderId);
    }),
})) {}
```

### apps/koyo/lib/icecreamOrder/icecreamOrder.service.ts

```ts
import { serve } from "akanjs/service";

import * as db from "../db";
import type * as srv from "../srv";

export class IcecreamOrderService extends serve(db.icecreamOrder, ({ service }) => ({
  inventoryService: service<srv.InventoryService>(),
})) {
  override async _preCreate(data: db.IcecreamOrderInput) {
    await this.inventoryService.useStocks([
      { type: "yogurtIcecream", quantity: data.size },
      ...data.toppings.map((topping) => ({ type: topping, quantity: 1 })),
    ]);
    return data;
  }
  async processIcecreamOrder(icecreamOrderId: string) {
    const icecreamOrder = await this.getIcecreamOrder(icecreamOrderId);
    return await icecreamOrder.process().save();
  }
}
```

### apps/koyo/lib/inventory/inventory.signal.ts

```ts
import { Admin } from "@libs/shared/srvkit";
import { endpoint, internal, Public, slice } from "akanjs/signal";

import * as cnst from "../cnst";
import * as srv from "../srv";

export class InventoryInternal extends internal(srv.inventory, () => ({})) {}

export class InventorySlice extends slice(
  srv.inventory,
  { guards: { root: Admin, get: Public, cru: Admin } },
  (init) => ({
    inPublic: init().exec(function () {
      return this.inventoryService.queryAny();
    }),
  }),
) {}

export class InventoryEndpoint extends endpoint(srv.inventory, ({ query, mutation }) => ({
  getTodaysInventory: query(cnst.Inventory, { guards: [Public], cache: 1000 }).exec(async function () { // [!code highlight]
    return await this.inventoryService.getTodaysInventory();
  }),
  refillTodaysInventory: mutation(cnst.Inventory, { guards: [Admin], timeout: 60_000 }).exec(async function () { // [!code highlight]
    return await this.inventoryService.refillTodaysInventory();
  }),
})) {}
```

### apps/koyo/lib/icecreamOrder/icecreamOrder.signal.ts

```ts
import { Admin, Every } from "@libs/shared/srvkit"; // [!code collapse:6]
import { ID } from "akanjs/base";
import { endpoint, internal, Public, slice } from "akanjs/signal";

import * as cnst from "../cnst";
import * as srv from "../srv";

export class IcecreamOrderInternal extends internal(srv.icecreamOrder, ({ cron, interval }) => ({
  warnIcecreamMeltingAll: interval(10000).exec(async function () { // [!code ++:6]
    await this.icecreamOrderService.warnIcecreamMeltingAll();
  }),
  cancelStaleOrders: cron("0 4 * * *", { serverMode: "batch", operationMode: ["cloud"] }).exec(async function () {
    await this.icecreamOrderService.cancelStaleOrders();
  }),
})) {}

export class IcecreamOrderSlice extends slice( // [!code collapse:11]
  srv.icecreamOrder,
  { guards: { root: Admin, get: Public, cru: Every } },
  (init) => ({
    byStatuses: init()
      .search("statuses", [cnst.IcecreamOrderStatus])
      .exec(function (statuses) {
        return this.icecreamOrderService.queryByStatuses(statuses);
      }),
  }),
) {}

export class IcecreamOrderEndpoint extends endpoint(srv.icecreamOrder, ({ mutation, pubsub }) => ({
  processIcecreamOrder: mutation(cnst.IcecreamOrder, { guards: [Admin] }) // [!code collapse:5]
    .param("icecreamOrderId", ID)
    .exec(async function (icecreamOrderId) {
      return await this.icecreamOrderService.processIcecreamOrder(icecreamOrderId);
    }),
  icecreamOrderEntered: pubsub(cnst.LightIcecreamOrder, { guards: [Admin] }) // [!code ++:3]
    .room("status", cnst.IcecreamOrderStatus)
    .exec(() => undefined),
})) {}
```

### apps/koyo/lib/icecreamOrder/icecreamOrder.service.ts

```ts
import { serve } from "akanjs/service"; // [!code collapse:5]

import * as db from "../db";
import type * as sig from "../sig";
import type * as srv from "../srv";

export class IcecreamOrderService extends serve(db.icecreamOrder, ({ service, signal }) => ({
  inventoryService: service<srv.InventoryService>(),
  icecreamOrderSignal: signal<sig.IcecreamOrder>(), // [!code ++]
})) {
  async processIcecreamOrder(icecreamOrderId: string) {
    const icecreamOrder = await this.getIcecreamOrder(icecreamOrderId);
    const processed = await icecreamOrder.process().save(); // [!code ++:3]
    await this.icecreamOrderSignal.icecreamOrderEntered(processed.status, processed);
    return processed;
  }
}
```

### apps/koyo/srvkit/posTerminal.ts

```ts
import { adapt } from "akanjs/service";

import { Err } from "../lib/dict";

export interface PosTerminalOptions {
  pos: { endpoint: string; storeId: string };
}

export class PosTerminal extends adapt("posTerminal" as const, ({ env, memory }) => ({
  pos: env((option: PosTerminalOptions) => option.pos),
  openTickets: memory(Map, { of: String }),
})) {
  override async onInit() {
    await this.openTickets.clear();
  }

  async charge(icecreamOrderId: string, amount: number) {
    const ticket = await this.#api<{ ticketId: string }>("/charge", {
      method: "POST",
      body: JSON.stringify({ storeId: this.pos.storeId, amount }),
    });
    await this.openTickets.set(icecreamOrderId, ticket.ticketId);
    return ticket.ticketId;
  }

  async #api<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.pos.endpoint}${path}`, {
      ...init,
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) throw new Err("koyo.error.posUnavailable");
    return (await response.json()) as T;
  }
}
```

### apps/koyo/lib/icecreamOrder/icecreamOrder.document.ts

```ts
import { by, from, into } from "akanjs/document";

import * as cnst from "../cnst";
import { Err } from "../dict";

export class IcecreamOrderFilter extends from(cnst.IcecreamOrder, (filter) => ({ // [!code collapse:10]
  query: {
    byStatuses: filter()
      .opt("statuses", [cnst.IcecreamOrderStatus])
      .query((statuses, q) => ({
        ...(statuses?.length ? { status: q.oneOf(statuses) } : {}),
      })),
  },
  sort: {},
})) {}

export class IcecreamOrder extends by(cnst.IcecreamOrder) {
  process() {
    if (this.status !== "active") throw new Err("icecreamOrder.error.onlyActiveCanBeProcessed");
    this.status = "processing";
    return this;
  }
  serve() {
    if (this.status !== "processing") throw new Err("icecreamOrder.error.onlyProcessingCanBeServed");
    this.status = "served";
    return this;
  }
}

export class IcecreamOrderModel extends into(IcecreamOrder, IcecreamOrderFilter, cnst.icecreamOrder, () => ({})) {}
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.

