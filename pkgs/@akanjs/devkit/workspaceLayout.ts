// The one source of the app/lib root allowlists (sync, doctor and quality scan read it); mirror a change into the
// root AGENTS.md list.

export type SysType = "app" | "lib";

export const appRootAllowedFiles = new Set([
  "AGENTS.md",
  "CLAUDE.md",
  "akan.app.json",
  "akan.config.ts",
  "client.ts",
  "main.ts",
  "package.json",
  "server.ts",
  "tsconfig.json",
  "tsconfig.tsbuildinfo",
]);

export const appRootAllowedDirs = new Set([
  ".akan",
  "common",
  "env",
  "lib",
  "native",
  "page",
  "plugin",
  "private",
  "public",
  "script",
  "secrets",
  "srvkit",
  "ui",
  "webkit",
]);

// A library is never booted or packaged as an app, so the run/mobile entries are out; it is published, so README stays.
export const libRootAllowedFiles = new Set([
  "AGENTS.md",
  "CLAUDE.md",
  "README.md",
  "akan.config.ts",
  "akan.lib.json",
  "client.ts",
  "index.ts",
  "package.json",
  "server.ts",
  "tsconfig.json",
  "tsconfig.spec.json",
  "tsconfig.tsbuildinfo",
]);

export const libRootAllowedDirs = new Set([
  "common",
  "env",
  "lib",
  "native",
  "page",
  "plugin",
  "private",
  "public",
  "srvkit",
  "ui",
  "webkit",
]);

export const rootAllowedFiles = { app: appRootAllowedFiles, lib: libRootAllowedFiles } as const;
export const rootAllowedDirs = { app: appRootAllowedDirs, lib: libRootAllowedDirs } as const;

export const libFacetRootAllowedFiles = new Set([
  "cnst.ts",
  "db.ts",
  "dict.ts",
  "option.ts",
  "sig.ts",
  "srv.ts",
  "st.ts",
  "useClient.ts",
  "useServer.ts",
]);

export const isAllowedLibFacetRootFile = (filename: string) => libFacetRootAllowedFiles.has(filename);

/** What to do with a test at the lib root: it belongs in the module folder it covers. */
export const libFacetRootFileHintOf = (filename: string) => {
  const test = /^([A-Za-z][A-Za-z0-9_-]*?)(?:\.[A-Za-z0-9_-]+)*\.(test|spec)\.(ts|tsx)$/.exec(filename);
  if (!test) return null;
  const [, model] = test;
  return `a test lives in the module folder it covers: move it to lib/${model}/${model}.signal.${test[2]}.ts (a further suite becomes a describe there), and an app-wide harness to srvkit/*.spec.ts or lib/_<app>/<app>.signal.spec.ts`;
};

/** `<model>.<qualifier>.signal.test.ts` in a module folder: one module keeps one signal test, `<model>.signal.test.ts`. */
export const qualifiedSignalTestOf = (moduleName: string, fileName: string) => {
  const signalTest = /^(.+)\.signal\.test\.(ts|tsx)$/.exec(fileName);
  const model = moduleName.replace(/^_+/, "");
  if (!signalTest || signalTest[1] === model) return null;
  return `one signal test per module: ${model}.signal.test.ts, with this suite as a nested describe in it`;
};

export const barrelFacetDirs = ["ui", "webkit", "srvkit", "common", "plugin"] as const;

//* Bun resolves a folder import to `index.tsx`, `index.jsx` or `index.mts` ahead of `index.ts`, and TypeScript to
//* `index.ts` first, so one of these beside the generated barrel typechecks every name the barrel adds and serves none.
const barrelShadowingIndexFiles = new Set(["index.tsx", "index.jsx", "index.mts"]);

export const facetIndexShadowOf = (sysRelativePath: string) => {
  const [facet, filename = "", ...nested] = sysRelativePath.split("/");
  if (nested.length || !barrelShadowingIndexFiles.has(filename) || !barrelFacetDirs.some((dir) => dir === facet))
    return null;
  return (
    `shadows the generated ${facet}/index.ts: Bun loads ${filename} and TypeScript checks index.ts, so a name only ` +
    `the generated barrel exports typechecks and is undefined at runtime. Delete it, since the generated barrel ` +
    `re-exports every file and folder in ${facet}/; a namespace it builds belongs in ${facet}/<Folder>/index.tsx`
  );
};

//* What a Capacitor app kept in its root. The native runtime generates its projects under `dist/native/<app>/<target>`, so
//* these are named as leftovers instead of as unknown entries.
const retiredAppRootEntries = new Set([
  "android",
  "ios",
  "mobile",
  "capacitor.config.ts",
  "capacitor.config.js",
  "capacitor.config.json",
]);

export const rootEntryHintOf = (type: SysType, name: string) =>
  type === "app" && retiredAppRootEntries.has(name)
    ? "a Capacitor-era entry; the native runtime generates its projects under dist/native/<app>/<target>, so delete it"
    : null;

// scanSync reads roots through `Bun.Glob("*")`, which skips dotfiles, so doctor skips them the same way.
export const isScannedRootEntry = (type: SysType, name: string) =>
  !name.startsWith(".") || rootAllowedDirs[type].has(name);
