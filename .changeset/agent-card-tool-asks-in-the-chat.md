---
"akanjs": patch
"use-agentic": patch
---

feat: a tool the user answers, rendered in the chat by the app that declared it

`st.tool("collectContact").desc("…").card(({ submit, cancel }) => <Contact.Form …/>)` is a second way a tool chain
ends. Where `.exec()` runs a function, a card parks the call in the chat and renders the app's own component there;
what the form submits is the call's result, and cancelling is the error the model reads instead. A name and a phone
number, a date somebody has to look up, a signature — those are answers a model must not invent, and until now the
only surfaces a chat could park on were the approval gate and `askUser`'s question, neither of which carries a
shape.

`AgentSession` holds it as `pendingCard` beside `pendingApproval` and `pendingQuestion`, and `Agent.Chat` renders it
in the same place; `AgentToolCard` is an `_overrides.tsx` slot like the other two. The frame draws its own way out
even when the app's component does not, so a turn can never park on something the user cannot dismiss.

The call waits **outside** the tool queue, for the reason an approval does: a form parked in front of somebody is
not work, and holding the execution lock across it would freeze every other agent on the page behind one unanswered
card. The declared arguments are checked before the card is parked rather than while it renders — a throw inside the
host's tree would take the chat down, where a verdict reaches the model as something it can correct — and `confirm`
is not read for a card at all, because the card is already the asking. The screen is still snapshotted around the
wait, so a card that writes what it collected into a store reports what moved like any other call.
