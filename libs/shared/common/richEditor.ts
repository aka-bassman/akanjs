export interface MentionRef {
  refName: string;
  refId: string;
}

export interface MentionTarget {
  refName: string;
  id: string;
  name: string;
}

export interface EditorNode {
  type: string;
  version: number;
}

export interface EditorContent {
  root: EditorNode;
}

interface ContentNode {
  type?: string;
  text?: string;
  refName?: unknown;
  refId?: unknown;
  children?: unknown;
}

const MENTION = "akan-mention";

export class RichEditor {
  static collectMentions(content: unknown): MentionRef[] {
    if (!content || typeof content !== "object" || Array.isArray(content)) return [];
    const root = (content as { root?: ContentNode }).root;
    if (!root) return [];
    const refs = new Map<string, MentionRef>();
    RichEditor.#walkMentions(root, refs);
    return [...refs.values()];
  }

  // Field for field the shape parseEditorState expects — a node missing `version` is rejected.
  static contentFromText(text: string) {
    return {
      root: {
        children: text.split("\n").map((line) => ({
          children: line
            ? [{ detail: 0, format: 0, mode: "normal", style: "", text: line, type: "text", version: 1 }]
            : [],
          direction: null,
          format: "",
          indent: 0,
          type: "paragraph",
          version: 1,
          textFormat: 0,
          textStyle: "",
        })),
        direction: null,
        format: "",
        indent: 0,
        type: "root",
        version: 1,
      },
    };
  }

  static extractTextFromContent(content: unknown): string {
    if (!content || typeof content !== "object") return "";
    if (Array.isArray(content)) return content.map((node) => RichEditor.#nodeText(node as ContentNode)).join("");
    const root = (content as { root?: ContentNode }).root;
    return root ? RichEditor.#nodeText(root) : "";
  }

  static extractTextWithoutMentions(content: unknown): string {
    if (!content || typeof content !== "object") return "";
    if (Array.isArray(content)) return content.map((node) => RichEditor.#nodeText(node as ContentNode, true)).join("");
    const root = (content as { root?: ContentNode }).root;
    return root ? RichEditor.#nodeText(root, true) : "";
  }

  static richText(text: string) {
    const emptyText = { type: "text", text, format: 0, detail: 0, mode: "normal", style: "", version: 1 };
    const paragraph = { type: "paragraph", format: "", indent: 0, version: 1, direction: null, children: [emptyText] };
    return { root: { type: "root", format: "", indent: 0, version: 1, direction: null, children: [paragraph] } };
  }

  static richTextToPlain(content: unknown): string {
    const walk = (node: unknown): string => {
      if (!node || typeof node !== "object") return "";
      const { type, text, children } = node as { type?: string; text?: string; children?: unknown[] };
      if (typeof text === "string") return text;
      const inner = Array.isArray(children) ? children.map(walk).join("") : "";
      return type === "paragraph" ? `${inner}\n` : inner;
    };
    return walk((content as { root?: unknown } | null | undefined)?.root).trim();
  }

  static appendMention(content: unknown, asset: MentionTarget) {
    const doc = (content ?? {}) as { root?: { children?: unknown[] } & Record<string, unknown> } & Record<
      string,
      unknown
    >;
    const nodes = [RichEditor.#mentionNode(asset), RichEditor.#textNode(" ")];
    const children = Array.isArray(doc.root?.children) ? [...doc.root.children] : [];
    const last = children.at(-1) as { type?: string; children?: unknown[] } | undefined;
    if (last?.type === "paragraph" && Array.isArray(last.children))
      children[children.length - 1] = { ...last, children: [...last.children, ...nodes] };
    else children.push(RichEditor.#paragraphNode(nodes));
    return { ...doc, root: { ...RichEditor.#emptyRoot, ...doc.root, children } };
  }

  static #emptyRoot = { type: "root", format: "", indent: 0, version: 1, direction: null };

  static #textNode(text: string) {
    return { type: "text", text, format: 0, detail: 0, mode: "normal", style: "", version: 1 };
  }

  static #mentionNode(asset: MentionTarget) {
    return {
      type: MENTION,
      text: `@${asset.name}`,
      refName: asset.refName,
      refId: asset.id,
      label: asset.name,
      href: `/${asset.refName}/${asset.id}`,
      format: 0,
      detail: 1,
      mode: "token",
      style: "",
      version: 1,
    };
  }

  static #paragraphNode(children: object[]) {
    return { type: "paragraph", format: "", indent: 0, version: 1, direction: null, children };
  }

  static #walkMentions(node: ContentNode, refs: Map<string, MentionRef>) {
    if (node.type === MENTION && typeof node.refName === "string" && typeof node.refId === "string") {
      refs.set(`${node.refName}:${node.refId}`, { refName: node.refName, refId: node.refId });
    }
    if (!Array.isArray(node.children)) return;
    for (const child of node.children) {
      if (child && typeof child === "object") RichEditor.#walkMentions(child as ContentNode, refs);
    }
  }

  static #nodeText(node: ContentNode, skipMentions = false): string {
    if (skipMentions && node.type === MENTION) return "";
    if (typeof node.text === "string") return node.text;
    const children = Array.isArray(node.children) ? (node.children as ContentNode[]) : [];
    const childText = children.map((child) => RichEditor.#nodeText(child, skipMentions)).join("");
    switch (node.type) {
      case "quote":
      case "blockquote":
        return `> ${childText}\n`;
      case "listitem":
      case "li":
        return `- ${childText}\n`;
      // Block-level containers get a trailing newline; inline/leaf nodes don't.
      case "paragraph":
      case "p":
      case "heading":
      case "h1":
      case "h2":
      case "h3":
      case "h4":
      case "h5":
      case "h6":
        return `${childText}\n`;
      default:
        return childText;
    }
  }
}
