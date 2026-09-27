"use client";
import { cn, usePage } from "akanjs/client";
import type { PendingCard } from "use-agentic";
import { createOverridable } from "../UiOverride";

export interface ToolCardProps {
  className?: string;
  card: PendingCard;
}

/** Always draws a skip, so a card rendering no cancel of its own cannot park the turn for good. */
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
