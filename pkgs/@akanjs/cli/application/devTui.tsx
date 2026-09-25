import { render } from "ink";
import { writeClipboard } from "../clipboard";
import { openBrowser } from "../openBrowser";
import { DevTuiApp, type DevTuiRailRow, type DevTuiSnapshot } from "../ui/DevTuiApp";
import { DevLogBuffer, type DevLogTarget, HOST_SOURCE, plainTextOf } from "./devLogBuffer";
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
  /** How long a copy result holds the footer before the key hints come back. */
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
    // Ink leaves its last frame behind, so the only thing still owed is whatever a child wrote without
    // a closing newline plus a summary of how the session ended.
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
      // The share leads, ahead of the local URL and the state: the title truncates to the pane width, the
      // rail already carries the state glyph and the port, and the public URL is the one thing this session
      // has that cannot be read off anything else on screen.
      title: status
        ? `${status.name}${this.#target.source ? ` · ${this.#target.source}` : ""}${status.shareUrl ? ` · ◈ ${status.shareUrl}` : ""} · ${status.url} · ${status.state}${status.detail ? ` (${status.detail})` : ""}`
        : this.#mergedTitle(),
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

  /**
   * The pane truncates to its width and the frame carries a border, so a selection dragged off the
   * screen is neither the whole line nor only the log — and a repaint clears it before it is made.
   * This copies what the filters already narrowed: every matching line, in full, with no chrome.
   */
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

  /** The path is what a reader hands to an editor or an agent, which reads it instead of a paste. */
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

  /**
   * The share's whole point is a URL somebody else opens, and this view owns the terminal for the session —
   * so the line `--share` printed before `render` is gone by the first repaint and there is nothing to select.
   * The header carries it and this hands it over.
   */
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

  /** The selected app's share, or every one of them while the merged view is selected — as `Y` does. */
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
