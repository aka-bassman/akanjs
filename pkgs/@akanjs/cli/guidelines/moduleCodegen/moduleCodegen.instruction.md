# Module Codegen Orchestration Guideline

## Purpose
Use this to orchestrate AI-assisted module creation. The model should emit small, parseable file blocks and preserve Akan ownership boundaries.

## Ownership
- Input description explains the business object, lifecycle, actions, queries, UI needs, and relations.
- The first output pass should prioritize data shape and persistence over decorative UI.
- Each returned code block must start with `// File: <relative path>` so the caller can tell which file it writes.
- Generated files must target `lib/<model>/...` or `lib/__scalar/<scalar>/...` only unless explicitly requested.

## Current Akan Patterns
- Phase 1: generate or update `model.constant.ts`, `model.dictionary.ts`, and `model.document.ts`.
- Phase 2: generate service, signal, and store only when there are business workflows or page-callable actions.
- Phase 3: generate UI files only after store/signal data flow is known.
- Use docs-backed examples from the current app and connected libs before inventing patterns.

## Codegen Rules
- Return only file blocks for writes, plus no prose in codegen responses unless explicitly requested.
- Prefer conservative defaults: one useful query, one insight only if analytics are requested, and minimal UI variants.
- Avoid broad abstractions; create helper functions only when they remove clear duplication inside the target module.
- When unsure whether a value should be scalar or module, choose scalar for embedded value objects and module for independent lifecycle or permissions.

## Review Checklist
- The instruction points to current docs pages, not removed docs routes.
- Generated examples use current Akan builder APIs and scanner-friendly filenames.
- The output contract tells the model which file paths to return.
- The guide avoids broad framework essays when a concrete file rule is better.
