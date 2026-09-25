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

Drawing an element elsewhere in the DOM, here at the end of `document.body`, so no parent clips it.

The element the user clicks to open the overlay, passed as `trigger` or as `children`.

controlled

You pass `open` and set it back in `onCancel`. Left out, the component keeps its own open state.

override slot

A name in `_overrides.tsx` that swaps a component for one route subtree.

A see-through layer behind a popover that catches the click outside it.

Portalled

At trigger

Override slot

Windows over the page

A centred window with title, body and footer slots. The default for a modal flow.

The headless parts `Modal` is built from, for a custom layout or an agent-named dialog.

A mobile panel that slides up from the bottom edge. Drawn in place, fixed to the screen.

Anchored to a trigger

A small OK/cancel popover before a destructive action.

A short action menu, such as the actions on a list row.

A hover or focus hint in pure CSS. At the screen edge it is clipped, not moved.

Navigation and helpers

A navigation menu built from an `items` tree, for a sidebar or a top bar.

Renders its children into a host element named by `id`.

Copies text to the clipboard and shows a success toast.

Forms UI

Override Slots

Core UI

In-Page Agent

How the tools a component publishes let the agent drive the screen.

A centred window with title, body and footer slots, built on the headless `Dialog`. Reach for it first; compose `Dialog` only when you need a layout of your own.

Controlled open state. May be left out when `trigger` is given.

Called when the modal closes itself: the close button, a backdrop click or Escape.

Element that opens the modal. With it, the modal keeps its own open state.

The header row. Left out, no header is drawn.

The footer row, right-aligned. Usually buttons.

The corner close control, wired by its slot, so a replacement needs no handler. `false` draws none.

Asks with the browser's confirm dialog before closing.

Classes for the window and for its scrolling body.

The headless compound parts that `Modal` is built from. Compose them when `Modal`'s fixed layout does not fit, or when the in-page agent should be able to open and close the dialog.

The root that holds the open state. `open` is followed whenever it changes.

Names the dialog for the in-page agent. Without it, the dialog publishes no tool.

Opens the dialog when anything inside it is clicked.

The plain window `Modal` draws. Escape, a backdrop click and the corner button close it.

The previous window: spring open/close and drag-to-dismiss on touch.

Draw nothing where written; they hand their children to the header and footer rows.

The body, a full-width block.

A small OK/cancel popover that stands in front of a destructive or irreversible action. Wrap the trigger in it and pass the action as `onConfirm`.

The question, in bold.

Optional detail under the title.

Called when the user presses OK. The popover closes first.

Button labels. The defaults are the `base.ok` and `base.cancel` dictionary entries.

Attributes spread onto the two default buttons.

The mark beside the message, a warning icon by default. `false` draws none.

Replaces the whole footer. The replacement owns both the confirm and the dismiss.

Classes for the trigger wrapper and for the pointer. `decoClassName` also takes over its position.

A compact action menu under a trigger button. It is the usual home for row actions, comment menus and other context actions in a list.

Content of the default trigger, a ghost button.

Your own trigger instead of the button. It is cloned, so it must forward className, onClick, aria-*.

The menu rows. They render inside a `<ul>`, so write `<li>` items.

The trigger edge the menu lines up with. A `left-0` class cannot change it.

Names the menu for the in-page agent. Without it, the menu publishes no tool.

Classes for the wrapper, the trigger button and the menu panel.

Put on a row with its own interaction, such as a switch, so clicking it keeps the menu open.

The mobile overlay: a panel that slides up from the bottom edge. `type` decides almost everything; like `Modal`, it runs controlled or from its own `trigger`.

Required. `half` is 90% tall with a grab handle; `full` covers the screen with a close row.

Controlled state. Left out, the sheet keeps its own and opens from `trigger` or the ref.

Element that opens the sheet.

`header` replaces the whole top row; `handle` and `close` replace only the mark inside it.

Classes for the sheet surface and for its scrolling body.

`{ open, close }`, an imperative handle for opening the sheet without a trigger.

A hint that appears on hover or keyboard focus, drawn in pure CSS. It is for hints only: content that must be read does not belong in a tooltip.

The hint. Empty, `null` or `undefined` renders `children` alone.

The trigger the bubble is anchored to.

Which side of the trigger the bubble sits on.

The bubble's colour. `Field.Label` uses `info` for the help icon beside a field description.

Classes for the bubble.

A navigation menu built from data rather than markup: you pass an `items` tree and it draws the rows, the submenus and the active state. `mode` picks a sidebar or a top bar.

The tree of `MenuItem`s. A `children` array turns the row into a submenu.

`inline` for a sidebar. `horizontal` for a top bar, folding what does not fit into a `…` menu.

Selected keys. `selectedKeys` is controlled; `defaultSelectedKeys` sets the start, first key only.

Receives the clicked item. In `inline` mode a row with children only expands.

Hides the labels, leaving only the icons.

How the active row is marked: a bottom border, or a `bg-border` fill.

Draws one item's body. The row, its click and any submenu stay the framework's.

The list, each row and each label. `className` reaches the outer wrapper.

Renders `children` into an element the page already has, named by `id`. It is the wiring behind `Layout.Navbar`: a component deep in a route fills the top bar without either one knowing about the other.

The host element's `id`. Nothing renders until that element is mounted.

What is rendered into the host.

Wraps a trigger so that clicking it copies `text` to the clipboard and shows a success toast.

Text written to the clipboard.

The success toast. Defaults to "Copied" in the reader's language.

The trigger. An element keeps its own `onClick`, which runs before the copy.

Overlays UI

Words used on this page

Term

Pick a component

Component

Does it

Does not

Related pages

## Code Examples

No code snippets were extracted from this page.

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.

