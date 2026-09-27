---
"@akanjs/devkit": patch
"@akanjs/cli": patch
---

fix(cloud): a cloud session in its last hour is refreshed, once across every running `akan` process

A stored cloud session within an hour of expiry, or past it, was treated as signed out: nothing ever called the
refresh endpoint, so `akan login` reopened the browser about once a week and `akan tunnel` answered a raw 401 in
that window. Every command that reaches the cloud — `login`, `upload-env`, `download-env`, `tunnel` and
`start --share` — now refreshes such a session before using it, and `akan login` only opens the browser when the
refresh fails.

The refresh is written for a cloud that rotates the refresh token on every use and treats a second use as theft,
revoking every session of the account, browser included:

- It runs under a lock beside `~/.akan/config.json`, held across CLI processes, and re-reads the file once it has
  the lock, so of two commands started together only one refreshes and the other uses its result. A lock whose
  holder has exited is taken over; one whose holder is still running is waited for, and a refresh is never made
  without it.
- The refresh token leaves the file before it is sent, and the new pair is written before it is used. A command
  killed mid-refresh, or a refresh that fails, therefore leaves no token that could be presented a second time;
  the cost is one browser sign-in.
- Every other write to the file (hosts, remote env servers, test targets) re-reads under the same lock, so none can
  put back a token that was rotated away, and the file is replaced atomically with mode 0600, so a concurrent
  reader never sees half of it.
