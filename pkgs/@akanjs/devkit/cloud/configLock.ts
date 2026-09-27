import { mkdir, open, readFile, rm, stat } from "node:fs/promises";
import path from "node:path";

interface LockHolder {
  pid: number;
  at: number;
}

// Across processes, not only calls: two `akan` commands started together share one `~/.akan/config.json`. A live
// holder is never reclaimed, so a wait that runs out fails rather than proceeding without the lock.
export class ConfigLock {
  static readonly waitTimeoutMs = 30_000;
  // A holder-less lock file younger than this is someone between the exclusive create and the write.
  static readonly #unknownHolderStaleMs = 10_000;
  static readonly #pollMs = 50;

  static async run<T>(lockPath: string, fn: () => Promise<T>): Promise<T> {
    await mkdir(path.dirname(lockPath), { recursive: true, mode: 0o700 });
    const deadline = Date.now() + ConfigLock.waitTimeoutMs;
    while (!(await ConfigLock.#take(lockPath))) {
      if (Date.now() >= deadline) {
        const holder = (await ConfigLock.#holder(lockPath))?.pid ?? "unknown";
        throw new Error(
          `${lockPath} is held by process ${holder}; if no akan command is running, delete it and retry.`,
        );
      }
      await ConfigLock.#reclaimIfAbandoned(lockPath);
      await Bun.sleep(ConfigLock.#pollMs);
    }
    try {
      return await fn();
    } finally {
      await rm(lockPath, { force: true });
    }
  }

  static async #take(lockPath: string) {
    const handle = await open(lockPath, "wx", 0o600).catch((error: NodeJS.ErrnoException) => {
      if (error.code === "EEXIST") return null;
      throw error;
    });
    if (!handle) return false;
    try {
      await handle.writeFile(JSON.stringify({ pid: process.pid, at: Date.now() } satisfies LockHolder));
    } finally {
      await handle.close();
    }
    return true;
  }

  // Exclusive too: a waiter acting on its own stale read could delete the lock another waiter took a moment later.
  static async #reclaimIfAbandoned(lockPath: string) {
    if (!(await ConfigLock.#abandoned(lockPath))) return;
    const guard = `${lockPath}.reclaim`;
    if (!(await ConfigLock.#take(guard))) {
      if (await ConfigLock.#abandoned(guard)) await rm(guard, { force: true });
      return;
    }
    try {
      if (await ConfigLock.#abandoned(lockPath)) await rm(lockPath, { force: true });
    } finally {
      await rm(guard, { force: true });
    }
  }

  static async #abandoned(lockPath: string) {
    const info = await stat(lockPath).catch(() => null);
    if (!info) return false;
    const holder = await ConfigLock.#holder(lockPath);
    if (!holder) return Date.now() - info.mtimeMs > ConfigLock.#unknownHolderStaleMs;
    return !ConfigLock.#isAlive(holder.pid);
  }

  static async #holder(lockPath: string): Promise<LockHolder | null> {
    try {
      const parsed = JSON.parse(await readFile(lockPath, "utf8")) as Partial<LockHolder>;
      return typeof parsed.pid === "number" && typeof parsed.at === "number"
        ? { pid: parsed.pid, at: parsed.at }
        : null;
    } catch {
      // Missing, or caught between the create and the write; either way it names no holder.
      return null;
    }
  }

  static #isAlive(pid: number) {
    if (!Number.isInteger(pid) || pid <= 0) return false;
    try {
      process.kill(pid, 0);
      return true;
    } catch (error) {
      // EPERM is a pid that exists under another user, which still counts as holding the lock.
      return (error as NodeJS.ErrnoException).code === "EPERM";
    }
  }
}
