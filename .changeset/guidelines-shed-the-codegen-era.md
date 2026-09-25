---
"@akanjs/cli": patch
"@akanjs/devkit": patch
---

The guideline set drops what only the removed code generator read

Six guidelines existed for `AiSession`'s codegen contract and nothing else, and are gone:
`docPageRule`, `docSyncRule`, `moduleCodegen`, `enumConstant`, `sharedUiUsage` and `utilUiUsage`. Nothing in the
workspace or in any skill named them, and their bodies asked the model for a `// File: <path>` block contract that
an agent with edit tools cannot use. `akan-module` no longer offers `moduleCodegen` as a deeper read.

Every `<name>.generate.json` is deleted, along with `Prompter.getGuideJson` and the `GuideGenerateJson` /
`GuideScan` / `GuideUpdate` types `@akanjs/devkit` re-exported. The `codegenPriority`, `scans` and `update.rules`
fields they carried were read by nothing after the generator left; the only consumer was `akan guideline show
--format json` echoing them back.

`akan guideline` therefore loses its `--format` option — `list` prints names and `show` prints one instruction,
which is what both did in their default mode anyway. Guideline names drop from 35 to 29. What remains is the
deep-dive set the `AGENTS.md` table points at, plus the three documents `akan agent install` composes the
workspace guide from (`conventions`, `workspaceOnboarding`, `framework`). MCP `get_guideline`, the
`akan://guidelines/<name>` resources and the `akan guideline list` / `show` commands are unchanged otherwise.
