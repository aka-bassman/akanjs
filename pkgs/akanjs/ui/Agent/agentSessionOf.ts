import { AgentContext, ensureStoreSurface, ScreenSettle } from "akanjs/store";
import { type AgentRunner, AgentSession, type CompactOptions } from "use-agentic";
import { fetchRunner } from "./fetchRunner";
import { type PersistOption, sessionHistoryOf } from "./sessionHistory";

export interface AgentSessionSetup {
  /** Read per call rather than captured, so text the session builds follows a language switched mid-conversation. */
  l: (key: string) => string;
  /** The zone's scope path, empty for the root agent — it picks both the surface view and the persistence key. */
  view?: string[];
  runner?: AgentRunner;
  instructions?: string;
  maxTurns?: number;
  compact?: CompactOptions;
  persist?: PersistOption;
}

/**
 * The one place a chat session is wired to the akan runtime. Chat and Zone both build one, and building it twice
 * is how a zone came to be the only surface with no `compact` option — an option added on one side of a copy.
 */
export const agentSessionOf = ({
  l,
  view = [],
  runner,
  instructions,
  maxTurns,
  compact,
  persist,
}: AgentSessionSetup): AgentSession => {
  const { surface } = ensureStoreSurface();
  return new AgentSession(view.length ? surface.view(view) : surface, runner ?? fetchRunner(), {
    buildContext: (scoped) => AgentContext.of().blocks(scoped, view),
    settle: () => ScreenSettle.wait(),
    continueAsk: () => ({ question: l("base.agentContinue"), keep: l("base.agentKeepGoing") }),
    ...(instructions ? { instructions } : {}),
    ...(maxTurns ? { maxTurns } : {}),
    ...(compact ? { compact } : {}),
    ...(persist ? { history: sessionHistoryOf(persist, view.join(".")) } : {}),
  });
};
