---
name: akan-scaffold
description: "Create a new module, scalar, field, mutation, slice, or UI surface — scaffold it with the akan workflow tools (plan_workflow / apply_workflow) instead of writing the files by hand."
---

# Akan scaffolding workflows (use these BEFORE writing files)

Akan generates the conventional file set for you. Creating those files by hand skips the conventions, the
generated-barrel sync, and the validation chain.

## Step 0 — decide WHAT gets a module, before any tool call

List the things the request says must be **stored in the database**. Those, and only those, become modules.
Everything else is pages, sections, and props.

- A page or section whose content you can write as static JSX or props is not an entity. "A self-intro page
  with two detail pages" is pages only — no `profile` module.
- Never invent a supporting entity (profile, category, tag, author, like) to round out a design. If one looks
  genuinely necessary, say so in your reply and let the user decide.
- "… plus a comment zone that saves to a database" is exactly one new module: `comment`.
- Check what exists first (`list_modules`) and extend it when it already fits — `add-field` / `add-slice` /
  `create-ui` beat a whole new module.
- Build the entire request, at the smallest structure that satisfies it.

Then pick the workflow that matches the intent:

| The user wants… | workflow |
| --- | --- |
| a new database-backed entity (comment, post, todo, product …) | `create-module` |
| a reusable embedded value object | `create-scalar` |
| a new field on an existing module | `add-field` |
| a new field with a closed set of values | `add-enum-field` |
| a new state-changing action | `add-mutation` |
| a filtered list, tab, or reusable query | `add-slice` |
| a View / Unit / Template / Zone / Util for an existing module | `create-ui` |

## The chain

Each result names the next call in `next.tool`. Follow it; do not improvise.

1. `plan_workflow({ workflow: "create-module", inputs: { app: "<app>", module: "comment" } })` — read-only.
   Returns `planPath` and `next.tool=apply_workflow`. (`list_workflows` / `explain_workflow` give the names
   and each workflow's inputs.)
2. `apply_workflow({ planPath })` — writes the scaffold and syncs the generated barrels. Returns
   `validationTarget`.
3. `run_validation({ runIdOrPlan: <validationTarget> })`, or just call `akan_verify`, which runs the whole
   chain over everything the working tree changed.
4. **Read each scaffolded file before editing it.** They are a few lines each and they extend base classes
   that already generated the CRUD surface. Read the `akan-store` skill before touching a store or adding
   signal endpoints, or you will redeclare `create<Model>` and hit an "already exists" typecheck error.
5. Now fill in: real fields in the constant, invariants in document and service, non-CRUD API in the signal,
   extra state in the store, rendering in the UI. Filling in a scaffold is the job; creating one by hand is
   not.

## Rules

- One run per unit of structure: two new entities are two `create-module` runs.
- `requiresApproval: true` on a plan is a review signal for you, not a permission gate — read
  `predictedChanges`, then apply.
- Hand-writing files is the fallback, used only when no workflow matches, or when apply reports
  unsupported / no-op / failed diagnostics telling you to act manually. Say which case applied.
- Never hand-edit a generated file to "finish" a scaffold — use `repair_generated` or `akan sync <app>`.
- No workflow tools this turn? The same order through bash:
  `akan workflow list` → `akan workflow plan create-module --app <app> --module comment --format json --out <path>`
  → `akan workflow apply <path> --format json`.

## Worked example — "an intro page, two detail pages, and a comment zone with a database"

0. What must be stored? Only the comments. One module, `comment`. The three pages are static content.
1. `plan_workflow({ workflow: "create-module", inputs: { app: "<app>", module: "comment" } })`
2. `apply_workflow({ planPath })` — `lib/comment/*` exists, barrels synced.
3. Read the scaffolded files. Edit `comment.constant.ts` for the real shape. The store's CRUD already exists;
   leave the store body empty unless you need extra state.
4. Write the pages and the comment UI against the generated actions — `st.do.createComment`,
   `st.do.initCommentInPublic`, `st.use.commentListInPublic`.
5. `akan_verify` until clean.
