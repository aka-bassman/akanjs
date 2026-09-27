import { by, DatabaseRegistry } from "akanjs/document";
import { AgentTurn } from "akanjs/fetch";

export { AgentStop, AgentTurn, agentTurnConstant } from "akanjs/fetch";

// The constant half lives in `akanjs/fetch` for the client registry; that import also registers it before `by()`.
export class AgentTurnDocument extends by(AgentTurn) {}

export const agentTurnDocument = DatabaseRegistry.buildScalar("agentTurn" as const, AgentTurnDocument);
