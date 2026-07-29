---
"akanjs": patch
---

fix(devkit): keep builder replies matched to the backend that asked for them

`BuilderRpc` numbers its requests from 1 in each backend *process*, while the builder it
talks to outlives the backend. After a restart the two generations collided on id 1: the
builder answered the departed backend's request, the dev host relayed it, and the new
backend settled its own id 1 with another route's manifest delta — a page rendered against
client modules that were never built for it. The answer it was actually waiting for then
arrived to an empty pending map and was dropped, discarding the correct build too.

`BuilderRequestRouter` renumbers ids host-side, so neither the backend nor the builder
learns anything changed and a reply whose generation is gone is discarded rather than
misdelivered.
