"use client";
import { cn, usePage } from "akanjs/client";
import type { PendingCard } from "use-agentic";
import { createOverridable } from "../UiOverride";

export interface ToolCardProps {
  className?: string;
  card: PendingCard;
}

/**
 * A call the user answers, parked above the composer where the approval and the question cards sit. What it draws
 * is the app's own — the declaration that published the tool also said what filling it in looks like — so this
 * frame owns only the placement and the way out of it.
 *
 * The way out is not the app's to forget: a card that renders no cancel of its own would otherwise park the turn
 * on a component the user cannot dismiss, so the frame always draws one.
 */
export const DefaultToolCard = ({ className, card }: ToolCardProps) => {
  const { l } = usePage();
  return (
    <div
      aria-label={l("base.agentToolCard")}
      className={cn("flex flex-col gap-2 border-primary/30 border-t bg-primary/5 px-4 py-3", className)}
      role="group"
    >
      {card.render({ args: card.args, submit: card.submit, cancel: card.dismiss })}
      <button
        className="self-end text-foreground/50 text-xs hover:text-foreground"
        onClick={() => card.dismiss()}
        type="button"
      >
        {l("base.skip")}
      </button>
    </div>
  );
};

export default createOverridable("AgentToolCard", DefaultToolCard);
