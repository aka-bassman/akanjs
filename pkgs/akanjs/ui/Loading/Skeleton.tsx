import { cn } from "akanjs/client";
import type { CSSProperties } from "react";

export interface SkeletonProps {
  className?: string;
  active?: boolean;
  style?: CSSProperties;
}

export const Button = ({ className = "", active = true, style }: SkeletonProps) => (
  <div
    className={cn("inline-block h-9 w-20 rounded-field bg-muted align-bottom", active && "animate-pulse", className)}
    style={style}
  />
);

export const Input = ({ className = "", active = true, style }: SkeletonProps) => (
  <div
    className={cn("inline-block h-9 w-44 rounded-field bg-muted align-bottom", active && "animate-pulse", className)}
    style={style}
  />
);

export const Skeleton = ({ className = "", active = true, style }: SkeletonProps) => (
  <div className={cn("flex w-full flex-col gap-3", active && "animate-pulse", className)} style={style}>
    <div className="h-4 w-2/5 rounded-field bg-muted" />
    <div className="h-4 w-full rounded-field bg-muted" />
    <div className="h-4 w-full rounded-field bg-muted" />
    <div className="h-4 w-3/5 rounded-field bg-muted" />
  </div>
);
