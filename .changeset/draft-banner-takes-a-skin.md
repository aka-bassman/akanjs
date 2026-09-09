---
"akanjs": patch
---

The recovered-form banner is the app's to size and to skin.

- `Model.EditModal` takes `draftBarClassName`, so a dense screen — an editor sitting right under its own header —
  can trim the banner's padding and type without forking the shell.
- `DraftBar` is an override slot, bound like any other in a `page/**/_overrides.tsx` manifest. The shell keeps the
  draft state and keeps publishing the restore and discard tools, so a replacement takes `state`, `savedAt`,
  `onRestore` and `onDiscard` as props instead of reaching into the store under string keys.
- A draft the record has caught up with is dropped rather than offered back. A form that saves itself as the user
  types moves `updatedAt` with its own save, so every reopen read as a conflict and asked the user to settle a
  difference that was not there.
- `Model.Edit` forwards `draft` the way `Model.New` already did, so a form opened through it can turn recovery off
  at all.
