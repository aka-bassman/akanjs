# Transport Rule — Guards, Sockets, Binary Frames, HTTP Verbs

How a call reaches a signal: what a guard may read on either transport, how a websocket carries its credential
and its per-connection state, when a pubsub payload leaves JSON for a binary frame, and which HTTP verb a
mutation is mounted under. `conventions` carries the invariants — this is the full contract behind them.

## Guards And Transports

- Guards run on both HTTP and websocket calls. Read the caller with `context.get<T>("account")` (`pkgs/akanjs/signal/signalContext.ts`) instead of branching on `getHttpContext()` / `getWebSocketContext()`.
- Slice-level `guards` only reach the generated query/mutation endpoints. A `pubsub`/`message` endpoint is unguarded unless it declares its own `guards` in its signal option.
- A pubsub room is authorized once, at subscribe. When a socket's credential changes the framework re-runs each room's guards and unsubscribes the ones that now fail (`SignalResolver.revalidateWsRooms`), so guards must stay side-effect free and safe to re-run.
- A websocket carries its credential in the handshake snapshot on `ws.data` (`AppWsData`); clients that hold the token in memory send it with `fetch.setJwt(...)`, which forwards an auth frame over the socket.
- **Never read the caller's IP off the socket or the request peer — take `.with(Ip)`.** Whenever a federation
  gateway is in front, `ws.remoteAddress` and the child's own peer are the *gateway* (`127.0.0.1`) for every
  caller and for the whole life of every socket. `Ip` reads what a proxy recorded (`x-real-ip`, then the first
  `x-forwarded-for` entry) and falls back to the peer only when nothing proxied the call — which is the answer
  for a solo process behind an ingress that sets neither; `context.getClientIp()` is the same answer inside a
  guard or middleware. It arrives unwrapped from
  its `::ffff:` IPv4-mapped form, so it can address a `udp4` socket as well as identify a caller, and it is
  `null` rather than a placeholder when genuinely unknown — a loopback-looking address for an unknown caller
  is the failure this replaced. The gateway also forwards the client port (`x-forwarded-port`, read with
  `context.getClientPort()`) along with host and protocol.
- **Every socket carries a `socketId`, and only the framework mints one.** `AppWsData` assigns it at the handshake, and a `message` / `pubsub` handler reads it off the `Ws` internal arg — `.with(Ws)` hands `{ ws, socketId, subscribe, on, off }`. Never mint your own from `ws.data`: the room bookkeeping keys on the framework's id, and a second one fails to match it silently. It identifies a **connection**, not a caller — a reconnect gets a new id and the federation gateway's own socket is a different one — so per-user state keys on the account, never on this.

- **A cleanup registered with `ws.on("disconnect" | "unsubscribe", fn)` is scoped to the call that registered it.**
  From a `pubsub` subscribe it belongs to that room — `unsubscribe` runs when the client leaves it or a credential
  change revokes it, `disconnect` when the socket closes while still subscribed — so a room already left runs
  neither again, and cleanup that must happen either way registers for both. From a `message` handler it belongs to
  the socket and runs at close. A handler that throws is logged and never blocks the rest of the teardown.

## Binary Pubsub

- **`pubsub(Binary)` sends its payload in a websocket binary frame**, skipping the JSON `{ type: "pub" }`
  envelope and the base64 a JSON wire would need. The client's subscribe callback receives a `Uint8Array`.
  Nothing else is declared: the return type is the whole switch, and text and binary frames coexist on one
  socket, so every JSON endpoint is untouched. The optimization applies only when the **whole** return is
  `Binary` — `[Binary]`, or a `Binary` inside a model, falls back to base64.
- **A declared `Binary` room coalesces under backpressure**: while a socket cannot keep up the room keeps only
  its newest frame and drops the rest, which is what a telemetry or video stream wants. Declare
  `pubsub(Binary, { backpressure: "queue" })` when the frames are a sequence a subscriber must see in full, such
  as deltas against a base it already holds; the send buffer then grows with the slowest subscriber. Coalescing
  is keyed by the endpoint, not carried with the frame, so this process, an IPC deliver and a Redis fan-out all
  reach the same answer. Coalesced frames are counted in `pubsubCoalesceCount` on the replica's metrics report.
- **A `pubsub(Any)` that happens to carry bytes is framed too, and warns once.** `Any` passes a `Buffer` through
  untouched, so the transport sees bytes and sends them whole rather than as a number array — an undeclared
  publisher is fixed rather than left corrupt. It is still not the contract: it queues rather than coalescing
  (nobody declared lossy delivery for that room), and a Redis fan-out still JSON-stringifies it. Declare
  `Binary`.
- The federation gateway relays a binary frame unchanged, and Bun IPC carries bytes as bytes, so the only hop
  that needed teaching was the socket itself. A cross-server (Redis) fan-out encodes it as protobuf `bytes`.

## Mutation HTTP Verb

- A `mutation` is `POST`. `{ method: "PATCH" | "PUT" | "DELETE" }` moves it, and one path may carry several verbs
  — a `query` GET and a `mutation` POST on the same custom `path` are mounted side by side. Two endpoints claiming
  the same path **and** verb fail the boot rather than silently shadowing one another.
- Reach for it only when a foreign wire protocol forces the verb (a client you cannot change that sends
  `PATCH /rest/v1/<table>`). Akan's own `fetch.*` client, the OpenAPI document, and the API explorer all follow
  whatever is declared, so nothing needs restating per caller.

