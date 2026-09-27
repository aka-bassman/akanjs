---
"akanjs": patch
---

fix(server): the gateway's `sockets` metric stops counting sockets whose room a snapshot dropped

The `sockets` count on `/_akan/app/metrics` is the number of sockets the gateway knows to be in at least one pubsub
room. When a socket's unsubscribe never reached the gateway, the 30-second membership snapshot took the room away
from the replica but left the socket counted, and every such socket stayed in the metric until that replica
restarted. A room the snapshot no longer confirms now takes the sockets recorded in it along; a socket still in
another room stays counted. Delivery never read this count, and the metric's name and shape are unchanged.
