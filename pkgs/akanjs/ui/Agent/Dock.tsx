"use client";
import { cn } from "akanjs/client";
import { type AgentBridge, ensureStoreSurface, StoreRegistry } from "akanjs/store";
import { useRef, useState } from "react";
import { AgenticSurface } from "use-agentic";
import Context from "./Context";
import Section from "./Section";
import StateKey from "./StateKey";
import Tool from "./Tool";
import Transcript from "./Transcript";

// Exported so declaration emit can name it through the `Agent` namespace object in `index.ts`.
export interface DockProps {
  className?: string;
  /** Defaults to the app's own. */
  bridge?: AgentBridge;
  /** Defaults to the whole screen's; pass a zone's own to inspect it. */
  surface?: AgenticSurface;
  open?: boolean;
}

export const Dock = ({ className, bridge, surface, open = false }: DockProps) => {
  const held = useRef<{ bridge: AgentBridge; surface: AgenticSurface } | null>(null);
  held.current ??= { bridge: bridge ?? ensureStoreSurface().bridge, surface: surface ?? AgenticSurface.shared };
  const agent = held.current.bridge;
  const view = held.current.surface;
  const [ran, setRan] = useState(0);
  const liveKeys = StoreRegistry.instance.liveKeys;
  const { tools } = view.snapshot();
  const stateEntries = Object.entries(agent.state).sort(([a], [b]) => {
    const [liveA, liveB] = [liveKeys.has(a), liveKeys.has(b)];
    if (liveA !== liveB) return liveA ? -1 : 1;
    return a < b ? -1 : 1;
  });
  // Production visitors never see this: it lists every published tool and can run them by hand.
  if (process.env.AKAN_PUBLIC_ENV === "main") return null;
  return (
    <aside
      data-agent-ui=""
      className={cn(
        "scrollbar-thin fixed right-4 bottom-4 z-50 flex max-h-[70vh] w-80 flex-col gap-2 overflow-y-auto rounded-box border border-border bg-background/95 p-3 shadow-lg",
        className,
      )}
    >
      <h2 className="font-semibold text-sm">Agent</h2>
      <Section count={tools.length} open={open} title="Tools">
        {tools.map((tool) => (
          <Tool key={tool.name} onRun={() => setRan(ran + 1)} surface={view} tool={tool} />
        ))}
      </Section>
      <Section count={Object.keys(agent.state).length} title="State">
        {stateEntries.map(([name, entry]) => (
          <StateKey bridge={agent} entry={entry} key={name} live={liveKeys.has(name)} name={name} />
        ))}
      </Section>
      <Section count={liveKeys.size} title="Context">
        <Context />
      </Section>
      <Section count={agent.refusals.length} title="Withheld">
        {agent.refusals.map((refusal) => (
          <div className="flex flex-col" key={refusal.key}>
            <span className="truncate font-mono text-xs">{refusal.key}</span>
            <span className="text-[10px] text-foreground/50">{refusal.reason}</span>
          </div>
        ))}
      </Section>
      <Section count={view.transcript.length} open title="Transcript">
        <Transcript calls={view.transcript} />
      </Section>
    </aside>
  );
};
