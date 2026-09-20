import { AkanCli, type AkanCliResult } from "./AkanCli";
import type { AkanEditScopeResult } from "./AkanEditScope";

export interface AkanVerifyReport {
  ok: boolean;
  steps: AkanCliResult[];
  scope: AkanEditScopeResult;
}

/**
 * Runs the workspace's own validation chain over whatever a turn changed.
 *
 * The order is the one the guide names and it is not interchangeable: `sync` first because a stale generated
 * barrel makes `typecheck` report a missing symbol whose real cause is a file that was added, which sends the
 * model editing the wrong place. `lint` before `typecheck` because it rewrites formatting and import order,
 * and a typecheck run against the pre-format text reports positions that no longer exist.
 */
export class AkanVerifier {
  readonly #cli: AkanCli;

  constructor(cwd: string) {
    this.#cli = new AkanCli(cwd);
  }

  async verify(scope: AkanEditScopeResult): Promise<AkanVerifyReport> {
    const steps: AkanCliResult[] = [];
    const targets = [...scope.apps, ...scope.libs];
    if (scope.needsSync) for (const target of targets) steps.push(await this.#cli.run(["sync", target]));
    for (const target of targets) steps.push(await this.#cli.run(["lint", target]));
    for (const app of scope.apps) steps.push(await this.#cli.run(["typecheck", app]));
    if (scope.touchesTsx) steps.push(await this.#cli.run(["quality", "ssr"]));
    return { ok: steps.every((step) => step.ok), steps, scope };
  }

  /** What a model needs to act: which step failed and its tail — never the whole output, which rides every later turn. */
  static summarize(report: AkanVerifyReport, { tailLines = 40 }: { tailLines?: number } = {}) {
    if (!report.steps.length) return "No akan target was touched, so there was nothing to verify.";
    if (report.ok) return `Verification passed: ${report.steps.map((step) => step.command).join(", ")}.`;
    const failed = report.steps.filter((step) => !step.ok);
    const passed = report.steps.filter((step) => step.ok).map((step) => step.command);
    const blocks = failed.map((step) => `### ${step.command} (exit ${step.exitCode})\n${tail(step.output, tailLines)}`);
    return [
      `Verification failed: ${failed.map((step) => step.command).join(", ")}.`,
      passed.length ? `Passed: ${passed.join(", ")}.` : "",
      ...blocks,
    ]
      .filter(Boolean)
      .join("\n\n");
  }
}

const tail = (text: string, lines: number) => {
  const all = text.split("\n");
  return all.length <= lines ? text : `…\n${all.slice(-lines).join("\n")}`;
};
