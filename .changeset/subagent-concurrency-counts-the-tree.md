---
"@akanjs/devkit": patch
"@akanjs/cli": patch
---

fix(code): at most `maxConcurrent` sub-agents run at once across the whole tree

`/agents` says a profile runs sub-agents "at most N at once", but each `task` pool counted only its own children,
so a child agent could open N of its own while its parent's N were still running — with the shipped presets (two
levels, three at once) up to 12 sub-agents ran at once instead of 3.

The running count now travels with the tree's token tally (`SubagentSpend` gained `running`), so every pool of one
tree checks the same number. A `task` over the limit is refused, as before, and never queued: every ancestor keeps
its slot while it waits on its child, so a queued child would deadlock the tree. The refusal tells an agent that has
sub-agents of its own running to wait for one of them or do the work itself, and one that has none to do it itself.
