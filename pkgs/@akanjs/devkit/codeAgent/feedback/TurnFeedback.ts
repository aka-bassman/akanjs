import type { ExtensionAPI, InlineExtension } from "@earendil-works/pi-coding-agent";

/** A base64 PNG, attached only when the active model can read one. */
export interface TurnFeedbackImage {
  data: string;
  mimeType: string;
}

export interface TurnFeedbackFinding {
  text: string;
  images?: TurnFeedbackImage[];
}

export interface TurnFeedbackSource {
  /** Budget is counted per key, so one stuck source cannot spend another's attempts. */
  key: string;
  /** Record whatever "before" this source compares against. Never throws — a source that cannot arm is skipped. */
  begin(): Promise<void> | void;
  /** What the turn caused that the agent cannot see, or `undefined` when there is nothing to say. */
  observe(): Promise<TurnFeedbackFinding | string | undefined> | TurnFeedbackFinding | string | undefined;
}

export interface TurnFeedbackOptions {
  /** How many times one source may reopen a turn before it gives up and lets the human see it. */
  budget: number;
  onNotice?: (message: string) => void;
}

/**
 * Closes the loop between what a turn did and what the agent knows about it.
 *
 * The agent cannot see that the dev server died, that a generated barrel went stale, or that the page it built
 * renders blank — so it finishes, satisfied, on a broken tree. Each source watermarks at the start of a run and
 * reports at the end; a report is delivered as a follow-up message, which opens a new turn.
 *
 * **It is a follow-up, not a veto.** `agent_end` has no result type — of the engine's hooks only
 * `before_agent_start`, `message_end`, `tool_call`, `tool_result`, `input`, `user_bash`, the `session_before_*`
 * pair, `context` and `resources_discover` can change an outcome — so there is no way to refuse to end a turn.
 *
 * **The budget goes in before the feature.** A source that reports the same unfixable error every turn would
 * otherwise loop until the context window or the wallet runs out, and the loop looks like progress from outside.
 */
export class TurnFeedback {
  readonly #sources: TurnFeedbackSource[];
  readonly #options: TurnFeedbackOptions;
  readonly #spent = new Map<string, number>();

  constructor(sources: TurnFeedbackSource[], options: TurnFeedbackOptions) {
    this.#sources = sources;
    this.#options = options;
  }

  extension(): InlineExtension {
    return {
      name: "akan-turn-feedback",
      factory: (pi: ExtensionAPI) => {
        pi.on("agent_start", async () => {
          await Promise.all(this.#sources.map((source) => TurnFeedback.#quietly(() => source.begin())));
        });
        pi.on("agent_end", async () => {
          const message = await this.collect();
          if (message) pi.sendUserMessage(message, { deliverAs: "followUp" });
        });
      },
    };
  }

  /** Exposed so a host can drive the same machine without an engine session behind it. */
  async collect() {
    const texts: string[] = [];
    const images: TurnFeedbackImage[] = [];
    const reopened: string[] = [];
    for (const source of this.#sources) {
      const finding = await TurnFeedback.#quietly(() => source.observe());
      if (!finding) {
        this.#spent.delete(source.key);
        continue;
      }
      const spent = this.#spent.get(source.key) ?? 0;
      if (spent >= this.#options.budget) {
        this.#options.onNotice?.(`${source.key}: still failing after ${spent} attempts — handing back to you.`);
        continue;
      }
      this.#spent.set(source.key, spent + 1);
      reopened.push(source.key);
      if (typeof finding === "string") texts.push(finding);
      else {
        texts.push(finding.text);
        images.push(...(finding.images ?? []));
      }
    }
    if (!texts.length) return undefined;
    // Said out loud, because the turn that follows is one nobody asked for: the transcript shows more tool
    // calls after the answer and carries nothing that names who sent the agent back to work.
    this.#options.onNotice?.(`${reopened.join(" · ")} reopened the turn — esc stops it`);
    const text = [
      "The previous turn left problems you cannot see from the transcript. Fix them, then stop.",
      ...texts,
    ].join("\n\n");
    return images.length
      ? [{ type: "text" as const, text }, ...images.map((image) => ({ type: "image" as const, ...image }))]
      : text;
  }

  /** Every source is best-effort: no dev server, no git, no preview — all of them mean "nothing to report". */
  static async #quietly<T>(fn: () => T | Promise<T>) {
    try {
      return await fn();
    } catch {
      return undefined;
    }
  }
}
