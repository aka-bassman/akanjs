---
"akanjs": patch
"use-agentic": patch
---

An `@` mention whose title holds a bracket, such as "[Ops] Minutes", is now a chip and is sent with the message. `Reference.token` used to write the label as it was, and the reader stopped at its first `]`, so the token stayed raw text and the value it pointed at was dropped. A label's `\`, `[` and `]` are now backslash-escaped in the token, as in a markdown link, and `Reference.parse` and the composer read them back. A token written before this change still reads, unless its label ends in a backslash. `Reference.pointerOf(match)` turns one match of `Reference.pattern` into its pointer.
