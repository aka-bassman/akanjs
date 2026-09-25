"use client";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import type { TriggerFn } from "@lexical/react/LexicalTypeaheadMenuPlugin";
import { COLLABORATION_TAG, HISTORIC_TAG } from "lexical";
import { useCallback, useLayoutEffect, useRef } from "react";

/**
 * Wraps a typeahead trigger so the menu opens only for an edit this user made.
 *
 * `LexicalTypeaheadMenuPlugin` re-runs its trigger on every update and reads the *local* selection, which a
 * remote insertion moves: `@lexical/yjs` remaps the cursor through the CRDT, so a peer typing `/` leaves this
 * client's caret directly after it and the menu opens for someone who never pressed a key. The plugin's own
 * update listener takes no arguments, so the tag has to be captured separately.
 *
 * A layout effect registers the listener before the plugin's passive one — update listeners fire in
 * registration order, and the flag has to be written before the menu reads it.
 */
export const useLocalOnlyTrigger = (triggerFn: TriggerFn): TriggerFn => {
  const [editor] = useLexicalComposerContext();
  const isRemoteUpdate = useRef(false);
  useLayoutEffect(
    () =>
      editor.registerUpdateListener(({ tags }) => {
        isRemoteUpdate.current = tags.has(COLLABORATION_TAG) || tags.has(HISTORIC_TAG);
      }),
    [editor],
  );
  return useCallback(
    (text, currentEditor) => (isRemoteUpdate.current ? null : triggerFn(text, currentEditor)),
    [triggerFn],
  );
};
