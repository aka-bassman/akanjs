---
"akanjs": patch
"use-agentic": patch
---

feat: the agent's pointer lives for the turn, and waits out the model's own thinking

The pointer's life was measured in the gap between **calls** — 1.4 seconds of quiet and it faded. But a model's
calls arrive with its own writing between them, which takes several seconds, so a turn of four calls was four
pointers: each one appeared, pressed, and vanished before the next arrived. The unit was wrong.

`AgentSession` now reports the boundary that matters. `onTurn(running)` fires once when a turn starts and once
when it settles, and only the conversation loop reports there: `compact` runs under the same internal flag and
drives nothing on screen, so a host drawing the agent at work would otherwise draw it for a summary nobody asked
to watch. Between the calls of one turn the pointer stays where it last landed and turns into a spinner, because a
pointer sitting perfectly still for four seconds reads as stuck rather than as waiting.

It still appears only at the first control it presses, and **a turn that drove no control draws no pointer at
all** — parking one in a corner for a turn that only answered a question would be the screen claiming something
that did not happen.

While a reveal scrolls the page to the next control, the pointer holds still the way a person's does and carries a
chevron pointing the way the view is travelling — stillness over a sliding page otherwise reads as a pointer that
has come loose rather than as the one doing the scrolling. The scroll budget is now spent per turn as well, instead
of per quiet second, which is what it was always guessing at.

**`navigate` draws again, but only on an element.** The link a navigation is going to, when exactly one visible
link goes there, is pressed before the route moves — which needs the call to wait, so `ToolRunner` now awaits the
`start` activity and `AgentSession.onActivity` may answer a promise. `AgentVisual` returns one for that call alone
and caps it at 600ms; everything else still draws while the call is already running. An off-screen link is left
alone, because scrolling to a link and then leaving the page it is on is two motions for one act. **Link presence
decides what is drawn, never what is allowed**: the agent may still navigate anywhere the user could type, and a
zone that must stay on one screen drops `navigate` through `builtins` as before.

`Router.routeOf(pathname)` is what compares the two addresses — the locale and base-path segments live on the
`<a href>` and never on the tool argument. It is `getPath` without the browser guard, which `getPath` only needs
for its own default argument.

**The pointer clears the control before it waits.** A spinner parked on the button it just pressed reads as one
stuck to it, and it covers the very change the press caused — a person clicks and takes the hand away. It drifts
just past the control's box, down and to the right unless the viewport edge is there, and spins from that spot.

**A control the screen is not actually showing is not pointed at, and the pointer goes rather than travelling to
it.** `checkVisibility` answers about an element alone, so one under a modal's backdrop, inside a drawer that has
slid off, or faded to nothing all pass it while being invisible to the user — and a pointer sent there lands on a
blank patch of overlay, which reads as the effect being broken rather than as the agent acting. The test is
`elementFromPoint` at the control's own centre, taken after the reveal has settled, with an ancestor counting as a
hit so a `<label>` wrapping its input is not mistaken for an occlusion.

**`agentAttrs(handler, key)` tells namesakes apart.** One tool serves a whole tab strip or a whole list, so every
control carrying it was interchangeable in the DOM and the no-guessing rule turned that into drawing nothing.
A key — in the same vocabulary the call's argument uses — lets the pointer pick the one the call named; short of
exactly one answer nothing is still drawn. `Tab.Menu` now passes its own `menu` key, so switching a tab is drawn
on the menu that was switched to.

`reveal` and `cursor` are now independent, as their names always claimed: `visual={{ reveal: false }}` keeps the
pointer and drops the ring, where before it dropped both.
