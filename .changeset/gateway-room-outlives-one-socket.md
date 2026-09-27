---
"akanjs": patch
---

fix(server): a replica keeps a pubsub room while any of its sockets is still in it

With two or more replicas (or under `akan start`), the gateway forwards a room's publishes to every replica that
holds a socket in it. It tracked that membership per replica but applied each socket's unsubscribe to the whole
replica, so when one of several sockets on a replica left a room, every other socket there stopped receiving
publishes from the other replicas until the 30-second membership snapshot restored it. The gateway now removes a
replica from a room only when the last of its sockets in that room leaves, and a snapshot keeps what it knows about
the sockets of the rooms it confirms. A single-process deployment was never affected.
