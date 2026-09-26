"use client";
import { cn, usePage } from "akanjs/client";
import type { ReactNode } from "react";
import { AiOutlineInbox } from "react-icons/ai";

import { createOverridable } from "./UiOverride";

export interface EmptyProps {
  className?: string;
  icon?: ReactNode;
  /** Defaults to the localized `base.noData` label. */
  description?: ReactNode;
  /** Rendered below the empty-state body. */
  children?: ReactNode;
  /** In pixels. */
  minHeight?: number;
}

export const DefaultEmpty = ({ className = "", icon, description, children, minHeight = 300 }: EmptyProps) => {
  const { l } = usePage();
  return (
    <div>
      {/* A style, not a class: Tailwind compiles no CSS for an interpolated arbitrary value. */}
      <div
        style={{ minHeight }}
        className={cn("flex w-full flex-col items-center justify-center gap-3 px-6 py-8 text-center", className)}
      >
        <div className="flex size-14 items-center justify-center rounded-full bg-muted text-3xl text-foreground/35">
          {icon ?? <AiOutlineInbox />}
        </div>
        <p className="text-foreground/55 text-sm">{description ?? l("base.noData")}</p>
      </div>
      {children}
    </div>
  );
};

export const Empty = createOverridable("Empty", DefaultEmpty);
