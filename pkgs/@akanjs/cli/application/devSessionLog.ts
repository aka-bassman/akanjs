import { mkdir, rename } from "node:fs/promises";
import path from "node:path";
import dayjs from "dayjs";
import { stripAnsi } from "./devLogBuffer";
import type { DevAppStatus } from "./devSupervisor";

export interface DevSessionLogOptions {
  workspaceRoot: string;
  apps: string[];
  now?: () => Date;
}

/**
 * One plain-text log per app for the life of a session, with the previous one kept beside it.
 *
 * The full-screen view is also what takes a session's scrollback away: Ink repaints a single frame in
 * place, so quitting leaves one bordered screenshot behind and the 5,000-line ring goes with the
 * process. This is the copy that outlives it, and it is what lets a log be handed over as a path rather
 * than as a selection — no ANSI, nothing truncated to the pane width, every process of the app in
 * arrival order.
 *
 * `AkanApp` already writes `runtime/logs/…`, but only from the gateway process and split per replica, so
 * the dev host's own build and bundler output — the part most worth handing to someone — reaches no file
 * at all. This starts a level up, at the pipes the supervisor reads, and holds that too.
 */
export class DevSessionLog {
  static readonly fileName = "dev.log";
  static readonly previousFileName = "dev.prev.log";
  /** Batches a busy boot without leaving a quiet session unwritten longer than a `tail -f` blink. */
  static readonly flushMs = 200;
  static readonly bufferBytes = 64 * 1024;

  readonly #workspaceRoot: string;
  readonly #appNames: string[];
  readonly #now: () => Date;
  readonly #writers = new Map<string, Bun.FileSink>();
  readonly #partial = new Map<string, string>();
  readonly #lastState = new Map<string, DevAppStatus["state"]>();
  #flushTimer: ReturnType<typeof setTimeout> | null = null;

  constructor({ workspaceRoot, apps, now = () => new Date() }: DevSessionLogOptions) {
    this.#workspaceRoot = workspaceRoot;
    this.#appNames = [...apps];
    this.#now = now;
  }

  get appNames(): string[] {
    return [...this.#appNames];
  }

  pathOf(app: string): string {
    return path.join(this.#runtimeDirOf(app), DevSessionLog.fileName);
  }

  previousPathOf(app: string): string {
    return path.join(this.#runtimeDirOf(app), DevSessionLog.previousFileName);
  }

  /** What a reader pastes into an editor or hands to an agent, so it stays short and checkout-agnostic. */
  relativePathOf(app: string): string {
    return path.relative(this.#workspaceRoot, this.pathOf(app));
  }

  async open() {
    const stamp = dayjs(this.#now()).format("YYYY-MM-DD HH:mm:ss");
    for (const app of this.#appNames) {
      const file = this.pathOf(app);
      await mkdir(path.dirname(file), { recursive: true });
      // `Bun.file().writer()` opens at offset 0 *without* truncating, so a session shorter than the last
      // would keep its tail; moving the old file away is what leaves an empty one behind.
      await rename(file, this.previousPathOf(app)).catch(() => undefined);
      this.#writers.set(app, Bun.file(file).writer({ highWaterMark: DevSessionLog.bufferBytes }));
      this.#writeLine(app, `── akan start · ${app} · ${stamp} ──`);
    }
  }

  write(app: string, kind: "stdout" | "stderr", chunk: string) {
    const key = `${app}:${kind}`;
    const parts = `${this.#partial.get(key) ?? ""}${chunk}`.split("\n");
    this.#partial.set(key, parts.pop() ?? "");
    // Stripped per completed line, never per chunk: an escape sequence can straddle a chunk boundary.
    for (const line of parts) this.#writeLine(app, stripAnsi(line));
  }

  /** Session-level, so it goes to every app's file rather than being lost from all but one of them. */
  note(text: string) {
    for (const app of this.#appNames) this.#writeLine(app, `[akan] ${text}`);
  }

  status(statuses: DevAppStatus[]) {
    for (const status of statuses) {
      if (this.#lastState.get(status.name) === status.state) continue;
      this.#lastState.set(status.name, status.state);
      const detail = status.detail ? ` (${status.detail})` : "";
      const where = status.state === "ready" ? ` — ${status.url}` : "";
      this.#writeLine(status.name, `[akan] ${status.name} ${status.state}${detail}${where}`);
    }
  }

  async close() {
    for (const [key, remainder] of this.#partial) {
      if (!remainder) continue;
      this.#writeLine(key.slice(0, key.lastIndexOf(":")), stripAnsi(remainder));
    }
    this.#partial.clear();
    if (this.#flushTimer) clearTimeout(this.#flushTimer);
    this.#flushTimer = null;
    await Promise.all([...this.#writers.values()].map(async (writer) => await writer.end()));
    this.#writers.clear();
  }

  #runtimeDirOf(app: string): string {
    return path.join(this.#workspaceRoot, "local", "apps", app, "runtime");
  }

  #writeLine(app: string, text: string) {
    const writer = this.#writers.get(app);
    if (!writer) return;
    writer.write(`${text}\n`);
    this.#scheduleFlush();
  }

  #scheduleFlush() {
    if (this.#flushTimer) return;
    this.#flushTimer = setTimeout(() => {
      this.#flushTimer = null;
      for (const writer of this.#writers.values()) void writer.flush();
    }, DevSessionLog.flushMs);
  }
}
