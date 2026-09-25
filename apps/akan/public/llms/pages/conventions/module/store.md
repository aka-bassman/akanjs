# model.store.ts

- Source: /conventions/module/store
- Mirror: /llms/pages/conventions/module/store.md
- Section: conventions
- Category: Domain
- Priority: P1

## Headings

- model.store.ts (#store-overview)
- Store Class Structure (#class-structure)
- Extending Library Stores (#generated-extension)
- Writable And Derived State (#writable-derived-state)
- Reading And Writing State (#state-management)
- Standard Model API (#standard-api)
- Generated Slice API (#slice-features)
- Usage Patterns (#usage-patterns)
- Rules And Common Mistakes (#practical-rules)

## Content

model.store.ts

A value the store holds. A component re-renders when a key it reads changes.

A method of the store class. Components call it through `st.do.<action>()`.

The app's root store, merged from every module store. Import it from `@apps/<app>/client`.

A list query declared in `<model>.signal.ts`. Each one gets its own list state and actions.

The id-indexed list type that slice state uses. Update it with `list.set(x).save()`.

Other layers

UI orchestration

Calling the server and tracking its loading state.

Toast messages around a call: loading, success, error.

modal · selection

Which modal is open and which rows are selected.

form · list

Form values and loaded lists. A model store generates both.

Client navigation after an action succeeds.

Business rules

domain rule

Validation and state transitions live in constant, document and service.

access check

Who may call an endpoint is decided by its guards in the signal.

Binds a model and generates its state and actions. A service store passes `"<name>" as const`.

Required. The state factory; its defaults are recreated for each store instance.

Optional. Read-only derived state, covered under Writable And Derived State.

Optional. Library stores for the same model, merged in first.

A plain value in memory that resets with the store. For ordinary UI state.

Kept in `localStorage`. For values that must survive a reload.

Kept in `sessionStorage`. For values needed only in the current browser session.

Read-only, parsed from the URL query string. For filters and tabs a link should carry.

Read-only, recomputed when a writable key in `deps` changes.

Starting value. Without it: `[]` for arrays, the first enum value, else the type's own default.

Allows `null`, and starts at `null` when no default is given.

the state key

Name used in browser storage.

Decides whether a recomputed value counts as a change.

Returns the current state. Use it when a value may be `null`.

Returns required keys; throws if one is `null`, `undefined` or `""`.

Writes state. An object merges shallowly; a function mutates an immer copy in place.

The full model currently open, such as `ticket`. `null` until one is loaded.

`true` at first, `true` or the record id while a request runs, then `false`.

Form values for creating or editing one record.

`true` until a form opens, the id while `edit<Model>` loads, then `false`.

`{ disabled, loading, times }` for the submit button.

When `<model>` was last loaded or saved.

Which modal is open: `"edit"`, `"view"`, your own key, or `null`.

The open form's unsaved draft. `Load.Edit`, `Model.EditModal` and `Model.New` manage it.

Creates from `<model>Form`, resets the form and adds the row to the list.

Saves `<model>Form` over its record, resets the form and patches loaded lists.

Creates a record from `data`; the form is untouched.

Updates one record from `data`; the form is untouched.

Removes a record and drops it from every loaded list.

Sets `<model>Submit.disabled` from whether the form is valid.

Calls `update<Model>InForm` when the form has an id, else `create<Model>InForm`.

Fills the form for a new record and opens the `"edit"` modal.

Loads the record into the form and opens the `"edit"` modal.

Saves `data` through the update endpoint and patches the cached copies.

Loads the record into `<model>` and opens the `"view"` modal.

Writes returned models into `<model>` and into loaded lists that hold them.

Clears `<model>` or sets the one given, resets the form and closes the modal.

Drive the form draft. `Load.Edit`, `Model.EditModal` and `Model.New` call them for you.

Runs after the save with the saved model, e.g. to navigate.

Runs when the request fails.

Modal to show after saving. Left out, the modal closes.

Slice whose list receives a created row, such as `ticketInProject`.

Also writes the saved model into this state key.

Writes one field of `<model>Form`. Pass it to `onChange` by reference.

Array field: inserts one or more items at `idx`, at the end by default.

Array field: removes the item at `idx`, or at every index in an array.

Array field: adds the value if absent, removes it if present.

`File` field: uploads, then polls until the file leaves `uploading`.

Writes a nested path, such as `"payments.3.name"`.

\`${root}\` for the root slice, \`${named}\` for inProject.

Rows on screen, loaded by init, refresh or paging.

Whether the list is loading.

Rows from the last init or refresh.

When the list was last initialized.

Rows the user selected.

Aggregates for the query, such as `count`.

Starting values for a new form opened from this slice.

Current page, starting at 1.

Total number of pages, computed from `count` and the limit.

Rows per page, 20 by default.

Whether the server holds rows past the ones loaded. Read this, not the count.

`true` after `loadMoreOf…`: the list accumulates instead of paging.

Current query arguments.

Current sort key, `"latest"` by default.

Loads the list for these query args. Skips the request if that query is loaded.

Refetches the current list from the server.

Adds to the selection; `refresh` replaces it, `remove` takes rows out.

Swaps the list to that page.

Appends the rows after the ones loaded. Takes no page number.

Changes rows per page and reloads.

Changes the query args and reloads. Also takes `(prev) => next`.

Changes the sort and reloads.

current, 1 at first

Page to load.

current, 20 at first

Rows per page.

current, "latest" at first

A sort key the filter declares.

`false` skips the count query; the count becomes the rows loaded.

Starting values `new<Model>` fills a new form with.

`true` always refetches; `false` reuses an identical query already loaded.

Replaces the leading query args; the rest keep their current values.

Most stores stay nearly empty, because a model store generates its state and CRUD actions. Write an action by hand only for one of these:

A Toast

Loading and success messages around a custom endpoint call.

An Optimistic Update

Change the client model first, send the request without waiting, then commit.

A Multi-Field Write

Several state keys that must change together in one write.

What the store owns

The work

Belongs here

Not here

Words used on this page

Term

Store Class Structure

Model Store

Bound to a model's signal. It gets the model, form and list state and the CRUD actions.

Service Store

No signal. It holds only the state and actions you write.

Argument

A model store with one custom action, complete with its imports:

Extending Library Stores

Writable And Derived State

Declared as

Builder options

Reading And Writing State

Method

Standard Model API

Base state

Field

Base actions

Form setters

Generated Slice API

Pattern

Slice state

Slice actions

Usage Patterns

Generated setters

Rules And Common Mistakes

Check a store against these rules before you commit it:

Reaching Another Store

## Code Examples

### apps/koyo/lib/ticket/ticket.store.ts

```ts
import type { Dayjs } from "akanjs/base";
import { store } from "akanjs/store";

import * as cnst from "../cnst";
import { fetch, msg, sig } from "../useClient";

export class TicketStore extends store(sig.ticket, () => ({
  backlogTicketList: [] as cnst.LightTicket[],
})) {
  async openTicket(id: string, due: Dayjs) {
    msg.loading("ticket.openTicketLoading", { key: "openTicket" });
    this.setTicket(await fetch.openTicket(id, due));
    msg.success("ticket.openTicketSuccess", { key: "openTicket" });
    this.set({ ticketModal: null });
  }
}
```

### apps/myapp/lib/_myapp/myapp.store.ts

```ts
import { store } from "akanjs/store";

export class MyappStore extends store("myapp" as const, () => ({
  // state
  menuOpen: false,
})) {
  // action
}
```

### apps/koyo/lib/user/user.store.ts

```ts
import { store } from "akanjs/store";

import { user } from "../__lib/lib.store";
import * as cnst from "../cnst";
import { fetch, sig } from "../useClient";

export class UserStore extends store(
  sig.user,
  () => ({
    self: new cnst.User(),
  }),
  ...user.stores,
) {
  async refreshSelf() {
    const { self } = this.get();
    this.set({ self: await fetch.user(self.id) });
  }
}
```

### apps/koyo/lib/ticket/ticket.store.ts

```ts
export class TicketStore extends store(
  sig.ticket,
  ({ persist, session }) => ({
    viewMode: persist(String, { default: "board" }),
    draftKeyword: session(String, { default: "" }),
  }),
  ({ search, computed }) => ({
    status: search("status", cnst.TicketStatus, { default: "active" }),
    hasKeyword: computed(["draftKeyword"], (keyword) => keyword.length > 0),
  }),
) {}
```

### apps/koyo/lib/ticket/ticket.store.ts

```ts
export class TicketStore extends store(sig.ticket, () => ({
  // state
})) {
  _postSetStatus(status: cnst.TicketStatus["value"]) {
    if (status === "done") this.setClosedAtOnTicket(dayjs());
  }
}
```

### apps/koyo/lib/ticket/ticket.signal.ts

```ts
export class TicketSlice extends slice(
  srv.ticket,
  { guards: { root: Admin, get: User, cru: User } },
  (init) => ({
    inProject: init({ guards: [User] })
      .param("projectId", ID)
      .exec(function (projectId) {
        return this.ticketService.queryInProject(projectId);
      }),
  }),
) {}
```

### apps/koyo/lib/ticket/ticket.store.ts

```ts
async archiveTicketMany() {
  const { ticketSelectionInProject } = this.get();
  const ticketIds = ticketSelectionInProject.map((ticket) => ticket.id);
  await fetch.archiveTicketMany(ticketIds);
  this.selectTicketInProject([], { refresh: true });
}
```

### apps/koyo/lib/ticket/Ticket.Util.tsx

```ts
"use client";
import { st, usePage } from "@apps/koyo/client";
import { dayjs } from "akanjs/base";

interface OpenProps {
  className?: string;
}
export const Open = ({ className }: OpenProps) => {
  const { l } = usePage();
  const ticket = st.use.ticket();
  if (!ticket) return null;
  return (
    <button
      className={className}
      onClick={() => void st.do.openTicket(ticket.id, dayjs().add(7, "day"))}
    >
      {l("ticket.openTicket")}
    </button>
  );
};
```

### apps/koyo/lib/ticket/Ticket.Util.tsx

```ts
st.do.setTicketModal(null);
st.set({ ticketModal: null });
```

### libs/shared/lib/user/user.store.ts

```ts
import { router } from "akanjs/client";
import { store } from "akanjs/store";

import * as cnst from "../cnst";
import type { RootStore } from "../st";
import { fetch, sig } from "../useClient";

export class UserStore extends store(sig.user, () => ({
  self: new cnst.User(),
})) {
  async removeSelf({ redirect }: { redirect?: string }) {
    const { self } = this.get();
    if (!self.id) return;
    await fetch.removeUser(self.id);
    await (this as unknown as RootStore).logout();
    if (redirect) router.push(redirect);
    else router.refresh();
  }
}
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Treat convention and generated-file rules as stronger than local style guesses.

