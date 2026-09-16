import { cn } from "akanjs/client";
import type { ReactNode } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

export interface SpinProps {
  className?: string;
  /**
   * Replaces the built-in icon. It carries its own color; the rotation is the wrapper's
   * (`[&>svg]:animate-spin`), so the node needs no `animate-spin` of its own.
   */
  indicator?: ReactNode;
  isCenter?: boolean;
  /** A named step, or the pixel size the icon is drawn at. */
  size?: "sm" | "md" | "lg" | number;
  /**
   * What the built-in icon is colored with. `"current"` inherits the surface's own foreground, which is what a
   * filled surface needs — `text-primary/70` is legible on the app background and vanishes on a `bg-info` badge
   * or a primary button. Every tone loses to a `text-*` in `className`.
   */
  tone?: "primary" | "current" | "muted";
}

const sizeClass = { sm: "text-sm", md: "text-xl", lg: "text-3xl" } as const;
const toneClass = { primary: "text-primary/70", current: "", muted: "text-muted-foreground" } as const;

/**
 * The color and the size sit on the wrapper, not on the icon: the icon is drawn at `1em` in `currentColor`, so
 * both cascade to it — and `className`, which is also the wrapper's, is merged last and therefore wins. On the
 * icon they would have been unreachable, which is what made every `text-*` and `size-*` a caller passed a no-op.
 */
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
