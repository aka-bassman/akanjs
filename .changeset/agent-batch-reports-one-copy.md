---
"use-agentic": patch
---

fix: a batch of tool calls reports each changed resource once, as it finally stands

Every call takes its own before-and-after of the surface, so eight approvals in one turn each attached the whole
task list they approved from — eight copies in one `tool` message, each bounded at 20,000 characters on its own,
riding every later turn until compaction.

Size is the smaller half of it. The model reads the batch as one message, and by then only the last copy is still
true: the first seven are stale snapshots of a value printed directly below them. `ToolOutput.deduped` keeps the
last report of each resource and drops the superseded ones, so the batch says what changed once and says it
correctly. Dropped rather than marked, because a change entry with no value is a reason to go and read the screen
again — the round trip the change report exists to save. What each call itself did is still its own `result`.

The framework asks the model to batch independent calls, so this is now the common shape rather than the rare one.
