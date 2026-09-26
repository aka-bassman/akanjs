"use client";
import { cn } from "akanjs/client";
import type { AgentBridge, SerializedStoreState } from "akanjs/store";
import { useState } from "react";

interface StateKeyProps {
  className?: string;
  bridge: AgentBridge;
  name: string;
  entry: SerializedStoreState;
  live?: boolean;
}

// Masking happens on read, so a key holding an object no model claims refuses here, not in the catalogue.
export default function StateKey({ className, bridge, name, entry, live }: StateKeyProps) {
  const [shown, setShown] = useState("");
  const read = () => {
    try {
      setShown(JSON.stringify(bridge.read(name), null, 2));
    } catch (thrown) {
      setShown(thrown instanceof Error ? thrown.message : String(thrown));
    }
  };
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <button className="flex items-center gap-2 text-left" type="button" onClick={read}>
        <span className="truncate font-mono text-xs">{name}</span>
        <span className="ml-auto shrink-0 text-[10px] text-foreground/40">
          {live ? "live · " : ""}
          {entry.refName ? `${entry.refName}.${entry.modelType ?? ""}` : entry.type}
          {entry.derived ? " · derived" : ""}
        </span>
      </button>
      {shown ? (
        <pre className="scrollbar-thin max-h-40 overflow-auto rounded-field bg-muted p-2 text-[10px] leading-tight">
          {shown}
        </pre>
      ) : null}
    </div>
  );
}
