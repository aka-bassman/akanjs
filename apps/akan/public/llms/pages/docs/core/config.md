# App Config

- Source: /docs/core/config
- Mirror: /llms/pages/docs/core/config.md
- Section: docs
- Category: Core Concepts
- Priority: P0

## Headings

- App Config (#app-config)
- Config Shape (#config-shape)
- Application Env (#app-env)
- Server Option (#server-option)
- Routes and Domains (#routes)
- Web Surfaces And Prefixes (#web-surfaces)
- Mobile Metadata (#mobile)
- Images And Public Env (#images-env)
- Secret Files (#secret-files)
- Build And Runtime (#build-runtime)
- Defaults And Rules (#defaults)

## Content

App Config

akan.config.ts is the app-level settings file. You do not need to understand every option on day one. Start with an empty file, then add only the fields your app actually needs.

This is the whole key set. Every one of them has a default that a working app can live with, and the slides below cover the ones you are most likely to change:

Start small

Most defaults are already prepared, so an empty config is valid.

Add only what changes

Define only the parts your app actually needs to customize.

One source of truth

CLI commands, production builds, and mobile commands all read this file.

Config Shape

The default export can be a plain object or a function. Use an object for most apps. Use a function only when the config needs app metadata while it is being loaded.

Object config

Function config

Akan treats config as partial settings. Missing fields are filled with framework defaults.

Application Env

akan.config.ts describes how the app is built and routed. The env/ folder describes the actual values the app uses at runtime, such as public client keys, server-only options, and environment-specific service settings.

File

Values used by browser or client-side code. Keep only public-safe values here, such as map keys, site keys, or feature switches.

Values used only by server-side modules. Put server options, connection settings, and private service configuration here.

Each suffix is selected by AKAN_PUBLIC_ENV. Use local for your machine, testing for tests, debug and develop for shared stages, and main for production.

Type files define the shape of env values, so missing or misspelled settings can be caught while coding.

Client env and publicEnv are different. env.client.* stores app values for each environment, while publicEnv only allows selected process.env names to be exposed to browser builds.

Server env can also include options from shared libraries through env.server.type.ts. This lets an app keep one final server env object while reusing library-level defaults.

Server Option

lib/option.ts is where the app configures its server. env/ holds the values, akan.config.ts holds the build, and this file wires them into the runtime: use objects, signal middleware, adaptor overrides, web proxies, the MCP server, the agent relay's access policy, and the LLM that relay speaks to. Every library the app depends on brings its own option.ts, read in mount order with the app's last — so an app tightens what a library declared without restating it.

Stage

apiKey, model, and host for whichever adaptor holds LlmAdaptorRole. Take the key from the env object rather than writing it here — env.server.* is gitignored, this file is not.

Who may spend the LLM key through the runAgentTurn relay, named as the guards any other endpoint would name. Several are ANDed. With none the call is refused — the same answer None gives — because the framework has no account model to gate on.

MCP server settings — instructions, readOnly, path, pageSize, language, auth, and promptBudget, the characters of page data one prompts/get answer may carry (default 60,000; env AKAN_MCP_PROMPT_BUDGET). Not main.ts: the gateway there only spawns children, while this file is handed to the process that mounts /mcp.

The registration half: env-derived singletons a service reaches with use<T>(), signal middleware, a predefined adaptor role rebound to the app's own implementation, and web proxies.

Each of these has an env spelling too (AKAN_MCP_*, AKAN_AGENT), for a deployment that must configure what the source does not. A value written in option.ts wins over the env of the same name.

Routes and Domains

routes is where you list the public domains for the app. If your app has several clients, each route can also name the client with basePath. The multi-client page explains that structure in detail; here we focus on the config fields.

The client this route opens, and the first page folder its routes live under. Akan strips the slashes, so /store/ and store are the same value. A route without one is the app itself.

Hosts that open this route, keyed by deployment branch. debug, develop, and main always exist, and naming any other key adds that branch. Each host is lower-cased and a port is dropped. Akan also derives one host per basePath per branch, so a route with an empty map still has an address.

If you declare basePath, the page folder must follow the same name. See Multi Client for the full page layout rule.

Web Surfaces And Prefixes

web decides which web surfaces the build produces, and api decides where the server mounts its endpoints. Both are declared here rather than only in main.ts, because both are baked into the client bundles: a prebuilt CSR shell or a mobile package never reaches a server that could tell it otherwise.

true builds both surfaces. false is an API-only app: no web artifact is built and no web route is mounted. { csr: false } keeps SSR and drops the single-file shell that the mobile build ships and /__csr serves. There is no CSR-without-SSR option, by type — the CSR bundle inlines the stylesheet the SSR build compiles.

Where signal endpoints are mounted. A blank value and a bare / are both refused — / would swallow every page route. Read it back with getApiPrefix() from akanjs/base; never write the literal.

Where the websocket upgrade sits. Read it back with getWsPrefix(). new AkanApp({ prefix, websocketPrefix }) still overrides both for the server and every page it renders.

AKAN_SSR and AKAN_CSR narrow the same choice at boot, and can only narrow it: a deployment cannot switch on a surface the build left out. akan build writes whichever of the two the config already turned off into the generated Dockerfile, and akan start ignores web entirely so the dev surface stays whole.

web: { csr: false } together with a mobile section fails the config load. The Capacitor build copies that CSR shell into the native project, so the two declarations cancel each other out — drop the mobile section or leave CSR on.

Mobile Metadata

mobile describes the native app identity used by Android and iOS commands. Think of it as the name, package id, and version information that will appear in native app projects. Values at the mobile root are defaults; a target overrides the ones it names.

files maps native target paths to app-relative source files. It is useful for Firebase push config files such as google-services.json and GoogleService-Info.plist. Keep server service account JSON out of client/native file mappings. For platform setup steps, see

Mobile Development

.

When a multi-client app needs separate mobile apps per client, define mobile targets with basePath. The Multi Client page shows that pattern.

Images And Public Env

images controls the allow-list for optimized remote images. publicEnv is an allow-list for extra browser-visible environment variables beyond the built-in AKAN_PUBLIC_* pattern.

publicEnv does not store values. It only says which environment variable names are safe to expose to browser builds.

Secret Files

Some private values cannot live inside env.server.*.ts, such as service-account JSON, TLS certificates, or private key files. The secrets field lists glob patterns for these files so Akan ships them together with the env/ folder.

akan upload-env archives every matched file, and akan download-env restores them. Patterns are resolved relative to the app directory, and Akan syncs them into a managed block in the root .gitignore, so one declaration both deploys and git-ignores the files.

publicEnv exposes variable names to the browser; secrets does the opposite. Only glob patterns live in config — the matched files stay local and git-ignored, so never commit their contents.

Build And Runtime

The rest of the config is for the build system and the production image. Most apps never touch it, but it is where a package stays external, a font survives pruning, a library's routes join the app, and the image gains a system dependency.

A library contributes to three of these. Its own externalLibs, docker.preRuns and docker.postRuns, and assets.keepFonts are read off every libs/*/akan.config.ts and merged into the app's — first occurrence wins, so a step a library and its app both declare becomes one image layer. The generated image installs ca-certificates and tzdata and nothing else, which is why an app that needs ffmpeg or a headless browser declares it.

A docker written as a string is the whole Dockerfile, taken verbatim. Nothing is merged into it — including the preRuns and postRuns your libraries declared, which are silently dropped rather than silently unapplied.

Defaults And Rules

Akan resolves the final app config by merging your file with framework defaults. For a first app, keep these rules in mind before adding advanced options.

Environment values

Put runtime values in env/ before adding config fields. Use client env for public values and server env for private server options.

Routes

Skip routes until you need custom domains or multiple clients.

Mobile

appName defaults to the app name, appId defaults to com.<repoName>.<appName>, version defaults to 0.0.1, and buildNum defaults to 1. Pin a real reverse-DNS appId before you ship: akan doctor rejects placeholder ids such as com.example.app, which Apple's portal has almost always already claimed.

Images

Remote images are blocked unless remotePatterns allow them. WebP and quality 75 are used by default.

i18n

Locales default to en and ko with en first. Change it only to move the default locale or to serve a different set — defaultLocale must be one of locales, or the config load fails.

Recommended order: start with an empty config, fill env/ values as the app needs them, add routes when domains are needed, add mobile when native apps are needed, and add advanced build options only after the default build is not enough.

## Code Examples

### apps/minimal/akan.config.ts

```ts
import type { AppConfig } from "akanjs";

const config: AppConfig = {};

export default config;
```

### Code

```ts
import type { AppConfig } from "akanjs";

const config: AppConfig = {
  routes: [{ domains: { main: ["www.example.com"] }, basePath: "store" }],
};

export default config;
```

### Code

```ts
import type { AppConfig } from "akanjs";

const config: AppConfig = (app) => ({
  mobile: {
    appName: app.name,
    appId: "com.example.app",
  },
});

export default config;
```

### env/env.client.local.ts

```ts
import type { AppClientEnv } from "./env.client.type";

export const env: AppClientEnv = {
  google: {
    mapKey: "local-map-key",
  },
} as const;
```

### env/env.server.local.ts

```ts
import type { ModulesOptions } from "../lib/option";
import { libEnv } from "./env.server.type";

export const env: ModulesOptions = {
  ...libEnv,
  hostname: null,
  security: {
    verifies: [["password", "phone"]],
    sso: {},
  },
};
```

### lib/option.ts

```ts
import { AkanOption } from "akanjs/server";
import type { LlmOption } from "akanjs/service";

import { SignedIn } from "../srvkit";
import type { LibOptions } from "./srv";

export type ModulesOptions = LibOptions & {
  llm?: LlmOption;
};

export const option = new AkanOption<ModulesOptions>()
  .setLlm((options) => options.llm ?? {})
  .setAgentAccess(SignedIn)
  .setMcp({ instructions: "Domain tools for the app. Start from taskInTodo." });
```

### apps/myapp/akan.config.ts

```ts
import type { AppConfig } from "akanjs";

const config: AppConfig = {
  externalLibs: ["shiki"],
  routes: [
    { domains: { main: ["www.akanjs.com", "akanjs.com"] }, basePath: "akanjs" },
    { domains: { main: ["soft.akanjs.com"] }, basePath: "soft" },
    { domains: { main: ["office.akanjs.com"] }, basePath: "office" },
  ],
};

export default config;
```

### apps/myapp/akan.config.ts

```ts
import type { AppConfig } from "akanjs";

const config: AppConfig = {
  web: { csr: false },
  api: { prefix: "/backend", websocketPrefix: "/socket" },
};

export default config;
```

### Mobile config

```ts
const config: AppConfig = {
  mobile: {
    appName: "Example",
    appId: "com.example.app",
    version: "1.0.0",
    buildNum: 1,
    targets: {
      default: {
        basePath: "store",
        indexPath: "/explore",
        permissions: ["camera", "push"],
        assets: {
          icon: "public/icon.png",
          splash: "public/splash.png",
        },
        files: {
          android: {
            "app/google-services.json": "public/google-services.json",
          },
          ios: {
            "App/GoogleService-Info.plist": "public/GoogleService-Info.plist",
          },
        },
        deepLinks: {
          schemes: ["example"],
          domains: ["example.com"],
          ios: {
            teamId: "TEAMID",
          },
          android: {
            sha256CertFingerprints: [
              "00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00",
            ],
          },
        },
      },
    },
    android: {
      buildOptions: {
        releaseType: "APK",
      },
    },
  },
};
```

### images

```ts
const config: AppConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "asset.example.com" }],
    qualities: [75, 90],
    dangerouslyAllowSVG: false,
  },
};
```

### publicEnv

```ts
const config: AppConfig = {
  publicEnv: ["AKAN_PUBLIC_FEATURE", "BUN_PUBLIC_*"],
};
```

### secrets

```ts
const config: AppConfig = {
  secrets: ["secrets/**/*", "certs/*.pem"],
};
```

### .gitignore (auto-synced on upload-env)

```ts
# akan:secrets (managed by akan.config.ts — do not edit)
apps/api/certs/*.pem
apps/api/secrets/**/*
# akan:secrets:end
```

### Build and runtime fields

```ts
import { pushNotificationPlugin } from "./plugin/pushNotification.plugin";

const config: AppConfig = {
  externalLibs: ["shiki"],
  optimizeImports: ["custom-icons"],
  barrelImports: ["@acme/ui"],
  defaultDatabaseMode: "single",
  assets: { pruneFonts: true, keepFonts: ["fonts/Assistant-*.woff2"] },
  syncPageLibs: ["shared"],
  plugins: [pushNotificationPlugin],
  docker: {
    image: { amd64: "oven/bun:amd64", arm64: "oven/bun:arm64" },
    preRuns: ["apt-get install -y ffmpeg"],
    postRuns: ["echo after"],
    command: ["bun", "main.js"],
  },
};
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Treat convention and generated-file rules as stronger than local style guesses.

