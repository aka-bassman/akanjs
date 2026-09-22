# Docker

- Source: /cheatsheet/dev/docker
- Mirror: /llms/pages/cheatsheet/dev/docker.md
- Section: cheatsheet
- Category: Development
- Priority: P2

## Headings

- Docker (#overview)
- Minimal Compose (#compose)
- Container Env (#env)
- Scale With AKAN_REPLICA (#replica)
- Trim The Web Surface (#web-surface)
- The Generated Dockerfile (#dockerfile)
- Open Console (#console)
- Tips (#tips)

## Content

Docker

You have a built app and a machine at the edge of a factory floor. It needs to come back up after a power cut with its data intact, and you need to see why it fell over in the first place. For a small edge server, start with one Akan app container.

The image binds port 8282 — `akan build` bakes `ENV PORT=8282` into the Dockerfile it generates.

Mount sqlite data so local data survives container restarts.

The image turns file logging off, because a container's writable layer is ephemeral. Turn it back on and mount a volume, or collect stdout instead.

Minimal Compose

This is a simplified example for one app. Replace `myapp` and the image name with your app.

Container Env

Three names are mandatory and the boot throws without them. The build bakes all three into the image from akan.config.ts, so a container only has to set one that differs from what was built.

The app's codename. getEnv() throws without it.

The workspace name. Also required, and also thrown on.

The base serving domain the app derives its own origins from.

Which deployment this is. The image bakes whatever the build was for; a chart overrides it per namespace.

Where it runs. edge is the on-premise box in this page's example; the generated Dockerfile writes cloud.

The port the gateway or solo process binds. Baked into the image, so the published port must match it.

Where sqlite files land. Point it at a mounted volume or the data dies with the container.

The generated Dockerfile bakes 0. Set 1 and mount AKAN_LOG_DIR to get rotating files back — 50MB x 100 per process key at the default trace level.

Required to open console.js in a production-like environment. Set it on the exec command, never in the service definition.

Scale With AKAN_REPLICA

AKAN_REPLICA is three counts separated by commas, and the positions are what carry the meaning. It decides both how many processes run and whether a gateway exists at all.

Request-serving replicas. Each listens and gets a websocket upstream; none of them runs a scheduled task.

Worker replicas. A batch replica never listens and gets no websocket upstream, so asking for one always keeps the gateway.

All-purpose replicas: they serve requests and run batch work. A route or task declared for either role runs here.

Forces the gateway back with a single replica. Only those two strings are read — true is a no-op, and it can never fold a real multi-replica gateway into one process.

Fewer than three slots is legal and the missing ones are zero, so 2 alone means two federation replicas. All zeroes is normalized to one all-purpose replica — you can never ask for none.

One process, or a gateway and its children

A solo process has nothing to balance, so it skips the gateway and its proxy hop, and answers /_akan/app/health, /_akan/app/metrics and /_akan/bench/ping itself in the gateway's own shape. That also means nothing supervises it but the orchestrator's probes.

Trim The Web Surface

A deployment that only answers API calls does not need the web half at all. `AKAN_SSR=false` takes down the RSC worker and the render routes; `AKAN_CSR=false` takes down only the mobile SPA bundle. Both narrow what the build produced and can never widen it, and the boot log names what the process ended up serving.

The two are not independent: the CSR bundle inlines the stylesheet the SSR build compiles, so AKAN_SSR=false takes CSR down with it whatever AKAN_CSR says. There is no CSR-without-SSR deployment.

Declare it in akan.config.ts as `web: false` to also keep the artifacts out of the image: no route artifact, no CSR bundle, no RSC worker entrypoint, and no public/ folder. Measured on this docs app, that is 86MB down to 6.2MB.

The Generated Dockerfile

You do not write a Dockerfile. akan build writes one into dist/apps/<app>/ from the docker key in akan.config.ts, and the generated image installs ca-certificates and tzdata and nothing else — so an app that needs ffmpeg or Chromium has to say so.

The base image. The object form emits one FROM per architecture, and an arch left out falls back to the default.

Steps before bun install, so a system package a native dependency needs is already there for the install.

Steps after bun install and before the app files are copied — the place for something that needs the installed modules but not the source.

The CMD. Each element is JSON-quoted into the exec form.

A lib declares the steps its own runtime needs and every mounting app inherits them, prepended and deduplicated. A lib never picks the base image or the command.

Writing `docker` as a whole Dockerfile string takes it verbatim — and silently drops every step a lib contributed. Reach for the object form unless you genuinely need the whole file.

`assets.pruneFonts` is on by default and trims from the dist copy of public/ the fonts nothing reads; `keepFonts` globs are relative to the declaring app's or lib's own public/. Source trees are never touched.

Open Console

`akan build` embeds `console.js` next to `main.js`, so you can open an operator console without creating files inside the container.

Set `AKAN_CONSOLE=1` only on the exec command for production-like environments.

Tips

Keep the first compose file boring. Add extra services only when the app really needs them.

Back up the sqlite volume before replacing edge hardware.

When the container restarts repeatedly, read stdout rather than the mounted folder — file logging is off in the image unless you turned it back on.

## Code Examples

### docker-compose.yaml

```ts
services:
  myapp:
    image: registry.mydomain.com/myorg/myapp:latest
    container_name: myapp
    restart: unless-stopped
    ports:
      - "8282:8282"
    environment:
      AKAN_PUBLIC_APP_NAME: myapp
      AKAN_PUBLIC_REPO_NAME: myorg
      AKAN_PUBLIC_SERVE_DOMAIN: example.com
      AKAN_PUBLIC_ENV: main
      AKAN_PUBLIC_OPERATION_MODE: edge
      AKAN_REPLICA: "0,0,1"
      AKAN_SQLITE_DIR: /workspace/sqlite
      AKAN_LOG_TO_FILE: "1"
      AKAN_LOG_DIR: /workspace/logs
    volumes:
      - ./sqlite:/workspace/sqlite
      - ./logs:/workspace/logs
```

### Terminal

```bash
docker run -e AKAN_SSR=false -e AKAN_REPLICA="1,0,0" -p 8282:8282 myapp
```

### apps/myapp/akan.config.ts

```ts
export default {
  docker: {
    preRuns: ["RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg"],
    postRuns: [{ arm64: "RUN echo aarch64 image" }],
  },
  assets: {
    pruneFonts: true,
    keepFonts: ["fonts/Assistant-*.woff2"],
  },
};
```

### Terminal

```bash
docker exec -it myapp sh -lc 'AKAN_CONSOLE=1 bun console.js'
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Use this page as a task recipe, then verify with the relevant lint, test, or build command.

