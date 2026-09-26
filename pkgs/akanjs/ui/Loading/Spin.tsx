import { cn } from "akanjs/client";
import type { ReactNode } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

export interface SpinProps {
  className?: string;
  /** Replaces the built-in icon; the wrapper spins it, so it needs no `animate-spin` of its own. */
  indicator?: ReactNode;
  isCenter?: boolean;
  /** A named step, or the pixel size the icon is drawn at. */
  size?: "sm" | "md" | "lg" | number;
  /** `"current"` inherits the surface's foreground, for a filled surface; a `text-*` in `className` beats any tone. */
  tone?: "primary" | "current" | "muted";
}

const sizeClass = { sm: "text-sm", md: "text-xl", lg: "text-3xl" } as const;
const toneClass = { primary: "text-primary/70", current: "", muted: "text-muted-foreground" } as const;

// Color and size sit on the wrapper and cascade to the `1em`/`currentColor` icon, so a caller's `className` wins.
export const Spin = ({ className, indicator, isCenter, size = "md", tone = "primary" }: SpinProps) => (
  <div
    className={cn(
      "inline-block py-1",
      !indicator && toneClass[tone],
      typeof size === "string" && sizeClass[size],
      isCenter && "absolute inset-0 flex size-full items-center justify-center py-0",
      className,
    )}
    style={typeof size === "number" ? { fontSize: size } : undefined}
  >
    {indicator ? (
      <span className="[&>svg]:animate-spin">{indicator}</span>
    ) : (
      <AiOutlineLoading3Quarters className="animate-spin" />
    )}
  </div>
);
