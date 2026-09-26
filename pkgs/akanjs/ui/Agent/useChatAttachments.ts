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

export const useChatAttachments = ({ session, attach, limits = {}, l }: ChatAttachmentsSetup) => {
  const count = limits.perMessageCount ?? maxMessageAttachments;
  const messageBytes = limits.perMessageBytes ?? maxMessageAttachmentBytes;
  const [attached, setAttached] = useState<MessageAttachment[]>([]);
  const [pending, setPending] = useState(0);
  const [dragging, setDragging] = useState(false);
  // A multi-file drop reads one file at a time, and state inside that loop is still the render's value.
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
      // A text drop keeps its default insertion; preventing it here stops text dropping into the composer.
      if (!files.length) return;
      event.preventDefault();
      void add(files);
    },
  };
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
