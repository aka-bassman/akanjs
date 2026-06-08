---
"@akanjs/cli": patch
"@akanjs/devkit": patch
"create-akan-workspace": patch
"akanjs": patch
---

Add initial LLM discovery docs and stabilize Akan client/runtime behavior.

- Add `/llms.txt` documentation discovery for Akan docs.
- Add `wsConnect` support for automatic WebSocket connections.
- Delay client bootstrap module execution until the SSR fizz stream is ready.
- Improve route tree, HMR, fetch, store, and SSR/client runtime stability.
