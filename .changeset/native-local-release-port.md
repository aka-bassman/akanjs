---
"@akanjs/devkit": patch
---

A `--env local` release build (`build-*`, `release-*`, `start-* --release true`, `publish-update`) calls the app's own dev server: its `env.runtime.json` names `PUBLIC_AKAN_SERVER_URL=http://localhost:<dev port>`, the port `akan start` gives the app (`AKAN_DEV_PORT`, else its place among the apps). Before, it always called 8282, which in a workspace with several apps is another app or nothing. A target that carries its server keeps the URL its server hands the page at launch, and an `AKAN_PUBLIC_SERVER_URL` the bundle was built with still wins.
