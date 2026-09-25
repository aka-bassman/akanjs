# Forms

- Source: /references/ui/forms
- Mirror: /llms/pages/references/ui/forms.md
- Section: references
- Category: UI Reference
- Priority: P1

## Headings

- Forms UI (#forms-ui)

## Content

Forms

The store's draft of the record being edited, such as `icecreamOrderForm`.

The generated form setter. It writes one field of that draft.

controlled

Shows the `value` you pass and hands the next one to `onChange`. Only `Switch` can also run alone.

agent tool

An action the in-page agent may call. A form setter passed by reference becomes one.

override slot

A name in `_overrides.tsx` that swaps a component for one route subtree.

Label row

Agent tool

Override slot

Model field — inside a Template

One labelled control per model field, written inside a Template.

Bare control — search box, filter bar, inline cell

Text, number, password, email and checkbox inputs without a label row.

A dropdown for single, multiple or searchable choice. `label` is optional.

A boolean toggle. `Field.Switch` adds the label row.

One choice from a short list of radio buttons.

One or many choices as a row of buttons. `Field.ToggleSelect` publishes the tool.

A date, date-time, range or time on the native input. `Field.Date` publishes the tool.

Action — ends the form

Publishes nothing itself. An `st.tool(...)` handler given to `onClick` is the agent's tool.

Writing a Template

Where the model-field controls live and how a module form is laid out.

Override Slots

Re-skin the controls on this page for one route subtree.

In-Page Agent

How a setter passed by reference becomes a tool the agent can call.

The form-field namespace a module Template is written in. `<Field>` itself is a section wrapper with a label row; every member is one labelled control. The members differ mainly in the shape of `value`.

Section wrapper: draws the label row, then stacks its children in a `gap-4` column.

The label row: capitalizes a string label, tooltips `desc`, adds `(optional)` when `nullable`.

One line of text. `inputStyleType` is `bordered` (default), `borderless` or `underline`.

Multi-line text, three rows tall by default.

Text that must be a valid email address.

Text that must be a phone number. The default `transform` formats it with dashes.

Masked text with a show/hide eye. `showConfirm` adds a second box that must match.

One number. `unit` shows in the label; `formatter` / `parser` convert the digits shown.

Two numbers in one row, such as a range, a ratio or a coordinate. `min` / `max` are pairs too.

One date on the browser's native input. `showTime` adds the time of day.

Two ends of a range. `onChange(from, to)` fires only once both ends are set.

A labelled boolean. `onDesc` / `offDesc` describe the current position beside the toggle.

One choice as a row of buttons. An `enumOf(...)` in `items` gets each value translated.

Many choices in the same row. `minlength` / `maxlength` show translated messages.

Ordered strings, one input each. Drag to reorder; remove any row.

Unordered short strings drawn as badges, with an inline add box.

Embedded objects. You render one row; the field draws the frame and add/remove buttons.

One related model as its Light instance. Options load from `slice`, e.g. `fetch.slice.user`.

The same picker for an `ID` field: holds the id and passes the model as a second argument.

Many related models as Light instances.

Many related models as ids.

Controlled inputs without the label row, for a search box, a filter bar or an inline cell editor. Each member is its own override slot: `Input`, `InputTextArea`, `InputPassword`, `InputEmail`, `InputNumber` and `InputCheckbox` can be re-skinned separately.

The current text. The input keeps no copy of its own.

Receives the next string.

`true` when valid; `false` or a message shows an error under the input.

Lets an empty value pass without a warning.

The surface the input is drawn on.

A leading icon.

Called on Enter: a search box without a form element.

Called on Escape, after the input loses focus.

The same contract, with `validate` required. `Email` also rejects a malformed address.

A number or `null`. `formatter` / `parser` convert the text shown.

A native checkbox tinted with the primary color.

A controlled dropdown for plain values, `{ label, value }` pairs or an `enumOf(...)` class, with single, multiple and searchable modes. The option list portals to `document.body` at the field's width, so a scrolling modal or a table never clips it.

The selected value; an array when `multiple` is on.

Receives the next value and the previous one.

The choices. An enum shows its raw values; pass pairs for translated labels.

An optional label row above the field, with `desc` as a help tooltip.

Allows several values.

Adds a text box that filters the options by label. Non-string values then need pairs.

Called 300 ms after typing stops, in place of the local filter.

Adds a clear row to the list and a clear button to the field.

Shows a spinner instead of the empty placeholder while options load.

Called when the list opens: the place to load options lazily.

Custom drawing for a list row and for the chosen value.

The text shown with nothing selected, and what an empty option list shows.

Blocks opening and picking; the published tool is withdrawn too.

A boolean drawn as `<button role="switch">`, so focus and Space/Enter toggling come from the browser. Pass `checked` to control it, or `defaultChecked` to let it keep its own state. For a model field with a label row, use `Field.Switch`.

Controlled state. Leave it out and the switch keeps its own.

The starting position when uncontrolled.

Receives the next position. A form setter passed by reference is published to the agent.

The color of the on position. The off position is always `bg-muted`.

Blocks the toggle and dims it; the published tool is withdrawn too.

One choice from a `role="radiogroup"` of `role="radio"` buttons; arrow keys move the focus and the choice together. Each child carries its own `value`, and the group matches on it. A numeric `value` counts as an index only when no child owns it.

The selected child's `value`, or a position when no child declares one.

Receives the chosen child's `value` and its index. Arrow keys call it too.

Disables every option.

The options, usually `Radio.Item`s. The group draws the dot and the row around each.

One option's body. It has its own override slot, `RadioItem`, apart from the group's.

A choice as a row of pressed buttons instead of a dropdown, for a few short options. `ToggleSelect` picks one and `ToggleSelect.Multi` picks many. `nullable` and `validate` are required: a button row has no empty state to fall back on, so the call site decides both.

The cells. `Field.ToggleSelect` also takes an `enumOf(...)` and translates each value.

The selected value.

Required. Whether the choice can be cleared; pressing the selected cell then calls `onClear`.

Required. Returns `true`, or the message to show under the row.

The pick and the clear. `onClear` fires only in the `nullable` form.

Disables every cell. An item's own `disabled` disables just that cell.

Draws one cell. `onToggle` is the cell's own action; put it on whatever the cell renders.

The many-choice form, with its own override slot, `ToggleSelectMulti`.

A date on the browser's own `<input type="date">`, so the calendar, locale and touch keyboard are the platform's. The browser enforces `min` and `max`. A native field cannot grey out single days, so a pick that `disabledDate` rejects is refused with a warning toast.

The current value.

Receives the next value.

Switches the native input to `datetime-local`.

The earliest and latest values the browser lets you pick.

Returns `true` for a date to refuse. It is checked on pick, not greyed out.

Sent through `onChange` on mount, and again whenever it changes.

Both ends as one tuple; an empty other end is filled with now. Slot `DatePickerRangePicker`.

The time alone, kept on the day `value` already holds. Slot `DatePickerTimePicker`.

The one button primitive. A synchronous `onClick` renders a plain button; returning a promise puts the same button through loading, success or error, and blocks repeat clicks meanwhile. There is no separate async button to choose.

Optional. A returned promise turns on the async states; anything else keeps it plain.

Called with the result after the success check has shown for 0.7 s.

The box never resizes: `hold` overlays a spinner, `replace` cross-fades to a labelled one.

Shows the `onError` message under the button. Off, nothing shows it; toast it yourself.

The `buttonRecipe` look: color, size, corner shape and the outline flag.

The native type. It defaults to `button`, so a click never submits a surrounding form.

Native prop. The button is also disabled while loading and during the success check.

Forms UI

Words used on this page

Term

Pick a control

Component

Has it

Does not

Related pages

## Code Examples

No code snippets were extracted from this page.

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.

