---
"akanjs": minor
"use-agentic": minor
---

The composer can point at data, from the menu or from the screen

Builds the user-facing half of message references on top of the carrier. There are two entry points, and which one
applies depends on who knows the value.

`<Agent.Chat reference={[…]} />` takes a `ReferenceSource` per kind of document — `refName`, a `type` in
`st.expose`'s vocabulary, the app's own `search`, and a `resolve` — and the composer's `@` menu offers whole
documents from them. Which documents somebody may point at is the app's answer, so the source brings the query; the
framework brings the token, the masking and the snapshot. The token is written the moment a row is picked and the
value is staged when `resolve` lands, so a slow fetch never freezes the menu and one that fails leaves a pointer
rather than a chip that means nothing.

`useAgentReference()` is the other half, for a field *inside* a document. The component drawing it already holds
the value, so it hands that over with no round trip — and it is the only thing that knows a rich-text field stored
as `field(Any)` reads as a paragraph rather than as the editor document it is stored as. It no-ops with a warning
outside a session, the call `AgentValue.publishable` already makes: a card carrying a reference button must not
cost a route its render.

**The token in the draft is what carries a reference; the chip only draws it.** Deleting the token by hand drops
the reference exactly as removing the chip does, because removing the chip removes the token. Nothing re-derives a
value from edited text, so a token pasted out of an earlier message travels as a pointer with a note — the same
shape a restored conversation produces.

Staging lives on the session rather than the composer, because `useAgentReference` is called from components the
composer cannot see. Writing the token is still the composer's, so the session holds the unwritten ones as state
and a chat acknowledges each by key: two chats on one session — a responsive app rendering a desktop and a mobile
composer — each hold their own draft and each need the token, which a queue somebody drains would have given to
whichever rendered first. `refer` warns instead of staging silently when no chat is mounted on that session, which
is the case where a card sits outside the `<Agent.Zone>` its chat is inside.

References also ride the parking queue, so one pointed at while a turn is running survives to the message it
opens; taking a parked message back restores its values, and anything pointed at since wins, because the parked
value is the older read of the same field.
