import type { Transformer } from "@lexical/markdown";

/** A serialized node as the loss walk sees it — stored JSON, never a live `LexicalNode`. */
export interface EditorNodeLike {
  type?: string;
  children?: readonly EditorNodeLike[];
}

/** What a markdown round-trip would destroy at one node type, and — when it depends — for which nodes. */
export interface EditorLoss {
  label: string;
  /** Absent ⇒ every node of the type is a loss. Present ⇒ only the ones it returns true for. */
  when?: (node: EditorNodeLike) => boolean;
}

export type EditorLosses = Record<string, EditorLoss>;

/**
 * The vocabulary of the editor's `features` prop — every capability a field can be given or denied.
 *
 * One key per built-in feature, so switching a capability off takes it out of the markdown
 * transformers, the slash menu, the floating toolbar, the plugin that implements it, and the agent's
 * syntax sentence in one word. A feature contributed through `plugins` carries no key: passing the
 * plugin is already the opt-in.
 */
export const editorFeatureKeys = [
  "heading",
  "quote",
  "list",
  "code",
  "divider",
  "table",
  "callout",
  "collapsible",
  "image",
  "video",
  "file",
  "embed",
  "mermaid",
  "excalidraw",
  "emphasis",
  "strikethrough",
  "inlineCode",
  "highlight",
  "underline",
  "link",
  "mention",
] as const;

export type EditorFeatureKey = (typeof editorFeatureKeys)[number];

/**
 * One editor capability, declared once.
 *
 * Three agent-facing lists used to sit beside each other and be kept in step by hand: the transformer
 * array, the labels for what a markdown round-trip destroys, and the syntax sentence in
 * `set<Field>On<Model>`'s description. All three are now derived from a table of these, so giving a
 * feature transformers drops it out of the loss list and into the description in the same edit.
 *
 * Pure on purpose — it holds the `Transformer` *type* and never a transformer. The table itself lives
 * in `markdown.ts`, which reaches `MermaidNode` → `@libs/util/ui` → the util store, and so cannot be
 * imported from a test at all.
 */
export interface EditorFeature {
  /** The word the `features` prop switches this on by. Absent on a plugin's own feature, which is on whenever its plugin is. */
  key?: EditorFeatureKey;
  /** Serialized node `type`, as `lossyNodesOf` tallies it. Absent for a text format, which is no node of its own. */
  nodeType?: string;
  /** What to call the loss in a sentence. Absent while markdown carries the feature whole. */
  label?: string;
  /** Markdown transformers that carry it in and out. Absent ⇒ a round-trip loses it. */
  transformers?: readonly Transformer[];
  /** Narrows the loss to the nodes it returns true for — a feature markdown carries except in some shape. */
  lossyWhen?: (node: EditorNodeLike) => boolean;
  /** One clause of the syntax cheat-sheet the agent is handed. */
  syntax?: string;
  /** Carries no formatting of its own, so a field offering nothing else is still a plain textarea. See {@link isPlainOnly}. */
  plain?: boolean;
}

/**
 * The features `keys` names, in table order — `undefined` being every one of them, the editor's default.
 *
 * Order survives the filter, which the two ties documented in `markdown.ts` depend on: a subset that
 * keeps both MERMAID and CODE, or both MENTION and LINK, keeps them in the order that settles them.
 */
export const featuresOf = (
  features: readonly EditorFeature[],
  keys: readonly EditorFeatureKey[] | undefined,
): readonly EditorFeature[] =>
  keys ? features.filter((feature) => feature.key && keys.includes(feature.key)) : features;

/**
 * True when nothing enabled can make the document richer than text.
 *
 * Such a field is a textarea, and pasting into it should be one too: HTML off a web page would
 * otherwise arrive as headings and tables the field has no way to produce, edit, or show a control for.
 */
export const isPlainOnly = (features: readonly EditorFeature[]) => features.every((feature) => feature.plain);

/** Flattened in declaration order, which is what settles a tie between two transformers (see `markdown.ts`). */
export const transformersOf = (features: readonly EditorFeature[]): Transformer[] =>
  features.flatMap((feature) => [...(feature.transformers ?? [])]);

/**
 * Node type → what a markdown round-trip would destroy there.
 *
 * A feature with transformers is absent unless it also names a `lossyWhen`, which is the only way a
 * carried feature can still report a loss — the table that markdown carries except when a cell is merged.
 */
export const lossesOf = (features: readonly EditorFeature[]): EditorLosses =>
  Object.fromEntries(
    features.flatMap(({ nodeType, label, transformers, lossyWhen }) =>
      nodeType && label && (!transformers || lossyWhen)
        ? [[nodeType, lossyWhen ? { label, when: lossyWhen } : { label }] as const]
        : [],
    ),
  );

/** The markdown the agent may write, as one comma-joined clause list. */
export const syntaxOf = (features: readonly EditorFeature[]) =>
  features.flatMap((feature) => (feature.transformers && feature.syntax ? [feature.syntax] : [])).join(", ");
