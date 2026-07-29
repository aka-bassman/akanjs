---
"akanjs": patch
---

perf(cli): keep heavy dependencies out of the long-lived dev processes

`akan start` holds the CLI entry and the builder watcher for the whole dev session, so an
eagerly imported dependency is resident for the whole session too.

- The dev host reached `@inquirer/prompts` (~24MB) because `runCommands` shares a module
  with the interactive argument fallbacks. Those now load the prompt stack on first use,
  which for `akan start` is never.
- The builder watcher reached `tailwindcss` and `@tailwindcss/node` (~40MB) through the
  `frontendBuild` barrel, which re-exports `cssCompiler` and `ssrBaseArtifactBuilder`. That
  has been dead weight since css compilation moved into the batch worker; the watcher now
  imports by module path.

`entryModuleGraph.test.ts` guards both by walking each built entry's chunk closure. The
previous check grepped the entry file alone, which cannot see a dependency reached through
a shared chunk and so reported both of these as absent.
