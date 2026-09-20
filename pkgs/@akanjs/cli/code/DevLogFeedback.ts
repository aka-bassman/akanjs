import { existsSync, statSync } from "node:fs";
import path from "node:path";
import type { TurnFeedbackSource } from "./TurnFeedback";

export interface DevLogFeedbackOptions {
  workspaceRoot: string;
  apps: string[];
  /** Hot reload finishes after the turn does, so the read waits for it. */
  graceMs?: number;
  maxLines?: number;
}

const errorPattern = /\bERROR\b|\bFATAL\b|\[stderr\]|error:|Error:|✖|Unhandled|Cannot find|is not a function/;
const noisePattern = /DEBUG|\bWARN\b|MCP catalogue|rate limit/;

/**
 * Feeds back what the dev server said after a turn edited code.
 *
 * `akan start` writes `local/apps/<app>/runtime/dev.log` with no ANSI, nothing truncated, and every process of
 * the app in arrival order including the dev host's own build output — which reaches no other file. That is the
 * one thing a coding agent working on an akan app has and a general one does not: lint and typecheck can both
 * pass on code that dies the moment it runs.
 */
export class DevLogFeedback implements TurnFeedbackSource {
  readonly key = "dev-server";
  readonly #options: Required<DevLogFeedbackOptions>;
  readonly #marks = new Map<string, number>();

  constructor(options: DevLogFeedbackOptions) {
    this.#options = { graceMs: 1_500, maxLines: 30, ...options };
  }

  begin() {
    for (const app of this.#options.apps) this.#marks.set(app, DevLogFeedback.#sizeOf(this.#pathOf(app)));
  }

  async observe() {
    const running = this.#options.apps.filter((app) => existsSync(this.#pathOf(app)));
    if (!running.length) return undefined;
    await Bun.sleep(this.#options.graceMs);
    const reports: string[] = [];
    for (const app of running) {
      const lines = await this.#linesSince(app);
      if (lines.length) reports.push(`**${app}** dev server:\n\`\`\`\n${lines.join("\n")}\n\`\`\``);
    }
    if (!reports.length) return undefined;
    return [
      "The dev server logged errors after your edits:",
      ...reports,
      `Full log: ${running.map((app) => path.relative(this.#options.workspaceRoot, this.#pathOf(app))).join(", ")}`,
    ].join("\n\n");
  }

  async #linesSince(app: string) {
    const file = this.#pathOf(app);
    const from = this.#marks.get(app) ?? 0;
    const size = DevLogFeedback.#sizeOf(file);
    // A smaller file means `akan start` rotated to a new session mid-turn; its own boot output is not a finding.
    if (size <= from) return [];
    const text = await Bun.file(file).slice(from, size).text();
    this.#marks.set(app, size);
    return text
      .split("\n")
      .filter((line) => errorPattern.test(line) && !noisePattern.test(line))
      .slice(-this.#options.maxLines);
  }

  #pathOf(app: string) {
    return path.join(this.#options.workspaceRoot, "local", "apps", app, "runtime", "dev.log");
  }

  /**
   * The dev server's own URL, read back from the line `akan start` prints when the app comes up.
   *
   * The port is allocated, not predicted — a second checkout or a stale listener shifts it — so the log is the
   * only place that knows which one this session actually got.
   */
  static async previewUrl(workspaceRoot: string, app: string) {
    const file = path.join(workspaceRoot, "local", "apps", app, "runtime", "dev.log");
    if (!existsSync(file)) return undefined;
    const matches = [...(await Bun.file(file).text()).matchAll(/ready \(pid=\d+\) — (https?:\/\/\S+)/g)];
    return matches.at(-1)?.[1];
  }

  /** A dev server that is not running has no log, which is not an error — the source simply reports nothing. */
  static #sizeOf(file: string) {
    return existsSync(file) ? statSync(file).size : 0;
  }
}
