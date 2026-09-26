"use client";
import { cn } from "akanjs/client";
import { useState } from "react";
import type { PublishedTool, SurfaceView } from "use-agentic";
import { buttonRecipe } from "../recipe";

interface ToolProps {
  className?: string;
  surface: SurfaceView;
  tool: PublishedTool;
  onRun: () => void;
}

export default function Tool({ className, surface, tool, onRun }: ToolProps) {
  const [args, setArgs] = useState("{}");
  const [error, setError] = useState("");
  const properties = (tool.parameters as { properties?: unknown } | undefined)?.properties ?? {};
  const run = async () => {
    setError("");
    try {
      await surface.call(tool.name, JSON.parse(args) as Record<string, unknown>);
    } catch (thrown) {
      setError(thrown instanceof Error ? thrown.message : String(thrown));
    }
    onRun();
  };
  return (
    <details className={cn("rounded-field bg-background/60 px-2 py-1", className)}>
      <summary className="flex cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden">
        <span className="truncate font-mono text-xs">{tool.name}</span>
        {tool.needsConfirm ? <span className="shrink-0 text-[10px] text-foreground/40">confirm</span> : null}
      </summary>
      <div className="flex flex-col gap-2 py-2">
        {tool.description ? <p className="text-foreground/70 text-xs">{tool.description}</p> : null}
        <pre className="overflow-x-auto rounded-field bg-muted p-2 text-[10px] leading-tight">
          {JSON.stringify(properties, null, 2)}
        </pre>
        <textarea
          className="w-full rounded-field bg-muted p-2 font-mono text-xs"
          rows={2}
          value={args}
          onChange={(event) => setArgs(event.target.value)}
        />
        {/* `buttonRecipe`, not `Button`: this developer surface does not read the app runtime through `usePage()`. */}
        <button className={buttonRecipe({ size: "xs" })} onClick={run} type="button">
          Run
        </button>
        {error ? <p className="text-destructive text-xs">{error}</p> : null}
      </div>
    </details>
  );
}
