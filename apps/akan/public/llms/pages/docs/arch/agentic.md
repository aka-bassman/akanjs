# In-Page Agent

- Source: /docs/arch/agentic
- Mirror: /llms/pages/docs/arch/agentic.md
- Section: docs
- Category: Architecture
- Priority: P2

## Headings

- In-Page Agent (#agent-overview)
- Mount and Secure (#agent-mount)
- The Derived Surface (#agent-surface)
- Zone Agents (#agent-zones)
- Swapping the Model (#agent-llm)

## Content

In-Page Agent

Every Akan app can host a chat agent that reads the rendered screen and drives it — the assistant on this very page is one. Tools, state, and context are derived from what is actually on screen, not declared by hand: a store joins the agent's surface only while a mounted component is reading one of its keys, so most screens publish a complete surface with zero agent code.

One mount

<Agent.Chat /> in a layout is the whole integration — launcher, transcript, approval card, and a streaming loop.

Tools run in the browser

The server is a stateless relay that never executes a tool. Every action runs in the caller's own session, gated by guards and the approval card.

Framework built-in

The relay endpoint, the DeepSeek adaptor, and the chat UI all ship with akanjs — no extra library to mount.

Mount and Secure

Mount the chat once in a layout. The relay endpoint runAgentTurn is served by the framework on every app (option.setLlm gives it a key; AKAN_AGENT=false removes the whole surface). Its guard AgentRelayAccess allows everyone until a policy is registered — a product with accounts locks it in the same option.ts, or anonymous visitors can spend the LLM key.

The same endpoint answers streaming: the chat negotiates text/event-stream, so assistant text arrives as it is generated with zero app code. persist keeps the transcript across reloads in sessionStorage ({ storage: "local" } to outlive the tab); it is off by default.

The Derived Surface

While a mounted component reads a store key through st.use, st.sel, or st.ref, that store's catalogued actions and state are published to the agent. Leave the screen and they withdraw on the next turn. Three built-ins ride every surface: navigate (internal paths only), readScreen (the rendered DOM as compact text — what answers "summarize this page"), and readState(key) (one masked store key).

Exposure is the store author's to trim: static agent = false takes a whole store off the surface, static agent = { exclude: [...] } withholds named entries, and st.use.x({ agent: false }) subscribes without counting. hidden and secret fields never cross the boundary — a value with no model to mask by is refused at read.

Zone Agents

One screen can run several agents in parallel. Wrap a section in Agent.Zone and everything mounted inside — subscriptions, hook tools, guides — belongs to that zone's own conversation as well as to the root agent: zones are views of the screen, never walls between its parts. A zone's readScreen reads only its own container, and an Agent.Chat mounted inside binds to the zone session automatically.

Guides follow the layout cascade: a zone reads its ancestors' guidance plus its own, and never a sibling's. The root chat outside the zones keeps seeing the whole screen, so wrapping a section costs the root agent nothing.

Swapping the Model

Everything the model needs is declared in option.ts, never in the environment: setLlm fills apiKey, model, and host for whichever adaptor holds the role, so the settings survive a provider swap. DeepSeek is the built-in default. Any other provider is one adaptor away: implement LlmAdaptor as an adapt() class and rebind the role in the same file — the one-line pattern applyMiddleware uses.

An adaptor implements one method — chat(request, onDelta?) — the whole transcript in, one assistant answer out. Ignore onDelta and the chat still works; report deltas and streaming lights up for free.

## Code Examples

### apps/<app>/page/_layout.tsx · apps/<app>/lib/option.ts

```ts
// page/_layout.tsx — the whole integration
<Agent.Chat persist />

// lib/option.ts — give the relay a key, and lock it for a product with accounts
export const option = new AkanOption<ModulesOptions>()
  .setLlm((options) => options.llm ?? {})
  .setAgentAccess((context) => !!context.get("account"));
```

### lib/<model>/<model>.store.ts · component hooks

```ts
// A store trims its own exposure
export class MapStore extends store(cnst.map, () => ({ ... })) {
  static override agent = { exclude: ["setMapBounds", "mapCamera"] };
}

// A component publishes screen-only levers — .exec() is the one hook in the chain
st.expose("selectedWaypointId", selected?.id ?? null);
st.tool("focusWaypoint", { desc: "Center the map on one waypoint." })
  .arg("waypointId", ID)
  .exec((waypointId) => focusOn(waypointId));

// Route-scoped guidance — the render tree is the cascade
<Agent.Guide instructions="This screen edits the weekly flight plan. Prefer updateWaypoint over raw setters." />
```

### two zones, two parallel conversations

```ts
<Agent.Zone id="comments" label="Comment management" instructions="Moderate the comment queue." persist>
  <Comment.Zone.Board init={commentInit} />
  <Agent.Chat className="static" />
</Agent.Zone>

<Agent.Zone id="posts" label="Post management">
  <Post.Zone.Editor init={postInit} />
  <Agent.Chat className="static" />
</Agent.Zone>
```

### apps/<app>/lib/option.ts

```ts
import { LlmAdaptorRole } from "akanjs/service";
import { ClaudeLlm } from "../srvkit";

export const option = new AkanOption<ModulesOptions>()
  // The key belongs in the app's own env object, which is gitignored — never in this file.
  .setLlm((options) => ({ ...options.llm, model: "claude-sonnet-5" }))
  .applyAdaptor(LlmAdaptorRole, ClaudeLlm);
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.

