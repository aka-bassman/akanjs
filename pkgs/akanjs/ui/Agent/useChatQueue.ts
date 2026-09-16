"use client";
import { useEffect, useRef, useState } from "react";
import type { AgentSession, MessageAttachment } from "use-agentic";
import { type AttachLimits, Attachment, maxMessageAttachments } from "./attachment";

/** What the composer held when it was sent: the shape a turn opens with, whether now or after the running one. */
export interface QueuedMessage {
  text: string;
  attachments: MessageAttachment[];
  /** The ask came from the microphone, so the reply it gets is read aloud — carried until the send that opens it. */
  byVoice: boolean;
}

interface ChatQueueSetup {
  session: AgentSession;
  limits?: AttachLimits;
  /** The chat's own version snapshot — the turn ending is one of the changes it counts. */
  version: number;
  l: (key: string, param?: Record<string, string | number>) => string;
  onFlush: (message: QueuedMessage) => void;
}

/**
 * One message parked while a turn runs, sent the moment the turn ends. One slot rather than a list: a second send
 * joins the first, so what reaches the model is one user message and the user has one thing to take back or drop.
 *
 * Mirrored in a ref because the flush and the drop both race the turn's own wind-down: `/new` empties the slot
 * and then aborts, and the abort's notify would otherwise read the state the render started with and send what
 * was just dropped.
 */
export const useChatQueue = ({ session, limits = {}, version, l, onFlush }: ChatQueueSetup) => {
  const count = limits.perMessageCount ?? maxMessageAttachments;
  const [queued, setQueued] = useState<QueuedMessage | null>(null);
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
    /** Parks a message, joined onto one already waiting. False, with the reason noted, when the files would not fit. */
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
        byVoice: !!before?.byVoice || message.byVoice,
      });
      return true;
    },
    /** Empties the slot and answers what was in it — the drop, and the first half of handing it back. */
    take: (): QueuedMessage | null => {
      const message = held.current;
      if (message) put(null);
      return message;
    },
  };
};
