import { existsSync } from "node:fs";
import path from "node:path";
import { stripAnsi } from "../../stripAnsi";

export interface AkanCliResult {
  command: string;
  ok: boolean;
  exitCode: number;
  output: string;
}

/**
 * Runs `akan` as a child process and captures what it printed.
 *
 * The runners behind these commands write straight to an inherited stdio and return nothing, so there is no
 * in-process call that yields text to hand back to a model. A subprocess also isolates a crash in a build or a
 * typechecker from the agent's own turn.
 */
export class AkanCli {
  readonly #cwd: string;
  readonly #entry: string;

  constructor(cwd: string) {
    this.#cwd = cwd;
    this.#entry = AkanCli.#resolveEntry();
  }

  async run(args: string[], { timeoutMs = 300_000 }: { timeoutMs?: number } = {}): Promise<AkanCliResult> {
    const proc = Bun.spawn([process.execPath, this.#entry, ...args], {
      cwd: this.#cwd,
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, FORCE_COLOR: "0", NO_COLOR: "1" },
    });
    const timer = setTimeout(() => proc.kill(), timeoutMs);
    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited,
    ]);
    clearTimeout(timer);
    // `NO_COLOR` reaches akan's own output but not every tool it shells out to — tsgo colours regardless, and
    // escape sequences in a tool result are tokens the model pays for and cannot read.
    const output = stripAnsi(`${stdout}${stderr}`).trim();
    return { command: `akan ${args.join(" ")}`, ok: exitCode === 0, exitCode, output };
  }

  /**
   * Bundling rewrites `import.meta.dir` to the output directory, where devkit is inlined into the CLI and the
   * entry is `index.js` beside this module; from source the entry belongs to the neighbouring package and is
   * still TypeScript. `Bun.main` is the last resort and is only right when the CLI is the process — an SDK
   * embedder's main is its own. The path is written out rather than resolved through the package name because
   * devkit does not depend on the CLI, and must not start.
   */
  static #resolveEntry() {
    const candidates = [
      path.join(import.meta.dir, "index.js"),
      path.join(import.meta.dir, "..", "..", "..", "cli", "index.ts"),
    ];
    return candidates.find((candidate) => existsSync(candidate)) ?? Bun.main;
  }
}
