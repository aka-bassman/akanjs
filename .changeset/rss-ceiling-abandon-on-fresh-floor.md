---
"akanjs": patch
---

fix(devkit): stop turning the builder's memory ceiling off on the first page load

The dev host stops enforcing the builder's RSS ceiling when recycling evidently cannot meet it. The
evidence it used was "two over-ceiling reports within 30s of a recycle" — but a builder reports after
every build, and one page load builds a route per navigation. On a container-derived ceiling (a 1.2GB
sandbox gives the builder ~420MB, against ~247MB per route build) the first page load after a recycle
switched the ceiling off for the rest of the session, leaving the builder unbounded on exactly the
deployment shape the ceiling exists for.

It now measures what it always claimed to: when a replacement builder becomes ready, before it has built
anything on demand, the host reads its RSS from the OS. That is the floor every future replacement lands
on, so a floor already over the ceiling means recycling cannot help — and only that stops enforcement,
with the message naming `AKAN_BUILDER_MAX_RSS_MB`. Otherwise the ceiling stands and the existing 30s
minimum interval bounds what it costs, now with a one-off warning when the builder keeps crossing back
inside that interval.
