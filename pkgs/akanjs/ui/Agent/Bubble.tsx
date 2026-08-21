"use client";
import { cn } from "akanjs/client";
import type { ChatMessage, ToolCallResult } from "use-agentic";

interface BubbleProps {
  className?: string;
  message: ChatMessage;
  /**
   * Results by call id, gathered across the transcript. A call and its result are two wire messages — the model
   * needs both — but they are one thing that happened, so the call's own row resolves in place instead of the
   * name appearing again as a second row.
   */
  results?: ReadonlyMap<string, ToolCallResult>;
}

interface RowProps {
  name: string;
  args?: Record<string, unknown>;
  result?: ToolCallResult;
}

/** The arguments ride along because two calls of one tool are the same row otherwise — two searches, one name. */
const Row = ({ name, args, result }: RowProps) => (
  <div className="flex items-baseline gap-2 rounded-field bg-muted px-2 py-1">
    {result ? (
      <span className={cn("shrink-0 text-[10px]", result.error ? "text-error" : "text-success")}>
        {result.error ? "✕" : "✓"}
      </span>
    ) : (
      <span className="size-1.5 shrink-0 animate-pulse rounded-full bg-warning" />
    )}
    <span className="shrink-0 font-mono text-xs">{name}</span>
    {args && Object.keys(args).length ? (
      <span className="truncate font-mono text-[10px] text-foreground/50">{JSON.stringify(args)}</span>
    ) : null}
    {result?.error ? <span className="truncate text-[10px] text-error">{result.error}</span> : null}
    {result?.changes?.length ? (
      <span className="ml-auto shrink-0 text-[10px] text-foreground/40">Δ {result.changes.length}</span>
    ) : null}
  </div>
);

export default function Bubble({ className, message, results }: BubbleProps) {
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
      <div
        className={cn(
          "max-w-[85%] self-end whitespace-pre-wrap rounded-box bg-primary/10 px-3 py-2 text-sm",
          className,
        )}
      >
        {message.text}
      </div>
    );
  const isDrafting = !message.text && !message.toolCalls?.length && !message.error;
  return (
    <div className={cn("flex max-w-[85%] flex-col gap-1 self-start", className)}>
      {message.text ? <p className="whitespace-pre-wrap text-sm">{message.text}</p> : null}
      {(message.toolCalls ?? []).map((call) => (
        <Row key={call.id} args={call.args} name={call.name} result={results?.get(call.id)} />
      ))}
      {message.error ? <p className="text-error text-xs">{message.error}</p> : null}
      {isDrafting ? <span className="size-2 animate-pulse rounded-full bg-foreground/30" /> : null}
    </div>
  );
}
