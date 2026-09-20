"use client";
import {
  $createLineBreakNode,
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $isRootNode,
  $isTextNode,
  type LexicalNode,
} from "lexical";
import { Reference } from "use-agentic";
import { $createMentionNode, $isMentionNode } from "./MentionNode";

/**
 * The two directions between the composer's draft string and what the editor holds. The string stays the source
 * of truth for the rest of the chat — it is what carries the `@[…](mention:…)` tokens onto the message — and the
 * editor is one way of drawing it, so every offset here is an offset into **that string**, never into what the
 * screen shows.
 */
export class MentionDraft {
  /** Runs inside an editor read or update, like every `$` function. */
  static read(): string {
    return $getRoot().getTextContent();
  }

  /** Rebuilds the whole content from a draft string — the path every write that is not a keystroke takes. */
  static write(text: string, caretAt?: number) {
    const paragraph = $createParagraphNode();
    paragraph.append(...MentionDraft.nodesOf(text));
    $getRoot().clear().append(paragraph);
    MentionDraft.place(caretAt ?? text.length);
  }

  static nodesOf(text: string): LexicalNode[] {
    const nodes: LexicalNode[] = [];
    let at = 0;
    // A copy rather than the shared pattern: this walks positions with `exec`, which leaves `lastIndex` behind on
    // whatever regex it was given.
    const pattern = new RegExp(Reference.pattern.source, "g");
    for (let match = pattern.exec(text); match; match = pattern.exec(text)) {
      const [token, label, refName, refId, path] = match;
      if (match.index > at) nodes.push(...MentionDraft.#plain(text.slice(at, match.index)));
      nodes.push($createMentionNode({ refName, refId, label, ...(path ? { path } : {}) }));
      at = match.index + token.length;
    }
    if (at < text.length) nodes.push(...MentionDraft.#plain(text.slice(at)));
    return nodes;
  }

  /** Where the caret sits in the draft string, or `null` when there is no collapsed caret to report. */
  static caret(): number | null {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return null;
    const anchor = selection.anchor;
    const node = anchor.getNode();
    if ($isTextNode(node)) {
      // A mention is one thing, so a caret Lexical reports inside one belongs at whichever end it is nearer.
      const inner = $isMentionNode(node) ? (anchor.offset ? node.getTextContent().length : 0) : anchor.offset;
      return MentionDraft.#before(node) + inner;
    }
    const children = $isElementNode(node) ? node.getChildren() : [];
    const within = children.slice(0, anchor.offset).reduce((sum, child) => sum + child.getTextContent().length, 0);
    return MentionDraft.#before(node) + within;
  }

  /** Puts the caret at a draft-string offset. Past the end, or inside a mention, it lands on the nearest edge. */
  static place(at: number) {
    const paragraph = $getRoot().getLastChild();
    if (!$isElementNode(paragraph)) return;
    let seen = 0;
    for (const child of paragraph.getChildren()) {
      const length = child.getTextContent().length;
      if (at <= seen + length) {
        // `selectNext()` and `select()` without offsets both mean "the end of that node" in Lexical, which for a
        // pointer is the end of whatever follows it — an offset off by a whole word.
        if ($isTextNode(child) && !$isMentionNode(child)) child.select(at - seen, at - seen);
        else if (at > seen) child.selectNext(0, 0);
        else if (child.getPreviousSibling()) child.selectPrevious();
        else paragraph.select(0, 0);
        return;
      }
      seen += length;
    }
    paragraph.selectEnd();
  }

  static #plain(text: string): LexicalNode[] {
    return text
      .split("\n")
      .flatMap((line, idx) => [...(idx ? [$createLineBreakNode()] : []), ...(line ? [$createTextNode(line)] : [])]);
  }

  static #before(node: LexicalNode): number {
    let sum = 0;
    for (let cursor = node.getPreviousSibling(); cursor; cursor = cursor.getPreviousSibling())
      sum += cursor.getTextContent().length;
    const parent = node.getParent();
    return parent && !$isRootNode(parent) ? sum + MentionDraft.#before(parent) : sum;
  }
}
