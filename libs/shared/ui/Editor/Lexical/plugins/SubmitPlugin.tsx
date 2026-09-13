"use client";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import type { EditorContent } from "@libs/shared/common";
import { $createParagraphNode, $getRoot, COMMAND_PRIORITY_HIGH, KEY_ENTER_COMMAND } from "lexical";
import { useCallback, useEffect, useRef } from "react";

/**
 * ⌘↩ / Ctrl+↩ submits the field, and this plugin empties it **once the submit has succeeded**.
 *
 * Clearing has to happen here rather than through the `value` prop: `ExternalValuePlugin` refuses to
 * overwrite a focused editor, and a submit from the keyboard leaves focus exactly where it was. Emptying
 * through the `value` prop would therefore do nothing, silently, and the sent text would stay on screen.
 *
 * A rejected `onSubmit` leaves the document alone, so a failed send is retryable instead of lost — the host
 * is the one that reports the failure. A submit in flight also blocks another, so holding ⌘↩ down sends once.
 *
 * The submitted content is read out of the editor rather than taken from the host's state, because the
 * host is fed by a debounced `onChange` — a keystroke followed immediately by ⌘↩ would otherwise submit
 * the document as it stood up to 300ms ago.
 *
 * **Two paths, because an IME swallows the first one.** Lexical's `onKeyDown` returns before dispatching
 * anything while a composition is open (`LexicalEvents.ts`: `if (editor.isComposing()) return`), so
 * `KEY_ENTER_COMMAND` never fires for the keystroke that commits a Korean syllable — which is why ⌘↩ used
 * to need pressing twice, the first press only closing the composition. The native listener catches that
 * case and defers the submit to the update that lands the composed text; `$onCompositionEndImpl` clears
 * the composition key before inserting it, so by then `isComposing()` is false and the text is in state.
 * The two paths cannot both fire for one keystroke: they split on the same predicate Lexical splits on.
 */
export interface SubmitPluginProps {
  /** Rejecting keeps the document as it is; resolving empties it. */
  onSubmit: (content: EditorContent) => void | Promise<void>;
  /**
   * Handed the submit function once the editor is live, so a control **outside** the editor — a send
   * button — can go through this same path.
   *
   * It has to: `OnChangePlugin` ignores a `history-merge`-tagged update, which is what the first
   * keystroke into an empty field is, so the host's debounced copy of the document is still empty
   * one character in. A button that reads the host's state would drop a one-character message.
   */
  onReady?: (submit: () => void) => void;
}

export const SubmitPlugin = ({ onSubmit, onReady }: SubmitPluginProps) => {
  const [editor] = useLexicalComposerContext();
  // Each registration happens once per editor, so the handlers read the latest callback through a ref.
  const submitRef = useRef(onSubmit);
  submitRef.current = onSubmit;
  const readyRef = useRef(onReady);
  readyRef.current = onReady;
  // Set between a ⌘↩ pressed mid-composition and the moment the IME commits it.
  const pendingRef = useRef(false);
  // Set while a submit is in flight.
  const busyRef = useRef(false);

  const submit = useCallback(() => {
    if (busyRef.current) return;
    const content = editor.getEditorState().toJSON() as EditorContent;
    busyRef.current = true;
    void (async () => {
      try {
        await submitRef.current(content);
        editor.update(() => {
          const root = $getRoot();
          root.clear();
          const paragraph = $createParagraphNode();
          root.append(paragraph);
          paragraph.select();
        });
      } catch {
        // The host reports the failure; keeping the document is what makes the send retryable.
      } finally {
        busyRef.current = false;
      }
    })();
  }, [editor]);

  useEffect(() => {
    readyRef.current?.(submit);
  }, [submit]);

  useEffect(
    () =>
      editor.registerCommand(
        KEY_ENTER_COMMAND,
        (event) => {
          if (!event?.metaKey && !event?.ctrlKey) return false;
          event?.preventDefault();
          submit();
          return true;
        },
        COMMAND_PRIORITY_HIGH,
      ),
    [editor, submit],
  );

  useEffect(() => {
    // No preventDefault here: the keystroke has to reach the IME so the composition commits.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Enter" || (!event.metaKey && !event.ctrlKey)) return;
      if (!editor.isComposing()) return;
      pendingRef.current = true;
    };
    return editor.registerRootListener((rootElement, prevRootElement) => {
      prevRootElement?.removeEventListener("keydown", onKeyDown);
      rootElement?.addEventListener("keydown", onKeyDown);
    });
  }, [editor]);

  useEffect(
    () =>
      editor.registerUpdateListener(() => {
        if (!pendingRef.current || editor.isComposing()) return;
        pendingRef.current = false;
        submit();
      }),
    [editor, submit],
  );
  return null;
};
