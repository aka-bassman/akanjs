---
"akanjs": minor
"use-agentic": minor
---

A message carries the data the user pointed at

An in-page agent could be handed files but not data. What was on the screen reached the model only as the turn's
`ContextBlock`s, which are reassembled from the screen every turn — so a record named three turns ago is not in the
conversation any more, and there was nowhere to say *which* record, or which field of it, somebody meant.

`ChatMessage.references` is that place, beside `attachments` and for the same reason: what a person referred to
while asking is part of the asking. A `MessageReference` names the host's own `refName`, the id, a label, and
optionally a dotted `path` into the document, and carries the `value` those resolved to.

Three properties are load-bearing and deliberate:

- **The value is a snapshot.** It is what the data was when the message was sent, never re-read later. Re-reading
  would rewrite what the person was looking at when they spoke — and the common case is an agent that then edits
  the very field it was pointed at, which would leave the reference showing the result with no record of what was
  being changed from. `refName`/`refId`/`path` travel so a tool can read the current value when the answer needs it.
- **The value arrives masked, and nothing downstream can mask it again.** Masking needs the model class, which no
  wire carries, so whichever model the host names when it stages a reference is the whole of the decision about
  what leaves the browser.
- **It is bounded at 20,000 characters per reference, at both ends.** A reference is bulkier than a tool result and
  outlives one: it rides every turn from the moment it is sent and is the last thing compaction folds, because
  folding what the user pointed at is folding the question. `Reference.clipped` bounds it as it is staged, and
  `AgentService.referenceLimit` bounds it again where nothing can route around it.

`AgentSession` holds the staging slot — `stage` / `staged` / `unstage(key)` / `clearStaged()` — rather than the
composer, which is where staged files live. The difference is not an inconsistency: a file only ever arrives from
the composer's own picker or drop zone, while a reference arrives from whichever component drew the data, reaching
the session it is already inside. Unstaging is keyed on `refName/refId#path`, never on an index, because what
orders the references of a message is its text.

The server folds them into the message text in one place (`AgentService.referenced`), under a heading that says the
values are a snapshot. Text is the one field every provider mapping already reads, so Anthropic, the OpenAI dialect
and the text-only default all carry references with no change between them and none of them can drop one quietly.
A string value prints as itself rather than as escaped JSON, which is the common case and the readable one.

Persistence keeps the pointer and drops the value, with a note saying so — a restored conversation re-reads what
was pointed at with a tool instead of guessing from the label, which is a better answer than a restored attachment
can give.
