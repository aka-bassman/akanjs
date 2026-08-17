"use client";
import { cn } from "akanjs/client";
import type { AgentBridge, AgentTool } from "akanjs/store";
import { useState } from "react";
import { buttonRecipe } from "../recipe";

const effectClass: { [key in AgentTool["effect"]]: string } = {
  state: "bg-muted text-foreground/70",
  query: "bg-info/15 text-info",
  mutation: "bg-warning/15 text-warning",
};

interface ToolProps {
  className?: string;
  bridge: AgentBridge;
  tool: AgentTool;
  onRun: () => void;
}

/**
 * One published action, with the arguments as JSON rather than as a generated form.
 *
 * A form per argument is what the API explorer does, and it is the wrong trade here: the point of the dock is to
 * watch a call land in the running app, and every schema shape the store publishes is already legible as JSON.
 */
export default function Tool({ className, bridge, tool, onRun }: ToolProps) {
  const [args, setArgs] = useState("{}");
  const [error, setError] = useState("");
  const run = async () => {
    setError("");
    try {
      await bridge.call(tool.name, JSON.parse(args) as Record<string, unknown>);
    } catch (thrown) {
      setError(thrown instanceof Error ? thrown.message : String(thrown));
    }
    onRun();
  };
  return (
    <details className={cn("rounded-field bg-base-100/60 px-2 py-1", className)}>
      <summary className="flex cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden">
        <span className={cn("rounded-field px-1.5 py-0.5 text-[10px] uppercase", effectClass[tool.effect])}>
          {tool.effect}
        </span>
        <span className="truncate font-mono text-xs">{tool.name}</span>
      </summary>
      <div className="flex flex-col gap-2 py-2">
        {tool.description ? <p className="text-foreground/70 text-xs">{tool.description}</p> : null}
        <pre className="overflow-x-auto rounded-field bg-muted p-2 text-[10px] leading-tight">
          {JSON.stringify(tool.inputSchema.properties, null, 2)}
        </pre>
        <textarea
          className="w-full rounded-field bg-muted p-2 font-mono text-xs"
          rows={2}
          value={args}
          onChange={(event) => setArgs(event.target.value)}
        />
        {/* `buttonRecipe` rather than `Button`, which reads the app runtime through `usePage()` for labels this
            developer surface does not localize anyway — the same English the API explorer uses. */}
        <button className={buttonRecipe({ size: "xs" })} onClick={run} type="button">
          Run
        </button>
        {error ? <p className="text-error text-xs">{error}</p> : null}
      </div>
    </details>
  );
}
