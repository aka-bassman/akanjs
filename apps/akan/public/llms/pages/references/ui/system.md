# System

- Source: /references/ui/system
- Mirror: /llms/pages/references/ui/system.md
- Section: references
- Category: UI Reference
- Priority: P1

## Headings

- System UI (#system-ui)

## Content

System

app shell

The frame every page renders inside, holding the theme, fonts, locale, toasts and socket.

A React boundary that shows a fallback until the content inside it is ready.

Every endpoint with its arguments, guards and return model, shipped as `fetch.serializedSignal`.

agent tool

An action a control publishes so the in-page agent can do what the user's click does.

Auto

Server

no "use client"

Tool

App shell

Controls you place

Switches the color theme and publishes `applyTheme`.

Switches the URL's language and publishes `setLanguage`.

Turns developer-only UI on and off.

Developer tools and primitives

The API explorer, for an admin or docs screen.

react-spring's animated `div`, `g` and `progress`.

Root Layout Stages

Override Slots

Constant Schema Docs

In-Page Agent

How the tools a control publishes let the agent drive the screen.

The app shell. Akan mounts `Provider` for you, and `Provider` mounts `Reconnect` when you turn it on. `ThemeToggle`, `SelectLanguage` and `DevModeToggle` are controls you place yourself.

The frame around your root `_layout.tsx`, filled from its `rootLayout()` stages.

Deprecated: it renders `children` and ignores `st`, so render the children directly.

Sets `data-theme` to one of `themes`: a switch for two, a dropdown for three or more.

A dropdown that swaps the `/:lang` segment of the current URL and keeps the rest.

When the socket drops and a ping fails, it covers the screen, then reloads once reconnected.

A switch for the store's `devMode` flag, kept in `localStorage` across reloads.

A small React `Suspense` boundary. It shows `loading` while anything inside it suspends, such as a `lazy()` component still fetching its chunk.

The content that may suspend.

The fallback shown meanwhile; nothing is shown when it is left out.

The API explorer, split into parts. It reads the serialized signal the server ships with the app — every endpoint, its arguments, guards and return model — and renders a document you can also call endpoints from.

The explorer; `Doc.Zone({ refName, fetch, openAll? })` renders one signal's whole document.

The HTTP side: `Endpoints` lists queries and mutations, or only the ones named in `endpoints`.

The same list for websocket endpoints, each row handed to `PubSub` or `Message`.

One subscription: its room, its payload shape, and a Try that shows frames as they land.

The same three parts for a one-way message endpoint.

`Result` is the live pane a Try writes into, showing byte payloads as a short hex preview.

A model from its constant class: a type chip, its field table, or a titled schema.

The one real component: `Arg({ argType, value, onChange })` renders one scalar's input.

A tab set split into parts so the panels stay on the server. Only the provider and the menu hold state, and `Tab.Panel` renders what it is given, so the markup inside a panel never reaches the bundle.

The provider holding the selected menu, which starts at `defaultMenu` or, left out, at none.

The `role="tablist"` row the menu buttons sit in.

One tab button, keyed by `menu` rather than `value`.

The body shown while its `menu` is selected; `loading` decides when it mounts.

A small re-export of react-spring's animated elements, the ones Akan UI components animate with. Drive them with a spring hook in your own animated surfaces.

An animated `div`.

An animated SVG group, `g`.

An animated `progress` element.

System UI

Words used on this page

Term

Pick a component

Component

Yes

No

Related pages

## Code Examples

No code snippets were extracted from this page.

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.

