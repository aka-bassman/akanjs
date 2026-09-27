"use client";
import { cn, usePage } from "akanjs/client";
import { AiOutlineClose, AiOutlineEdit } from "react-icons/ai";
import { createOverridable } from "../UiOverride";
import { Chips } from "./Attach";
import { ReferenceChips } from "./Refer";
import type { QueuedMessage } from "./useChatQueue";

export interface QueuedProps {
  className?: string;
  message: QueuedMessage;
  /** Hands the message back to the composer. */
  onEdit: () => void;
  onCancel: () => void;
}

export const DefaultQueued = ({ className, message, onEdit, onCancel }: QueuedProps) => {
  const { l } = usePage();
  return (
    <div
      aria-label={l("base.agentQueued")}
      className={cn("flex items-start gap-2 border-foreground/5 border-t bg-muted/40 px-4 py-2", className)}
      role="group"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-[10px] text-foreground/40">{l("base.agentQueued")}</span>
        {message.attachments.length ? <Chips attachments={message.attachments} /> : null}
        {message.references.length ? <ReferenceChips references={message.references} /> : null}
        {message.text ? (
          <p className="line-clamp-2 whitespace-pre-wrap text-foreground/70 text-sm">{message.text}</p>
        ) : null}
      </div>
      <button
        aria-label={l("base.agentQueueEdit")}
        className="shrink-0 pt-0.5 text-foreground/50 hover:text-foreground"
        onClick={onEdit}
        title={l("base.agentQueueEdit")}
        type="button"
      >
        <AiOutlineEdit />
      </button>
      <button
        aria-label={l("base.agentQueueCancel")}
        className="shrink-0 pt-0.5 text-foreground/50 hover:text-foreground"
        onClick={onCancel}
        title={l("base.agentQueueCancel")}
        type="button"
      >
        <AiOutlineClose />
      </button>
    </div>
  );
};

export default createOverridable("AgentQueued", DefaultQueued);
