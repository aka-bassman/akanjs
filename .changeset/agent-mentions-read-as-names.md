---
"akanjs": patch
---

feat: the composer draws a pointer as the name it points at

Picking a row off the `@` menu used to leave `@[이번엔, 진짜입니다](mention:videoCut/6aae…)` sitting in the
composer — the token is what carries the reference onto the message, so it had to be in the text, and the text is
what a textarea draws. It is now drawn by a Lexical editor instead, where each pointer is one atomic node whose
label is what the person reads and whose `getTextContent()` is the token. The draft string the chat reasons about
is unchanged, pointers and all: `Reference.parse`, the `@` query, the chips, the wire and the server's own framing
all see exactly what they saw before, and the editor is one way of drawing it.

A pointer deletes in one backspace rather than a character of a label that would then name nothing, and every
offset the chat hands over — the caret a `session.refer` inserts at, the line a recall arrow belongs to — stays an
offset into that string.

It costs nothing where it is not used: the editor is its own chunk behind the chat's own, and `Agent.Chat` only
draws it where `reference` sources were declared. `mentions={false}` keeps the plain textarea, for an app that
overrides the composer or would rather see the tokens it is sending.

Lexical rather than a contenteditable of our own, because a Korean or Japanese IME composing into a contenteditable
that React also re-renders is the bug class the library exists to own.
