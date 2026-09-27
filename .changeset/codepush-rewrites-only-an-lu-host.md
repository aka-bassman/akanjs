---
"akanjs": patch
---

fix(webkit): `useCodepush` rewrites only an `lu` host to reach the release server

The release server was found with `serverUrl.replace("lu", "akasys")`, which rewrote the first `lu` anywhere in the
URL — `https://value.example.com` became `https://vaakasyse.example.com`. The rewrite now applies only when the host's
first label is `lu` or starts with `lu-` (`lu-main.akamir.com` → `akasys-main.akamir.com`), and leaves every other URL
as given. This is a stopgap while codepush is still in development; the release URL will become an option.
