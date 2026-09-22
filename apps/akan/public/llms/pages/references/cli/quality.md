# Quality

- Source: /references/cli/quality
- Mirror: /llms/pages/references/cli/quality.md
- Section: references
- Category: CLI Reference
- Priority: P0

## Headings

- Quality CLI (#quality-cli)
- What Scan Reports (#scan-scopes)
- Server Render Share (#server-share)

## Content

Quality

Scan every app and library for Akan code quality warnings, or measure the server/client render balance. It reports and never fails: the command exits successfully whatever it finds, so a scan can run beside lint and typecheck without becoming a third gate. Both actions run the same scan. `ssr` keeps only the warnings whose scope is `ssr` and leads with the server render share.

Quality CLI

Lint tells you a line is wrong. This command tells you the shape of the codebase is drifting: a file that grew past what one reader can hold, a module whose UI never got a server surface, a page that moved its markup into the bundle. None of that is a syntax error, and none of it shows up until somebody measures.

Reach for it before a review, after a refactor, and whenever a change touched `.tsx` files — the render balance is the one number a UI change can quietly cost you.

What Scan Reports

Every warning carries a scope, and the scope is the fastest way to read a long result. These are all six, in the order they appear in the output.

Scope

The text output ends with the SSR balance and the suggested-rules list, so a plain `akan quality` already answers both questions. `akan quality ssr` exists for the times you only want the second one.

Server Render Share

The share is JSX elements rendered on the server over the total, counted per app and per library with a workspace row at the end. Anything under 50% is marked in the output with `<- below the 50% target`.

Treat 50% as the floor and a falling share as a regression: if a change moved markup to the client, either say why or move it back.

Rule

## Code Examples

No code snippets were extracted from this page.

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Use commands from the workspace root unless a page explicitly says otherwise.

