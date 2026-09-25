---
"akanjs": patch
---

A solo replica logs its boot at `info`, so a production container that runs the one traffic replica prints a line
instead of leaving stdout empty until something goes wrong.

`b42b7246` demoted that line to `debug` while trimming dev boot output. In a gateway deployment it costs nothing —
`AkanApp gateway is running on port …` is `info`, and `akan start` never takes the solo path — but
`AKAN_REPLICA=0,0,1`, which is what the chart deploys, has no gateway, and every other line a solo boot passes
through is `verbose`. With the image's `AKAN_LOG_TO_FILE=0` and canonical request lines off by default, a healthy
pod logged nothing at all: `kubectl logs` on a running container came back empty, and a crash looked the same as a
quiet boot.
