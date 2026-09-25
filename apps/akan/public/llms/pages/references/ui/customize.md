# Customization

- Source: /references/ui/customize
- Mirror: /llms/pages/references/ui/customize.md
- Section: references
- Category: UI Reference
- Priority: P1

## Headings

- Customization (#customization)
- How It Works (#how-it-works)
- Scoping (#scoping)
- Overridable Slots (#slots)
- Generic Components (#generic-components)
- Compound Components (#compound-components)
- Recipe Slots (#recipe-slots)

## Content

Customization

slot

A named place where a framework component can be swapped, such as `Modal` or `InputPassword`.

The manifest in a `page/` folder that binds slots for every route under that folder.

drop-in

Your replacement. It takes the same props as the original, so no call site changes.

headless parts

Parts with behavior but no look of their own, such as `Dialog.Modal`.

A function that returns the className for a variant, such as `buttonRecipe({ variant: "primary" })`.

Component slot

46 slots · typed by AkanUiOverrides

Recipe slot

3 slots · typed by AkanUiRecipes

Builds the manifest an `_overrides.tsx` exports. It returns the map as is and only checks types.

Maps every slot name to its component type. Type a replacement as `AkanUiOverrides["Table"]`.

Shorthand for `AkanUiOverrides["Modal"]`.

Maps each recipe slot (`button`, `badge`, `input`) to its className factory type.

The shape of a whole manifest, and the union of slot names.

Headless parts (`.Modal`, `.Title`, `.Content`, `.Action`, `.Trigger`) to build a `Modal` from.

The shipped defaults of the eleven chat-part slots and both Toast slots, to wrap instead of rewrite.

The `data-akan-*` attributes a default control carries for the agent; spread them on a replacement.

Puts a `Dropdown`'s click and aria state onto the trigger your replacement draws.

Mounts an override map by hand around any subtree, merged over the route's manifest.

Read the component or recipe bound to a slot in this subtree, or `undefined`.

Wraps a component so it resolves through a named slot and falls back to the default.

Every route in the app.

Only the routes inside the `(admin)` group.

`/settings` and every route under it.

Standalone components. The key is the name you render: `<Modal>` binds `Modal`.

Generic components. Your replacement is written without generics; see Generic Components.

`Input` and its five leaves, `Input.TextArea` through `Input.Checkbox`.

`Radio` and `Radio.Item`.

`DatePicker` with `.RangePicker` and `.TimePicker`.

The generic `ToggleSelect` and its `.Multi` leaf.

Each `Loading.*` member. `Loading` itself is a plain namespace with no slot.

The toast stack, and one toast card inside it.

The banner an edit shell shows for a recovered form. Restore and discard stay wired.

The in-page chat. `AgentChat` swaps the whole panel; the other eleven each swap one part.

Wiring with no look of its own, like every behavior-only component, so there is nothing to swap.

The toast stack inside `System`. To restyle toasts, bind `Toast` and `ToastItem` instead.

`Button`, and the buttons inside `Popconfirm`, `Dropdown`, `Menu`, `Pagination` and `ToggleSelect`.

`Badge`, and the tag chips `Field.Tags` draws.

The field shell of `Input` and its text leaves, and the chat composer's text box.

Theme Tokens

Change colors and corner radius app-wide in styles.css, before replacing anything.

UI Recipes

Use, write and swap the className factories behind framework looks.

Overlays

Modal, and the Dialog parts a Modal replacement is built from.

Agent Chat Slots

The twelve chat slots, and what each part of the panel receives.

Manifests cascade down the route tree like layouts, and the closest one wins.

Words used on this page

Term

Two kinds of slot

One manifest takes both kinds. Swap a recipe when only the look is wrong, and a component when the markup is.

How It Works

1. Write the replacement

2. Bind it in the manifest

Exports from akanjs/ui

Export

Scoping

File

Applies to

Manifests stack. The nested one narrows the app-wide one:

Overridable Slots

Slot

Not slots

Component

Generic Components

Compound Components

You render

Slot key

Binding one leaf leaves its siblings alone:

Recipe Slots

A replacement takes the framework recipe's whole variant contract, because every existing call site passes it:

Related pages

## Code Examples

No code snippets were extracted from this page.

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.

