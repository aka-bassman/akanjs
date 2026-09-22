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

The form-field namespace, and the layer a module template is written in. `<Field>` itself is a section wrapper — label, help tooltip, optional marker, and a column for the controls inside it; every member below is one labelled control. They share a prop vocabulary: `value` / `onChange`, `label` / `desc`, `nullable`, `disabled`, `placeholder`, `transform`, `validate`, and `className` / `labelClassName` / `inputClassName`. What differs between them is the shape of `value`.

Section wrapper. Draws the label row and stacks its children in a gap-4 column.

The label row itself. Capitalizes a string label, hangs `desc` off a help tooltip, and appends `(optional)` when `nullable`.

One-line text. `inputStyleType` picks bordered, borderless, or underline.

Multi-line text.

Text with email validation built in.

Text with phone-number validation and formatting.

Masked text. `showConfirm` adds the second box and checks the two against each other.

One number. `unit` is drawn in the label; `formatter` / `parser` control how the digits are shown and read back.

A pair of numbers in one row — a range, a ratio, a coordinate.

One date, optionally with a time part.

Two ends of a range. `onChange` fires only once both ends are set — nobody can query a half-open one.

A labelled boolean. `onDesc` / `offDesc` explain the current position beside the toggle.

One choice as a row of buttons. `items` takes an `enumOf(...)` instance directly and translates each value through the dictionary.

The same row, many selected. `minlength` / `maxlength` are enforced with localized messages.

An ordered list of strings, each its own input, reorderable by drag and removable per row.

An unordered set of short strings, drawn as badges with an inline add box.

A list of embedded objects. You render one row; the field draws the frame, the add button, and the per-row remove.

One related model, held as the Light instance. `slice` is the generated slice the options are loaded from.

The same picker holding only the id — what a form field of type `ID` stores. The chosen model arrives as the second argument.

Many related models as Light instances.

Many related models as ids.

Pass the generated setter by reference — `onChange={st.do.setNameOnUser}`. That is what makes the framework emit `data-akan-action` / `data-akan-state` on the control and publish the field as an agent tool. An inline arrow (`onChange={(v) => st.do.setNameOnUser(v)}`) runs identically and publishes nothing: a closure the caller wrote says nothing about what it does, so the annotation is dropped rather than guessed. `no-unpublished-form-setter.grit` fails the build on the pass-through form.

A wrapper that transforms the value, adds a statement, or writes a nested path with `writeOnX` stays legal — normalize with the control's own `transform` prop where you can, and publish the rest explicitly with `st.tool`.

`libs/shared/ui/Field` wraps and extends this namespace for project-specific controls such as rich text, maps, and postcode.

Controlled primitive input namespace. Reach for it below `Field` — a search box, a filter bar, an inline cell editor — where you want the input without the label row. Every leaf is its own override slot, so `Input`, `Input.TextArea`, `Input.Password`, `Input.Email`, `Input.Number`, and `Input.Checkbox` can each be re-skinned on their own.

Controlled input value.

Receives the next string value.

Returns true for valid input or an error message.

The surface the field is drawn on.

Called on Enter — the search-box idiom, without a form element.

The typed variants. Each keeps the same controlled `value` / `onChange` contract in its own value type.

Controlled selector that accepts primitive arrays, label/value options, or Akan enum instances. It supports single, multiple, and searchable selection modes. The option list portals to document.body and is placed against the field, matching its width, so a Select inside a scrolling modal body or a table is not clipped by it.

Selected value, or selected values when multiple is true.

Option source.

Enable multiple selected values.

Show search input and optionally call onSearch.

Custom display renderers.

A boolean as a `<button role="switch">`, so focus and Space/Enter toggling come from the platform rather than from a keydown handler. Controlled and uncontrolled both work: pass `checked` for the first, `defaultChecked` for the second. Use `Field.Switch` when the value is a model field and you want the label row with it.

Controlled state. Left out, the switch keeps its own.

Starting position for the uncontrolled form.

Receives the next position. Passed by reference, it publishes the field to the agent.

The colour of the on position. The off position is always `bg-muted`.

Blocks the toggle and dims the control; the published tool goes with it.

Inside a `Dropdown` menu item, put `data-dropdown-keep-open` on the `<li>` so flipping the switch does not close the menu.

A single choice as a `role="radiogroup"` of `role="radio"` buttons, with arrow-key roving focus. Each child carries its own `value`; the group resolves the selection by matching it, and falls back to treating a numeric `value` as an index only when no child owns it — resolving both at once is what once let two options read as checked at the same time.

The selected child's `value`, or a position when no child declares one.

Receives the chosen child's `value` and its index.

The options, normally `Radio.Item`s. The framework draws the dot and the row; the child renders only its own body.

One option's body. Its own override slot (`RadioItem`), separate from the group's.

A choice as a row of pressed buttons rather than a dropdown — right where the option count is small and the labels are short. `ToggleSelect` is single-select, `ToggleSelect.Multi` many. `nullable` and `validate` are required props, not optional ones: a toggle row has no empty state to fall back on, so both decisions are made at the call site.

The cells. `Field.ToggleSelect` accepts an `enumOf(...)` instance on top of this and translates each value first.

The selected value.

Required. Whether the selection may be cleared — which is also whether `onClear` is ever called.

Required. Returns true, or the message to show under the row.

The pick and the clear. `onClear` fires only in the `nullable` form.

Draws one cell. `onToggle` is the cell's own action — put it on whatever the cell renders.

The many-selected form. Its own override slot (`ToggleSelectMulti`).

A date as the browser's own field, so the calendar, the locale, and the touch keyboard are the platform's. `min` and `max` are enforced by the browser; `disabledDate` is rejected on selection rather than greyed out, because a native field constrains only through those two.

The current value.

Receives the next value.

Switches the native input to datetime-local.

Earliest and latest selectable values. The browser enforces them.

Rejected on selection rather than greyed out.

Both ends in one control, as a tuple. Its own override slot (`DatePickerRangePicker`).

The time part alone. Its own override slot (`DatePickerTimePicker`).

For a model field use `Field.Date` / `Field.DateRange` instead — they add the label row, the optional marker, and the store wiring around this control.

The one button primitive. A synchronous handler renders a plain button; returning a promise is what opts the same button into loading, success, and error state and blocks duplicate clicks while processing. There is no separate async button to choose.

Optional. Returning a promise enables the async states; returning nothing keeps it a plain button.

Called after the success state is shown briefly.

Both modes keep the box fixed — CSS cannot animate an auto width, so a resizing button can only snap. hold (default) fades a bare indicator over the children, sizing the box to the label. replace cross-fades to a labelled indicator, keeping both labels stacked so the box is the wider of the two from the start.

Whether a failure renders its message under the button. Off leaves it to the framework toast, keeping the layout fixed.

Inherited native button prop; also disabled while loading/success.

Forms UI

A model form in Akan is not a form element with state in it. The store holds `<model>Form`, the generated setters write one field each, and a control's only job is to show the current value and hand the next one back. That is why nothing on this page keeps state of its own.

Work down the layers: `Field.*` for a model field, `Input` / `Select` / `Switch` / `Radio` / `ToggleSelect` / `DatePicker` for a control without a label row, and `Button` for the action at the end.

Hand every setter over by reference — `onChange={st.do.setSizeOnTicket}`, never `onChange={(size) => st.do.setSizeOnTicket(size)}`. The two run identically, and only the first emits `data-akan-action` on the control and publishes the field as an agent tool. `no-unpublished-form-setter.grit` is an error, because it is a silent failure in two lines that read the same.

## Code Examples

No code snippets were extracted from this page.

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.

