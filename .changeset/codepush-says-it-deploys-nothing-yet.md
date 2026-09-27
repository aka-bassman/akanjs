---
"@akanjs/cli": patch
---

fix(cli): `akan codepush` says it deploys nothing yet, and fails, instead of asking for an OS it never used

The command was described as "Deploy over-the-air (OTA) update for mobile app", asked which OS to deploy to, and
then only added whichever native project was missing — no update was built or sent, and it exited 0. The deploy
was never written; the OS answer was a placeholder for it.

Until the OTA deploy exists, `akan codepush <app>` asks nothing, touches nothing, and exits non-zero with a
message saying the command is still in development and that `akan release-source <app>` is the command that
releases an app's source with OTA update support. The command keeps its name, since the deploy is planned behind
it.
