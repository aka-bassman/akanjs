# model.signal.ts

- Source: /conventions/module/signal
- Mirror: /llms/pages/conventions/module/signal.md
- Section: conventions
- Category: Domain
- Priority: P1

## Headings

- model.signal.ts (#signal-overview)
- Extending Generated Signals (#signal-extension)
- Defining Internal Tasks (#internal-signal)
- Defining Public APIs (#endpoint-signal)
- The Options Object (#endpoint-options)
- What An Argument May Be (#argument-types)
- Standard Model APIs (#standard-signal)
- Defining Slices And Stores (#slice-signal)
- Practical Rules (#practical-rules)

## Content

model.signal.ts

Runs in declaration order after every middleware; the first refusal wins. An empty list is a loop that never runs, not a default policy. It is also the MCP exposure decision.

Bounds both ends: the Timeout middleware rejects the call with base.error.gatewayTimeout, and the same value is serialized to the client as that call's request budget. Losing the race does not cancel the work — the handler runs to completion with nobody holding its result.

Only a query taking no internal argument may carry one — an endpoint that learns who is asking would hand one caller's answer to the next. Guards run on every hit, and resolveReturn still masks per call. A cache backend that is down is warned about and the call runs uncached.

An opt-out from the agent catalogue that leaves the guards alone. Curation, not authorization: HTTP serves the endpoint exactly as before. Reach for it on a step of a UI-driven state machine that is perfectly guarded and still a mistake for a model to reach.

A mutation only; declared on a query or a realtime endpoint it is ignored and named in the boot log. One path may carry several verbs, and two endpoints claiming the same path and verb fail the boot. Reach for it only when a foreign wire protocol forces the verb.

Marks the one mutation that is the framework's upload endpoint. The generated upload action refuses to run when no endpoint carries it, and warns when more than one does. The shared file library already marks one.

A literal route, for a protocol that looks in a fixed place. A trailing * captures the rest of the path.

Drops or replaces the module segment Akan puts in front of the path.

Drops the api segment, which puts the route at the origin root. Needed together with prefix for a well-known document.

The return may be null. Without it, a handler resolving to null raises rather than answering one.

A pubsub(Binary) room under load: keep only the newest frame, which is what telemetry and video want, or queue every one when the frames are a sequence a subscriber must see in full.

Appended after the registered chain, for this endpoint only.

Calculates a resolved field declared in the constant model. The parent document is passed to exec by default.

Runs a recurring server task every given number of milliseconds.

Runs scheduled work with a cron expression. Commonly used with serverMode options for batch jobs.

Runs setup or teardown logic when the server process starts or stops.

Defines a background queue job. Use msg(...) to describe the job payload.

Runs once, this many milliseconds after the process starts. Locked by default like the other timers, so two replicas do not both run it.

Read API. Use it for loading one model, computed data, or public files.

Write API. Use it for create, update, delete, or business actions.

WebSocket message handler. Use msg(...) for incoming payload fields.

Realtime subscription channel. Use room(...) to describe the subscription room. A Binary return sends raw bytes in a websocket binary frame and coalesces under backpressure; name backpressure: "queue" when every frame has to arrive.

Required path-style argument. Common in query, mutation, and slice list methods.

Optional search/query argument. It is nullable by default.

Request body value, commonly used by mutation APIs.

Message or process payload argument.

Realtime room key for pubsub subscription channels.

Server-derived context such as Self, Req, Res, Ws, or custom internal args.

Fetch detail-view data generated from the model module. Returns a handle: destructure it for one promise per field, or await it for the resolved object.

Fetch edit-view data generated from the model module. Same handle shape as view[Model].

Create or update model data through the generated module API.

Loads a paginated list for a slice definition.

Loads aggregation data for the same slice query.

Initializes the root slice list with list and insight data. queryKey names one of the model's own filters and args are that filter's arguments; no key at all is the any filter. Both queries leave at call time, and the handle hands out storyInit, storyList, and storyInsight as separate promises.

Initializes a named slice list with args declared in signal.ts. Pass storyInitInRoot to a Zone; consume storyListInRoot on the server, since it holds hydrated model instances.

Signals define the external interface of a module. They connect service logic to generated client APIs, list stores, realtime channels, and server-side jobs.

Server-only work such as resolved fields, cron jobs, lifecycle hooks, and background processes.

Public APIs and realtime handlers exposed through fetch, websocket message, or pubsub.

Frontend-facing list surfaces used by generated stores, pagination, and insight loading.

Extending Generated Signals

When an app domain extends generated or library behavior, spread inherited signals at the end. This keeps base internals, slices, and endpoints while adding app-specific methods.

Defining Internal Tasks

Use internal() for work that belongs to the server runtime rather than a direct page call. This includes resolved fields, scheduled tasks, lifecycle hooks, and queue jobs.

Defining Public APIs

Use endpoint() for API methods that the client can call. Endpoint builders cover read/write APIs and realtime surfaces.

Parameter builders describe where each value comes from. The order becomes the order of exec arguments. Put nullable arguments near the end because required arguments cannot follow nullable ones.

A slice-level guards map only reaches the generated query and mutation endpoints. A message or pubsub endpoint is unguarded unless it declares its own guards, and its guards are re-run whenever the socket's credential changes.

Use endpoint options when a method should be exposed at a public path, such as sitemap.xml or other non-standard API routes.

Generated fetch methods call endpoint methods from page loaders, components, stores, or client actions.

The Options Object

The second argument to query, mutation, message and pubsub is the same object in all four, and it is where an endpoint declares everything about itself that is not an argument. Most of it decides what happens before your handler runs.

What runs before exec

Logging, Timeout and Cache are registered by default and stand aside for every endpoint that declares nothing, so the chain costs nothing until an option turns one of them on. Guards run last, inside the handler's own wrapper — which is why a cache hit has to re-run them explicitly rather than skipping them with the handler.

What An Argument May Be

Every parameter builder takes the same kinds of type: a registered scalar, a model reference, an enumOf class, or an array of one of those. Three of the mistakes are worth knowing in advance, because two of them are not type errors.

Int or Float, never Number

String, Boolean and Date are monkey-patched into scalars and pass; the Number constructor is deliberately left alone, so it is not in the accepted union and the call does not typecheck. Choose the one the field actually is — a count is Int, a price is Float.

Upload is a body, never a field

An Upload body argument on a mutation is what switches request parsing to multipart, and the mutation that owns the upload flow declares fileUpload: true. A model never declares one — an image or file field is a relation to the File model instead.

Bytes are Binary, never Any

Binary is Uint8Array on both sides and accepts base64 in either direction, so one declaration serves a JSON body and a websocket binary frame. Any passes a Buffer through untouched, and JSON.stringify then spells it as a type-and-data object that JSON.parse never restores — 3.6x the wire and a shape that only breaks at the first byte-offset read.

Standard Model APIs

Akan generates standard model APIs for common view, edit, and merge flows. You usually add custom endpoints only when the business action needs its own name or behavior.

Defining Slices And Stores

Use slice() to define list surfaces for pages. A slice starts from init(), receives params, search values, or internal args, and returns a service query.

Root guards apply to the generated slice surface. Method guards passed to init({ guards }) narrow a specific list.

A slice definition generates list, insight, and init fetch methods. These methods are usually consumed by store and zone UI code.

Practical Rules

Use ...model.internals, ...model.slices, and ...model.endpoints when extending generated or library domains.

Use srv.model.with(otherSrv) when the signal needs another service in this.*Service.

An endpoint that names a real guard is reachable by an AI agent; one that names none is not. There is no per-endpoint opt-in — mcp: false only opts an already-guarded endpoint out, and on a slice mcp: { cru: false } mirrors the guards map for the root slice and generated CRUD.

There is no prompt builder on endpoint(). A screen is published as an MCP prompt from its page file with page().prompt(name, description). See the MCP Server cheatsheet.

## Code Examples

### story.signal.ts

```ts
export class StoryInternal extends internal(srv.story, () => ({})) {}

export class StorySlice extends slice(srv.story, { guards: { root: Admin, get: Public, cru: Admin } }, () => ({})) {}

export class StoryEndpoint extends endpoint(srv.story, ({ query }) => ({
  story: query(cnst.Story, { guards: [Public] }).exec(async function () {
    return await this.storyService.getStory();
  }),
})) {}
```

### user.signal.ts

```ts
export class UserInternal extends internal(srv.user, () => ({}), ...user.internals) {}

export class UserSlice extends slice(
  srv.user,
  { guards: { root: Admin, get: Public, cru: SelfOrAdmin } },
  () => ({}),
  ...user.slices,
) {}

export class UserEndpoint extends endpoint(
  srv.user,
  ({ query }) => ({
    authCallback: query(String, { guards: [Public] }).search("code", String).exec(async function (code) {
      return await this.userService.authCallback(code);
    }),
  }),
  ...user.endpoints,
) {}
```

### story.signal.ts

```ts
export class StoryInternal extends internal(srv.story.with(srv.actionLog), ({ resolveField, cron }) => ({
  like: resolveField(Int)
    .with(Self, { nullable: true })
    .exec(async function (story, self) {
      if (!self) return 0;
      return await this.actionLogService.getLike(story.id, self.id);
    }),
  cleanup: cron("0 0 * * *").exec(async function () {
    await this.storyService.cleanup();
  }),
})) {}
```

### story.signal.ts

```ts
export class StoryEndpoint extends endpoint(srv.story, ({ query, mutation }) => ({
  story: query(cnst.Story, { guards: [Public] })
    .param("storyId", ID)
    .exec(async function (storyId) {
      return await this.storyService.getStory(storyId);
    }),
  createStory: mutation(cnst.Story, { guards: [Every] })
    .body("data", cnst.StoryInput)
    .exec(async function (data) {
      return await this.storyService.createStory(data);
    }),
})) {}
```

### chatRoom.signal.ts

```ts
export class ChatRoomEndpoint extends endpoint(srv.chatRoom, ({ message, pubsub }) => ({
  readChat: message(Boolean, { guards: [Every] }).msg("root", ID).exec(async function (root) {
    return await this.chatRoomService.read(root);
  }),
  chatAdded: pubsub(cnst.Chat, { guards: [Every] }).room("root", ID).exec(async function () {}),
})) {}
```

### site.signal.ts

```ts
export class SiteEndpoint extends endpoint(srv.site, ({ query }) => ({
  sitemapXml: query(Any, { guards: [Public], path: "sitemap.xml", prefix: false }).exec(async function () {
    return new Response(null, { headers: { "Content-Type": "application/xml" } });
  }),
})) {}
```

### page.tsx

```ts
const story = await fetch.story(storyId);
const created = await fetch.createStory(data);

await fetch.readChat(rootId);
const unsubscribe = fetch.subscribeChatAdded(rootId, (chat) => {
  console.info(chat);
});
```

### story.signal.ts

```ts
export class StorySlice extends slice(srv.story, { guards: { root: Admin, get: Public, cru: Admin } }, (init) => ({
  inRoot: init({ guards: [Public] }).param("root", ID).exec(function (root) {
    return this.storyService.queryInRoot(root);
  }),
})) {}
```

### page.tsx

```ts
const { storyInitInRoot, storyListInRoot } = fetch.initStoryInRoot(rootId);

<Story.Zone.Card init={storyInitInRoot} />
<Load.Stream of={storyListInRoot}>{(storyList) => <Story.Unit.Total count={storyList.length} />}</Load.Stream>
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Treat convention and generated-file rules as stronger than local style guesses.

