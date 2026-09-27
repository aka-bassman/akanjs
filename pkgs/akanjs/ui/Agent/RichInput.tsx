"use client";
import { registerPlainText } from "@lexical/plain-text";
import { cn } from "akanjs/client";
import {
  COMMAND_PRIORITY_HIGH,
  createEditor,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
  KEY_TAB_COMMAND,
  type LexicalCommand,
  PASTE_COMMAND,
} from "lexical";
import { type KeyboardEvent as ReactKeyboardEvent, type RefObject, useEffect, useRef, useState } from "react";
import type { ComposerHandle } from "./Composer";
import { MentionNode } from "./MentionNode";
import { MentionDraft } from "./mentionDraft";

interface RichInputProps {
  className?: string;
  draft: string;
  placeholder: string;
  onDraft: (text: string) => void;
  /** The textarea's own handler, fed a synthetic event: the chat reads keys off the draft and caret, not the DOM. */
  onKeyDown: (event: ReactKeyboardEvent<HTMLTextAreaElement>) => void;
  onFiles: (files: File[]) => void;
  handleRef?: RefObject<ComposerHandle | null>;
}

// Lexical, not a hand-rolled contenteditable: IME composition under React re-renders is the bug class it owns.
export const RichInput = ({
  className,
  draft,
  placeholder,
  onDraft,
  onKeyDown,
  onFiles,
  handleRef,
}: RichInputProps) => {
  const [editor] = useState(() =>
    createEditor({
      namespace: "akanAgentComposer",
      nodes: [MentionNode],
      onError: (error: Error) => console.error(error),
    }),
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const live = useRef({ draft, onDraft, onKeyDown, onFiles });
  live.current = { draft, onDraft, onKeyDown, onFiles };
  // A keystroke's own round trip returns through the prop, and rebuilding the tree from it would drop the caret.
  const settled = useRef(draft);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    editor.setRootElement(root);
    const forward = (key: string, event: KeyboardEvent | null) => {
      const value = MentionDraft.read();
      const caret = MentionDraft.caret() ?? value.length;
      let prevented = false;
      live.current.onKeyDown({
        key,
        shiftKey: !!event?.shiftKey,
        nativeEvent: { isComposing: !!event?.isComposing },
        currentTarget: { value, selectionStart: caret, selectionEnd: caret },
        preventDefault: () => {
          prevented = true;
          event?.preventDefault();
        },
      } as unknown as ReactKeyboardEvent<HTMLTextAreaElement>);
      return prevented;
    };
    // Above the plain-text handlers: a claimed key never lands in the text; the rest (Shift+Enter) fall through.
    const onKey = <T extends KeyboardEvent | null>(command: LexicalCommand<T>, key: string) =>
      editor.registerCommand<T>(command, (event) => forward(key, event), COMMAND_PRIORITY_HIGH);
    const teardowns = [
      registerPlainText(editor),
      editor.registerUpdateListener(({ editorState }) => {
        const text = editorState.read(() => MentionDraft.read());
        if (text === settled.current) return;
        // Marked before handing over, so the draft returning through the prop is recognised as this very edit.
        settled.current = text;
        live.current.onDraft(text);
      }),
      onKey(KEY_ENTER_COMMAND, "Enter"),
      onKey(KEY_TAB_COMMAND, "Tab"),
      onKey(KEY_ARROW_UP_COMMAND, "ArrowUp"),
      onKey(KEY_ARROW_DOWN_COMMAND, "ArrowDown"),
      onKey(KEY_ESCAPE_COMMAND, "Escape"),
      editor.registerCommand(
        PASTE_COMMAND,
        (event) => {
          const files = [...(("clipboardData" in event ? event.clipboardData?.files : null) ?? [])];
          if (!files.length) return false;
          event.preventDefault();
          live.current.onFiles(files);
          return true;
        },
        COMMAND_PRIORITY_HIGH,
      ),
    ];
    if (live.current.draft) editor.update(() => MentionDraft.write(live.current.draft), { discrete: true });
    return () => {
      for (const teardown of teardowns) teardown();
      editor.setRootElement(null);
    };
  }, [editor]);
  useEffect(() => {
    if (draft === settled.current) return;
    settled.current = draft;
    editor.update(() => MentionDraft.write(draft), { discrete: true });
  }, [draft, editor]);
  useEffect(() => {
    if (!handleRef) return;
    handleRef.current = {
      focus: () => editor.focus(),
      caret: () => editor.getEditorState().read(() => MentionDraft.caret()),
      setCaret: (at) => {
        editor.update(() => MentionDraft.place(at), { discrete: true });
        editor.focus();
      },
    };
    return () => {
      handleRef.current = null;
    };
  }, [editor, handleRef]);
  return (
    <div className="relative flex-1">
      <div
        aria-label={placeholder}
        aria-multiline
        className={cn("max-h-32 overflow-y-auto whitespace-pre-wrap break-words outline-none", className)}
        contentEditable
        ref={rootRef}
        role="textbox"
        suppressContentEditableWarning
      />
      {draft ? null : (
        <span className="pointer-events-none absolute inset-0 select-none px-3 py-1.5 text-foreground/40 text-sm">
          {placeholder}
        </span>
      )}
    </div>
  );
};

export default RichInput;
