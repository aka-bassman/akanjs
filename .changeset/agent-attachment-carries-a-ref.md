---
"akanjs": patch
"use-agentic": patch
---

An attachment can carry the host's own handle on the file, and the composer's ceilings are the app's

`MessageAttachment.ref` is opaque to the framework, which only moves it — a file id, a storage key, whatever turns
the attachment back into something a tool can be handed. Without one, a host that stores its uploads keeps a map
beside the transcript keyed on name and size, which is the guess `Attachment.same` has to make and the one that is
wrong for two crops of one export; when both sides carry a `ref`, that is now the answer instead.

The per-file ceiling is measured on what `attach` produced rather than on the file that was picked, so a reader
that uploads and answers a `url` is no longer refused for a cost it does not incur. All three ceilings become
defaults behind `<Agent.Chat attachLimits={{ perFileBytes, perMessageBytes, perMessageCount }} />`, since what one
request can carry belongs to the configured provider.

A `url` the reader answers is handed to the provider as the address it will fetch, which is now documented on
`attach`: the default storage backend serves a path only the app can resolve, and a model given one answers about
a picture it never saw with nothing anywhere reporting a failure. Answer `data` when the provider cannot reach it.
