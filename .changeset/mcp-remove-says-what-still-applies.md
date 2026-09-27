---
"@akanjs/devkit": patch
"@akanjs/cli": patch
---

fix(code): `/mcp remove` says when the home file still declares the server, and honours `--local`

`akan code` reads MCP servers from two files — `~/.akan/code/mcp.json`, which every repo reads, and the repo's
`.akan/code/mcp.json`, which wins a name both declare. `/mcp remove <name>` takes the repo's entry first, so on a
name both files declare the home file's declaration took over after the reload, possibly with a different command
or url, while the notice read only "removed X from the workspace file". The notice now adds that the global file
still declares it, so it still applies, and that running `/mcp remove X` again removes that one too.

`--local` was accepted by `/mcp remove` and ignored. It now means what it means for `/mcp add`: this repo's file
only. A name only the home file declares is left alone, and the reply says where it is declared.

`McpServerConfig.remove(workspaceRoot, name, only?)` takes the scope as an optional third argument; without it the
lookup order is unchanged. The `akan-code` skill's manual now names both files and both flags.
