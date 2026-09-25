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
  /** The textarea's own handler, unchanged: the chat reads a key off the draft and the caret, not off the DOM. */
  onKeyDown: (event: ReactKeyboardEvent<HTMLTextAreaElement>) => void;
  onFiles: (files: File[]) => void;
  handleRef?: RefObject<ComposerHandle | null>;
}

/**
 * The composer's input when the chat has `@` sources: the same draft string, drawn with each pointer as the name
 * it points at instead of as the token that carries it.
 *
 * Lexical rather than a contenteditable of our own, for one reason — a Korean or Japanese IME composing into a
 * contenteditable React also re-renders is the bug class the library exists to own, and it is not one an app can
 * work around from outside.
 */
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
  // What the editor and the draft prop last agreed on. A keystroke's own round trip comes back through the prop,
  // and rebuilding the tree from it would drop the caret in the middle of typing.
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
    // Above the plain-text handlers, so a key the chat claims — Enter to send, Tab to complete a mention — never
    // also lands in the text. One the chat leaves alone falls through to them, which is what keeps Shift+Enter a
    // line break.
    const onKey = <T extends KeyboardEvent | null>(command: LexicalCommand<T>, key: string) =>
      editor.registerCommand<T>(command, (event) => forward(key, event), COMMAND_PRIORITY_HIGH);
    const teardowns = [
      registerPlainText(editor),
      editor.registerUpdateListener(({ editorState }) => {
        const text = editorState.read(() => MentionDraft.read());
        if (text === settled.current) return;
        // Marked before it is handed over, so the draft coming back through the prop is recognised as this very
        // edit and never rebuilds the tree the caret is sitting in.
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
