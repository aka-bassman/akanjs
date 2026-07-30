---
"akanjs": patch
---

fix(devkit): say when a build worker was killed rather than crashed

The disposable build worker holds the largest transient in the dev tree (~548MB on a mid-size app, over
1GB on a large one), so on a small sandbox it is the process the kernel reaches for first. A worker the
OOM killer takes exits with code `null` and `SIGKILL`, and the build was reported as `build worker exited
with code null before reporting a result` — indistinguishable from an ordinary crash, though the two have
opposite fixes: find the build error, or raise the memory limit.

The failure path is unchanged and still safe (that generation goes red, the last-good artifact keeps
serving); the message now names the signal, and calls out `SIGKILL` as most often the OOM killer.
