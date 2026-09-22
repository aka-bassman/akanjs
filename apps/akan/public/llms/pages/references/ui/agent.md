# Agent

- Source: /references/ui/agent
- Mirror: /llms/pages/references/ui/agent.md
- Section: references
- Category: UI Reference
- Priority: P1

## Headings

- Agent UI (#agent-ui)
- Development Dock (#agent-dock)

## Content

Agent

The chat panel itself — launcher, transcript, composer, approval card. Mount it once.

One subtree with its own conversation over a scoped view of the same surface.

Standing instructions for a route subtree. Renders nothing.

Puts the enclosing session's transcript wherever the app keeps it. Renders nothing.

A region the default screen read leaves out, named so it can still be asked for.

Namespaces every tool and state key below it, without opening a conversation.

The development inspector: tools, readable state, withheld keys, transcript.

The dock's own parts, exported so an app can assemble an inspector of its own.

The whole panel. `bridge` names the store keys and their masking, `surface` where the declared tools live — pass a zone's own to inspect just that zone. `open` opens the Tools section on mount. Renders nothing when `AKAN_PUBLIC_ENV=main`.

An Assemble button that prints exactly what a turn would carry: the published tool names, the mounted guides, and the assembled context blocks. This is where a zone-prefixed tool name becomes visible.

One collapsible `<details>` group with a count beside its title. The dock draws five of them.

One readable state key, read on demand rather than rendered with the rest. Masking happens at read, so a key holding an object no model claims refuses here instead of in the catalogue.

One declared tool with its arguments as JSON, and a Run button that calls it in the running app. Deliberately not a generated form — that is the API explorer's job.

What the agent did, newest last, so a user can check it against what they saw the page do. There is no undo here.

The user-facing half of the in-page agent: one floating chat wired to the surface this screen declared. Mount it once, in a layout. The conversation loop runs in this browser session — every tool call executes here, gated by the approval card — and the relay endpoint never executes a tool. The session lives in a ref, so it survives reopening the panel and dies with the page unless `persist` keeps it. An enclosing `Agent.Zone` or `AgentProvider` session wins, and then every session option below belongs to whoever built that one.

Reaches whichever surface is showing — the launcher while closed, the panel while open.

Panel heading.

App-global framing. Route-scoped guidance layers on top of it through mounted `Agent.Guide`s.

Swaps the transport. The default drives the app's own `runAgentTurn` endpoint; `httpRunner` and `fetchRunner` are the two shipped alternatives.

How many model round trips one ask may spend before the loop stops.

When the conversation summarizes itself to stay inside the model's window — `at` estimated tokens, `keep` messages left verbatim below the summary. `{ at: 0 }` turns it off.

Which of the runtime's own tools this chat gets — all by default, `false` none, an array exactly the ones it names. A chat that must not leave its screen drops `navigate` and `goBack`.

Called after a compaction replaced messages with one summary — where a host syncs its own watermark.

Uncontrolled start state, or controlled open state driven from the app's own control. Given `open` without `onOpenChange` the panel cannot close itself, so it draws no close button at all — and that is also what keeps a controlled chat assemblable by a server component, since `onOpenChange` is the only function among these.

What the page itself draws while the agent drives it: the control a call was published from is ringed where it stands, and a pointer presses it. On by default. `false` draws nothing; `{ cursor: false }` keeps the ring, `{ reveal: false }` keeps the pointer.

`false` draws no launcher, for an app that opens the panel from a control of its own.

Keeps the transcript across reloads — sessionStorage by default, `{ storage: "local" }` to outlive the tab, or a `SessionHistory` of the app's own to keep it anywhere else, a server included.

Renders in the page flow instead of floating above it — a zone chat that lives inside its own section.

`false` gives the browser its own Cmd/Ctrl+L back, for an app whose shell already spends that chord.

One surface each, where `className` reaches both.

Shown in place of the intro line while the transcript is empty — where starter questions go.

Extra header controls, left of the built-in clear and close buttons. `chrome={false}` draws no header bar at all — for an `inline` chat inside a panel the app already titles — and takes the extra controls with it; the clear action stays reachable as the `/new` command.

The composer's opening text, read once at mount — where a `?prompt=` lands without sending it.

Reads a user-attached file into an attachment, or answers `null` to leave it to the built-in reader. A `url` is handed to the provider as the address it will fetch, so answer `data` — or both — whenever the provider cannot reach it. `attachLimits` raises or lowers what the composer accepts per file, per message, and how many.

What the composer's `@` menu can point at — one entry per kind of document a user may name, each carrying its own `search`. `mentions` draws each pointer as the name it points at rather than as the token that carries it; on wherever `reference` sources are declared.

Speech in and out. The engine listens and speaks; the chat decides when — a press-to-talk microphone whose transcript lands in the composer for the user to correct, and a reply read aloud only when the ask itself came in by voice.

`attach` and `voice` carry functions, and a function cannot cross the RSC boundary — so a server layout can pass neither. Mount the chat from a small client component in `ui/` that calls the hook, the way `apps/akan/ui/DocsAgentChat.tsx` does.

The panel is a `lazy(..., { ssr: false })` boundary, so the chunk loads after hydration and the launcher appearing post-mount is normal. The whole surface is configured server-side in `lib/option.ts` — `option.setLlm({ apiKey, model, host })` and `option.setAgentAccess(SignedIn)` — never through the environment.

One subtree with its own conversation over a scoped view of the same surface. Everything mounted inside — hook tools, `st.use` subscriptions, guides — belongs to this zone's session and to the root agent both: zones are views, never walls. An `Agent.Chat` mounted inside binds to this session automatically, so two zones on one screen run two conversations in parallel, each seeing only its own subtree.

Names the zone. The scope id and the `data-agent-zone` container both derive from it.

Human-readable name for the scope, shown wherever the surface is listed.

Zone-scoped guidance, mounted as a `Guide` — so the root agent reads it too by the ancestor rule, and a sibling zone never does.

Same contracts as the chat's own, applied to this zone's session and read once at mount. `builtins={["readScreen", "readState"]}` is how a zone that must not leave the screen stops being able to: the tools are withheld, not discouraged, so a prompt cannot talk the model past it.

Runs this zone on a session the app built instead of one of its own, and the app then owns it: unmounting the zone leaves it running.

Hands the session out once it exists, for a page or store that wants to send into it or watch it.

Everything a zone publishes is named `<id>.<name>`. Instructions that name a tool must carry the prefix — a bare name is a tool that does not exist, and the model calling it spends a turn on `Unknown tool`. Build the name from the id rather than writing it twice, and read `Agent.Context`'s Assemble to see the published list.

Standing agent guidance scoped to a route subtree: render it from a `_layout.tsx` or a page and the text joins the turn's instructions while that subtree is mounted. The render tree is the cascade — each mounted Guide contributes its block, and navigating away withdraws it. Renders nothing.

The text. English, always — this is model-facing, so the `l()` rule for user-facing strings does not apply.

Route guidance is a component, not a route-chain stage: there is no `instructions` field on `page()` or `pageConfig`. `*.abstract.md` is never served to agents either.

Puts the enclosing zone's transcript wherever the app keeps it, as a mounted component rather than a prop. `persist` does the same thing and has to be passed to whoever builds the session, which makes every ancestor up to that point a client component — a function cannot cross the server/client boundary as a prop. Mounted here instead, the only client module an app needs is this leaf. Renders nothing.

The three sides of the store. Written inline is fine — they are read through a ref, so a fresh closure per render does not re-attach and re-fetch.

Where a host with its own server-side summary moves its watermark.

Restoring follows the session's one rule: it lands only while nothing has happened to the conversation yet, so mounting with the zone restores and mounting later saves from there on.

The store is attached for exactly as long as this is mounted. A zone's own session dies with it, but a session the app handed in outlives this and its saving stops on unmount. A host that wants the store to outlive the view calls `session.setHistory` itself, which also takes the slot, so a later unmount here leaves it alone.

A region the default screen read leaves out, for chrome that costs the agent tokens and answers nothing — a footer, a cookie banner, a repeated nav. What stands in its place is `[skipped: <label>]`, so an agent asked about the footer says it did not read one instead of reporting that the page has none, and `section: "<label>"` reads it on request.

What the read prints in place of the region, and the name `section` takes to read it anyway. Required — an unnamed marker tells the agent a region exists and nothing about it.

The region itself.

This hides text, not behaviour. Tools and state keys are declarations, not markup: an `st.tool` inside here is published exactly as before, and `highlight` still reaches a control in here.

It renders a wrapper element, so where a div between a flex container and its children would move the layout, put the attribute on the element the page already renders — `<footer data-agent-skip="site footer">`.

Namespaces every tool and resource registered below it, so list items can reuse local names. It opens no conversation and holds no session — that is `Agent.Zone`, which wraps this. Reach for `Scope` when a repeated subtree needs distinct tool names but shares the screen's one agent.

The prefix. Everything below is published as `<id>.<name>`, nested scopes joining with dots.

Human-readable name for the scope.

What sort of scope this is. `Agent.Zone` opens its own with `kind="zone"`.

The subtree the prefix applies to.

Agent UI

You have a screen full of controls a person can operate, and you would like an assistant on it that can operate the same ones. Not a separate API for robots — the buttons that are already there, pressed under the same guards, with the person watching.

The `Agent` namespace is that surface. One `Agent.Chat` in a layout is the whole integration; everything else on this page narrows it — a subtree with its own conversation, standing guidance for a route, a region the read skips, and a development dock that shows what this screen actually published.

The relay endpoint never executes a tool. Every call runs in the caller's own browser session, gated by the app's guards and the approval card — so a tool exists only where a component declared one, and a lever the screen does not offer the user is not one an agent may pull in their place.

This page is the API surface — every member and its props. The concepts behind it live elsewhere:

how the loop, the surface, the approval gate, and compaction fit together.

the short version — mount, configure, declare a tool, ship.

Member

Development Dock

A component declares its own agent surface, which means the source of one file never tells you what the whole screen published. `Agent.Dock` is the answer: mount it in development and it lists the tools this screen declared, the state keys an agent may read, the keys that were withheld and why, and what has been called so far.

The dock and its parts render nothing when `AKAN_PUBLIC_ENV=main`, so leaving one mounted costs a production visitor nothing. The parts are exported individually because an app that wants a dock of its own shape should compose these rather than re-read the surface.

What each section answers:

Tools — did this screen publish what its author thought it did, under the names the instructions use?

State — which keys are readable right now, and what does one actually return when read?

Withheld — which keys were refused, and for what reason.

Transcript — what the agent has already done to this page.

Eleven of the chat's own parts are override slots — `AgentBubble`, `AgentComposer`, `AgentSteps`, `AgentToolCard`, and the rest — so an app re-skins the transcript or the composer without re-implementing the loop. The full slot list is on the Customization page.

## Code Examples

### apps/koyo/page/_layout.tsx

```ts
import { Agent } from "akanjs/ui";
import { layout } from "akanjs/client";

export default layout().render(({ children }) => (
  <>
    {children}
    <Agent.Chat persist />
    <Agent.Dock open />
  </>
));
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.

