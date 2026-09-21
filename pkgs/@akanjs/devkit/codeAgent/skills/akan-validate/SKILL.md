---
name: akan-validate
description: "Run the akan check loop after editing and fix each failure class the right way — no silencing, no lint-disable, no gaming the checker."
---

# Akan validation loop

## One call does the whole chain

`akan_verify` runs sync → lint → typecheck → `quality ssr` over everything the working tree has changed, in
the right order, and reports only what failed. **Call it after editing, before you say you are done.** It
also runs itself at the end of a turn that changed source, so a failure comes back to you either way.

The same chain by hand, for the app you are editing:

- `akan sync <app>` — after adding, renaming, or deleting any file. Regenerates the barrels.
- `akan lint <app>` — fast; run after every edit. Prints up to 200 diagnostics.
- `akan typecheck <app>` — the client/server boundary violations land here, not in lint.
- `akan quality ssr` — only when you wrote or changed a `.tsx`. Did the server share hold?
- `akan build <app>` — the full production build; slower, and only when the build itself is in question.

Raw `tsc` misses the generated barrels and reports false errors. Do not reach for it.

## Fixing rules

**Apply the real fix the rule intends. Do not silence the checker.** No blanket lint-disable, no throwaway
re-export, no export-in-place trick, no `as any`, no non-null assertion. Gaming a check is a defect, not a
fix. When a suppression is genuinely right it carries a reason:
`// biome-ignore lint/<rule>: <why>` — and a grit plugin diagnostic is suppressed as `lint/plugin`, not the
bare `plugin` category Biome's own message suggests.

Common classes and their real fix:

| symptom | fix |
| --- | --- |
| a member "already exists" or conflicts with the base class | you redeclared something Akan generates, usually store CRUD. **Delete your version** and call the generated one — do not rename, cast, or suppress. See `akan-store`. |
| `throw new Error` | a typed `Err` with a dictionary key. See `akan-err`. |
| an edit to a generated file | regenerate instead: `akan sync <app>` or `repair_generated`. |
| a file in the wrong place | relocate to `common/` / `webkit/` / `srvkit/` / `ui/`. Never a sibling helper `.ts` inside `lib/<model>/`. |
| a missing dependency | declare it in the owning app or lib `package.json`. See `akan-deps`. |
| a Tailwind class order or colour complaint | let the formatter sort; use semantic tokens. See `akan-ui`. |

Re-run until clean. If a failure is genuinely outside the scope of what you changed, say so in your reply
instead of forcing it.
