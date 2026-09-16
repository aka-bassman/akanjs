---
"akanjs": patch
"use-agentic": patch
---

A turn the provider cut off says so, instead of passing as a finished one

`LlmTurnAnswer.stop` gains `"length"` — `finish_reason: "length"`, `stop_reason: "max_tokens"` — and it rides the
wire and the `AgentStop` enum to the browser. It is not one provider's quirk: every adaptor here reports it,
including the default, and only the shape of the union was hiding that.

Without it a truncated answer arrived as `stop: "end"` and the user read half a sentence as the whole reply. Worse
on an agent surface: a turn cut off mid tool call carries no complete call, so it ended the loop looking exactly
like a model that had decided it was done — a hang the transcript explained as a choice. The session now records
the turn as incomplete on the assistant message the user is reading, and closes any call the turn did make rather
than running it, since a batch the model was interrupted inside is half an intention.

The ceiling wins over the calls that did arrive, in both adaptors and on both the streamed and whole paths.
