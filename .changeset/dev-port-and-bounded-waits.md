---
"akanjs": patch
---

fix(devkit): pin the dev port and bound the waits that could hang forever

- `AKAN_DEV_PORT` pins the dev port. It used to derive from an app's index in the `apps/`
  listing, so adding an app moved a running dev server's port at its next restart.
- `BuilderRpc` created request promises with no timeout, and nothing else answers a lost
  request. Since the builder is recycled routinely, a page request that landed mid
  route-build left the SSR promise pending forever with nothing to retry. Now bounded by
  `AKAN_BUILDER_RPC_TIMEOUT_MS` (120s default) with a message naming the likely cause.
