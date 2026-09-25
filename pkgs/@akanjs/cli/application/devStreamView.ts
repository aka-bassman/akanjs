import { Logger } from "akanjs/common";
import chalk from "chalk";
import type { DevAppStatus, DevSupervisorView } from "./devSupervisor";

/** Distinguishable in both light and dark terminals, and none of them is the level colour Logger uses. */
const appColors = ["cyan", "magenta", "yellow", "green", "blue", "red"] as const;

/**
 * Interleaves several children into one terminal behind a per-app prefix — the shape `turbo` and `nx`
 * use, and the fallback whenever the TUI cannot draw (a pipe, a redirect, CI).
 *
 * Children write already-rendered `Logger` lines, so the text is passed through untouched: re-rendering
 * would double the timestamp and stripping ANSI would throw away the level colour. Only the prefix is
 * added, and only at a real line start — a chunk that ends mid-line keeps its remainder until the rest
 * arrives, so a stack trace does not grow a prefix in the middle of a word.
 */
export class DevStreamView implements DevSupervisorView {
  readonly #logger = new Logger("akan start");
  readonly #partial = new Map<string, string>();
  readonly #lastState = new Map<string, DevAppStatus["state"]>();
  readonly #color = new Map<string, (typeof appColors)[number]>();
  #width = 0;

  constructor(appNames: string[]) {
    this.#width = appNames.reduce((max, name) => Math.max(max, name.length), 0);
    appNames.forEach((name, idx) => {
      this.#color.set(name, appColors[idx % appColors.length] ?? "cyan");
    });
  }

  onOutput = (app: string, kind: "stdout" | "stderr", text: string) => {
    const key = `${app}:${kind}`;
    const pending = `${this.#partial.get(key) ?? ""}${text}`;
    const lines = pending.split("\n");
    this.#partial.set(key, lines.pop() ?? "");
    if (lines.length === 0) return;
    const prefixed = lines.map((line) => `${this.#prefix(app)}${line}`).join("\n");
    (kind === "stderr" ? process.stderr : process.stdout).write(`${prefixed}\n`);
  };

  /** One line per transition, not a table per update: a boot produces a dozen status updates. */
  onStatus = (statuses: DevAppStatus[]) => {
    for (const status of statuses) {
      if (this.#lastState.get(status.name) === status.state) continue;
      this.#lastState.set(status.name, status.state);
      const detail = status.detail ? ` (${status.detail})` : "";
      const where = status.state === "ready" ? ` — ${status.url}` : "";
      const line = `${status.name} ${status.state}${detail}${where}`;
      if (status.state === "failed") this.#logger.error(line);
      else if (status.state === "stopped") this.#logger.warn(line);
      else this.#logger.info(line);
    }
  };

  onNote = (text: string, level: "info" | "warn") => {
    if (level === "warn") this.#logger.warn(text);
    else this.#logger.info(text);
  };

  /** Nothing in the stream view ends the session; Ctrl+C does, through the supervisor's own handler. */
  waitForExit = () => new Promise<void>(() => undefined);

  close = () => {
    for (const [key, remainder] of this.#partial) {
      if (!remainder) continue;
      const app = key.slice(0, key.lastIndexOf(":"));
      process.stdout.write(`${this.#prefix(app)}${remainder}\n`);
    }
    this.#partial.clear();
  };

  #prefix(app: string) {
    const color = this.#color.get(app) ?? "cyan";
    return `${chalk[color](app.padEnd(this.#width))} ${chalk.dim("│")} `;
  }
}
