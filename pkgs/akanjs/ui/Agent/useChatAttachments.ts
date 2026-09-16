"use client";
import { type DragEventHandler, useRef, useState } from "react";
import type { AgentSession, MessageAttachment } from "use-agentic";
import {
  type AttachLimits,
  Attachment,
  type AttachReader,
  maxMessageAttachmentBytes,
  maxMessageAttachments,
} from "./attachment";

interface ChatAttachmentsSetup {
  session: AgentSession;
  attach?: AttachReader;
  limits?: AttachLimits;
  l: (key: string, param?: Record<string, string | number>) => string;
}

/**
 * What the composer is holding, and the ceilings it holds it under. Staged files are mirrored in a ref because a
 * multi-file drop reads them one at a time: the cap has to see what the previous file of the same drop added, and
 * React state inside that loop is still the value the render started with.
 */
export const useChatAttachments = ({ session, attach, limits = {}, l }: ChatAttachmentsSetup) => {
  const count = limits.perMessageCount ?? maxMessageAttachments;
  const messageBytes = limits.perMessageBytes ?? maxMessageAttachmentBytes;
  const [attached, setAttached] = useState<MessageAttachment[]>([]);
  // How many files are being read right now. The built-in readers resolve in a tick, but `attach` is where an app
  // uploads — so since the ceiling moved behind the reader, a large photo is seconds between the drop and the
  // chip, with nothing on screen to say the panel took it.
  const [pending, setPending] = useState(0);
  const [dragging, setDragging] = useState(false);
  const staged = useRef<MessageAttachment[]>([]);
  // Counted, not a boolean: dragging over a child fires leave on the parent, and one flag flickers the highlight.
  const depth = useRef(0);
  const stage = (next: MessageAttachment[]) => {
    staged.current = next;
    setAttached(next);
  };
  const bytes = () => staged.current.reduce((sum, one) => sum + Attachment.bytesOf(one), 0);
  const rest = () => {
    depth.current = 0;
    setDragging(false);
  };
  /** Staged one at a time so one unreadable file names itself instead of failing the whole drop silently. */
  const add = async (files: File[]) => {
    for (const file of files) {
      if (staged.current.length >= count) {
        session.note(l("base.agentAttachTooMany", { count }));
        return;
      }
      setPending((waiting) => waiting + 1);
      try {
        const read = await Attachment.read(file, attach, limits);
        if (Attachment.failure(read))
          session.note(
            l(read === "tooLarge" ? "base.agentAttachTooLarge" : "base.agentAttachUnsupported", { name: file.name }),
          );
        else if (staged.current.some((one) => Attachment.same(one, read)))
          session.note(l("base.agentAttachDuplicate", { name: read.name }));
        else if (bytes() + Attachment.bytesOf(read) > messageBytes)
          session.note(l("base.agentAttachTooMuch", { name: read.name }));
        else stage([...staged.current, read]);
      } catch (error) {
        session.report(`${file.name}: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setPending((waiting) => Math.max(0, waiting - 1));
      }
    }
  };
  const dropProps: { [key: string]: DragEventHandler<HTMLElement> } = {
    onDragEnter: (event) => {
      event.preventDefault();
      depth.current += 1;
      setDragging(true);
    },
    onDragOver: (event) => event.preventDefault(),
    onDragLeave: (event) => {
      event.preventDefault();
      depth.current -= 1;
      if (depth.current <= 0) setDragging(false);
    },
    onDrop: (event) => {
      const files = [...event.dataTransfer.files];
      rest();
      // A text drop is left alone: the drop's default action is the insertion into whatever it landed on, and
      // preventing it here — one ancestor up — is what used to stop text being dropped into the composer.
      if (!files.length) return;
      event.preventDefault();
      void add(files);
    },
  };
  /** Stages files taken back from a parked message, ahead of what was picked since. False, noted, when they do not fit. */
  const restore = (list: MessageAttachment[]): boolean => {
    const next = [...list, ...staged.current];
    const overflow = Attachment.overflow(next, limits);
    if (overflow === "tooMany") session.note(l("base.agentAttachTooMany", { count }));
    else if (overflow === "tooMuch") session.note(l("base.agentAttachTooMuch", { name: list[0]?.name ?? "" }));
    if (overflow) return false;
    stage(next);
    return true;
  };
  return {
    attached,
    pending,
    dragging,
    dropProps,
    add,
    clear: () => stage([]),
    remove: (idx: number) => stage(staged.current.filter((_, at) => at !== idx)),
    restore,
  };
};
