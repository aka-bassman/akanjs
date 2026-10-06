---
"akanjs": patch
---

In a signal test every `fetch.clone()` reports its own client address, so an `ip` rate limit counts each agent apart instead of every agent sharing loopback; `clone({ clientIp })` names one explicitly.
