import { cn, usePage } from "akanjs/client";
import type { ReactNode } from "react";

import { Spin } from "./Spin";

export interface AreaProps {
  className?: string;
  /** The mark above the message. */
  indicator?: ReactNode;
  /** The message under the mark. */
  children?: ReactNode;
}

export const Area = ({ className, indicator, children }: AreaProps) => {
  const { l } = usePage();
  return (
    <div
      className={cn(
        "absolute inset-0 flex size-full flex-col items-center justify-center gap-2 rounded-[inherit] bg-background/60 backdrop-blur-sm",
        className,
      )}
    >
      {indicator ?? <Spin />}
      <div className="text-foreground/60 text-sm">{children ?? l("base.processing")}</div>
    </div>
  );
};
