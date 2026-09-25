"use client";
import { cn, usePage } from "akanjs/client";
import { lazy } from "akanjs/webkit";
import { type KeyboardEvent, type RefObject, useEffect } from "react";
import type { AgentSession, MessageAttachment, MessageReference } from "use-agentic";
import { Button } from "../Button";
import { inputRecipe } from "../recipe";
import { createOverridable, useUiRecipe } from "../UiOverride";
import { Attach, Chips } from "./Attach";
import { Mic } from "./Mic";
import { ReferenceChips } from "./Refer";

/**
 * What the chat needs of whatever the composer draws into — a textarea, or the mention editor. Every offset is an
 * offset into the draft string, tokens included, because that is the text the chat reasons about.
 */
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
  /**
   * What the draft's `@[…](mention:…)` tokens point at. The text is what carries them, so a composer that draws no
   * chip still sends them — the chip is how somebody sees and removes one, not how it travels.
   */
  references?: readonly MessageReference[];
  /** Files still being read. An `attach` that uploads takes seconds, and a panel that shows nothing looks broken. */
  pending?: number;
  /** Absent when the screen cannot listen — the same rule as publishing no tool for a control that is not drawn. */
  mic?: { listening: boolean; onToggle: () => void };
  onDraft: (text: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onFiles: (files: File[]) => void;
  onRemoveFile: (idx: number) => void;
  /** Keyed on `refName/refId#path`, not on a row index: the order is the draft's, and the draft is the truth. */
  onRemoveReference?: (key: string) => void;
  onSend: () => void;
  onStop: () => void;
  inputRef?: RefObject<HTMLTextAreaElement | null>;
  /**
   * Draws each `@` pointer as the name it points at instead of as its token. On only where the chat was given
   * `reference` sources, so an app that declared none never fetches the editor's chunk.
   */
  mentions?: boolean;
  /** Filled by whichever input is drawn. An override that draws its own textarea leaves it null and `inputRef` answers. */
  handleRef?: RefObject<ComposerHandle | null>;
}

// Its own chunk behind the chat's: the editor is the one heavy thing in this panel, and a chat with no mention
// sources has nothing to spend it on.
const RichInput = lazy(() => import("./RichInput"), {
  ssr: false,
  suspense: true,
  loading: () => <div className="flex-1" />,
});

/** Where the box stops growing and starts scrolling: a chat composer is a paragraph at most. */
const maxComposerHeight = 128;

/** What the user writes with: the staged files above, and the controls that send or stop below them. */
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
    // Measured from a collapsed box: `scrollHeight` reports the content plus whatever height the box already has,
    // so without the reset the composer only ever grows.
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
