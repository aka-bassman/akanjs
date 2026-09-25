import { stat } from "node:fs/promises";
import path from "node:path";
import type { Logger } from "akanjs/common";
import type { App } from "../commandDecorators";
import { SOURCE_EXTS, type SourceFingerprints } from "./devHostPolicy";

const NON_SOURCE_EXT_RE =
  /\.(css|scss|sass|less|json|svg|png|jpe?g|webp|gif|avif|ico|woff2?|ttf|otf|mp3|mp4|wav|html)$/i;

const GRAPH_IMPORT_KINDS = new Set<Bun.ImportKind>([
  "import-statement",
  "require-call",
  "require-resolve",
  "dynamic-import",
]);

export class BackendImportGraph {
  readonly #app: App;
  readonly #logger: Logger;
  readonly #tsTranspiler = new Bun.Transpiler({ loader: "ts" });
  readonly #tsxTranspiler = new Bun.Transpiler({ loader: "tsx" });
  readonly #jsTranspiler = new Bun.Transpiler({ loader: "js" });
  readonly #jsxTranspiler = new Bun.Transpiler({ loader: "jsx" });
  #files = new Set<string>();
  /**
   * `refresh()` runs on every server-side save and on every dev-host recycle, and re-reading plus
   * re-parsing files that did not change is the whole cost of it. Keyed on (mtimeMs, size).
   *
   * Specifiers are cached, not resolved paths: creating a file can change what an *unchanged* importer's
   * specifier resolves to, and `Bun.resolveSync` is cheap next to a read plus a transpiler scan. Only
   * the scan result is retained — never the source text.
   */
  #scanCache = new Map<string, { mtimeMs: number; size: number; specifiers: Bun.Import[] }>();
  #ready = false;
  #lastRefreshSucceeded = false;

  constructor(app: App, logger: Logger) {
    this.#app = app;
    this.#logger = logger;
  }

  get ready() {
    return this.#ready;
  }

  get lastRefreshSucceeded() {
    return this.#lastRefreshSucceeded;
  }

  has(file: string) {
    return this.#files.has(path.resolve(file));
  }

  /**
   * Stamp every file the backend runs, so a caller can ask later what moved.
   *
   * Taken when the builder goes away and compared when its replacement is up, because nothing watches
   * the tree in between: the departing builder's watcher left with it, and the replacement's index
   * primes from the disk it finds, so an edit that lands in the gap is *baseline* to it and is never
   * reported at all. The client half of such an edit is rescued by the replacement's boot build; the
   * backend half is a server left running code that no longer exists, with nothing on screen to say so.
   *
   * One `stat` per graph file, against a gap that costs a whole boot build anyway.
   */
  async fingerprint(): Promise<SourceFingerprints> {
    const stamps = await Promise.all(
      [...this.#files].map(async (file) => {
        const stats = await stat(file).catch(() => null);
        return [file, stats ? `${Math.round(stats.mtimeMs)}:${stats.size}` : "(gone)"] as const;
      }),
    );
    return new Map(stamps);
  }

  async refresh(): Promise<boolean> {
    try {
      const files = await this.#build();
      this.#files = files;
      this.#ready = true;
      this.#lastRefreshSucceeded = true;
      this.#logger.verbose(`[backend-graph] scanned ${files.size} files`);
      return true;
    } catch (err) {
      this.#ready = this.#files.size > 0;
      this.#lastRefreshSucceeded = false;
      this.#logger.warn(
        `[backend-graph] scan failed; ${this.#ready ? "using previous graph" : "using fallback rules"}: ${err instanceof Error ? err.message : String(err)}`,
      );
      return this.#ready;
    }
  }

  async #build(): Promise<Set<string>> {
    const roots = await this.#entrypoints();
    const files = new Set<string>();
    const queue = [...roots];
    const workspaceRoot = path.resolve(this.#app.workspace.workspaceRoot);

    while (queue.length > 0) {
      const current = path.resolve(queue.pop() as string);
      if (files.has(current)) continue;
      if (!this.#isWorkspaceSource(current, workspaceRoot)) continue;
      const imports = await this.#importsOf(current);
      if (!imports) continue;

      files.add(current);
      const importerDir = path.dirname(current);
      for (const imp of imports) {
        if (!GRAPH_IMPORT_KINDS.has(imp.kind) || !imp.path || NON_SOURCE_EXT_RE.test(imp.path)) continue;
        const resolved = this.#resolve(imp.path, importerDir);
        if (!resolved || files.has(resolved)) continue;
        queue.push(resolved);
      }
    }
    // Files that dropped out of the graph would otherwise be cached for the life of the dev session.
    for (const cached of this.#scanCache.keys()) if (!files.has(cached)) this.#scanCache.delete(cached);
    return files;
  }

  /** Null when the file is gone, which is the existence check the walk used to make separately. */
  async #importsOf(file: string): Promise<Bun.Import[] | null> {
    const stats = await stat(file).catch(() => null);
    if (!stats?.isFile()) return null;
    const mtimeMs = Math.round(stats.mtimeMs);
    const cached = this.#scanCache.get(file);
    if (cached && cached.mtimeMs === mtimeMs && cached.size === stats.size) return cached.specifiers;
    const specifiers = this.#scanImports(file, await Bun.file(file).text());
    this.#scanCache.set(file, { mtimeMs, size: stats.size, specifiers });
    return specifiers;
  }

  async #entrypoints(): Promise<string[]> {
    const roots = [`${this.#app.cwdPath}/main.ts`, `${this.#app.cwdPath}/server.ts`];
    const existing: string[] = [];
    for (const root of roots) {
      const abs = path.resolve(root);
      if (await Bun.file(abs).exists()) existing.push(abs);
    }
    return existing;
  }

  #resolve(specifier: string, importerDir: string): string | null {
    try {
      const resolved = Bun.resolveSync(specifier, importerDir);
      if (!path.isAbsolute(resolved)) return null;
      if (!SOURCE_EXTS.has(path.extname(resolved).toLowerCase())) return null;
      return path.resolve(resolved);
    } catch {
      return null;
    }
  }

  #isWorkspaceSource(file: string, workspaceRoot: string): boolean {
    const rel = path.relative(workspaceRoot, file);
    if (rel.startsWith("..") || path.isAbsolute(rel)) return false;
    if (rel.includes(`${path.sep}node_modules${path.sep}`) || rel.includes(`${path.sep}.akan${path.sep}`)) return false;
    return SOURCE_EXTS.has(path.extname(file).toLowerCase());
  }

  #scanImports(file: string, source: string): Bun.Import[] {
    const ext = path.extname(file).toLowerCase();
    if (ext === ".tsx") return this.#tsxTranspiler.scanImports(source);
    if (ext === ".jsx") return this.#jsxTranspiler.scanImports(source);
    if (ext === ".js" || ext === ".mjs" || ext === ".cjs") return this.#jsTranspiler.scanImports(source);
    return this.#tsTranspiler.scanImports(source);
  }
}
