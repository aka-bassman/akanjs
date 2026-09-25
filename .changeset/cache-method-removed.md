---
"akanjs": minor
---

refactor(server): remove the `@CacheMethod` decorator

It never hit: it called the model cache as `get(key)` / `set(key, …)` while that cache takes `(topic, key)`, and
nothing in the framework or its libs used it. Cache an endpoint's answer with `{ cache: <ms> }`, or hold state in a
service with `memory(...)`.
