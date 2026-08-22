# In-Page Agent

- Source: /docs/arch/agentic
- Mirror: /llms/pages/docs/arch/agentic.md
- Section: docs
- Category: Architecture
- Priority: P2

## Headings

- In-Page Agent (#agent-overview)
- Mount and Secure (#agent-mount)
- The Declared Surface (#agent-surface)
- Zone Agents (#agent-zones)
- Swapping the Model (#agent-llm)

## Content

In-Page Agent

Every Akan app can host a chat agent that reads the rendered screen and drives it — the assistant on this page is one. What it may do is what a component declared, and what it may read is what a component subscribed. A store class publishes nothing on its own: an agent presses the controls the screen already offers the user, and never a lever the screen does not have.

One mount

<Agent.Chat /> in a layout is the whole integration — launcher, transcript, approval card, and a streaming loop.

Tools run in the browser

The server is a stateless relay that never executes a tool. Every action runs in the caller's own session, gated by guards and the approval card.

Framework built-in

The relay endpoint, the DeepSeek adaptor, and the chat UI all ship with akanjs — no extra library to mount.

Runtime Map

Mounted st.use / st.sel / st.ref keys, hook tools, and Agent.Guide text.

The loop, the approval card, and slash commands from prompt() endpoints.

A stateless HTTP relay. It spends the LLM key and never runs a tool.

The whole transcript in, one assistant answer out. DeepSeek is the default.

External agents that call your domain over HTTP use the MCP server instead — a different catalogue, derived from signal guards.

MCP Server

Mount and Secure

Mount the chat once in a layout. The framework serves runAgentTurn on every app. option.setLlm gives it a key; AKAN_AGENT=false removes the whole surface.

AgentRelayAccess refuses every call until a policy is registered — the same answer None gives. Without a policy the chat cannot spend the LLM key. A product with accounts locks it in the same option.ts.

Keeps the transcript across reloads in sessionStorage. Pass { storage: "local" } to outlive the tab. Off by default.

The same endpoint answers text/event-stream. Assistant text arrives as it is generated, with zero app code.

App-global framing on Agent.Chat. Route-scoped guidance layers on through mounted Agent.Guide.

The Declared Surface

st.tool publishes one action and hands back the callable you wire to onClick, so the agent and the user press the same handler. st.use, st.sel, and st.ref make one store key readable while the component reading it is mounted. Unmount and both withdraw on the next turn.

Three tools are on every screen whatever it declares:

Internal paths only, the same router Link rides.

The rendered DOM as compact text. The chat's own UI is skipped; a password value is never read.

One masked store key.

Reading is per key, not per store: a key the screen does not read stays unreadable even while a sibling key of the same store is live, and every read is masked by the model that key declares. hidden and secret fields never cross the boundary. Base-store plumbing is subscribed with `{ agent: false }` so routing and the caller's credential stay off the surface; a component that wants an agent to read a base key opts it in, as ThemeToggle does for theme.

The only way an action reaches an agent. Returns the callable to wire to onClick; a remove* name confirms by default.

Local state and derived values, read-only unless set: names a type.

Subscribes without joining the surface. There is no store-level exposure switch — a store class says nothing about agents.

Zone Agents

Wrap a section in Agent.Zone and everything mounted inside — subscriptions, hook tools, guides — belongs to that zone's own conversation as well as to the root agent. Zones are views of the screen, never walls between its parts. A zone's readScreen reads only its own container, and an Agent.Chat mounted inside binds to the zone session automatically.

Guides follow the layout cascade: a zone reads its ancestors' guidance plus its own, and never a sibling's. The root chat outside the zones keeps seeing the whole screen, so wrapping a section costs the root agent nothing.

Swapping the Model

Everything the model needs is declared in option.ts, never in the environment. setLlm fills apiKey, model, and host for whichever adaptor holds LlmAdaptorRole, so the settings survive a provider swap. DeepSeek is the built-in default — deepseek-v4-flash at https://api.deepseek.com. With no apiKey the app still boots and the chat answers llmUnavailable.

An adaptor implements one method — chat(request, onDelta?). The whole transcript goes in, one assistant answer comes out. Rebind the role the way applyMiddleware rebinds middleware: last writer wins.

## Code Examples

### apps/<app>/page/_layout.tsx · apps/<app>/lib/option.ts

```ts
// page/_layout.tsx
<Agent.Chat persist />

// lib/option.ts — the key lives in env, which is gitignored
export const option = new AkanOption<ModulesOptions>()
  .setLlm((options) => options.llm ?? {})
  .setAgentAccess((context) => !!context.get("account"));
```

### <Model>.Zone.tsx — the tool and the button are one declaration

```ts
const waypointList = st.use.waypointList();
const publish = st.tool("publishPlan", { desc: "Publish the flight plan being edited." })
  .exec(() => st.do.publishPlan());
const focusWaypoint = st.tool("focusWaypoint", { desc: "Center the map on one waypoint." })
  .arg("waypointId", ID)
  .exec((waypointId) => st.do.selectWaypoint(waypointId));

st.expose("selectedWaypointId", selected?.id ?? null);

<Button onClick={publish}>{l("plan.publishPlan")}</Button>
<Agent.Guide instructions="This screen edits the weekly flight plan. Focus a waypoint before editing it." />
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
import { MyLlm } from "../srvkit";

export const option = new AkanOption<ModulesOptions>()
  .setLlm((options) => options.llm ?? {})
  .applyAdaptor(LlmAdaptorRole, MyLlm);
```

### akanjs/service — LlmAdaptor

```ts
export interface LlmAdaptor {
  chat(request: LlmTurnRequest, onDelta?: (delta: string) => void): Promise<LlmTurnAnswer | null>;
}
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.

