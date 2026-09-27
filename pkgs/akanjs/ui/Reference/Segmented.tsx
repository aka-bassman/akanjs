"use client";
import { cn } from "akanjs/client";
import type { ReactNode } from "react";

export interface SegmentedItem<Key extends string> {
  key: Key;
  label: ReactNode;
  icon?: ReactNode;
}

interface SegmentedProps<Key extends string> {
  className?: string;
  items: readonly SegmentedItem<Key>[];
  value: Key;
  onChange: (value: Key) => void;
}

export const Segmented = <Key extends string>({ className, items, value, onChange }: SegmentedProps<Key>) => (
  <div className={cn("inline-flex w-fit flex-wrap gap-1 rounded-field bg-muted p-1", className)}>
    {items.map((item) => (
      <button
        className={cn(
          "inline-flex items-center gap-1.5 rounded-[calc(var(--radius-field)-0.25rem)] px-3 py-1.5 font-medium text-sm transition-colors",
          item.key === value ? "bg-background text-foreground shadow-sm" : "text-foreground/50 hover:text-foreground",
        )}
        key={item.key}
        onClick={() => onChange(item.key)}
        type="button"
      >
        {item.icon}
        {item.label}
      </button>
    ))}
  </div>
);
