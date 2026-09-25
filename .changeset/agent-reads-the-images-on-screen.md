---
"akanjs": patch
---

`readScreen` names every image, and can carry its address

An `<img>` with no `alt` contributed nothing at all, so a card rendering a picture read exactly like a card
rendering nothing — and "this page shows no image" is the one answer the screen could not support. Every image now
stands as `[image: <alt>]` or `[image]`, and `readScreen({ images: true })` appends `(<src>)` for handing one to a
tool that takes a picture. It is off by default because a gallery is one long URL per thumbnail, and a `data:` URL
is never printed: that is the bytes themselves rather than somewhere to fetch them.
