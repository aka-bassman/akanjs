---
"akanjs": patch
---

fix(devkit): answer in-flight builder requests on recycle and flush replies before exit

Builder RSS recycle (and unexpected exits) left mid-flight `build-route` /
`build-csr` promises hanging: the host never tracked correlation ids, and even a
clean drain could lose a large `build-route-res` when `process.exit` truncated an
unflushed ipc write past the pipe buffer.

- Track in-flight ids on the host and fail them with a reloadable error when the
  builder recycles, crashes, or is stopped.
- Send replies through `BuilderReply`, which awaits the ipc flush (with a timeout)
  so recycle drain means "answered", not "truncated".
