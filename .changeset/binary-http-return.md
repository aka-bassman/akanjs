---
"akanjs": patch
---

An HTTP query or mutation returning `Binary` now answers base64, which the client reads back as bytes; it used to answer `{"0":1,…}`. A return declared `Any` that turns out to be an ArrayBuffer or typed array now fails with a message pointing at `Binary` instead of sending `{}`.
