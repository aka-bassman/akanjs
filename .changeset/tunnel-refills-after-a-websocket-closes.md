---
"akanjs": patch
---

fix(tunnel): a shared app keeps answering after its websockets close

A finished websocket stream closed its data socket, but the tunnel agent kept counting that socket as idle, so it
never opened a replacement. Every page reload closes its HMR socket, so an `akan start --share` tunnel with the
default four idle sockets stopped answering after about five reloads, until the control link reconnected. A
finished stream now retires its socket and the pool refills it.

A raw TCP stream also ended in a stack overflow (the stream and its socket closed each other in a loop), and it
forwarded a fast origin's output without waiting for the tunnel socket to drain. Neither path is opened by the
current wire protocol; both are fixed ahead of it.
