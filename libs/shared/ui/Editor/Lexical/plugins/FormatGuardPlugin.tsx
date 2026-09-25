"use client";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { COMMAND_PRIORITY_CRITICAL, FORMAT_TEXT_COMMAND } from "lexical";
import { useEffect } from "react";

import type { EditorFeatureKey } from "../feature";
import { formatFeatures, isGuardedFormat } from "../textFormat";

/**
 * Swallows ⌘B / ⌘I / ⌘U and every other format command for a mark this field does not offer.
 *
 * Hiding the toolbar button is not enough on its own: the browser shortcuts reach `RichTextPlugin`'s
 * own `FORMAT_TEXT_COMMAND` handler directly, so a plain-text field would still take bold from the
 * keyboard — with no control to see it by and no markdown to carry it out again.
 */
export const FormatGuardPlugin = ({ features }: { features: ReadonlySet<EditorFeatureKey> }) => {
  const [editor] = useLexicalComposerContext();
  useEffect(
    () =>
      editor.registerCommand(
        FORMAT_TEXT_COMMAND,
        (format) => isGuardedFormat(format) && !features.has(formatFeatures[format]),
        COMMAND_PRIORITY_CRITICAL,
      ),
    [editor, features],
  );
  return null;
};
