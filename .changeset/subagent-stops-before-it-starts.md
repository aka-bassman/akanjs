---
"@akanjs/devkit": patch
"@akanjs/cli": patch
---

fix(code): an interrupt that lands before a sub-agent's run is live stops it

A sub-agent listened for its parent's interrupt only once it had been created, and the engine ignores an abort that
arrives before a run is live. So an interrupt pressed while a `task` was still opening its sub-agent — connecting
its MCP servers, say — or in the moment between that and the sub-agent's run starting was lost: the sub-agent ran
its whole task anyway, and in the second case its notice even said "stopped".

A sub-agent whose parent was interrupted while it was being created now never starts, and one interrupted after that
is stopped as soon as its run is live. Either way it reports `stopped`, and its tokens are added to the tree's tally
once.
