# Edge Computing

- Source: /cheatsheet/general/edge
- Mirror: /llms/pages/cheatsheet/general/edge.md
- Section: cheatsheet
- Category: General
- Priority: P2

## Headings

- Edge Computing (#overview)
- Call Another Server (#call-remote)
- Send Commands (#commands)
- Errors Come Back (#errors)
- Listen To Status (#subscribe)
- Wrap A Remote Node (#remote-object)
- Very Fast Data (#fast-data)
- Tips (#tips)

## Content

Edge Computing

Edge computing in Akan means this: one Akan server can call another Akan server with the same generated `fetch` object you already use in the app.

Cloud server: decides what should happen.

Edge server: does work close to the device or user.

Akan fetch: connects both sides with typed signal calls.

Call Another Server

The important part is the last option: `{ origin }`. It tells fetch which server should receive the signal call.

The origin has to carry the server's API prefix, because fetch sends the call to it as-is. The prefix is configurable, so read it with `getApiPrefix()` from `akanjs/base` instead of writing `/api` as a literal.

Send Commands

Use normal query or mutation calls when the cloud wants the edge server to do something. The call still has typed arguments and typed return values.

Errors Come Back

An `Err` the remote endpoint threw arrives here as that same `Err` — the same key, the same `data`, an `instanceof Err`. Let it go and your own caller receives it, so the browser toasts the sentence the remote server chose.

Never wrap the catch in a `new Error`: that throws away the key, and a plain `Error` is generalized to `Internal Server Error` on the way out.

One error, two servers

Listen To Status

Use subscriptions when the edge server keeps sending status. Save the unsubscribe function so you can clean up later.

Subscribe and cleanup

Wrap A Remote Node

When you talk to the same edge server many times, make a small class that remembers the origin and unsubscribe functions.

Very Fast Data

Keep Akan fetch for commands and status. If you need huge video or binary streams, you can add another transport just for that data.

Commands: `fetch.startJob(...)`

Status: `fetch.subscribeJobStatus(...)`

Large streams: use a dedicated path only when needed.

Tips

Start with a normal signal. If it works locally, it can usually be called remotely by changing `{ origin }`.

Keep edge server hosts in the database, and build each origin from `getApiPrefix()` so a prefix change reaches every one of them.

Always clean up subscriptions. Long-running workers can leak connections otherwise.

## Code Examples

### apps/myapp/lib/_edge/edge.service.ts

```ts
import { getApiPrefix } from "akanjs/base";

async isEdgeAlive(edgeHost: string) {
  const origin = `https://${edgeHost}${getApiPrefix()}`;
  const result = await fetch.ping({ origin });
  if (result !== "ping") return false;
  this.logger.info(`edge server ${edgeHost} is alive`);
  return true;
}
```

### apps/myapp/lib/_edge/edge.service.ts

```ts
const edgeOrigin = `https://${edgeHost}${getApiPrefix()}`;

await fetch.startJob(jobId, { origin: edgeOrigin });
await fetch.stopJob(jobId, { origin: edgeOrigin });
```

### Code

```ts
// edge server
throw new Err("job.error.applyTimeout", { jobId, timeout: 3000 });

// cloud server — the same Err is thrown by this call
await fetch.startJob(jobId, { origin: edgeOrigin });
```

### Code

```ts
const unsubscribe = fetch.subscribeJobStatus(
  (status) => {
    console.info(status);
  },
  { origin: edgeOrigin },
);

// When the page or worker closes:
unsubscribe();
```

### apps/myapp/srvkit/RemoteEdge.ts

```ts
import { getApiPrefix } from "akanjs/base";

export class RemoteEdge {
  readonly #origin: string;

  constructor(host: string) {
    this.#origin = `https://${host}${getApiPrefix()}`;
  }

  ping() {
    return fetch.ping({ origin: this.#origin });
  }

  start(jobId: string) {
    return fetch.startJob(jobId, { origin: this.#origin });
  }
}
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Use this page as a task recipe, then verify with the relevant lint, test, or build command.

