---
"akanjs": patch
"use-agentic": patch
---

A stopped turn leaves no bubble that is still writing

`AgentSession` opens an assistant draft before the first token arrives, and Stop caught before that token left the
draft in the transcript forever. `Transcript` already drops an empty assistant message, so the wire and the
persisted history were both correct and the rendered array was the one place it survived — which is exactly the
array a bubble reads to decide it is still being written, so the pulsing dot never stopped. The turn's own settle
now drops it, using the predicate `Transcript` already applies. A turn a provider ends without saying anything
leaves nothing behind either, for the same reason.
