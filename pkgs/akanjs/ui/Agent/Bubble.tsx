"use client";
import { cn } from "akanjs/client";
import { type AgentProgressReport, AgentSession, type ChatMessage, type ToolCallResult } from "use-agentic";
import Markdown from "./Markdown";

interface BubbleProps {
  className?: string;
  message: ChatMessage;
  /** What the call still running last reported about itself, so a slow tool says what it is doing. */
  progress?: (AgentProgressReport & { callId: string }) | null;
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
  progress?: AgentProgressReport | null;
}

/** The arguments ride along because two calls of one tool are the same row otherwise — two searches, one name. */
const Row = ({ name, args, result, progress }: RowProps) => (
  <div className="flex items-baseline gap-2 rounded-field bg-muted px-2 py-1">
    {result ? (
      <span className={cn("shrink-0 text-[10px]", result.error ? "text-destructive" : "text-success")}>
        {result.error ? "✕" : "✓"}
      </span>
    ) : (
      <span className="size-1.5 shrink-0 animate-pulse rounded-full bg-warning" />
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
    {result?.changes?.length ? (
      <span className="ml-auto shrink-0 text-[10px] text-foreground/40">Δ {result.changes.length}</span>
    ) : null}
  </div>
);

interface AskProps {
  args?: Record<string, unknown>;
  result: ToolCallResult;
}

/**
 * A settled `askUser` reads as the exchange it was — the question, then what the user answered — instead of as a
 * tool row. An unsettled one renders nothing here: the question card below the transcript is holding it, and the
 * text would otherwise sit on screen twice.
 */
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

export default function Bubble({ className, message, progress, results }: BubbleProps) {
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
}
