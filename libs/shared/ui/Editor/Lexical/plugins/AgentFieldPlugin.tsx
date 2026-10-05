"use client";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { Err } from "@libs/shared/client";
import { capitalize } from "akanjs/common";
import { FormFields } from "akanjs/store";
import { $setSelection, type EditorState } from "lexical";
import { type ReactNode, useMemo } from "react";

import { type AgentField, AgentFieldProvider } from "../agentField";
import type { EditorFeature } from "../feature";

const commitTimeoutMs = 5_000;

interface AgentFieldPluginProps {
  /** The `set<Field>On<Model>` this editor writes, or null to publish nothing. Frozen at mount. */
  name: string | null;
  /** Whether to offer the block read/edit pair. Off for a field too short to address by block. */
  blocks?: boolean;
  /** Every capability this editor was given — the enabled built-ins plus what `plugins` contributed, so a plugin node counts as a loss instead of being overwritten silently. */
  features: readonly EditorFeature[];
  /**
   * Commits the pending change immediately — the 300ms debounce would leave the form stale, and on an
   * empty field there is no pending change at all, because `OnChangePlugin` drops the update that fills one.
   */
  flush: (state?: EditorState) => void;
  children: ReactNode;
}

/** Supplies {@link AgentField} to every plugin under it, so tool naming is derived in exactly one place. */
export const AgentFieldPlugin = ({ name, blocks = true, features, flush, children }: AgentFieldPluginProps) => {
  const [editor] = useLexicalComposerContext();
  const value = useMemo<AgentField>(() => {
    // Forward through the setter index, never by taking the name apart: `set(.+)On(.+)` has more than
    // one reading whenever a field or a model name contains "On" — `setContentOnAppOnProjectReport` has three.
    const ref = name ? FormFields.ref(name) : null;
    return {
      name,
      blockBase: blocks && ref ? `${capitalize(ref.key)}BlocksOn${capitalize(ref.refName)}` : null,
      features,
      content: () => editor.getEditorState().toJSON(),
      commit: async (mutate) => {
        // An update Lexical rejects goes to the composer's onError and never reaches onUpdate, so an unbounded
        // wait here hangs the agent's whole turn; a caret left on a block the write removes is the usual cause.
        const applied = await Promise.race([
          new Promise<boolean>((resolve) => {
            editor.update(
              () => {
                $setSelection(null);
                mutate();
              },
              { onUpdate: () => resolve(true) },
            );
          }),
          new Promise<boolean>((resolve) => setTimeout(() => resolve(false), commitTimeoutMs)),
        ]);
        if (!applied) throw new Err("shared.error.editorWriteNotApplied");
        flush(editor.getEditorState());
      },
    };
  }, [editor, name, blocks, features, flush]);
  return <AgentFieldProvider value={value}>{children}</AgentFieldProvider>;
};
