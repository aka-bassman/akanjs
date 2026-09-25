import fs from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { App } from "../commandDecorators";

/**
 * The directories one app's dev watcher follows, resolved from its tsconfig `paths`.
 *
 * Two aliases strip down to a workspace container rather than a package, and taking either verbatim puts
 * code the app never imports under the watcher — where a save rebuilds, restarts and reloads it for
 * nothing, and both builders rewrite the same generated barrels:
 *
 * - `@apps/*` becomes the `apps/` container. Apps are leaves of the workspace graph — never one another's
 *   dependencies — so it is replaced by this app's own directory.
 * - `@libs/*` becomes the `libs/` container. A lib is a dependency only if the app reaches it, so it is
 *   replaced by the app's own lib dependencies, transitively. The set is resolved once, at watcher
 *   install: a lib that becomes a dependency mid-session needs a fresh `akan start` anyway, because the
 *   import that made it one also needs a `sync`.
 *
 * Failing to resolve that set keeps the container whole, because a wrong narrowing is a dev server that
 * silently ignores edits.
 */
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
    const libRoots = await this.#resolveLibRoots(libsContainer);
    const set = new Set<string>();
    set.add(path.resolve(`${this.#app.cwdPath}/page`));
    for (const targets of Object.values(tsconfig.compilerOptions.paths ?? {})) {
      for (const target of targets) {
        if (!target) continue;
        if (path.isAbsolute(target)) continue;
        // Strip the trailing filename and glob so we watch the package root dir.
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

  async #resolveLibRoots(libsContainer: string): Promise<string[] | null> {
    const libDeps = await this.#resolveLibDeps(libsContainer);
    if (!libDeps) return null;
    return libDeps.map((name) => path.join(libsContainer, name)).filter((dir) => fs.existsSync(dir));
  }

  async #resolveLibDeps(libsContainer: string): Promise<string[] | null> {
    const scanInfo = this.#app.getScanInfo({ allowEmpty: true });
    // Already transitive, and present whenever this runs in a process that scanned. The builder and the
    // idle watcher run in processes that did not, so they take the manifests `scan` wrote instead.
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
