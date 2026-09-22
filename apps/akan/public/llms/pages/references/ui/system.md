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

The app shell. Two of these are mounted for you by the generated root layout — `Provider` and `Root` — and the other four are controls you place yourself. `Provider` is the one that branches: it renders the CSR or the SSR provider by render mode, so a root layout names one component and never asks which build it is in.

The app frame. `of` is the root route component the CSR wrapper mounts; `env` is the app's own `env/env.client.ts` merged over the framework's `getEnv()`; `layoutStyle` picks the mobile frame or the plain web layout. The root layout chain sets most of these from `akan.config.ts`, so an app rarely writes it by hand.

Binds the app's generated store to the framework runtime. It is what makes `st.use.*` resolve inside the tree, and it is mounted once, above everything.

Cycles the `data-theme` attribute the semantic tokens follow. `themes` names the rotation; left out it is light and dark.

Swaps the locale segment of the current route. Every route sits under `/:lang`, so this changes the path rather than navigating somewhere new.

The blocking overlay for a dropped connection. It pings the server, reports the state, and sits above every other layer on purpose — it is the one surface that should stop the app.

Flips the store's `devMode` flag — what admin screens read to show developer-only affordances.

`System`'s toast stack is deliberately not a member. `Provider` mounts it, and it keeps the `msg.*` wiring, the store read, the body-level portal, and the dismiss timers — which is why the override slots are `Toast` and `ToastItem`, the surface, rather than the component that decides when a toast appears and goes away.

Small Suspense boundary for content that should be rendered client-side with an optional fallback.

Client-side content.

Suspense fallback.

The API explorer, as parts. It reads the serialized signal the server ships with the app — every endpoint, its arguments, its guards, its return model — and renders a document you can also call from. Eight members, and every one of them is a namespace carrier: `Signal.Doc` and its siblings render an empty div on their own, so you always reach for a static (`Signal.Doc.Zone`, `Signal.RestApi.Endpoints`), never the root.

The explorer itself. `Doc.Zone({ refName, fetch, openAll? })` is one signal's whole document — the entry point an admin page mounts; `Setting` is the search and guard toolbar, `AuthModal` the credential dialog the Try controls need.

The HTTP half. `Endpoints({ refName, fetch, endpoints?, openAll?, search?, httpUri? })` lists a signal's query and mutation endpoints — naming `endpoints` narrows it to exactly those, which is how a docs page embeds one call. `Interface` is the read-only shape, `Try` the form that sends it.

`Endpoints({ refName, fetch, openAll?, search? })` — the same listing narrowed to the websocket endpoints, delegating each row to `PubSub` or `Message`. A pubsub room authorizes once, at subscribe, so the guard filter here reads the endpoint's own guards.

One subscription: its room, its payload shape, and a Try that subscribes and shows frames as they land.

The same three for a one-way message endpoint.

`Result({ status, data })` — the live pane a `PubSub.Try` writes into, with a status dot and the payload. A byte payload is shown as a hex head rather than JSON: `JSON.stringify` spells a `Uint8Array` as `{"0":2,…}`, which for one video chunk is megabytes of DOM.

A model's shape, drawn from the constant class: `Type` is one field's type with its array depth and nullability, `Detail` the whole class, `Schema` the nested structure.

The only member that is a component in its own right: `Arg({ argType, value, onChange })` renders the input for one scalar type, and the per-type statics are what it dispatches to. `Table` is the read-only argument list an `Interface` shows.

`fetch` is the app's own fetch proxy — the explorer reads `fetch.serializedSignal` off it, so a signal the app did not mount is reported as unregistered rather than rendered empty.

A tab set split so the panels stay on the server. Only the provider and the menu hold state; `Tab.Panel` renders whatever it is given, so a panel body full of markup never reaches the bundle. This is the shape to copy — never one `"use client"` file with a mode `useState` and every panel inlined in it.

The provider. `namespace` names this tab set for the in-page agent — without it the tab publishes nothing, because two tab sets on one screen would otherwise share a tool name.

The row the menu items sit in.

One selectable item. The key is `menu`, not `value`.

Content for a matching `menu` key. `loading` decides when the body is rendered — `"eager"` up front, `"lazy"` on first selection, `"every"` on each selection.

Small re-export of react-spring animated primitives used by Akan UI components and custom animated surfaces.

Animated div primitive.

Animated SVG group primitive.

Animated progress element.

System UI

System UI components are app-shell and admin helpers, not normal feature widgets. Use them in root layouts, admin pages, signal dashboards, tabbed detail views, and animation-heavy UI.

## Code Examples

No code snippets were extracted from this page.

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.

