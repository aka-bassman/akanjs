import { getEnv } from "akanjs/base";
import { type ChatMessage, type SessionHistory, Transcript } from "use-agentic";

export type PersistOption = boolean | { storage?: "session" | "local"; key?: string };

// Attachment bytes and reference values never reach storage: web storage holds a few MB and a failed save is
// swallowed, so persisting them would quietly stop persisting the transcript. Pointers (url, ref, refId) stay.
const restoredValue =
  "the conversation was restored from storage, which keeps what the user pointed at but not the value it held";

const withoutContent = (message: ChatMessage): ChatMessage => {
  if (!message.attachments?.length && !message.references?.length) return message;
  return {
    ...message,
    ...(message.attachments?.length
      ? {
          attachments: message.attachments.map(({ name, mimeType, url, ref }) => ({
            name,
            mimeType,
            ...(url ? { url } : {}),
            ...(ref ? { ref } : {}),
          })),
        }
      : {}),
    ...(message.references?.length
      ? {
          references: message.references.map(({ refName, refId, label, path }) => ({
            refName,
            refId,
            label,
            ...(path ? { path } : {}),
            note: restoredValue,
          })),
        }
      : {}),
  };
};

export const sessionHistoryOf = (
  persist: PersistOption | SessionHistory | undefined,
  pathKey = "",
): SessionHistory | undefined => {
  if (!persist) return undefined;
  if (typeof persist === "object" && typeof (persist as SessionHistory).load === "function")
    return persist as SessionHistory;
  if (typeof window === "undefined") return undefined;
  const option = persist === true ? {} : (persist as Exclude<PersistOption, boolean>);
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
      // Cap before `sanitize`: the window may open between a tool call and its result, which a provider refuses.
      const kept = Transcript.sanitize(messages.slice(-cap)).map(withoutContent);
      storage.setItem(key, JSON.stringify({ v: version, messages: kept }));
    },
    clear: () => {
      storage.removeItem(key);
    },
  };
};
