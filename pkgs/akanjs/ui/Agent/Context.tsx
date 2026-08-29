"use client";
import { AgentContext } from "akanjs/store";
import { useState } from "react";
import { AgenticSurface } from "use-agentic";
import { buttonRecipe } from "../recipe";

interface ContextProps {
  className?: string;
}

/**
 * Assembles and shows exactly what a turn would carry, on demand — the one preview of "what does the agent see on
 * this screen" that no amount of reading the source answers.
 *
 * The tool list leads, by name only: a zone publishes its tools scope-prefixed, and instructions that name a tool
 * without its prefix name a tool that does not exist. That is invisible in the source of either file and obvious
 * here.
 */
export default function Context({ className }: ContextProps) {
  const [shown, setShown] = useState("");
  const assemble = () => {
    try {
      const { guides, tools } = AgenticSurface.shared.snapshot();
      const context = AgentContext.of().blocks(AgenticSurface.shared);
      const assembled = {
        tools: tools.map((tool) => tool.name),
        ...(guides.length ? { guides } : {}),
        context,
      };
      setShown(JSON.stringify(assembled, null, 2));
    } catch (thrown) {
      setShown(thrown instanceof Error ? thrown.message : String(thrown));
    }
  };
  return (
    <div className={className}>
      <button className={buttonRecipe({ size: "xs" })} onClick={assemble} type="button">
        Assemble
      </button>
      {shown ? (
        <pre className="scrollbar-thin mt-2 max-h-60 overflow-auto rounded-field bg-background/60 p-2 text-[10px] leading-tight">
          {shown}
        </pre>
      ) : null}
    </div>
  );
}
