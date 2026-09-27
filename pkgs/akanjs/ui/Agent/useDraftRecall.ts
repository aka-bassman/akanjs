"use client";
import { useRef, useState } from "react";
import type { ChatMessage } from "use-agentic";

const asked = (messages: readonly ChatMessage[], cap: number) =>
  messages
    .flatMap((message) => (message.role === "user" && !message.summary && message.text ? [message.text] : []))
    .slice(-cap);

// ↑ walks back through what was sent, ↓ forward; `at` 0 is the draft it was walked away from.
export const useDraftRecall = (messages: readonly ChatMessage[]) => {
  const cap = 30;
  const sent = useRef<string[] | null>(null);
  if (!sent.current) sent.current = asked(messages, cap);
  const walked = sent.current;
  const stashed = useRef("");
  const [at, setAt] = useState(0);
  return {
    has: !!walked.length,
    remember: (text: string) => {
      const history = sent.current ?? [];
      if (history[history.length - 1] !== text) sent.current = [...history, text].slice(-cap);
      setAt(0);
    },
    step: (delta: number, draft: string): string | null => {
      const history = sent.current ?? [];
      const next = Math.max(0, Math.min(at + delta, history.length));
      if (next === at) return null;
      if (!at) stashed.current = draft;
      setAt(next);
      return next ? history[history.length - next] : stashed.current;
    },
  };
};
