---
"akanjs": patch
---

`LlmTurnRequest` takes `model`, so a service that plugs `LlmAdaptorRole` can run one turn on another model, such as the one a conversation picked, without a second adaptor. `OpenaiLlm` and `AnthropicLlm` send it in place of `option.setLlm({ model })`, streamed or not, and `LlmTurnAnswer.model` names it; an empty or missing one falls back to the option's. `accepts`, `maxTokens` and `contextWindow` still come from the option, so a model that differs in them needs an adaptor of its own, built on the exported `OpenaiDialect` / `AnthropicLlm` helpers. The in-page agent's `runAgentTurn` takes no model, so a browser still cannot choose one.
