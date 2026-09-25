# akanjs/signal

- Source: /references/akanjs/signal
- Mirror: /llms/pages/references/akanjs/signal.md
- Section: references
- Category: AkanJS Reference
- Priority: P0

## Headings

- akanjs/signal (#akanjs-signal)
- Public / None / guard (#Public / None / guard)
- McpProgress (#McpProgress)
- Req / Res / Ip / Ws (#Req / Res / Ws)
- middleware / Middleware (#middleware / Middleware)
- SignalRegistry (#SignalRegistry)

## Content

akanjs/signal

Export

Declares the calls a module exposes: queries, mutations and WebSocket endpoints.

Declares work the server starts itself: schedules, lifecycle hooks, queue jobs, resolved fields.

Declares the list queries a client store loads, and guards the generated CRUD endpoints.

Guards. They run before the handler and decide whether the call may go on.

Internal arguments: handler arguments the server fills in, such as the request.

Middleware wraps every endpoint call. The two built-ins are registered by default.

Reports progress from inside a long MCP tool call.

Look up registered signals, and publish or enqueue from a service.

The per-call context guards and middleware receive: transport, arguments and caller.

Request and response

Reads, over `GET`. The only kind that may declare `cache`.

Writes, over `POST`. The `method` option moves it to `PATCH`, `PUT` or `DELETE`.

Realtime

The client subscribes to a room, and the server publishes into it.

The client sends one message and gets one answer back.

The Signal File

How `Internal`, `Slice` and `Endpoint` are laid out in one `*.signal.ts`.

MCP Prompts

Declared on a page with `page().prompt(name, description)`.

The Guards That Ship

`Every`, `Admin`, `Person` and the other guards `libs/shared` provides.

Report MCP Progress

The progress stream step by step, from the client's side too.

Always passes. Use it on slice reads such as `get:`, never as a mutation's only guard.

Always refuses the call.

A base class with `static name` filled in and `scope` preset to `"account"`.

The interface: `canPass(context)` returns a boolean, or a promise of one.

`"account"` or `"resource"`: what the guard needs to reach a verdict.

Reads arguments

Checked for MCP listing

Reads only the caller, through `context.get("account")`.

Reads the call's arguments via `context.getArg(name)`, so it is judged only at call time.

Sends one progress notification for the call running on this stack.

Optional. The denominator the client renders; omit it when the amount of work is unknown.

Optional. One short line on the current step; the user reads it, so write prose.

`true` only while a client is streaming, so a costly message can be skipped.

The request

The current Bun request, `Bun.BunRequest`.

The `Response` class, for building a reply such as `res.json(value)`.

The caller

The caller's IP as the nearest proxy recorded it, or `null`.

The connection

`ws`, `socketId`, `subscribe`, and the `on` / `off` cleanup hooks.

Middleware

Acts when

What it does

Always.

Writes debug lines around the call, and an error line when it fails.

The endpoint declares `timeout` in ms.

Rejects with `base.error.gatewayTimeout` (504) once the time is spent.

Every endpoint the server runs, after the two defaults.

The endpoint option. Applies to that endpoint only, inside every global middleware.

A database module's `internal`, `endpoint`, `slice`, `server` and `serializedSignal`.

A service module's `internal`, `endpoint`, `server` and `serializedSignal`.

One per `pubsub` endpoint. Publishes `data` to the room the arguments name.

One per `process` internal. Enqueues a job and returns its `AkanJob`.

`akanjs/signal` declares the API boundary around a service: what may be called, by whom, over which transport. You import it in `*.signal.ts` files and in the `srvkit/` files that hold guards and middleware.

What It Exports

Four Endpoint Kinds

The `endpoint` builder hands you four kinds, and each kind fixes its transport:

Kind

travels over it

does not

An MCP prompt is not an endpoint kind. It is declared on a page with `page().prompt(name, description)`.

Public / None / guard

A guard decides whether a call may run, before its handler does. Every custom endpoint names its own `guards` array, and every guard in it must pass.

Account Or Resource

Every guard carries a `static scope`, which says whether the verdict needs the call's arguments:

yes

no

Writing A Guard

Guards live in `srvkit/guards.ts`, one class each:

Then name them on each endpoint. A `pubsub` room is not covered by slice guards, so it declares its own:

McpProgress

`McpProgress` reports how far a long MCP tool call has got, so the agent's client can show it. Call it wherever the work happens; nothing has to be passed down.

A service that imports rows reports after each one:

Req / Res / Ip / Ws

Internal arguments are handler arguments the server fills in, not the caller. Declare one with `.with(X)`, and the handler receives it after the declared arguments.

Argument

available

not available

Libraries add their own, such as `Self`, `Me` and `Account` from `@libs/shared/srvkit`. Take the caller from those, never from an id the client sends.

A mutation that reads the raw request body and the caller's IP, and a message handler that cleans up when the socket closes:

middleware / Middleware

Middleware wraps every endpoint call, before and after the handler. Two are registered by default; write your own with `middleware(refName)`.

An endpoint's `{ cache: <ms> }` is not a middleware. The stored answer is looked up inside the call, after the guards, so a hit reaches only a caller they admitted.

Call Order

From the outside in:

The two defaults: `Logging` → `Timeout`.

Middleware a `lib/option.ts` adds with `applyMiddleware(...)`, such as `AccountMiddleware` from `libs/shared`.

The endpoint's own `middlewares` option.

Guards, then internal arguments, then the `cache` lookup if the endpoint declares one, then the handler.

Writing One

A middleware that warns about slow calls:

Register it in one of two places:

Where

SignalRegistry

`SignalRegistry` finds a module's registered signals by refName at runtime. A refName nothing registered returns `undefined`.

Method

Look one up by refName:

Publishing From A Service

Each module also has a server signal, which a service injects with `signal<sig.X>()`. It turns endpoints and internals into methods:

The notice service saves a notice, then publishes it to the `noticeAdded` room from the guard example:

## Code Examples

### apps/koyo/srvkit/guards.ts

```typescript
import { type Guard, type GuardScope, guard, type SignalContext } from "akanjs/signal";

export class AdminOnly implements Guard {
  static name = "AdminOnly";
  static scope: GuardScope = "account";
  canPass(context: SignalContext) {
    const account = context.get<{ me?: { roles: string[] } }>("account");
    return !!account?.me?.roles.includes("admin");
  }
}

export class SelfOnly extends guard("SelfOnly") {
  static override scope: GuardScope = "resource";
  override canPass(context: SignalContext) {
    const userId = context.getArg<string>("userId");
    const account = context.get<{ self?: { id: string } }>("account");
    return !!userId && account?.self?.id === userId;
  }
}
```

### apps/koyo/lib/notice/notice.signal.ts

```typescript
import { AdminOnly, SelfOnly } from "@apps/koyo/srvkit";
import { ID } from "akanjs/base";
import { endpoint } from "akanjs/signal";

import * as cnst from "../cnst";
import * as srv from "../srv";

export class NoticeEndpoint extends endpoint(srv.notice, ({ mutation, pubsub }) => ({
  broadcastNotice: mutation(Boolean, { guards: [AdminOnly] })
    .body("text", String)
    .exec(async function (text) {
      return await this.noticeService.broadcast(text);
    }),
  noticeAdded: pubsub(cnst.Notice, { guards: [SelfOnly] })
    .room("userId", ID)
    .exec(() => undefined),
})) {}
```

### apps/koyo/lib/task/task.service.ts

```typescript
import { McpProgress } from "akanjs/signal";
import { serve } from "akanjs/service";

import type * as cnst from "../cnst";
import * as db from "../db";

export class TaskService extends serve(db.task, () => ({})) {
  async importTasks(rows: cnst.TaskInput[]) {
    for (const [idx, row] of rows.entries()) {
      McpProgress.report(idx + 1, {
        total: rows.length,
        message: `Importing ${row.title}`,
      });
      await this.createTask(row);
    }
    return rows.length;
  }
}
```

### apps/koyo/lib/_wallpad/wallpad.signal.ts

```typescript
import { Every } from "@libs/shared/srvkit";
import { ID } from "akanjs/base";
import { endpoint, Ip, Req, Ws } from "akanjs/signal";

import * as srv from "../srv";

export class WallpadEndpoint extends endpoint(srv.wallpad, ({ mutation, message }) => ({
  reportWallpadEvent: mutation(Boolean, { guards: [Every] })
    .with(Req)
    .with(Ip, { nullable: true })
    .exec(async function (req, ip) {
      return await this.wallpadService.reportEvent(await req.json(), ip);
    }),
  watchWallpad: message(Boolean, { guards: [Every] })
    .msg("wallpadId", ID)
    .with(Ws)
    .exec(async function (wallpadId, { socketId, on }) {
      on("disconnect", async () => {
        await this.wallpadService.unwatch(wallpadId, socketId);
      });
      return await this.wallpadService.watch(wallpadId, socketId);
    }),
})) {}
```

### apps/koyo/srvkit/slowCallMiddleware.ts

```typescript
import { middleware, type SignalContext } from "akanjs/signal";

export class SlowCallMiddleware extends middleware("slowCall") {
  override async use() {
    return async (context: SignalContext, next: () => Promise<unknown>) => {
      const start = Date.now();
      const result = await next();
      const ms = Date.now() - start;
      if (ms > 1000) context.adaptor.logger.warn(`${context.key}: ${ms}ms`);
      return result;
    };
  }
}
```

### apps/koyo/srvkit/signalLookup.ts

```typescript
import { SignalRegistry } from "akanjs/signal";

const userSignal = SignalRegistry.getDatabase("user");
const utilSignal = SignalRegistry.getService("util");
```

### apps/koyo/lib/notice/notice.service.ts

```typescript
import { serve } from "akanjs/service";

import * as db from "../db";
import type * as sig from "../sig";

export class NoticeService extends serve(db.notice, ({ signal }) => ({
  noticeSignal: signal<sig.Notice>(),
})) {
  async send(userId: string, text: string) {
    const notice = await this.createNotice({ userId, text });
    await this.noticeSignal.noticeAdded(userId, notice);
    return notice;
  }
}
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Respect server/client subpath boundaries when importing Akan APIs.

