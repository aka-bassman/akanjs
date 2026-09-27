---
"akanjs": patch
---

fix(tunnel): a tunnelled websocket stream's `run()` finishes however the stream ends

`TunnelWebsocketStream.run()` (`akanjs/server/tunnel`) resolved only when the local websocket closed or failed on
its own. When the stream was reset instead — by the gateway, by the gateway dropping the data socket under it, or by
the agent stopping — the promise never settled, unlike the http and tcp streams. It now resolves once on every path,
and a reset that arrives after the stream has already ended releases the data socket no second time. The agent
itself never awaited it, so a tunnel behaves the same.
