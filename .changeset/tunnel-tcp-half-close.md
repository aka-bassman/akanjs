---
"akanjs": patch
---

fix(tunnel): a tunnelled TCP stream half-closes instead of hanging up

The wire contract ends each direction of a stream on its own, but the agent's raw TCP stream treated the
gateway's `end` as the end of everything. It closed the connection to the local port outright, so whatever the
origin answered after the caller's end of input was lost, and bytes the caller sent after the origin finished its
own side were dropped too. The agent now shuts down only the direction that ended: the origin sees end of input and
can still answer, and the caller can keep sending after the origin's end. The data socket goes back once both
directions are done or the stream is reset. The local connection is dialled through `node:net`, because
`Bun.connect` stops reading once its write side is shut down (Bun 1.4). Wire version 1 opens no TCP stream yet, so
no running tunnel behaves differently today.
