"use client";
import { useContext, useEffect, useRef } from "react";
import { type AgentSessionOptions, SessionContext, type SessionHistory } from "use-agentic";

export interface HistoryProps {
  load: SessionHistory["load"];
  save: SessionHistory["save"];
  clear: SessionHistory["clear"];
  /** Where a host with its own server-side summary moves its watermark — see `onCompact` on the session options. */
  onCompact?: AgentSessionOptions["onCompact"];
}

/**
 * Puts the enclosing zone's transcript wherever the app keeps it, as a mounted component rather than a prop.
 *
 * `persist` does the same thing and has to be passed to whoever builds the session, which makes every ancestor up
 * to that point a client component — a function cannot cross the server/client boundary as a prop. Mounted here
 * instead, the only client module an app needs is this leaf, and `Agent.Zone` and the chat inside it can be
 * assembled by a server component. Same shape as `Agent.Guide`, and it renders nothing.
 *
 * Restoring follows the session's one rule: it lands only while nothing has happened to the conversation yet, so
 * mounting with the zone restores and mounting later saves from there on.
 */
export const History = ({ load, save, clear, onCompact }: HistoryProps) => {
  const session = useContext(SessionContext);
  if (!session) throw new Error("Agent.History needs an enclosing Agent.Zone or AgentProvider to hold the session.");
  // Read through a ref so an app writing the three functions inline does not re-attach — and re-fetch — per render.
  const latest = useRef({ load, save, clear, onCompact });
  latest.current = { load, save, clear, onCompact };
  useEffect(() => {
    session.setHistory({
      load: () => latest.current.load(),
      save: (messages) => latest.current.save(messages),
      clear: () => latest.current.clear(),
    });
    session.setOnCompact((replaced, summary) => latest.current.onCompact?.(replaced, summary));
    return () => {
      // The session may outlive this component when the app owns it, and a detached store is the honest state.
      session.setHistory(null);
      session.setOnCompact(null);
    };
  }, [session]);
  return null;
};
