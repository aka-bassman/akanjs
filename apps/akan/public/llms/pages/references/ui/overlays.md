# Overlays

- Source: /references/ui/overlays
- Mirror: /llms/pages/references/ui/overlays.md
- Section: references
- Category: UI Reference
- Priority: P1

## Headings

- Overlays UI (#overlays-ui)

## Content

Overlays

Controlled modal wrapper built on Akan's headless `Dialog` state. Use it for common app overlays where you want title/content/action slots without composing the full dialog namespace. The surface is deliberately plain — no transition, no gesture — so it never animates content the user is reading. `LegacyModal` keeps the previous animated skin.

Controlled open state.

Called when the modal requests closing.

Element that opens the modal. Given one, `open` may be left out and the modal keeps its own state.

Optional title slot.

The dismiss control, drawn in the corner slot that already closes the dialog — a replacement needs no wiring. `false` draws none.

Optional footer/action slot.

Ask for confirmation before closing.

Headless compound dialog namespace for custom modal composition. Use it when `Modal` is too opinionated and you need a custom trigger, title, content, or action layout.

Provider/root for dialog state.

Opens the dialog from custom trigger content.

Modal surface and close behavior.

Previous surface: spring open/close and drag-to-dismiss on touch.

Named modal slots.

Inline confirmation popover for destructive or irreversible actions. It wraps a trigger element and shows localized OK/cancel buttons. The popover portals to document.body and is placed against its trigger — above it when there is no room below, with the pointer following — so it is not clipped by a modal, a scrolling container, or the dropdown menu that Model.Remove draws it from. Its scrim swallows the next click, and the overlay that opened it stays open.

Confirmation title.

Optional detailed message.

Called when the user confirms.

Custom button labels.

The mark beside the message. `false` draws none.

The whole footer, replacing both buttons. A replacement owns the confirm and the dismiss.

Compact dropdown menu wrapper. It is commonly used for row actions, comment/story menus, and context actions in list UIs. The menu portals to document.body and is placed against its trigger, so it is not clipped by a modal surface, a scrolling modal body, or a table's scroll container. A menu item may open a Modal: the menu stays mounted while it is closed, so the overlay survives, and clicks inside an overlay this menu opened do not count as outside clicks. An overlay it did not open still dismisses it.

Trigger button content.

The whole trigger element, drawn instead of the framework's ghost button. It is cloned, not wrapped, so the menu's aria-expanded lands on the control a screen reader activates — the element must forward className, onClick and aria-*.

Dropdown menu content.

Classes for the trigger button.

Classes for the menu panel.

Trigger edge the menu lines up with, end (right) by default. Position is computed, so a left-0 class cannot do this.

Put it on a menu item that runs its own interaction (a switch, a copy button) so clicking it does not close the menu.

The mobile overlay: a panel that comes up from the bottom edge and is dismissed by dragging it back down. `type` is the whole decision — a `half` sheet covers part of the screen and draws a grab handle, a `full` sheet takes it all and draws a close row instead. Like `Modal` it works controlled or self-contained: give it `open` and `onCancel`, or give it a `trigger` and let it keep its own state.

Required. `half` covers part of the screen with a grab handle; `full` takes the whole screen with a close row.

Controlled state. Left out, the sheet opens from its own trigger and handle.

Element that opens the sheet.

`header` replaces the whole top row — the handle or the close row, whichever `type` draws. `handle` and `close` replace just the mark inside it.

Classes for the scrolling body, where `className` reaches the sheet surface.

`{ open, close }` — the imperative handle, for a sheet a page opens from somewhere that is not a trigger.

A hint on hover or keyboard focus, in pure CSS — no state, no portal, no positioning pass. That buys a tooltip that costs nothing and renders on the server, and it costs viewport-edge flipping: a bubble near the edge is clipped rather than moved. It is a hint surface, so that is the right trade; when the content has to be read, it is not a tooltip. An empty `content` renders the trigger alone, so a conditional hint needs no wrapper of its own.

The hint. Empty, null, or undefined renders `children` alone.

The trigger the bubble is anchored to.

Which side the bubble sits on. `top` by default.

The bubble's colour. `Field.Label` uses `info` for the help icon beside a field description.

It is an override slot, so an app that needs a positioned tooltip — one that flips, or follows the pointer — binds its own in `_overrides.tsx` and every existing call site follows.

A navigation menu from a data structure rather than from markup: `items` is a tree of `{ key, label, icon?, children? }`, and the component draws the rows, the submenus, and the active state. `mode` is the axis — `inline` for a sidebar, `horizontal` for a top bar, where anything that does not fit folds into an overflow menu.

`{ key, label, icon?, children?, type? }`. A `children` array makes the row a submenu.

The axis. `inline` by default; `horizontal` folds the overflow into a trailing menu.

Controlled and uncontrolled selection, by item key.

Receives the clicked item.

Narrows an `inline` menu to its icons.

Draws one item's body. The row, its click, and any submenu stay the framework's.

The three levels below `className`, which reaches the wrapper.

`Menu` is a navigation structure and `Dropdown` is a transient action list — they look alike and are not interchangeable. Row actions on a list belong in a `Dropdown`.

Renders `children` into an element the page already has, named by `id`. This is the wiring behind `Layout.Navbar` — a component deep in a route puts content into the route's top inset without either one knowing about the other. It is server-aware: during SSR the content is captured for the shell rather than dropped, so a portalled navbar is in the first byte instead of appearing after hydration.

The `id` of the host element. Nothing renders until an element with it exists, so the host has to be mounted first.

What is rendered into the host.

It is not the way to escape a clipping ancestor — `Modal`, `Dropdown`, `Select`, and `Popconfirm` already portal to `document.body` and place themselves against their trigger. Reach for `Portal` only for a named slot the app frame owns.

Copy-to-clipboard trigger that also shows a global success message through Akan store messages.

Text copied to the clipboard.

Optional custom success message.

Trigger element.

Overlays UI

Overlay components cover modal flows, custom dialogs, destructive confirmations, bottom sheets, menus, hints, and copy actions. Use `Modal` for common controlled overlays and the headless `Dialog` namespace for custom composition.

Four of them portal to `document.body` and place themselves against their trigger — `Modal`, `Dropdown`, `Popconfirm`, and `Select` — so none of them is clipped by a scrolling modal body or a table's overflow container. `Portal` is the named-slot version of the same mechanism, and `Tooltip` deliberately does none of it.

## Code Examples

No code snippets were extracted from this page.

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.

