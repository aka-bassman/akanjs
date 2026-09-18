---
"akanjs": minor
---

A chat's transcript has a turn in it

`AgentSteps` is a new `_overrides.tsx` slot holding one agent turn: the messages between the user message that
opened it and the next one, plus `isRunning` for whether more are still coming. It is the grain a chat needs to
fold a turn's steps into a `details` and stand its final answer outside them — and the one boundary no per-message
slot can see, because neither message on either side of it knows it is at an edge.

The transcript now emits per turn rather than per message. A user message still stands alone as its own `Bubble`;
everything after it goes to one `AgentSteps` until the next user message, which also means a transcript whose head
is a compaction summary opens a turn of its own. The array handed over is what the turn *renders* rather than what
it holds on the wire: a tool message whose results a call row already draws is gone, and one holding results no
call claims is narrowed to those, so an app folding a turn never re-derives the call/result pairing.

**The default adds nothing.** It draws the same flat bubbles into a Fragment, not a box, so it takes no
`className` and no existing layout can tell the component is there. `DefaultSteps` is exported from `akanjs/ui`
beside the other defaults, for a skin that wants to compose the one it is replacing.

`isRunning` is only ever true of the last turn of a transcript the session is working on. Without it the same
messages read the same whether the agent is mid-step or finished, and a scaffold cannot tell a live progress line
from a completed turn's header.
