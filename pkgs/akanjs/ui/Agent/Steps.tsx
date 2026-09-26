"use client";
import type { AgentProgressReport, ChatMessage, ToolCallResult } from "use-agentic";
import { createOverridable } from "../UiOverride";
import Bubble from "./Bubble";

export interface StepsProps {
  /** One agent turn as rendered: tool messages keep only the results no call row claims. */
  messages: readonly ChatMessage[];
  /** True only for the last turn while the session is still working on it. */
  isRunning: boolean;
  /** What the running call last reported about itself. */
  progress?: (AgentProgressReport & { callId: string }) | null;
  /** Results by call id across the transcript, so a call's own row resolves in place. */
  results?: ReadonlyMap<string, ToolCallResult>;
}

/** Draws the turn's messages flat into a Fragment: no element, no `className`. */
export const DefaultSteps = ({ messages, progress, results }: StepsProps) => {
  return (
    <>
      {messages.map((message, idx) =>
        // An unclaimed tool result reads neither map; passing them would re-render it on every progress tick.
        message.role === "tool" ? (
          <Bubble key={idx} message={message} />
        ) : (
          <Bubble key={idx} message={message} progress={progress} results={results} />
        ),
      )}
    </>
  );
};

export default createOverridable("AgentSteps", DefaultSteps);
