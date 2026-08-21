"use client";
import { AgentContext, ensureStoreSurface } from "akanjs/store";
import { type ReactNode, useMemo, useRef } from "react";
import { AgenticSurface, type AgentRunner, AgentScope, AgentSession, SessionContext, useScopePath } from "use-agentic";
import { fetchRunner } from "./fetchRunner";
import { Guide } from "./Guide";
import { type PersistOption, sessionHistoryOf } from "./sessionHistory";

export interface ZoneProps {
  className?: string;
  /** Names the zone; the scope id and the `data-agent-zone` container both derive from it. */
  id: string;
  label?: string;
  /** Zone-scoped guidance — a mounted Guide, so the root agent reads it too (ancestor rule), a sibling zone never does. */
  instructions?: string;
  runner?: AgentRunner;
  maxTurns?: number;
  /** Keeps this zone's transcript across reloads, keyed by the zone's scope path. */
  persist?: PersistOption;
  children: ReactNode;
}

/**
 * A zone agent: one subtree with its own conversation over a scoped view of the same surface. Everything mounted
 * inside — hook tools, `st.use` subscriptions, guides — belongs to this zone's session *and* to the root agent:
 * zones are views, never walls. An `Agent.Chat` mounted inside binds to this session automatically, so two zones
 * on one screen run two conversations in parallel, each seeing only its own subtree.
 */
export const Zone = ({ className, id, label, instructions, runner, maxTurns, persist, children }: ZoneProps) => {
  const parent = useScopePath();
  const path = useMemo(() => AgenticSurface.childPath(parent, id), [parent.join("."), id]);
  const held = useRef<AgentSession | null>(null);
  held.current ??= new AgentSession(ensureStoreSurface().surface.view(path), runner ?? fetchRunner(), {
    buildContext: (view) => AgentContext.of().blocks(view, path),
    ...(maxTurns ? { maxTurns } : {}),
    ...(persist ? { history: sessionHistoryOf(persist, path.join(".")) } : {}),
  });
  return (
    <AgentScope id={id} kind="zone" label={label}>
      <SessionContext.Provider value={held.current}>
        <div className={className} data-agent-zone={path.join(".")}>
          {instructions ? <Guide instructions={instructions} /> : null}
          {children}
        </div>
      </SessionContext.Provider>
    </AgentScope>
  );
};
