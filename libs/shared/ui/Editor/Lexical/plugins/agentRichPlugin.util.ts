import { extractTextFromContent } from "@libs/shared/common";

/**
 * Node types a markdown round-trip cannot carry, against the word to name each one by.
 *
 * `AKAN_TRANSFORMERS` covers ten of the editor's node classes. For the rest `$exportTopLevelElements`
 * (`@lexical/markdown`) falls back to `$exportChildren` for an element and `getTextContent()` for a
 * decorator — so a decorator vanishes outright, a container keeps only its text, and a mention keeps its
 * text but loses the `refId` that `collectMentions` reads. `akan-mermaid` carries its own transformer and
 * is deliberately absent. `tablerow` / `tablecell` and the collapsible title/content are absent too: they
 * only ever appear under a parent that is already counted.
 */
const lossyLabels = {
  "akan-image": "image",
  "akan-video": "video",
  "akan-file": "file",
  "akan-embed": "embed",
  "akan-excalidraw": "drawing",
  "akan-callout": "callout",
  "akan-collapsible": "toggle",
  "akan-mention": "mention",
  table: "table",
} as const;

interface ContentNode {
  type?: string;
  children?: ContentNode[];
}

export interface RichLoss {
  label: string;
  count: number;
}

const tally = (node: ContentNode, counts: Map<string, number>) => {
  const label = node.type ? lossyLabels[node.type as keyof typeof lossyLabels] : undefined;
  if (label) counts.set(label, (counts.get(label) ?? 0) + 1);
  for (const child of Array.isArray(node.children) ? node.children : []) tally(child, counts);
};

/** What overwriting this content from markdown would destroy, most numerous first. */
export const lossyNodesOf = (content: unknown): RichLoss[] => {
  if (!content || typeof content !== "object") return [];
  const counts = new Map<string, number>();
  const roots = Array.isArray(content) ? (content as ContentNode[]) : [(content as { root?: ContentNode }).root];
  for (const root of roots) if (root) tally(root, counts);
  return [...counts].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
};

/** Nothing a person would miss: no text, and none of the blocks that carry meaning without text. */
export const isEmptyRichContent = (content: unknown) =>
  !extractTextFromContent(content).trim() && !lossyNodesOf(content).length;

export const lossSentence = (losses: RichLoss[]) =>
  losses.map(({ label, count }) => `${count} ${label}${count > 1 ? "s" : ""}`).join(", ");

export interface RichBlock {
  index: number;
  type: string;
  text: string;
}

const LISTING_BUDGET = 6000;
const BLOCK_TEXT_LIMIT = 160;

const blockText = (node: ContentNode & { text?: string }): string => {
  if (typeof node.text === "string") return node.text;
  return (Array.isArray(node.children) ? node.children : []).map(blockText).join("");
};

const rootChildrenOf = (content: unknown): ContentNode[] => {
  if (!content || typeof content !== "object") return [];
  if (Array.isArray(content)) return content as ContentNode[];
  const children = (content as { root?: ContentNode }).root?.children;
  return Array.isArray(children) ? children : [];
};

/**
 * The top-level blocks of stored content, in the order an index addresses them.
 *
 * The index is the only address there is: `SerializedLexicalNode` carries no `NodeKey`, so a key is
 * invisible to anyone reading the content and cannot be quoted back. It shifts under insert and remove,
 * which is why every block op returns a fresh listing rather than leaving the caller to re-derive one.
 */
export const richBlocksOf = (content: unknown): RichBlock[] =>
  rootChildrenOf(content).map((node, index) => ({
    index,
    type: node.type ?? "unknown",
    text: blockText(node).replace(/\s+/g, " ").trim(),
  }));

export const richBlockListing = (content: unknown): string => {
  const blocks = richBlocksOf(content);
  if (!blocks.length) return "0 blocks. The field is empty.";
  const lines = [`${blocks.length} block${blocks.length > 1 ? "s" : ""}:`];
  let listed = 0;
  for (const { index, type, text } of blocks) {
    const line = `${index} ${type} ${text.slice(0, BLOCK_TEXT_LIMIT) || "(no text)"}`;
    if (lines.join("\n").length + line.length > LISTING_BUDGET) break;
    lines.push(line);
    listed += 1;
  }
  if (listed < blocks.length)
    lines.push(`… ${blocks.length - listed} more, at indices ${listed}-${blocks.length - 1}.`);
  return lines.join("\n");
};
