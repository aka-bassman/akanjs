---
"@akanjs/cli": patch
"@akanjs/devkit": patch
---

The CLI's AI editor is removed, and with it the `--ai` commands

`AiSession` — the langchain-backed editor that asked a model to write module constants, dictionaries, scalars,
UI components, guideline instructions and abstract files — is deleted, along with every command that drove it.
Gone: `akan set-llm`, `akan reset-llm`, `akan ask`, `akan compact`, `akan generate-instruction`, `akan
update-instruction`, `akan generate-document`, `akan reapply-instruction`, and the `--ai` flag on `akan
create-module` and `akan create-scalar`. The scaffolding halves of those two commands are unchanged and are now
what they always do.

`akan guideline list` and `akan guideline show` are unaffected — guidelines are bundled files the CLI reads and
never writes, and MCP `get_guideline` serves the same ones. `akan quality scan` still warns on an abstract past
300 lines; there is no longer a command that rewrites one for you.

The `@langchain/*` dependencies leave `@akanjs/cli`, `@akanjs/devkit` and the workspace root — they were the
heaviest lazy-loaded stack the CLI carried, and `EntryModuleGraph` no longer has to guard against one reaching
an entry. The workspace-global config at `~/.akan/config.json` no longer holds an LLM key; an existing `llm`
entry is ignored and can be deleted.

This is the dev-time editor only. The in-page agent's runtime `LlmAdaptorRole`, `option.setLlm(...)` and the
shipped adaptors are a different surface and are untouched.

Step-by-step migration: `akan guideline show workspaceRecipes`, Recipe 8.
