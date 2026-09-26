"use client";
import { cn, usePage } from "akanjs/client";
import { memo } from "react";
import {
  type AgentProgressReport,
  type AgentProgressStep,
  AgentSession,
  type ChatMessage,
  type ToolCallResult,
  ToolOutput,
} from "use-agentic";
import { createOverridable } from "../UiOverride";
import { Chips } from "./Attach";
import Markdown from "./Markdown";
import { ReferenceChips } from "./Refer";
import { tokenCount } from "./tokenCount";

export interface BubbleProps {
  className?: string;
  message: ChatMessage;
  /** What the running call last reported about itself. */
  progress?: (AgentProgressReport & { callId: string }) | null;
  /** Results by call id across the transcript, so a call's own row resolves in place. */
  results?: ReadonlyMap<string, ToolCallResult>;
}

interface RowProps {
  name: string;
  args?: Record<string, unknown>;
  result?: ToolCallResult;
  progress?: AgentProgressReport | null;
}

const payloadOf = ({ result, changes, error }: ToolCallResult) => ({
  ...(result !== undefined ? { result } : {}),
  ...(changes?.length ? { changes } : {}),
  ...(error ? { error } : {}),
});

const stepGlyph = { pending: "○", running: "●", done: "✓", error: "✕" } as const;
const stepTone = {
  pending: "text-foreground/40",
  running: "animate-pulse text-warning",
  done: "text-success",
  error: "text-destructive",
} as const;

interface StepListProps {
  steps: AgentProgressStep[];
}
const StepList = ({ steps }: StepListProps) => {
  const settled = steps.filter((step) => step.status === "done" || step.status === "error").length;
  return (
    <details className="px-2 pb-1">
      <summary className="cursor-pointer font-mono text-[10px] text-foreground/50">
        {settled}/{steps.length}
      </summary>
      <ul className="mt-1 flex flex-col gap-0.5">
        {steps.map((step) => (
          <li className="flex items-baseline gap-2 text-[10px]" key={step.id}>
            <span className={cn("shrink-0", stepTone[step.status])}>{stepGlyph[step.status]}</span>
            <span className="truncate">{step.label}</span>
            {step.detail ? <span className="truncate text-foreground/50">{step.detail}</span> : null}
          </li>
        ))}
      </ul>
    </details>
  );
};

const Row = ({ name, args, result, progress }: RowProps) => {
  const { l } = usePage();
  const payload = result ? payloadOf(result) : null;
  const head = (
    <>
      {result ? (
        <span
          aria-label={l(result.error ? "base.agentToolFailed" : "base.agentToolDone")}
          className={cn("shrink-0 text-[10px]", result.error ? "text-destructive" : "text-success")}
          role="img"
        >
          {result.error ? "✕" : "✓"}
        </span>
      ) : (
        <span
          aria-label={l("base.agentToolRunning")}
          className="size-1.5 shrink-0 animate-pulse rounded-full bg-warning"
          role="img"
        />
      )}
      <span className="shrink-0 font-mono text-xs">{name}</span>
      {progress ? (
        <span className="truncate text-[10px] text-foreground/60">
          {progress.message}
          {progress.total ? ` ${progress.done ?? 0}/${progress.total}` : ""}
        </span>
      ) : null}
      {!progress && args && Object.keys(args).length ? (
        <span className="truncate font-mono text-[10px] text-foreground/50">{JSON.stringify(args)}</span>
      ) : null}
      {result?.error ? <span className="truncate text-[10px] text-destructive">{result.error}</span> : null}
      <span className="ml-auto flex shrink-0 items-baseline gap-2 text-[10px] text-foreground/40">
        {result?.changes?.length ? <span>Δ {result.changes.length}</span> : null}
        {result ? <span>{l("base.agentTokens", { count: tokenCount(ToolOutput.tokensOf(result)) })}</span> : null}
      </span>
    </>
  );
  if (progress?.steps?.length)
    return (
      <div className="rounded-field bg-muted">
        <div className="flex items-baseline gap-2 px-2 py-1">{head}</div>
        <StepList steps={progress.steps} />
      </div>
    );
  if (!payload || !Object.keys(payload).length)
    return <div className="flex items-baseline gap-2 rounded-field bg-muted px-2 py-1">{head}</div>;
  return (
    <details className="group rounded-field bg-muted">
      <summary
        aria-label={l("base.agentToolResult")}
        className="flex cursor-pointer items-baseline gap-2 px-2 py-1"
        title={l("base.agentToolResult")}
      >
        <span className="shrink-0 text-[8px] text-foreground/40 transition-transform group-open:rotate-90">▶</span>
        {head}
      </summary>
      <pre className="scrollbar-thin max-h-64 overflow-auto whitespace-pre-wrap break-all border-foreground/5 border-t px-2 py-1.5 font-mono text-[10px] text-foreground/70">
        {JSON.stringify(payload, null, 2)}
      </pre>
    </details>
  );
};

interface AskProps {
  args?: Record<string, unknown>;
  result: ToolCallResult;
}

// Settled only: an unsettled ask is already on screen as the question card below the transcript.
const Ask = ({ args, result }: AskProps) => {
  const answered = (Array.isArray(result.result) ? result.result : [result.result])
    .filter((one): one is string => typeof one === "string" && !!one)
    .join(", ");
  return (
    <div className="flex flex-col gap-1">
      <p className="rounded-box border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
        {typeof args?.question === "string" ? args.question : ""}
      </p>
      {answered ? (
        <span className="max-w-[85%] self-end rounded-box bg-primary/10 px-3 py-1 text-sm">{answered}</span>
      ) : null}
      {!answered && result.error ? (
        <span className="self-end text-[10px] text-foreground/50">{result.error}</span>
      ) : null}
    </div>
  );
};

const Content = ({ className, message, progress, results }: BubbleProps) => {
  const { l } = usePage();
  if (message.summary)
    return (
      <details className={cn("rounded-box border border-border bg-muted/60 px-3 py-2", className)}>
        <summary className="cursor-pointer text-foreground/50 text-xs">{l("base.agentSummary")}</summary>
        <p className="mt-2 whitespace-pre-wrap text-foreground/70 text-xs">{message.text}</p>
      </details>
    );
  if (message.role === "tool")
    return (
      <div className={cn("flex flex-col gap-1", className)}>
        {(message.toolResults ?? []).map((result) => (
          <Row key={result.id} name={result.name} result={result} />
        ))}
      </div>
    );
  if (message.role === "user")
    return (
      <div className={cn("flex max-w-[85%] flex-col items-end gap-1 self-end", className)}>
        {message.attachments?.length ? <Chips attachments={message.attachments} className="justify-end" /> : null}
        {message.references?.length ? <ReferenceChips className="justify-end" references={message.references} /> : null}
        {message.text ? (
          <p className="whitespace-pre-wrap rounded-box bg-primary/10 px-3 py-2 text-sm">{message.text}</p>
        ) : null}
      </div>
    );
  const isDrafting = !message.text && !message.toolCalls?.length && !message.error;
  return (
    <div className={cn("flex max-w-[85%] flex-col gap-1 self-start", className)}>
      {message.text ? <Markdown className="text-sm">{message.text}</Markdown> : null}
      {(message.toolCalls ?? []).flatMap((call) => {
        const result = results?.get(call.id);
        if (call.name !== AgentSession.askUserTool.name)
          return [
            <Row
              key={call.id}
              args={call.args}
              name={call.name}
              progress={!result && progress?.callId === call.id ? progress : null}
              result={result}
            />,
          ];
        return result ? [<Ask key={call.id} args={call.args} result={result} />] : [];
      })}
      {message.error ? <p className="text-destructive text-xs">{message.error}</p> : null}
      {isDrafting ? <span className="size-2 animate-pulse rounded-full bg-foreground/30" /> : null}
    </div>
  );
};

/** Memoized on prop identity; a component bound to the `AgentBubble` slot replaces it and carries its own `memo`. */
export const DefaultBubble = memo(Content);

export default createOverridable("AgentBubble", DefaultBubble);
