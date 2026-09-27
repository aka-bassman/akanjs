---
"akanjs": patch
---

fix(tunnel): a websocket stream the gateway resets gives its data socket back

When the gateway reset a tunnelled websocket, the agent closed the local websocket but left the data socket that
carried it open. The wire contract never returns a raw stream's socket to the pool, so the gateway could not use it
again, while the agent counted it as idle and opened no replacement: every reset shrank the working pool by one.
The agent now closes that data socket, as it already did when a websocket or TCP stream ends on its own side or the
gateway resets a TCP stream, and opens a fresh one in its place.
