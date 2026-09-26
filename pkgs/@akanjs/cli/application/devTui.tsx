import { render } from "ink";
import { writeClipboard } from "../clipboard";
import { openBrowser } from "../openBrowser";
import { DevTuiApp, type DevTuiRailRow, type DevTuiSnapshot } from "../ui/DevTuiApp";
import { DevLogBuffer, type DevLogTarget, HOST_SOURCE, plainTextOf } from "./devLogBuffer";
import { scrollAnchor, windowOf } from "./devLogWindow";
import type { DevAppStatus, DevSupervisor, DevSupervisorView } from "./devSupervisor";

// Ink repaints a frame per render, so output lands in a bounded buffer and listeners are notified on a frame timer.
// The selection is an `{ app, source }` target, not a rail index: replica rows exist only under the selected app.
export class DevTui implements DevSupervisorView {
  /** Ink throttles its own writes to `maxFps: 30`, so notifying faster only buys extra reconciles. */
  static readonly frameMs = 34;
  static readonly footerRows = 1;
  /** A pane's own border pair plus its title row. */
  static readonly paneChromeRows = 3;
  static readonly noticeMs = 4_000;

  readonly #buffer = new DevLogBuffer();
  readonly #listeners = new Set<() => void>();
  readonly #supervisor: DevSupervisor;
  readonly #instance: ReturnType<typeof render>;
  #statuses: DevAppStatus[] = [];
  #target: DevLogTarget = { app: null, source: null };
  #anchor: number | null = null;
  #grep = "";
  #editingGrep = false;
  #errorsOnly = false;
  #frameTimer: ReturnType<typeof setTimeout> | null = null;
  #cachedSnapshot: DevTuiSnapshot | null = null;
  #notice = "";
  #noticeTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(supervisor: DevSupervisor) {
    this.#supervisor = supervisor;
    this.#statuses = supervisor.statuses;
    process.stdout.on("resize", this.#onResize);
    this.#instance = render(
      <DevTuiApp
        actions={{
          subscribe: this.#subscribe,
          snapshot: this.#snapshot,
          moveSelection: this.#moveSelection,
          selectApp: this.#selectApp,
          scroll: this.#scroll,
          follow: this.#follow,
          setGrep: this.#setGrep,
          setEditingGrep: this.#setEditingGrep,
          toggleErrorsOnly: this.#toggleErrorsOnly,
          clear: this.#clear,
          copyLines: this.#copyLines,
          copyPath: this.#copyPath,
          copyShareUrl: this.#copyShareUrl,
          openSelected: this.#openSelected,
          restartSelected: this.#restartSelected,
          quit: this.#quit,
        }}
      />,
      // The children's output is rendered by this view, and nothing in this process uses console.
      { patchConsole: false },
    );
  }

  onOutput = (app: string, kind: "stdout" | "stderr", text: string) => {
    this.#buffer.push(app, kind, text);
    this.#scheduleFrame();
  };

  onStatus = (statuses: DevAppStatus[]) => {
    this.#statuses = statuses;
    this.#scheduleFrame();
  };

  onNote = (text: string, level: "info" | "warn") => {
    this.#buffer.push("akan", level === "warn" ? "stderr" : "stdout", `${text}\n`);
    this.#scheduleFrame();
  };

  waitForExit = async () => {
    await this.#instance.waitUntilExit();
  };

  close = () => {
    if (this.#frameTimer) clearTimeout(this.#frameTimer);
    this.#frameTimer = null;
    if (this.#noticeTimer) clearTimeout(this.#noticeTimer);
    this.#noticeTimer = null;
    process.stdout.off("resize", this.#onResize);
    this.#instance.unmount();
    // Ink leaves its last frame behind; still owed are unterminated child lines and how the session ended.
    for (const line of this.#buffer.flushPartials()) process.stdout.write(`${line.app} │ ${line.text}\n`);
    for (const status of this.#statuses)
      process.stdout.write(
        `${status.name} ${status.url}${status.shareUrl ? ` · ${status.shareUrl}` : ""} — ${status.state}\n`,
      );
    // The frame left behind is a bordered screenshot of one page; this says where the whole thing is.
    const log = this.#supervisor.sessionLog;
    for (const name of log.appNames) process.stdout.write(`${name} log: ${log.relativePathOf(name)}\n`);
  };

  #subscribe = (listener: () => void) => {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  };

  // Replica rows appear only under the selected app, so the rail's height does not track the replica count.
  #railRows(): DevTuiRailRow[] {
    const rows: DevTuiRailRow[] = [
      { app: null, source: null, label: "all apps", state: null, port: null, depth: 0, appIndex: null },
    ];
    this.#statuses.forEach((status, idx) => {
      rows.push({
        app: status.name,
        source: null,
        label: status.name,
        state: status.state,
        port: status.port,
        depth: 0,
        appIndex: idx < 9 ? idx + 1 : null,
      });
      if (status.name !== this.#target.app) return;
      for (const source of this.#buffer.sourcesOf(status.name))
        rows.push({ app: status.name, source, label: source, state: null, port: null, depth: 1, appIndex: null });
    });
    return rows;
  }

  #indexOfTarget(rows: DevTuiRailRow[]) {
    const found = rows.findIndex((row) => row.app === this.#target.app && row.source === this.#target.source);
    return found < 0 ? 0 : found;
  }

  #filtered(target: DevLogTarget) {
    return this.#buffer.select({
      app: target.app ?? null,
      source: target.source ?? null,
      grep: this.#grep,
      errorsOnly: this.#errorsOnly,
    });
  }

  #snapshot = (): DevTuiSnapshot => {
    if (this.#cachedSnapshot) return this.#cachedSnapshot;
    const terminalRows = Math.max(8, process.stdout.rows ?? 24);
    const columns = Math.max(40, process.stdout.columns ?? 80);
    const bodyHeight = Math.max(DevTui.paneChromeRows + 1, terminalRows - DevTui.footerRows);
    const logRows = Math.max(1, bodyHeight - DevTui.paneChromeRows);
    const rows = this.#railRows();
    const view = windowOf(this.#filtered(this.#target), logRows, this.#anchor);
    const status = this.#selectedStatus();
    const railLabelWidth = rows.reduce((max, row) => Math.max(max, row.label.length + row.depth * 2), 0);
    this.#cachedSnapshot = {
      rows,
      selected: this.#indexOfTarget(rows),
      // The share leads: the title truncates, and the public URL is shown nowhere else on screen.
      title: status
        ? `${status.name}${this.#target.source ? ` · ${this.#target.source}` : ""}${status.shareUrl ? ` · ◈ ${status.shareUrl}` : ""} · ${status.url} · ${status.state}${status.detail ? ` (${status.detail})` : ""}`
        : this.#mergedTitle(),
      lines: view.lines,
      above: view.above,
      below: view.below,
      following: view.following,
      // Merged apps need the app name to tell `host` streams apart; inside one source the title says which.
      prefix: this.#target.app === null ? "app" : this.#target.source === null ? "source" : "none",
      prefixWidth: this.#target.app === null ? this.#appWidth() : this.#sourceWidth(),
      grep: this.#grep,
      errorsOnly: this.#errorsOnly,
      editingGrep: this.#editingGrep,
      notice: this.#notice,
      hasShare: this.#statuses.some((candidate) => !!candidate.shareUrl),
      readyCount: this.#statuses.filter((candidate) => candidate.state === "ready").length,
      appCount: this.#statuses.length,
      logRows,
      bodyHeight,
      railWidth: Math.min(34, Math.max(20, railLabelWidth + 10)),
      columns,
      terminalRows,
    };
    return this.#cachedSnapshot;
  };

  #appWidth() {
    return this.#statuses.reduce((max, status) => Math.max(max, status.name.length), 0);
  }

  #sourceWidth() {
    let width = HOST_SOURCE.length;
    for (const status of this.#statuses)
      for (const source of this.#buffer.sourcesOf(status.name)) width = Math.max(width, source.length);
    return width;
  }

  #scheduleFrame() {
    if (this.#frameTimer) return;
    this.#frameTimer = setTimeout(() => {
      this.#frameTimer = null;
      this.#renderNow();
    }, DevTui.frameMs);
  }

  #renderNow() {
    this.#cachedSnapshot = null;
    for (const listener of this.#listeners) listener();
  }

  #onResize = () => this.#renderNow();

  #moveSelection = (delta: number) => {
    const rows = this.#railRows();
    const next = (((this.#indexOfTarget(rows) + delta) % rows.length) + rows.length) % rows.length;
    const row = rows[next];
    if (row) this.#setTarget({ app: row.app, source: row.source });
  };

  // A digit names an app, not a rail row: row indexes shift as replica rows appear under the selected app.
  #selectApp = (index: number) => {
    const status = this.#statuses[index];
    if (status) this.#setTarget({ app: status.name, source: null });
  };

  #setTarget(target: DevLogTarget) {
    this.#target = { app: target.app ?? null, source: target.source ?? null };
    // A different slice has a different tail, so a carried-over anchor would land somewhere arbitrary.
    this.#follow();
  }

  #scroll = (delta: number) => {
    this.#anchor = scrollAnchor(this.#filtered(this.#target), this.#snapshot().logRows, this.#anchor, delta);
    this.#renderNow();
  };

  #follow = () => {
    this.#anchor = null;
    this.#renderNow();
  };

  #setGrep = (grep: string) => {
    this.#grep = grep;
    this.#follow();
  };

  #setEditingGrep = (editing: boolean) => {
    this.#editingGrep = editing;
    this.#renderNow();
  };

  #toggleErrorsOnly = () => {
    this.#errorsOnly = !this.#errorsOnly;
    this.#follow();
  };

  #clear = () => {
    this.#buffer.clear(this.#target.app ?? null);
    this.#follow();
  };

  // A drag-selection is truncated, bordered and cleared by the next repaint; this copies filtered lines in full.
  #copyLines = () => {
    const lines = this.#filtered(this.#target);
    if (lines.length === 0) {
      this.#setNotice("nothing to copy");
      return;
    }
    const text = plainTextOf(lines, { withApp: this.#target.app === null });
    void writeClipboard(text).then((copied) => {
      this.#setNotice(copied ? `copied ${lines.length} lines` : `no clipboard here — ${this.#logPaths().join(" · ")}`);
    });
  };

  #copyPath = () => {
    const paths = this.#logPaths();
    void writeClipboard(paths.join("\n")).then((copied) => {
      this.#setNotice(copied ? `copied ${paths.join(" · ")}` : paths.join(" · "));
    });
  };

  #logPaths(): string[] {
    const log = this.#supervisor.sessionLog;
    const app = this.#target.app;
    return (app ? [app] : log.appNames).map((name) => log.relativePathOf(name));
  }

  // The line `--share` printed before `render` is gone by the first repaint, so this hands the URL over.
  #copyShareUrl = () => {
    const urls = this.#shareUrls();
    if (urls.length === 0) {
      this.#setNotice("no public share — start with --share");
      return;
    }
    void writeClipboard(urls.join("\n")).then((copied) => {
      this.#setNotice(copied ? `copied ${urls.join(" · ")}` : urls.join(" · "));
    });
  };

  #shareUrls(): string[] {
    const app = this.#target.app;
    return this.#statuses
      .filter((status) => app === null || status.name === app)
      .map((status) => status.shareUrl)
      .filter((url): url is string => !!url);
  }

  #mergedTitle() {
    const urls = this.#shareUrls();
    return urls.length === 0 ? "all apps" : `all apps · ◈ ${urls.join(" · ")}`;
  }

  #setNotice(text: string) {
    this.#notice = text;
    if (this.#noticeTimer) clearTimeout(this.#noticeTimer);
    this.#noticeTimer = setTimeout(() => {
      this.#notice = "";
      this.#noticeTimer = null;
      this.#renderNow();
    }, DevTui.noticeMs);
    this.#renderNow();
  }

  #openSelected = () => {
    const status = this.#selectedStatus();
    if (status) void openBrowser(status.url);
  };

  #restartSelected = () => {
    const status = this.#selectedStatus();
    if (status) void this.#supervisor.restart(status.name);
  };

  #selectedStatus() {
    return this.#statuses.find((candidate) => candidate.name === this.#target.app);
  }

  #quit = () => {
    this.#instance.unmount();
  };
}
