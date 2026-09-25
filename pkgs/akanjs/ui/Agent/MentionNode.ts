"use client";
import { $applyNodeReplacement, type LexicalNode, type NodeKey, type SerializedTextNode, TextNode } from "lexical";
import { type MessageReference, Reference } from "use-agentic";

export interface SerializedMentionNode extends SerializedTextNode {
  reference: MessageReference;
}

/**
 * One `@` pointer inside the composer: the label is what the node draws, and `getTextContent()` is the
 * `@[label](mention:…)` token — so the editor's own text is the draft string the rest of the chat already reads,
 * pointers and all, while the person sees a name.
 *
 * `token` mode is what makes it one thing: the caret never lands inside it, a backspace takes the whole pointer
 * rather than a character of a label that would then name nothing, and a paste over it replaces it entirely.
 */
export class MentionNode extends TextNode {
  #reference: MessageReference;

  static override getType() {
    return "mention";
  }

  static override clone(node: MentionNode): MentionNode {
    return new MentionNode(node.#reference, node.__key);
  }

  // Required by Lexical 0.51 for any node whose constructor takes an argument, though a composer's content is
  // never serialized through the editor — the draft string is what this chat persists. The parameter is the base
  // class's own, widened shape, because a narrower one fails the static-side check against it.
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
