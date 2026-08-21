---
"akanjs": patch
---

fix: refuse `runAgentTurn` when no `AgentRelayAccess` policy is registered

The relay used to allow every caller and warn at boot until an app decided. With no policy it now answers like
`None` — `Access denied by guard: AgentRelayAccess` — and boot is silent. Register a policy with
`option.setAgentAccess(...)` (or `AgentRelayAccess.use`) before the chat can spend the LLM key.
