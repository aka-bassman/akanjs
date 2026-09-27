---
"akanjs": patch
---

fix(ui): component, client and projection fixes from the framework bug sweep

- **A server-rendered `Link` to a `#hash` keeps the caller's props** — `target`, `onClick`, `aria-*`, `data-*` —
  like every other `Link`.
- **`Input.TextArea` attaches `inputRef` to the textarea** instead of spreading it onto the DOM, where React warned
  and the ref stayed empty.
- **`System.Reconnect` removes the disconnect listener it added**, so remounts no longer stack listeners that each
  ping on every disconnect.
- **`Agent.Context` renders on every environment except `AKAN_PUBLIC_ENV=main`**, like `Agent.Dock`; a
  shell-exported `NODE_ENV=develop` no longer hides it.
- **The `LoadingArea` override slot takes `Loading.Area`'s props**, so `<Loading.Area className>` typechecks and an
  override can type its props.
- **`System.Root` is flagged as deprecated where it is used**, not only on its props type.
- **`useCodepush` no longer interrupts every release check with a debug `window.alert`.**
- **`storage.removeItem` falls back to `localStorage` when the native Preferences call rejects**, as `getItem` and
  `setItem` already did.
- **A projected read of a row written before a field existed gets that field's default the way a full read does**:
  an array gets its own fresh copy (pushing into it used to rewrite the model's default for every later document),
  and a required nested scalar gets its default instead of `null`.
- **`logger.raw(msg)` writes the text as given**, like the static `Logger.raw`; it used to append a newline.
