import { $createHorizontalRuleNode, $isHorizontalRuleNode, HorizontalRuleNode } from "@lexical/extension";
import {
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  CHECK_LIST,
  CODE,
  type ElementTransformer,
  HEADING,
  HIGHLIGHT,
  INLINE_CODE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  LINK,
  type MultilineElementTransformer,
  ORDERED_LIST,
  QUOTE,
  STRIKETHROUGH,
  type Transformer,
  UNORDERED_LIST,
} from "@lexical/markdown";
import type { LexicalNode } from "lexical";
import { MermaidNode } from "./nodes/MermaidNode";
import { $createMermaidNode, $isMermaidNode, DEFAULT_MERMAID_CODE } from "./nodes/mermaidNode.util";

/**
 * Horizontal-rule markdown transformer (`---`, `***`, `___`). `@lexical/markdown`
 * ships no HR transformer, so we add one (mirrors the Lexical playground).
 */
const HR: ElementTransformer = {
  dependencies: [HorizontalRuleNode],
  export: (node: LexicalNode) => ($isHorizontalRuleNode(node) ? "---" : null),
  regExp: /^(---|\*\*\*|___)\s?$/,
  replace: (parentNode, _children, _match, isImport) => {
    const line = $createHorizontalRuleNode();
    // If it's the last block, insert before so the trailing paragraph stays; else replace.
    if (isImport || parentNode.getNextSibling() != null) {
      parentNode.replace(line);
    } else {
      parentNode.insertBefore(line);
    }
    line.selectNext();
  },
  type: "element",
};

/**
 * ```` ```mermaid ```` fence → a Mermaid diagram block.
 *
 * Must sit before `CODE` in the transformer list: `CODE`'s start pattern also
 * matches a `mermaid` info string, and the first matching multiline transformer
 * wins. `regExpEnd.optional` is what makes the typed form work at all —
 * `registerMarkdownShortcuts` skips any multiline transformer with a mandatory
 * end match (same reason `CODE` marks its own closing fence optional).
 */
const MERMAID: MultilineElementTransformer = {
  dependencies: [MermaidNode],
  export: (node: LexicalNode) => ($isMermaidNode(node) ? `\`\`\`mermaid\n${node.getCode()}\n\`\`\`` : null),
  regExpStart: /^[ \t]*```mermaid/,
  regExpEnd: { optional: true, regExp: /^[ \t]*```$/ },
  replace: (parentNode, children, _startMatch, _endMatch, linesInBetween, isImport) => {
    // The two callers hand over different things. On import `parentNode` is the
    // root container and the body arrives as `linesInBetween`, so the node is
    // appended (never `replace`d — that would swap out the root). While typing
    // it is the paragraph holding the fence, with only the trailing text as
    // `children`, so an empty fence falls back to the sample diagram.
    if (isImport) {
      const code = linesInBetween?.join("\n").trim();
      if (!code) return false;
      parentNode.append($createMermaidNode({ code }));
      return;
    }
    const typed = children
      ?.map((child) => child.getTextContent())
      .join("")
      .trim();
    const diagram = $createMermaidNode({ code: typed || DEFAULT_MERMAID_CODE });
    // If it's the last block, insert before so the trailing paragraph stays; else replace.
    if (parentNode.getNextSibling() != null) parentNode.replace(diagram);
    else parentNode.insertBefore(diagram);
    diagram.selectNext();
  },
  type: "multiline-element",
};

/**
 * Markdown shortcuts enabled in the Akan editor — curated to exactly the nodes
 * we support in the first release. Notably includes `==highlight==`; excludes
 * tables/images/etc. `underline` has no markdown form (use ⌘U).
 *
 * Order matters: element/multiline transformers first, then text-format, then
 * text-match (link) last.
 */
export const AKAN_TRANSFORMERS: Transformer[] = [
  HR,
  HEADING,
  QUOTE,
  MERMAID,
  CODE,
  UNORDERED_LIST,
  ORDERED_LIST,
  CHECK_LIST,
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  STRIKETHROUGH,
  INLINE_CODE,
  HIGHLIGHT,
  LINK,
];
