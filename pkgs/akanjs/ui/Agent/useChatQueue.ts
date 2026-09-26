"use client";
import { useEffect, useRef, useState } from "react";
import type { AgentSession, MessageAttachment, MessageReference } from "use-agentic";
import { Reference } from "use-agentic";
import { type AttachLimits, Attachment, maxMessageAttachments } from "./attachment";

export interface QueuedMessage {
  text: string;
  attachments: MessageAttachment[];
  references: MessageReference[];
  /** The ask came from the microphone, so its reply is read aloud. */
  byVoice: boolean;
}

interface ChatQueueSetup {
  session: AgentSession;
  limits?: AttachLimits;
  version: number;
  l: (key: string, param?: Record<string, string | number>) => string;
  onFlush: (message: QueuedMessage) => void;
}

export const useChatQueue = ({ session, limits = {}, version, l, onFlush }: ChatQueueSetup) => {
  const count = limits.perMessageCount ?? maxMessageAttachments;
  const [queued, setQueued] = useState<QueuedMessage | null>(null);
  // `/new` empties the slot then aborts, and the abort's notify would otherwise read stale state and send it.
  const held = useRef<QueuedMessage | null>(null);
  const put = (next: QueuedMessage | null) => {
    held.current = next;
    setQueued(next);
  };
  useEffect(() => {
    const message = held.current;
    if (!message || session.isRunning) return;
    put(null);
    onFlush(message);
  }, [version]);
  return {
    queued,
    push: (message: QueuedMessage): boolean => {
      const before = held.current;
      const attachments = [...(before?.attachments ?? []), ...message.attachments];
      const overflow = Attachment.overflow(attachments, limits);
      if (overflow === "tooMany") session.note(l("base.agentAttachTooMany", { count }));
      else if (overflow === "tooMuch")
        session.note(l("base.agentAttachTooMuch", { name: message.attachments[0]?.name ?? "" }));
      if (overflow) return false;
      put({
        text: [before?.text, message.text].filter(Boolean).join("\n"),
        attachments,
        // Keyed by pointer: the same field named in both messages keeps its newer value.
        references: [
          ...message.references,
          ...(before?.references ?? []).filter(
            (one) => !message.references.some((fresh) => Reference.keyOf(fresh) === Reference.keyOf(one)),
          ),
        ],
        byVoice: !!before?.byVoice || message.byVoice,
      });
      return true;
    },
    take: (): QueuedMessage | null => {
      const message = held.current;
      if (message) put(null);
      return message;
    },
  };
};
