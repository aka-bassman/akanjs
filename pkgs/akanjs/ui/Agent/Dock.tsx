"use client";
import { cn } from "akanjs/client";
import { AgentBridge } from "akanjs/store";
import { useRef, useState } from "react";
import Section from "./Section";
import StateKey from "./StateKey";
import Tool from "./Tool";
import Transcript from "./Transcript";

// Exported because `index.ts` puts `Dock` in the `Agent` namespace object, and the package's declaration emit has to
// name this type from that other module. Same reason `PanelProps` and `FieldProps` are exported.
export interface DockProps {
  className?: string;
  /** Pass the bridge an agent is already driving so both write into one transcript. Defaults to the app's own. */
  bridge?: AgentBridge;
  open?: boolean;
}

/**
 * The in-page surface of the agent bridge: what this page lets an agent do, what it refused, and what it has done.
 *
 * It drives the store directly rather than talking to a model, because a model is not the framework's to choose —
 * there is no provider or key here. An app wires its own agent to `bridge.tools` / `bridge.call` and can render this
 * beside it; on its own it is the way to see the catalogue a page actually publishes, which is the one thing no
 * amount of reading the source answers.
 */
export const Dock = ({ className, bridge, open = false }: DockProps) => {
  const held = useRef<AgentBridge | null>(null);
  held.current ??= bridge ?? AgentBridge.of();
  const agent = held.current;
  const [ran, setRan] = useState(0);
  return (
    <aside
      className={cn(
        "fixed right-4 bottom-4 z-50 flex max-h-[70vh] w-80 flex-col gap-2 overflow-y-auto rounded-box border border-base-content/10 bg-base-100/95 p-3 shadow-lg",
        className,
      )}
    >
      <h2 className="font-semibold text-sm">Agent</h2>
      <Section count={agent.tools.length} open={open} title="Actions">
        {agent.tools.map((tool) => (
          <Tool bridge={agent} key={tool.name} onRun={() => setRan(ran + 1)} tool={tool} />
        ))}
      </Section>
      <Section count={Object.keys(agent.state).length} title="State">
        {Object.entries(agent.state).map(([name, entry]) => (
          <StateKey bridge={agent} entry={entry} key={name} name={name} />
        ))}
      </Section>
      <Section count={agent.refusals.length} title="Refused">
        {agent.refusals.map((refusal) => (
          <div className="flex flex-col" key={refusal.key}>
            <span className="truncate font-mono text-xs">{refusal.key}</span>
            <span className="text-[10px] text-foreground/50">{refusal.reason}</span>
          </div>
        ))}
      </Section>
      <Section count={agent.transcript.length} open title="Transcript">
        <Transcript calls={agent.transcript} />
      </Section>
    </aside>
  );
};
