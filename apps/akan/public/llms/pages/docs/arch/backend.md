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

Business Service Architecture

A customer taps Order on the kiosk, and that one button has to do four things: refuse the order when the mango has run out, write the order down, hand back a receipt now, and put the ticket on the kitchen screen before the customer turns away. None of that is drawing a screen.

That work — the request action, the business rule, the background job it starts, and the change other screens must be told about — is the business service. Three files split it, and the split never changes. Traffic arrives at the API port, signal decides whether this caller may ask at all, service decides what should happen, and document owns how the record is stored and which state changes it will accept.

One module, right to left

The layers are not a formality. A rule written into the kiosk screen ships once per client and drifts; the same rule on the service is one answer for the kiosk, the admin console, the mobile app and an AI agent, because all four arrive through the same endpoint.

Two Actions, End To End

Start from the counter. Creating an order is generated CRUD, so no endpoint is written for it; what is written is the rule that an order takes stock out of today's inventory, and the mutation a staff member uses to move that order to the next status.

The endpoint is one line of delegation, because the decision is not its to make. The service is where the order meets a second module — inventory — and where the two documents are loaded before either is saved:

The manager's half is the mirror image: the same three files, a different guard, and no state machine — refilling today's inventory is allowed whenever an admin asks. Each layer keeps its own kind of decision:

The phone operator. Takes the call, refuses the ones that should never reach the floor, and hands valid work to the right service.

The business owner. Stock rules, payment status, reservation conflicts and external APIs are combined here into one meaningful action.

The archive and its rulebook. The stored form, the query filters, and the state changes a record will accept. A chain method mutates and returns this; the caller saves.

The rule of thumb is short: if the code answers a business question, it belongs in service logic. If it only draws a screen or holds temporary UI state, it stays on the UI side.

Endpoint, Slice, Internal

A model's signal file exports exactly three classes, and every module declares all three even when two of them are empty. Which one you reach for is decided by who starts the call.

Class

Start from the product behavior, not from the class list. Does the user need an answer now, a live conversation, a broadcast to many screens, or a job that finishes later?

Signal shape choice

the screen asks once and expects one result — load a list, save a form, approve a request, add stock.

an open screen keeps a websocket conversation going — device control, a live operation panel, a guided workflow.

one business change is pushed into a room that many screens, dashboards, devices or users subscribe to.

the work is queued, scheduled, repeated, or tied to the server lifecycle rather than to a caller.

Bounding A Call

Every endpoint takes an option object, and guards is only the first field in it. Here is the manager's half of the shift — a read the whole shop shares, and a write only an admin may make and that a stock provider can make slow.

Work That Outlives The Request

Some work has no caller waiting for it. Served ice cream melts on its own schedule, and orders nobody collected have to be closed out overnight. Both are internal signals, and the batch replica is what runs them — while the pubsub room below is an endpoint nobody calls, because the server is what publishes into it.

A kitchen screen is already open when an order moves to processing, and nobody is going to press refresh. The service reaches its own signal through an injected field and publishes the saved order into the room named by its new status, so every screen subscribed to that status appends the ticket:

A heavy job uses all three at once:

A mutation starts the monthly settlement report and returns the queued record immediately.

An internal process, reached from the service through an injected signal, builds the file.

A slice lets the screen read progress, status, and the download result as the record changes.

What A Service Is Handed

A service never constructs the things it needs. It declares them in the builder argument of serve(), and the container resolves each one before any handler runs — which is what lets a payment provider, a cache backend or a whole sibling module be swapped without editing the business method that uses it.

A value read out of the backend environment at wiring time, so no configuration has to be threaded through every function that needs it.

An adaptor is the unit you plug. It is a class built on adapt(), it self-registers under the name it is given, and it takes the same injectors minus service and signal — so an adaptor can hold config, another adaptor, and shared state, but not business logic:

Where An Error Belongs

Refusing an order out of mango and refusing an order from a customer who is not signed in are not the same refusal, and they are not written in the same file. Each layer throws what only it can know.

Which layer refuses

A chain method is the smallest version of this: it validates, mutates, and returns this — never saving, so that chains compose and the caller decides when the write happens.

Best-effort code does not throw at all. An adaptor that cannot reach a provider logs and returns null, a guard that cannot load a record warns and returns false, and the caller decides whether that is an error. There are no Result wrappers anywhere in the stack.

The Same Endpoints, For Agents

Every signal is also served to AI agents as an MCP server on POST /mcp, mounted by default. There is no per-endpoint opt-in and nothing extra to write in a signal file: exposure follows the guards, because the guards are already the authorization decision and a second switch would only guarantee that endpoints added later are invisible until somebody remembers them.

What the guards decide for agents:

An endpoint that declares a real guard is published; one that declares none is refused, and the boot log names it. So a missing guards array now costs visibility as well as authorization.

A mutation whose only guard is Public is refused too, and so are pubsub, message, file uploads, and any endpoint returning Any or Binary.

mcp: false takes an endpoint off the shelf without touching its guards — the right answer for a step of a UI-driven state machine that is perfectly guarded and still no business of a model.

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

