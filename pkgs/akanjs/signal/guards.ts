import { Logger } from "akanjs/common";
import { type Guard, type GuardCls, type GuardScope, guardOf } from "./guard";
import type { SignalContext } from "./signalContext";

export class Public implements Guard {
  static name = "Public";
  static scope: GuardScope = "account";
  canPass(context: SignalContext): boolean {
    return true;
  }
}

export class None implements Guard {
  static name = "None";
  static scope: GuardScope = "account";
  canPass(context: SignalContext): boolean {
    return false;
  }
}

/**
 * Gates the `runAgentTurn` relay, which spends the app's LLM key. Refuses every call until the app registers guards
 * (`option.setAgentAccess(...)`); several are ANDed.
 */
export class AgentRelayAccess implements Guard {
  // fetch serializes guard names and the API explorer filters on them; deleting this breaks that UI.
  static name = "AgentRelayAccess";
  static #guards: GuardCls[] = [];
  static #logger = new Logger("AgentRelayAccess");

  static use(guards: GuardCls | GuardCls[] | null) {
    AgentRelayAccess.#guards = guards ? (Array.isArray(guards) ? [...guards] : [guards]) : [];
  }

  static get hasPolicy() {
    return !!AgentRelayAccess.#guards.length;
  }

  static get scope(): GuardScope {
    return AgentRelayAccess.#guards.some((GuardCls) => GuardCls.scope === "resource") ? "resource" : "account";
  }

  async canPass(context: SignalContext): Promise<boolean> {
    const guards = AgentRelayAccess.#guards;
    if (!guards.length) return false;
    try {
      for (const GuardCls of guards) if (!(await guardOf(GuardCls).canPass(context))) return false;
      return true;
    } catch (error) {
      AgentRelayAccess.#logger.warn(
        `agent relay guard threw, failing closed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }
}
