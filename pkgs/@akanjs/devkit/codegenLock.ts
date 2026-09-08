import { mkdir, open, readFile, rm, stat } from "node:fs/promises";
import path from "node:path";
import { Logger } from "akanjs/common";

interface LockHolder {
  pid: number;
  at: number;
  label: string;
}

/**
 * A workspace-wide mutex over the generated source files every dev server in the workspace rewrites.
 *
 * `WatchRootResolver` narrows each dev server to its own app and its own lib dependencies, but two apps
 * that share a lib still both watch it, so a save there reaches both builders and both regenerate the
 * same barrel. Whichever watcher is mid-scan then reads a half-written file back as a user edit, which is
 * a rebuild per rewrite. `scanSync` writes the same files at boot for every mounting app.
 *
 * A wait that expires proceeds *without* the lock rather than failing: this sits on the dev server's
 * hot path, and stalling the file watcher is worse than the torn read `FileSys.writeTextAtomic` already
 * prevents on its own.
 */
export class CodegenLock {
  static readonly fileName = "codegen.lock";
  static readonly waitTimeoutMs = 10_000;
  /**
   * How long an unreadable lock file is respected. It covers the window between the exclusive create
   * and the holder write, where the file exists but names no pid yet — a young one is somebody else
   * mid-acquire, not a corpse.
   */
  static readonly unknownHolderStaleMs = 60_000;
  static readonly #pollMs = 25;
  static readonly #logger = new Logger("CodegenLock");
  /** Serializes callers inside this process, which one `O_EXCL` file cannot tell apart. */
  static #queue: Promise<void> = Promise.resolve();

  static pathIn(workspaceRoot: string) {
    return path.join(workspaceRoot, "local", ".akan", CodegenLock.fileName);
  }

  static async run<T>(workspaceRoot: string, label: string, fn: () => Promise<T>): Promise<T> {
    const ahead = CodegenLock.#queue;
    let done!: () => void;
    CodegenLock.#queue = new Promise<void>((resolve) => {
      done = resolve;
    });
    try {
      await CodegenLock.#waitForQueue(ahead, label);
      return await CodegenLock.#withFileLock(workspaceRoot, label, fn);
    } finally {
      done();
    }
  }

  static async #waitForQueue(ahead: Promise<void>, label: string) {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const expired = new Promise<"expired">((resolve) => {
      timer = setTimeout(() => resolve("expired"), CodegenLock.waitTimeoutMs);
    });
    try {
      if ((await Promise.race([ahead.then(() => "done" as const), expired])) === "expired")
        CodegenLock.#logger.warn(
          `codegen lock queued past ${CodegenLock.waitTimeoutMs}ms in this process; continuing without waiting (${label})`,
        );
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  static async #withFileLock<T>(workspaceRoot: string, label: string, fn: () => Promise<T>): Promise<T> {
    const lockPath = CodegenLock.pathIn(workspaceRoot);
    await mkdir(path.dirname(lockPath), { recursive: true }).catch(() => undefined);
    const held = await CodegenLock.#acquire(lockPath, label);
    try {
      return await fn();
    } finally {
      if (held) await rm(lockPath, { force: true }).catch(() => undefined);
    }
  }

  static async #acquire(lockPath: string, label: string): Promise<boolean> {
    const deadline = Date.now() + CodegenLock.waitTimeoutMs;
    for (;;) {
      const handle = await open(lockPath, "wx").catch(() => null);
      if (handle) {
        await handle
          .writeFile(JSON.stringify({ pid: process.pid, at: Date.now(), label } satisfies LockHolder))
          .catch(() => undefined);
        await handle.close().catch(() => undefined);
        return true;
      }
      if (await CodegenLock.#reclaimIfAbandoned(lockPath)) continue;
      if (Date.now() >= deadline) {
        CodegenLock.#logger.warn(
          `codegen lock at ${lockPath} held past ${CodegenLock.waitTimeoutMs}ms; continuing without it (${label})`,
        );
        return false;
      }
      await Bun.sleep(CodegenLock.#pollMs);
    }
  }

  /** A live holder is never reclaimed — the wait timeout is what bounds a pathologically slow one. */
  static async #reclaimIfAbandoned(lockPath: string): Promise<boolean> {
    const info = await stat(lockPath).catch(() => null);
    if (!info) return true;
    const holder = CodegenLock.#parseHolder(await readFile(lockPath, "utf8").catch(() => ""));
    if (holder) {
      if (CodegenLock.#isAlive(holder.pid)) return false;
    } else if (Date.now() - info.mtimeMs < CodegenLock.unknownHolderStaleMs) return false;
    await rm(lockPath, { force: true }).catch(() => undefined);
    return true;
  }

  static #parseHolder(raw: string): LockHolder | null {
    try {
      const parsed = JSON.parse(raw) as Partial<LockHolder>;
      if (typeof parsed.pid !== "number" || typeof parsed.at !== "number") return null;
      return { pid: parsed.pid, at: parsed.at, label: typeof parsed.label === "string" ? parsed.label : "" };
    } catch {
      // A truncated holder file names no pid, so it is aged by mtime instead.
      return null;
    }
  }

  static #isAlive(pid: number): boolean {
    if (!Number.isInteger(pid) || pid <= 0) return false;
    try {
      process.kill(pid, 0);
      return true;
    } catch (error) {
      // EPERM is a pid that exists under another user, which still holds the lock.
      return (error as NodeJS.ErrnoException).code === "EPERM";
    }
  }
}
