import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { type AkanI18nConfig, DEFAULT_AKAN_I18N, Logger } from "akanjs/common";
import type { AkanTheme } from "akanjs/fetch";
import type { AkanMetricsReport } from "akanjs/service";
import type { ClientManifest } from "./artifact";
import type { BaseBuildArtifact, CssAsset } from "./types";

interface RscPending {
  onChunk: (data: Uint8Array) => void;
  onEnd: () => void;
  onError: (message: string) => void;
  onMeta?: (meta: { theme?: AkanTheme; status?: number }) => void;
  onRedirect?: (location: string, method: RscRedirectMethod) => void;
  onNotFound?: () => void;
}

export type RscRedirectMethod = "replace" | "push";

export type RscRenderResult =
  | { type: "stream"; stream: ReadableStream<Uint8Array>; theme?: AkanTheme; status?: number }
  | { type: "redirect"; location: string; method: RscRedirectMethod }
  | { type: "not-found" };

type RscInMsg =
  | { type: "hello" }
  | { type: "ready" }
  | { type: "reloaded"; buildId: number }
  | { type: "meta"; requestId: string; theme?: AkanTheme; status?: number }
  | { type: "chunk"; requestId: string; data: Uint8Array }
  | { type: "end"; requestId: string }
  | { type: "redirect"; requestId: string; location: string; method?: RscRedirectMethod }
  | { type: "not-found"; requestId: string }
  | { type: "metrics"; metrics: AkanMetricsReport }
  | { type: "error"; requestId: string; message: string; buildId?: number };

export interface RscWorkerReloadInput {
  clientManifest: ClientManifest;
  cssAssets?: Record<string, CssAsset>;
  buildId: number;
  /**
   * When the builder emits a freshly bundled `pages-*.js` the host forwards
   * the new absolute path here so the worker re-imports the new bundle.
   * Undefined means "keep using the current bundle" (e.g. client-manifest-only
   * reload after a lazy route build).
   */
  pagesBundlePath?: string;
}

export interface RscWorkerRestartOptions {
  /** Initial delay before the first restart attempt. Default: 200ms. */
  baseDelayMs?: number;
  /** Upper bound for the exponential backoff. Default: 30s. */
  maxDelayMs?: number;
  /**
   * Give up after this many consecutive failed restarts. `undefined` (default)
   * means retry forever so a short-lived supervisor outage doesn't wedge the
   * SSR path permanently.
   */
  maxAttempts?: number;
}

export interface RscWorkerOptions {
  clientManifest: ClientManifest;
  /**
   * Absolute path to the pre-built server pages bundle. Produced by
   * `akanjs/devkit`'s `PagesBundleBuilder`; the RSC worker imports it with
   * `await import(bundlePath?v=<buildId>)` — no runtime transforms.
   */
  pagesBundlePath: string;
  /** Initial build id for the pages bundle (see `pagesBundlePath`). */
  pagesBundleBuildId: number;
  cssAssets?: Record<string, CssAsset>;
  i18n?: AkanI18nConfig;
  /** Exponential-backoff settings for automatic crash recovery. */
  restart?: RscWorkerRestartOptions;
}

type WorkerStatus = "starting" | "ready" | "restarting" | "stopped";

export class RscWorker {
  readonly ready: Promise<void>;
  #logger = new Logger("RscWorker");

  #proc: Bun.Subprocess<"ignore", "inherit", "inherit">;
  readonly #pending = new Map<string, RscPending>();
  #clientManifest: ClientManifest;
  #pagesBundlePath: string;
  #pagesBundleBuildId: number;
  #cssAssets: Record<string, CssAsset>;
  #basePaths: string[];
  #i18n: AkanI18nConfig;
  #resolveReady!: () => void;
  #rejectReady!: (err: Error) => void;
  #readyResolved = false;
  #pendingReload: { resolve: () => void; reject: (err: Error) => void; targetBuildId: number } | null = null;

  #status: WorkerStatus = "starting";
  #killed = false;
  // Render sends issued while the worker is starting / restarting are queued
  // here and flushed on the next `ready`. Each closure re-checks `#pending` so
  // cancelled streams don't forward a stale request to the new worker.
  #queuedSends: Array<() => void> = [];
  #restartAttempts = 0;
  #restartCount = 0;
  #recycleCount = 0;
  #lastRecycleReason: string | undefined;
  #lastWorkerMetrics: AkanMetricsReport = {};
  #restartTimer: ReturnType<typeof setTimeout> | null = null;
  #recycleTimer: ReturnType<typeof setTimeout> | null = null;
  #rollingRecycle: { oldProc: Bun.Subprocess<"ignore", "inherit", "inherit">; reason: string } | null = null;
  readonly #restartOpts: Required<Pick<RscWorkerRestartOptions, "baseDelayMs" | "maxDelayMs">> & {
    maxAttempts: number | undefined;
  };

  constructor(artifact: BaseBuildArtifact) {
    this.#clientManifest = {};
    this.#pagesBundlePath = artifact.pagesBundlePath;
    this.#pagesBundleBuildId = artifact.pagesBundleBuildId;
    this.#cssAssets = artifact.cssAssets ?? {};
    this.#basePaths = artifact.basePaths ?? [];
    this.#i18n = artifact.i18n ?? DEFAULT_AKAN_I18N;
    this.#restartOpts = { baseDelayMs: 200, maxDelayMs: 30_000, maxAttempts: undefined };
    this.ready = new Promise<void>((resolve, reject) => {
      this.#resolveReady = () => {
        if (this.#readyResolved) return;
        this.#readyResolved = true;
        resolve();
      };
      this.#rejectReady = (err) => {
        if (this.#readyResolved) return;
        this.#readyResolved = true;
        reject(err);
      };
    });

    this.#proc = this.#spawn();
  }

  render(req: Request): ReadableStream<Uint8Array> {
    const requestId = crypto.randomUUID();
    // Serialize headers so the worker can rebuild a Request mirror inside its
    // own `requestStorage` scope. Without this, server components running in
    // the worker cannot read cookies/auth headers of the incoming request.
    const headers: Array<[string, string]> = [];
    req.headers.forEach((value, key) => {
      headers.push([key, value]);
    });

    return new ReadableStream<Uint8Array>({
      start: (controller) => {
        this.#pending.set(requestId, {
          onChunk: (data) => controller.enqueue(data),
          onEnd: () => controller.close(),
          onError: (msg) => controller.error(new Error(msg)),
        });
        const send = () => {
          // The stream may have been cancelled, or the worker may have died
          // again between queueing and flushing — both cases drop silently
          // (the pending entry is already gone / will be handled by the exit
          // path).
          if (!this.#pending.has(requestId)) return;
          try {
            this.#proc.send({ type: "render", requestId, url: req.url, method: req.method, headers });
          } catch (err) {
            this.#resolvePending(requestId, (p) =>
              p.onError(`rsc worker send failed: ${err instanceof Error ? err.message : String(err)}`),
            );
          }
        };
        if (this.#status === "ready") send();
        else if (this.#status === "stopped") {
          this.#resolvePending(requestId, (p) => p.onError("rsc worker is stopped"));
        } else {
          this.#queuedSends.push(send);
        }
      },
      cancel: () => {
        this.#pending.delete(requestId);
      },
    });
  }

  renderWithMeta(req: Request, options: { clientManifest?: ClientManifest } = {}): Promise<RscRenderResult> {
    const requestId = crypto.randomUUID();
    let settled = false;
    let stream!: ReadableStream<Uint8Array>;
    let theme: AkanTheme | undefined;
    let status: number | undefined;
    const result = new Promise<RscRenderResult>((resolve, reject) => {
      stream = new ReadableStream<Uint8Array>({
        start: (controller) => {
          const settleStream = () => {
            if (settled) return;
            settled = true;
            resolve({ type: "stream", stream, theme, status });
          };
          this.#pending.set(requestId, {
            onMeta: (meta) => {
              theme = meta.theme;
              status = meta.status;
              settleStream();
            },
            onChunk: (data) => {
              settleStream();
              controller.enqueue(data);
            },
            onEnd: () => {
              settleStream();
              controller.close();
            },
            onError: (msg) => {
              if (!settled) {
                settled = true;
                reject(new Error(msg));
                return;
              }
              controller.error(new Error(msg));
            },
            onRedirect: (location, method) => {
              if (!settled) {
                settled = true;
                resolve({ type: "redirect", location, method });
                controller.close();
                return;
              }
              controller.error(new Error(`redirect after stream started: ${location}`));
            },
            onNotFound: () => {
              if (!settled) {
                settled = true;
                resolve({ type: "not-found" });
                controller.close();
                return;
              }
              controller.error(new Error("not-found after stream started"));
            },
          });
          this.#sendRenderOrQueue(requestId, req, options.clientManifest);
        },
        cancel: () => {
          this.#pending.delete(requestId);
        },
      });
    });
    return result;
  }

  kill(): void {
    this.#killed = true;
    this.#status = "stopped";
    if (this.#restartTimer) {
      clearTimeout(this.#restartTimer);
      this.#restartTimer = null;
    }
    if (this.#recycleTimer) {
      clearTimeout(this.#recycleTimer);
      this.#recycleTimer = null;
    }
    this.#rollingRecycle?.oldProc.kill();
    this.#rollingRecycle = null;
    this.#proc.kill();
  }

  getMetrics(): AkanMetricsReport {
    return {
      ...this.#lastWorkerMetrics,
      rscWorkerPid: this.#proc.pid,
      rscWorkerStatus: this.#status,
      rscWorkerRestartCount: this.#restartCount,
      rscWorkerRecycleCount: this.#recycleCount,
      rscWorkerLastRecycleReason: this.#lastRecycleReason,
      rscPendingRenderCount: this.#pending.size,
      rscQueuedSendCount: this.#queuedSends.length,
    };
  }

  restartWhenIdle(reason: string): boolean {
    if (this.#killed || this.#status === "stopped" || this.#status === "starting" || this.#status === "restarting") {
      return false;
    }
    if (this.#pending.size > 0 || this.#queuedSends.length > 0) {
      if (!this.#recycleTimer) {
        const graceMs = RscWorker.#getRscRecycleGraceMs();
        this.#recycleTimer = setTimeout(() => {
          this.#recycleTimer = null;
          this.restartWhenIdle(reason);
        }, graceMs);
      }
      return false;
    }
    this.#lastRecycleReason = reason;
    this.#recycleCount += 1;
    const oldPid = this.#proc.pid;
    this.#logger.info(`[rsc] rolling recycle worker reason=${reason} oldPid=${oldPid}`);
    this.#status = "restarting";
    const oldProc = this.#proc;
    this.#rollingRecycle = { oldProc, reason };
    this.#proc = this.#spawn();
    return true;
  }

  /**
   * Update just the CSS assets the worker inlines into rendered HTML, without
   * re-importing any pages. Cheap enough to use for CSS-only HMR cycles so
   * a subsequent hard refresh serves the latest hashed stylesheet.
   */
  updateCssAssets(cssAssets: Record<string, CssAsset>): void {
    this.#cssAssets = cssAssets;
    if (this.#status !== "ready") return;
    try {
      this.#proc.send({ type: "updateCssAssets", cssAssets });
    } catch {
      // If the worker died mid-send we'll pick up the new value on the next
      // `hello` after restart; nothing to do here.
    }
  }

  /**
   * Apply a new client manifest + CSS assets and instruct the worker to re-import
   * the pages bundle with a bumped cache-bust token. When `pagesBundlePath`
   * is provided the worker switches to the new bundle URL too (the builder
   * emits a fresh hashed filename on every rebundle). Resolves once the
   * worker has acknowledged via `reloaded`.
   */
  reload(input: RscWorkerReloadInput): Promise<void> {
    this.#clientManifest = input.clientManifest;
    this.#cssAssets = input.cssAssets ?? this.#cssAssets;
    this.#pagesBundleBuildId = input.buildId;
    if (input.pagesBundlePath) this.#pagesBundlePath = input.pagesBundlePath;
    // While restarting / starting, the new worker will pick up the latest
    // `#clientManifest` / `#cssAssets` / `#pagesBundlePath` via the `init` reply
    // to its first `hello`, so callers don't need to wait on an explicit
    // `reloaded` ack.
    if (this.#status !== "ready") return Promise.resolve();
    return new Promise<void>((resolve, reject) => {
      // If a previous reload was still in flight, supersede it — the latest
      // build strictly implies the earlier one completed from the caller's
      // perspective.
      if (this.#pendingReload) this.#pendingReload.resolve();
      this.#pendingReload = { resolve, reject, targetBuildId: input.buildId };
      try {
        this.#proc.send({
          type: "reload",
          clientManifest: input.clientManifest,
          cssAssets: this.#cssAssets,
          buildId: input.buildId,
          pagesBundlePath: input.pagesBundlePath,
        });
      } catch (err) {
        this.#pendingReload?.reject(err instanceof Error ? err : new Error(String(err)));
        this.#pendingReload = null;
      }
    });
  }

  #spawn(): Bun.Subprocess<"ignore", "inherit", "inherit"> {
    this.#status = "starting";
    const workerPath = this.#resolveWorkerPath();
    let proc!: Bun.Subprocess<"ignore", "inherit", "inherit">;
    proc = Bun.spawn(["bun", "--conditions", "react-server", workerPath], {
      ipc: (message: RscInMsg) => this.#handleMessage(message, proc),
      stdio: ["ignore", "inherit", "inherit"],
      serialization: "advanced",
      env: { ...process.env },
    });
    proc.exited.then((code) => this.#handleExit(proc, code));
    return proc;
  }

  #resolveWorkerPath(): string {
    if (process.env.AKAN_RSC_WORKER_PATH) return path.resolve(process.env.AKAN_RSC_WORKER_PATH);

    const distWorkerPath = path.join(process.cwd(), "rscWorker.js");
    if (fs.existsSync(distWorkerPath)) return distWorkerPath;

    try {
      return Bun.resolveSync("akanjs/server/rsc-worker", import.meta.dir);
    } catch {
      return fileURLToPath(new URL("./rscWorker.tsx", import.meta.url));
    }
  }

  #handleMessage(message: RscInMsg, proc: Bun.Subprocess<"ignore", "inherit", "inherit">): void {
    if (proc !== this.#proc) return;
    switch (message.type) {
      case "hello":
        // Re-injecting `#clientManifest` / `#cssAssets` here is what makes crash
        // recovery transparent: after a respawn the new worker's first act is
        // to ask for config, and it receives the latest manifest the host has
        // accumulated via `reload(...)`.
        this.#proc.send({
          type: "init",
          clientManifest: this.#clientManifest,
          pagesBundlePath: this.#pagesBundlePath,
          pagesBundleBuildId: this.#pagesBundleBuildId,
          cssAssets: this.#cssAssets,
          basePaths: this.#basePaths,
          i18n: this.#i18n,
        });
        return;
      case "ready":
        this.#status = "ready";
        this.#restartAttempts = 0;
        this.#resolveReady();
        this.#finishRollingRecycle();
        this.#flushQueuedSends();
        return;
      case "reloaded":
        if (this.#pendingReload && this.#pendingReload.targetBuildId === message.buildId) {
          this.#pendingReload.resolve();
          this.#pendingReload = null;
        }
        return;
      case "chunk":
        this.#pending.get(message.requestId)?.onChunk(message.data);
        return;
      case "meta":
        this.#pending.get(message.requestId)?.onMeta?.({ theme: message.theme, status: message.status });
        return;
      case "end":
        this.#resolvePending(message.requestId, (p) => p.onEnd());
        return;
      case "redirect":
        this.#resolvePending(message.requestId, (p) => p.onRedirect?.(message.location, message.method ?? "replace"));
        return;
      case "not-found":
        this.#resolvePending(message.requestId, (p) => p.onNotFound?.());
        return;
      case "metrics":
        this.#lastWorkerMetrics = message.metrics;
        this.#maybeRecycleFromMetrics(message.metrics);
        return;
      case "error":
        if (message.requestId === "__init__") {
          // Init errors are surfaced on `ready` only for the very first spawn;
          // subsequent restarts swallow them and let exponential backoff retry.
          if (!this.#readyResolved) this.#rejectReady(new Error(String(message.message)));
          else this.#logger.error(`[rsc] worker init error on restart: ${message.message}`);
          return;
        }
        if (message.requestId === "__reload__") {
          if (
            this.#pendingReload &&
            (message.buildId === undefined || this.#pendingReload.targetBuildId === message.buildId)
          ) {
            this.#pendingReload.reject(new Error(String(message.message)));
            this.#pendingReload = null;
          }
          return;
        }
        this.#resolvePending(message.requestId, (p) => p.onError(String(message.message)));
        return;
    }
  }

  #resolvePending(requestId: string, fn: (p: RscPending) => void): void {
    const p = this.#pending.get(requestId);
    if (!p) return;
    fn(p);
    this.#pending.delete(requestId);
  }

  #sendRenderOrQueue(requestId: string, req: Request, clientManifest?: ClientManifest): void {
    const send = () => {
      if (!this.#pending.has(requestId)) return;
      try {
        const headers: Record<string, string> = {};
        req.headers.forEach((value, key) => {
          headers[key] = value;
        });
        this.#proc.send({ type: "render", requestId, url: req.url, method: req.method, headers, clientManifest });
      } catch (err) {
        this.#resolvePending(requestId, (p) =>
          p.onError(`rsc worker send failed: ${err instanceof Error ? err.message : String(err)}`),
        );
      }
    };
    if (this.#status === "ready") send();
    else if (this.#status === "stopped") {
      this.#resolvePending(requestId, (p) => p.onError("rsc worker is stopped"));
    } else {
      this.#queuedSends.push(send);
    }
  }

  #flushQueuedSends(): void {
    const queue = this.#queuedSends;
    this.#queuedSends = [];
    for (const send of queue) {
      try {
        send();
      } catch (err) {
        this.#logger.error(`[rsc] queued send failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  #finishRollingRecycle(): void {
    const recycle = this.#rollingRecycle;
    if (!recycle) return;
    this.#rollingRecycle = null;
    this.#logger.info(
      `[rsc] rolling recycle ready reason=${recycle.reason} oldPid=${recycle.oldProc.pid} newPid=${this.#proc.pid}`,
    );
    recycle.oldProc.kill();
    this.#lastWorkerMetrics = {};
  }

  #handleExit(proc: Bun.Subprocess<"ignore", "inherit", "inherit">, code: number | null): void {
    // Stale exits from a proc we've already replaced can still fire if the
    // old subprocess was slow to cleanup; ignore them so we don't
    // double-schedule a restart.
    if (proc !== this.#proc) return;

    const err = new Error(`rsc worker exited with code ${code}`);
    for (const [, p] of this.#pending) p.onError(err.message);
    this.#pending.clear();
    if (this.#pendingReload) {
      this.#pendingReload.reject(err);
      this.#pendingReload = null;
    }
    // Drop any sends that were queued against the dead worker. Callers own
    // their streams and will see the `onError` above.
    this.#queuedSends = [];

    if (this.#killed) {
      this.#status = "stopped";
      return;
    }

    this.#scheduleRestart();
  }

  #scheduleRestart(): void {
    const attempt = this.#restartAttempts;
    if (this.#restartOpts.maxAttempts !== undefined && attempt >= this.#restartOpts.maxAttempts) {
      this.#status = "stopped";
      const msg = `[rsc] worker failed ${attempt} restarts; giving up. SSR will return errors until the server restarts.`;
      this.#logger.error(msg);
      // Surface a rejection on the initial `ready` if we never succeeded.
      this.#rejectReady(new Error(msg));
      return;
    }

    this.#status = "restarting";
    const delay = Math.min(this.#restartOpts.baseDelayMs * 2 ** attempt, this.#restartOpts.maxDelayMs);
    this.#restartAttempts = attempt + 1;
    this.#restartCount += 1;
    this.#logger.verbose(`[rsc] worker crashed, restarting in ${delay}ms (attempt ${this.#restartAttempts})`);
    this.#restartTimer = setTimeout(() => {
      this.#restartTimer = null;
      if (this.#killed) return;
      try {
        this.#proc = this.#spawn();
      } catch (err) {
        this.#logger.error(`[rsc] failed to spawn worker: ${err instanceof Error ? err.message : String(err)}`);
        this.#scheduleRestart();
      }
    }, delay);
  }

  #maybeRecycleFromMetrics(metrics: AkanMetricsReport): void {
    if (this.#pending.size > 0) return;
    const maxRssBytes = RscWorker.#getRscMaxRssBytes();
    if (maxRssBytes && metrics.rssBytes && metrics.rssBytes >= maxRssBytes) {
      this.restartWhenIdle(`rss>${Math.round(maxRssBytes / 1024 / 1024)}MiB`);
      return;
    }
    const maxRenderCount = RscWorker.#parsePositiveIntEnv("AKAN_RSC_WORKER_MAX_RENDER_COUNT");
    if (maxRenderCount && (metrics.rscRenderCount ?? 0) >= maxRenderCount) {
      this.restartWhenIdle(`renderCount>${maxRenderCount}`);
      return;
    }
    const maxRouteModules = RscWorker.#getRscMaxRouteModules();
    if (maxRouteModules && (metrics.rscLoadedRouteModuleCount ?? 0) >= maxRouteModules) {
      this.restartWhenIdle(`routeModules>${maxRouteModules}`);
    }
  }

  static #parsePositiveIntEnv(name: string): number | null {
    const parsed = Number.parseInt(process.env[name] ?? "", 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  static #isProductionRuntime(): boolean {
    return process.env.NODE_ENV === "production";
  }

  static #parseBytesEnv(name: string): number | null {
    const value = process.env[name];
    if (!value) return null;
    const match = /^(\d+)(b|kb|kib|mb|mib|gb|gib)?$/i.exec(value.trim());
    if (!match) return null;
    const amount = Number.parseInt(match[1] ?? "", 10);
    const unit = (match[2] ?? "b").toLowerCase();
    if (!Number.isFinite(amount) || amount <= 0) return null;
    if (unit === "gb" || unit === "gib") return amount * 1024 * 1024 * 1024;
    if (unit === "mb" || unit === "mib") return amount * 1024 * 1024;
    if (unit === "kb" || unit === "kib") return amount * 1024;
    return amount;
  }

  static #readCgroupMemoryLimitBytes(): number | null {
    for (const filePath of ["/sys/fs/cgroup/memory.max", "/sys/fs/cgroup/memory/memory.limit_in_bytes"]) {
      try {
        if (!fs.existsSync(filePath)) continue;
        const raw = fs.readFileSync(filePath, "utf8").trim();
        if (!raw || raw === "max") continue;
        const parsed = Number.parseInt(raw, 10);
        // Ignore host-level sentinel values that are effectively unlimited.
        if (Number.isFinite(parsed) && parsed > 0 && parsed < 1024 ** 5) return parsed;
      } catch {
        // cgroup files are best-effort; explicit env thresholds still work.
      }
    }
    return null;
  }

  static #getRscRecycleGraceMs(): number {
    return RscWorker.#parsePositiveIntEnv("AKAN_RSC_WORKER_RECYCLE_GRACE_MS") ?? 5_000;
  }

  static #getRscMaxRssBytes(): number | null {
    const explicitMb = RscWorker.#parsePositiveIntEnv("AKAN_RSC_WORKER_MAX_RSS_MB");
    if (explicitMb) return explicitMb * 1024 * 1024;

    const explicitBytes = RscWorker.#parseBytesEnv("AKAN_RSC_WORKER_MAX_RSS");
    if (explicitBytes) return explicitBytes;

    if (!RscWorker.#isProductionRuntime()) return null;
    const memoryLimitBytes = RscWorker.#parseBytesEnv("AKAN_MEMORY_LIMIT") ?? RscWorker.#readCgroupMemoryLimitBytes();
    return memoryLimitBytes ? Math.floor(memoryLimitBytes * 0.55) : null;
  }

  static #getRscMaxRouteModules(): number | null {
    return RscWorker.#parsePositiveIntEnv("AKAN_RSC_WORKER_MAX_ROUTE_MODULES");
  }
}
