"use client";
import { cn, usePage } from "akanjs/client";
import type { KeyboardEvent, Ref } from "react";
import type { AgentSession, MessageAttachment } from "use-agentic";
import { Button } from "../Button";
import { inputRecipe } from "../recipe";
import { Attach, Chips } from "./Attach";
import { Mic } from "./Mic";

interface ComposerProps {
  className?: string;
  session: AgentSession;
  draft: string;
  attached: readonly MessageAttachment[];
  /** Absent when the screen cannot listen — the same rule as publishing no tool for a control that is not drawn. */
  mic?: { listening: boolean; onToggle: () => void };
  onDraft: (text: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onFiles: (files: File[]) => void;
  onRemoveFile: (idx: number) => void;
  onSend: () => void;
  onStop: () => void;
  inputRef?: Ref<HTMLInputElement>;
}

/** What the user writes with: the staged files above, and the controls that send or stop below them. */
export const Composer = ({
  className,
  session,
  draft,
  attached,
  mic,
  onDraft,
  onKeyDown,
  onFiles,
  onRemoveFile,
  onSend,
  onStop,
  inputRef,
}: ComposerProps) => {
  const { l } = usePage();
  return (
    <div className={cn("flex flex-col gap-2 border-foreground/5 border-t p-3", className)}>
      {attached.length ? (
        <Chips attachments={attached} onRemove={onRemoveFile} removeLabel={l("base.agentAttachRemove")} />
      ) : null}
      <div className="flex items-center gap-2">
        {mic ? <Mic label={l("base.agentListen")} listening={mic.listening} onToggle={mic.onToggle} /> : null}
        <Attach label={l("base.agentAttach")} onPick={onFiles} />
        <input
          className={inputRecipe({ size: "sm" }, "flex-1")}
          onChange={(event) => onDraft(event.target.value)}
          onKeyDown={onKeyDown}
          onPaste={(event) => {
            const pasted = [...event.clipboardData.files];
            if (!pasted.length) return;
            event.preventDefault();
            onFiles(pasted);
          }}
          placeholder={session.pendingQuestion ? l("base.agentAnswer") : l("base.agentPlaceholder")}
          ref={inputRef}
          value={draft}
        />
        {/* A parked question is not a turn to stop: the loop is waiting on the card, and the card has its own out. */}
        {session.isRunning && !session.pendingQuestion ? (
          <Button onClick={onStop} size="sm" variant="outline">
            {l("base.stop")}
          </Button>
        ) : (
          <Button disabled={!draft.trim() && !attached.length} onClick={onSend} size="sm">
            {l("base.send")}
          </Button>
        )}
      </div>
    </div>
  );
};
