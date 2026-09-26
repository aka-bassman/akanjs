"use client";
import { cn, usePage } from "akanjs/client";
import { lazy } from "akanjs/webkit";
import { type KeyboardEvent, type RefObject, useEffect } from "react";
import { AiOutlineAudio, AiOutlineAudioMuted } from "react-icons/ai";
import type { AgentSession, MessageAttachment, MessageReference } from "use-agentic";
import { Button } from "../Button";
import { inputRecipe } from "../recipe";
import { createOverridable, useUiRecipe } from "../UiOverride";
import { Attach, Chips } from "./Attach";
import { ReferenceChips } from "./Refer";

/** Every offset is into the draft string, tokens included. */
export interface ComposerHandle {
  focus: () => void;
  caret: () => number | null;
  setCaret: (at: number) => void;
}

export interface ComposerProps {
  className?: string;
  session: AgentSession;
  draft: string;
  attached: readonly MessageAttachment[];
  /** What the draft's `@[…](mention:…)` tokens point at; the text carries them, chips only show them. */
  references?: readonly MessageReference[];
  /** Files still being read. */
  pending?: number;
  /** Absent when the screen cannot listen. */
  mic?: { listening: boolean; onToggle: () => void };
  onDraft: (text: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onFiles: (files: File[]) => void;
  onRemoveFile: (idx: number) => void;
  /** Keyed on `refName/refId#path`, not on a row index. */
  onRemoveReference?: (key: string) => void;
  onSend: () => void;
  onStop: () => void;
  inputRef?: RefObject<HTMLTextAreaElement | null>;
  /** Draws each `@` pointer as its name; set only when the chat has `reference` sources. */
  mentions?: boolean;
  /** Filled by whichever input is drawn. An override that draws its own textarea leaves it null and `inputRef` answers. */
  handleRef?: RefObject<ComposerHandle | null>;
}

// Its own chunk: the editor is the panel's one heavy dependency, and only mention sources need it.
const RichInput = lazy(() => import("./RichInput"), {
  ssr: false,
  suspense: true,
  loading: () => <div className="flex-1" />,
});

const maxComposerHeight = 128;

export const DefaultComposer = ({
  className,
  session,
  draft,
  attached,
  references = [],
  pending = 0,
  mic,
  onDraft,
  onKeyDown,
  onFiles,
  onRemoveFile,
  onRemoveReference,
  onSend,
  onStop,
  inputRef,
  mentions = false,
  handleRef,
}: ComposerProps) => {
  const { l } = usePage();
  const surface = useUiRecipe("input") ?? inputRecipe;
  const field = surface({ kind: "area", size: "sm" }, "max-h-32 flex-1 resize-none py-1.5");
  const placeholder = session.pendingQuestion
    ? l("base.agentAnswer")
    : session.isRunning
      ? l("base.agentQueuePlaceholder")
      : l("base.agentPlaceholder");
  useEffect(() => {
    if (!handleRef || mentions) return;
    handleRef.current = {
      focus: () => inputRef?.current?.focus(),
      caret: () => inputRef?.current?.selectionStart ?? null,
      setCaret: (at) => {
        inputRef?.current?.focus();
        inputRef?.current?.setSelectionRange(at, at);
      },
    };
    return () => {
      handleRef.current = null;
    };
  }, [handleRef, inputRef, mentions]);
  useEffect(() => {
    const area = inputRef?.current;
    if (!area) return;
    // Reset first: `scrollHeight` includes the box's current height, so without it the composer only ever grows.
    area.style.height = "auto";
    area.style.height = `${Math.min(area.scrollHeight, maxComposerHeight)}px`;
  }, [draft, inputRef]);
  return (
    <div className={cn("flex flex-col gap-2 border-foreground/5 border-t p-3", className)}>
      {references.length ? (
        <ReferenceChips
          onRemove={onRemoveReference}
          references={references}
          removeLabel={l("base.agentReferenceRemove")}
        />
      ) : null}
      {attached.length || pending ? (
        <Chips
          attachments={attached}
          onRemove={onRemoveFile}
          pending={pending}
          pendingLabel={l("base.agentAttachReading")}
          removeLabel={l("base.agentAttachRemove")}
        />
      ) : null}
      <div className="flex items-end gap-2">
        {mic ? (
          <Mic className="pb-2" label={l("base.agentListen")} listening={mic.listening} onToggle={mic.onToggle} />
        ) : null}
        <Attach className="pb-2" label={l("base.agentAttach")} onPick={onFiles} />
        {mentions ? (
          <RichInput
            className={field}
            draft={draft}
            handleRef={handleRef}
            onDraft={onDraft}
            onFiles={onFiles}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
          />
        ) : (
          <textarea
            className={field}
            onChange={(event) => onDraft(event.target.value)}
            onKeyDown={onKeyDown}
            onPaste={(event) => {
              const pasted = [...event.clipboardData.files];
              if (!pasted.length) return;
              event.preventDefault();
              onFiles(pasted);
            }}
            placeholder={placeholder}
            ref={inputRef}
            rows={1}
            value={draft}
          />
        )}
        {/* A parked question is not a turn to stop: the loop is waiting on the card, and the card has its own out. */}
        {session.isRunning && !session.pendingQuestion ? (
          <>
            {draft.trim() || attached.length ? (
              <Button onClick={onSend} size="sm">
                {l("base.agentQueue")}
              </Button>
            ) : null}
            <Button onClick={onStop} size="sm" variant="outline">
              {l("base.stop")}
            </Button>
          </>
        ) : (
          <Button disabled={!draft.trim() && !attached.length} onClick={onSend} size="sm">
            {l("base.send")}
          </Button>
        )}
      </div>
    </div>
  );
};

export const Composer = createOverridable("AgentComposer", DefaultComposer);

interface MicProps {
  className?: string;
  listening: boolean;
  label: string;
  onToggle: () => void;
}

const Mic = ({ className, listening, label, onToggle }: MicProps) => (
  <button
    aria-label={label}
    aria-pressed={listening}
    className={cn(
      "shrink-0 hover:text-foreground",
      listening ? "animate-pulse text-primary" : "text-foreground/50",
      className,
    )}
    onClick={onToggle}
    title={label}
    type="button"
  >
    {listening ? <AiOutlineAudioMuted /> : <AiOutlineAudio />}
  </button>
);
