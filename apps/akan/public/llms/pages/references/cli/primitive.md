# Primitive

- Source: /references/cli/primitive
- Mirror: /llms/pages/references/cli/primitive.md
- Section: references
- Category: CLI Reference
- Priority: P0

## Headings

- Primitive CLI (#primitive-cli)
- Primitive Or Workflow (#primitive-or-workflow)

## Content

Primitive

Create one conventional UI surface for a module that already exists. It writes a single file — `lib/<module>/<Module>.View.tsx`, `.Unit.tsx`, or `.Template.tsx` — from the same template the module scaffolder uses, and touches nothing else. The report names `akan sync` and `akan lint` as the next actions; the command does not run them for you.

Add one field to a module's constant and dictionary. It writes the field into `<Module>Input` in `<module>.constant.ts`, adds the `akanjs/base` import when the type needs one, and adds the matching label under `.model<Module>` in `<module>.dictionary.ts`. Every edit is verified against the edited source before anything is written: if the field is not where it was inserted, the whole write is abandoned and reported.

Add a field whose values are a closed set. It does everything `add-field` does, and first declares the enum: an `enumOf` class named `<Module><Field>` in the constant, with the `enumOf` import added, and its options registered in the dictionary's enum stage. The field's type is that class, which is why this command takes values instead of a type.

Primitive CLI

The module is already there. You need one more field on it, or the View component it never got — and the mechanical half of that job is the half that goes wrong: a label missing from the dictionary, an import that was never added, a component in the wrong file.

These three commands are scaffolders that edit an existing module. They are the same steps the `create-ui`, `add-field`, and `add-enum-field` workflows apply, reachable directly when you already know what you want and do not need a plan to review.

Primitive Or Workflow

A primitive is one edit you already decided on. A workflow is the same edit plus the plan you read first, the UI surfaces it also touches, and the validation it runs afterwards.

Two files, one command, no plan file. You run sync and lint yourself. This is the shape for a field you are adding while you are already in the module.

A reviewable plan, the Template form updated when you name it in surfaces, the Light projection when you ask for it, and sync plus lint plus typecheck run for you afterwards. This is the shape an agent is told to use.

## Code Examples

No code snippets were extracted from this page.

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Use commands from the workspace root unless a page explicitly says otherwise.

