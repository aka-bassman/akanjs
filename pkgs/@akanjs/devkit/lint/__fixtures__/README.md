# grit rule fixtures

One folder per `lint/*.grit` rule. `gritRules.test.ts` runs biome with that one plugin enabled and asserts
`bad` reports **exactly** the marked lines and `good` reports nothing — so a rule that silently stops
matching after a biome upgrade fails the suite instead of going quiet, and `every rule in this folder has a
fixture` fails when a rule is added without one.

## Contract

- One case per line. `// @flag` marks a line the rule must report in `bad`; `// @ok` marks a line in `good`.
- The `bad` assertion is set equality, not containment: a marked line nobody reported is a pattern that
  stopped matching, and a reported line nobody marked is the rule reaching further than the fixture claims.
- `good` is the half that matters most: an over-matching rule is what makes developers distrust the gate.
- `fixture.json` is optional:
  - `path` — where the source is written inside the temp workspace, for a rule that reads `$filename`
    (`no-deep-internal-import`, `no-redeclare-predefined-endpoint`). Its extension also picks which of
    `bad.ts` / `bad.tsx` is read.
  - `expect: "file"` — for a rule whose span is the whole file (`no-bang-comment-in-client`), where there is
    no per-line diagnostic to match. `bad` must report at least once.
- A rule with two independent gates gets one subfolder per gate (`no-init-fetch-in-client/{use-client,store-file}`).
- These files are excluded from the repo's own biome run (root `biome.json` `files.includes`) and from
  `tsc` (`tsconfig.json` `exclude`), because they reference undeclared identifiers on purpose and the
  formatter would reorder the class strings the vocabulary fixtures test.

## Biome GritQL constraints these fixtures pinned down

Each of these made a rule silently report nothing, and each was found by adding the fixture:

- A bare snippet in JSX-attribute shape (`` `$name={$value}` ``) matches **no** JsxAttribute. Match the node
  and read its fields: `JsxAttribute(name = $name, initializer = ...)`.
- `JsModule()` never matches as a top-level pattern, and no node pattern is given comment trivia. A rule
  about comments has to go through `file($name, $body)`, whose span is the whole file.
- `file()`'s `$body` is the module's **token** span: interior trivia is visible, the leading and trailing
  trivia are not. So a comment above the first statement or below the last one is unreachable from GritQL —
  that is `no-bang-comment-in-client`'s blind spot, and why its fixture puts the marker between statements.
- A regex capture (`r"..."($var)`) carries no source range: a diagnostic spanned on one gets no location,
  and `$var` does not interpolate into a `message`.

The five vocabulary fixtures were ported from `frontendBuild/styleGuard.test.ts`, the pre-grit
implementation of the same rules, when that scanner was retired.
