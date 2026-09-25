---
"akanjs": patch
---

An attachment an app built itself cannot kill the turn

`session.send([{ role: "user", text, attachments }])` lets a host assemble attachments directly, and until now
`MessageAttachment` was not exported from `akanjs/ui` — so the one path where the app writes the object was the one
path with no type to write it against, while the composer's own reader was typed. It is exported now.

Two places trusted that object's declared shape. `AgentService.isReadable` dereferenced `mimeType` unguarded, so a
missing one threw out of the relay and took the whole turn — every other attachment of the message with it — under
a `TypeError` that named nothing; it is now unreadable like any other type the provider cannot take, which routes
it through the note that names the file. The attachment chip did the same on the preview branch, where the throw
took the transcript's render down. Both now cost that one attachment and nothing else.

`field.hidden` is documented as the trap behind this: it is stripped from every endpoint response and hydration
writes `null` over the key, while the generated type still declares the field — so a client holds a deliberate
`null` behind a type that promises a value, and only `??` / `== null` catch it.
