# Akan.js Monorepo — Agent Guide

This is the canonical, tool-neutral guide for coding agents (Claude Code, Codex, Cursor, and others)
working in this repository, and the only copy. Claude Code reads it through `CLAUDE.md` (`@AGENTS.md`)
and Cursor through `.cursor/rules/akan.mdc`, both of which are pointers holding no content of their own —
there is nothing to mirror a rule change into. The section between the `akan:agent` markers is generated
by `akan agent install`; edit anything outside the markers freely.

<!-- akan:agent:start -->
<!-- akan:agent:version 3.0.0-alpha.85 -->

## Workspace

- Repo: akanjs
- Apps: minimal, akan
- Libraries: util, shared
- Packages: akanjs, use-agentic, create-akan-workspace, @akanjs/cli, @akanjs/devkit

## Repo Overview

- Akan.js is a full-stack TypeScript framework for building all-stack applications at once.
- Write one line and deploy across web, app, server, database, and infrastructure.
- Akan prioritizes actual business code by abstracting technical implementation details as much as possible.
- The goal is minimal code, high performance, and type-safe services that can deploy to web, mobile, server, and DB infrastructure together.
- This is a Bun-first Akan.js monorepo.
- Main top-level areas are `apps/`, `libs/`, `pkgs/`, and `infra/`.
- `apps/<app>` contains app-level pages, domain code, UI, env files, and `akan.config.ts`.
- `libs/*` contains shared domain and utility libraries.
- `pkgs/akanjs/*` contains framework, runtime, and tooling facets published through the single `akanjs` package. Prefer extending existing Akan facets before adding new framework-level patterns.
- `infra/` contains Helm, deployment templates, edge configs, and Jenkins env/secret scripts.

## Change Scope

- Keep edits scoped to the requested task and the directly related files.
- Do not reformat unrelated files or rewrite nearby code just for style.
- Do not revert or overwrite unrelated user changes in a dirty working tree.
- Prefer established nearby patterns over introducing a new abstraction.
- Add new abstractions only when they remove real duplication or match an existing project pattern.

## Deep-Dive Guidelines

This file carries the rules. The reasoning, the measurements, and the per-feature edge cases live in guidelines
you fetch on demand — `get_guideline` with the name, or `akan guideline show <name>`. Fetch the relevant one
**before** a deep pass on that area; a section below that points at one is a summary, not the whole contract.

| name | covers |
|---|---|
| `ssrRule` | server-share targets, the `akan.ssr.*` warnings, the client-boundary playbook |
| `runtimeRule` | `web` / `csr` surfaces, gateway vs solo processes, logging, the generated image, shipped assets |
| `queryRule` | slices and hydration, the generated filter methods, full-text search, cascade removal |
| `transportRule` | guards across HTTP and websocket, socket identity and cleanup, binary pubsub, mutation verbs |
| `mcpRule` | MCP configuration, wire behaviour, resource URIs, OAuth metadata, protocol revisions |
| `agentRule` | the in-page agent's chat options, zones, slash commands, transcript compaction |
| `cssRule` | the full semantic token set for a theme pass |
| `componentRule` | the `_overrides.tsx` slot list and drop-in component patterns |
| `recipeRule` | authoring and consuming Tailwind-variant recipes |
| `workspaceRecipes` | worked step-by-step recipes and the auto-generated API reference |

## Lint-Enforced Rules (These Break The Build)

Enforced by `biome.json`, which extends `@akanjs/devkit/biome.base.json` — that file scopes every grit plugin in
`@akanjs/devkit/lint/` to the paths it applies to. Several rules produce output that looks wrong; do not "fix" it
back.

- **Never hand-order Tailwind classes.** `nursery/useSortedClasses` is an error and also sorts the string
  arguments to `cn()`. Sorter output such as `font-bold text-2xl text-foreground` or `border-foreground/5 border-t`
  is correct. Write the classes in any order, run the formatter, leave the result.
- **Stay inside the color vocabulary.** Vocabulary closure strips the raw Tailwind palette, so these render as no
  CSS and fail lint: raw palette classes (`bg-blue-500`), arbitrary color values (`bg-[#3b82f6]`), an arbitrary
  class built by interpolation, daisyUI legacy classes (`btn-primary`, `card-body`) and its dropped color slots
  (`bg-base-100`, `text-base-content`, `text-primary-content`, `bg-error` — use `background`/`muted`/`border`,
  `foreground`, `<color>-foreground`, `destructive`), and color literals in `style={{...}}`. Use semantic tokens
  (`bg-primary`, `text-foreground/70`). A legitimate fixed color (OS-chrome mockups, data-viz) takes a
  `// biome-ignore lint/plugin: <reason>`. (`no-raw-palette-class`, `no-arbitrary-color`, `no-daisyui-legacy-class`,
  `no-inline-color`, `no-interpolated-arbitrary-class`)
- **Never `throw new Error`.** Throw `new Err("<module>.error.<key>")` and register the key as `[en, ko]` in that
  module's dictionary `.error({})`. Import `Err` from `"../dict"` on the server and from `"@libs/<lib>/client"` or
  `"@apps/<app>/client"` in UI. `no-throw-raw-error.grit` exempts tests, `*.constant.ts`, `common/**`, and `env/**`
  — the last two have no legal `Err` import path, so keep throwing code out of them.
- **Never import a third-party package** from `page/**`, from any barrel, or from any
  `*.{constant,dictionary,document,service,signal,store}.ts` / `*.{Template,Unit,Util,View,Zone}.tsx`
  (`no-import-external-library.grit`). Re-export the symbol through a lib first. One-line re-export shims in a lib's
  `common/`, `webkit/`, or `ui/` exist for exactly this reason — they are load-bearing, not cruft.
- **`#private` is banned in exactly four file suffixes:** `*.constant.ts`, `*.document.ts`, `*.service.ts`, and
  `*.store.ts` (`no-js-private-class-method.grit`). The rule is scoped by file path, not by class shape, so
  `#private` remains the house style everywhere under `srvkit/`, including `adapt()` adapter classes.
- **No `console.log` / `console.debug`.** Only `assert`, `error`, `info`, and `warn` are allowed. Server code uses
  the injected `this.logger.*` or `new Logger("ClassName")`.
- **Never call `logger.log()` / `Logger.log()`** (`no-deprecated-log-level.grit`). The ladder is `trace verbose
  debug info warn error`; `log` was a seventh tier *below* `info` that `AKAN_PUBLIC_LOG_LEVEL=info` silently
  dropped. The method is kept and emits at `info`, so a call reads like a distinct level and is not one — write
  `.info()`.
- **Never write a `//!` marker in browser-reachable code** — `ui/`, `webkit/`, `common/`, `page/**/*.tsx`,
  `*.constant.ts`, `*.store.ts`, and the five module component suffixes (`no-bang-comment-in-client.grit`). Bun
  classifies `//!` and `/*!` as legal comments and keeps them through minification, so the note ships to every
  visitor. Use `// FIXME:` there; `//!` stays legal in server, `srvkit/`, and CLI files.
- **Never return a value from a store action** (`no-return-in-store-action.grit`). Every method of a `store(...)`
  class dispatches through `st.do.<action>()`, typed `void` / `Promise<void>`, so the value is unreachable — write
  it into state with `this.set({ ... })`. A bare `return;` guard, a `return` inside a nested callback, a getter,
  and a `static` helper are all still fine.
- **Never redeclare a generated CRUD endpoint name** in `*.signal.ts` (`no-redeclare-predefined-endpoint.grit`).
- **Never type a `*.Util.tsx` / `*.Zone.tsx` prop as a `cnst` model** (`no-model-type-in-util-zone.grit`). Those two
  roles are always client components, so a `cnst.Banner` / `cnst.LightBanner` prop is a class instance the server
  has to hand across the boundary; take `bannerId: string` and read the model from the store instead. Only prop
  positions are read, and only shapes that are actually an instance. Exempt: an indexed enum access
  (`cnst.<Enum>["value"]`), a `ClientInit` / `ClientView` / `ClientEdit` or `ModelsProps<…>` type argument, a
  function-typed prop, and any `cnst` type that never leaves the file. Other indexed accesses
  (`ModelProps<"setting", cnst.LightSetting>`, `cnst.Banner["image"]`) stay flagged.
- **Never wrap a form setter in a pass-through arrow** (`no-unpublished-form-setter.grit`).
  `onChange={(type) => st.do.setTypeOnTicket(type)}` runs identically to `onChange={st.do.setTypeOnTicket}`, but
  the arrow is a fresh anonymous closure, so the control emits no `data-akan-action` and publishes no agent tool
  for the field — a silent failure in two lines that read the same. A wrapper that transforms the value, adds a
  statement, or writes a nested path with `writeOnX` stays legal; publish that one with an explicit `st.tool`.
- **No deep imports past a barrel** (`no-deep-internal-import.grit`). Cross-module constant references such as
  `../map/map.constant` are the sanctioned exception.
- **Never import across the client/server boundary.** Client files (`ui/`, `webkit/`, `page/`, `*.store.ts`, every
  `.tsx`) may not import a `*.document.ts` / `*.dictionary.ts` / `*.service.ts` / `*.signal.ts`, `srvkit/`, a
  package `server` entrypoint, or the `db` / `srv` / `sig` / `dict` / `option` / `useServer` barrels
  (`no-import-server-in-client.grit`). Server files (those four suffixes plus `srvkit/`) may not import a
  `*.store.ts`, a module component, `ui/`, `webkit/`, a package `client` entrypoint, or the `st` / `store` /
  `useClient` barrels (`no-import-client-in-server.grit`). Shared files — `common/` and `*.constant.ts` — are held
  to **both**, so they reach neither side. `import type` is erased before bundling and stays legal in every
  direction; a mixed value-and-type import is not exempt. Scoped to `apps/**` and `libs/**`.
- **Server-component discipline** is enforced on `page/**`, `*.Unit.tsx`, and `*.View.tsx`
  (`no-import-client-functions.grit`, `no-use-client-in-server.grit`, `non-scalar-props-restricted.grit`).
- **Never write an async component outside `page/`** (`no-async-component-in-ui.grit`, scoped to
  `{apps,libs}/**/ui/**/*.tsx`). React has no async client component, so a `ui/` component that awaits breaks as
  soon as a client parent renders it, and the load drops below the route, which could have started it before the
  first byte. Await in the page — or hand an unawaited `fetch.*` field to a `Zone` as an `init` / `view` prop, or
  to a `<Load.Stream of={…}>` that awaits it behind a boundary of its own — and take the resolved data as a prop.
  Only a PascalCase binding whose own initializer is `async` is matched, so an async handler inside a synchronous
  component and `lazy(async () => import(…))` are untouched.
- **Never call `fetch.init*` from a client file** (`no-init-fetch-in-client.grit`). `fetch.init<Model><Suffix>` and
  `fetch.get<Model>Init<Suffix>` compose the slice's list and insight queries into the hydration snapshot that
  `Load.Units` / `Load.View` seed the store from. From a route it resolves before the first byte; after hydration
  it is two extra round-trips for a shell the browser already painted. Load it in the page and pass the result
  down as an `init` prop — or hand the unawaited `x<Model>Init<Suffix>` promise across — and reload from the client
  through the generated `st.do.init<Model><Suffix>()`. Gated on the real `"use client"` directive plus
  `*.store.ts`, and matched by shape (`init` + `Capitalize<refName>` + `Capitalize<suffix>`), so a hand-written
  `initPayment` is out.
- `noArrayIndexKey` and `useExhaustiveDependencies` are **off** on purpose: `key={idx}` for embedded scalars and
  short dependency arrays are intentional, not oversights.
- **A grit plugin diagnostic is suppressed as `lint/plugin`, not `plugin`** — `// biome-ignore lint/plugin: <reason>`
  for one line, `// biome-ignore-all lint/plugin: <reason>` for a file. The bare `// biome-ignore plugin:` form
  Biome's own category name suggests does nothing. The module-convention plugins apply to `apps/**` and `libs/**`
  only, so a plain package under `pkgs/` never needs the escape hatch.
- **`biome.json` is strict JSON — a comment in it breaks config resolution.** Biome does not report the parse
  error; it falls back to discovery and aborts on whatever nested config the walk finds. Rename the file to
  `biome.jsonc` to document a disabled rule.
- **`akan lint` prints up to 200 diagnostics** (`--max-diagnostics <n>`, `0` for no limit). Biome's own default is
  20 with no count, which reads as progress when the mix of findings merely changed.

## Coding Style (`**/*.{ts,tsx}`)

- For large units of work, prefer declaring a class and running the flow through an instance instead of scattering many standalone functions.
- Prefer class methods or `static` methods over unrelated top-level helper functions when the logic belongs to a class-level workflow.
- Prefer ECMAScript `#private` fields and methods over TypeScript `private`, except in the four suffixes where `#private` is lint-banned (`*.constant.ts`, `*.document.ts`, `*.service.ts`, `*.store.ts`) — those use TypeScript `private`. `#private` is the house style under `srvkit/`, including `adapt()` classes.
- In files that declare a class, avoid top-level functions or variables when they can reasonably live inside the class.
- Prefer `const` function expressions over `function` declarations unless hoisting, overloads, generators, or framework conventions make `function` the better fit.
- Prefer declaring only one class per file; split the file when two or more class declarations are needed.
- For class-centered modules, prefer noun-style filenames that match the primary class name, such as `RouteClientBuilder.ts`, instead of verb-style wrapper filenames like `buildRouteClient.ts`.
- Avoid keeping exported functions that only instantiate a class and immediately call one method. Prefer migrating callers to instantiate the class directly.
- Except for React component files or convention files, TypeScript filenames should use camelCase.
- In React components, keep one-off `className` strings inline. Only extract class name constants when the class is reused, conditionally composed, or too large to read comfortably in JSX.

### File Size And Duplication

- Keep files small. The house median is well under 50 lines; split a component before it reaches ~150 lines rather than adding section comments.
- Ship every scaffold file even when it is empty — `export class XInternal extends internal(srv.x, () => ({})) {}`, empty dictionary stages, the `// state` / `// action` markers in an empty store. They mark where things go.
- Never add a sibling helper file inside `lib/<model>/`. Helpers go to `common/`, `webkit/`, `srvkit/`, or `ui/`.
- Prefer duplication to premature abstraction at the leaf. Near-identical sibling modules and per-vendor pages are deliberately copied, not parameterised. Copy the file and change the literals; share enums by import only.

### TypeScript Shape

- Use `interface` for object shapes and `type` only for unions and aliases.
- Declare `interface <ComponentName>Props` immediately above the component with no blank line between, and put `className?: string` first. Name it for the component (`CardProps`, `WorldProps`), never for the model. Do not export it unless a sibling imports it.
- Never use a non-null assertion. Narrow with `?.`, an early return, or a type predicate such as `.filter((id): id is string => !!id)`.
- Escape with `as unknown as T`. Never `as any`.
- Never annotate a component's return type. Annotate a helper only when the return is a union, a tuple, or a type predicate.
- Use `as const` on every `enumOf(...)` array, every `via(Model, [...] as const, …)` Light tuple, and every module-scope lookup map. Never use the TypeScript `enum` keyword.
- Async functions carry no `Async` suffix.

### Test Code

- Write TypeScript tests with Bun's test runner and import `describe`, `expect`, and `test` from `bun:test`.
- Keep tests colocated with the source they cover using `*.test.ts` or `*.spec.ts`, following the existing nearby pattern.
- Prefer focused behavior tests for public contracts and edge cases over implementation-detail assertions.
- Run package suites with `bun run akan test <pkg>` from the repo root, or `cd <pkg> && bun test --isolate`. Plain `bun test` without `--isolate` shares one global object across test files and fails dozens of tests from cross-file state pollution (`bunfig.toml` `[test] isolate` is not honored as of Bun 1.3), and running `bun test` from the repo root breaks subprocess stdio pipes.
- Split signal tests in two. `<model>.signal.spec.ts` holds reusable fixtures built on `sampleOf(cnst.XInput)` with explicit `Promise<cnst.X>` return types and **no assertions**. `<model>.signal.test.ts` holds the assertions: `describe("<Model> Signal")`, `let` fixtures at describe scope, one `beforeAll`, story-ordered `it`s, and negatives via `await expect(p).rejects.toThrow()`.
- `lib/user/user.signal.spec.ts` is the one place agent types are re-exported and re-typed; import `UserAgent` / `AdminAgent` from there rather than from the owning lib directly.
- A placeholder `it` with a descriptive title is an acceptable floor. Write a real suite when the behaviour is security-relevant.

## Comments

Do not narrate code. Do document the thing the code cannot say. Both halves are the rule.

- Never add a comment that restates the identifier, the signature, or the control flow.
- Prefer clear names and structure so ordinary logic needs no explanation.
- Do not add JSDoc, section banners, or "why/how" comments for ordinary logic.
- Comment density tracks the layer, not the author: pages carry none, product `lib/` and `ui/` code stays under 1 %, and `srvkit/` adapters and `guards.ts` carry as much as the external constraints require.
- A comment is warranted for: a vendor spec or protocol quirk; an infrastructure constraint; a third-party library gotcha; security reasoning; why a rule that looks arbitrary is correct; a math derivation; a domain field's business meaning; a state transition above a document chain method; why an obvious alternative was rejected.
- In-code markers:
  1. `TODO` — unfinished work that must be tracked in-code
  2. `FIXME` — known broken or incorrect behavior that must be fixed
  3. `XXX` — dangerous / surprising hazard that a reader must not miss
  4. `//!` — disabled or must-fix code. **Server, `srvkit/`, and CLI files only.** Bun's bundler treats `//!`
     (and `/*!`) as a legal comment and keeps it through minification, so in browser-reachable code the note
     ships verbatim to every visitor. Use `// FIXME:` there instead; `no-bang-comment-in-client.grit` enforces it.
  5. `//?` — an explanatory aside
  6. `//*` — a design note
  7. Deletion caution — warn why removing a line or block would break something non-obvious
- Keep allowed comments one short line when possible.
- Every suppression carries a reason: `// biome-ignore lint/<rule>: <why>`. Never a bare disable block.
- Match nearby file style: if the surrounding code has few comments, keep it that way.

## TypeScript And Imports (`**/*.{ts,tsx}`)

- Use Bun and ESM assumptions from the root `tsconfig.json`.
- Prefer path aliases over deep relative imports when crossing package boundaries.
- Use `akanjs/*` for framework facets, `@apps/*` for apps, `@libs/*` for shared libs, and `@contract/*` for contract code.
- Respect existing client/server entrypoints — `@libs/<lib>/client` / `@libs/<lib>/server` and `@apps/<app>/client` / `@apps/<app>/server`.
- Let Biome organize imports instead of manually reshuffling unrelated imports.
- Namespace the generated barrels in backend `.ts` files: `import * as cnst from "../cnst"`, `* as db`, `* as srv`. Use `import type * as srv` in services so the runtime graph stays lazy, and a value import in signals.
- In `.tsx` files use one flat named import from the package client path (`import { cnst, fetch, st, Ticket, usePage } from "@apps/<app>/client"`) — never a relative `../` import.

## Formatting And Linting

- Use Biome as the formatter and linter.
- Format with `bun run akan lint <appName>` from the repo root.
- Keep formatting consistent with `biome.json`: 2-space indentation, 120 line width, and double quotes for JS/TS.
- Avoid adding new `console` usage except accepted methods such as `console.error`, `console.info`, and `console.warn`.
- Do not make broad formatting-only changes in unrelated files.

## Client / Server Boundaries (`apps/**`, `libs/**`, `pkgs/akanjs/**`)

- Use `"use client";` at the top of client component files.
- Be careful when importing client-only code from page or layout modules.
- Keep page props serializable unless the existing route pattern clearly allows otherwise.
- In domain UI the boundary is mechanical, not a judgment call: `Template`, `Zone`, and `Util` are always client components with `"use client"` on line 1; `Unit` and `View` are always server components and never carry the directive.
- Preserve established domain file roles such as `.document.ts`, `.service.ts`, `.store.ts`, `.constant.ts`, and `.client.ts`.
- When unsure, inspect nearby files in the same app or package before introducing a new boundary pattern.

## SSR First — Server Rendering Is The Default

Akan is SSR-first. Every JSX element that renders on the server ships as HTML and costs nothing to hydrate;
every element behind `"use client"` ships twice — as markup and as bundled JS that must re-run in the browser.
The boundary is not about which file *may* be client, it is about **how little** ends up on the client side.

**The default is server. `"use client"` is a cost you justify per component, not a habit.** A component earns the
directive only by using a client-only capability: a React hook, a JSX event handler, the store (`st.use.*` /
`st.do.*`), a browser global, or a client-only third-party package. Rendering markup, reading a param, calling
`l()`, and mapping over data are all server work.

Measure before and after with `akan quality ssr` (`--format json` for tooling). It prints the server render share
per app and lib — server-rendered JSX elements over total — and the SSR warnings below. Treat **50% server share
as the floor** for an app or lib and a **falling share as a regression**: if a change moves markup to the client,
say why in the PR or move it back.

### What `akan quality ssr` Flags

| Rule | Means |
|---|---|
| `akan.ssr.unnecessary-use-client` | The directive is there but nothing in the file needs it. Delete it. |
| `akan.ssr.client-static-component` | A component in a client file renders real markup with zero client-only capability — pure server work sitting in the bundle. |
| `akan.ssr.client-static-markup` | A large subtree wraps one or two interactive touches. Split it: interaction stays client, markup goes server. |
| `akan.ssr.client-mount-load` | A `useEffect(…, [])` loads server data. The route can fetch it before the first byte. |
| `akan.ssr.module-missing-server-view` | A module renders only from `Template`/`Zone`/`Util` and has no `Unit`/`View` at all. |
| `akan.ssr.template-client-state` | A `Template` holds form state in `useState` instead of the store. |

A third-party client package or an `index_.tsx` `lazy()` boundary is a legitimate reason for the directive and is
not flagged. Interaction-driven `fetch.*` (a lookup inside `onClick`) is not flagged either — only mount-time loads
are, because those are the ones the server could have done.

### Server-Side Implementation Playbook

1. **Wrap the interaction, not the UI.** The smallest useful client component adds one behaviour and renders
   `children` untouched, so the markup inside never reaches the bundle.
2. **Split compound components so panels stay on the server.** `Tab` / `Tab.Menus` / `Tab.Menu` / `Tab.Panel` in
   `akanjs/ui` is the shape: only the provider and menu hold state. Never one `"use client"` file with a mode
   `useState` and every panel body inlined.
3. **Sync state instead of fetching it.** The route calls `fetch.initXInY(...)` / `fetch.viewX(...)` and passes the
   result into a `Zone` as an `init` / `view` prop; `Load.Units` / `Load.View` hydrate the store from it. Never a
   `useEffect(…, [])` that fetches on mount.
4. **Push the boundary down to the leaf that needs it.** A store-reading `Zone` should hold zero markup and
   delegate to a server `View`.
5. **Hand each promise across, not the awaited value.** `fetch.init<Model><Suffix>` / `view<Model>` / `edit<Model>`
   are awaitable *and* destructurable: `const { xInitInY, xListInY } = fetch.initXInY(id)` hands out one promise
   per field with both queries already in flight. Give `xInitInY` to a `Zone` and `xListInY` to a
   `<Load.Stream of={…}>`; each renders behind its own boundary as its own data lands, so the page never waits
   for the slowest. `await` still returns the old shape and keeps the whole section in the shell — which is what
   SEO snapshots, prerendering and pre-hydration E2E read, so await what the page needs immediately and stream
   the rest. `xListInY` / `xInsightInY` hold hydrated model instances that React Flight refuses as client props:
   consume them in a server component, never as a `Zone` prop.
6. **Use named `ReactNode` slots, not just `children`** — `Layout.Navbar` takes `title`, `back`, `left`, `right`,
   and `children`, so a client shell composes server content in five places instead of absorbing it.
7. **Let the server do the derived work.** Display and predicate logic belongs on `Light<Model>`; enum→class
   lookups belong in a module-scope `as const` map.
8. **Gate auth on the server** — `getSelf({ unauthorize: "/signin" })` in `_layout.tsx`, before any HTML is sent.
9. **Prefer CSS over client state for pure visibility.** A `data-*` attribute plus `group-data-[…]` variants, or
   `<details>`/`<summary>`, keeps both branches server-rendered.
10. **Keep the heavy island out of the first load** — behind the `ui/<Folder>/index_.tsx` + `lazy()` pair.
    `usePage()` and `l()` work in server components, so translation never forces a boundary.

Full version with code, the `Tab` composition example, and a review checklist: `get_guideline` with `ssrRule`.

## Runtime & Build Configuration

What an app serves, how many processes it runs, where its logs go, and what ships in its image. All of it is
declared in `akan.config.ts` and narrowed — never widened — by an env at boot. Domain code reaches none of it.
Full contract: `get_guideline` with `runtimeRule`, or `akan guideline show runtimeRule`.

- **Web surfaces are `web: true | false | { csr: boolean }`.** `{ csr: false }` drops the mobile/CSR bundle,
  `false` is an API-only build that serves nothing under `page/`. There is no CSR-without-SSR option, by type —
  the CSR bundle inlines the stylesheet the SSR base artifact compiles. `AKAN_SSR` / `AKAN_CSR` narrow further at
  runtime and can never switch a surface the build left out back on. `akan start` ignores `web` and keeps the
  whole dev surface.
- **One traffic replica runs in the container's only process.** `AKAN_REPLICA=0,0,1` — the default everywhere —
  has nothing to balance, so there is no gateway and no unix-socket proxy hop. Two or more replicas, a batch-only
  replica, `AKAN_SOLO=false`, passing `replica` to `new AkanApp(...)`, or `akan start` all bring the gateway back.
  The RSC worker is always its own process (`--conditions react-server`). A solo process answers
  `/_akan/app/health`, `/_akan/app/metrics` and `/_akan/bench/ping` in the gateway's own shape, and owns the
  rotating log file; nothing supervises it but the orchestrator's probes.
- **`main.ts` imports `AkanApp` from `akanjs/server/akanApp`, not the barrel** — the barrel re-exports
  `AkanServer`, whose graph the gateway never runs. Keep entrypoint imports at the leaf.
- **Every `Logger` call builds a `LogRecord`** carrying `traceId`, `endpoint` and `origin` alongside the message,
  so one request's lines share a trace. Request context is on by default, production included
  (`AKAN_LOG_CONTEXT=0` opts out). **Give every sink a floor** — `Logger.addSink(sink, { minLevel })`; a sink with
  none makes every `verbose` call render. **Never log per delivered record in anything that delivers records.**
  Tail a running server with `akan logs <app>` (`--level --grep --endpoint --trace --child --role --origin
  --since`, `--json`) or `.tail` / `.trace <id>` inside `akan console`.
- **`AKAN_LOG_FORMAT=ndjson` makes the container's stdout one JSON record per line, and the hub owner (gateway or
  solo replica) its only writer** — every other server process turns its console off and forwards from
  `AKAN_LOG_STDOUT_LEVEL` (default: the console level); a child's or the RSC worker's crash stack is wrapped as a
  `raw=true` record instead of breaking the stream. Text stays the default; turn it on in the deployment.
  `AKAN_LOG_STREAM_TOKEN` mounts `/_akan/app/logs` (SSE, `Last-Event-ID` resume, explicit `gap` events); unset,
  the route does not exist. `AKAN_LOG_CANONICAL=1|slow` writes one `ok|error <endpoint> ms= status=` line per call;
  `AKAN_LOG_FLIGHT=1` keeps each call's last 64 sub-level records and promotes them (`flight=true`) only when it
  failed or ran past `AKAN_LOG_FLIGHT_MS`; `x-akan-debug` lowers one request to `trace` — in `local`, or with the
  `AKAN_LOG_DEBUG_HEADER` secret. Structured values go in `LogRecord.attrs` via `Logger.emit(...)`; a key naming a
  secret is `[redacted]` before the record exists.
- **`docker` is `string | { image, preRuns, postRuns, command }`** — a whole Dockerfile, or the parts Akan
  assembles one from; the string form takes no contributions. The generated image installs `ca-certificates` and
  `tzdata` and nothing else, so an app needing `ffmpeg` or Chromium declares it in `preRuns` / `postRuns`. A lib
  declares the steps its own runtime needs and every mounting app inherits them.
- **`assets: { pruneFonts, keepFonts }`** trims from the `dist` copy of `public/` the fonts nothing reads; source
  trees are never touched. A font with `optimize` on is a build input, not a runtime asset. `keepFonts` belongs to
  the `akan.config.ts` that owns the font, written against that scope's own `public/`.

## React Components And Styling (`**/*.tsx`)

- Components are `export const X = ({ … }: XProps) => { return (…); };` — arrow const with a block body. `export default` is reserved for pages, layouts, and `lazy()` targets.
- Never `React.FC`, never `defaultProps`, never `PropsWithChildren`. Defaults go in the destructuring (`prefix = ""`); children are typed `children: ReactNode`.
- `"use client"` on line 1 above the imports is mechanical by file role: every `.Zone.tsx`, `.Template.tsx`, and `.Util.tsx` has it; no `.Unit.tsx` or `.View.tsx` ever does. `usePage()` is legal in server files.
- Conditional render is `cond ? <X/> : null`. Never `{cond && <X/>}` — in a `className` context it renders the literal string `"false"`. Early `return null` is for guard clauses only.
- Never hand-roll loading, empty, or list states. Use `Load.Units` / `Load.View` / `Load.Edit` with `renderItem`, `renderList`, `renderView`, and `renderEmpty`; `<Empty />` for a bare placeholder; and `Model.New` / `Model.Edit` / `Model.SureToRemove` for CRUD modals. For data no `Load.*` covers, `<Load.Stream of={promise} fallback={…}>{(value) => …}</Load.Stream>` awaits one promise behind its own Suspense boundary; a resolved value renders in the shell with no boundary at all, so the same call site works either way.
- Avoid hooks. `useState` is for modal-open, tab, draft-input, and drag state only — never for server data. `useEffect` must be a genuine effect such as subscribe-with-cleanup or one-shot init. Prefer `Tab` over a `useState` mode switch. `.Template.tsx` files contain zero `useState`.
- Forms are entirely store-driven: `value={xForm.field}` with `onChange={st.do.setFieldOnX}`, the setter passed by reference. Always use `Field.*`, never a bare `<input>` for a model field. Nested rows use `st.do.writeOnX("payments.3.name", v)` plus the generated `add<Field>OnX` / `sub<Field>OnX`. **Passing the setter by reference is also what makes the framework emit `data-akan-action` / `data-akan-state`** on the control — the annotation an in-page agent, an E2E selector, and an external browser agent all read. Wrapping it in an inline arrow (`onChange={(v) => st.do.setFieldOnX(v)}`) silently drops that: a closure the caller wrote says nothing about what it does. Never hand-write a `data-akan-*` attribute.
- Read with `st.use.*` and write with `st.do.*`. Client components do not call `fetch.*`.
- Static class strings stay plain strings. Reach for `cn` only for a conditional or to merge an incoming `className`, and merge the caller last: `cn("base classes", cond && "extra", className)`. `cn` comes from `akanjs/client` (token-aware tailwind-merge) and is the only class-combining function — no `clsx` (removed), no raw `twMerge` imports, no object syntax (`{ x: cond }` → `cond && "x"`).
- Multi-slot components take extra named props (`wrapperClassName`, `bodyClassName`), never a `classNames` object.
- Hoist enum→class lookups to a module-scope `as const` map typed `{ [key in cnst.XStatus["value"]]: string }`. Do not use `Record<...>`. Escalate the map to `webkit/` when a second module needs it.
- Use `<Link>` from `akanjs/ui` for internal navigation; `<a>` only for `mailto:` and external links.

## Naming And Language

- Component exports are role names — `Card`, `Sticker`, `General`, `Preview`, `Admin`, `World`, `Mesh`, `Remove`. The model comes from the namespace (`<Floor.Unit.Card>`), so never write `FloorCard`. `Util` exports are the endpoint verb minus the model noun (`Serve`, `Refund`, `Complete`, `Terminate`).
- Layer the verbs: the document chain method drops the model (`sign()`, `approve()`), the service keeps the bare verb, and the signal, store, and dictionary re-add it (`signScContract`). This keeps custom endpoints clear of generated CRUD and makes `st.do.X` read the same as `fetch.X`.
- Slice and filter names are prepositional: `inOrg`, `inProject`, `inPeriod`, `byStatuses`, `ofPortfolio`. Never `getXInY`, never `listX`.
- Handlers are `onX` props taking inline arrows. Do not extract a `handleX`.
- Booleans are `is*` / `has*` / `can*` / `show*` / `disable*`. Counters are `*Num`, indices are `idx`, collections are `*List` or plural. `SCREAMING_SNAKE` is unused; module-scope tables are camelCase + `as const`.
- Keep existing domain vocabulary and its typos. Transliterated domain terms and misspelled identifiers already in use are load-bearing — renaming them silently breaks callers that match on the name.
- Identifiers, type names, endpoint names, and log messages are **English, always**. Everything a user reads goes through `l("model.field")` or `l.trans({ en, ko })` — never a hard-coded string in JSX, never `window.alert`.
- Dictionary entries are `[en, ko]` pairs, and nearly every label also carries a `.desc([en, ko])` even when it repeats the label. English labels are Title Case, Korean is the plain domain term, and `.error()` Korean ends in `다.`.

## Domain Module Conventions (`apps/**/lib/**`, `libs/**/lib/**`)

- Organize business concepts as domain folders under `lib/`; keep related schema, service, signal, store, and UI files together.
- Use lowercase logic files such as `<model>.constant.ts`, `<model>.document.ts`, `<model>.service.ts`, `<model>.signal.ts`, `<model>.dictionary.ts`, and `<model>.store.ts`.
- Use PascalCase React component files such as `<Model>.Template.tsx`, `<Model>.Unit.tsx`, `<Model>.View.tsx`, `<Model>.Zone.tsx`, and `<Model>.Util.tsx`.
- Treat `constant.ts`, `dictionary.ts`, and `signal.ts` as shared contract files that should avoid platform-specific dependencies.
- Keep backend persistence/query logic in `.document.ts` and domain business orchestration in `.service.ts`.
- Keep frontend state in `.store.ts`; use `Template` for forms, `Unit` for list/card items, `View` for details, `Zone` for composed page sections, and `Util` for domain-specific UI helpers.

### Module File Playbook

**`<model>.constant.ts`** — five classes in order with one blank line between them and `enumOf("camelName", [...] as const)`
classes above: `XInput → XObject → LightX → X → XInsight`. Write `XInsight` even when it is empty. Put display and
predicate logic on `LightX` (`isNew()`, `canWrite(user?)`, `formatTimes()`) — the Light class is the one both server
and client hold, so shared logic belongs there instead of in a util module. **This is the most commonly missed rule
in the codebase.** Collection-level helpers go `static` on the full model. Give any field whose business meaning is
not obvious a short trailing comment.

**A model instance's `Date` fields are prototype accessors, not own properties.** `user.createdAt` is still a `Dayjs`,
built on first read from a native `Date` the instance holds under a symbol. So `Object.keys(user)` and `{ ...user }`
do **not** include them, while `"createdAt" in user`, `for...in`, `JSON.stringify(user)`, `plainFieldsOf(user)`
(`akanjs/common`), `immerify`, and `deepObjectify` all do. To copy a model, `new cnst.X().set(user)`, never a spread.

**`<model>.document.ts`** — fixed order: `XFilter extends from(...)` → `X extends by(...)` → `XModel extends into(...)`,
with `sort: {}` always present. Chain methods validate → mutate → `return this`, and never `save()`; the caller saves,
so chains compose (`org.removeUser(id).removeInvite(id).save()`). Put a one-line comment above each stating the
transition. Atomic counters live on the Model class with the updater-callback form, returning `!!modifiedCount`.
Indexes and derived totals go in `static override _onSchema`, not in the service. **Removal is always soft** — the
framework has no hard delete for a model table, and `delete` is deliberately left unused so it can mean one later.
The facade spells `Many`/`One` out on its writes (`updateOne` / `updateMany` / `removeOne` / `removeMany`); only the
count was shortened to `count(query)`, with `countDocuments` kept as `@deprecated`. `updateById(id, update)` and
`removeById(id)` are those same query-level writes narrowed to one id, **not** the document path: they fire no hooks,
so a model whose removal cascades or carries a `_postRemove` still goes through `remove<Model>(id)`.

**`<model>.service.ts`** — keep methods to a few lines: load → chain → `return await ….save()`. Write `return await`
explicitly in tail position; do not "optimize" it away. Side effects belong in `override async _preUpdate` /
`_postCreate`, not inline. Fire-and-forget is explicitly `void`-ed. Order deliberately: load every referenced document,
then save, then notify. Return `null` / `false` for "not allowed" or "not found" and let the signal decide whether that
is an error.

**`<model>.signal.ts`** — `XInternal` → `XSlice` → `XEndpoint`, all three declared even when empty. `exec` is a one-liner
delegating to the service.

**`<model>.store.ts`** — write a custom action only for a toast, an optimistic update, or a multi-field write; most
stores need none, because state and CRUD actions are generated. The body is three lines: `await fetch.X` →
`this.setX(...)` → toast. The optimistic shape is mutate the client model, `void fetch.*`, then commit. Use
`this.pick(...)` when the value must exist, `this.get()` when it may not, and `this.set({...})` to write. Mutate lists
through the collection API (`this.set({ xList: xList.set(x).save() })`), not array spread. **An action returns
nothing** (`no-return-in-store-action.grit`). **Never `import type { RootStore } from "../st"`** — it crashes
`akan build` with a Bun SSR segfault.

**`<model>.dictionary.ts`** — fixed chain, with empty stages still written:
`.of() → .model() → .insight() → .query() → .sort() → .enum() → .slice() → .endpoint() → .error() → .translate()`.
Name every argument in `.arg()`, including framework-supplied `skip` / `limit` / `sort`. Use `modelDictionary`,
`scalarDictionary`, or `serviceDictionary` to match the module kind.

**`<module>.abstract.md`** — a title line, one declarative sentence naming what the module owns, a `## Rules` list of
two to five invariants the code cannot show, and an optional workflow arrow chain
(`draft -> signed -> active -> completed`). Never restate field lists or types. Update it whenever an invariant or
workflow changes.

## Service And Signal Conventions (`*.{service,signal}.ts`, `server/**`)

- Keep domain business operations in `.service.ts` classes built with `serve(...)`.
- Keep execution contracts and triggers in `.signal.ts` classes built with `internal(...)`, `slice(...)`, and `endpoint(...)`.
- Use `Internal` for internal triggers such as init, interval, cron, or queue jobs.
- Use `Slice` for typed data views that feed client stores and zones; keep each slice focused on one purpose.
- Use `Endpoint` for query and mutation contracts exposed to callers.
- Connect external APIs or infrastructure through adapters, usually under `srvkit/`, and inject them into services instead of importing vendor clients directly into domain logic.

### Guards And Transports

Full contract — credential handshake, room revalidation, socket cleanup scoping: `get_guideline` with
`transportRule`, or `akan guideline show transportRule`.

- Guards run on both HTTP and websocket calls. Read the caller with `context.get<T>("account")` instead of
  branching on `getHttpContext()` / `getWebSocketContext()`, and keep them side-effect free and safe to re-run —
  a pubsub room's guards are re-run whenever the socket's credential changes.
- Slice-level `guards` only reach the generated query/mutation endpoints. A `pubsub`/`message` endpoint is
  unguarded unless it declares its own `guards` in its signal option.
- **Never read the caller's IP off the socket or the request peer — take `.with(Ip)`** (`context.getClientIp()`
  inside a guard or middleware). Behind a federation gateway, `ws.remoteAddress` and the child's own peer are the
  *gateway* (`127.0.0.1`) for every caller and for the whole life of every socket. `Ip` reads what a proxy
  recorded, is unwrapped from its `::ffff:` form, and is `null` rather than a placeholder when genuinely unknown.
- **Every socket carries a `socketId`, and only the framework mints one** — read it off the `Ws` internal arg
  (`.with(Ws)` hands `{ ws, socketId, subscribe, on, off }`). Never mint your own from `ws.data`: the room
  bookkeeping keys on the framework's id and a second one fails to match it silently. It identifies a
  **connection**, not a caller, so per-user state keys on the account.
- **A cleanup registered with `ws.on("disconnect" | "unsubscribe", fn)` is scoped to the call that registered it**
  — a room for a `pubsub` subscribe, the socket for a `message` handler. Cleanup that must happen either way
  registers for both.

### Authorization Defaults

- **Every `slice()` takes an explicit `{ guards: {…} }` second argument, and `root:` is always `Admin`.**
- **Every custom `mutation` / `query` / `message` names its own `guards: [...]` array.** Never rely on the slice default. `Public` belongs on a slice `get:`, never on a mutation.
- **The guards are also the MCP exposure decision** — see MCP Exposure. An endpoint that names none is not published to agents at all, and a mutation whose only guard is `Public` is refused, so a missing `guards` array now costs visibility as well as authorization.
- Resource guards are `Can<Verb><Model>` classes in `srvkit/guards.ts` that `implements Guard` with an `async canPass(context)`. They **fail closed**: no resource named ⇒ `false`; a load that throws ⇒ `logger.warn` then `false`. Admin bypass goes first.
- Keep `static name = "User";` on guard classes. `fetch` serializes guard names and the API explorer filters on them; it looks like dead code, and deleting it breaks the UI. Comment it so the next reader knows.
- **Every guard class also declares `static scope: GuardScope`, and it is required with no default.** `"account"` means the verdict reads the caller and nothing about the call, so it can be evaluated with no arguments — which is what lets an MCP listing hide what this caller certainly cannot use. `"resource"` means it needs the call's arguments (`context.getArg()`) and fails closed without them, so it is never evaluated for a listing: the entry stays visible and is stopped at call time. Getting it wrong is not a type error, so the marker is mandatory rather than defaulted — `SignedIn` / `Admin` / role checks are `"account"`, and every `Can<Verb><Model>` is `"resource"`.
- The acting user arrives via `.with(Self)` / `.with(CurrentUserId)` / `.with(Me)`. Never trust a client-supplied id.
- Guards ship with the library that owns the model and are imported by its own signals through the package path, so a mounting app inherits authorization and cannot forget it.
- Services re-check ownership even when a guard already gated the call — two independent gates.
- `srvkit/guards.ts` earns real comments: explain what would leak without each guard.

### Signal Body Types

- `.body(...)` / `.param(...)` args accept `ConstantFieldTypeInput` only: scalars, model refs, or `enumOf(...)`.
- Numbers must use `Int` or `Float` — `Number` is rejected (`pkgs/akanjs/signal/endpointInfo.ts`).
- `Upload` is valid only inside a mutation flagged for file upload: `mutation([cnst.File], { fileUpload: true }).body("files", [Upload])`, as the `file` module does. It is not a model field type.
- Bytes are `Binary`, never `Any` — see Scalar & Field Type Reference.

### Binary Pubsub And Mutation Verbs

Full contract — backpressure modes, the `Any`-carrying-bytes fallback, multi-verb paths: `get_guideline` with
`transportRule`.

- **`pubsub(Binary)` sends its payload in a websocket binary frame**, skipping the JSON envelope and the base64 a
  JSON wire would need; the client's subscribe callback receives a `Uint8Array`. The optimization applies only
  when the **whole** return is `Binary`. A declared `Binary` room **coalesces under backpressure** — keeping only
  the newest frame — which is what telemetry and video want; declare `{ backpressure: "queue" }` when the frames
  are a sequence a subscriber must see in full. A `pubsub(Any)` carrying bytes is framed too and warns once;
  declare `Binary`.
- **A `mutation` is `POST`.** `{ method: "PATCH" | "PUT" | "DELETE" }` moves it, and one path may carry several
  verbs; two endpoints claiming the same path **and** verb fail the boot. Reach for it only when a foreign wire
  protocol forces the verb — Akan's own `fetch.*` client, the OpenAPI document, and the API explorer all follow
  whatever is declared.

### Reserved Endpoint Names

- Auto-generated CRUD endpoints (e.g. `create<Model>`, `update<Model>`, `remove<Model>`) already exist for every model. Do not declare an `Endpoint`/`Slice` with a name that collides with them.
- The service layer surfaces such a collision as a typecheck error, but the signal layer can pass sync/typecheck/build and fail only at runtime — so treat name collisions as errors regardless of whether the build is green.

### Slices, Queries, and Hydration

Full contract — filter-arg `ref` pickers, `getQueryMeta` summary counters, `labelOf`, and the `q.exists` /
`q.missing` / `q.empty` split: `get_guideline` with `queryRule`, or `akan guideline show queryRule`.

- **The root slice (`""`, generated by `slice()`) takes `queryKey` and `args`, not a query.** `initX("byOwner",
  [ownerId])` names one of the model's own filters and passes that filter's args; no key at all is the `any`
  filter every model carries. A raw query descriptor could not survive the query string — `String(value)` sends
  `[object Object]`. It is an admin API: `root:` is always `Admin`.
- A slice's `exec` returns a `QueryOf` (an opaque query descriptor); you **cannot** chain `.sort()`/`.limit()` on
  it. Apply ordering/paging via the store `init` fetch option instead: `initX(..., { sort, page, limit })`. For a
  chainable builder use the model facade's `findMany`/`findOne`.
- **Hydrated vs raw:** server queries return hydrated `cnst.<Model>` instances (with `set`/`save`/`refresh`);
  client fetch results are raw `GetStateObject` plain data, functions stripped.
- Every filter generates fourteen methods: `list` · `listIds` · `find` · `findId` · `pick` · `pickId` · `exists` ·
  `count` · `insight` · `query` · **`remove`** · **`removeOne`** · **`update`** · **`updateOne`**. The last four
  are query-level writes — one atomic UPDATE, **no hooks**, and therefore no `_postRemove` and no cascade. Use
  them on a model that carries no removal side effect; otherwise remove documents one at a time.
- **`update<Filter>` / `updateOne<Filter>` are chains, not calls:** `await updateInRoot(rootId).set({ status:
  "archived" })`. The patch cannot trail the filter args, so it lands on a terminal `.set()`; building the chain
  touches nothing.
- `removeOne` / `updateOne` hit the **newest** match, always, and report only counts — they are for "there is at
  most one of these", not for claiming the next item off a queue.
- **A filter may not be keyed after its own model.** A filter `chat` on model `chat` would silently swap the
  single-document `removeChat`/`updateChat` for a hookless query-level one; it throws at boot instead.
- **"Has no value" is `q.empty`, never `q.missing`.** `q.missing` is the key being *absent from the stored JSON*,
  which a document written once and saved again no longer is. Reach for it only to find rows written before the
  field was declared.

### Text Search In A Filter — `q.search()`

Full contract — relevance ordering, `columns` / `weights`: `get_guideline` with `queryRule`.

- Text search is a filter query node like any other: `bySearch: filter().arg("text", String).query((text, q) =>
  q.search(text, { prefix: true }))`. The generated `listBySearch` / `countBySearch` / `queryBySearch` /
  `insightBySearch` come for free — you do **not** need a slice to make search usable.
- **Only add a search slice when the model's data is safe to enumerate.** A filter is server-side; a slice is a
  client-callable endpoint, so on a model whose slice `get:` is `Public` a search slice hands anyone a way to walk
  the table. Leave that decision to the mounting app.
- `q.search()` compiles to a JOIN, not a WHERE fragment, so it **must sit at an AND position**. Nesting it under
  `q.any()` or `q.not()` throws, and it is rejected in `updateOneByQuery` / `updateManyByQuery`.
- Blank or whitespace-only input matches **nothing**. Never "fix" that into a passthrough: a passthrough turns a
  search endpoint into a full listing.
- Order by relevance with the built-in `relevance` sort key. A slice endpoint never reaches the unspecified
  fallback — leaving `sort` off gets `latest`, so a client wanting score order has to name `relevance`.

### Service / Signal Injection

- Injected dependencies resolve by field-name convention: a field named `<refName>Service` resolves to the service registered under `<refName>`, and `<refName>Signal` likewise (`pkgs/akanjs/service/injectInfo.ts`).
- The `Service`/`Signal` suffix is required — the injector strips it to derive the registry lookup key. Name the field after the target refName plus the suffix, not arbitrarily.
- Preference order inside a service: `service<srv.XService>()` for another module's service · `plug(AdapterClass)` or `plug(StorageAdaptorRole)` for an adapter · `use<T>()` only to reach an `option.ts`-registered legacy singleton · `env(...)` for config.

### Adapters — `adapt()` And `plug()`

An injected singleton is an `adapt()` class in `srvkit/`. Write new adapters this way.

```ts
export class AdminNoti extends adapt("adminNoti" as const, ({ use, env, plug, memory }) => ({
  discordApi: use<DiscordApi>(),
  workspaceRoot: env(() => `~/build/${getEnv().environment}`),
  masterHost: plug(MasterHost),
  tokenMap: memory(Map, { of: String }),
})) {}
```

- Inject it with `plug(TheClass)` from a service or from another adapter. Destructure only the injectors you use, and write the registration key `as const`.
- **Do not register an `adapt()` class in `lib/option.ts`.** It self-registers, and `plug(Class)` uses the class itself as the token. `option.ts` is now only for legacy constructor-style adapters and for widening the options type.
- `this.logger` is provided; never construct a `Logger` inside an `adapt()` class. Lifecycle work goes in `override async onInit()`.
- **`adapt()` is for singletons only.** A per-use value object stays a plain class you `new` at the call site. If there is not exactly one per process that a service needs injected, it is a plain class.
- **Legacy shape — recognise it, do not copy it.** Plain classes with `constructor(options: XOptions)`, registered in `lib/option.ts` and injected with `use<T>()`, still work. Migrate one to `adapt()` only when you are already changing it.

Conventions that hold for both shapes:

- Route every remote call through one private `#api<T>(path, init?)` with `signal: AbortSignal.timeout(20_000)`.
- Paginate with `for (let page = 1; ; page += 1)` broken by `if (pageItems.length < 100) break;`.
- Resolve secrets as `process.env.X ?? options.x ?? deterministicGenerator(...)` **inside a function**, never at module scope.
- Extend a function by appending an optional trailing parameter with a default, never by changing arity.
- Parameters: up to three required primitives positional; optional flags in a trailing `{ … } = {}`; four or more parameters, or any two same-typed strings, in one named destructured object.
- Release locks in `finally`. Load heavy optional dependencies through a module-level memoized promise (`puppeteerLoad ??= import("puppeteer")`).

### Error Placement

- State-machine preconditions throw in `document.ts`; cross-document rules throw in `service.ts`; request-level policy belongs in `signal.ts` guards.
- Best-effort code returns a sentinel (`null`, `undefined`, `[0, 0]`, `{}`). There are no Result/Either wrappers.
- `try/catch` is rare and always converts an exception into a decision, never swallows one. Guards catch → `logger.warn` → `return false`; adapters catch → `logger.error` → `return null`; UI uses `try/finally` to reset a spinner. A bodyless `catch {}` is acceptable only with a one-line reason.
- Store actions do not `try/catch` — let the framework toast the `Err`. Client-side validation failure is `msg.error("<key>")` plus an early return, never a throw.

### MCP Exposure

Every signal is served to AI agents as an MCP server on `POST /mcp`. **`/mcp` is mounted by default and exposure
follows an endpoint's guards — there is no per-endpoint opt-in, and nothing to write in a signal file.** An
endpoint that declares a real guard is published; one that declares none is refused, and so is a mutation whose
only guard is `Public`. The guards are already the authorization decision, so a second switch would say nothing
they do not — while guaranteeing that every endpoint added later is invisible to agents until somebody remembers
it.

- **`mcp: false` keeps an endpoint off the shelf without touching its guards.** Guards answer "may an agent call
  this"; they cannot answer "does this belong on a shelf", and a step of a UI-driven state machine
  (`requestPhoneCodeForSignin`) is perfectly guarded and still a mistake for a model to reach. Write it in the
  signal option (`mutation(Boolean, { guards: [Every], mcp: false })`, `init({ guards: [SignedIn], mcp: false })`),
  or as an `mcp` map on `slice()` that **mirrors the `guards` map key for key** (`mcp: { cru: false }`) — root
  slice and generated CRUD only, never a named slice or a custom endpoint. It is an opt-**out**, and it is
  curation, not authorization: HTTP serves the endpoint exactly as before.
- **Narrow by cost, and read the boot log first.** MCP forbids a `$ref` across entries, so every entry inlines the
  full schema of every model it mentions and the listing is re-sent whole to every agent that connects. A plain
  21-field model costs 12.6KB over eight entries; `mcp: { cru: false }` takes it to 4.7KB. `MCP catalogue: … ·
  listing 214KB` plus a per-signal `MCP catalogue cost:` line says where it went.
- Settings live in the app's `lib/option.ts` — `option.setMcp({ enabled, readOnly, path, version, instructions,
  allowedOrigins, pageSize, language, auth })`, **not `main.ts`**. Each field has an `AKAN_MCP_*` env spelling.
  `AKAN_MCP_READONLY=true` is the read-only-deployment valve, not the exposure switch; `AKAN_MCP=false` takes the
  whole surface off.
- **The refusals are fail-closed**: a declared `mcp: false`, an endpoint with no `guards`, a mutation with no real
  guard, `pubsub` and `message`, an `Any` or `Upload` return, a file upload, a required `Any` argument, and the
  generated `light<Model>` read. A `prompt` also refuses a list argument and any `Any` argument. **Every refusal
  is named in the boot log**, along with every published entry missing a dictionary `.desc()` — an agent picks a
  tool by its description.
- A refused endpoint answers the *same* "unknown tool" as one that does not exist, and a guard's refusal is
  generalized. Never make either message more helpful — the difference is what enumerates your private surface.
- **A `field.visual` field is stripped from every MCP result** and from the readable schema so the two agree.
- **A structured result ships twice by default** — as `structuredContent` and as the same JSON in the text block.
  `option.setMcp({ legacyTextBlock: false })` leaves a pointer there instead.
- **`prompt()`** is invoked by the *user* as a slash command, never chosen by the model. `exec` returns
  `PromptMessage[]` built with `Msg.user` / `Msg.assistant` / `Msg.resource` / `Msg.image`; an embedded payload is
  masked by the model you name, and one whose `hidden`/`secret` fields are populated with no model named is
  refused. It is also mounted as a plain HTTP `GET` whether or not MCP is enabled, so guard it like any other read.

Full contract — configuration, wire behaviour, resource URIs, OAuth metadata, protocol revisions, and
`McpProgress.report`: `get_guideline` with `mcpRule`, or `akan guideline show mcpRule`.

## In-Page Agent

Every akan app can host a component-level agent that reads the rendered screen and drives it. **A component
declaration is the surface, exactly**: `st.tool` publishes one action, and `st.use` / `st.sel` / `st.ref` make one
store key readable while the reading component is mounted. Nothing is derived from a store class — a lever the
screen does not offer the user is not one an agent may pull in their place. The React core is the `use-agentic`
package; apps and libs never import it directly (`no-import-external-library`) — everything reaches them through
`st.*` and `akanjs/ui`.

Read the full contract before building an agent surface — the chat's own options, `st.tool` / `st.expose` /
`st.useState` in full, zones and namespaces, attachments and speech, slash commands, transcript compaction, and
the built-in tool semantics: `get_guideline` with `agentRule`, or `akan guideline show agentRule`. What follows is
what every developer must know even when not building one.

- **Mount `<Agent.Chat />` once in a layout.** The endpoint is a stateless relay that **never executes tools**:
  every tool runs in the caller's own browser session, gated by guards and the approval card. Its guard is
  `AgentRelayAccess`, which refuses every call until the app names a guard of its own —
  `option.setAgentAccess(SignedIn)`. **The LLM is configured in `option.ts`, never through the environment**
  (`option.setLlm({ apiKey, model, host })`).
- **Declare the tool beside the control that already does it**, never as a separate surface:
  `st.tool("x").desc("…").arg("id", ID).exec(fn)` returns the callable to hand to `onClick` — one handler for the
  person and the agent. Publish it only where the screen already renders the control; a falsy name declares the
  tool without publishing it, and a `disabled` control publishes nothing.
- **Forms publish themselves**: a `Field.*` / `Input.*` / `Select` / `Switch` handed `onChange={st.do.setXOnY}`
  **by reference** publishes that setter, and `st.use.yForm()` adds `fillYForm(patch)`. An inline arrow publishes
  nothing — normalize with the control's `transform` prop, and multi-write with a `_postSet<Field>` store method.
  This is the same rule `no-unpublished-form-setter.grit` enforces.
- **Reading is per key, not per store.** `st.use.x({ agent: false })` keeps a subscribed key off the surface; a key
  no component reads is unreadable. A value with populated `hidden`/`secret` fields is refused at read.
- **Return what answers the question, not the record.** A tool's value is capped at 20,000 characters before it
  enters the transcript, and once there it rides *every* later turn. A field that is bulky and useless to a model
  is fixed once at the model instead: `field.visual(String)`.
- **Route guidance is `<Agent.Guide instructions="..." />`** rendered from a `_layout.tsx` or page — the render
  tree is the cascade. It is a component, not a `pageConfig` field, and `*.abstract.md` is never served to agents.
- **Model-facing text is English, always** — every `.desc()`, `instructions`, Guide text. The `l()` rule covers
  strings a *user* reads.

## Scalar Modeling (`**/*.constant.ts`)

- Define Akan models in `.constant.ts` files with `via` from `akanjs/constant`.
- Use `Int` for whole-number counts and quantities; use `Float` only for values that need decimals.
- Use `ID` for document references and prefer explicit structured fields over `Any` unless the content is genuinely flexible.
- For date defaults, prefer a function such as `default: () => dayjs()` so the value is created at runtime.
- Follow the established model layering pattern in this order: `Input`, `Object`, `Light<Model>`, full `<Model>`, and `<Model>Insight`. Write all five, and write `<Model>Insight` even when it is empty.
- Put display and predicate logic on the `Light<Model>` class rather than in a util module — see Module File Playbook.
- Defaults are a literal for scalars and a thunk for anything constructed. Arrays are `field([T])`; optional is the postfix `.optional()`.
- **`field.visual(T)` is a field the page renders and an agent never sees** — a blur placeholder, a rendered HTML body, a serialized geometry. It stays an ordinary stored `property` (persistence, search, forms and the page response untouched) and is stripped wherever a value is masked for an AI caller: every in-page-agent read and every MCP result, along with the MCP readable schema. Unlike `hidden`/`secret` it is cost, not secrecy — nothing is refused over one. Reach for it whenever a field is bulky and useless to a model; that is cheaper than every tool learning to avoid it.

### Scalar & Field Type Reference

- **Import from `akanjs/base`** (real classes/helpers, not globals): `Int`, `Float`, `ID`, `Any`, `Binary`, `Upload`, `enumOf`, and the `dayjs` factory. There is **no `JSON` scalar** — use `Any` for open/flexible payloads.
- **Use the JS globals directly (no import needed)**: `String`, `Boolean`, `Date`. They are monkey-patched to behave like scalars, so `field(String)` typechecks.
- **`Number` is not a valid field/body type.** `NumberConstructor` is intentionally not augmented, so `field(Number)` / `.body("x", Number)` fails to typecheck. Use `Int` or `Float` instead.
- Runtime resolution of every scalar (globals included) goes through `PrimitiveRegistry` by `refName` (`pkgs/akanjs/base/primitiveRegistry.ts`).
- **`Binary` is raw bytes on the wire, and never a model field.** It is `Uint8Array` on both sides — a Node
  `Buffer` is one, so a server handler may pass one straight in — and it accepts base64 in either direction, so
  the same declaration serves a JSON body and a binary frame. It is **not storable**: the class build refuses
  `field(Binary)` naming the `File` model instead, because every non-base field lives in the `_doc` JSON column
  and bytes would sit there as base64 and ride every read of the row. Never send bytes as `Any` — `Any` passes a
  `Buffer` through untouched and `JSON.stringify` then spells it `{ type: "Buffer", data: number[] }`, which
  `JSON.parse` never restores; the result is 3.6x the wire and a shape that only breaks at the first byte-offset
  read. MCP refuses a `Binary` return for the same reason it refuses `Any`.

### Text Search Fields — the `text` role

Full contract — the trigger-maintained mirror, tokenizer changes, `AKAN_SEARCH_ENABLED`: `get_guideline` with
`queryRule`.

- A field joins the full-text index by declaring one of five roles: `field(String, { text: "title" })`, and
  likewise `"desc"`, `"tag"`, `"thumb"`, `"filter"`. Nothing else opts a field in, and there is no per-model
  switch. Declaring roles is all the wiring there is.
- Pick the role by what the value *is*, because `bm25` weights them positionally (`title` 10, `tag` 3, `desc` 1,
  `filter` 0): `title` is the one line a human scans for, `desc` is prose, `tag` is a keyword list, `filter` is a
  scoping value (status, owner, role) that must be matchable but must never outrank a real title hit. `thumb` is
  mirrored for rendering a hit and is **not** indexed — never expect it to match.
- **`field.secret`, `field.hidden` and `resolve()` take no `text` role — it is a compile error**, because the
  mirror is plaintext and an indexed secret would leak through search. The same refusal throws at runtime as a
  backstop, including for a `text` field *underneath* one of those. Do not work around either.
- The role works on a relation (`image: field(File, { text: "thumb" })`) and on an array; an array of objects
  indexes by leaf key. A field inside a `Map` indexes nothing — there is no fixed path to extract it from.
- Search runs on sqlite/libsql only. `q.search()` against Postgres throws, loudly, rather than returning every row.

### Image & File Fields

- **Do not declare `Upload` as a model field.** `Upload` is a signal-body-only primitive (see Service And Signal Conventions). Models reference the `File` model instead.
- Declare an image/file field as a relation to `File`: `image: field(File).optional()` for one, `images: field([File])` for many.
- The store then auto-generates an `upload<Field>On<Model>(fileList)` action that calls the framework upload mutation and polls file status until it leaves `"uploading"` (`pkgs/akanjs/store/action.ts`).
- Storage is wired through the `StorageAdaptor` DI role (default `BlobStorage`, `pkgs/akanjs/service/predefinedAdaptor/storage.adaptor.ts`); the reference implementation is the `file` module. Do not hand-roll data-URL fallbacks.

### Cascade Remove — the `cascade` option

Full contract — bulk planning, the auto-created index, cycle cutting, boot-time validation: `get_guideline` with
`queryRule`.

**The value names the direction, and getting it wrong is a data loss.** The two actions can sit on the same field
shape, so `cascade` never means "related" — it means one of exactly these:

- `removeRef` — *when I am removed, remove what this field points at.* Declared on the relation the owner holds:
  `image: field(File, { cascade: "removeRef" })`, arrays included. Only a relation accepts it.
- `removeWith` — *when what this field points at is removed, remove me.* Declared on the child's own reference to
  its owner, so the owner never learns about its children and a lib model can be extended by an app's. Three
  forms: a relation, an id with `ref`, or a polymorphic id with `refPath`. An array, a Map, `ref` together with
  `refPath`, and a field naming no owner each fail the class build.
- **A `refPath` must name an `enumOf` field** — a free-form owner type is unknowable at build time.
- **A cascade goes through the target's service, never its model** — that path is what runs the target's
  `_postRemove`, where a module puts the side effect the removal has to carry.
- **Nothing checks whether another document still references the same target.** `File` in particular is deduped by
  `origin`, so two parents can share one row; `removeRef` claims the field owns its target exclusively.
- Removal is soft (`removedAt`), but the storage delete a `_postRemove` performs is not — a cascade is not
  restorable, and reviving the owner does not revive what went with it.
- **Query-level removes fire no hooks and therefore no cascade** — `removeManyByQuery` / `updateManyByQuery`, the
  generated `remove<Filter>` / `update<Filter>`, and the facade's `removeById` / `updateById`. Remove one document
  at a time when it cascades.

## Akan Page Routing (`apps/**/page/**`)

- `apps/<app>/page` may contain route modules only. Do not add helper logic or component-only files there.
- Route source files under `page/` must use `.tsx`. Do not add `logic.ts`, `.js`, or `.jsx` files under `page/`.
- A route page is either `<routeName>.tsx` (serving `/routeName`) or a directory's `_index.tsx`; layouts use `_layout.tsx`; per-route UI overrides use `_overrides.tsx`.
- Reserved `_*.tsx` route filenames are limited to `_index.tsx`, `_layout.tsx`, and `_overrides.tsx`; do not add files like `_Component.tsx` or `_helper.tsx`.
- Page filenames must not start with an uppercase letter. Move helper components like `Component.tsx` to app `ui`, `common`, or `lib` instead.
- Dynamic segments use `[id]`; route groups use directories like `(user)`, `(public)`, `(tab)`, or `(detail)`.
- Page modules should usually export `default`, `pageConfig`, `head`, `generateHead`, or `Loading`.
- `_overrides.tsx` is a logic-free UI-override manifest: imports plus a single `export default override({ Slot: AppComponent })` (from `akanjs/ui`), no `"use client"`. It re-skins framework `akanjs/ui` components for its route subtree; nested manifests merge over ancestors slot-by-slot (closest wins). See the UI Customization reference for the slot list.
- Prefer `export default function Page` or `export default async function Page` for page components.
- `libs/<lib>/page` follows the same rules and ships routes to apps that opt in with `syncPageLibs` in `akan.config.ts`: `true` takes every lib dep that has a `page` folder, an array takes the libs listed, `false` (the default) syncs nothing.
- `akan sync` links those routes into `apps/<app>/page/(libs)/(<lib>)` — once per basePath when the app declares subRoutes. The folder is generated and gitignored; edit the lib source, never the link.
- Both path segments are route groups, so a lib route mounts at its own path (`libs/<lib>/page/login/_index.tsx` serves `/login`). Two synced routes that resolve to the same pattern are a sync-time error.
- `export const pageConfig = { devOnly: true }` keeps a route out of `akan build` while it keeps serving under `akan start` and keeps being typechecked. On a `_layout.tsx` it excludes every route under that directory too. Write it as a literal `true`/`false` — the build reads it off the source without evaluating the module.
- Before changing route behavior, check `pkgs/akanjs/server/routeTreeBuilder.ts` and nearby routes for the expected pattern.

### Page Body Shape

```tsx
interface PageProps {
  params: { orgId: string };
}

export default async function Page({ params }: PageProps) {
  const { l } = usePage();
  getSelf({ unauthorize: "/signin" });
  const { orgId } = params;
  const [{ org }, { taskInitInOrg }] = await Promise.all([fetch.viewOrg(orgId), fetch.initTaskInOrg(orgId)]);
  return <Task.Zone.Card init={taskInitInOrg} prefix={`/org/${orgId}`} />;
}

export const pageConfig = { transition: "stack" } satisfies PageConfig;
```

- There is no `loader=` / `render=` page prop. Pages are `export default async function Page`.
- Declare `interface PageProps { params: {...}; searchParams?: {...} }` immediately above the default export.
- Body order: `usePage()`, auth, destructure params, fetch, return.
- Run independent fetches through `Promise.all`, even when there is only one.
- Gate auth at `_layout.tsx`; repeating `getSelf({ unauthorize: "/signin" })` in the page is fine and common.
- Keep `async` even when nothing is awaited — it marks a real server page.
- No `useState`, no `useEffect`, and no comments in page files.

## Akan Sync Conventions (`apps/**`, `libs/**`)

- `apps/<appName>` root may only contain these files: `AGENTS.md`, `CLAUDE.md`, `akan.app.json`, `akan.config.ts`, `capacitor.config.ts`, `client.ts`, `main.ts`, `package.json`, `server.ts`, `tsconfig.json`, `tsconfig.tsbuildinfo`.
- `apps/<appName>` root may only contain these folders: `.akan`, `android`, `common`, `env`, `ios`, `lib`, `mobile`, `page`, `plugin`, `private`, `public`, `script`, `secrets`, `srvkit`, `ui`, `webkit`.
- `libs/<libName>` root may only contain these files: `AGENTS.md`, `CLAUDE.md`, `README.md`, `akan.config.ts`, `akan.lib.json`, `client.ts`, `index.ts`, `package.json`, `server.ts`, `tsconfig.json`, `tsconfig.spec.json`, `tsconfig.tsbuildinfo`.
- `libs/<libName>` root may only contain these folders: `common`, `env`, `lib`, `page`, `plugin`, `private`, `public`, `srvkit`, `ui`, `webkit`. A library is never booted or packaged as an app, so the run and mobile entries an app carries (`main.ts`, `capacitor.config.ts`, `.akan`, `android`, `ios`, `mobile`, `script`, `secrets`) are rejected there.
- Both allowlists have one source — `pkgs/@akanjs/devkit/workspaceLayout.ts`. `akan sync` (error), `akan doctor`
  (diagnostic), and `akan quality scan` (warning) all read it, so add a new root entry there and mirror it into this
  list, never into one of the three call sites.
- `akan sync` maintains a scoped agent guide per app/lib: `apps/<app>/AGENTS.md` / `libs/<lib>/AGENTS.md`. The
  section between the `akan:agent` markers (the `## Recipes In Scope` index) is generated — do not hand-edit it;
  content outside the markers is yours. `akan lint` fails when the generated section is stale.
- The `plugin/` facet holds Akan plugin declarations; files use the `<name>.plugin.ts` convention (e.g. `pushNotification.plugin.ts`) and are re-exported from the generated `plugin/index.ts` barrel.
- Do not add `apps/*/base` or `libs/*/base`; place shared utilities under that app or lib's own `common/`.
- `apps/*/lib` and `libs/*/lib` root files are limited to generated/support files: `cnst.ts`, `db.ts`, `dict.ts`, `option.ts`, `sig.ts`, `srv.ts`, `st.ts`, `useClient.ts`, `useServer.ts` — plus a `<model>.signal.test.ts` / `.spec.ts`, the one hand-written file that belongs there because the suite boots the whole barrel.
- Domain module folders are `lib/<model>` for database modules, `lib/_<service>` for service modules, and `lib/__scalar/<scalar>` for scalar modules.
- Database module UI files are limited to `<Model>.Template.tsx`, `<Model>.Unit.tsx`, `<Model>.Util.tsx`, `<Model>.View.tsx`, and `<Model>.Zone.tsx`.
- Service module UI files are limited to `<Service>.Util.tsx` and `<Service>.Zone.tsx`.
- Scalar module UI files are limited to `<Scalar>.Template.tsx` and `<Scalar>.Unit.tsx`.
- Module `*.test.ts`, `*.test.tsx`, `*.spec.ts`, and `*.spec.tsx` files are allowed.
- `ui/index.ts`, `webkit/index.ts`, `srvkit/index.ts`, `common/index.ts`, `plugin/index.ts`, and module `lib/**/index.ts` files are generated by scanSync; do not hand-edit or track them.
- Generated facet indexes export only 1-depth files/folders with `export * from "./name";`.
- `libs/<libName>` may hold a `page` folder of route modules; scanSync links it into every app that opts in with `syncPageLibs`, so `apps/*/page/**/(libs)` is generated and gitignored like `public/libs`.

## Layer Placement (`common/`, `webkit/`, `srvkit/`, `ui/`)

| Folder | Admission test | Naming |
|---|---|---|
| `common/` | pure, isomorphic, zero-dependency; may import only sibling `common/*` and `akanjs/base`. Cannot import `Err`, so keep throwing code out of it. | camelCase file, filename equals the single export |
| `webkit/` | touches `window` / `navigator` / Capacitor, or is a React hook | `use<Thing>.tsx` — `.tsx` even with no JSX |
| `srvkit/` | touches `node:*`, `Bun`, `process.env`, a secret, or a server SDK | camelCase file, PascalCase class |
| `ui/` | renders JSX and is not bound to one model | PascalCase component, camelCase sidecar (`swipeCard.util.ts`) |
| `plugin/` | build- or CLI-time `AkanPlugin` | `<name>.plugin.ts`, registered in `akan.config.ts` |

- Hooks return a named object of async closures, never a tuple.
- `libs/<lib>/ui/tokens.css` is the one CSS file a lib owns: plain `:root` custom properties for colors that must **not** follow the theme (a vendor brand color, a fixed surface). Every app whose pages reach that lib compiles it automatically, ahead of the app's own stylesheets, so nothing is imported by hand and no app can forget it. Reference them as `bg-[var(--kakao)]`; `@theme` extensions stay in the app stylesheet, because the color vocabulary is closed per stylesheet. Theme-following colors are the app's, not the lib's.
- A layer-root `index.ts` is generated, but a `ui/<Folder>/index.tsx` that builds a namespace is hand-written source. The distinguishing test is that a generated barrel contains nothing but `export * from "./X";` lines.
- `ui/<Folder>/index_.tsx` (trailing underscore) is the `"use client"` + `lazy()` boundary, with a server-safe `index.tsx` beside it. Collapsing the pair into one file breaks RSC.

## Present In The Code — Do Not Imitate

Older files contain these. They are warts, not conventions: do not copy them forward, and prefer the newer neighbour
when two shapes disagree.

- `children: any` — newer files use `children: ReactNode`.
- Hard-coded API keys or secrets in source; they belong in `option.ts` or env.
- Large blocks of commented-out code left in place.
- Cross-store writes through a `RootStore` cast — it collides with the Bun SSR-bundler segfault.
- Stale `// TODO: Implement …` comments above implemented methods.
- `{cond && <X/>}` in JSX, hard-coded Korean bypassing `l()`, and `window.alert(...)` for user feedback.
- Bare `/* eslint-disable */` blocks — use `// biome-ignore lint/<rule>: <why>`.
- Raw palette grays such as `text-gray-400` instead of the semantic tokens (`text-foreground/70`).

## Secrets And Env Safety (`.env`, `infra/**`, `*secret*`, `*credential*`)

- Never print, summarize, commit, or expose real secret values, credentials, tokens, private keys, or `.env` contents.
- If env keys are needed for documentation, list only key names and example placeholders, not live values.
- Preserve the existing env/secret flow through root scripts such as `bun run downloadEnv`, `bun run uploadEnv`, `bun run downloadSecret`, and `bun run uploadSecret`.
- When editing infra env or secret scripts, keep Jenkins and deployment assumptions intact unless the task explicitly asks to change them.
- Treat generated env/secret artifacts as sensitive even when they are not named `.env`.

## Application Test Commands

- After changing application source code, test the app with `bun run akan start <appName>`.
- Test production build generation with `bun run akan build <appName>`.
- To test a built artifact locally, run it from the generated app directory with the required Akan runtime environment variables.

```bash
cd dist/apps/<appName> && USE_AKANJS_PKGS=true AKAN_PUBLIC_REPO_NAME=<repo> AKAN_PUBLIC_SERVE_DOMAIN="<domain>" \
  AKAN_PUBLIC_APP_NAME=<appName> AKAN_PUBLIC_ENV=local AKAN_PUBLIC_OPERATION_MODE=local SERVER_MODE=federation \
  AKAN_PUBLIC_BASE_PATHS=<basePaths> bun main.js
```

## Akan Module Abstracts

- Before changing a domain, service, or scalar module, read its `*.abstract.md` file first.
- Update the abstract when business invariants, workflows, or public behavior change.
- Do not update the abstract for formatting-only, import-only, or style-only changes.
- Service modules live in `lib/_<service>`, but their abstract file is `<service>.abstract.md`.
- Keep an abstract short. Run `akan compact <app-or-lib>` to rewrite bloated abstracts down to the invariants the code cannot show; `akan quality scan` warns past 300 lines.

## Generated Files

Do not hand-edit generated Akan files such as `apps/*/client.ts`, `apps/*/server.ts`, `*/lib/cnst.ts`, `*/lib/db.ts`, `*/lib/dict.ts`, `*/lib/sig.ts`, `*/lib/srv.ts`, `*/lib/st.ts`, `*/lib/useClient.ts`, `*/lib/useServer.ts`, `*/lib/**/index.ts`, `*/ui/index.ts`, `*/webkit/index.ts`, `*/srvkit/index.ts`, `*/common/index.ts`.
If generated output is stale or broken, update the owning source file and run `akan repair generated` or `akan sync <app-or-lib>`.

## Recipes

Framework UI recipes (Tailwind-variant look factories), importable from every app and lib: `import { <name> } from
"akanjs/ui"`, then `<name>(variants?, className?)`. The second arg merges internally and takes **an array too**, so
never wrap it in `cn()`: `<name>({}, ["h-full", isWide && "w-full", className])`. The list below is the full
contract (`*` marks the default, `key?` is a boolean flag) — do not guess a name, path, or variant value, and do
not open the recipe file to consume one. **Before inlining a repeated surface (card, box, tile, …): reuse a recipe,
or add one as `apps/<app>/ui/Recipe/<name>.ts`, one per file, re-exported from that folder's `index.ts` — never
re-implement the same look inline in several places, and never author a near-duplicate.** Full policy: the
`recipeRule` guideline.

Import from `akanjs/ui`:
- `badgeRecipe`(variant: default*|primary|secondary|accent|neutral|success|warning|info|error|outline · size: xs|sm|md*|lg · outline?) — 뱃지 look — 시맨틱 variant × size, outline 플래그는 색을 유지한 외곽선 스타일. `<Badge>` 가 소비하며, recipes.badge 슬롯으로 교체 가능.
- `buttonRecipe`(variant: default|primary*|secondary|accent|neutral|outline|ghost|destructive|success|warning|info|link · size: xs|sm|md*|lg|icon · shape: default*|square|circle · outline?) — 버튼 look — 시맨틱 variant × size × shape, outline 플래그는 색을 유지한 외곽선 스타일. `<Button>` 이 소비하며, `_overrides.tsx` 의 recipes.button 슬롯으로 교체 가능.
- `inputRecipe`(kind: field*|area · size: xs|sm|md*|lg|xl · tone: default*|primary|error) — 입력 표면 look — Input/TextArea/Select 가 공유하는 필드 셸. kind 로 한 줄 필드(field)/멀티라인(area), tone 으로 강조/오류 상태를 고른다.

App and lib recipes are **not** listed here. Each app/lib carries its own generated index —
`apps/<app>/AGENTS.md` / `libs/<lib>/AGENTS.md` (`## Recipes In Scope`) — regenerated by `akan sync` and
verified by `akan lint`. When working inside an app or lib, consult that file before consuming or authoring a look.

## MCP Workflow Policy

- **Prefer an Akan workflow to a direct source edit.** A direct edit is denied when an allowlisted workflow or repair tool can make the change.
- Inspect with `akan mcp --mode plan` (`list_workflows`, `explain_workflow`, `plan_workflow`); apply with `akan mcp --mode apply`, which allowlists `apply_workflow`, `run_validation`, and the repair tools.
- If `plan_workflow` returns `planPath` or `next.tool=apply_workflow`, call `apply_workflow({ planPath })` before editing source. Then run `run_validation` with `validationTarget` when present, otherwise `applyReportPath`.
- Split a compound request into workflows and apply each `planPath` in order, such as `create-module` followed by `add-field`.
- When no workflow exists, or apply reports unsupported/no-op/failed diagnostics needing manual action, keep edits scoped to owning source files and never patch generated files directly.
- **MCP not connected?** The CLI is a first-class equivalent — `akan workflow list` / `explain` / `plan` / `apply`, `akan doctor`, `akan repair`. See the onboarding guide's CLI-only fallback for the exact flags.

## Validation

- `akan sync <app-or-lib>`
- `akan lint <app-or-lib-or-pkg>`
- `akan typecheck <app-name>`
- `akan test <app-or-lib-or-pkg>`
- `akan build <app-name>`
- `akan doctor --strict --format json`
- `akan quality scan [--format json]`
- `akan quality ssr [--format json]`

## Framework Guide

# Akan.js Framework Guide

## Ownership
- `apps/<app>` contains app code, pages, env files, module folders, UI, webkit, srvkit, and common utilities.
- `libs/<lib>` contains reusable domain and utility libraries consumed by apps.
- `pkgs/akanjs` contains framework facets such as base, constant, document, service, signal, store, client, ui, and CLI tooling.
- Domain behavior lives near the model folder instead of being split by technical layer first.

## Current Akan Patterns
- Database module flow is `constant -> dictionary -> document -> service -> signal -> store -> UI`.
- Scalars live under `lib/__scalar/<scalarName>` and represent embedded value objects.
- Service modules live under `lib/_<serviceName>` when behavior is not centered on one stored model.
- Generated registry files such as `cnst.ts`, `db.ts`, `dict.ts`, `sig.ts`, `srv.ts`, and `st.ts` are scanner outputs and should not be hand-authored.
- Pages and components should consume generated client/server helpers rather than duplicating model shapes.

## Codegen Rules
- Prefer the most specific guideline for file syntax; use this guide only for global architecture context.
- When generating a new feature, start with the smallest necessary layer set and add later layers only when required by behavior.
- Keep business decisions in constant, document, or service; keep API exposure in signal; keep client coordination in store; keep rendering in UI files.
- Use direct module imports where scanner rules expect them, and avoid inventing new top-level app folders.

## Theming And UI Customization
When a request implies a distinct look and feel, do not stop at colors — customize both the theme and, when needed, the components.

- **Theme (`apps/<app>/page/styles.css`).** The app imports Tailwind and `akanjs/ui/styles.css`, then overrides semantic token *values* per theme under `:root, [data-theme="dark"]` and `[data-theme="light"]` (`--background`, `--foreground`, `--primary`, `--muted`, `--border`, … each with a `-foreground` pair for text). The framework maps them to Tailwind color names, so `bg-primary` / `text-foreground` follow the `data-theme` attribute; corner rounding uses `--radius-box` / `--radius-field`. Fetch `get_guideline` with `cssRule` for the full token set before a deep theme pass.
- **Lib tokens (`libs/<lib>/ui/tokens.css`).** Colors a lib's own components pin — a vendor brand color, a fixed surface — are declared once there as plain `:root` custom properties and compiled into every app that reaches the lib, ahead of the app's stylesheets. Reference them as `bg-[var(--kakao)]`; never copy the block into each app.
- **Components (`page/**/_overrides.tsx`).** When a default `akanjs/ui` component (Button, Modal, Table, Input, Select, …) is too restrictive for the design, re-skin it per route instead of forking, wrapping, or fighting it with utility classes. Write a drop-in replacement in `apps/<app>/ui/` typed against the slot contract (`AkanModalComponent`, or `AkanUiOverrides["<Slot>"]`), composing the framework's headless parts, then bind it in a `page/**/_overrides.tsx` manifest with a single `export default override({ Slot: BrandComponent })`. Overrides cascade down the route tree like layouts (closest ancestor wins). Fetch `get_guideline` with `componentRule` and read the `references/ui/customize` docs page for the slot list and patterns.

## Before You Finish

1. `bun run akan lint <appName>` — Tailwind class order, `Err`, `console`, `#private` scope, unused imports.
2. `bun run akan typecheck <appName>` — server/client boundary violations.
3. `bun run akan sync <appName>` if you added, renamed, or deleted any file.
4. Did you write or change a `.tsx` file? `bun run akan quality ssr` — did the server share hold, and did you add
   a `"use client"` you cannot justify?
5. Re-read the file you wrote against its section above.
6. Did you add a comment? Delete it unless it documents an external constraint or a security decision.
7. Did behavior or an invariant change? Update the module's `*.abstract.md`.
<!-- akan:agent:end -->
