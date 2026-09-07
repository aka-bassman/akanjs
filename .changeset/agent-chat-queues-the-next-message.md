---
"akanjs": patch
---

The in-page chat takes the next message while a turn is still running.

- Enter (or the Queue button that appears beside Stop) during a turn parks the message and sends it the moment the
  turn ends, instead of doing nothing. One slot: a second send joins the first on a new line, so the model is
  handed one user message. Staged files ride along, under the same per-message ceilings.
- The parked message shows on a card above the composer with two ways out — take it back into the composer to
  change it, ahead of whatever was typed since, or drop it. The card is the `AgentQueued` slot, with `DefaultQueued`
  and the `QueuedMessage` type exported beside the other chat parts.
- Stop hands a parked message back to the composer rather than opening the next turn with it, so Stop means stop.
  `/new` drops it along with the conversation, the way it drops staged files. A `/prompt` parks like text; the
  built-in commands never park, and a pending question still takes the composer as its answer.
- A spoken ask parked behind a turn is still the one answered out loud — and a second voice ask no longer re-reads
  the previous answer while the new one is on its way, which it did whenever the transcript already held one.
