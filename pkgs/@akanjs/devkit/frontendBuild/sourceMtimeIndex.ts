import type { Dirent, Stats } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { HmrChangeClassifier } from "./hmrChangeClassifier";

interface TrackedFile {
  mtimeMs: number;
  size: number;
}

// NaN never equals a real mtime, so a directory held with it is re-walked on every scan.
const UNREADABLE = Number.NaN;

export interface SourceMtimeIndexOptions {
  roots: string[];
  classifier?: HmrChangeClassifier;
  /** Window (ms, default 20) in which a directory's mtime is too fresh to trust; raise it for whole-second stamps. */
  dirSettleMs?: number;
}

// Bun's recursive fs.watch reports about one path per ~200ms coalescing window and drops the rest, so changes are
// found by re-stating known files and re-reading only the directories whose own mtime moved.
export class SourceMtimeIndex {
  // Linux stamps directory mtimes on a coarse clock (1ms; 10ms on HZ=100), so a mutation in the same tick as the
  // recorded value leaves no trace — a directory that fresh is re-read on the next scan.
  static readonly #defaultDirSettleMs = 20;
  readonly #dirSettleMs: number;
  readonly #roots: string[];
  readonly #classifier: HmrChangeClassifier;
  readonly #files = new Map<string, TrackedFile>();
  readonly #dirs = new Map<string, number>();
  readonly #unreadable = new Map<string, string>();
  readonly #unsettled = new Set<string>();
  #primed = false;
  #queue: Promise<unknown> = Promise.resolve();

  constructor({ roots, classifier, dirSettleMs }: SourceMtimeIndexOptions) {
    this.#roots = SourceMtimeIndex.#pruneNestedRoots(roots);
    this.#classifier = classifier ?? new HmrChangeClassifier();
    this.#dirSettleMs = dirSettleMs ?? SourceMtimeIndex.#defaultDirSettleMs;
  }

  get primed(): boolean {
    return this.#primed;
  }

  get trackedFileCount(): number {
    return this.#files.size;
  }

  /** Paths the index cannot read right now; edits beneath them go unreported until a scan succeeds and clears them. */
  get coverageGaps(): { path: string; code: string }[] {
    return [...this.#unreadable].map(([file, code]) => ({ path: file, code }));
  }

  /** True when the last scan left a directory too fresh to trust; scan again once it settles, since nothing else will. */
  get hasUnsettledDirs(): boolean {
    return this.#unsettled.size > 0;
  }

  /** Baseline the tree; reports nothing. Call before the first `collectChanges`. */
  async prime(): Promise<void> {
    await this.#serialize(async () => {
      this.#files.clear();
      this.#dirs.clear();
      this.#unreadable.clear();
      this.#unsettled.clear();
      await Promise.all(this.#roots.map((root) => this.#walk(root, null)));
      this.#primed = true;
    });
  }

  /** Absolute paths changed or removed since the last call (the baseline advances); empty until primed. */
  async collectChanges(): Promise<string[]> {
    return this.#serialize(async () => {
      if (!this.#primed) return [];
      const changed = new Set<string>();
      await this.#collectFileChanges(changed);
      await this.#collectDirChanges(changed);
      return [...changed];
    });
  }

  // Scans must not overlap: one pruning the baseline mid-snapshot of another reports a change nobody made.
  async #serialize<T>(work: () => Promise<T>): Promise<T> {
    const run = this.#queue.then(work, work);
    this.#queue = run.catch(() => undefined);
    return run;
  }

  /** Baseline the caller's own writes so the next `collectChanges` skips them (a user save racing in between is lost). */
  async absorb(paths: string[]): Promise<void> {
    await this.#serialize(async () => {
      if (!this.#primed) return;
      await Promise.all(
        paths.map(async (file) => {
          const abs = path.resolve(file);
          const stats = await stat(abs).catch(() => null);
          if (!stats?.isFile()) {
            this.#files.delete(abs);
            return;
          }
          this.#files.set(abs, { mtimeMs: stats.mtimeMs, size: stats.size });
        }),
      );
    });
  }

  async #collectFileChanges(changed: Set<string>): Promise<void> {
    await Promise.all(
      [...this.#files.keys()].map(async (abs) => {
        const { stats, err } = await SourceMtimeIndex.#statPath(abs);
        if (!stats) {
          // Unreadable is not deleted: dropping it would invent a change and stop tracking the file.
          if (err && !SourceMtimeIndex.#isMissing(err)) {
            this.#unreadable.set(abs, err.code ?? "EUNKNOWN");
            return;
          }
          this.#files.delete(abs);
          this.#unreadable.delete(abs);
          changed.add(abs);
          return;
        }
        this.#unreadable.delete(abs);
        if (!stats.isFile()) {
          this.#files.delete(abs);
          changed.add(abs);
          return;
        }
        const known = this.#files.get(abs);
        if (known && known.mtimeMs === stats.mtimeMs && known.size === stats.size) return;
        this.#files.set(abs, { mtimeMs: stats.mtimeMs, size: stats.size });
        changed.add(abs);
      }),
    );
  }

  async #collectDirChanges(changed: Set<string>): Promise<void> {
    const moved = new Set<string>();
    const gone: string[] = [];
    await Promise.all(
      [...this.#dirs.entries()].map(async ([dir, mtimeMs]) => {
        const { stats, err } = await SourceMtimeIndex.#statPath(dir);
        if (!stats?.isDirectory()) {
          if (err && !SourceMtimeIndex.#isMissing(err)) {
            this.#markUnreadable(dir, err);
            return;
          }
          gone.push(dir);
          return;
        }
        if (stats.mtimeMs !== mtimeMs) moved.add(dir);
      }),
    );
    for (const dir of this.#unsettled) if (this.#dirs.has(dir)) moved.add(dir);
    for (const dir of gone) this.#forget(dir);
    // Sequential so concurrent `readdir` calls scale with the change rather than with the tree.
    for (const dir of moved) await this.#walk(dir, changed);
  }

  async #walk(dir: string, changed: Set<string> | null): Promise<void> {
    const [listing, dirStat] = await Promise.all([SourceMtimeIndex.#readdirPath(dir), SourceMtimeIndex.#statPath(dir)]);
    const entries = listing.entries;
    const dirStats = dirStat.stats;
    if (!entries || !dirStats?.isDirectory()) {
      // Unreadable is not gone: nothing re-stats a forgotten directory, so its subtree would stay invisible for good.
      const err = listing.err ?? dirStat.err;
      if (err && !SourceMtimeIndex.#isMissing(err)) {
        this.#markUnreadable(dir, err);
        return;
      }
      this.#forget(dir);
      return;
    }
    const known = this.#dirs.has(dir);
    this.#dirs.set(dir, dirStats.mtimeMs);
    this.#unreadable.delete(dir);
    if (this.#isUnsettled(dirStats.mtimeMs)) this.#unsettled.add(dir);
    else this.#unsettled.delete(dir);
    const descend: string[] = [];
    const present = new Set<string>();
    let blind = false;
    for (const entry of entries) {
      if (SourceMtimeIndex.#skipDirent(entry.name)) continue;
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        descend.push(abs);
        continue;
      }
      if (!entry.isFile()) continue;
      if (this.#classifier.classify(abs) === "ignore") continue;
      present.add(abs);
      const { stats, err } = await SourceMtimeIndex.#statPath(abs);
      if (!stats?.isFile()) {
        // No baseline for an unstat-able file; leaving the directory stale (below) is what retries it.
        if (err && !SourceMtimeIndex.#isMissing(err)) {
          this.#unreadable.set(abs, err.code ?? "EUNKNOWN");
          blind = true;
        }
        continue;
      }
      this.#unreadable.delete(abs);
      const previous = this.#files.get(abs);
      if (previous && previous.mtimeMs === stats.mtimeMs && previous.size === stats.size) continue;
      this.#files.set(abs, { mtimeMs: stats.mtimeMs, size: stats.size });
      changed?.add(abs);
    }
    if (known) {
      for (const abs of [...this.#files.keys()]) {
        if (present.has(abs) || path.dirname(abs) !== dir) continue;
        this.#files.delete(abs);
        changed?.add(abs);
      }
    }
    if (blind) {
      this.#dirs.set(dir, UNREADABLE);
      this.#unsettled.delete(dir);
    }
    // Known subdirectories carry their own mtime check; concurrent because `prime` walks the whole tree here.
    await Promise.all(descend.filter((sub) => !this.#dirs.has(sub)).map((sub) => this.#walk(sub, changed)));
  }

  #markUnreadable(dir: string, err: NodeJS.ErrnoException): void {
    this.#dirs.set(dir, UNREADABLE);
    this.#unreadable.set(dir, err.code ?? "EUNKNOWN");
    this.#unsettled.delete(dir);
  }

  #forget(dir: string): void {
    const prefix = `${dir}${path.sep}`;
    this.#dirs.delete(dir);
    this.#unreadable.delete(dir);
    this.#unsettled.delete(dir);
    for (const known of [...this.#dirs.keys()]) if (known.startsWith(prefix)) this.#dirs.delete(known);
    for (const known of [...this.#unreadable.keys()]) if (known.startsWith(prefix)) this.#unreadable.delete(known);
    for (const known of [...this.#unsettled]) if (known.startsWith(prefix)) this.#unsettled.delete(known);
  }

  // Symmetric so a filesystem clock running ahead of this process does not read as permanently fresh.
  #isUnsettled(mtimeMs: number): boolean {
    return Math.abs(Date.now() - mtimeMs) < this.#dirSettleMs;
  }

  static async #statPath(abs: string): Promise<{ stats: Stats | null; err: NodeJS.ErrnoException | null }> {
    try {
      return { stats: await stat(abs), err: null };
    } catch (err) {
      return { stats: null, err: err as NodeJS.ErrnoException };
    }
  }

  static async #readdirPath(dir: string): Promise<{ entries: Dirent[] | null; err: NodeJS.ErrnoException | null }> {
    try {
      return { entries: await readdir(dir, { withFileTypes: true }), err: null };
    } catch (err) {
      return { entries: null, err: err as NodeJS.ErrnoException };
    }
  }

  static #isMissing(err: NodeJS.ErrnoException): boolean {
    return err.code === "ENOENT" || err.code === "ENOTDIR";
  }

  // Mirrors HmrChangeClassifier's rules; symlinks are neither file nor directory, so they are skipped as fs.watch does.
  static #skipDirent(name: string): boolean {
    return !name || name.startsWith(".") || name === "node_modules";
  }

  /** `WatchRootResolver` can return `apps/<app>/page` alongside `apps/<app>`; walking both doubles the work. */
  static #pruneNestedRoots(roots: string[]): string[] {
    const resolved = [...new Set(roots.map((root) => path.resolve(root)))].sort();
    return resolved.filter(
      (root) => !resolved.some((other) => other !== root && root.startsWith(`${other}${path.sep}`)),
    );
  }
}
