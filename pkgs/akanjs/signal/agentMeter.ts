import type { PromiseOrObject } from "akanjs/base";
import { Logger } from "akanjs/common";
import { Err } from "akanjs/dictionary";
import type { LlmUsage } from "akanjs/service";

export interface AgentUsageReport {
  account: unknown;
  model: string | null;
  usage: LlmUsage;
}

export interface AgentQuotaCheck {
  account: unknown;
}

export type AgentUsageHook = (report: AgentUsageReport) => PromiseOrObject<void>;
export type AgentQuotaHook = (check: AgentQuotaCheck) => PromiseOrObject<boolean>;

/** `account` is whatever the app's account middleware put on the call; the framework has no account model. */
export class AgentMeter {
  static #usage: AgentUsageHook | null = null;
  static #quota: AgentQuotaHook | null = null;
  static #logger = new Logger("AgentMeter");

  static use({ usage, quota }: { usage?: AgentUsageHook | null; quota?: AgentQuotaHook | null }) {
    if (usage !== undefined) AgentMeter.#usage = usage;
    if (quota !== undefined) AgentMeter.#quota = quota;
  }

  static async run<T extends { usage?: LlmUsage; model?: string }>(account: unknown, turn: () => Promise<T>) {
    if (AgentMeter.#quota && !(await AgentMeter.#quota({ account }))) throw new Err("agent.error.quotaExceeded");
    const result = await turn();
    const hook = AgentMeter.#usage;
    //* Never awaited: a slow or failing ledger must not cost the user a turn the provider already billed.
    if (hook && result.usage)
      void Promise.resolve()
        .then(() => hook({ account, model: result.model ?? null, usage: result.usage as LlmUsage }))
        .catch((error: unknown) =>
          AgentMeter.#logger.error(
            `agent usage hook failed: ${error instanceof Error ? error.message : String(error)}`,
          ),
        );
    return result;
  }
}
