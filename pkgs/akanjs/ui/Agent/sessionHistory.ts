import { getEnv } from "akanjs/base";
import type { ChatMessage, SessionHistory } from "use-agentic";

export type PersistOption = boolean | { storage?: "session" | "local"; key?: string };

/**
 * Maps the `persist` prop onto a `SessionHistory` over web storage. Session storage is the default on purpose:
 * surviving a refresh is the whole ask, and a transcript that dies with the tab never lingers on a shared machine
 * or collides across tabs. `"local"` is the explicit opt-up. The envelope is versioned so a wire change discards
 * stale transcripts instead of replaying them, and only the newest messages are kept under the cap.
 */
export const sessionHistoryOf = (persist: PersistOption | undefined, pathKey = ""): SessionHistory | undefined => {
  if (!persist || typeof window === "undefined") return undefined;
  const option = persist === true ? {} : persist;
  const storage = option.storage === "local" ? window.localStorage : window.sessionStorage;
  const key = option.key ?? `akan.agent.${getEnv().appName}${pathKey ? `.${pathKey}` : ""}`;
  const version = 1;
  const cap = 50;
  return {
    load: () => {
      const raw = storage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { v?: number; messages?: ChatMessage[] };
      return parsed.v === version && Array.isArray(parsed.messages) ? parsed.messages : null;
    },
    save: (messages) => {
      storage.setItem(key, JSON.stringify({ v: version, messages: messages.slice(-cap) }));
    },
    clear: () => {
      storage.removeItem(key);
    },
  };
};
