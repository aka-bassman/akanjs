---
"akanjs": minor
"@akanjs/cli": minor
"@akanjs/devkit": minor
"create-akan-workspace": minor
---

Harden dev host recovery during failed builds:

- Defer builder/backend recycle while a generation's build is still failing
- Merge deferred invalidate batches so restarts cover every skipped change
- Recover the builder with exponential backoff instead of giving up
- Revive a backend that gave up once the build goes green again
- Resurrect dev children after a failed recycle so the error overlay stays reachable
- Enter degraded builder boot mode on compile errors and retry on the next edit
- Announce recovered pages/css state after a degraded boot succeeds
