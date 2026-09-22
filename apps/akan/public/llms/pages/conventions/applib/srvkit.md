# Server Utils (srvkit/)

- Source: /conventions/applib/srvkit
- Mirror: /llms/pages/conventions/applib/srvkit.md
- Section: conventions
- Category: App & Library
- Priority: P1

## Headings

- Server Utility Overview (#srvkit-overview)
- What Belongs In Srvkit (#what-belongs)
- Server Level Appliance (#server-level-appliance)
- Signal Level Appliance (#signal-level-appliance)
- Service Logic And External Libraries (#service-logic)
- Adaptor And plug (#adaptor-plug)
- Practical Rules (#practical-rules)

## Content

Server Utils (srvkit/)

Pure, isomorphic, zero-dependency. It may import a sibling common/* file and akanjs/base, and nothing else — not Err, which is why throwing code stays out of it.

Touches window, navigator or Capacitor, or is a React hook. The browser half of what common/ cannot hold.

Touches node:*, Bun, process.env, a secret, or a server SDK. The server half, and the only place a vendor package is imported directly.

Renders JSX and is not bound to one model. A component tied to a model belongs in that module as a Unit, View, Template, Util or Zone instead.

A build-time or CLI-time AkanPlugin, registered in akan.config.ts and re-exported from the generated barrel.

Server Utility Overview

The srvkit folder contains server-only logic used by services, signals, and server jobs. Put reusable server abstractions here so convention files can stay focused on business behavior.

This is also the safe place to wrap external libraries. Major convention files such as *.service.ts are intentionally strict about arbitrary external imports, so vendor SDKs and low-level server APIs should usually pass through srvkit first.

The five folders answer one question each, and the test is what the code touches rather than what it is for. Reading them together is faster than reading any one of them, so the same table opens all three pages.

Folder

What Belongs In Srvkit

What Belongs In srvkit/

Request protection logic used by signals, such as checking account roles before a mutation runs.

Context-derived values injected into signal execution, such as account, self, or admin identity.

Middleware And WebProxy

Request pipeline extensions for attaching server context, redirecting, rewriting, or adding headers before app logic runs.

Server helper

Reusable server logic such as hashing, encryption, file handling, image inspection, or token utilities.

A service dependency wrapper for external systems such as storage, queues, email, payment, or vendor APIs.

Class utility

Server-only classes such as logic abstractions or SDK clients that are injected into services through options.

Server Level Appliance

Server level appliances are registered once in the app or library option chain. WebProxy changes the web request before routing, and Middleware prepares request context before signal endpoint logic runs.

WebProxy handles web routing before a page is selected.

Middleware runs around signal requests and can attach server-derived values to the request context before business logic runs.

WebProxy runs before the web request reaches the page. Use it when you need redirects, rewrites, or request header changes for routing and rendering.

After declaring them in srvkit, register middleware and web proxies in the app or library option chain.

Signal Level Appliance

Signal level appliances are applied per signal endpoint or slice. Guard decides whether the endpoint can run, and InternalArg converts trusted server context into exec arguments.

After server-level Middleware prepares context, signal-level appliances control each endpoint.

A Guard checks whether a request can run a signal. Use it for authentication, role checks, ownership checks, or any server-side request protection.

An InternalArg reads request or websocket context and adds a server-derived value to the signal exec arguments. Use it when business logic needs context data without asking the client to send it.

Service Logic And External Libraries

If service code needs crypto, AI SDKs, HTTP clients, or other server-only packages, wrap that logic in srvkit first. A service can import pure helpers directly, but class instances used with use<T>() must be provided from the option chain first.

Adaptor And plug

Adaptors make external systems available through service dependencies. Define a small adaptor in srvkit, then plug it into the service that needs it. Adaptors can also plug other adaptors as long as they do not create a circular dependency.

Practical Rules

Put server-only helper code in srvkit when a service or signal would otherwise become noisy.

Use srvkit for external libraries before importing them into convention files.

Use Guards for request protection and InternalArgs for context-derived signal arguments.

Use adapt and plug when a service needs a reusable external system dependency.

Keep app-specific integrations in app srvkit and reusable integrations in library srvkit.

## Code Examples

### srvkit/middlewares.ts

```ts
import type { Middleware, SignalContext } from "akanjs/signal";

export class RequestUserMiddleware implements Middleware {
  static readonly refName = "RequestUserMiddleware";

  async use() {
    return async (context: SignalContext, next: () => Promise<unknown>) => {
      // Middleware is the one place that branches on transport: it writes the value every guard
      // and InternalArg later reads back through context.get(...).
      const req =
        context.transport === "http" ? context.getHttpContext().req : context.getWebSocketContext().ws.data;
      Object.assign(req, { account: await resolveAccountFromRequest(req) });
      return await next();
    };
  }
}
```

### srvkit/webProxies.ts

```ts
import type { WebProxy } from "akanjs/server";

export class LegacyPageRedirect implements WebProxy {
  static readonly refName = "LegacyPageRedirect";

  use(request: Bun.BunRequest) {
    const url = new URL(request.url);
    if (url.pathname === "/old-docs") return Response.redirect(new URL("/docs", url), 308);
  }
}
```

### lib/option.ts

```ts
export const option = new AkanOption()
  .applyMiddleware(RequestUserMiddleware)
  .applyWebProxy(LegacyPageRedirect);
```

### srvkit/guards.ts

```ts
import type { Guard, GuardScope, SignalContext } from "akanjs/signal";

export class SignedIn implements Guard {
  // fetch serializes guard names and the API explorer filters on them; deleting this breaks that UI.
  static name = "SignedIn";
  static scope: GuardScope = "account";

  canPass(context: SignalContext): boolean {
    return !!context.get<{ self?: { id: string } }>("account")?.self;
  }
}

export class CanCancelOrder implements Guard {
  static name = "CanCancelOrder";
  static scope: GuardScope = "resource";

  async canPass(context: SignalContext): Promise<boolean> {
    const self = context.get<{ self?: { id: string } }>("account")?.self;
    const orderId = context.getArg<string>("orderId");
    if (!self || !orderId) return false;
    const order = await orderModel.findById(orderId);
    return order?.owner === self.id;
  }
}
```

### order.signal.ts

```ts
import { CanCancelOrder, SignedIn } from "@apps/myapp/srvkit";
export class OrderEndpoint extends endpoint(srv.order, ({ pubsub, query, mutation }) => ({
  cancelOrder: mutation(cnst.Order, { guards: [SignedIn, CanCancelOrder] }) // [!code highlight:1]
    .param("orderId", ID)
    .exec(async function (orderId) {
      return await this.orderService.cancelOrder(orderId);
    })
})) {}
```

### srvkit/internalArgs.ts

```ts
import type { InternalArg, SignalContext } from "akanjs/signal";

export class CurrentUserId implements InternalArg {
  getArg(context: SignalContext) {
    return context.get<{ self?: { id: string } }>("account")?.self?.id ?? null;
  }
}
```

### signal exec shape

```ts
import { CanCancelOrder, SignedIn } from "@apps/myapp/srvkit";
export class OrderEndpoint extends endpoint(srv.order, ({ pubsub, query, mutation }) => ({
  cancelOrder: mutation(cnst.Order, { guards: [SignedIn, CanCancelOrder] })
    .param("orderId", ID)
    .with(CurrentUserId, { nullable: true }) // [!code highlight:2]
    .exec(async function (orderId, currentUserId) {
      return await this.orderService.cancelOrder(orderId, { canceledBy: currentUserId });
    })
})) {}
```

### srvkit/createHash.ts

```ts
import { createHash } from "crypto";

export const createOrderHash = (orderId: string) => {
  return createHash("sha256").update(orderId).digest("hex");
};
```

### srvkit/EmailClient.ts

```ts
import { Mailer } from "some-mail-provider";

export class EmailClient {
  #mailer: Mailer;

  constructor(apiKey: string) {
    this.#mailer = new Mailer({ apiKey });
  }

  sendReceipt(to: string, orderId: string) {
    return this.#mailer.send({ to, subject: `Receipt for ${orderId}` });
  }
}
```

### option.ts

```ts
import { EmailClient } from "../srvkit";

export const option = new AkanOption()
  .use((options) => ({
    emailClient: new EmailClient(options.mailer.apiKey),
  }));
```

### order.service.ts

```ts
import { createOrderHash, type EmailClient } from "../srvkit";

export class OrderService extends serve(db.order, ({ use }) => ({
  emailClient: use<EmailClient>(),
})) {
  async sendReceipt(order: db.Order) {
    const hash = createOrderHash(order.id);
    await this.emailClient.sendReceipt(order.email, hash);
  }
}
```

### srvkit/paymentApi.ts

```ts
import { adapt } from "akanjs/service";

interface PaymentOptions {
  endpoint: string;
}

export class PaymentApi extends adapt("paymentApi" as const, ({ env }) => ({
  endpoint: env((option: PaymentOptions) => option.endpoint),
})) {
  async requestPayment(orderId: string, amount: number) {
    return fetch(`${this.endpoint}/payments`, {
      method: "POST",
      body: JSON.stringify({ orderId, amount }),
    });
  }
}
```

### order.service.ts

```ts
import { PaymentApi } from "../srvkit";
import { serve } from "akanjs/service";

export class OrderService extends serve(db.order, ({ plug }) => ({
  paymentApi: plug(PaymentApi),
})) {
  async pay(order: db.Order) {
    return this.paymentApi.requestPayment(order.id, order.totalPrice);
  }
}
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Treat convention and generated-file rules as stronger than local style guesses.

