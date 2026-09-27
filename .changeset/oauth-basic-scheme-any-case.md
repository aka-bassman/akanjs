---
"akanjs": patch
---

fix(oauth): read a Basic client credential whatever the scheme's case

`/oauth/token` and `/oauth/revoke` recognized HTTP Basic client authentication only when the scheme was spelled
`Basic`. RFC 7235 makes an auth scheme case-insensitive, so a client sending `basic` or `BASIC` was read as sending
no credential at all, and a confidential client was then refused. The scheme's case is the only thing that
loosened: the single space after it, the decoding of the two halves and the one-channel rule are unchanged, so a
lowercase `basic` header beside a `client_secret` in the body is now refused like a `Basic` one.
