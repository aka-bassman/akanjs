---
"akanjs": patch
---

A CSR page or layout whose render fails no longer leaves a blank screen. The layer shows the error's message — "Cannot reach the server. Check your connection and try again." for `base.error.serverUnreachable`, a generic "This page could not be loaded." otherwise — and a Try again button that runs the render again. A render that redirected before it failed still shows nothing, since its page is leaving.
