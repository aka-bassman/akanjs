---
"akanjs": patch
"use-agentic": patch
---

feat: the in-page agent issues independent tool calls in one turn instead of one per turn

A turn has always been able to carry several tool calls — the session collects every `toolCall` event, runs them in
order and posts them back as one `tool` message — but nothing asked the model to use it. A screen that needed ten
calls got ten turns, each paying a full model round trip and a resend of the whole transcript, and the turn cap
then parked the run on a "keep going?" card halfway through.

- `AgentService.preamble` is the framework's own half of the system prompt, ahead of whatever the app declared. It
  asks for the batch — every call that does not need another call's result goes in the same turn, and a tool that
  does the whole job in one call (a form's fill tool) beats one call per field — and it asks the model not to read
  the screen back to confirm work it has just done, since the change report it was handed already says so. Both
  sentences were measured against the provider: "approve these eight" went from 1.5 turns (with three runs in eight
  doing nothing at all) to one turn in every run, and "read the screen, then approve what is pending" from 3.0
  turns to its floor of 2.0 in every run. The read a fresh route needs after `navigate` is acquisition rather than
  confirmation, and survived in every run of that scenario. It is composed in the service rather than in an adaptor
  for the reason `explained` is — an adaptor that has to remember it is one that forgets.
- The turn cap defaults to 12 assistant turns instead of 8. A chain of ten calls could not finish under the old
  default without the user answering a question first.
- `readState` and `highlight` declare `settle: false`, as `readScreen` already did. A settle is 120ms of DOM quiet
  at the very least, and neither of them changes anything a resource holds, so ten reads paid a second and a bit
  for a change report that is empty by construction.
