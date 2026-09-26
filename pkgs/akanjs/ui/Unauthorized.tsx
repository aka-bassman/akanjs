"use client";
import { cn, usePage } from "akanjs/client";
import type { ReactNode } from "react";
import { AiOutlineLock } from "react-icons/ai";

import { createOverridable } from "./UiOverride";

export interface UnauthorizedProps {
  className?: string;
  icon?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  minHeight?: number;
}

export const DefaultUnauthorized = ({
  className = "",
  icon,
  description,
  children,
  minHeight = 300,
}: UnauthorizedProps) => {
  const { l } = usePage();
  return (
    <div>
      {/* A style, not a class: Tailwind compiles no CSS for an interpolated arbitrary value. */}
      <div
        style={{ minHeight }}
        className={cn("flex w-full flex-col items-center justify-center gap-3 px-6 py-8 text-center", className)}
      >
        <div className="flex size-14 items-center justify-center rounded-full bg-warning/12 text-3xl text-warning/70">
          {icon ?? <AiOutlineLock />}
        </div>
        <p className="text-foreground/55 text-sm">{description ?? l("base.unauthorized")}</p>
      </div>
      {children}
    </div>
  );
};

export const Unauthorized = createOverridable("Unauthorized", DefaultUnauthorized);
