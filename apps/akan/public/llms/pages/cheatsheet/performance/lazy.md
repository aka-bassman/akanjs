# Lazy Loading

- Source: /cheatsheet/performance/lazy
- Mirror: /llms/pages/cheatsheet/performance/lazy.md
- Section: cheatsheet
- Category: Performance
- Priority: P2

## Headings

- Lazy Loading (#overview)
- External Libraries (#external)
- Large Components (#internal)
- Server Adapters (#server)
- Server Render Or Client Only (#ssr)
- Tips (#tips)

## Content

Lazy Loading

chunk

A JavaScript file the bundler splits off, downloaded only when something asks for it.

Suspense boundary

A React boundary that shows a placeholder while something inside it is still loading.

The first HTML the server sends; content inside a boundary may stream in after it.

Split it off

Maps · charts · editors · 3D viewers · wallet widgets

Heavy code, and often browser-only.

Large admin panels opened now and then

Most visits never open it, so most visits never pay for it.

Import it directly

Tiny buttons

Too small to be worth a separate download.

Above-the-fold content

Users need it right away, so deferring it only makes them wait.

`false` skips server rendering: the server sends `loading`, and the chunk loads after mount.

Gives the component its own Suspense boundary, so only this spot waits for the chunk.

The placeholder, shown only with `ssr: false` or `suspense: true`.

Defer: heavy, and an app may never configure it

Sends Discord messages, about 23 MiB.

A headless browser for PDF output, about 19 MiB.

Sends mail, about 16 MiB.

Push notifications, about 2 MiB.

An image encoder

Heavy, and only the apps that process images need it.

Keep eager: every request uses it

Deferring only moves the load to the first request.

Logs each server process's resident memory (RSS) on an interval.

How often the report is written, in milliseconds.

Server render

Shows loading

Rendered on the server

The default, for a component that can render on the server.

Use it for what mounts after a click: a modal body, an editor, a dropdown.

Rendered in the browser only

Use it when the library needs `window`, `document`, canvas, WebGL or browser storage.

lazy() reference

The `lazy` entry in the `akanjs/webkit` reference.

A Suspense boundary you place yourself around several lazy parts.

Splitting one screen

Where the `index_.tsx` pair fits among the other SSR techniques.

Memory logs

Reading `AKAN_MEMORY_LOG` output over time.

Words used on this page

Term

What to split

Component

Load it this way

Not this way

lazy() options

External Libraries

First, the client file that loads the library:

Then the server-safe component that pages import:

Large Components

Your own components split the same way. It pays off most for a heavy editor or dashboard that opens only after a click.

Server Adapters

The same idea applies on the server, where the cost is memory instead of bundle size. A heavy SDK imported at module scope stays resident in every replica and every batch worker, even when the app never configures it.

Why one import costs so much

What to defer

Measured in this workspace with each SDK imported eagerly, the first four below cost about 61 MiB before a single request arrives.

Package

Import it this way

How to defer it

Measure it

Check what a process actually pays before and after the change with these env vars.

Server Render Or Client Only

The three settings differ in whether the server renders the component and whether the placeholder shows. Pick by what the component needs.

Setting

Yes

No

Tips

Read next

## Code Examples

### apps/koyo/ui/ArticleMap/index_.tsx

```ts
"use client";
import { lazy } from "akanjs/webkit";

export const MapWidget = lazy(() => import("heavy-map-widget"), {
  ssr: false,
  loading: () => (
    <div className="h-64 w-full animate-pulse rounded-box bg-muted" />
  ),
});
```

### apps/koyo/ui/ArticleMap/index.tsx

```ts
import { MapWidget } from "./index_";

interface ArticleMapProps {
  center: { lat: number; lng: number };
}
export const ArticleMap = ({ center }: ArticleMapProps) => {
  return <MapWidget center={center} />;
};
```

### apps/koyo/ui/ArticleEditor/index_.tsx

```ts
"use client";
import { lazy } from "akanjs/webkit";

export const ArticleEditor = lazy(() => import("./Editor"), {
  suspense: true,
  loading: () => (
    <div className="h-64 w-full animate-pulse rounded-box bg-muted" />
  ),
});
```

### apps/koyo/ui/ArticleEditor/index.tsx

```ts
import { ArticleEditor } from "./index_";

interface EditPanelProps {
  open: boolean;
}
export const EditPanel = ({ open }: EditPanelProps) => {
  return open ? <ArticleEditor /> : null;
};
```

### apps/koyo/srvkit/discordApi.ts

```ts
import { adapt } from "akanjs/service";
import type * as discord from "discord.js";

let discordLoad: Promise<typeof import("discord.js")> | null = null;
const loadDiscord = () => {
  discordLoad ??= import("discord.js");
  return discordLoad;
};

export class DiscordApi extends adapt("discordApi" as const, ({ env }) => ({
  token: env(() => process.env.DISCORD_TOKEN ?? ""),
})) {
  #clientLoad: Promise<discord.Client> | null = null;

  async #connect() {
    const { Client, GatewayIntentBits } = await loadDiscord();
    const client = new Client({ intents: [GatewayIntentBits.Guilds] });
    await client.login(this.token);
    return client;
  }

  #getClient() {
    this.#clientLoad ??= this.#connect();
    return this.#clientLoad;
  }

  async send(channelId: string, content: string) {
    const client = await this.#getClient();
    const channel = await client.channels.fetch(channelId);
    if (!channel?.isSendable()) return null;
    return await channel.send(content);
  }
}
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Use this page as a task recipe, then verify with the relevant lint, test, or build command.

