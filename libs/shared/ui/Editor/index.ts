import { Rich, RichContent } from "./index_";

export const Editor = {
  Rich,
  RichContent,
};

export type { EditorFeature, EditorFeatureKey } from "./Lexical/feature";
export { editorFeatureKeys } from "./Lexical/feature";
export { mentionEditorPlugin } from "./Lexical/mention";
export type { MentionCandidate, MentionSource } from "./Lexical/mention.type";
export type { EditorPlugin, EditorSlashGroup, EditorSlashOption } from "./Lexical/plugin";
