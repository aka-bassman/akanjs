"use client";
import { usePage } from "akanjs/client";
import { type ReactNode, useEffect, useMemo, useRef } from "react";
import {
  AgenticSurface,
  type AgentRunner,
  AgentScope,
  type AgentSession,
  type CompactOptions,
  SessionContext,
  useScopePath,
} from "use-agentic";
import { agentSessionOf } from "./agentSessionOf";
import { Guide } from "./Guide";
import type { PersistOption } from "./sessionHistory";

export interface ZoneProps {
  className?: string;
  /** Names the zone; the scope id and the `data-agent-zone` container both derive from it. */
  id: string;
  label?: string;
  /** Zone-scoped guidance — a mounted Guide, so the root agent reads it too (ancestor rule), a sibling zone never does. */
  instructions?: string;
  runner?: AgentRunner;
  maxTurns?: number;
  /** When this zone's conversation summarizes itself — same contract as the chat's own `compact`. */
  compact?: CompactOptions;
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
export const Zone = ({
  className,
  id,
  label,
  instructions,
  runner,
  maxTurns,
  compact,
  persist,
  children,
}: ZoneProps) => {
  const { l } = usePage();
  const parent = useScopePath();
  const path = useMemo(() => AgenticSurface.childPath(parent, id), [parent.join("."), id]);
  const translate = useRef(l);
  translate.current = l;
  const held = useRef<AgentSession | null>(null);
  held.current ??= agentSessionOf({
    l: (key) => translate.current(key),
    view: path,
    runner,
    maxTurns,
    compact,
    persist,
  });
  const session = held.current;
  useEffect(
    // The zone owns this session, so it ends with the zone: nothing renders its approvals once this is unmounted.
    () => () => session.abort(),
    [],
  );
  return (
    <AgentScope id={id} kind="zone" label={label}>
      <SessionContext.Provider value={session}>
        <div className={className} data-agent-zone={path.join(".")}>
          {instructions ? <Guide instructions={instructions} /> : null}
          {children}
        </div>
      </SessionContext.Provider>
    </AgentScope>
  );
};
