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
- Skipping A Region (#agent-skip)
- Showing the Work (#agent-visual)
- Swapping the Model (#agent-llm)

## Content

In-Page Agent

Every Akan app can host a chat agent that reads the rendered screen and drives it — the assistant on this page is one. What it may do is what a component declared, and what it may read is what a component subscribed. A store class publishes nothing on its own: an agent presses the controls the screen already offers the user, and never a lever the screen does not have.

One mount

<Agent.Chat /> in a layout is the whole integration — launcher, transcript, approval card, and a streaming loop.

Tools run in the browser

The server is a stateless relay that never executes a tool. Every action runs in the caller's own session, gated by guards and the approval card.

Framework built-in

The relay endpoint, two LLM adaptors, and the chat UI all ship with akanjs — no extra library to mount.

Runtime Map

Mounted st.use / st.sel / st.ref keys, hook tools, and Agent.Guide text.

The loop, the approval card, and its own /new · /retry · /compact · /copy · /help · /tools — the only slash commands it lists.

A stateless HTTP relay. It spends the LLM key and never runs a tool.

The whole transcript in, one assistant answer out. OpenaiLlm is the default and speaks the chat-completions dialect to whatever host is named; AnthropicLlm ships beside it for the Messages API.

External agents that call your domain over HTTP use the MCP server instead — a different catalogue, derived from signal guards.

MCP Server

Mount and Secure

Mount the chat once in a layout. The framework serves runAgentTurn on every app. option.setLlm gives it a key; AKAN_AGENT=false removes the whole surface.

AgentRelayAccess refuses every call until a guard is registered — the same answer None gives. Without one the chat cannot spend the LLM key. A product with accounts names its own guard in the same option.ts, as it would on any other endpoint.

Keeps the transcript across reloads in sessionStorage. Pass { storage: "local" } to outlive the tab. Off by default.

The same endpoint answers text/event-stream. Assistant text arrives as it is generated, with zero app code.

App-global framing on Agent.Chat. Route-scoped guidance layers on through mounted Agent.Guide.

The composer attaches images and text files on its own; attach is where an app reads what needs a parser, like a PDF's text, or uploads the file and answers a url. Nothing is stored — the bytes ride one turn's request, and a reloaded transcript keeps the name without the content. The ceilings are the message's rather than the file's — 4 MB per file, 8 MB and five files per message, and the same file twice refused by name — because what a provider refuses is the sum, and a request that cannot be sent is one the user has to empty the composer to escape. They are measured on what attach produced, so a url costs nothing, and attachLimits raises them for a provider that carries more.

A press-to-talk microphone whose transcript lands in the composer to be corrected, and a reply read aloud one sentence at a time — but only when the ask itself came in by voice, so a typed question never turns the speakers on. useSpeech from @libs/util/webkit is the engine: the browser's own recognition on the web, Capacitor plugins in a WebView, which has neither.

attach and voice carry functions, and a function cannot cross the RSC boundary — so a server layout cannot pass either. Mount the chat from a small client component in ui/ that calls the hook, the way apps/akan/ui/DocsAgentChat.tsx does.

The Declared Surface

st.tool publishes one action and hands back the callable you wire to onClick, so the agent and the user press the same handler. st.use, st.sel, and st.ref make one store key readable while the component reading it is mounted. Unmount and both withdraw on the next turn.

Six tools are on every screen whatever it declares:

Internal paths only, the same router Link rides.

The previous page in this session's history. Global like navigate, because history is not a control a page owns — a page that draws no back link is not a page you may not leave.

The rendered DOM as compact text. Headings carry their anchor and a truncated read names the sections below the cut, so a long screen stays reachable: pass one of those names — or a heading's own text — as section. Every image is named whether or not it has an alt; images: true appends each one's address, off by default because a gallery is one long URL per thumbnail.

One masked store key.

Scrolls one thing into view and flashes it once the scroll lands, so the agent can show the user where a thing is instead of describing where it is. The target is a tool name, a state key, a scope path, an anchor, or a heading's text. Nothing hidden ever resolves.

Hands a decision back to the user. The turn parks on the question card until they pick an option or write their own answer; dismissing it is an error the agent reads, never a silent empty answer.

A tool that changes the screen waits for the screen before it answers: router.push returns while the payload is still in flight, so navigate — and the session, after every tool that did not declare itself a read — waits for the DOM to hold still before reporting; the reading built-ins declare it, so a turn that only looks around pays nothing. One turn carries every call the model made in it: they run in order and come back as one tool message, so a batch costs one model round trip where the same calls chained one per turn cost a round trip and a resend of the whole transcript each. And the turn cap is a question rather than a dead end: at maxTurns the agent asks whether to keep going, and what the user types instead rides as their own turn.

Long work is awaited, not polled. The session awaits a tool's own promise, so a .exec that awaits the store action finishing the job simply makes the turn take that long — and the change report that follows carries whatever landed, so the model needs no second call to read it. A tool that returns early leaves the agent to ask again and again, one round trip per look, which burns the whole maxTurns budget in seconds on a job measured in minutes. Say so in the desc. For the job a tool cannot await — one started in an earlier turn, or by a person clicking the button — declare a waiting tool of your own beside the control that starts the work: a general built-in wait was tried and removed, because a tool reachable on every screen with no idea what any key means gets spent on whatever key looks promising, parking turns nobody asked to park. Stop reaches a tool that is still running: the session races every call against its abort signal, and the signal itself arrives through AgentAbort.current, the same module slot AgentProgress is. Honouring it is optional, since the race lands whatever the tool does; what it buys is the tool's own cleanup. Import both from akanjs/store — an app may not reach use-agentic directly. A stopped turn answers the calls it never ran: every provider dialect refuses an assistant message whose tool_calls have no results, on that turn and on every later one, so Stop landing between a call and its result would otherwise leave a transcript nothing can be sent from.

The chat answers six commands of its own, and they are the whole / menu: /new (/clear), /retry, /compact, /copy, /help and /tools. An app writes none of them and cannot add one — there is no app-defined slash command in the in-page chat. A screen a model should read is published from its page instead, with page().prompt(), and reaches MCP clients as a prompt rather than this menu. /new and /copy work mid-turn and ahead of the question card, so /new ends the turn it is clearing instead of being answered into it as text. A command's output is a local message — rendered in the transcript, withheld from the wire, because the transcript is the model's history and text appended plainly would come back next turn as something the assistant believes it said. /copy exists because nothing else keeps the transcript: the relay is stateless, so an export is the one path a wrong answer has to whoever could fix it. And ↑ walks back through what was sent, ↓ forward — seeded from the transcript, so a persisted chat does not lose only what was just typed — while the / menu takes those keys whenever it is open: Enter picks the highlighted row, Tab completes its name, and Escape closes the menu and then the panel.

A long conversation summarizes itself, because nothing else keeps it inside the model's window: the loop runs in the browser and the relay holds no session, so an uncompacted chat grows until the provider refuses the whole request. Past compact.at estimated tokens the history above the last keep messages becomes one message standing in for it — before the turn that would have overflowed, since a provider answers an over-long request with a refusal rather than a shorter answer. The cut only ever lands on a user message, so the kept half never opens with a tool result whose call was summarized away. The summarizing turn carries no tools and no screen context, and is fed a bounded digest rather than the transcript itself, which is the one thing already known not to fit. compact={{ at, keep }} on Agent.Chat tunes it per provider, { at: 0 } turns it off, and /compact does the same on demand keeping nothing.

Reading is per key, not per store: a key the screen does not read stays unreadable even while a sibling key of the same store is live, and every read is masked by the model that key declares. hidden and secret fields never cross the boundary. Base-store plumbing is subscribed with `{ agent: false }` so routing and the caller's credential stay off the surface; a component that wants an agent to read a base key opts it in, as ThemeToggle does for theme.

The only way an action reaches an agent. desc is required and comes first; arg is what the caller must pass and opt what it may. Both take a scalar, an enum, or one array level of either — [String], [TaskStatus] — so a list never has to be taught as a string format. Returns the callable to wire to onClick; a remove* name confirms by default.

Derived values and local state. The declared type typechecks what you hand over and masks how it reads — a model class strips its own hidden, secret, and visual fields; Any passes untouched. Read-only unless set: true.

Subscribes without joining the surface. There is no store-level exposure switch — a store class says nothing about agents.

Zone Agents

Wrap a section in Agent.Zone and everything mounted inside — subscriptions, hook tools, guides — belongs to that zone's own conversation as well as to the root agent. Zones are views of the screen, never walls between its parts. A zone's readScreen reads only its own container, and an Agent.Chat mounted inside binds to the zone session automatically.

Guides follow the layout cascade: a zone reads its ancestors' guidance plus its own, and never a sibling's. The root chat outside the zones keeps seeing the whole screen, so wrapping a section costs the root agent nothing.

Skipping A Region

readScreen reads the whole rendered screen, and a footer, a cookie banner, or a nav that repeats on every route costs the same tokens as the content — on that read and on every later turn, since the read stays in the transcript. Agent.Skip leaves a region out of the default read.

What stands in its place is a named marker, never nothing. A deleted region reads as an absent one — an agent asked about the footer would answer that the page has none. The name in the marker is a section, so naming it reads the region after all: the marker is what the default read leaves out, not a wall.

It hides text, not behaviour. Tools and state keys are declarations rather than markup, so an st.tool declared inside is published exactly as before and highlight still reaches a control in there. This is field.visual one layer up: cost, not secrecy.

Reach for it second. A read is scoped from the other side too: Agent.Zone and readScreen({ section }) narrow to one container, which beats blocklisting five regions on a screen that is mostly chrome. And a footer is last in the document, so on a page long enough to truncate it was already past the cut — the regions worth marking are the ones above the content.

Showing the Work

The transcript says what the agent did, and it is behind a panel that is closed as often as it is open. So the page says it too: the control a call was published from is ringed where it stands, scrolled to first when it is off screen, and a pointer travels to it and presses it. It costs an app nothing for the same reason data-akan-action does. The onChange={st.do.setTitleOnTask} reference that publishes the tool is what annotates the control, and the annotation is what makes it findable, so an inline arrow silently costs three things at once.

The pointer's unit is the turn, not the call. A model's calls arrive with its own writing between them — seconds each — so a pointer that lived for the length of a call spent every turn vanishing and coming back. It stays for as long as the turn runs: it appears at the first control it presses, drifts clear of it and waits there as a spinner, and fades when the turn ends. Clearing the control is the whole of that gesture — a person clicks and takes the hand away, and a spinner left sitting on the button covers the very change it caused. A turn that drove no control draws no pointer at all, which is the honest answer: an agent that only answered a question was never on the screen. While a reveal scrolls the page to the next control, the pointer holds still the way a person's does, and carries a chevron pointing the way the view is travelling — stillness over a sliding page otherwise reads as a pointer that has come loose rather than as the one doing the scrolling.

What it refuses to draw is the point. A name several rows answer to rings nothing unless the call's own argument names which one — a tab's menus share one tool, so each menu carries its key and the pointer picks the one that was switched to. A call an approval or a guard turned back is never drawn at all, a control the screen is not actually showing is not pointed at — under a modal's backdrop, inside a drawer that has slid off, faded to nothing — and a backgrounded tab draws nothing. A ring on the wrong element is worse than no ring: it is the screen telling the user something untrue about what just happened. Almost nothing is waited on either — the call starts the moment the effect is handed its event, because an animation that held a call would make the agent slower for a decoration.

It draws where the change landed and nowhere else. A call that reaches no control on screen draws nothing at all — navigate mostly included, since the router is not an element and a bar across the top of the page read as chrome the page had grown rather than as the agent doing something. But a destination the screen already offers as a link is an element, and that one is pressed: when exactly one visible link goes where the navigation is going, the pointer travels to it and clicks it before the route moves. That is the only call the runtime waits for, capped at 600ms, because a click drawn on a tree the router has already replaced is no click at all. Link presence decides what is drawn, never what is allowed — the agent may go anywhere the user could type.

Below is the thing itself. Both buttons hand their st.tool callable straight to Button's onClick, which is the whole of what makes them findable — ask the agent to count up three times and reset, and watch where it presses.

Swapping the Model

Everything the model needs is declared in option.ts, never in the environment. setLlm fills apiKey, model, host, accepts and maxTokens for whichever adaptor holds LlmAdaptorRole, so the settings survive a provider swap — and it keeps whatever else it is handed, so an adaptor you wrote reads its own fields from the same place with use<MyLlmOption>(). Two adaptors ship, one per wire. OpenaiLlm is the default and speaks the chat-completions dialect to whatever host names: OpenAI, DeepSeek, Groq, OpenRouter, Ollama. AnthropicLlm is the Messages API and reads a PDF as well as a picture. Both require a model, since a default would age into a 404 and would decide the vision claim for the app. accepts overrides what the configured model reads, because an adaptor answers for an API and one API serves models that differ. With no apiKey the app still boots and the chat says no model is configured; a refusal the provider explained is thrown instead of swallowed, so the chat prints that reason in the user's language.

An adaptor implements one method — chat(request, onDelta?). The whole transcript goes in, one assistant answer comes out. Rebind the role the way applyMiddleware rebinds middleware: last writer wins.

## Code Examples

### apps/<app>/page/_layout.tsx · apps/<app>/lib/option.ts

```ts
// page/_layout.tsx
<Agent.Chat persist />

// lib/option.ts — the key lives in env, which is gitignored
import { SignedIn } from "../srvkit";

export const option = new AkanOption<ModulesOptions>()
  .setLlm((options) => options.llm ?? {})
  .setAgentAccess(SignedIn);
```

### <Model>.Zone.tsx — the tool and the button are one declaration

```ts
const waypointList = st.use.waypointList();
const publish = st.tool("publishPlan")
  .desc("Publish the flight plan being edited.")
  .exec(() => st.do.publishPlan());
const focusWaypoint = st.tool("focusWaypoint")
  .desc("Center the map on one waypoint.")
  .arg("waypointId", ID)
  .opt("zoom", Int)
  .exec((waypointId, zoom) => st.do.selectWaypoint(waypointId, zoom));

st.expose("selectedWaypointId", ID)
  .desc("The waypoint the map is centered on.")
  .value(selected?.id ?? null);

<Button onClick={publish}>{l("plan.publishPlan")}</Button>
<Agent.Guide instructions="This screen edits the weekly flight plan. Focus a waypoint before editing it." />
```

### two zones, two parallel conversations

```ts
<Agent.Zone id="comments" label="Comment management" instructions="Moderate the comment queue." persist>
  <Comment.Zone.Board init={commentInit} />
  <Agent.Chat inline />
</Agent.Zone>

<Agent.Zone id="posts" label="Post management">
  <Post.Zone.Editor init={postInit} />
  <Agent.Chat inline />
</Agent.Zone>
```

### a region marked, and what the read prints instead

```ts
<Agent.Skip label="site footer">
  <Footer />
</Agent.Skip>

// Or on the element the page already renders, where a wrapper div would move a flex or grid layout:
<footer id="footer" data-agent-skip="site footer">…</footer>

// readScreen then prints this in place of the whole region:
// [skipped: site footer (#footer)]
```

### apps/<app>/page/_layout.tsx

```ts
<Agent.Chat visual={false} />

<Agent.Chat visual={{ cursor: false }} />
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

