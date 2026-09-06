import fs from "node:fs";
import path from "node:path";
import type { App } from "../commandDecorators";

/**
 * The directories one app's dev watcher follows, resolved from its tsconfig `paths`.
 *
 * `@apps/*` strips down to the `apps/` container, so taking it verbatim puts every sibling app under the
 * watcher: with two dev servers up, a save in app2 rebuilds, restarts and reloads app1, and both builders
 * rewrite the same generated barrels. Apps are leaves of the workspace graph — never one another's
 * dependencies — so the container is replaced by this app's own directory. `libs/` stays whole, because a
 * lib becomes a dependency the moment someone types the import, with no restart in between.
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
    const set = new Set<string>();
    set.add(path.resolve(`${this.#app.cwdPath}/page`));
    for (const targets of Object.values(tsconfig.compilerOptions.paths ?? {})) {
      for (const target of targets) {
        if (!target) continue;
        if (path.isAbsolute(target)) continue;
        // Strip the trailing filename and glob so we watch the package root dir.
        const cleaned = target.replace(/\/?\*+.*$/, "").replace(/\/[^/]+\.[^/]+$/, "");
        const resolved = path.resolve(this.#app.workspace.workspaceRoot, cleaned);
        const root = resolved === appsContainer ? appDir : resolved;
        if (fs.existsSync(root)) set.add(root);
      }
    }
    return [...set];
  }
}
