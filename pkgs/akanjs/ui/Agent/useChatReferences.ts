"use client";
import { type RefObject, useEffect, useMemo, useRef } from "react";
import { type AgentSession, type MessageReference, Reference } from "use-agentic";
import type { ComposerHandle } from "./Composer";

interface ChatReferencesSetup {
  session: AgentSession;
  draft: string;
  version: number;
  handleRef: RefObject<ComposerHandle | null>;
  onDraft: (text: string) => void;
}

// The draft's tokens decide which references travel; a token never staged travels as a pointer with a re-read note.
export const useChatReferences = ({ session, draft, version, handleRef, onDraft }: ChatReferencesSetup) => {
  const caret = useRef<number | null>(null);
  // Lets `session.refer` tell a token nobody has written yet from one nobody ever will.
  useEffect(() => session.attachChat(), [session]);
  useEffect(() => {
    const pending = session.pendingInserts;
    if (!pending.length) return;
    const at = handleRef.current?.caret() ?? draft.length;
    const head = draft.slice(0, at);
    const tail = draft.slice(at);
    const tokens = pending.map((one) => Reference.token(one)).join(" ");
    // A token with no boundary merges into the word the caret was inside, and the parser then reads neither.
    const lead = head && !/\s$/.test(head) ? " " : "";
    onDraft(`${head}${lead}${tokens} ${tail}`);
    caret.current = head.length + lead.length + tokens.length + 1;
    for (const one of pending) session.insertApplied(Reference.keyOf(one));
  }, [version]);
  useEffect(() => {
    const at = caret.current;
    if (at === null) return;
    caret.current = null;
    // After the draft has landed: a caret set against the previous value is overwritten by what renders next.
    handleRef.current?.setCaret(at);
  }, [draft]);
  const references = useMemo<MessageReference[]>(() => {
    const staged = new Map(session.staged.map((one) => [Reference.keyOf(one), one]));
    return Reference.parse(draft).map(
      (pointer) => staged.get(Reference.keyOf(pointer)) ?? { ...pointer, note: Reference.unstagedNote },
    );
  }, [draft, version]);
  return {
    references,
    remove: (key: string) => {
      onDraft(Reference.without(draft, key));
      session.unstage(key);
    },
  };
};
