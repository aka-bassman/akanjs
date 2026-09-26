import { AgentContext, AgentVisual, type AgentVisualOption, ensureStoreSurface, ScreenSettle } from "akanjs/store";
import {
  type AgentRunner,
  AgentSession,
  type AgentSessionOptions,
  type CompactOptions,
  type SessionHistory,
} from "use-agentic";
import { fetchRunner } from "./fetchRunner";
import { type PersistOption, sessionHistoryOf } from "./sessionHistory";
import { type BuiltinOption, sessionView } from "./sessionView";

export interface AgentSessionSetup {
  /** Read per call, so the session's own text follows a language switched mid-conversation. */
  l: (key: string) => string;
  /** The zone's scope path, empty for the root agent; it picks both the surface view and the persistence key. */
  view?: string[];
  runner?: AgentRunner;
  instructions?: string;
  maxTurns?: number;
  compact?: CompactOptions;
  /** Every runtime tool by default, `false` none, an array exactly the ones it names. */
  builtins?: BuiltinOption;
  /** Web storage by default, or an app `SessionHistory`. */
  persist?: PersistOption | SessionHistory;
  /** Called after a compaction replaced messages with one summary. */
  onCompact?: AgentSessionOptions["onCompact"];
  /** `false` draws nothing while this session drives the page. */
  visual?: boolean | AgentVisualOption;
}

export const agentSessionOf = ({
  l,
  view = [],
  runner,
  instructions,
  maxTurns,
  compact,
  builtins,
  persist,
  onCompact,
  visual,
}: AgentSessionSetup): AgentSession => {
  const { surface } = ensureStoreSurface();
  const history = sessionHistoryOf(persist, view.join("."));
  const drawing = AgentVisual.sink(visual);
  return new AgentSession(sessionView(surface, view, builtins), runner ?? fetchRunner(), {
    buildContext: (scoped) => AgentContext.of().blocks(scoped, view),
    settle: () => ScreenSettle.wait(),
    continueAsk: () => ({ question: l("base.agentContinue"), keep: l("base.agentKeepGoing") }),
    ...(instructions ? { instructions } : {}),
    ...(maxTurns ? { maxTurns } : {}),
    ...(compact ? { compact } : {}),
    ...(history ? { history } : {}),
    ...(onCompact ? { onCompact } : {}),
    ...(drawing ?? {}),
  });
};
