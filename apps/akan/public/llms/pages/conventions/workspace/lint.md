# Format & Lint

- Source: /conventions/workspace/lint
- Mirror: /llms/pages/conventions/workspace/lint.md
- Section: conventions
- Category: Workspace
- Priority: P1

## Headings

- Lint Is Not About Style (#silent-failures)
- Six You Will Meet First (#fix-errors)
- Every Rule That Breaks The Build (#every-rule)
- Suppressing One (#suppression)
- Commands (#commands)

## Content

Format & Lint

A colour outside the vocabulary

Vocabulary closure strips the raw Tailwind palette from the compiled stylesheet, so bg-blue-500 is not a warning about taste — it is a class with no CSS behind it. The element renders unstyled and the DOM still shows the class you wrote.

A raw Error

A bare Error reaches the caller as Internal Server Error with no message, and it has no translation. Throw an Err naming a key, and register that key in the module's dictionary as an [en, ko] pair.

A setter wrapped in an arrow

The two lines run identically, and only one of them works. Passing the setter by reference is what makes the framework emit data-akan-action on the control and publish the field as an agent tool; an anonymous closure names no action, so both are silently dropped.

A value returned from a store action

Every method of a store class is dispatched through st.do.<action>(), and that dispatch is typed void. The value is unreachable at every call site. Write it into state instead; a bare return; guard clause stays legal.

A hydration call made from the client

fetch.init<Model><Suffix> is not a request, it is the snapshot Load.Units seeds the store from. Run from a route it resolves before the first byte; run after hydration it is two extra round trips for a shell the browser already painted, landing in a local variable no store reads.

#private in one of the four suffixes

#private is banned in exactly four file suffixes — constant.ts, document.ts, service.ts and store.ts — because the framework mixes generated members into those classes and a # member is not reachable from a mixin. Everywhere else, srvkit included, #private stays the house style.

bg-blue-500, text-gray-400. Renders as no CSS. Use a semantic token — bg-primary, text-foreground/70.

bg-[#3b82f6], text-[rgb(0,0,0)]. Ignores data-theme entirely. A variable reference such as bg-[var(--kakao)] is deliberately not matched — that is how a lib pins a vendor colour.

btn-primary, card-body, bg-base-100, text-base-content, bg-error. daisyUI was removed, so these render unstyled. base-100/200/300 to background/muted/border, base-content to foreground, <colour>-content to <colour>-foreground, error to destructive.

A colour literal inside style={{ ... }} or a <style> body. Bypasses the token layer and theme switching. style={{ color: 'var(--primary)' }} when a runtime value is unavoidable.

An arbitrary value whose brackets are filled at runtime, such as a min-h bracket holding an interpolated number. Tailwind extracts arbitrary values from source text, so the class compiles to no CSS — silently, and worse when a literal of the same shape exists elsewhere. Use a style prop, or a fixed set of literal classes.

throw new Error(...). Throw new Err("<module>.error.<key>") and register the key. Exempt: tests, *.constant.ts, common/**, env/** — the last two have no legal Err import path, so keep throwing code out of them.

st.do.<action>() is typed void, so a returned value is unreachable. Write it into state with this.set({ ... }).

onChange={(v) => st.do.setXOnY(v)}. Pass the setter by reference. A wrapper that transforms, adds a statement, or writes a nested path through writeOnX stays legal — publish that one with an explicit st.tool.

A cnst model on a prop of an always-client file. Take an id instead. Exempt: an indexed enum access, a ClientInit / ClientView / ClientEdit or ModelsProps type argument, a function-typed prop, and a cnst type that never leaves the file.

An endpoint whose name collides with generated CRUD — <model>, light/create/update/remove/view/edit/merge<Model>. The signal layer can pass typecheck and fail only at runtime, so treat it as an error even on a green build.

fetch.init<Model><Suffix> or fetch.get<Model>Init<Suffix> from a client file. Load it in the route; reload from the client through st.do.init<Model><Suffix>(). Matched by shape, so a hand-written initPayment is out of scope.

React has no async client component, so a ui/ component that awaits breaks as soon as a client parent renders it. Await in the page and take the resolved data as a prop. Only a PascalCase binding whose own initializer is async is matched.

A bang comment marker — two slashes or a block opener followed by an exclamation point — in browser-reachable code. Bun keeps it through minification, so the note ships to every visitor. Use a FIXME comment there. The diagnostic is file-level and always lands on line 1, so search the file for the marker.

logger.log() and Logger.log(). The ladder is trace verbose debug info warn error; log was a seventh tier below info that the production level silently dropped. The method is kept and emits at info, so the call reads like a level and is not one — write .info().

Three arms: an @apps or @libs import past the first two segments, a module file importing through ../../, and a module .tsx under lib/ using an internal relative import such as ../cnst. Cross-module constant references are the sanctioned exception.

Anything that is not relative, akanjs, @akanjs, @apps, @libs, @pkgs, @playwright, react or bun:test. Re-export the symbol through a lib first — the one-line shims in a lib's common/, webkit/ or ui/ exist for exactly this and are load-bearing.

A client file may not import a *.document, *.dictionary, *.service or *.signal, srvkit/, a package server entrypoint, or the db / srv / sig / dict / option / useServer barrels. import type is erased before bundling and stays legal; a mixed value-and-type import is not exempt.

The mirror image: a server file may not import a *.store, a module component, ui/, webkit/, a package client entrypoint, or the st / store / useClient barrels. common/ and *.constant.ts are held to both rules, so they reach neither side.

A React client hook or the store imported into a server component. Move the interaction into a client component and render it from the server one.

The directive at the top of a file whose role is always a server component. Split the interactive part out rather than converting the whole file.

A function expression handed as a prop from a server component. Allowed: loader, render, of. Pass data down and keep the callback inside the client component.

#private in the four suffixes the framework mixes into. Use a TypeScript private method with an underscore name. The rule is scoped by file path, not by class shape, so #private stays the house style under srvkit/ including adapt() classes.

Never hand-order Tailwind classes, and never re-order what the formatter produced. It also sorts the string arguments to cn(). Output such as font-bold text-2xl text-foreground is correct.

console.log and console.debug. Only assert, error, info and warn are allowed. Server code uses the injected this.logger or a new Logger("ClassName").

Removed by the formatter rather than reported at you. This is one reason a repo-wide akan lint rewrites files it was not asked about.

Off on purpose. key={idx} for an embedded scalar with no id of its own is intentional here, not an oversight.

Off on purpose. The short dependency arrays in this workspace are deliberate, and an effect that has to run once is written that way on purpose.

Lint Is Not About Style

You write bg-blue-500 on a badge. The page renders, the class is right there in the DOM, and the badge is the wrong colour. Nothing threw, nothing warned in the browser, and the only thing that knows is the linter you have not run yet.

Most of the rules below are that shape. They do not catch ugly code; they catch code that compiles, runs, looks correct, and quietly does nothing — a class with no CSS behind it, a form field that publishes no agent tool, a store action whose return value is unreachable, a comment that ships to every visitor.

Six You Will Meet First

Each of these names a rule, and the fix is mechanical once you know which one fired. The diagnostic prints the rule name; the pair below shows what it wants instead.

Every Rule That Breaks The Build

Twenty-two of these are grit plugins written for this workspace, scoped to the paths they apply to; the rest are Biome's own. The second column is where the rule looks, which is why a plain package under pkgs/ never trips the module-convention ones at all.

Suppressing One

A fixed colour is sometimes right — an OS-chrome mockup, a data-visualization scale, a vendor's brand. Those take a suppression, and the suppression carries a reason. There is no bare disable block anywhere in this workspace.

Commands

akan lint prints up to 200 diagnostics. Biome's own default is 20 with no count printed, which reads as progress when all that changed is the mix of findings.

Where the configuration lives:

biome.json at the repo root extends @akanjs/devkit/biome.base.json, which is where every grit plugin is scoped to the paths it applies to.

The plugin sources are @akanjs/devkit/lint/*.grit, one file per rule, each opening with a comment explaining what would break without it.

Generated files are excluded from linting and formatting entirely — cnst.ts, db.ts, dict.ts, sig.ts, srv.ts, st.ts, the facet barrels, and every env file.

## Code Examples

### apps/myapp/ui/BrowserChrome.tsx

```ts
// biome-ignore lint/plugin: macOS traffic lights are fixed colours, not theme tokens
<span className="bg-[#ff5f57]" />

// biome-ignore-all lint/plugin: every swatch in this file is a data-viz scale value
```

### Terminal

```bash
akan lint myapp                      # format and fix one app, lib, or package
akan lint myapp --max-diagnostics 0  # print every diagnostic
akan lintAll                         # every app and library
bunx biome check "apps/myapp/lib/order"   # report only, no writes
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Treat convention and generated-file rules as stronger than local style guesses.

