import { Logger } from "akanjs/common";
import type { Guard, GuardScope } from "./guard";
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

export type AgentRelayPolicy = (context: SignalContext) => boolean | Promise<boolean>;

/**
 * Gate for the `runAgentTurn` relay. Every tool runs in the caller's own browser session, so the LLM key is the
 * one thing this endpoint spends — ungated, any visitor can bill the app's provider through fetch alone.
 *
 * The framework has no account model to gate on, so with no policy registered it refuses every call — the same
 * answer `None` gives. An app opens it at boot, e.g.
 * `AgentRelayAccess.use((context) => !!context.get("account"))`. The policy is the app's; the framework cannot know it.
 */
export class AgentRelayAccess implements Guard {
  // fetch serializes guard names and the API explorer filters on them; deleting this breaks that UI.
  static name = "AgentRelayAccess";
  // Reads only the caller, never the call's arguments, so a listing may evaluate it argument-free.
  static scope: GuardScope = "account";
  static #policy: AgentRelayPolicy | null = null;
  static #logger = new Logger("AgentRelayAccess");

  static use(policy: AgentRelayPolicy | null) {
    AgentRelayAccess.#policy = policy;
  }

  static get hasPolicy() {
    return !!AgentRelayAccess.#policy;
  }

  async canPass(context: SignalContext): Promise<boolean> {
    const policy = AgentRelayAccess.#policy;
    if (!policy) return false;
    try {
      return await policy(context);
    } catch (error) {
      AgentRelayAccess.#logger.warn(
        `agent relay policy threw, failing closed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }
}
