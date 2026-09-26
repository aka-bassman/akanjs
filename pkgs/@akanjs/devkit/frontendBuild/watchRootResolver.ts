import fs from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { App } from "../commandDecorators";

/** Watch roots from tsconfig paths: `@apps/*` narrows to this app, `@libs/*` to its lib deps (whole when unknown). */
export class WatchRootResolver {
  #app: App;

  constructor(app: App) {
    this.#app = app;
  }

  async resolve(): Promise<string[]> {
    const tsconfig = await this.#app.getTsConfig();
    const appDir = path.resolve(this.#app.cwdPath);
    const appsContainer = path.dirname(appDir);
    const libsContainer = path.resolve(this.#app.workspace.workspaceRoot, "libs");
    const libRoots = (await this.#resolveLibDeps(libsContainer))
      ?.map((name) => path.join(libsContainer, name))
      .filter((dir) => fs.existsSync(dir));
    const set = new Set<string>();
    set.add(path.resolve(`${this.#app.cwdPath}/page`));
    for (const targets of Object.values(tsconfig.compilerOptions.paths ?? {})) {
      for (const target of targets) {
        if (!target) continue;
        if (path.isAbsolute(target)) continue;
        const cleaned = target.replace(/\/?\*+.*$/, "").replace(/\/[^/]+\.[^/]+$/, "");
        const resolved = path.resolve(this.#app.workspace.workspaceRoot, cleaned);
        if (resolved === libsContainer && libRoots) {
          for (const root of libRoots) set.add(root);
          continue;
        }
        const root = resolved === appsContainer ? appDir : resolved;
        if (fs.existsSync(root)) set.add(root);
      }
    }
    return [...set];
  }

  async #resolveLibDeps(libsContainer: string): Promise<string[] | null> {
    const scanInfo = this.#app.getScanInfo({ allowEmpty: true });
    // Transitive, but only in a process that scanned; the builder and idle watcher read the synced manifests.
    if (scanInfo?.type === "app") return scanInfo.libDeps;
    const direct = await WatchRootResolver.#readManifestLibDeps(path.join(this.#app.cwdPath, "akan.app.json"));
    if (!direct) return null;
    const closure = new Set<string>();
    const queue = [...direct];
    while (queue.length > 0) {
      const name = queue.shift();
      if (!name || closure.has(name)) continue;
      closure.add(name);
      const nested = await WatchRootResolver.#readManifestLibDeps(path.join(libsContainer, name, "akan.lib.json"));
      // An unsynced lib's own dependencies are unknowable, so no root can be ruled out.
      if (!nested) return null;
      queue.push(...nested);
    }
    return [...closure];
  }

  static async #readManifestLibDeps(manifestPath: string): Promise<string[] | null> {
    try {
      const parsed = JSON.parse(await readFile(manifestPath, "utf8")) as { libDeps?: unknown };
      if (!Array.isArray(parsed.libDeps)) return null;
      return parsed.libDeps.filter((name): name is string => typeof name === "string" && name.length > 0);
    } catch {
      // Missing before the first sync, and unparseable while sync is mid-write.
      return null;
    }
  }
}
