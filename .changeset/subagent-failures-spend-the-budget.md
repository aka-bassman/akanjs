---
"@akanjs/devkit": patch
"@akanjs/cli": patch
---

fix(code): a sub-agent that fails or is stopped still spends from the tree's budget

A sub-agent's tokens were added to the tree's tally only when its run returned normally. One whose run threw — a
provider or engine error after it had already spent tokens — added nothing and said nothing, so a tree of failing
sub-agents could spend past the budget without `task` ever refusing; one stopped by its parent's interrupt was
counted but announced as "finished".

Each sub-agent's own tokens are now added exactly once however it ends, and the notice says how it ended:
`explore sub-agent finished|failed|stopped, N tokens (M of B spent)`. A sub-agent's own children are still counted
by its pool, so nothing is counted twice.
