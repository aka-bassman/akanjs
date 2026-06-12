# Repair Loop Rules

The benchmark's default mode is `repair-loop`.

## Maximum Attempts

- First implementation prompt: 1 attempt.
- Repair prompts: at most 3 additional attempts.

## Allowed Repair Input

When build or smoke verification fails, provide only:

- The command that failed.
- The raw failure log.
- The failed acceptance criteria.

## Disallowed Repair Input

Do not provide:

- Human interpretation of the root cause.
- Stack-specific implementation hints.
- Suggested code snippets.
- Links or docs that were not equally provided to every stack.
- Extra product requirements.

## Stop Conditions

Stop when:

- Build succeeds and smoke test passes.
- The repair attempt limit is reached.
- The app cannot start due to dependency or environment failure.

Record failed runs. Do not hide them from the report.
