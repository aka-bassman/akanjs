"use client";
import { cn, fetch, usePage } from "akanjs/client";
import type { PromptResult } from "akanjs/signal";
import { AgentContext, type AgentPrompt, AgentPrompts, ensureStoreSurface, ScreenSettle } from "akanjs/store";
import { type ReactNode, useContext, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AiOutlineClear, AiOutlineClose } from "react-icons/ai";
import { type AgentRunner, AgentSession, type MessageAttachment, SessionContext } from "use-agentic";
import { Button } from "../Button";
import { inputRecipe } from "../recipe";
import { createOverridable } from "../UiOverride";
import Approval from "./Approval";
import { Attach, Chips } from "./Attach";
import { Attachment, type AttachReader } from "./attachment";
import Bubble from "./Bubble";
import { type ChatCommand, ChatCommands } from "./ChatCommands";
import { fetchRunner } from "./fetchRunner";
import Menu from "./Menu";
import Question from "./Question";
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
  /** Renders in the page flow instead of floating above it — a zone chat that lives inside its own section. */
  inline?: boolean;
  /**
   * Reads a file the user attached into an attachment, or answers `null` to leave it to the built-in reader
   * (images as bytes, text as text). This is where an app puts what needs a parser — a PDF's text, a spreadsheet's
   * cells — since the framework carries attachments but depends on nothing that can extract one. It runs before
   * the built-in, so it can also replace how an image is prepared.
   */
  attach?: AttachReader;
}

const isApplePlatform = () => /Mac|iPhone|iPad|iPod/i.test(navigator.platform);

// Portalled to the body like Dialog's modal and the toast layer: the page tree sits under `#pageContainers`,
// which is `isolation: isolate`, so a z-index declared inside it can never rise above a body-level overlay.
// The layer sits above every dismissable surface (modal 10, dropdown/toast 100, sheet 101) so the agent can
// still drive a form inside an open modal, and below Reconnect (200), which blocks the app on purpose.
const floatingLayer = "fixed right-4 bottom-4 z-[150]";

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
  inline = false,
  attach,
}: ChatProps) => {
  const { l } = usePage();
  const provided = useContext(SessionContext);
  const held = useRef<AgentSession | null>(null);
  held.current ??=
    provided ??
    new AgentSession(ensureStoreSurface().surface, runner ?? fetchRunner(), {
      buildContext: (surface) => AgentContext.of().blocks(surface),
      settle: () => ScreenSettle.wait(),
      continueAsk: { question: l("base.agentContinue"), keep: l("base.agentKeepGoing") },
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
  const [attached, setAttached] = useState<MessageAttachment[]>([]);
  const sent = useRef<string[]>([]);
  const stashed = useRef("");
  const [recall, setRecall] = useState(0);
  const [hotkey, setHotkey] = useState<{ label: string; keys: string } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [overlay, setOverlay] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setOverlay(document.body);
  }, []);
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [version, open]);
  useEffect(() => {
    const apple = isApplePlatform();
    setHotkey(apple ? { label: "⌘ L", keys: "Meta+L" } : { label: "Ctrl+L", keys: "Control+L" });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.key.toLowerCase() !== "l" || event.shiftKey || event.altKey) return;
      const chord = apple ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey;
      if (!chord) return;
      event.preventDefault();
      setOpen(true);
      inputRef.current?.focus();
    };
    // Cmd/Ctrl+L is the browser location bar; capture so preventDefault wins.
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, []);
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
  }, [open, session.pendingQuestion?.callId]);
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
  /** Staged one at a time so one unreadable file names itself instead of failing the whole drop silently. */
  const attachFiles = async (files: File[]) => {
    for (const file of files) {
      try {
        const read = await Attachment.read(file, attach);
        if (!Attachment.failure(read)) setAttached((current) => [...current, read]);
        else
          session.note(
            l(read === "tooLarge" ? "base.agentAttachTooLarge" : "base.agentAttachUnsupported", { name: file.name }),
          );
      } catch (error) {
        session.report(`${file.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  };
  const remember = (text: string) => {
    if (sent.current[sent.current.length - 1] !== text) sent.current = [...sent.current, text].slice(-30);
    setRecall(0);
  };
  /** ↑ walks back through what was sent, ↓ forward; 0 is the draft it was walked away from. */
  const step = (delta: number) => {
    const history = sent.current;
    const next = Math.max(0, Math.min(recall + delta, history.length));
    if (next === recall) return;
    if (!recall) stashed.current = draft;
    setRecall(next);
    setDraft(next ? history[history.length - next] : stashed.current);
  };
  const runCommand = (command: ChatCommand) => {
    setDraft("");
    remember(`/${command.name}`);
    void ChatCommands.run(command, { session, l });
  };
  const pick = (prompt: AgentPrompt) => {
    if (prompt.args.some((arg) => arg.required)) {
      setDraft(`/${prompt.name} `);
      return;
    }
    setDraft("");
    remember(`/${prompt.name}`);
    void runPrompt(prompt, []);
  };
  const send = () => {
    const text = draft.trim();
    if (!text && !attached.length) return;
    // The composer is the free-text answer to a pending question: the card holds the picks, and a user who types
    // instead of picking would otherwise be typing into a dead input while the turn waits on them.
    const question = session.pendingQuestion;
    if (question && text) {
      setDraft("");
      question.answer(question.multiple ? [text] : text);
      return;
    }
    const command = AgentPrompts.parseCommand(text);
    const builtin = command ? ChatCommands.find(command.name, l) : null;
    // Ahead of the running check on purpose: /new and /copy are exactly what a user reaches for mid-turn.
    if (builtin) {
      runCommand(builtin);
      return;
    }
    if (session.isRunning) return;
    const prompt = command ? prompts.current?.find(command.name) : null;
    setDraft("");
    if (text) remember(text);
    if (command && prompt) {
      void runPrompt(prompt, command.args);
      return;
    }
    if (!attached.length) {
      void session.send(text);
      return;
    }
    setAttached([]);
    void session.send([{ role: "user", ...(text ? { text } : {}), attachments: attached }]);
  };
  const query = /^\/[A-Za-z0-9_-]*$/.test(draft) ? draft : "";
  const commandMenu = query ? ChatCommands.list(l).filter((command) => `/${command.name}`.startsWith(query)) : [];
  const promptMenu = query
    ? (prompts.current?.list() ?? []).filter(
        (prompt) => `/${prompt.name}`.startsWith(query) && !ChatCommands.find(prompt.name, l),
      )
    : [];
  // A call and its result are two wire messages because the model needs both, but they are one thing that
  // happened: the call's row resolves in place, and the result message renders only what no call claimed —
  // a persisted transcript is capped, so a result can outlive the assistant message that made it.
  const resultOf = new Map(session.messages.flatMap((message) => message.toolResults ?? []).map((r) => [r.id, r]));
  const claimed = new Set(session.messages.flatMap((message) => message.toolCalls?.map((call) => call.id) ?? []));
  const bubbles = session.messages.flatMap((message, idx) => {
    if (message.role !== "tool")
      return [<Bubble key={idx} message={message} progress={session.progress} results={resultOf} />];
    const orphans = (message.toolResults ?? []).filter((result) => !claimed.has(result.id));
    return orphans.length ? [<Bubble key={idx} message={{ ...message, toolResults: orphans }} />] : [];
  });
  const layer = (surface: ReactNode) => (inline ? surface : overlay ? createPortal(surface, overlay) : null);
  if (!open)
    return layer(
      <button
        aria-keyshortcuts={hotkey?.keys}
        aria-label={l("base.agent")}
        data-agent-ui=""
        className={cn(
          "group/agent flex size-12 items-center justify-center rounded-full border border-primary/20 bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-105",
          !inline && floatingLayer,
          className,
        )}
        onClick={() => setOpen(true)}
        type="button"
      >
        {hotkey ? (
          <kbd className="pointer-events-none absolute right-full mr-3 hidden rounded-field border border-border bg-background px-2 py-0.5 font-mono text-foreground/50 text-xs opacity-0 shadow-sm group-hover/agent:opacity-100 group-focus-visible/agent:opacity-100 md:block">
            {hotkey.label}
          </kbd>
        ) : null}
        <svg className="size-7" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <path
            fill="currentColor"
            d="M40 18 C43.6 43.6 54.4 54.4 80 58 C54.4 61.6 43.6 72.4 40 98
       C36.4 72.4 25.6 61.6 0 58 C25.6 54.4 36.4 43.6 40 18 Z"
          />
          <path
            fill="currentColor"
            d="M80 2 C81.8 14.8 87.2 20.2 100 22 C87.2 23.8 81.8 29.2 80 42
       C78.2 29.2 72.8 23.8 60 22 C72.8 20.2 78.2 14.8 80 2 Z"
          />
        </svg>
      </button>,
    );
  // data-agent-ui keeps the chat out of readScreen, so a turn never re-reads its own transcript.
  return layer(
    <aside
      data-agent-ui=""
      className={cn(
        "flex h-[min(600px,calc(100dvh-2rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-box border border-border bg-background shadow-xl",
        !inline && floatingLayer,
        className,
      )}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        void attachFiles([...event.dataTransfer.files]);
      }}
    >
      <header className="flex items-center gap-2 border-foreground/5 border-b px-4 py-3">
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
      <div className="scrollbar-thin flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-3" ref={listRef}>
        {bubbles.length ? (
          bubbles
        ) : (
          <p className="py-6 text-center text-foreground/40 text-sm">{l("base.agentIntro")}</p>
        )}
      </div>
      {session.pendingApproval ? <Approval approval={session.pendingApproval} /> : null}
      {session.pendingQuestion ? (
        <Question key={session.pendingQuestion.callId} question={session.pendingQuestion} />
      ) : null}
      <Menu commands={commandMenu} onCommand={runCommand} onPrompt={pick} prompts={promptMenu} />
      <div className="flex flex-col gap-2 border-foreground/5 border-t p-3">
        {attached.length ? (
          <Chips
            attachments={attached}
            onRemove={(idx) => setAttached((current) => current.filter((_, at) => at !== idx))}
            removeLabel={l("base.agentAttachRemove")}
          />
        ) : null}
        <div className="flex items-center gap-2">
          <Attach label={l("base.agentAttach")} onPick={(files) => void attachFiles(files)} />
          <input
            className={inputRecipe({ size: "sm" }, "flex-1")}
            onChange={(event) => setDraft(event.target.value)}
            ref={inputRef}
            onKeyDown={(event) => {
              // A single-line input does nothing of its own with the vertical arrows, so recall is free to take them.
              if ((event.key === "ArrowUp" || event.key === "ArrowDown") && sent.current.length) {
                event.preventDefault();
                step(event.key === "ArrowUp" ? 1 : -1);
                return;
              }
              if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
              event.preventDefault();
              send();
            }}
            onPaste={(event) => {
              const files = [...event.clipboardData.files];
              if (!files.length) return;
              event.preventDefault();
              void attachFiles(files);
            }}
            placeholder={session.pendingQuestion ? l("base.agentAnswer") : l("base.agentPlaceholder")}
            value={draft}
          />
          {session.isRunning && !session.pendingQuestion ? (
            <Button onClick={session.abort} size="sm" variant="outline">
              {l("base.stop")}
            </Button>
          ) : (
            <Button disabled={!draft.trim() && !attached.length} onClick={send} size="sm">
              {l("base.send")}
            </Button>
          )}
        </div>
      </div>
    </aside>,
  );
};

export default createOverridable("AgentChat", DefaultChat);
