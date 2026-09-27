---
"@akanjs/devkit": patch
"@akanjs/cli": patch
---

fix(code): every sub-agent of one tree draws on one token budget

A profile's `subagent.budget` is documented, and shown by `/agents`, as the tokens "a whole subagent tree may
spend", but each `task` pool kept its own count. A child's pool started from zero against the same ceiling and
counted only its own children, so with the shipped presets (two levels, three at once) a tree could spend several
times the budget before anything refused.

The count is now one object for the whole tree: the root pool starts it, hands it to every child agent it opens
(`CodeAgentOptions.subagentSpend`, forwarded through `AkanCodePlugins` to the child's pool), and each sub-agent's
tokens are added to it when that sub-agent finishes. Once the tree has spent the budget, `task` refuses at every
level, and the "sub-agent finished" notice reports the tree's total. Depth and concurrency limits are unchanged.
