"use client";
import { type RefObject, useEffect, useMemo, useRef } from "react";
import { type AgentSession, type MessageReference, Reference } from "use-agentic";

interface ChatReferencesSetup {
  session: AgentSession;
  draft: string;
  /** The chat's own version snapshot — a `refer` from anywhere on the page is one of the changes it counts. */
  version: number;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  onDraft: (text: string) => void;
}

/**
 * The composer's half of a reference: writing the token for one somebody pointed at elsewhere, and reading back
 * which references the draft now carries.
 *
 * **The text is the source of truth, and the staged values are looked up beside it.** A reference is on the
 * message because its token is in the message — so deleting the token by hand drops it, exactly as deleting the
 * chip does, and neither can leave the other behind. The draft is never scanned to re-derive a value; a token
 * whose value was never staged (pasted out of an earlier message) travels as a pointer with a note saying to read
 * it again, which is the same shape a restored conversation produces.
 */
export const useChatReferences = ({ session, draft, version, inputRef, onDraft }: ChatReferencesSetup) => {
  const caret = useRef<number | null>(null);
  // Registered for as long as this chat is rendering the draft, so `session.refer` can tell a token nobody has
  // written yet from one nobody ever will.
  useEffect(() => session.attachChat(), [session]);
  useEffect(() => {
    const pending = session.pendingInserts;
    if (!pending.length) return;
    const area = inputRef.current;
    // The caret, because somebody pointing at a card mid-sentence meant it where they were typing. A composer
    // that never forwarded the ref has no caret to read, and appending is the honest fallback.
    const at = area ? area.selectionStart : draft.length;
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
    const area = inputRef.current;
    if (!area) return;
    // After the draft has landed in the DOM: a selection set against the previous value is overwritten by React.
    area.focus();
    area.setSelectionRange(at, at);
  }, [draft]);
  const references = useMemo<MessageReference[]>(() => {
    const staged = new Map(session.staged.map((one) => [Reference.keyOf(one), one]));
    return Reference.parse(draft).map(
      (pointer) => staged.get(Reference.keyOf(pointer)) ?? { ...pointer, note: Reference.unstagedNote },
    );
  }, [draft, version]);
  return {
    references,
    /** Removing the chip removes the token, because the token is what puts the reference on the message. */
    remove: (key: string) => {
      onDraft(Reference.without(draft, key));
      session.unstage(key);
    },
  };
};
