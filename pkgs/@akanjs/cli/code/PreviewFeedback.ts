import { AkanEditScope } from "./AkanEditScope";
import { PreviewView } from "./PreviewView";
import type { TurnFeedbackFinding, TurnFeedbackSource } from "./TurnFeedback";

export interface PreviewFeedbackOptions {
  cwd: string;
  /** Origin of a running dev server. Without one the source is inert. */
  previewUrl?: string;
  /** Every akan route sits under `/:lang`, so a bare path renders nothing. */
  routes?: string[];
  /** Only a model whose input includes images gets one attached; a screenshot is ~83KB per shot. */
  canSeeImages?: boolean;
}

/**
 * Looks at the page after a turn changed the UI.
 *
 * akan is a UI framework, so "does it run" is half the question. The default findings are **text** — page
 * console errors, an empty body, an error overlay, horizontal overflow, a dropped colour slot — because they
 * cost a few hundred tokens, work with any model, and name the defect rather than depicting it. A screenshot is
 * attached only when the active model can actually read one.
 */
export class PreviewFeedback implements TurnFeedbackSource {
  readonly key = "preview";
  readonly #options: PreviewFeedbackOptions;
  #baseline: ReadonlySet<string> = new Set();

  constructor(options: PreviewFeedbackOptions) {
    this.#options = options;
  }

  async begin() {
    this.#baseline = await AkanEditScope.baseline(this.#options.cwd);
  }

  async observe(): Promise<TurnFeedbackFinding | undefined> {
    if (!this.#options.previewUrl || !PreviewView.available) return undefined;
    const scope = await AkanEditScope.since(this.#options.cwd, this.#baseline);
    if (!scope.touchesTsx) return undefined;
    const findings: string[] = [];
    const images: { data: string; mimeType: string }[] = [];
    for (const route of this.#options.routes ?? ["/en/"]) {
      const url = new URL(route, this.#options.previewUrl).toString();
      const probe = await PreviewView.probe(url, { screenshot: !!this.#options.canSeeImages });
      const problems = [...probe.pageErrors, ...probe.consoleErrors, ...probe.domFindings];
      if (!problems.length) continue;
      findings.push(`**${url}**\n${problems.map((line) => `- ${line}`).join("\n")}`);
      if (probe.screenshot) images.push({ data: probe.screenshot, mimeType: "image/png" });
    }
    if (!findings.length) return undefined;
    return { text: ["The rendered page has problems after your UI edits:", ...findings].join("\n\n"), images };
  }
}
