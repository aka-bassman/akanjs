import { describe, expect, test } from "bun:test";
import { readdir } from "node:fs/promises";
import path from "node:path";
import {
  appRootAllowedDirs,
  appRootAllowedFiles,
  isAllowedLibFacetRootFile,
  isScannedRootEntry,
  libRootAllowedDirs,
  libRootAllowedFiles,
  rootEntryHintOf,
} from "./workspaceLayout";

describe("app root layout allowlist", () => {
  test("admits the scoped agent guides sync writes into every app", () => {
    expect(appRootAllowedFiles.has("AGENTS.md")).toBe(true);
    expect(appRootAllowedFiles.has("CLAUDE.md")).toBe(true);
  });

  test("admits every documented app root folder", () => {
    for (const dirname of [".akan", "plugin", "script", "secrets", "srvkit", "webkit"]) {
      expect(appRootAllowedDirs.has(dirname)).toBe(true);
    }
  });

  test("admits the native plugins an app owns, and a lib too", () => {
    expect(appRootAllowedDirs.has("native")).toBe(true);
    expect(libRootAllowedDirs.has("native")).toBe(true);
  });

  test("rejects an app root entry no facet owns", () => {
    expect(appRootAllowedFiles.has("helper.ts")).toBe(false);
    expect(appRootAllowedDirs.has("base")).toBe(false);
  });

  test("names what a Capacitor app kept in its root as a leftover, not an unknown entry", () => {
    for (const name of ["android", "ios", "mobile", "capacitor.config.ts", "capacitor.config.json"]) {
      expect(appRootAllowedFiles.has(name) || appRootAllowedDirs.has(name)).toBe(false);
      expect(rootEntryHintOf("app", name)).toContain(".akan/native/<target>");
    }
    expect(rootEntryHintOf("app", "base")).toBeNull();
    expect(rootEntryHintOf("lib", "ios")).toBeNull();
  });

  test("skips dotfile artifacts the sync glob never sees, but keeps .akan", () => {
    expect(isScannedRootEntry("app", ".DS_Store")).toBe(false);
    expect(isScannedRootEntry("app", ".akan")).toBe(true);
    expect(isScannedRootEntry("app", "lib")).toBe(true);
  });
});

describe("lib root layout allowlist", () => {
  test("admits what the libRoot template and scan write", () => {
    for (const filename of ["AGENTS.md", "akan.config.ts", "akan.lib.json", "client.ts", "index.ts", "server.ts"]) {
      expect(libRootAllowedFiles.has(filename)).toBe(true);
    }
    for (const dirname of ["common", "env", "lib", "page", "plugin", "private", "public", "srvkit", "ui", "webkit"]) {
      expect(libRootAllowedDirs.has(dirname)).toBe(true);
    }
  });

  test("rejects a lib root entry no facet owns", () => {
    expect(libRootAllowedFiles.has("helper.ts")).toBe(false);
    expect(libRootAllowedDirs.has("base")).toBe(false);
  });

  test("rejects the app-only run and mobile entries", () => {
    for (const filename of ["main.ts", "akan.app.json"]) {
      expect(libRootAllowedFiles.has(filename)).toBe(false);
    }
    for (const dirname of [".akan", "script", "secrets"]) {
      expect(libRootAllowedDirs.has(dirname)).toBe(false);
    }
  });

  test("skips dotfile artifacts in a lib root too", () => {
    expect(isScannedRootEntry("lib", ".gitignore")).toBe(false);
    expect(isScannedRootEntry("lib", ".akan")).toBe(false);
    expect(isScannedRootEntry("lib", "ui")).toBe(true);
  });
});

describe("lib facet root allowlist", () => {
  test("admits the generated support facets and a root signal test", () => {
    expect(isAllowedLibFacetRootFile("cnst.ts")).toBe(true);
    expect(isAllowedLibFacetRootFile("option.ts")).toBe(true);
    expect(isAllowedLibFacetRootFile("user.signal.test.ts")).toBe(true);
    expect(isAllowedLibFacetRootFile("user.signal.spec.ts")).toBe(true);
  });

  test("rejects a hand-written file beside the barrels", () => {
    expect(isAllowedLibFacetRootFile("helper.ts")).toBe(false);
    expect(isAllowedLibFacetRootFile("user.test.ts")).toBe(false);
  });
});

const templatesDir = path.join(import.meta.dir, "..", "cli", "templates");

type TsConfig = { references?: { path: string }[] };

const loadRootTemplate = async (dir: string): Promise<TsConfig> =>
  JSON.parse(await Bun.file(path.join(templatesDir, dir, "tsconfig.json.template")).text());

const templateDirsWithRootTsconfig = async (): Promise<string[]> => {
  const entries = await readdir(templatesDir, { withFileTypes: true });
  const dirs: string[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (await Bun.file(path.join(templatesDir, entry.name, "tsconfig.json.template")).exists()) dirs.push(entry.name);
  }
  return dirs.sort((a, b) => a.localeCompare(b));
};

describe("cli root tsconfig templates vs workspace scan allowlists", () => {
  test("only the app and libRoot root templates may declare references", async () => {
    const dirs = await templateDirsWithRootTsconfig();
    for (const dir of ["app", "libRoot", "pkgRoot", "workspaceRoot"]) expect(dirs).toContain(dir);
    for (const dir of dirs) {
      const tsconfig = await loadRootTemplate(dir);
      if (!tsconfig.references) continue;
      expect(["app", "libRoot"], `${dir} template declares references`).toContain(dir);
    }
  });

  test("app template references stay inside appRootAllowedFiles", async () => {
    const tsconfig = await loadRootTemplate("app");
    for (const reference of tsconfig.references ?? []) {
      const filename = path.basename(reference.path);
      expect(appRootAllowedFiles.has(filename), `app template references "${reference.path}"`).toBe(true);
    }
  });

  test("libRoot template references stay inside libRootAllowedFiles", async () => {
    const tsconfig = await loadRootTemplate("libRoot");
    for (const reference of tsconfig.references ?? []) {
      const filename = path.basename(reference.path);
      expect(libRootAllowedFiles.has(filename), `libRoot template references "${reference.path}"`).toBe(true);
    }
  });

  test("pkgRoot and workspaceRoot templates declare no references", async () => {
    for (const dir of ["pkgRoot", "workspaceRoot"]) {
      const tsconfig = await loadRootTemplate(dir);
      expect(tsconfig.references, `${dir} template must not declare references`).toBeUndefined();
    }
  });
});
