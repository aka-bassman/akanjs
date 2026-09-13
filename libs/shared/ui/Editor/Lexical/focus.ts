"use client";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { createElement } from "react";

import type { EditorPlugin } from "./plugin";

/**
 * Focuses the field as it mounts, caret after the text already in it.
 *
 * A `plugins` entry rather than a prop, because taking focus needs the editor instance — reachable only
 * from inside `<LexicalComposer>`, through `useLexicalComposerContext`.
 *
 * **`"use client"` is load-bearing.** `Editor/index.ts` re-exports this, and every server component that
 * renders `Editor.StaticContent` / `Editor.RichContent` imports that barrel — so without the directive
 * `@lexical/react` lands in the react-server graph, where `LexicalComposerContext` does
 * `import { createContext } from "react"`, a named export `react.react-server.js` does not have. The app
 * then fails to boot with `Export named 'createContext' not found`. Deferring the import is not enough:
 * the server bundler inlines a dynamic import, so only the directive stops it.
 */
export const focusEditorPlugin = (): EditorPlugin => ({
  render: () => createElement(AutoFocusPlugin, { defaultSelection: "rootEnd" }),
});
