---
"akanjs": minor
---

fix(service): `ServiceModel.getFilterServiceMethods` takes the filter's `FilterInfo` and builds what the runtime builds

**Breaking for a direct caller.** The static took a bare query function and guessed the trailing query option by its
shape, so it disagreed with the filter methods every booted model and service actually carries: `{ sample: 2 }` was
dropped instead of passed on, `{ sort: null, limit: null }` became a filter argument, omitted arguments were not
filled, and a filter whose query uses its `q` helper threw because no helper was passed.

It now takes the `FilterInfo` — `ServiceModel.getFilterServiceMethods(key, getFilterInfoByKey(Filter, key))` — and
reads arguments and options exactly as the runtime does, because the runtime now builds each model's and service's
filter methods through this same static. There is one implementation left. The returned table's type is unchanged.
