# Core

- Source: /references/ui/core
- Mirror: /llms/pages/references/ui/core.md
- Section: references
- Category: UI Reference
- Priority: P1

## Headings

- Core UI (#core-ui)

## Content

Core

Route-aware navigation component. It renders CSR or SSR navigation depending on the Akan render mode, and falls back to a non-clickable div when disabled or href is empty. Every other anchor attribute passes straight through, so `target`, `rel`, and `aria-*` work as they would on `<a>`.

Destination route. Empty values render children without navigation.

Prevents navigation while keeping the same visual layout.

Class applied when the current route matches the link. `activeExact` narrows the match to the exact path instead of a prefix.

Scrolls to the top after client-side navigation.

Replaces the current history entry instead of pushing a new one.

Bypasses the route cache for client-side navigation when the renderer supports it.

Calls `router.back()` on click. It is a plain `<div>` with a pointer cursor, not a button — hand it whatever mark the design wants, like the chevron `Layout.Navbar` puts in it by default.

Calls `window.close()` on click — for a route opened in its own tab or window, such as a print view or an OAuth popup.

Calls `router.setLang(lang)` on click, which swaps the locale segment of the current route rather than navigating to a new one.

Use `Link` for every internal route and a bare `<a>` only for `mailto:` and external destinations.

Akan image component for `ProtoFile` objects and direct URLs. It can derive width, height, and blur data from file metadata and uses the Akan image optimizer in SSR mode.

Direct image URL. Takes precedence over file metadata.

File object with `url`, `imageSize`, and optional `abstractData`.

Blur/placeholder preview data.

Marks the image as high-priority and eager-loaded.

Skips Akan image optimization.

The page shell. Four of these are content containers you reach for inside a module (`Template`, `Unit`, `View`, `Zone`); the rest register a frame slot — a top inset, a bottom inset, a drawer — so the route knows how much chrome sits above and below the scrolling body. A slot-registering member reserves its space before it measures, which is what keeps a mobile route from reflowing once the navbar mounts.

Vertical form container with the spacing a module `Template` expects.

List/card item container. Given `href` the whole unit becomes one `Link`.

Width-constrained detail page container.

Section container for feature zones and page blocks.

Portals its `children` into the route's top inset. `back` draws a back control in the top-left slot: `true` for the framework chevron — a close glyph instead when the route's transition is bottomUp, scaleOut, or fade — or a node of your own.

Web-style sticky header. `type="hide"` (the default) slides it away as the user scrolls down and back on the way up; `"static"` keeps it put.

The top chrome slot itself, for content that is not a navbar. `estimatedHeight` is the space reserved before the real height is measured.

The top-left corner of the inset — where `Layout.Navbar`'s `back` lands. Use it directly for a corner control a navbar does not own.

The bottom chrome slot. `keyboardSticky` rides above the on-screen keyboard, and `role` separates permanent bottom chrome from a keyboard accessory bar so the two can coexist.

The app's bottom tab bar. Each tab is `{ name, icon, activeIcon?, notiCount?, href }`; `renderTab` draws one tab's body while the link, the route match, and the badge placement stay the framework's.

Self-contained drawer: it owns its open state and ships a hamburger `trigger` and a close row you can replace.

Controlled left drawer. `close={false}` draws no close control.

Controlled right drawer, with a title slot the left one does not have.

`Layout.Navbar` also accepts `title`, `left`, and `right` in its prop type, but the component renders none of the three — only `children` and `back` reach the DOM. Compose the title and the trailing controls inside `children` until that changes.

The bridge between an Akan fetch result and React rendering. Every member takes a resolved value or a promise, and gives a pending promise a Suspense boundary of its own — so one slow section never holds the rest of the page, and the same call site works whether the route awaited the data or handed the promise across.

Renders a slice's list and seeds the client store from it, so the generated pagination, query, sort, and refresh actions keep working after hydration. `from` / `to` window the rendered rows without refetching; `staleTime` is how old the seeded data may be before the client refetches on mount, and `0` always refetches.

Hydrates one full model and renders it through `renderView`. `noDiv` drops the default wrapper element.

The edit shell. `edit` takes the resolved payload, the `x<Model>Edit` promise, or a partial form seed for a new record; `type` picks `modal`, a plain `form`, or `empty` for a shell that renders only its children.

The pager for a slice, taking the same `init` the list did. Use it when the list and its pager are not siblings — `Load.Units` draws its own when `pagination` is on. `scrollToTop` returns to the top of the list after a page change.

The SSR/CSR page loader wrapper. `of` is the route component the CSR wrapper mounts, `loader` the async fetch both modes share.

Awaits one promise behind its own Suspense boundary and calls `children` with the value — for data no other `Load.*` covers, such as a slice's `x<Model>List<Suffix>`. A resolved value renders in the shell with no boundary at all.

Form recovery, on by default, on `Load.Edit` and every `Model` shell that opens a form. The shell saves the whole form as the user types and offers it back on the next open, scoped to the record id for an edit and to the seed plus the route for a new form, under the signed-in user. `false` turns it off; a string names the scope when the context is in neither the id nor the seed. `field.secret` and `field.hidden` values are never saved.

Hand each promise across rather than the awaited value: `const { xInitInY, xListInY } = fetch.initXInY(id)` puts both queries in flight and gives each section its own boundary. `xListInY` and `xInsightInY` hold hydrated model instances that React Flight refuses as client props, so consume those in a server component, never as a `Zone` prop.

Never persist form values yourself. The old per-field `cache` / `cacheKey` props are deprecated and store nothing — they covered five control types, keyed on the translated label, and restored over server data. Draft recovery replaced them.

The CRUD shells for a generated model store. They come in three shapes: a one-line pairing of a trigger and its modal (`New`, `Edit`), a wrapper that turns whatever you put inside it into that trigger (`NewWrapper`, `EditWrapper`, `ViewWrapper`, `RemoveWrapper`), and a body that renders in place (`View`, `EditModal`, `AdminPanel`). Every export carries its own Suspense boundary, because these mount on interaction long after the page is painted.

A create trigger and its modal in one line. `children` is the form body the modal renders — the module's own `Template` — and `trigger` is the control that opens it, defaulting to the framework's `+ New` button. `partial` seeds the form; `namespace` suffixes the published tool, and only a second create trigger for the same slice needs one.

The same pairing for one record. `children` is the form body, `trigger` the control, defaulting to the framework's edit button.

The modal editing shell itself, without a trigger — for a route that opens the editor from its own state. `renderSubmit={false}` hides the default submit; `onSubmit` / `onCancel` take a store action name or a callback.

Turns its children into a create trigger — a card, a row, an empty-state panel. `resets` names the store keys cleared when the form opens.

The same, for editing one record.

The same, opening the view modal.

The same, opening the removal flow.

Renders a loaded model, a loading state, or an empty state from one nullable model plus a loading flag. It is the store-side sibling of `Load.View`, which takes a fetch promise instead.

The detail view in a modal, with a title and an action slot.

One modal that flips between the detail view and the form. `menu={false}` draws no kebab, which also takes the remove entry off the modal.

Removal behind a confirmation modal. `children` is the trigger; `title` / `description` / `action` are the modal's slots. Replacing `action` takes over the removal — call nothing else and the record stays.

The heavier removal: a confirmation whose `typeNameToRemove` makes the user type `name` back before the delete button enables. It takes no `children` at all — `trigger` is the whole control.

A whole admin screen from the generated `Unit` / `Template` / `View` namespaces — listing, toolbar, dashboard tiles, and the CRUD modals. A role without a `General` export is skipped.

Seed the client store from a fetch result and render nothing. Reach for them where the markup is already server-rendered and only the store still needs the data.

Use `Model` components inside a module's `Util`, `View`, or `Zone` files, where the generated store actions are already in scope.

`trigger` replaces the control that opens the modal, and nothing else does: `Model.New` and `Model.Edit` spend their `children` on the form body and carry no `className`, and `Model.SureToRemove` takes no children at all.

Core UI

Core UI components are the most common `akanjs/ui` imports in apps and libs. They compose routing, images, layout containers, fetch loading, and model store workflows.

Three of the five are namespaces, and the split inside each is worth knowing before you pick a member: `Layout` separates content containers from frame slots, `Load` separates a list from a view from a stream, and `Model` separates a button from a wrapper from a body.

## Code Examples

No code snippets were extracted from this page.

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.

