---
"@akanjs/devkit": patch
"@akanjs/cli": patch
---

fix(cloud): an `akan` command started while another is refreshing the cloud session waits for it

A command that read `~/.akan/config.json` while another process was mid-refresh saw the session with its refresh
token already taken and went ahead without signing in. It now waits for that refresh under the same lock and uses the
session it stored.
