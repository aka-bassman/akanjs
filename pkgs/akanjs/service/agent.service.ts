import { Err } from "akanjs/dictionary";
import type { LlmTurnRequest } from "./predefinedAdaptor/llm.adaptor";
import { LlmAdaptorRole } from "./predefinedAdaptor/role.adaptor";
import { serve } from "./serve";

export class AgentService extends serve("agent" as const, ({ plug }) => ({
  llm: plug(LlmAdaptorRole),
})) {
  async runTurn(request: LlmTurnRequest, onDelta?: (delta: string) => void) {
    const answer = await this.llm.chat(request, onDelta);
    if (!answer) throw new Err("agent.error.llmUnavailable");
    return { text: answer.text ?? "", toolCalls: answer.toolCalls ?? [], stop: answer.stop };
  }
}
