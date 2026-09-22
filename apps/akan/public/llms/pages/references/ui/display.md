# Display

- Source: /references/ui/display
- Mirror: /llms/pages/references/ui/display.md
- Section: references
- Category: UI Reference
- Priority: P1

## Headings

- Display UI (#display-ui)

## Content

Display

The admin listing, in parts. `Data.ListContainer` is the whole screen — toolbar, dashboard tiles, the list in either rendering, and the CRUD modals — and every other member is one piece of it, exported so a screen that wants a different arrangement composes rather than forks. All of them take the same `slice`, the generated metadata that says which model and which store keys the listing is reading.

The whole listing. `type` picks the starting rendering and the toolbar toggles it; `query` fixes the filter, and given one the panel is scoped and offers no query maker. A column is a field name or `{ key, title?, render?, responsive?, only? }`, and an action is `"view"` / `"edit"` / `"remove"` or an element of your own — both also take a factory that receives the loaded list.

The listing as rows. It owns its own CRUD modals, so it works standalone.

The same listing as cards. `renderItem` receives the model plus the slice, so a card can open the same modals the table does.

One card. `cover` and `title` are slots; `actions` draws the row's action controls with the store wiring already done.

The pager, reading page state from the slice's store rather than from props.

Summary tiles above the list. A tile narrows the listing when its own field declares a query with `.meta(...)`, or when `queryMap` names one; with neither it renders as a plain tile. `queryKey` is the filter the listing is showing, so a tile stops looking active once the toolbar moves off it.

The model's own insight values — the aggregates a slice returns beside its rows. The header already carries the total count, so name the others.

The filter builder: pick one of the model's declared filters, fill its args, apply. `onApply` defaults to the slice's own store, which is where a listing reads it.

The id picker a filter arg gets when its `ref` names a model — how a filter taking an owner id is filled by hand.

`Data.*` is the admin surface. A product screen composes `Load.Units` with the module's own `Unit` and `Zone` components instead — these carry a toolbar, a query maker, and a data export, which is a lot of client JS for a list a visitor only reads.

Localized relative-time label with a tooltip containing the absolute date. It switches from relative labels to formatted dates after the configured break unit.

Date value to render. Null renders nothing.

Unit where relative display stops and date formatting begins.

Automatic compact format or full date-time format.

Relative phrasing. `"fromNow"` (default) is dayjs locale strings. `"always"` / `"auto"` use Intl (`1 day ago` vs `yesterday`). A function replaces the relative label.

Six indicators, one per shape of thing that is waiting. Pick by what the reader is looking at: a skeleton where content will appear, a spinner where a control is working, a progress bar where the work has a known end. Each member is an independent override slot, so an app can re-skin the skeleton without touching the spinner.

The spinner. `size` is a named step or a pixel number; `tone="current"` inherits the surface's foreground, which is what a filled surface needs — `text-primary/70` is legible on the app background and vanishes on a `bg-info` badge. A replacement `indicator` carries its own colour; the rotation is the wrapper's, so it needs no `animate-spin`.

The shape content will take, pulsing while `active`. This is the `fallback` a `Load.Stream` or a Suspense boundary wants.

A determinate bar. Reach for it only when `value` and `max` are both real — an upload, a multi-step job — and a spinner otherwise.

A button-shaped placeholder, for a control that is not there yet. Not the in-button spinner — `Button` grows that itself when its handler returns a promise.

The same, shaped like a field.

An `absolute inset-0` scrim with a centred mark and a message, for a region whose content is on screen but busy. It needs a positioned ancestor. `children` replaces the localized processing message, `indicator` the spinner above it.

The status pill. It is a `<span>` plus the `badgeRecipe` variants and nothing else — every other attribute passes through, so `title`, `aria-*`, and a click handler all work. Because the recipe resolves through the route's recipe slot, an app can restyle every badge at once by binding `recipes: { badge }` in an `_overrides.tsx`, without touching a call site.

The colour. Map a model enum to one through a module-scope `as const` table rather than a conditional at the call site.

Height and text size. `md` by default.

Keeps the variant's colour and draws it as an outline instead of a fill.

Everything a `<span>` takes, `className` included — merged by the recipe, so a utility here wins over the variant.

For the classes without the element — a badge look on an `<a>` or a `<button>` — call `badgeRecipe(variants, className)` directly. It is server-safe and takes an array as its second argument, so it never needs `cn()` around it.

Standard no-data state with a localized default description and optional content below the empty body.

Custom empty-state text. Defaults to localized `base.noData`.

The mark above the description. Defaults to the framework inbox glyph.

Minimum empty body height in pixels.

Optional follow-up action or explanation rendered below the empty state.

Responsive table wrapper used by data-heavy screens. It supports column renderers, row click handlers, loading state, empty state, and optional `Pagination`.

Header/cell definitions with optional responsive visibility.

Rows rendered by the table.

Pagination config or false to disable.

Factory for row events such as click navigation.

Content drawn above the table and below the pager.

Placeholder for a table with no rows. Defaults to `Empty`.

The mark shown over the rows while `loading`.

Standalone page-number control. Use it when pagination state is local; use `Data.Pagination` when the state is generated from a model slice.

Current 1-based page number.

Total item count.

Number of items per page.

Called with the selected 1-based page number.

The marks inside the step controls and in place of skipped pages. The buttons, their disabled state and their labels stay the framework's.

Placeholder for a pager with no pages. Replaces the deprecated `renderEmpty`, which is a node and not a render function.

Display UI

Display components render model lists, timestamps, loading feedback, empty states, status pills, and table/pagination surfaces. Prefer `Data` for generated model lists and standalone helpers for local UI state.

Two of them come in a store-bound and a prop-bound pair, and picking the wrong one is the usual mistake: `Data.Pagination` reads a slice's page state from the store, `Pagination` takes the numbers as props; `Data.TableList` is a listing wired to a model, `Table` is rows you already have.

## Code Examples

No code snippets were extracted from this page.

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.

