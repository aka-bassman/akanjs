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
  /** Hands the message back to the composer to be changed — the only way to edit what is already out of it. */
  onEdit: () => void;
  onCancel: () => void;
}

/**
 * The message waiting for the running turn to end, parked above the composer where the question card sits. It is
 * shown rather than silently held because a send that vanished from the composer and has not appeared in the
 * transcript reads as lost, and because taking it back or dropping it needs somewhere to click.
 */
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
