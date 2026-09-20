import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import type { AuthStorageBackend } from "@earendil-works/pi-coding-agent";

/**
 * Credential store for `akan code`, in akan's own file rather than the engine's.
 *
 * The engine only asks for a locked read-modify-write over one opaque string, so satisfying its interface with
 * our own file keeps every key under `~/.akan/` — nothing lands in `~/.pi/` and a user who removes akan takes
 * their credentials with them.
 *
 * The lock is an exclusive-create sentinel rather than an advisory flock: two `akan code` processes refreshing
 * an OAuth token at the same moment would otherwise each write a token the other invalidates.
 */
export class AkanAuthStorageBackend implements AuthStorageBackend {
  readonly #authPath: string;
  readonly #lockPath: string;

  constructor(authPath: string) {
    this.#authPath = authPath;
    this.#lockPath = `${authPath}.lock`;
  }

  withLock<T>(fn: (current: string | undefined) => { result: T; next?: string }) {
    this.#acquire();
    try {
      const { result, next } = fn(this.#read());
      if (next !== undefined) this.#write(next);
      return result;
    } finally {
      this.#release();
    }
  }

  async withLockAsync<T>(fn: (current: string | undefined) => Promise<{ result: T; next?: string }>) {
    this.#acquire();
    try {
      const { result, next } = await fn(this.#read());
      if (next !== undefined) this.#write(next);
      return result;
    } finally {
      this.#release();
    }
  }

  #read() {
    if (!existsSync(this.#authPath)) return undefined;
    const text = readFileSync(this.#authPath, "utf8");
    return text.trim() ? text : undefined;
  }

  #write(next: string) {
    mkdirSync(path.dirname(this.#authPath), { recursive: true, mode: 0o700 });
    const temp = `${this.#authPath}.${process.pid}.tmp`;
    writeFileSync(temp, next, { mode: 0o600 });
    renameSync(temp, this.#authPath);
  }

  #acquire() {
    mkdirSync(path.dirname(this.#lockPath), { recursive: true, mode: 0o700 });
    const deadline = Date.now() + 5_000;
    for (;;) {
      try {
        closeSync(openSync(this.#lockPath, "wx"));
        return;
      } catch {
        // A lock left behind by a killed process would block every later run, so it expires.
        if (this.#lockIsStale() || Date.now() > deadline) {
          try {
            unlinkSync(this.#lockPath);
          } catch {
            // Another process won the race to clear it; retry the create.
          }
          continue;
        }
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 20);
      }
    }
  }

  #lockIsStale() {
    try {
      return Date.now() - Bun.file(this.#lockPath).lastModified > 30_000;
    } catch {
      return true;
    }
  }

  #release() {
    try {
      unlinkSync(this.#lockPath);
    } catch {
      // Already gone — a stale-lock sweep by another process.
    }
  }
}
