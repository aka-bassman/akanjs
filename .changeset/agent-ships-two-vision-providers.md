---
"akanjs": patch
---

Two providers that read a picture ship, and `accepts` is answered per model

Everything the framework carries for an attachment ended at a text-only provider: `DeepseekLlm` was the only
`LlmAdaptor` that shipped and declares no `accepts`, so an image reached the model as a note saying it could not
be read, and any app wanting vision wrote the provider mapping itself — role alternation, tool-call placement,
streaming reassembly, SSE framing, none of it app-specific work.

`OpenaiLlm` speaks the chat-completions dialect against `https://api.openai.com/v1` and declares `{ image: true }`,
sending an image as a content part from either carrier. `AnthropicLlm` is the Messages API and declares
`{ image: true, document: true }`. That dialect now lives in `OpenaiDialect`, shared by DeepSeek and OpenAI so a
protocol fix lands once; Anthropic shares nothing but the wire it maps from, its system prompt being a field
rather than a message, its tool calls and results content blocks, its results a *user* turn, its roles strictly
alternating, and its `max_tokens` required. Both new adaptors require `model`: a default would age into a 404 and
would decide the vision claim on the app's behalf.

`option.setLlm({ accepts })` overrides what the configured model reads. An adaptor answers for an API and one API
serves models that differ, so the answer rides beside the `model` it is a fact about rather than in a capability
table the framework keeps — a table is a claim about models that ship after it, and a provider handed bytes it
cannot decode either refuses the turn or accepts it having seen nothing.

`option.setLlm({ maxTokens })` is the answer ceiling for an API that requires one. A fixed default is a hazard on
a model that reasons before it writes: the budget goes on thinking, the turn comes back empty with a length stop,
and that reads as the model refusing — so an empty answer is also named in the log with the current number.
Sampling knobs are deliberately absent from `LlmOption`, because `temperature` is a 400 rather than an ignored
field on some models and the role would have to guess its legality per model.

A mangled SSE frame now costs that frame instead of the whole answer, in both stream readers: throwing lost the
text already streamed over one unreadable line of a protocol the caller cannot fix.

Both match an exact image-type set (`jpeg`, `png`, `gif`, `webp`) rather than an `image/*` prefix, and name the
rest in the text. `accepts.image` is one boolean, so `AgentService.readable` passes every `image/*` through and the
composer's built-in reader base64s every `image/*` — an `AttachReader` answering `null` means "not mine" and falls
through to it — so an app cannot gate one either. An unsupported type is not one unread attachment: it is a block
the API refuses, so the whole turn dies on a vendor 400, and `image/heic` is the iPhone camera default.

`DeepseekLlm` is unchanged as the default and still declares no `accepts`. Swap with
`option.applyAdaptor(LlmAdaptorRole, AnthropicLlm)`.
