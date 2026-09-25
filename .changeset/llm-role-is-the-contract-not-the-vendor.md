---
"akanjs": patch
---

The LLM seam names a wire, not a vendor

Three provider classes shipped where there are only two wires, and the framework's own vocabulary had grown a
per-vendor shape that nothing outside the framework could extend: `agent.error.deepseekRequestFailed`,
`openaiRequestFailed` and `anthropicRequestFailed` were three dictionary keys an app-authored adaptor could never
add a fourth to, and `LlmOption` was a closed bag, so an adaptor needing a region or a project id had to open a
second config channel beside `setLlm`. `LlmAdaptorRole` and `applyAdaptor` were already the whole contract; what
was wrong was how much the framework claimed to know about who fills it.

**`DeepseekLlm` is gone and `OpenaiLlm` is the default.** They spoke the same wire through the same
`OpenaiDialect` and differed only in a host, a model name and a vision claim, so one host-pointed class covers
DeepSeek, Groq, Together, OpenRouter, Ollama and a self-hosted vLLM as well as OpenAI. **An app relying on the
old default must now name `model` and `host`** — `option.setLlm({ apiKey, model: "deepseek-v4-flash", host:
"https://api.deepseek.com" })`. There is no default model, for the reason there never was one on `OpenaiLlm`: a
model name ages out of a catalogue into a 404 at the first turn.

**`OpenaiLlm` claims vision for its default host and nothing else.** OpenAI's own endpoint takes image parts, so
that is what it answers with no `host` set; a host the app named is a gateway the class knows nothing about, and
it is text-only until `option.setLlm({ accepts })` says otherwise. Handing bytes to a model that cannot decode
them kills the whole turn on a 400, where text-only degrades them to a note the model can repeat back — so the
safe direction is the default and the claim is declared, not guessed.

**One refusal key, `agent.error.llmRequestFailed`, carrying `{ provider, status, reason }`.** `provider` is the
hostname that refused rather than a brand name, because an adaptor pointed at a gateway would otherwise credit
OpenAI for that gateway's answer. An adaptor an app wrote reports through the same translated sentence the
shipped ones do.

**`setLlm` is generic, so `LlmOption` is a floor rather than the whole shape.** Whatever else it is handed
travels to the role untouched: an adaptor declares its own interface extending `LlmOption`, reads it back with
`use<MyLlmOption>()`, and its provider-specific settings ride the channel the built-in ones do.

Step-by-step migration: `akan guideline show workspaceRecipes` (or `get_guideline workspaceRecipes`),
Recipe 8.
