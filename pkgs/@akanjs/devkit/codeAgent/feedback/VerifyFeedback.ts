import { AkanEditScope } from "../tools/AkanEditScope";
import { AkanVerifier } from "../tools/AkanVerifier";
import type { TurnFeedbackSource } from "./TurnFeedback";

export interface VerifyFeedbackOptions {
  cwd: string;
  /** A read-only profile reports what is stale instead of running a chain that would write generated files. */
  readOnly?: boolean;
}

/**
 * Runs the validation chain over whatever a turn changed and feeds the failures back.
 *
 * The model has a verification tool and the observed failure is that it finishes without calling it — so this
 * is not a second tool but a hook. Detection reads git rather than tool events, because an edit made through
 * `bash` produces no write tool call and is exactly the kind a model forgets to verify.
 */
export class VerifyFeedback implements TurnFeedbackSource {
  readonly key = "verify";
  readonly #options: VerifyFeedbackOptions;
  readonly #verifier: AkanVerifier;
  #baseline: ReadonlySet<string> = new Set();

  constructor(options: VerifyFeedbackOptions) {
    this.#options = options;
    this.#verifier = new AkanVerifier(options.cwd);
  }

  async begin() {
    this.#baseline = await AkanEditScope.baseline(this.#options.cwd);
  }

  async observe() {
    const scope = await AkanEditScope.since(this.#options.cwd, this.#baseline);
    if (!scope.apps.length && !scope.libs.length) return undefined;
    if (this.#options.readOnly) return VerifyFeedback.#readOnlyNotice(scope.needsSync, [...scope.apps, ...scope.libs]);
    const report = await this.#verifier.verify(scope);
    if (report.ok) return undefined;
    return AkanVerifier.summarize(report);
  }

  static #readOnlyNotice(needsSync: boolean, targets: string[]) {
    if (!needsSync) return undefined;
    return `Files were added or removed under ${targets.join(", ")}, so the generated barrels are stale. This profile does not write, so run \`akan sync ${targets.join(" ")}\` yourself before trusting a typecheck.`;
  }
}
