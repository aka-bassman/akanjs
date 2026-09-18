"use client";
import type { AgentProgressReport, ChatMessage, ToolCallResult } from "use-agentic";
import { createOverridable } from "../UiOverride";
import Bubble from "./Bubble";

export interface StepsProps {
  /**
   * One agent turn, in transcript order: everything the agent said and did between the user message that opened
   * the turn and the next one. What the turn *renders* rather than what it holds on the wire — a tool message
   * whose results a call row already draws is gone, and one holding results no call claims is narrowed to those.
   */
  messages: readonly ChatMessage[];
  /**
   * Whether this turn is still going — only ever the last one of a transcript the session is working on. Without
   * it a replacement cannot tell a live progress line from a finished turn's header, since both are drawn from
   * the same messages and the difference is entirely in whether more are coming.
   */
  isRunning: boolean;
  /** What the call still running last reported about itself, so a slow tool says what it is doing. */
  progress?: (AgentProgressReport & { callId: string }) | null;
  /** Results by call id, gathered across the whole transcript — a call's own row resolves in place from it. */
  results?: ReadonlyMap<string, ToolCallResult>;
}

/**
 * One agent turn as a slot, for the app that wants a turn to read as one thing — its steps folded into a
 * `details`, the answer standing outside them. That shape is out of reach of a per-message slot: the boundary
 * between two turns is not visible from inside either of them.
 *
 * The default draws the turn's messages flat, which is what a transcript has always been, and draws them into a
 * Fragment rather than a box — so it adds no element, takes no `className`, and no existing layout can tell
 * whether this component is between the transcript and its bubbles.
 */
export const DefaultSteps = ({ messages, progress, results }: StepsProps) => {
  return (
    <>
      {messages.map((message, idx) =>
        // A tool row that reached here is a result no call claimed, and it reads neither map — handing them over
        // would only re-render it on every progress tick of a call it has nothing to do with.
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
