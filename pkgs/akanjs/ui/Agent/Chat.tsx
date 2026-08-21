"use client";
import { cn, fetch, usePage } from "akanjs/client";
import type { PromptResult } from "akanjs/signal";
import { AgentContext, type AgentPrompt, AgentPrompts, ensureStoreSurface } from "akanjs/store";
import { useContext, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AiOutlineClear, AiOutlineClose, AiOutlineRobot } from "react-icons/ai";
import { type AgentRunner, AgentSession, SessionContext } from "use-agentic";
import { Button } from "../Button";
import { inputRecipe } from "../recipe";
import { createOverridable } from "../UiOverride";
import Approval from "./Approval";
import Bubble from "./Bubble";
import { fetchRunner } from "./fetchRunner";
import { type PersistOption, sessionHistoryOf } from "./sessionHistory";

export interface ChatProps {
  className?: string;
  title?: string;
  /** App-global framing. Route-scoped guidance layers on it through mounted `Agent.Guide`s. */
  instructions?: string;
  /** Swap the transport; the default drives the app's `runAgentTurn` endpoint. */
  runner?: AgentRunner;
  maxTurns?: number;
  defaultOpen?: boolean;
  /** Keeps the transcript across reloads — sessionStorage by default, `{ storage: "local" }` to outlive the tab. */
  persist?: PersistOption;
}

/**
 * The user-facing half of the in-page agent: one floating chat wired to the same surface the dock inspects.
 * The conversation loop runs in this browser session — every tool call executes here, gated by the approval
 * card — and the session lives in a ref, so it survives reopening the panel and dies with the page (v1 keeps
 * no history). An enclosing AgentProvider's session wins, which is how an app isolates a surface or swaps the
 * loop while keeping this UI.
 */
export const DefaultChat = ({
  className,
  title,
  instructions,
  runner,
  maxTurns,
  defaultOpen = false,
  persist,
}: ChatProps) => {
  const { l } = usePage();
  const provided = useContext(SessionContext);
  const held = useRef<AgentSession | null>(null);
  held.current ??=
    provided ??
    new AgentSession(ensureStoreSurface().surface, runner ?? fetchRunner(), {
      buildContext: (surface) => AgentContext.of().blocks(surface),
      ...(instructions ? { instructions } : {}),
      ...(maxTurns ? { maxTurns } : {}),
      ...(persist ? { history: sessionHistoryOf(persist) } : {}),
    });
  const session = held.current;
  const prompts = useRef<AgentPrompts | null>(null);
  prompts.current ??= AgentPrompts.of();
  const version = useSyncExternalStore(
    session.subscribe,
    () => session.version,
    () => session.version,
  );
  const [open, setOpen] = useState(defaultOpen);
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [version, open]);
  const runPrompt = async (prompt: AgentPrompt, args: string[]) => {
    const usage = `/${prompt.name} ${prompt.args.map((arg) => `<${arg.name}>`).join(" ")}`.trim();
    if (args.length < prompt.args.filter((arg) => arg.required).length) {
      session.report(`Usage: ${usage}`);
      return;
    }
    const handler = (fetch as unknown as Record<string, (...callArgs: unknown[]) => Promise<PromptResult>>)[
      prompt.name
    ];
    if (typeof handler !== "function") {
      session.report(`/${prompt.name} is not mounted on this app.`);
      return;
    }
    try {
      const result = await handler(...args);
      await session.send(AgentPrompts.messagesOf(result));
    } catch (error) {
      session.report(`/${prompt.name} failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  const pick = (prompt: AgentPrompt) => {
    if (prompt.args.some((arg) => arg.required)) {
      setDraft(`/${prompt.name} `);
      return;
    }
    setDraft("");
    void runPrompt(prompt, []);
  };
  const send = () => {
    const text = draft.trim();
    if (!text || session.isRunning) return;
    const command = AgentPrompts.parseCommand(text);
    const prompt = command ? prompts.current?.find(command.name) : null;
    setDraft("");
    if (command && prompt) {
      void runPrompt(prompt, command.args);
      return;
    }
    void session.send(text);
  };
  const menu = /^\/[A-Za-z0-9_-]*$/.test(draft)
    ? (prompts.current?.list() ?? []).filter((prompt) => `/${prompt.name}`.startsWith(draft))
    : [];
  // A call and its result are two wire messages because the model needs both, but they are one thing that
  // happened: the call's row resolves in place, and the result message renders only what no call claimed —
  // a persisted transcript is capped, so a result can outlive the assistant message that made it.
  const resultOf = new Map(session.messages.flatMap((message) => message.toolResults ?? []).map((r) => [r.id, r]));
  const claimed = new Set(session.messages.flatMap((message) => message.toolCalls?.map((call) => call.id) ?? []));
  const bubbles = session.messages.flatMap((message, idx) => {
    if (message.role !== "tool") return [<Bubble key={idx} message={message} results={resultOf} />];
    const orphans = (message.toolResults ?? []).filter((result) => !claimed.has(result.id));
    return orphans.length ? [<Bubble key={idx} message={{ ...message, toolResults: orphans }} />] : [];
  });
  if (!open)
    return (
      <button
        aria-label={l("base.agent")}
        data-agent-ui=""
        className={cn(
          "fixed right-4 bottom-4 z-50 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105",
          className,
        )}
        onClick={() => setOpen(true)}
        type="button"
      >
        <AiOutlineRobot className="text-2xl" />
      </button>
    );
  return (
    // data-agent-ui keeps the chat out of readScreen, so a turn never re-reads its own transcript.
    <aside
      data-agent-ui=""
      className={cn(
        "fixed right-4 bottom-4 z-50 flex h-[min(600px,calc(100dvh-2rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-box border border-border bg-background shadow-xl",
        className,
      )}
    >
      <header className="flex items-center gap-2 border-base-content/5 border-b px-4 py-3">
        <span className="font-semibold text-sm">{title ?? l("base.agent")}</span>
        {session.isRunning ? <span className="size-2 animate-pulse rounded-full bg-primary" /> : null}
        <span className="ml-auto flex items-center gap-2">
          {session.messages.length && !session.isRunning ? (
            <button
              aria-label={l("base.agentClear")}
              className="text-foreground/50 hover:text-foreground"
              onClick={() => session.reset()}
              type="button"
            >
              <AiOutlineClear />
            </button>
          ) : null}
          <button
            aria-label={l("base.cancel")}
            className="text-foreground/50 hover:text-foreground"
            onClick={() => setOpen(false)}
            type="button"
          >
            <AiOutlineClose />
          </button>
        </span>
      </header>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-3" ref={listRef}>
        {bubbles.length ? (
          bubbles
        ) : (
          <p className="py-6 text-center text-foreground/40 text-sm">{l("base.agentIntro")}</p>
        )}
      </div>
      {session.pendingApproval ? <Approval approval={session.pendingApproval} /> : null}
      {menu.length ? (
        <div className="flex max-h-40 flex-col overflow-y-auto border-base-content/5 border-t py-1">
          {menu.map((prompt) => (
            <button
              className="flex items-baseline gap-2 px-4 py-1.5 text-left hover:bg-muted"
              key={prompt.name}
              onClick={() => pick(prompt)}
              type="button"
            >
              <span className="shrink-0 font-mono text-xs">/{prompt.name}</span>
              {prompt.args.length ? (
                <span className="shrink-0 font-mono text-[10px] text-foreground/40">
                  {prompt.args.map((arg) => `<${arg.name}>`).join(" ")}
                </span>
              ) : null}
              {prompt.description ? (
                <span className="ml-auto truncate text-[10px] text-foreground/50">{prompt.description}</span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
      <div className="flex items-center gap-2 border-base-content/5 border-t p-3">
        <input
          className={inputRecipe({ size: "sm" }, "flex-1")}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
            event.preventDefault();
            send();
          }}
          placeholder={l("base.agentPlaceholder")}
          value={draft}
        />
        {session.isRunning ? (
          <Button onClick={session.abort} size="sm" variant="outline">
            {l("base.stop")}
          </Button>
        ) : (
          <Button disabled={!draft.trim()} onClick={send} size="sm">
            {l("base.send")}
          </Button>
        )}
      </div>
    </aside>
  );
};

export default createOverridable("AgentChat", DefaultChat);
