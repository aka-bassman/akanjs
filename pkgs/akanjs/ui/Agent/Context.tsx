"use client";
import { AgentContext } from "akanjs/store";
import { useState } from "react";
import { AgenticSurface } from "use-agentic";
import { buttonRecipe } from "../recipe";

interface ContextProps {
  className?: string;
}

export default function Context({ className }: ContextProps) {
  const [shown, setShown] = useState("");
  // Production visitors never see the turn snapshot — tool names, guides, and the assembled context.
  if (process.env.AKAN_PUBLIC_ENV === "main" || process.env.NODE_ENV === "develop") return null;
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
