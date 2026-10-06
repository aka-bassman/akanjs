---
"akanjs": patch
---

`setCookie` defaults to `path=/; SameSite=Lax; Secure` instead of `SameSite=None`, matching the auth cookie the server sets, and an options object overrides only the keys it names.
