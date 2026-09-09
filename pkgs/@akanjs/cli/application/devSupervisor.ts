import type { DevHostEvent, DevHostState } from "@akanjs/devkit/akanApp";
import type { App } from "@akanjs/devkit/commandDecorators";
import { openBrowser } from "../openBrowser";
import { DevBootConcurrency } from "./devBootConcurrency";
import type { DevUiMode } from "./devUiMode";

export interface DevAppStatus {
  app: App;
  name: string;
  port: number;
  url: string;
  state: DevHostState;
  detail: string;
  exitCode: number | null;
}

export interface DevSupervisorOptions {
  apps: App[];
  mode: DevUiMode;
  /** `null` leaves the wave size to `DevBootConcurrency`; a number is what the session asked for. */
  concurrency?: number | null;
  open?: boolean;
  write?: boolean;
}

export interface DevSupervisorView {
  /** Called for every decoded chunk of a child's output, in arrival order. Not split into lines. */
  onOutput: (app: string, kind: "stdout" | "stderr", text: string) => void;
  onStatus: (statuses: DevAppStatus[]) => void;
  /**
   * The supervisor's own messages. Routed through the view rather than written straight to stdout: Ink
   * repaints a frame it believes it owns, and a stray write into the middle of one corrupts it.
   */
  onNote: (text: string, level: "info" | "warn") => void;
  /** Resolves when the viewer wants the session to end — a quit key, or the stream view never. */
  waitForExit: () => Promise<void>;
  close?: () => void;
}

interface DevChild {
  status: DevAppStatus;
  proc: Bun.Subprocess<"ignore", "pipe", "pipe"> | null;
  ready: Promise<void>;
  markReady: () => void;
  opened: boolean;
}

/**
 * Runs one `akan start <app>` child per app and owns everything they must not each own: the local
 * database, the boot order, and the terminal.
 *
 * A child is the unmodified single-app dev host, re-invoked through this same CLI entry. Hosting several
 * `AkanAppHost` instances in one process would be cheaper by one process and wrong in a way that only
 * shows up later: `prepareCommand` publishes per-app values (`AKAN_PUBLIC_BASE_PATHS`,
 * `AKAN_DATABASE_MODE`) into `process.env`, and `AKAN_DATABASE_MODE` is read back as an explicit
 * override — so the second app would silently inherit the first app's database mode.
 */
export class DevSupervisor {
  /** Set in a child's env. A child that sees it reports its state over ipc instead of only printing it. */
  static readonly supervisedEnvKey = "AKAN_DEV_SUPERVISED";

  /**
   * What a supervised child adds to its own `startOne` call. Returns nothing when this process was not
   * spawned by a supervisor, so the single-app path stays exactly as it was — and the pipe mode is what
   * fills `#backendStderrTail`, the tail the crash-loop diagnostic prints.
   */
  static childHooks(): { stdio?: "pipe"; onDevEvent?: (event: DevHostEvent) => void } {
    if (process.env[DevSupervisor.supervisedEnvKey] !== "1" || !process.send) return {};
    const send = process.send.bind(process);
    return {
      stdio: "pipe",
      onDevEvent: (event) => {
        try {
          send(event);
        } catch {
          // The supervisor is gone; its own `onExit` already knows, and this child is next to be told.
        }
      },
    };
  }
  /** Past this, boot order stops being enforced: a child that never reports ready must not block the rest. */
  static readonly readyTimeoutMs = 180_000;
  static readonly shutdownGraceMs = 12_000;

  readonly #options: DevSupervisorOptions;
  readonly #children = new Map<string, DevChild>();
  #view: DevSupervisorView | null = null;
  #stopping = false;

  constructor(options: DevSupervisorOptions) {
    this.#options = options;
  }

  get statuses(): DevAppStatus[] {
    return [...this.#children.values()].map((child) => child.status);
  }

  async run(view: DevSupervisorView) {
    this.#view = view;
    const ports = await this.#assignPorts();
    for (const app of this.#options.apps) this.#children.set(app.name, this.#makeChild(app, ports.get(app.name) ?? 0));
    this.#publishStatus();

    const stopped = this.#installSignalHandlers();
    void this.#bootInOrder();
    await Promise.race([view.waitForExit(), stopped]);
    await this.stop();
    view.close?.();
  }

  /**
   * `getDevPort` derives a port per app, but `AKAN_DEV_PORT` overrides it — and one pin would hand every
   * app in the session the same port. The websocket port is `port + 10_000`, so a clash there is the
   * same clash; walking upward from each derived port is what keeps both unique.
   */
  async #assignPorts(): Promise<Map<string, number>> {
    const taken = new Set<number>();
    const ports = new Map<string, number>();
    for (const app of this.#options.apps) {
      let port = await app.getDevPort();
      while (taken.has(port)) port += 1;
      taken.add(port);
      ports.set(app.name, port);
    }
    return ports;
  }

  #makeChild(app: App, port: number): DevChild {
    let markReady!: () => void;
    const ready = new Promise<void>((resolve) => {
      markReady = resolve;
    });
    return {
      status: {
        app,
        name: app.name,
        port,
        url: `http://localhost:${port}`,
        state: "starting",
        detail: "queued",
        exitCode: null,
      },
      proc: null,
      ready,
      markReady,
      opened: false,
    };
  }

  /**
   * Boots in waves rather than all at once. Two reasons, both measured: a cold boot build is the
   * builder's RSS peak (~490MB on top of its floor), and every app's `scanSync` rewrites the generated
   * barrels of the libs it shares with the others — serialized here as well as locked underneath.
   *
   * The wave size is the machine's, not a constant: `DevBootConcurrency` sizes it against memory and
   * cores, so a laptop boots them together and a small container still staggers them. The note says
   * which, because a session that waits on one app at a time must be able to see why.
   */
  async #bootInOrder() {
    const queue = [...this.#children.values()];
    const plan = DevBootConcurrency.resolve(queue.length, this.#options.concurrency ?? null);
    const concurrency = plan.concurrency;
    if (queue.length > 1) this.#note(DevBootConcurrency.describe(queue.length, plan), "info");
    const waves: DevChild[][] = [];
    for (let idx = 0; idx < queue.length; idx += concurrency) waves.push(queue.slice(idx, idx + concurrency));
    for (const wave of waves) {
      if (this.#stopping) return;
      for (const child of wave) this.#spawnChild(child);
      this.#publishStatus();
      await Promise.all(wave.map(async (child) => await this.#waitForReady(child)));
    }
  }

  async #waitForReady(child: DevChild) {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const expired = new Promise<"expired">((resolve) => {
      timer = setTimeout(() => resolve("expired"), DevSupervisor.readyTimeoutMs);
    });
    try {
      if ((await Promise.race([child.ready.then(() => "ready" as const), expired])) === "expired")
        this.#note(
          `${child.status.name} has not reported ready after ${Math.round(DevSupervisor.readyTimeoutMs / 1000)}s; starting the next app anyway`,
          "warn",
        );
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  /**
   * The child's own command line. Static and pure so a test can check every flag against what `start`
   * actually declares — an option renamed here and not there kills every child at boot with
   * `error: unknown option`, which looks like a dev-server failure rather than a CLI mismatch.
   */
  static childArgs(name: string, { write = true }: { write?: boolean } = {}): string[] {
    return [
      "start",
      name,
      // The child renders nothing itself: this process owns the terminal and reads the child's pipes.
      "--plain",
      // The supervisor owns the database and the boot order; a child that also did would race its siblings.
      "--dbup",
      "false",
      "--write",
      String(write),
    ];
  }

  #spawnChild(child: DevChild) {
    const { app, name, port } = child.status;
    const args = DevSupervisor.childArgs(name, { write: this.#options.write ?? true });
    const proc = Bun.spawn([process.execPath, Bun.main, ...args], {
      cwd: app.workspace.workspaceRoot,
      env: {
        ...process.env,
        [DevSupervisor.supervisedEnvKey]: "1",
        AKAN_PUBLIC_APP_NAME: name,
        // Pinned, not left to be re-derived: `getDevPort` indexes the sorted app list, so a child that
        // restarts after an app directory appears would land on a different port than the one shown here.
        AKAN_DEV_PORT: String(port),
      },
      stdio: ["ignore", "pipe", "pipe"],
      ipc: (message: DevHostEvent) => {
        if (!message || typeof message !== "object" || typeof message.state !== "string") return;
        this.#applyChildEvent(child, message);
      },
      serialization: "advanced",
      onExit: (_proc, exitCode, signalCode) => {
        child.proc = null;
        child.status.exitCode = exitCode;
        if (this.#stopping) return;
        child.status.state = "stopped";
        child.status.detail = signalCode ? `killed by ${signalCode}` : `exited with ${exitCode}`;
        // Unblocks a wave waiting on an app that will never report ready.
        child.markReady();
        this.#publishStatus();
      },
    });
    child.proc = proc;
    child.status.state = "starting";
    child.status.detail = `pid ${proc.pid}`;
    void this.#drain(proc.stdout, name, "stdout");
    void this.#drain(proc.stderr, name, "stderr");
  }

  #applyChildEvent(child: DevChild, event: DevHostEvent) {
    child.status.state = event.state;
    child.status.detail = event.detail ?? "";
    if (event.state === "ready") {
      child.markReady();
      // Once per session, not once per restart: a crash loop would otherwise open a tab per recovery.
      if (this.#options.open && !child.opened) {
        child.opened = true;
        void openBrowser(child.status.url);
      }
    }
    // A child that gave up is not coming back on its own, so the next wave must not wait for it.
    if (event.state === "failed") child.markReady();
    this.#publishStatus();
  }

  async #drain(stream: ReadableStream<Uint8Array>, name: string, kind: "stdout" | "stderr") {
    const decoder = new TextDecoder();
    try {
      for await (const chunk of stream) {
        const text = decoder.decode(chunk, { stream: true });
        if (text) this.#view?.onOutput(name, kind, text);
      }
    } catch {
      // The stream closes when the child exits; `onExit` already reported that.
    }
  }

  #publishStatus() {
    this.#view?.onStatus(this.statuses);
  }

  #note(text: string, level: "info" | "warn") {
    this.#view?.onNote(text, level);
  }

  /**
   * Ctrl+C reaches every child directly through the process group, so this is not what delivers the
   * signal — it is what keeps this process alive long enough to wait for them and to tear the database
   * down once. A second Ctrl+C abandons the wait.
   */
  #installSignalHandlers(): Promise<void> {
    return new Promise<void>((resolve) => {
      let asked = false;
      const onSignal = () => {
        if (asked) {
          this.#note("abandoning the wait; children may be left running", "warn");
          process.exit(130);
        }
        asked = true;
        resolve();
      };
      process.on("SIGINT", onSignal);
      process.on("SIGTERM", onSignal);
    });
  }

  /**
   * Replaces one app's child. The dev host recovers a crashed backend or builder on its own, so this is
   * for the case it cannot see: a change it did not classify, or a wedged process.
   */
  async restart(name: string) {
    const child = this.#children.get(name);
    if (!child || this.#stopping) return;
    const running = child.proc;
    if (running) {
      running.kill("SIGTERM");
      await running.exited;
    }
    child.status.state = "starting";
    child.status.detail = "restarting";
    child.status.exitCode = null;
    this.#publishStatus();
    this.#spawnChild(child);
    this.#publishStatus();
  }

  async stop() {
    if (this.#stopping) return;
    this.#stopping = true;
    const running = [...this.#children.values()].filter((child): child is DevChild & { proc: Bun.Subprocess } =>
      Boolean(child.proc),
    );
    for (const child of running) child.proc.kill("SIGTERM");
    const exited = Promise.all(running.map(async (child) => await child.proc.exited));
    let timer: ReturnType<typeof setTimeout> | null = null;
    const expired = new Promise<"expired">((resolve) => {
      timer = setTimeout(() => resolve("expired"), DevSupervisor.shutdownGraceMs);
    });
    try {
      if ((await Promise.race([exited.then(() => "exited" as const), expired])) === "expired") {
        for (const child of running) {
          if (!child.proc.killed) {
            this.#note(`${child.status.name} did not exit in time; killing it`, "warn");
            child.proc.kill("SIGKILL");
          }
        }
      }
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
}
