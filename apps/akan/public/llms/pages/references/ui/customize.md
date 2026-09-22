# Customization

- Source: /references/ui/customize
- Mirror: /llms/pages/references/ui/customize.md
- Section: references
- Category: UI Reference
- Priority: P1

## Headings

- Customization (#customization)
- How it works (#how-it-works)
- Scoping (#scoping)
- Overridable slots (#slots)
- Generic components (#generic-components)
- Compound components (#compound-components)
- Recipe slots (#recipe-slots)

## Content

Customization

Leaf primitives

Generic

Input (compound)

Radio (compound)

DatePicker (compound)

ToggleSelect (compound)

Loading (namespace)

Toast (compound)

Edit shell

In-page chat

Every framework client component that draws a button — `Button`, the add and remove controls inside `Field.List` and `Field.TextList`, the pager, the modal footers.

`Badge` and the tag chips `Field.Tags` draws.

The field shell `Input`, `TextArea`, and `Select` share.

Any `akanjs/ui` component can be re-skinned per route without forking it. You write a drop-in replacement in your app's `ui/` folder and bind it to a framework slot in a `page/**/_overrides.tsx` manifest. Every existing `<Modal>`, `<Button>`, `<Table>` call site in that route subtree then renders your version instead — no call-site changes.

Overrides cascade down the route tree exactly like layouts: an override declared higher up applies to everything below it, and a nested manifest narrows or replaces it for its own subtree (closest ancestor wins).

The `_overrides.tsx` manifest is logic-free and needs no `"use client"` directive. `override()` returns a plain, server-safe map; the framework generates the client boundary that mounts the provider. Keep the file to imports plus a single `export default override({ … })`.

How it works

1. Write a drop-in component in `apps/<app>/ui/`. Type it against the slot contract (`AkanModalComponent`, or `AkanUiOverrides["<Slot>"]` for any other slot) so it is verified as a real replacement. Compose the framework's headless parts (e.g. `Dialog`) instead of re-implementing behavior.

1. App component

2. Declare it in `page/**/_overrides.tsx`. `override(map)` is a typed identity helper: keys are the PascalCase framework slot names, each value is checked against that slot's props, and unknown slot names are rejected at compile time.

2. Manifest

Scoping

Place `_overrides.tsx` at `page/` for an app-wide skin, or inside any route group / segment to scope it to that subtree. Nested manifests merge over ancestors slot-by-slot, so a child manifest only overrides the slots it lists and inherits the rest.

Nested scoping

Overridable slots

The framework exposes 46 slots. Behavioral and infrastructure components (Portal, InfiniteScroll, ClientSide, …) are intentionally not overridable — they are wiring, not skins.

The one you are most likely to reach for and not find is the toast stack — `System`'s `Messages`. It is not a slot because it is not a skin: it keeps the `msg.*` wiring, the store read, the body-level portal, and the dismiss timers. `Toast` and `ToastItem` are the slots instead, so a replacement re-skins the surface without re-implementing when a toast appears and goes away.

Generic components

`Button` and `Select` are generic. The public component keeps its full generic signature, so call sites like `<Select<MyEnum, true> … />` still infer their value and onChange shapes. The override slot stores the widest instantiation, so you author a plain, non-generic replacement.

Generic override

Compound components

Components with sub-parts — `Input.Password`, `Radio.Item`, `DatePicker.RangePicker`, `ToggleSelect.Multi`, and every `Loading.*` member — expose one slot per leaf, named `<Base><Sub>` (e.g. `InputPassword`, `LoadingSpin`). Override just the leaves you want; the rest keep their defaults, and `Input.Password` / `Loading.Spin` access stays intact.

Compound leaf override

Recipe slots

Replacing a component to change how it looks is more than you need when the structure is already right. The manifest takes a second kind of key for that: `recipes`, typed by `AkanUiRecipes`, swaps the className factory a framework component resolves through and leaves its structure and behavior — async states, focus handling, a11y — completely alone.

A replacement must accept the framework recipe's full variant contract, because every existing call site keeps working. Adding an axis of your own is allowed by the type but only reachable from code that knows your recipe's type — extending the vocabulary is not this slot's job. Add the axis to the framework recipe, or author an app recipe under `apps/<app>/ui/Recipe/`.

Recipe slot

A recipe slot is a client-side, route-scoped restyle. It reaches framework client components, which resolve through `useUiRecipe(...)`. It does not reach a `buttonRecipe(...)` call written directly in app JSX — that import is static and has no context — and it does not reach server components (`Unit`, `View`), which render the canonical framework recipe on purpose.

## Code Examples

No code snippets were extracted from this page.

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.

