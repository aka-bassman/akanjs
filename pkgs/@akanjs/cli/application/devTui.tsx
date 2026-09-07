import { render } from "ink";
import { openBrowser } from "../openBrowser";
import { DevTuiApp, type DevTuiRailRow, type DevTuiSnapshot } from "../ui/DevTuiApp";
import { DevLogBuffer, type DevLogTarget, HOST_SOURCE } from "./devLogBuffer";
import { scrollAnchor, windowOf } from "./devLogWindow";
import type { DevAppStatus, DevSupervisor, DevSupervisorView } from "./devSupervisor";

/**
 * The full-screen view: a rail of apps and the processes inside them on the left, the selected one's
 * output on the right.
 *
 * Ink repaints a frame per render, and a busy dev server writes hundreds of lines a second, so nothing
 * here renders per line. Output lands in a bounded buffer and listeners are notified on a frame timer;
 * the pane then reads only the rows it can show. The stored text keeps its ANSI — that is the level
 * colour the child already rendered — and only matching strips it.
 *
 * The selection is held as a `{ app, source }` target rather than a rail index, because the rail's own
 * shape depends on it: an app's replica rows are listed only while that app is selected.
 */
export class DevTui implements DevSupervisorView {
  /** Ink throttles its own writes to `maxFps: 30`, so notifying faster only buys extra reconciles. */
  static readonly frameMs = 34;
  /** The footer, outside the fixed-height body. */
  static readonly footerRows = 1;
  /** A pane's own border pair plus its title row. */
  static readonly paneChromeRows = 3;

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
    process.stdout.off("resize", this.#onResize);
    this.#instance.unmount();
    // Ink leaves its last frame behind, so the only thing still owed is whatever a child wrote without
    // a closing newline plus a summary of how the session ended.
    for (const line of this.#buffer.flushPartials()) process.stdout.write(`${line.app} │ ${line.text}\n`);
    for (const status of this.#statuses) process.stdout.write(`${status.name} ${status.url} — ${status.state}\n`);
  };

  #subscribe = (listener: () => void) => {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  };

  /**
   * `all`, then each app, then the processes that app has actually written from — `host` for the dev
   * host, gateway and RSC worker, plus one row per replica the gateway forwards. Replica rows appear
   * only under the selected app, so the rail's height does not track the total replica count.
   */
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
    const status = this.#statuses.find((candidate) => candidate.name === this.#target.app);
    const railLabelWidth = rows.reduce((max, row) => Math.max(max, row.label.length + row.depth * 2), 0);
    this.#cachedSnapshot = {
      rows,
      selected: this.#indexOfTarget(rows),
      title: status
        ? `${status.name}${this.#target.source ? ` · ${this.#target.source}` : ""} · ${status.url} · ${status.state}${status.detail ? ` (${status.detail})` : ""}`
        : "all apps",
      lines: view.lines,
      above: view.above,
      below: view.below,
      following: view.following,
      // Merged across apps, the app name is what tells two `host` streams apart; inside one app it is
      // the source; inside one source the title already says which, so nothing is prefixed.
      prefix: this.#target.app === null ? "app" : this.#target.source === null ? "source" : "none",
      prefixWidth: this.#target.app === null ? this.#appWidth() : this.#sourceWidth(),
      grep: this.#grep,
      errorsOnly: this.#errorsOnly,
      editingGrep: this.#editingGrep,
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

  /** `Tab` walks every rail row, replica rows included. */
  #moveSelection = (delta: number) => {
    const rows = this.#railRows();
    const next = (((this.#indexOfTarget(rows) + delta) % rows.length) + rows.length) % rows.length;
    const row = rows[next];
    if (row) this.#setTarget({ app: row.app, source: row.source });
  };

  /**
   * A digit names an app, not a rail row: the row index shifts as replica rows appear under whichever
   * app is selected, so `2` would otherwise mean a different thing depending on where you already were.
   */
  #selectApp = (index: number) => {
    const status = this.#statuses[index];
    if (status) this.#setTarget({ app: status.name, source: null });
  };

  #setTarget(target: DevLogTarget) {
    this.#target = { app: target.app ?? null, source: target.source ?? null };
    // A different slice has a different tail; carrying the anchor over would land the reader somewhere
    // arbitrary in it.
    this.#anchor = null;
    this.#renderNow();
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
    this.#anchor = null;
    this.#renderNow();
  };

  #setEditingGrep = (editing: boolean) => {
    this.#editingGrep = editing;
    this.#renderNow();
  };

  #toggleErrorsOnly = () => {
    this.#errorsOnly = !this.#errorsOnly;
    this.#anchor = null;
    this.#renderNow();
  };

  #clear = () => {
    this.#buffer.clear(this.#target.app ?? null);
    this.#anchor = null;
    this.#renderNow();
  };

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
