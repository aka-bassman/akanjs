---
"akanjs": minor
---

The page shows what the agent is doing to it

An in-page agent's work used to be legible only in the transcript, and the transcript is behind a panel that is
closed as often as it is open. A form that fills itself, a tab that switches, a route that changes — each arrived
with nothing anywhere attributing it. Now the page itself says so, from the one signal that knows a call is
running rather than from a store action, which cannot tell the agent's write from the user's.

Two effects, both on by default. **The control a call was published from is ringed** where it stands, scrolled to
first when it is off screen — no app code, because the same `onChange={st.do.setTitleOnTask}` reference that earns
`data-akan-action` is what makes the control findable. And **a pointer travels to it and presses it**: the ring
answers *where*, the pointer answers *who*. It glides only when the hop is far enough to be worth following,
presses on arrival rather than on departure, and fades when the batch is over.

A call that reaches no control draws nothing, `navigate` included — the router is not an element.

The form patch fans out: `fill<Model>Form` rings one control per field it named, resolved through the same
`data-akan-state` the setter annotates, capped at five — a patch of twenty is a form being filled, not twenty
events.

`visual` on `Agent.Chat` and `Agent.Zone` turns it off (`false`) or turns one effect off
(`visual={{ cursor: false }}`). Nothing is ever waited on: a call starts the moment its event is handed over.

A tool a name several rows answer to rings nothing rather than guessing a row, a call an approval or a guard
turned back is never drawn, and a batch past four calls stops scrolling and keeps ringing.

`ToolRunner` gained an `activity` host channel and `AgentSession` an `onActivity` option, both carrying
`ToolActivity`. They are separate from `progress`, which only ever fires for a tool that chose to report — and a
tool that says nothing about itself is exactly the one whose effect arrives unexplained.

**`highlight` now waits for its scroll.** `ScreenFlash` — the extracted reveal-and-ring both effects share — fixes
a settle loop seeded with `NaN`, which made every first-frame comparison false and put the ring on at the moment
the smooth scroll *started*. On a long page it had already faded by the time the user's eye arrived.
