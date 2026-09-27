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

// Call inside an editor read or update like any Lexical `$` function; offsets index the draft string, tokens included.
export class MentionDraft {
  static read(): string {
    return $getRoot().getTextContent();
  }

  static write(text: string, caretAt?: number) {
    const paragraph = $createParagraphNode();
    paragraph.append(...MentionDraft.nodesOf(text));
    $getRoot().clear().append(paragraph);
    MentionDraft.place(caretAt ?? text.length);
  }

  static nodesOf(text: string): LexicalNode[] {
    const nodes: LexicalNode[] = [];
    let at = 0;
    // A copy, not the shared pattern: `exec` leaves `lastIndex` behind on whatever regex it walks.
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

  static caret(): number | null {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return null;
    const anchor = selection.anchor;
    const node = anchor.getNode();
    if ($isTextNode(node)) {
      // A caret Lexical reports inside a mention snaps to one of its ends.
      const inner = $isMentionNode(node) ? (anchor.offset ? node.getTextContent().length : 0) : anchor.offset;
      return MentionDraft.#before(node) + inner;
    }
    const children = $isElementNode(node) ? node.getChildren() : [];
    const within = children.slice(0, anchor.offset).reduce((sum, child) => sum + child.getTextContent().length, 0);
    return MentionDraft.#before(node) + within;
  }

  static place(at: number) {
    const paragraph = $getRoot().getLastChild();
    if (!$isElementNode(paragraph)) return;
    let seen = 0;
    for (const child of paragraph.getChildren()) {
      const length = child.getTextContent().length;
      if (at <= seen + length) {
        // Offsets are explicit: Lexical's bare `selectNext()` / `select()` mean the end of the following node.
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
