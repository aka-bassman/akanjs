"use client";
import { useContext, useEffect, useRef } from "react";
import { type AgentSessionOptions, SessionContext, type SessionHistory } from "use-agentic";

export interface HistoryProps {
  load: SessionHistory["load"];
  save: SessionHistory["save"];
  clear: SessionHistory["clear"];
  onCompact?: AgentSessionOptions["onCompact"];
}

/** Attaches the enclosing session's history while mounted; restoring lands only before the conversation started. */
export const History = ({ load, save, clear, onCompact }: HistoryProps) => {
  const session = useContext(SessionContext);
  if (!session) throw new Error("Agent.History needs an enclosing Agent.Zone or AgentProvider to hold the session.");
  // A ref, so functions written inline do not re-attach — and re-fetch — per render.
  const latest = useRef({ load, save, clear, onCompact });
  latest.current = { load, save, clear, onCompact };
  useEffect(() => {
    const detachHistory = session.setHistory({
      load: () => latest.current.load(),
      save: (messages) => latest.current.save(messages),
      clear: () => latest.current.clear(),
    });
    const detachCompact = session.setOnCompact((replaced, summary) => latest.current.onCompact?.(replaced, summary));
    return () => {
      detachHistory();
      detachCompact();
    };
  }, [session]);
  return null;
};
