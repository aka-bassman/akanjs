# model.store.ts Guideline

## Purpose
Generate client state coordination for a module. Store connects generated fetch calls to form state, list state, detail state, toast messages, and UI-facing actions.

## Ownership
- Create the store with the current `stateOf(fetch.model, customState)` pattern used by nearby modules.
- Use generated `st.use.*` selectors in UI and generated `st.do.*` actions for state changes.
- Keep temporary UI state, selected IDs, query args, and form state in store when shared across components.
- Call generated fetch endpoints from store actions rather than directly inside presentation components.

## Current Akan Patterns
- Use store actions for submit, refresh, pagination, filter changes, dialog-confirmed actions, and optimistic UI updates.
- Use generated field setters for Template form inputs where available.
- Keep server invariants in service; store should coordinate user interaction and client state.
- Use user-facing messages consistently with dictionary terms.

## Codegen Rules
- Do not duplicate server data shape as independent client interfaces.
- Do not store derived values that can be computed cheaply from existing state.
- Do not perform persistence logic in React components when a store action can own it.
- Do not call private or internal signal operations from UI state.

## Form Draft Recovery
- `<model>FormDraft`, `restore<Model>FormDraft`, `discard<Model>FormDraft` and `load<Model>FormDraft` are
  generated. Do not hand-write a draft action, and do not write `<model>Form` to browser storage yourself.
- The draft key carries the signed-in user, derived by hashing the auth token's payload with `iat`, `exp`, `nbf`
  and `jti` removed. **Do not put a claim that changes on every issue into the JWT.** One would rotate the key on
  every silent token refresh, and the symptom is a form that never recovers anything: the draft was written under
  a key nothing looks for again, and it lingers until the seven-day sweep.
- `field.secret` and `field.hidden` values are never written to a draft, so they come back empty. That is the
  intended trade — a user retypes a password — and is not something to work around.
- A model whose form holds a large `field.visual` body can pass the 256KB per-draft cap, and a draft over it is
  dropped with a warning rather than truncated.

## Review Checklist
- The instruction points to current docs pages, not removed docs routes.
- Generated examples use current Akan builder APIs and scanner-friendly filenames.
- The output contract tells the model which file paths to return.
- The guide avoids broad framework essays when a concrete file rule is better.
