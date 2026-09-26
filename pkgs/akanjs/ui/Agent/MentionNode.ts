"use client";
import { $applyNodeReplacement, type LexicalNode, type NodeKey, type SerializedTextNode, TextNode } from "lexical";
import { type MessageReference, Reference } from "use-agentic";

export interface SerializedMentionNode extends SerializedTextNode {
  reference: MessageReference;
}

// Draws the label, reads as the `@[label](mention:…)` token; `token` mode makes backspace take the whole pointer.
export class MentionNode extends TextNode {
  #reference: MessageReference;

  static override getType() {
    return "mention";
  }

  static override clone(node: MentionNode): MentionNode {
    return new MentionNode(node.#reference, node.__key);
  }

  // Lexical requires it once a constructor takes an argument; a narrower parameter fails the static-side check.
  static override importJSON(json: Parameters<typeof TextNode.importJSON>[0]): MentionNode {
    return new MentionNode((json as Partial<SerializedMentionNode>).reference);
  }

  constructor(reference: MessageReference = { refName: "", refId: "", label: "" }, key?: NodeKey) {
    super(reference.label || Reference.keyOf(reference), key);
    this.#reference = reference;
    this.setMode("token");
  }

  get reference(): MessageReference {
    return this.#reference;
  }

  override getTextContent(): string {
    return Reference.token(this.#reference);
  }

  override createDOM(...args: Parameters<TextNode["createDOM"]>): HTMLElement {
    const dom = super.createDOM(...args);
    dom.className = "rounded-field bg-primary/10 px-1 text-primary";
    dom.title = Reference.keyOf(this.#reference);
    return dom;
  }

  override exportJSON(): SerializedMentionNode {
    return { ...super.exportJSON(), reference: this.#reference };
  }
}

export const $createMentionNode = (reference: MessageReference): MentionNode =>
  $applyNodeReplacement(new MentionNode(reference));

export const $isMentionNode = (node: LexicalNode | null | undefined): node is MentionNode =>
  node instanceof MentionNode;
