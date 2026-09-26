"use client";
import { cn } from "akanjs/client";
import type { AgentCall } from "use-agentic";

interface TranscriptProps {
  className?: string;
  calls: readonly AgentCall[];
}

export default function Transcript({ className, calls }: TranscriptProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {calls.map((call, idx) => (
        <div className="flex flex-col rounded-field bg-background/60 px-2 py-1" key={idx}>
          <div className="flex items-baseline gap-2">
            <span className="truncate font-mono text-xs">{call.name}</span>
            <span className="ml-auto shrink-0 text-[10px] text-foreground/40">
              {call.at.toISOString().slice(11, 19)}
            </span>
          </div>
          <span className="truncate font-mono text-[10px] text-foreground/50">{JSON.stringify(call.args)}</span>
          {call.error ? <span className="text-[10px] text-destructive">{call.error}</span> : null}
        </div>
      ))}
    </div>
  );
}
