"use client";
import { createContext, useContext, useSyncExternalStore } from "react";
import type { AgentSession } from "./AgentSession";

export const SessionContext = createContext<AgentSession | null>(null);

/** The enclosing session, re-rendering on every session change. `send`/`abort` are safe to destructure. */
export const useAgent = (): AgentSession => {
  const session = useContext(SessionContext);
  if (!session) throw new Error("useAgent needs an AgentProvider with a session or a runner.");
  useSyncExternalStore(
    session.subscribe,
    () => session.version,
    () => session.version,
  );
  return session;
};
