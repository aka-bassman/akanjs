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

## Lint-Enforced Rules (These Break The Build)

Enforced by `biome.json` and the grit plugins in `pkgs/@akanjs/devkit/lint/`. Several of them produce output
that looks wrong; do not "fix" it back.

- **Never hand-order Tailwind classes.** `nursery/useSortedClasses` is an error and also sorts the string
  arguments to `cn()`. Sorter output such as `font-bold text-2xl text-foreground` or
  `border-foreground/5 border-t` is correct. Write the classes in any order, run the formatter, leave the result.
- **Stay inside the color vocabulary.** Vocabulary closure strips the raw Tailwind palette, so these render as
  no CSS and fail lint (`no-raw-palette-class.grit`, `no-arbitrary-color.grit`, `no-daisyui-legacy-class.grit`,
  `no-inline-color.grit`): raw palette classes (`bg-blue-500`), arbitrary color values (`bg-[#3b82f6]`), daisyUI
  legacy classes (`btn-primary`, `card-body`), and color literals in `style={{...}}`. Use semantic tokens
  (`bg-primary`, `text-foreground/70`). A legitimate fixed color (OS-chrome mockups, data-viz) takes a
  `// biome-ignore lint/plugin: <reason>` with the reason spelled out. `apps/akan/page/v1/**` is excluded.
- **Never `throw new Error`.** Throw `new Err("<module>.error.<key>")` and register the key as `[en, ko]` in that
  module's dictionary `.error({})`. Import `Err` from `"../dict"` on the server and from `"@libs/<lib>/client"` or
  `"@apps/<app>/client"` in UI. `no-throw-raw-error.grit` exempts `*.test.ts`, `*.spec.ts`, `*.constant.ts`,
  `common/**`, and `apps/akan/env/**` — `common/` and `env/` have no legal `Err` import path, so keep throwing code
  out of them.
- **Never import a third-party package** from `page/**`, from any barrel, or from any
  `*.{constant,dictionary,document,service,signal,store}.ts` / `*.{Template,Unit,Util,View,Zone}.tsx`
  (`no-import-external-library.grit`). Re-export the symbol through a lib first. One-line re-export shims such as
  `libs/<lib>/base/<pkg>.ts` and `libs/<lib>/webkit/<hook>.ts` exist for exactly this reason — they are
  load-bearing, not cruft. Do not delete them.
- **`#private` is banned in exactly four file suffixes:** `*.constant.ts`, `*.document.ts`, `*.service.ts`, and
  `*.store.ts` (`no-js-private-class-method.grit`). The rule is scoped by file path, not by class shape, so
  `#private` remains the house style everywhere under `srvkit/`, including `adapt()` adapter classes.
- **No `console.log` / `console.debug`.** Only `assert`, `error`, `info`, and `warn` are allowed. Server code uses
  the injected `this.logger.*` or `new Logger("ClassName")`.
- **Never write a `//!` marker in browser-reachable code** — `ui/`, `webkit/`, `common/`, `page/**/*.tsx`,
  `*.constant.ts`, `*.store.ts`, and the five module component suffixes (`no-bang-comment-in-client.grit`). Bun
  classifies `//!` and `/*!` as legal comments and keeps them through minification, so the note ships to every
  visitor. Use `// FIXME:` there; `//!` stays legal in server, `srvkit/`, and CLI files.
- **Never return a value from a store action** (`no-return-in-store-action.grit`). Every method of a `store(...)`
  class dispatches through `st.do.<action>()`, which is typed `void` / `Promise<void>`, so the value is
  unreachable — write it into state with `this.set({ ... })`. A bare `return;` guard, a `return` inside a nested
  callback, a getter, and a `static` helper are all still fine.
- **Never redeclare a generated CRUD endpoint name** in `*.signal.ts` (`no-redeclare-predefined-endpoint.grit`).
- **Never type a `*.Util.tsx` / `*.Zone.tsx` prop as a `cnst` model** (`no-model-type-in-util-zone.grit`). Those two
  roles are always client components, so a `cnst.Banner` / `cnst.LightBanner` prop is a class instance the server has
  to hand across the boundary; take `bannerId: string` and read the model from the store instead. Three shapes are
  exempt because none of them is an instance: `cnst.<Enum>["value"]`, whose indexed access resolves to a string
  union; a `ClientInit` / `ClientView` / `ClientEdit` type argument, which the framework maps to `GetStateObject<…>`
  plain data; and a `ModelsProps<cnst.Setting>` type argument, whose only use of the model is the `onClickItem`
  callback, so nothing model-shaped ever lands on a prop. `ModelProps<"setting", cnst.LightSetting>` is *not* exempt
  — that one spreads the model onto the props themselves, and `Unit` / `View`, which take it, are server components
  this rule does not cover. Any *other* indexed access is still flagged — `cnst.Banner["image"]` is a `File`.
  **Only prop positions are read** — a `*Props` interface or type alias, and the inline object type on the
  component's own parameter. A `cnst` type that never leaves the file is not a boundary crossing and stays legal: a
  local annotation, a callback parameter the framework itself types with the model
  (`renderItem={(ticket: cnst.LightTicket) => …}`), a module-scope helper, a non-`Props` local shape, and the props
  of a component nested inside another one. A function-typed prop (`onPick?: (t: cnst.LightTicket) => void`) is
  exempt for the same reason — a closure cannot cross the RSC boundary at all, so whoever passes it is a client
  component already holding the value.
- **Never wrap a form setter in a pass-through arrow** (`no-unpublished-form-setter.grit`).
  `onChange={(type) => st.do.setTypeOnTicket(type)}` runs identically to `onChange={st.do.setTypeOnTicket}` —
  generated field setters take exactly one value — but the arrow is a fresh anonymous closure, so the control
  emits no `data-akan-action` and publishes no agent tool for the field. The failure is silent and the two lines
  read the same, which is why it is a lint error. A wrapper that transforms the value
  (`st.do.setNameOnX(toCamelCase(name))`), adds a statement, or writes a nested path with `writeOnX` is doing
  something a reference cannot and stays legal — publish that one with an explicit `st.tool`. Scoped to
  `{apps,libs}/**/*.tsx`; a typed parameter is not matched, so it under-reports rather than misfiring.
- **No deep imports past a barrel** (`no-deep-internal-import.grit`). Cross-module constant references such as
  `../map/map.constant` are the sanctioned exception.
- **Never import across the client/server boundary.** Client files (`ui/`, `webkit/`, `page/`, `*.store.ts`, every
  `.tsx`) may not import a `*.document.ts` / `*.dictionary.ts` / `*.service.ts` / `*.signal.ts`, `srvkit/`, a
  package `server` entrypoint, or the `db` / `srv` / `sig` / `dict` / `option` / `useServer` barrels
  (`no-import-server-in-client.grit`). Server files (those four suffixes plus `srvkit/`) may not import a
  `*.store.ts`, a module component, `ui/`, `webkit/`, a package `client` entrypoint, or the `st` / `store` /
  `useClient` barrels (`no-import-client-in-server.grit`). Shared files — `common/` and `*.constant.ts` — are held
  to **both**, so they reach neither side. `import type` is erased before bundling and stays legal in every
  direction; a mixed value-and-type import is not exempt. Scoped to `apps/**` and `libs/**`: `pkgs/akanjs/**`
  implements the boundary and is where the two graphs legitimately meet.
- **Server-component discipline** is enforced on `page/**`, `*.Unit.tsx`, and `*.View.tsx`
  (`no-import-client-functions.grit`, `no-use-client-in-server.grit`, `non-scalar-props-restricted.grit`).
- `noArrayIndexKey` and `useExhaustiveDependencies` are **off** on purpose: `key={idx}` for embedded scalars and
  short dependency arrays are intentional, not oversights.
- **A grit plugin diagnostic is suppressed as `lint/plugin`, not `plugin`** — `// biome-ignore lint/plugin: <reason>`
  for one line, `// biome-ignore-all lint/plugin: <reason>` for a file. The bare `// biome-ignore plugin:` form Biome's
  own category name suggests does nothing. Suppress a plugin only where the rule is genuinely wrong for the file, and
  say why: the module-convention plugins (`no-import-external-library`, `no-deep-internal-import`, the store/signal
  ones) apply to `apps/**` and `libs/**` only, so a plain package under `pkgs/` never needs the escape hatch.
- **`biome.json` is strict JSON — a comment in it breaks config resolution.** Biome 2.5.8 does not report the parse
  error; it falls back to discovery and aborts on whatever nested config the walk finds, typically inside a directory
  `files.includes` excludes. Rename the file to `biome.jsonc` to document a disabled rule; `akan lint` pins the config
  path either way, so it reports the parse error on the offending line.
- **`akan lint` prints up to 200 diagnostics** (`--maxDiagnostics <n>`, `0` for no limit). Biome's own default is 20
  with no count, which reads as progress when the mix of findings merely changed.

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
- `lib/user/user.signal.spec.ts` is the one place agent types are re-exported and re-typed; import `UserAgent` / `AdminAgent` from there rather than from the shared lib directly.
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
- Respect existing client/server entrypoints such as `@libs/shared/client`, `@libs/shared/server`, `@apps/akasys/client`, and `@apps/akasys/server`.
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

**① Wrap the interaction, not the UI.** The smallest useful client component is a shell that adds one behaviour and
renders `children` untouched. The children stay server components, so the markup inside them never reaches the
bundle. `libs/shared/ui/Only/User.tsx` is the shape: it reads auth state on the client and returns `{children}`.

```tsx
"use client";
export const ClickWrapper = ({ children, onPick }: ClickWrapperProps) => (
  <div onClick={onPick}>{children}</div>
);
```

**② Split compound components so panels stay on the server.** A tab, accordion, or disclosure needs client state
only for *which* part is visible — never for what the parts contain. Split into a context provider plus menu and
panel pieces, and take panel content as `children`. `Tab` / `Tab.Menus` / `Tab.Menu` / `Tab.Panel` in `akanjs/ui`
is exactly this: only the provider and the menu hold state, and `<Tab.Panel>` renders its children as-is, so a
server `Unit`/`View` passed in stays server-rendered. Never reach for one `"use client"` file with a mode
`useState` and every panel body inlined.

**③ Sync state instead of fetching it.** A server component cannot hold state, so render the initial data on the
server and hand it across the boundary as a serializable object. That is what `init` / `view` props are: the route
calls `fetch.initXInY(...)` / `fetch.viewX(...)`, passes the result into a `Zone`, and `Load.Units` / `Load.View`
hydrate the store from it. Never replace that with a `useEffect(…, [])` that fetches on mount — it renders an empty
shell, hydrates, then round-trips for data the server already had.

**④ Push the boundary down to the leaf that needs it.** When a `Zone` reads the store, it should hold *zero*
markup and delegate to a server `View`. `User.Zone.Self` is one line — `st.use.self()` into
`<User.View.General user={self} />` — so the whole detail surface renders server-side wherever a route uses the
`View` directly.

**⑤ Hand the promise across, not the awaited value.** `ClientInit` / `ClientView` are `PromiseOrObject<T>`, so a
route may pass an unawaited `fetch.initX(...)`; `Load.*` renders a skeleton and resolves it. `await` in the route
blocks the shell for data the page needs immediately; passing the promise streams the rest. Independent fetches
still go through one `Promise.all`.

**⑥ Use named `ReactNode` slots, not just `children`.** A client shell can take several server-rendered subtrees:
`Layout.Navbar` accepts `title`, `back`, `left`, `right`, and `children`, so a client navbar composes server
content in five places instead of absorbing it.

**⑦ Let the server do the derived work.** Display and predicate logic belongs on `Light<Model>` (`isNew()`,
`canWrite(user?)`, `formatTimes()`), and enum→class lookups belong in a module-scope `as const` map. Both sides
call the same method, so the server can render the result — a client component that exists only to compute a label
is markup in the wrong place.

**⑧ Gate auth on the server.** `getSelf({ unauthorize: "/signin" })` in `_layout.tsx` redirects before any HTML is
sent. A client-side auth check costs a hydration round-trip and flashes the wrong UI first.

**⑨ Prefer CSS over client state for pure visibility.** Toggling with a `data-*` attribute plus `group-data-[…]`
variants (see `libs/util/ui/Grid/*`) or with `<details>`/`<summary>` keeps both branches server-rendered. Reach for
`useState` when the state is real, not when a variant would do.

**⑩ Keep the heavy island out of the first load.** A large client-only widget goes behind the
`ui/<Folder>/index_.tsx` + `lazy()` pair so the server renders the page around it. `usePage()` and `l()` work in
server components, so translation never forces a boundary.

Full version with code, the `Tab` composition example, and a review checklist: `get_guideline` with `ssrRule`, or
`akan guideline show ssrRule`.

## React Components And Styling (`**/*.tsx`)

- Components are `export const X = ({ … }: XProps) => { return (…); };` — arrow const with a block body. `export default` is reserved for pages, layouts, and `lazy()` targets.
- Never `React.FC`, never `defaultProps`, never `PropsWithChildren`. Defaults go in the destructuring (`prefix = ""`); children are typed `children: ReactNode`.
- `"use client"` on line 1 above the imports is mechanical by file role: every `.Zone.tsx`, `.Template.tsx`, and `.Util.tsx` has it; no `.Unit.tsx` or `.View.tsx` ever does. `usePage()` is legal in server files.
- Conditional render is `cond ? <X/> : null`. Never `{cond && <X/>}` — in a `className` context it renders the literal string `"false"`. Early `return null` is for guard clauses only.
- Never hand-roll loading, empty, or list states. Use `Load.Units` / `Load.View` / `Load.Edit` with `renderItem`, `renderList`, `renderView`, and `renderEmpty`; `<Empty />` for a bare placeholder; and `Model.New` / `Model.Edit` / `Model.SureToRemove` for CRUD modals.
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
predicate logic on `LightX` (`isNew()`, `canWrite(user?)`, `formatTimes()`, `isCancellable()`) — the Light class is the
one both server and client hold, so shared logic belongs there instead of in a util module. This is the most commonly
missed rule in the codebase. Collection-level helpers go `static` on the full model. Give any field whose business
meaning is not obvious a short trailing comment.

**`<model>.document.ts`** — fixed order: `XFilter extends from(...)` → `X extends by(...)` → `XModel extends into(...)`,
with `sort: {}` always present. Chain methods validate → mutate → `return this`, and never `save()`; the caller saves,
so chains compose (`org.removeUser(id).removeInvite(id).save()`). Put a one-line comment above each stating the
transition. Atomic counters live on the Model class with the updater-callback form, returning `!!modifiedCount`.
Indexes and derived totals go in `static override _onSchema`, not in the service. **Removal is always soft** — the
model facade's `removeMany(query)` and the store's `removeManyByQuery` stamp `removedAt` like `remove(id)` does; the
framework has no hard delete for a model table, and `delete` is deliberately left unused so it can mean one later.
The facade keeps `Many`/`One` spelled out on its writes (`updateOne` / `updateMany` / `removeOne` / `removeMany`):
a bare `update`/`remove` would read like the document-path `update(id)` / `doc.remove()` while hitting every match.
Only the count was shortened — `count(query)`, with `countDocuments` kept as `@deprecated`. `updateById(id, update)`
and `removeById(id)` are those same query-level writes narrowed to one id, **not** the document path: they fire no
hooks either, so a model whose removal cascades or carries a `_postRemove` still goes through `remove<Model>(id)`.

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
nothing** — `st.do.<action>()` is typed `void` / `Promise<void>`, so hand the result to `this.set({...})` rather
than returning it (`no-return-in-store-action.grit`); a bare `return;` guard stays fine. **Never
`import type { RootStore } from "../st"`** — it crashes `akan build` with a Bun SSR segfault.

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

- Guards run on both HTTP and websocket calls. Read the caller with `context.get<T>("account")` (`pkgs/akanjs/signal/signalContext.ts`) instead of branching on `getHttpContext()` / `getWebSocketContext()`.
- Slice-level `guards` only reach the generated query/mutation endpoints. A `pubsub`/`message` endpoint is unguarded unless it declares its own `guards` in its signal option.
- A pubsub room is authorized once, at subscribe. When a socket's credential changes the framework re-runs each room's guards and unsubscribes the ones that now fail (`SignalResolver.revalidateWsRooms`), so guards must stay side-effect free and safe to re-run.
- A websocket carries its credential in the handshake snapshot on `ws.data` (`AppWsData`); clients that hold the token in memory send it with `fetch.setJwt(...)`, which forwards an auth frame over the socket.

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
- `Upload` is valid only inside a mutation flagged for file upload: `mutation([cnst.File], { fileUpload: true }).body("files", [Upload])` (see `libs/shared/lib/file/file.signal.ts`). It is not a model field type.

### Mutation HTTP Verb

- A `mutation` is `POST`. `{ method: "PATCH" | "PUT" | "DELETE" }` moves it, and one path may carry several verbs
  — a `query` GET and a `mutation` POST on the same custom `path` are mounted side by side. Two endpoints claiming
  the same path **and** verb fail the boot rather than silently shadowing one another.
- Reach for it only when a foreign wire protocol forces the verb (a client you cannot change that sends
  `PATCH /rest/v1/<table>`). Akan's own `fetch.*` client, the OpenAPI document, and the API explorer all follow
  whatever is declared, so nothing needs restating per caller.

### Reserved Endpoint Names

- Auto-generated CRUD endpoints (e.g. `create<Model>`, `update<Model>`, `remove<Model>`) already exist for every model. Do not declare an `Endpoint`/`Slice` with a name that collides with them.
- The service layer surfaces such a collision as a typecheck error, but the signal layer can pass sync/typecheck/build and fail only at runtime — so treat name collisions as errors regardless of whether the build is green.

### Slices, Queries, and Hydration

- A slice's `exec` returns a `QueryOf` (an opaque query descriptor, `pkgs/akanjs/constant/types.ts`); you **cannot** chain `.sort()`/`.limit()` on it.
- Apply ordering/paging via the store `init` fetch option instead: `initX(..., { sort, page, limit })` (`pkgs/akanjs/fetch/fetchType/sliceFetch.type.ts`).
- Generated list accessors like `listBy(...)` return `Promise<Doc[]>`. For a chainable builder (`.sort().skip().limit().select()`) use the model facade's `findMany`/`findOne` (`FindManyChain`, `pkgs/akanjs/document/into.ts`).
- **Hydrated vs raw:** server queries return hydrated `cnst.<Model>` instances (with `set`/`save`/`refresh`); client fetch results are raw `GetStateObject` plain data (functions stripped, `pkgs/akanjs/base/types.ts`).
- Every filter generates fourteen methods: `list` · `listIds` · `find` · `findId` · `pick` · `pickId` · `exists` ·
  `count` · `insight` · `query` · **`remove`** · **`removeOne`** · **`update`** · **`updateOne`**. The last four are
  query-level writes — one atomic UPDATE, **no hooks**, and therefore no `_postRemove` and no cascade. Use them on a
  model that carries no removal side effect; otherwise remove documents one at a time.
- **`update<Filter>` / `updateOne<Filter>` are chains, not calls:** `await updateInRoot(rootId).set({ status:
  "archived" })`. The patch cannot trail the filter args — a filter's own args may be optional and no tuple type
  puts a required element after those — so it lands on a terminal `.set()`, mirroring the `UPDATE … SET …` it
  compiles to. Building the chain touches nothing; only `.set()` runs a query.
- `removeOne` / `updateOne` hit the **newest** match — the subquery they compile to is ordered `createdAt` descending
  and there is no way to change that. They also report only counts, never which row they touched, so they are for
  "there is at most one of these", not for claiming the next item off a queue. Pass a query that matches one row.
- **A filter may not be keyed after its own model.** Filter methods are assigned after CRUD, so a filter `chat` on
  model `chat` would silently swap the single-document `removeChat`/`updateChat` for a hookless query-level one. It
  throws at boot instead (`assertFilterFitsCrud`).

### Text Search In A Filter — `q.search()`

- Text search is a filter query node like any other: `bySearch: filter().arg("text", String).query((text, q) =>
  q.search(text, { prefix: true }))`. The generated `listBySearch` / `countBySearch` / `queryBySearch` /
  `insightBySearch` come for free — you do **not** need a slice to make search usable.
- **Only add a search slice when the model's data is safe to enumerate.** A filter is server-side; a slice is a
  client-callable endpoint, so on a model whose slice `get:` is `Public` a search slice hands anyone a way to walk the
  table. Leave that decision to the mounting app.
- `q.search()` compiles to a JOIN, not a WHERE fragment, so it **must sit at an AND position**. Nesting it under
  `q.any()` or `q.not()` throws, and it is rejected in `updateOneByQuery` / `updateManyByQuery` — a query-level write
  takes no join, so ignoring the node would silently widen the write to every other matching row.
- Blank or whitespace-only input matches **nothing**. Never "fix" that into a passthrough: a passthrough turns a
  search endpoint into a full listing.
- Order by relevance with the built-in `relevance` sort key. It is an empty sort map, which the store reads as
  "unspecified": score order when a search join is present, `createdAt` descending otherwise. That fallback is the
  compiler's own, not a model-defined default — redefining `latest` on the model does not change it.
- **A slice endpoint never reaches "unspecified".** The resolver fills `latest` before the query is built, so a
  client asking for the score order has to name `relevance`; leaving `sort` off gets `latest`, not relevance.
- Scope a search with `columns` (`q.search(text, { columns: ["title"] })`) and re-weight with `weights`, a tuple of
  finite numbers positional over `["title", "desc", "tag", "filter"]`.

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
- **`adapt()` is for singletons only.** A per-use value object stays a plain class you `new` at the call site. Ask whether there is exactly one per process that a service needs injected; if not, it is a plain class.
- **Legacy shape — recognise it, do not copy it.** Plain classes with `constructor(options: XOptions)`, registered in `lib/option.ts` as `options.x ? new XApi(options.x) : null` and injected with `use<T>()`, still work. Migrate one to `adapt()` only when you are already changing it.

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
follows an endpoint's guards — there is no per-endpoint opt-in, and nothing to write in a signal file.** An endpoint
that declares a real guard is published; one that declares none is refused, and so is a mutation whose only guard is
`Public`. `AKAN_MCP=false` takes the whole surface off. The reasoning is that the guards are already the
authorization decision and `filterForAccount` re-reads them per caller on every listing, so a second per-endpoint
switch says nothing the guards do not — while guaranteeing that every endpoint added later is invisible to agents
until somebody remembers it.

Settings live in the app's `lib/option.ts` — `option.setMcp({ … })`, taking `enabled`, `readOnly`, `path`,
`version`, `instructions`, `allowedOrigins`, `pageSize`, `language`, and `auth`. **Not `main.ts`**: the gateway
there only spawns children, and `option.ts` is the app-authored file `server.ts` already hands to the process that
mounts `/mcp`. Every lib's option is read in mount order with the app's last, so an app tightens what a library
declared without restating it. Each field also has an env spelling (`AKAN_MCP`, `AKAN_MCP_READONLY`,
`AKAN_MCP_PATH`, `AKAN_MCP_VERSION`, `AKAN_MCP_INSTRUCTIONS`, `AKAN_MCP_ALLOWED_ORIGINS`, `AKAN_MCP_PAGE_SIZE`,
`AKAN_MCP_LANGUAGE`, `AKAN_MCP_AUTH_SERVERS`, `AKAN_MCP_SCOPES`, `AKAN_MCP_RESOURCE`) for a deployment that
configures what the source does not, which the option overrides.
The two booleans answer to `AKAN_PUBLIC_MCP` / `AKAN_PUBLIC_MCP_READONLY` too, the same pairing `AKAN_OPENAPI`
has, and a value written in code wins over the env of the same name — an explicit `undefined` is not a value.
`AKAN_MCP_PATH` is normalized to a leading `/`, because the route key and the OAuth metadata path are both built by
concatenation.

```typescript
// apps/<app>/lib/option.ts
export const option = new AkanOption<ModulesOptions>().setMcp({
  instructions: "Domain tools for the akan app. Start from taskInTodo.",
  language: "en",
});
```

```typescript
// <model>.signal.ts — every one of these is an MCP tool or prompt, with no `mcp:` option anywhere
export class TaskSlice extends slice(
  srv.task,
  { guards: { root: Admin, get: SignedIn, cru: SignedIn } },
  (init) => ({
    // its own guards: the map above reaches base CRUD and the root slice, never a named slice — so a named slice
    // that names none is refused rather than published, which is the one shape to watch for.
    inTodo: init({ guards: [SignedIn] }).exec(function () {
      return this.taskService.queryByStatuses(["todo"]);
    }),
  }),
) {}

export class TaskEndpoint extends endpoint(srv.task, ({ mutation, prompt }) => ({
  startTask: mutation(cnst.Task, { guards: [SignedIn] })
    .param("taskId", ID)
    .exec(async function (taskId) {
      return await this.taskService.startTask(taskId);
    }),
  reviewTask: prompt({ guards: [SignedIn] })
    .param("taskId", ID)
    .exec(async function (taskId) {
      const task = await this.taskService.getTask(taskId);
      return [Msg.user(`Review this task and suggest next steps.`), Msg.resource(`akan://task/${taskId}`, task)];
    }),
})) {}
```

- **The refusals are fail-closed**: **an endpoint that declares no `guards` at all** (nobody decided who may reach
  it), **a mutation with no real `guards`** (`[Public]` is having none, spelled out — it answers true
  unconditionally), `pubsub` and `message` (their internal args read a socket an MCP request does not have), an
  `Any` or `Upload` return, a file upload, and **an argument typed `Any` that must be filled**.
  A `prompt` refuses two more, because its `arguments` is one string per name with no schema beside it: a **list
  argument**, which could never carry a second value, and **any `Any` argument** — a tool leaves that out of its
  schema, and a prompt has no schema to leave it out of.
- **Every refusal is named in the boot log**: one `warn` per endpoint plus a `MCP catalogue: tools=… prompts=…`
  count. Read that line first when a tool you expected is missing — and it is the *only* place the answer exists,
  because there is no absent opt-in to notice. The API explorer badges the same rule per endpoint (`MCP` /
  `MCP refused`), from the same shared implementation the catalogue runs.
- **An `Any` argument is left out of the published schema** rather than described as `{}` — it tells a model
  nothing — and a value sent for one is refused by name, so the endpoint reads it as omitted. That is what happens
  to the root list's raw `query` descriptor: read as sent, it would be an arbitrary filter over every model you
  publish. Declare a named filter slice when an agent should narrow a list.
- **A nullable model return publishes no `outputSchema`**, and its empty answer ships as the text `null` with no
  `structuredContent`. That field is an object by definition, so `null` cannot ride in it any more than an array
  can — a list is wrapped as `{ items: … }` for the same reason — and a declared schema obliges every result to
  match it, so a client SDK throws on the first call that finds nothing. A nullable *list* keeps its schema, and a
  scalar return has no structured half at all: it ships as the value itself, not as JSON.
- **An `outputSchema` names no `hidden` or `secret` field.** Every response has both stripped, so publishing them
  promises a property no answer can carry — and on a model like `user` the names are the leak. Your *input* schema
  keeps them: they are legal to send, and the same model describes a request body.
- A refused endpoint answers the *same* "unknown tool" as one that does not exist. Never make that
  message more helpful — the difference is what enumerates your private surface. A guard's refusal is generalized
  the same way: the caller reads `You are not permitted to perform this action.`, never `Access denied by guard:
  Admin`, which names your authorization structure to the one caller barred from it. A domain `Err` resolves
  through the dictionary first and keeps its own words.
- The `readOnly` / `destructive` / `idempotent` hints a client renders are derived from the endpoint type and key
  and are not configurable. Clients are told to distrust hints; they are never a gate.
- **`AKAN_MCP_READONLY=true` is the read-only-deployment valve, not the exposure switch.** It drops every mutation
  whatever it declared, and reports each one in the boot log like any other refusal.
- OAuth resource metadata is published at `/.well-known/oauth-protected-resource` (and at that path plus the mount
  path, the spelling most clients try first). `AKAN_MCP_AUTH_SERVERS`, `AKAN_MCP_SCOPES`, and `AKAN_MCP_RESOURCE`
  configure it; `insufficient_scope` is enforced only once `AKAN_MCP_SCOPES` is set. A token carrying no `aud` at
  all is refused once `AKAN_MCP_AUTH_SERVERS` names an issuer — that issuer mints tokens for its other resources
  too — and accepted while none is named, because a first-party Akan token is bound by app and environment.
- **The boot log names every published entry with no dictionary `.desc()`.** An agent picks a tool by its
  description, so a missing one is a broken tool. What the framework generates has no text of its own and borrows
  the model's: the generated list reads the `.of()` label, and the base CRUD tools append the model's `.desc()` to
  their generated `Get X`. Write that model `.desc()` — it is the only text those entries can carry. There is no
  `akan quality scan` rule for this any more: a source scanner found the exposure only as an `mcp:` literal, and
  with exposure derived from the guards the resolved catalogue is the only place that can answer.
- A browser-hosted client needs `allowedOrigins` **and** the CORS answer the server sends back for those origins.
  Every other MCP client sends no `Origin` at all, and the one that does is matched against the forwarded host so
  a proxy does not turn each call into a 403 — which is only as trustworthy as an edge that *overwrites* that
  header. `AKAN_MCP_RESOURCE` pins the resource identifier where you cannot guarantee it.
- **A `resources/read` uri that does not decode** — a stray `%` — is `Unknown resource`, not a server failure.
- **A caller's own mistake is reported as one** and never as a server failure: an argument that is missing,
  unparseable or **undeclared** comes back as `isError` naming it — `additionalProperties: false` travels in the
  published schema and nothing on the wire enforces it — and so does a document that is not there, as
  `No <model> found for the arguments given.` A `prompt`, having no `isError` to carry a refusal, answers `-32602`.
  Only a real failure logs a stack; an agent can drive the rest at will.
- **Three revisions are spoken**: the modern `2026-07-28` and the legacy `2025-11-25` / `2025-06-18`, which are
  wire-identical over the POST-only surface this implements — a client whose proposal is not listed is told to
  disconnect. An unknown proposal is answered at whichever end of that list it is closer to, and an unimplemented
  method answers `404` to a modern client but `200` to a legacy one, whose era spends `404` on "your session is
  gone".
- **A modern-era request mirrors `MCP-Protocol-Version` and `Mcp-Method` into headers** (plus `Mcp-Name` when the
  body names one), and one that leaves a mirror out is refused just like one that contradicts the body: a gateway
  rule keyed on a header never fires for the request that omitted it. Legacy requests are not checked. Capabilities
  are derived from the catalogue, so a server with no prompts does not advertise `prompts`.
- **An expired or wrongly-audienced bearer token is refused up front**, so an agent is told to authenticate rather
  than that the tool does not exist. Its **signature is not checked** — that needs your app's own secret — so a
  token signed wrong, like an opaque one, still degrades to an anonymous caller.
- **Resource URIs**: `akan://<model>/{id}`, `akan://<model>/light/{id}`, `akan://<model>/list` for the model's own
  list, and `akan://<model>/list/<sliceKey>` for a slice's. The root list takes no third segment on purpose — any
  token there is one a slice could also be named. **Those four are the whole set**, so only the generated reads are
  addressable: a custom endpoint keeps its tool and gets no resource template.
- **The catalogue is one language**, `en` unless `language` says otherwise: it is built once at boot and cached by
  clients, so there is no `Accept-Language` negotiation.

**`prompt()`** is invoked by the *user* — a client renders it as a slash command — not chosen by the model. `exec`
returns `PromptMessage[]`, or a bare string that is wrapped into one user message; build them with `Msg.user` /
`Msg.assistant` / `Msg.link` / `Msg.resource` / `Msg.image` / `Msg.imageOf`. It takes `.param()` and `.search()`
only, because `prompts/get` sends a flat string map. **An embedded payload is masked by the model you name** —
`Msg.resource(uri, task, { model: cnst.LightTask })`, or `Msg.mask(cnst.LightTask, task)` for one piece of an
assembly. Taking the model as an argument is what makes a `{ ...doc }` spread maskable, since that and `toJSON()`
arrive with the class already gone; a value with no model named whose `hidden`/`secret` fields are populated is
**refused**, one level into a plain object too. **A `prompt` is also mounted as a
plain HTTP `GET` whether or not you enabled MCP**, because that route is what lets a web UI preview one — and it
is in your OpenAPI document like any other `GET`, answering the one fixed `PromptMessage[]` shape. MCP exposure
gates the catalogue, not the surface, so guard it
like any other read — and a prompt declaring no
`guards` at all is named in the boot log, while an explicit `[Public]` is a decision and stays quiet. Every `Msg` builder takes
optional `annotations` last (`audience`, `priority` 0..1, `lastModified`) — give the instruction a high `priority`
and its attachments a low one, or a client with a full window drops blocks by position and keeps the attachment
over the ask.

**`McpProgress.report(n, { total, message })`** reports progress from anywhere inside a call, a service or adapter
frames down included, and is a no-op when nobody is streaming — so the same code runs unchanged over HTTP, a
websocket, and in tests. `McpProgress.streaming` says whether anyone is reading, for a report whose message
costs something to assemble.

## In-Page Agent

Every akan app can host a component-level agent that reads the rendered screen and drives it. **A component
declaration is the surface, exactly**: `st.tool` publishes one action, and `st.use` / `st.sel` / `st.ref` make one
store key readable while the reading component is mounted. Nothing is derived from a store class — declaring a
method on a `store(...)` gives an agent nothing at all, because a lever the screen does not offer the user is not
one an agent may pull in their place, and a module's whole vocabulary published at once was noise the model paid
for. `Load` scopes, the route, and the live keys complete the context. The React core is the `use-agentic` package;
apps and libs never import it directly (`no-import-external-library`) — everything reaches them through `st.*` and
`akanjs/ui`.

- **Mount `<Agent.Chat />` once in a layout.** That is the floating chat, the approval card, and the client-side
  loop. The default runner drives `runAgentTurn`, which the **framework serves on every app** — no lib to mount,
  `AKAN_AGENT=false` takes it off — and negotiates streaming via `accept`, so assistant text arrives as it is
  generated with zero app code. The endpoint is a stateless relay and **never executes tools**: every tool runs in
  the caller's own browser session, gated by guards and the approval card. Its guard is `AgentRelayAccess`, which
  **refuses every call until the app names a guard of its own** — the same answer `None` gives, with no boot
  warning. A product with accounts names it in its `option.ts`, `option.setAgentAccess(SignedIn)`, taking the same
  guard classes every endpoint takes (an array is ANDed, `null` clears what a library set); without one the chat
  cannot spend the LLM key.
  `persist` keeps the transcript across reloads (sessionStorage; `{ storage: "local" }` to outlive the tab),
  default off, and `shortcut={false}` gives the browser back the Cmd/Ctrl+L the launcher otherwise captures.
  **A session the chat made ends when the chat unmounts** — nothing renders its approvals once it is gone, so a
  turn left running would drive a screen the user has navigated away from; a session handed down by an
  `AgentProvider` or an `Agent.Zone` belongs to whoever provided it. Re-skin through the `AgentChat` slot in
  `_overrides.tsx`.
- **The LLM is configured in `option.ts`, never through the environment.** `option.setLlm({ apiKey, model, host })`
  — or `setLlm((options) => …)` to read the key out of the app's own env object, which is where a secret belongs —
  fills whichever adaptor holds `LlmAdaptorRole`, reaching it as the `llmOption` use. The settings are the role's
  rather than one provider's, so they survive a swap. **DeepSeek is the built-in default** (`deepseek-v4-flash` at
  `https://api.deepseek.com`); with no `apiKey` the app still boots and the chat answers `llmUnavailable`. Swap
  providers the way middleware is applied: `option.applyAdaptor(LlmAdaptorRole, ClaudeLlm)`, where the
  implementation is an `adapt()` class in a `srvkit/` implementing `LlmAdaptor.chat(request, onDelta?)` — ignore
  `onDelta` and the chat still answers whole.
- **An adaptor answers `null` for "not configured" and *throws* for a refusal it can explain.** The two are
  different things to be told: collapsing both into `null`, the way the adapter convention otherwise reads, left a
  user reading `llmUnavailable` — "no model is configured" — about a conversation that had merely outgrown the
  context window. A thrown `Err` reaches the chat as its own text, so the reason the provider gave is what the
  user sees. It travels as the dictionary key plus the values that key interpolates, on both the JSON and the SSE
  path, and **`fetchRunner` resolves it against the dictionary one step before the transcript** — the endpoint has
  no language to resolve it in and the browser does, which is why the key was reaching the screen raw.
- **A file the user attaches rides the message, and nothing is stored.** The composer takes a paperclip, a drop and
  a paste; an image rides as bytes and a text file as text, which is all a browser reads with no dependency.
  Everything else is the app's own reader — `<Agent.Chat attach={…} />`, one `File` in, a `MessageAttachment` or
  `null` out — because extracting a PDF needs a parser and the framework carries attachments without depending on
  one. It runs ahead of the built-in, so it is also where an image is downscaled before it costs a megabyte of
  prompt. **What the provider cannot read is replaced by a note naming the file**, never dropped: an attachment the
  model never saw is one it answers about from the filename. An adaptor declares `accepts: { image, document }` and
  `AgentService.readable` degrades the rest, so a text-only provider needs no attachment code at all — DeepSeek
  declares none, which is why an image against the default provider is refused out loud while an extracted PDF
  works, `text` being readable by every model there is. **A `prompt()`'s `Msg.image` is the same wire shape** and
  reaches the chat as an attachment rather than the literal `[image]` it used to become. Persisting keeps each
  attachment's name and drops its content: web storage is a few megabytes, one screenshot fills a chunk of it, and
  a save that fails is silent — so keeping the bytes would quietly stop keeping the transcript.
  **The ceilings are the message's, not the file's**: 4 MB per file, 8 MB and five files per message, and the same
  file twice is refused by name. The bytes ride inside one turn's JSON, so what a provider refuses is the sum —
  and a request that cannot be sent is one the user has to empty the composer to escape, which is why the refusal
  happens at the paperclip and names the file it dropped.
- **Speech is one engine contract and the framework's own policy.** `<Agent.Chat voice={engine} />` takes a
  `VoiceEngine` — `listen(handlers)` and `speak(sentence)`, both cancellable — and the chat decides everything
  else: a press-to-talk microphone whose transcript lands in the composer to be corrected, one utterance per
  press, sentence-at-a-time reading, barge-in on the next press or on Stop, and markdown stripped so `**bold**`
  is not pronounced. **A reply is read aloud only when the ask arrived by voice**, so a typed question never turns
  on the speakers — and it needs no wire field, because how a message was sent is the composer's own business.
  A question or an approval the loop parked on is read aloud under that same condition, because the loop stops
  there: a voice user who is never told about the card is a conversation that simply ends.
  The contract is a subscription rather than `listen(): Promise<string>` on purpose: a promise fits push-to-talk
  and nothing else, so hands-free could then only arrive as a breaking change. `useSpeech` in
  `libs/util/webkit` is the engine — the browser's own recognition and synthesis on the web, the Capacitor
  plugins in a WebView, **which has neither on Android or iOS**, so `speech.plugin.ts` declares the permission and
  the packages the native build needs. An engine answering `available()` false renders no microphone at all,
  the same rule as publishing no tool for a control the screen does not draw.
- **`attach` and `voice` both carry functions, so a server layout cannot pass either.** A closure does not cross
  the RSC boundary — `non-scalar-props-restricted` says so on `page/**` — so an app that wants either mounts the
  chat from a small client component in `ui/` that calls the hook. `apps/akan/ui/DocsAgentChat.tsx` is the shape.
- **A dialog's close is the dialog's own dismissal, not a state flip.** `closeDialogIn<Ns>` (and `Dialog.Close`)
  run through whatever `Dialog.Modal` registered, so the agent takes the exact path the X button takes —
  `confirmClose` still prompts and `onCancel` still fires. A close that only set `open` to false would skip both,
  which is a different action wearing the same name.
- **`<Agent.Zone id="comments">` runs a second agent over one section, in parallel with the root.** Everything
  mounted inside — `st.use` subscriptions, hook tools, Guides — belongs to that zone's own conversation *and*
  stays visible to the root agent: **zones are views, never walls**, so wrapping a section costs the root nothing.
  An `Agent.Chat` inside binds to the zone session automatically; a zone's `readScreen` reads only its own
  `data-agent-zone` container; guides follow the layout cascade (ancestors and own, never a sibling's). Zone
  membership is positional — there is no per-declaration zone key, so a lib component joins whatever zone the app
  mounts it in.
- **Route guidance is `<Agent.Guide instructions="..." />`** rendered from a `_layout.tsx` or a page — the render
  tree is the cascade: nested Guides concatenate outer-to-inner and navigating away withdraws them. It is a
  component, not a pageConfig field. Module `*.abstract.md` files are developer docs and are never served to the
  agent.
- **Declare the tool beside the control that already does it.**
  `st.tool("x", { desc }).arg("id", ID).exec(fn)` publishes one action and returns the callable to hand to
  `onClick` — one handler for the person and the agent, which is the point: a button wired to an inline arrow can
  be clicked by a person and by nobody else. `.exec()` is the only hook, so the chain completes in one
  unconditional statement, and the callable carries `data-akan-action` like a store setter does. A `remove*` name
  defaults to a confirm gate. Reach a store action from the body — `.exec((id) => st.do.removeX(id))` — which is
  how an agent gets CRUD; `st.do` on its own reaches nobody.
- **A falsy name declares the tool without publishing it** — the callable still drives the click a person makes,
  and the agent never learns the tool exists. That is the only way a conditional surface stays legal, because
  `.exec()` is a hook and the declaration can never be skipped: withhold the name, not the call. `st.useState`
  and `st.expose` take a falsy name the same way, and an unpublished callable carries no `data-akan-action` —
  that attribute names a tool an agent can reach. **Publish a tool only where the screen already renders the
  control**: a lever no one can pull by hand is not one to hand an agent, and every published tool is paid for in
  every turn's prompt. The mirror of the same rule is why the control gets a tool at all.
- **An `enumOf` class is a complete argument type on its own**: `.arg("mode", TaskStatus)` publishes the values as
  the argument's `enum`, refuses anything off them by name at call time, and narrows the `.exec` parameter to the
  value union — nothing else to write, and the scalar (`string` / `integer` / `number`) comes from the values.
  **A value set the *render* decides takes `.arg(name, type, { oneOf })`** instead, because `enumOf` registers
  globally and a component cannot build one per render: pass the list it has — a slice's sort keys, the options a
  prop carried — and it is published and enforced the same way. Neither reaches a set that fills in *after* the
  first render, since a declaration is mount-static; put that in the tool's `guard`, which is re-read per call and
  can name the current values in its refusal. **An argument type nothing can describe — a model class, `Any`, a
  `Map` — withdraws the whole tool and says so on the console**, naming the tool, the argument and the type; the
  callable still drives the click a person makes. It does not throw: a tool schema is built during render, and an
  agent-tooling mistake that aborted the render would cost the route its server rendering. `st.useState`'s `set`
  degrades the same way, to read-only.
- **A component that renders once per row never closes over its row's id — it takes the id as an argument.** A
  tool that captured its own row would be fifty registrations of one name, forty-nine of them shadowed, and the
  survivor would remove whichever row happened to mount last. Take the id instead — `removeTask(taskId)`, never
  fifty `removeTask` — and every row's registration is then interchangeable, so a row component may publish after
  all: say so with `shared: true` and the repeats are one declaration rather than a warned-about clash. The ids
  come from the `<slice>.items` resource `Load.Units` and `Data.ListContainer` already expose. `shared` is a claim
  about the *tool*, not a way to quiet a console: two rows whose tools would do different things (a different
  `modal`, a different redirect) are not interchangeable, and that one wants a `namespace` or nothing at all.
- **`akanjs/ui` publishes its own controls, so an app writes nothing for them.** `Data.ListContainer` (and every
  `Model.AdminPanel`) publishes its toolbar and its row verbs; `Model.NewWrapper` (so `Model.New` too) publishes
  `new<Model>`; `Load.Units`, `Load.Pagination` and `Data.Pagination` publish `setPageOf<Model>`; `Layout.Sider`,
  `System.SelectLanguage`, `Link.Back` and `System.ThemeToggle` publish the shell. **A component that can render
  twice on one screen takes a `namespace` prop and publishes nothing without it** — `Tab`, `Dialog`,
  `ScreenNavigator`, `Dropdown`. Pass one (`<Tab namespace="detail">`) and the tool becomes `switchTabInDetail`;
  leave it off and that tab is invisible to the agent, because two tabs answering to `switchTab` would mean the
  first to mount loses. A named `Dropdown` publishes `openDropdownIn<Ns>` / `closeDropdownIn<Ns>` and the state
  `dropdownIn<Ns>`, and its trigger annotates whichever of the two its next click performs. `Model.NewWrapper`
  takes the same prop but publishes without one, because its slice already names it — a second create trigger for
  the same slice, opening a form seeded differently, is what needs the suffix.
- **The `Model.*` row wrappers publish their verb, taking the id.** `Model.EditWrapper`, `Model.ViewWrapper`,
  `Model.RemoveWrapper` and `Model.Remove` publish `edit<Model>` / `view<Model>` / `remove<Model>` with a
  `modelId` argument, so a list built from `Load.Units` and an app's own `Unit` reaches the same verbs an
  `AdminPanel` does. `Model.SureToRemove` publishes the same — except under `typeNameToRemove`, where it
  publishes nothing: that gate makes a person retype the model's name, an approval card is one click, and
  offering the lever at a friction the screen does not have is not the same control.
- **A dropdown's menu is mounted from the first render and hidden while closed** — the deliberate opposite of the
  modal rule below, because a menu is one click away rather than a surface of its own. A tool is declared by a
  mount effect, so an unmounted menu is one whose row verbs and field setters do not exist yet: an agent asked for
  one finds nothing, and no catalogue entry hints that opening the menu would help. `readScreen` still skips
  hidden content, so the items themselves are read only after `openDropdownIn<Ns>` — what a closed menu publishes
  is its tools, not its text. The cost is that `content` renders on page load, so a heavy panel belongs behind a
  `Dialog` instead.
- **A modal publishes its verbs while it is open, and only then.** `Model.EditModal` publishes `submit<Model>`
  and `cancelEditOf<Model>`, `Model.ViewModal` publishes `closeViewOf<Model>`, and `Model.ViewEditModal`
  publishes `edit<Model>` / `submit<Model>` / `closeViewOf<Model>` — each from a subtree that mounts with the
  open modal, never from the component that merely holds it. That is what makes a list legal: `Data.CardList`
  renders one editor per row, and at most one of them is ever open, so one name is registered rather than fifty.
  It also means the verb is absent from the catalogue while nothing is open, which is honest — and costs the
  agent nothing, because the catalogue is re-read on the turn that follows the tool call that opened the form.
- **A form control publishes its own setter, and reading a form publishes one tool that fills several at once.**
  Both are free: an app writes no `st.tool` for a form. A `Field.*` / `Input.*` / `Select` / `Switch` handed
  `onChange={st.do.setTitleOnTask}` **by reference** publishes `setTitleOnTask` while it is on screen — the same
  reference that earns `data-akan-action`, so the tool and the person press one function and an inline arrow
  still publishes nothing. `st.use.taskForm()` adds `fillTaskForm(patch)`, which takes several fields in one call
  and is the only way to reach a list, a map, or an embedded object, whose rows are written through
  `writeOnTask(path, value)` and can carry no annotation. It is a patch: a field left out keeps its value.
  `fillTaskForm` refuses a plain field whose control is not on screen and names the ones that are; a composite it
  cannot see is let through, which is the one place an agent reaches a field the screen may not draw. Never a
  relation (picked or uploaded, not typed), a base document field, or a `hidden`/`secret` one at any depth —
  their reads are masked and a writer would be the door around that. `st.use.taskForm({ agent: false })`
  withholds the patch tool; an inline arrow withholds a control's own.
  **The patch writes each plain field through that control's own published tool, not the setter underneath it** —
  which is what carries the control's `transform`, so a field cannot normalize one way for `setPhoneOnBizAccount`
  and another way for `fillBizAccountForm`. Only a composite, having no control, dispatches its setter directly.
  The patch tool is registered `shared`, because the entry is a pure function of the model: a form put on screen by
  a shell that subscribes it (`Model.EditModal`) *and* by the `Template` inside it is one declaration twice over,
  not a clash — so neither has to suppress the other, and neither is asked to.
- **A `disabled` control publishes nothing, so the agent never gets a lever the person cannot pull.** Every value
  control reads it — `Field.*`, `Input.*`, `Select`, `Switch`, and the four relation pickers — and disabling a
  mounted control withdraws its tool for as long as it stays disabled. One gate covers both writers: with no
  control published, `fill<Model>Form`'s guard refuses that field too. `readScreen` says `(disabled)` beside the
  control, from the native attribute or `aria-disabled`, so a refusal is something the agent could have read first
  rather than a surprise. This is the same rule as publishing only where the screen renders the control, applied to
  a control the screen renders but withholds.
- **Whatever the wrapper was for, there is a place to put it that is not the wrapper.** An inline arrow is the one
  shape that publishes nothing, so each reason for writing one has its own home, and reaching for that home is what
  keeps the field reachable:
  - *normalize* — `(v) => set(formatPhone(v))` becomes the control's own `transform` prop, which every text and
    number `Field.*` already takes (`Field.Phone` defaults it to `formatPhone`). `onChange` stays a reference, and
    **`transform` runs on the agent's write too**, by both paths — the field's own tool and `fill<Model>Form`,
    which goes through the control to get it — otherwise a person would store `010-1234-5678` and an agent the raw
    digits. It normalizes one scalar, so an array control applies it per element and a cleared nullable field stays
    null. It is the *control's* rule, though: a rule that must hold however the field is written — including a
    composite path or a base-document write — belongs in `_postSet<Field>` below.
  - *multi-write* — `(v) => { set(v); other(v); }` becomes a **`_postSet<Field>` method on the store**, and the
    control keeps handing over the generated setter by reference. It runs right after the field is written, so it
    reads the new value, and it reaches every other generated action with `this.` —
    `_postSetToBiz(toBiz) { if (toBiz) this.addSendEmailsOnEstSheet(toBiz.sendEmails ?? []); }`. Nothing about the
    control changes, so `data-akan-action` **and** `data-akan-state` both survive, and the rule now fires for every
    writer — the person, the agent, `fill<Model>Form` — which is what a rule about a field should do.
    **A generated action cannot be overridden, so do not try.** They all come from mapped types, and a mapped type
    produces *properties*: a subclass method of the same name is `TS2425`, optional or not, and the two shapes
    TypeScript does allow — a class field and a getter — are both skipped by `StoreRegistry.register`, which only
    collects prototype descriptors holding a function. There is no legal middle, which is exactly why the hook
    carries a leading `_` and no model suffix: a name no mapped type can produce is the only name a subclass may
    declare. It cannot be typed either, for the same reason, so a misspelled field is named on the console at
    registration instead. Calling a generated action *from* a custom one is fine and always was — `this.setXOnY(v)`
    typechecks anywhere.
  - *nested path* — `(v) => writeOnTask("payments.3.name", v)` has no home and needs none: an embedded row is
    unannotatable by design, and an agent reaches it through `fillTaskForm`, which waves composites through.

  `no-unpublished-form-setter.grit` errors on the pure-forwarding shape only, because every other one has a
  legitimate reading. **`akan quality scan` counts them all** (`akan.agent.unpublished-form-setter`, one warning per
  file): the lint rule is the per-line enforcement, the scan is the inventory of fields this screen writes but
  cannot be asked to write.
- **A relation reaches an agent from its picker, not from the form patch.** `fillTaskForm` publishes no schema for
  one and is right not to: the form holds the whole related document, so an id would need a lookup the store does
  not do. The picker is where that lookup lives, so `Field.Parent` / `Field.Children` publish the pair themselves —
  `load<Field>OptionsOn<Model>`, which loads the slice and returns `[{ id, label }]`, and the field's own
  `set<Field>On<Model>` taking `<field>Id` / `<field>Ids`. Listing is its own tool because loading is its own step
  for a person too: the options arrive when the dropdown opens, and an agent never opens it. `Field.ParentId` /
  `Field.ChildrenId` need none of that — the id *is* the value, so the ordinary setter describes it. All four still
  require the setter **by reference**, and a `disabled` picker publishes nothing.
- **An array of embedded rows also publishes `add<Field>On<Model>` and `sub<Field>On<Model>`** — append, and
  remove-by-position — beside the whole-array setter. Not new authority: the setter can already produce any array
  those two can, so they are strictly weaker. What they add is that neither can touch a row it was not given, and
  that is the point: writing the whole array means echoing every row the agent is *not* changing, `checked`
  validates types and not values, so one mistyped row nobody asked about is written silently. Both take a list and
  act atomically, because removing positions one call at a time would shift the ones not yet removed. **Only an
  embedded-row array gets them** — an array of primitives or of relation ids has nothing to retype wrong, its
  values *are* the payload, so it keeps one setter and pays for no extra tools. `add` appends and publishes no
  insert position, matching the `+` a person presses; `addOrSub` is never published, since it matches by `indexOf`
  and would compare rows by reference. Editing a row in place stays `fill<Model>Form`'s job.
- **A list the person can drag also publishes `move<Field>On<Model>(from, to)`**, and `DraggableList` is a form
  control like any other: handed the generated setter by reference it publishes that field, so an app that renders
  its own rows with `DraggableList` writes no `st.tool`. The reorder tool exists for the same reason `add`/`sub` do
  — the drag is the lever the screen offers and it changes no entry's content, so moving one row should not mean
  retyping the nine beside it. No store action answers to it: reordering *is* a whole-array write, so the tool
  splices the live entries and hands them to the setter the drag hands them to, `transform` deliberately not
  applied, since the values are stored already and dragging normalizes nothing. It comes from the control saying
  it sorts, not from the field, so a plain `Field.List` publishes no reorder and a scalar field never gets one.
  **A component that composes `DraggableList` and already published the field hands the inner list a wrapper** —
  the two would otherwise register one name twice, and the outer one is the one holding `transform`. That is what
  `Field.TextList` does, and the only place an inline arrow is the right answer rather than a bug.
- **Reading is per key, not per store.** `st.useState(name, initial, meta)` publishes local state (read-only
  unless `set:` names a type) and `st.expose(name, value)` a derived value. A subscribed store key is listed in
  the state context block by name and pulled with `readState(key)`, masked by the model that key declares — while
  a key the screen does not read stays unreadable even when a sibling key of the same store is live. **There is no
  store-level exposure declaration**: a store class says nothing about agents, and `st.use.x({ agent: false })` is
  how the component that subscribes a value keeps it off the surface. Base-store plumbing does the same at the
  call site — `st.use.path({ agent: false })`, `st.use.tryJwt({ agent: false })` — so routing and the caller's
  credential stay off the surface unless a component opts a key in, as ThemeToggle does for `theme`.
- **Model-facing text is English, always** — tool `desc`, `instructions`, Guide text. The `l()` rule covers
  strings a *user* reads: Chat's own buttons go through `l("base.*")`, the model's text never does.
- A masked model never crosses the boundary: a value whose `hidden`/`secret` fields are populated is refused at
  read unless a `mask:` model is named — the same rule and wording as `AgentBridge.read`.
- **`prompt()` endpoints double as the chat's slash commands.** There is no listing endpoint — the client reads
  its own serialized signals — so a prompt's dictionary `.desc()` is what the menu shows, and its guards are
  enforced by the prompt's own GET at call time. Arguments are positional and whitespace-separated, and quoting
  is how a sentence stays one of them (`/reviewTask t1 "look at the totals"`) — a prompt taking a single `String`
  is the common case, and an unquoted sentence would fill its second parameter with the second word.
- **The chat answers six slash commands of its own**, listed in the same `/` menu ahead of the prompts:
  `/new` (`/clear`), `/retry`, `/compact`, `/copy`, `/help` and `/tools`. An app writes none of them and cannot add
  one — the extension point for a product's own command is a `prompt()` endpoint, which is guarded and server-side.
  **A built-in wins a name collision with a prompt of the same name**, the mirror image of the tool rule: a
  component's `st.tool` shadows a built-in it means to replace, but no library's prompt may take `/new` away from
  the user who typed it — so a shadowed prompt is dropped from the menu rather than listed twice. `/new` and
  `/copy` are also dispatched *before* the is-a-turn-running check **and before the question card takes the
  composer**, because mid-turn is exactly when they are reached for and a question the agent asked is the middle
  of a turn like any other — answered as text, `/new` would have reached the model as the user's decision.
  `/new` therefore aborts the turn it is clearing and waits for it to wind down, since the loop clears its own
  running flag a microtask later and a transcript emptied before that lands is one the dying turn appends onto.
- **A command's output is a `local` message: rendered in the transcript, withheld from the wire.** The transcript
  *is* the model's history, so `/help` text appended plainly would come back next turn as something the assistant
  believes it said. `session.note(text)` is the only way to write one, `session.report(error)` stays what a
  host-side *failure* lands in, and `local` messages are left out of a `/copy` export too — they are the chat
  talking to itself. Their text is user-facing, so it goes through `l("base.*")` like every other chat string.
- **`/copy` exists because nothing else keeps the transcript.** The relay is stateless and the conversation lives
  only in that browser, so an export is the one path a wrong answer has to whoever could fix it — which is why it
  carries the route and the timestamp. `/retry` replays only the trailing user message, leaving anything before it
  in place, so a prompt's own preamble is not sent twice.
- **A long conversation summarizes itself, because nothing else is keeping it inside the model's window.** The
  loop runs in the browser and the relay holds no session, so an uncompacted chat grows until the provider
  refuses the whole request — a refusal, never a shorter answer, which is why compaction runs *before* the turn
  that would have overflowed rather than as a recovery after it. Past `compact.at` estimated tokens (four
  characters to a token, over the JSON the turn posts; 24k by default, well under the smallest window a provider
  is likely to have, since the tools and the screen context ride on top of it and neither compacts) the history above the last `keep` messages
  becomes one message standing in for it, flagged `summary` on the wire — `<Agent.Chat compact={{ at, keep }} />`
  tunes it per provider and `{ at: 0 }` turns it off, and `/compact` does the same on demand keeping nothing.
  **The cut only ever lands on a user message**: everything above one is settled, so the kept half can never open
  with a `tool` result whose call was summarized away, a shape every provider dialect rejects. The summarizing
  turn carries no tools and no screen context — it summarizes the conversation, it does not act on it — and it is
  fed a *bounded* digest rather than the transcript itself, since the transcript being summarized is the one that
  no longer fits. A summary that cannot be produced leaves the transcript alone and the turn goes out as it would
  have; one that fails to shrink anything is not retried until another threshold's worth has been added. On the
  wire a summary wears the user's role because the wire has no other, so a provider mapping frames it as a system
  message and `/retry` steps over it — replaying it would send the notes back as a question.
- **A stopped turn answers the calls it never ran, because an unanswered call ends the conversation.** Every
  provider dialect refuses an assistant message whose `tool_calls` have no results — on that turn and on every
  later one — so Stop landing between a call and its result would leave a transcript nothing can be sent from,
  with no way out but `/new`. `Transcript.sanitize` holds the invariant in one place and runs where a transcript
  is assembled rather than where each hole is made: the turn's own request, a transcript restored from storage,
  and a stored transcript capped to its newest messages, whose window can start mid-pair. A call the loop never
  reached is *answered* rather than erased — a model told the call was stopped asks again, where one shown no
  call at all answers as if it had the result.
- **A turn that failed says so on the wire.** `error` is a field only this wire has, so a provider mapping reads
  `text` and drops it; `AgentService.explained` folds it into the text before any adaptor sees it, because an
  assistant turn that says nothing is one the model repeats.
- **↑ and ↓ in the composer walk what was sent**, seeded from the transcript so a persisted chat does not lose
  only what was just typed. A single-line input has nothing of its own on the vertical arrows, and the
  half-written draft they were walked away from comes back at the bottom of the walk. **The `/` menu takes those
  keys while it is open** — it is the thing on screen the arrows point at — with Enter picking the highlighted
  row, Tab completing its name, and Escape closing the menu and then, pressed again, the panel.
- The framework publishes five built-ins on every store surface: `navigate` (internal paths only, the same
  router `Link` rides), `goBack` (this session's history — global, because history is not a control a page owns and
  a page that draws no back link is not one you may not leave), `readScreen` (the rendered DOM as compact text —
  headings, links, control values, and `(disabled)` on a control or button that has it; the chat's own UI is
  skipped via `data-agent-ui`, and a password value is never read), `readState(key)` (one masked store key), and
  `highlight(target)`. Declaring a hook tool under one of those names shadows the built-in, so reuse them only to
  mean that. **There is no general-purpose wait**: a built-in one was reachable on every screen and a model spent
  it on whatever key it liked, parking turns nobody asked to park. Waiting belongs to the screen that knows what
  is worth waiting for — publish an `st.tool` beside the control that starts the work, and let it await the work.
- **A tool that changes the screen waits for the screen before it answers.** `router.push` returns while the RSC
  payload is still in flight and a store action that fires `void fetch.*` commits a tick later, so `navigate`
  awaits `ScreenSettle.wait()` — DOM quiescence, bounded, because the client router hands its promise to nobody —
  and the session awaits it after every non-`query` tool before taking the change report. Without it the report
  describes the moment before the change landed and the `readScreen` that follows reads the page the user left.
  New tools and state from a fresh route are still only listed from the next turn: the catalogue is snapshotted
  when the turn starts.
- **A tool that waits for its own work costs no model turns; one that returns early costs one round trip per
  look.** The session awaits `run`, so a `.exec` that awaits the store action finishing the job simply makes the
  turn take that long — and the change report that follows carries whatever landed, so the model needs no second
  call to read the result. A fire-and-forget tool leaves the agent to poll instead, which burns the whole
  `maxTurns` budget in seconds on a job measured in minutes. Say so in the `desc` ("takes about two minutes; do
  not poll while it runs") and, for a route full of slow work, in an `Agent.Guide`.
- **A wait is a screen's own tool, declared where the slow work is.** For the job a tool cannot await — one
  started in an earlier turn, or by a person clicking the button — publish an `st.tool` that parks on the thing
  *that* screen knows about, and say in its `desc` what it waits for and roughly how long. A general built-in was
  tried and removed: reachable on every screen with no idea what any key means, a model spent it on whatever key
  looked promising and parked turns nobody asked to park. The screen that starts the work is the only place that
  knows what finishing looks like, and a tool declared there is also one the agent cannot reach on a screen where
  waiting makes no sense. Honour `AgentAbort.current` in the body and report with `AgentProgress.report`, so Stop
  ends the wait and the row says how it is going.
- **Stop reaches a tool that is still running.** The session races every call against its abort signal, so a
  two-minute tool does not hold the loop for two minutes after the user presses Stop. The signal itself arrives
  through `AgentAbort.current` — the same module slot `AgentProgress` is — and honouring it is optional, since the
  race lands whatever the tool does; what it buys is the tool's own cleanup, a timer or a poll loop that would
  otherwise run out with nobody left to answer. A tool that ignores it is left running rather than cancelled: the
  work is usually a job a server is already doing.
- **`readScreen` takes a `section`, and `highlight` a `target`.** Both resolve a name the agent has already seen —
  a `data-akan-action` / `data-akan-state` annotation, an `Agent.Zone` or `useScreenScope` container
  (`data-agent-scope`, which `Load.Units` / `Load.View` / `Data.ListContainer` put on the container they render),
  an element id, or **a heading by its own text**, matched on letters and digits so the slug an agent writes for a
  heading it read resolves. That tolerance stops at headings: a heading is a landmark and scrolling to the wrong
  one costs nothing, while two buttons reading "Save" are not the same control. **Nothing hidden ever resolves** —
  a ring nobody can see reads as a broken tool, not as a miss. A section named by a heading is read to the next
  heading of its level or higher.
- **A screen is only aimable if its names are printed.** `readScreen` writes `(#anchor)` beside a heading that
  opens an id'd or scoped container, and a truncated read ends with the headings below the cut — otherwise
  everything past the 8000-character limit is unreachable, because nothing names it, and an agent asked to point
  at a section it cannot name guesses a slug and is refused. A refusal lists the sections actually on screen.
  `highlight` scrolls its target into view and flashes it **once the scroll lands**, since a smooth scroll across a
  long page outlasts the flash; it is the one built-in that exists for the *user's* benefit, because showing where
  a control is beats writing directions to it.
- **A slow tool reports its own progress with `AgentProgress.report(message, { done, total })`** from wherever the
  work is — a store action, an upload loop, an adapter — reached through a module slot rather than a parameter, and
  a no-op when nobody is rendering it. The chat shows it on that call's row until the row resolves. It is the
  browser twin of `McpProgress.report`. Import it and `AgentAbort` from `akanjs/store`: an app may not reach
  `use-agentic` directly (`no-import-external-library`), and those two are the channels a long tool body needs.
- **The turn cap is a question, not a dead end.** At `maxTurns` the session asks whether to keep going through the
  same card `askUser` uses, and the answer rides as the user's own turn — so a steer typed instead of the
  keep-going choice reaches the model as guidance. A host that renders no `pendingQuestion` passes no
  `continueAsk` and keeps the old failure, because asking with nobody listening would hang.
- **`askUser` is a fourth built-in the *session* owns, not the surface.** The answer comes from the conversation
  rather than the screen, so it rides on every turn whatever the page declares, and a zone agent asks inside its
  own transcript. `choices` offers a pick (`multiple` for several) and omitting them asks for free text; the card
  keeps a free-text row either way, because the model wrote the options and only the user knows whether the answer
  is among them. The loop parks on the question exactly as it parks on an approval, a dismissal is the tool's
  error result rather than a silent empty answer, and the settled exchange renders as question-and-answer instead
  of a tool row. **Never re-implement it per screen** — a `st.tool("askAboutX")` that opens a modal is the same
  thing with a worse transcript — and a hook tool named `askUser` shadows it like any other built-in.

## Scalar Modeling (`**/*.constant.ts`)

- Define Akan models in `.constant.ts` files with `via` from `akanjs/constant`.
- Use `Int` for whole-number counts and quantities; use `Float` only for values that need decimals.
- Use `ID` for document references and prefer explicit structured fields over `Any` unless the content is genuinely flexible.
- For date defaults, prefer a function such as `default: () => dayjs()` so the value is created at runtime.
- Follow the established model layering pattern in this order: `Input`, `Object`, `Light<Model>`, full `<Model>`, and `<Model>Insight`. Write all five, and write `<Model>Insight` even when it is empty.
- Put display and predicate logic on the `Light<Model>` class rather than in a util module — see Module File Playbook.
- Defaults are a literal for scalars and a thunk for anything constructed. Arrays are `field([T])`; optional is the postfix `.optional()`.

### Scalar & Field Type Reference

- **Import from `akanjs/base`** (real classes/helpers, not globals): `Int`, `Float`, `ID`, `Any`, `Upload`, `enumOf`, and the `dayjs` factory. There is **no `JSON` scalar** — use `Any` for open/flexible payloads.
- **Use the JS globals directly (no import needed)**: `String`, `Boolean`, `Date`. They are monkey-patched to behave like scalars, so `field(String)` typechecks.
- **`Number` is not a valid field/body type.** `NumberConstructor` is intentionally not augmented, so `field(Number)` / `.body("x", Number)` fails to typecheck. Use `Int` or `Float` instead.
- Runtime resolution of every scalar (globals included) goes through `PrimitiveRegistry` by `refName` (`pkgs/akanjs/base/primitiveRegistry.ts`).

### Text Search Fields — the `text` role

- A field joins the full-text index by declaring one of five roles: `field(String, { text: "title" })`, and likewise
  `"desc"`, `"tag"`, `"thumb"`, `"filter"`. Nothing else opts a field in, and there is no per-model switch.
- Pick the role by what the value *is*, because `bm25` weights them positionally (`title` 10, `tag` 3, `desc` 1,
  `filter` 0): `title` is the one line a human scans for, `desc` is prose, `tag` is a keyword list, `filter` is a
  scoping value (status, owner, role) that must be matchable but must never outrank a real title hit.
- `thumb` is mirrored for rendering a hit and is **not** indexed — never expect it to match.
- **A `secret`, `hidden`, or `resolve()` field with `text` throws at class-build time**, not at query time. That is
  deliberate: the mirror is plaintext, so an indexed secret would leak through search. Do not work around it. The
  same throw covers a `text` field *underneath* one of those — a scalar's own field is reachable through its parent,
  so `f.secret(Noti)` where `Noti.label` carries a role is rejected at the parent, not silently indexed.
- The role works on a relation too (`image: field(File, { text: "thumb" })`) and on an array (`playing: field([String],
  { text: "tag" })`); an array of objects indexes by leaf key, including an array leaf (`works[*].tags`). A field
  inside a `Map` indexes nothing: there is no fixed path to extract it from.
- Declaring roles is all the wiring there is. Mirror rows are maintained by SQL triggers — not document hooks —
  because `updateOneByQuery` and friends fire no hooks, and most searchable-field mutations go through exactly that
  path.
- Search runs on sqlite/libsql only. `q.search()` against Postgres throws, loudly, rather than returning every row.
- `AKAN_SEARCH_ENABLED=0` switches the index off process-wide; unset means on. It never deletes mirror data, and
  re-enabling reconciles every ref. **Give every process the same value** — a process cannot drop triggers for models
  it does not mount, so a mixed fleet leaves stale triggers behind.
- The tokenizer is `AKAN_SEARCH_TOKENIZER` (or `database.search.tokenizer`, which wins), defaulting to
  `unicode61 remove_diacritics 2`. Changing it rebuilds the index from the mirror on the next boot — the model
  tables are never re-read — so it is a safe knob, unlike a `text` role change, which re-reads every row. The
  rebuild takes no cross-process claim, so a fleet restarted at once repeats it in every process; stagger the
  restart when the mirror is large.

### Image & File Fields

- **Do not declare `Upload` as a model field.** `Upload` is a signal-body-only primitive (see Service And Signal Conventions). Models reference the `File` model instead.
- Declare an image/file field as a relation to `File`: `image: field(File).optional()` for one, `images: field([File])` for many (see `libs/shared/lib/user/user.constant.ts`, `libs/shared/lib/banner/banner.constant.ts`).
- The store then auto-generates an `upload<Field>On<Model>(fileList)` action that calls the framework upload mutation and polls file status until it leaves `"uploading"` (`pkgs/akanjs/store/action.ts`).
- Storage is wired through the `StorageAdaptor` DI role (default `BlobStorage`, `pkgs/akanjs/service/predefinedAdaptor/storage.adaptor.ts`); the reference implementation is the `file` lib (`libs/shared/lib/file/*`). Do not hand-roll data-URL fallbacks.

### Cascade Remove — the `cascade` option

**The value names the direction, and getting it wrong is a data loss.** The two actions can sit on the same field
shape, so `cascade` never means "related" — it means one of exactly these:

- `removeRef` — *when I am removed, remove what this field points at.* Declared on the relation the owner holds:
  `image: field(File, { cascade: "removeRef" })`, arrays included. Only a relation accepts it; a primitive, a bare
  `ID`, and a scalar each fail the class build, because none of them names a document to remove.
- `removeWith` — *when what this field points at is removed, remove me.* Declared on the child's own reference to
  its owner, so the owner never learns about its children and a lib model can be extended by an app's. Three forms:
  a relation (`agentSession: field(AgentSession, { cascade: "removeWith" })`), an id with `ref`
  (`field(ID, { ref: "agentSession", cascade: "removeWith" })`), or a polymorphic id with `refPath`
  (`field(ID, { refPath: "parentType", cascade: "removeWith" })`). An array, a Map, `ref` together with `refPath`,
  and a field naming no owner each fail the class build.
- **A `refPath` must name an `enumOf` field.** A free-form owner type is unknowable at build time, so every model's
  removal would have to sweep the polymorphic table on the chance it is the owner. The enum names the candidates and
  the reverse index reaches only them.
- **A cascade goes through the target's service, never its model** — unless it provably makes no difference. The
  service path is what runs the target's `_postRemove`, which is where a module puts the side effect the removal has
  to carry (`FileService._postRemove` deletes the stored blob there).
- **Bulk is decided at boot, per target model, for both directions.** When the target has no `remove` schema hook, no
  `_pre`/`_postRemove` (its own or a lib's), no cascade of its own, and no children, one `removeManyByQuery` leaves
  exactly the rows the loop would, so the framework takes it. Adding a `_postRemove` to that model silently flips it
  back to one document at a time — the boot log (`info` summary, `verbose` per edge) is the only place that shows.
- **The plan is sealed after every service is live**, so a `listenPost("remove")` registered in `onInit` still counts
  and a `removeRef` target the app never mounted fails the boot rather than the first removal. An unmounted
  `removeWith` owner fails the boot too; an unmounted `refPath` candidate only warns, since that list spans optional
  modules by design.
- **Nothing checks whether another document still references the same target.** `File` in particular is deduped by
  `origin`, so two parents can share one row; declaring `removeRef` says the field owns its target exclusively, and
  that judgement is the declaring model's to make.
- Removal is soft (`removedAt`) but the storage delete a `_postRemove` performs is not — a cascade is not
  restorable, and reviving the owner does not revive what went with it.
- A `removeWith` declaration **auto-creates its index** (`{ removedAt, fk }`, or `{ removedAt, typeKey, fk }` when
  polymorphic). Every non-base field lives in the `_doc` JSON column, so the lookup would otherwise scan the table
  on every owner removal.
- **Query-level removes fire no hooks and therefore no cascade.** `removeManyByQuery` / `updateManyByQuery`, the
  generated `remove<Filter>` / `update<Filter>`, and the facade's `removeById` / `updateById` stamp
  `removedAt` in one atomic UPDATE, so nothing downstream runs. Remove one document at a time when it cascades.
- Cascades are **idempotent**: `removedAt IS NULL` is ANDed into every query-level write, so a retry after a partial
  failure re-stamps nothing. Cycles are cut by a visited set carried down the whole chain, with a depth cap of 16.

## Akan Page Routing (`apps/**/page/**`)

- `apps/<app>/page` may contain route modules only. Do not add helper logic or component-only files there.
- Route source files under `page/` must use `.tsx`. Do not add `logic.ts`, `.js`, or `.jsx` files under `page/`.
- Route pages use `_index.tsx`; layouts use `_layout.tsx`; per-route UI overrides use `_overrides.tsx`.
- Reserved `_*.tsx` route filenames are limited to `_index.tsx`, `_layout.tsx`, and `_overrides.tsx`; do not add files like `_Component.tsx` or `_helper.tsx`.
- Page filenames must not start with an uppercase letter. Move helper components like `Component.tsx` to app `ui`, `common`, or `lib` instead.
- Dynamic segments use `[id]`; route groups use directories like `(user)`, `(public)`, `(tab)`, or `(detail)`.
- Page modules should usually export `default`, `pageConfig`, `head`, `generateHead`, or `Loading`.
- `_overrides.tsx` is a logic-free UI-override manifest: imports plus a single `export default override({ Slot: AppComponent })` (from `akanjs/ui`), no `"use client"`. It re-skins framework `akanjs/ui` components for its route subtree; nested manifests merge over ancestors slot-by-slot (closest wins). See the UI Customization reference for the slot list.
- Prefer `export default function Page` or `export default async function Page` for page components.
- `libs/<lib>/page` follows the same rules and ships routes to apps that opt in with `syncPageLibs` in `akan.config.ts`: `true` takes every lib dep that has a `page` folder, an array takes the libs listed, `false` (the default) syncs nothing.
- `akan sync` links those routes into `apps/<app>/page/(libs)/(<lib>)` — once per basePath when the app declares subRoutes. The folder is generated and gitignored; edit the lib source, never the link.
- Both path segments are route groups, so a lib route mounts at its own path (`libs/shared/page/login/_index.tsx` serves `/login`). Two synced routes that resolve to the same pattern are a sync-time error.
- `export const pageConfig = { devOnly: true }` keeps a route out of `akan build` while it keeps serving under `akan start` and keeps being typechecked. On a `_layout.tsx` it excludes every route under that directory too. Write it as a literal `true`/`false` — the build reads it off the source without evaluating the module.
- Before changing route behavior, check `pkgs/akanjs/server/src/routeTree.tsx` and nearby routes for the expected pattern.

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
- Raw palette grays such as `text-gray-400` instead of daisyUI semantic tokens.

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
cd dist/apps/akan && USE_AKANJS_PKGS=true AKAN_PUBLIC_REPO_NAME=akanjs AKAN_PUBLIC_SERVE_DOMAIN="akanjs.com" AKAN_PUBLIC_APP_NAME=akan AKAN_PUBLIC_ENV=local AKAN_PUBLIC_OPERATION_MODE=local SERVER_MODE=federation AKAN_PUBLIC_BASE_PATHS=akanjs,soft,office bun main.js
```

- Adjust `<appName>`, `AKAN_PUBLIC_APP_NAME`, and `AKAN_PUBLIC_BASE_PATHS` to match the app being tested.
