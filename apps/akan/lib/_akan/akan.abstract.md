# akan Service Abstract
The docs site's root service module; it owns no endpoint, job or state yet — every page renders from source and
static assets.

## Rules
- Anything added here names its own guards: the module mounts nothing today, so there is no slice default to fall back
  on.
- It is enabled only where `SERVER_MODE` is `batch` or `all`, so a federation replica never constructs it.
