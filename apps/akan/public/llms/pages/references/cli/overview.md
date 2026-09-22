# Commands

- Source: /references/cli/overview
- Mirror: /llms/pages/references/cli/overview.md
- Section: references
- Category: CLI Reference
- Priority: P0

## Headings

- CLI Commands (#cli-commands)
- Shared Behaviour (#shared-behaviour)
- Command Index (#command-index)

## Content

Commands

Create a workspace and keep repository-wide generated surfaces synchronized.

Manage app lifecycle work from local development to mobile release and database helpers.

Create, install, remove, and sync shared libraries used by apps.

Manage framework/tooling packages under pkgs/akanjs.

Generate database modules, service modules, and optional module UI companion files.

Create reusable value types that are not database-backed document models.

Generate CRUD page routes for an existing module inside an app.

Scaffold into a module that already exists: one UI surface, one field, or one enum field.

Plan a change, read the plan, apply it, validate what it did, and repair what validation caught.

Report code quality warnings across every app and lib, and measure the server render share per scope.

The order the agent guide prescribes, in one place: sync, lint, typecheck, test, build. `doctor` reports convention drift and `quality` measures code shape; neither is a gate, and both are worth reading before a review.

Configure optional cloud authentication, environment transfer, and framework updates.

Share a locally running app on a public URL, as a standalone command rather than part of a dev session.

Run the Akan coding agent in the terminal, carrying the workspace's own tools and skills.

Expose workspace context, module abstracts, diagnostics, guideline instructions, agent rules, and the MCP tools, whose reach is set per run by --mode.

CLI Commands

The Akan CLI manages the whole workspace lifecycle: workspace creation, app development, generated code, libraries, packages, modules, scalars, pages, mobile builds, local databases, and optional cloud helpers.

This overview is a command index. Open the matching detail page for command-specific argument tables, option tables, notes, and terminal examples.

Shared Behaviour

Three things hold for every command and are not repeated on the detail pages.

Registered on every command. It turns on the executor's verbose output, so each spawned process and its arguments are printed as they run.

An option declared as `allowLocalRelease` is registered as `--allow-local-release`. The camelCase spelling is the name in the source, never the flag you type.

A command that declares a short alias also answers to the first letter of each dashed word: `akan ba` is `akan build-android`. A required argument left off the line is asked for rather than defaulted.

Command Index

Each CLI group mirrors a command declaration under `pkgs/@akanjs/cli`. Internal or development-only commands are intentionally skipped from public docs.

## Code Examples

No code snippets were extracted from this page.

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Use commands from the workspace root unless a page explicitly says otherwise.

