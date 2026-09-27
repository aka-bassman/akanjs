---
"akanjs": patch
---

fix(server): a backend finishes its shutdown and delivers its last log lines before it exits

- **The last log batch reaches the parent before a backend exits.** A message sent over IPC right before
  `process.exit` is lost from 8 KB on, so in `AKAN_LOG_FORMAT=ndjson` the shutdown lines and any final error stack
  never reached stdout. A backend now waits, up to one second, until that batch is delivered.
- **A second `stop()` waits for the shutdown already under way.** It used to return at once, so its caller exited
  while the first shutdown was still closing services and the log transport — a second SIGINT, or every Ctrl-C
  under a gateway, where the terminal's signal and the gateway's `shutdown` message arrive together.
- The ops snapshot route's 400 now states the id pattern it actually enforces (the first character must be a
  letter or digit).
- An `AKAN_SUB_ROUTE_HOSTS` basePath that is ignored is warned about once per process instead of twice.
- The builder-ready log line no longer prints `buildId=undefined`.
