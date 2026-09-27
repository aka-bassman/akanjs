"use client";
import { cn } from "akanjs/client";
import type { ReactNode } from "react";

import { createOverridable } from "./UiOverride";

export interface TooltipProps {
  /** Empty renders the trigger alone. */
  content?: ReactNode;
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
  variant?: "default" | "primary" | "info";
}

const variantClass = {
  default: "bg-foreground text-background",
  primary: "bg-primary text-primary-foreground",
  info: "bg-info text-info-foreground",
};

const arrowClass = {
  default: "bg-foreground",
  primary: "bg-primary",
  info: "bg-info",
};

const arrowSideClass = {
  top: "-bottom-1 left-1/2 -translate-x-1/2",
  bottom: "-top-1 left-1/2 -translate-x-1/2",
  left: "-right-1 top-1/2 -translate-y-1/2",
  right: "-left-1 top-1/2 -translate-y-1/2",
};

const sideClass = {
  top: "bottom-full left-1/2 mb-1.5 -translate-x-1/2",
  bottom: "top-full left-1/2 mt-1.5 -translate-x-1/2",
  left: "right-full top-1/2 mr-1.5 -translate-y-1/2",
  right: "left-full top-1/2 ml-1.5 -translate-y-1/2",
};

// Pure CSS on hover/focus-within, with no viewport-edge flip.
const DefaultTooltip = ({ content, children, side = "top", className, variant = "default" }: TooltipProps) => {
  if (content === undefined || content === null || content === "") return <>{children}</>;
  return (
    // `w-fit`: `inline-flex` alone still stretches in a column flex container, centring the bubble far from it.
    <span className="group/tooltip relative inline-flex w-fit">
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-50 w-max max-w-xs rounded-field px-2 py-1 text-xs opacity-0 shadow-lg transition-opacity delay-0 duration-150 group-focus-within/tooltip:opacity-100 group-hover/tooltip:opacity-100 group-hover/tooltip:delay-300",
          sideClass[side],
          variantClass[variant],
          className,
        )}
      >
        {content}
        <span className={cn("absolute size-2 rotate-45", arrowSideClass[side], arrowClass[variant])} />
      </span>
    </span>
  );
};

export const Tooltip = createOverridable("Tooltip", DefaultTooltip);
