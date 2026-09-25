---
"akanjs": patch
---

A relation field renders the value it holds

`Field.Parent` / `ParentId` / `Children` / `ChildrenId` built their options out of the slice list alone, and that
list is loaded when the dropdown opens. A form filled by `edit<Model>` therefore rendered an empty control over a
value it was holding — and opening the dropdown did not always fix it, because a slice list is one `limit`-sized
window and the row the value points at can sit outside it.

`Select` was the immediate cause: a selected value with no matching option rendered nothing at all, `renderSelected`
included, so no amount of care in the caller could have painted it. It now renders the value it is given, which is
what a controlled component owes its parent — an enum that lost a member shows the stale value rather than a blank
field.

The four controls now merge what they hold into their options. A `Light`-valued control already carries the row, so
it needs no request and the value is right in the server render. An id-valued control carries no row at all, so a
missing one is read through the generated `light<Model>` endpoint and cached per `refName:id` — deliberately beside
the store rather than in it, because a model store is a singleton and resolving into it would overwrite whatever
listing of the same model the screen is already showing. A row that cannot be read — removed, or behind narrower
`get` guards than the slice the control lists from — is remembered as unreadable rather than retried, and the
control shows the id.

Four things came with it, all of them the same bug seen from another side:

- Opening the dropdown no longer invalidates the slice list. It refreshed on every open, replacing the rows any
  `Load.Units` on the same page had put on screen; it now reuses what the store already loaded.
- `Field.ParentId` offered its options as bare ids, so `searchable` matched on the hex id while the option on
  screen read as a name. Every control now labels its options — from `renderOption` when that returns a string,
  otherwise from the model's own `labelOf`.
- `sortOption` was accepted by all four and applied by none.
- `Select` takes `loading`, and the controls pass the slice's loading flag, so an opened dropdown says it is
  fetching instead of claiming there is nothing to pick.
