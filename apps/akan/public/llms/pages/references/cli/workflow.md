# Workflow

- Source: /references/cli/workflow
- Mirror: /llms/pages/references/cli/workflow.md
- Section: references
- Category: CLI Reference
- Priority: P0

## Headings

- Workflow CLI (#workflow-cli)
- Plan, Apply, Validate (#plan-apply-loop)
- Workflow Catalogue (#workflow-catalogue)

## Content

Workflow

List, explain, plan, apply, validate, or report an Akan workflow. A workflow is a named recipe for a change that always touches the same files in the same order — a field, a module, a slice. Planning it produces a JSON file you can read before anything is written, and applying it consumes that file. `plan` and `explain` never write source. `apply` does, and only from a plan file.

Run one narrow repair and return a structured report. Each kind is a known remedy for a known diagnostic, run through the same reporting shape as an apply: what it ran, what it changed, what to do next. Two of the five change nothing on their own — `dictionary` and `module-shape` read `akan doctor --strict`, filter its diagnostics to your module, and name the primitive command that would fix them.

Workflow CLI

Adding one field to a module is six edits in five files, and four of them are mechanical. Do it by hand and the interesting part — the name, the type, the default — competes for your attention with a dictionary label and a generated barrel. Do it twice and the two modules disagree.

A workflow names that change once. You plan it, read the plan, apply it, and validate what it did. `akan repair` is the other half: when validation fails, it runs the one command that clears that failure.

Plan, Apply, Validate

The four steps are one chain, and each hands the next a file path rather than a name. That is what makes the sequence reviewable: the plan is a document before it is an action, and the run artifact is a record after it.

Reads the workspace and writes a JSON plan: the steps, the files it predicts it will change, the validation it will want afterwards. Nothing in your source is touched.

Takes the plan file, not a workflow name. An invalid or unreadable plan is reported as a diagnostic instead of throwing, so the report shape is the same whether it worked or not.

Runs the validation commands the plan asked for — sync, lint, typecheck — and classifies a failure as a source change, a workspace config problem, or an environment one.

The remedy for that classification. `generated` re-syncs, `format` and `imports` re-lint, and the two report-only kinds point at the primitive that fixes a module.

Workflow Catalogue

Seven workflows ship with the CLI. `akan workflow list` prints them with the same descriptions, and `akan workflow explain <name>` adds the inputs, the predicted changes, and the completion criteria.

## Code Examples

No code snippets were extracted from this page.

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Use commands from the workspace root unless a page explicitly says otherwise.

