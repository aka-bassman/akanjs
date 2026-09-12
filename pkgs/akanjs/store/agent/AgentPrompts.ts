import type { PromptContent, PromptMessage, PromptResult } from "akanjs/signal";
import type { ChatMessage } from "use-agentic";

/**
 * The chat's slash-command parser and the bridge from prompt messages to chat turns. The app's own prompts are
 * `page().prompt()` declarations served over MCP, which a browser chat does not list; what stays here is what the
 * chat's built-in commands need.
 */
export class AgentPrompts {
  /** `/name arg1 "an arg with spaces"` — positional because a prompt's arguments are flat strings by protocol. */
  static parseCommand(draft: string): { name: string; args: string[] } | null {
    const match = /^\/([A-Za-z0-9_-]+)(?:\s+([\s\S]*))?$/.exec(draft.trim());
    if (!match) return null;
    return { name: match[1], args: AgentPrompts.#args(match[2] ?? "") };
  }

  /**
   * Whitespace separates arguments, and quotes are how a sentence stays one of them — a prompt taking a single
   * `String` is the common case, and splitting "plan the week" into three arguments fills the second parameter
   * with the second word.
   */
  static #args(rest: string): string[] {
    const args: string[] = [];
    for (const token of rest.matchAll(/"([^"]*)"|'([^']*)'|(\S+)/g)) args.push(token[1] ?? token[2] ?? token[3]);
    return args;
  }

  /** The messages a prompt returns become the user's turn, the way an MCP client sends a `prompts/get` result. */
  static messagesOf(result: PromptResult): ChatMessage[] {
    if (typeof result === "string") return [{ role: "user", text: result }];
    return result.map((message) => AgentPrompts.#messageOf(message));
  }

  /**
   * A binary block becomes an attachment. It used to become the string `[image]`, which a model reads as having
   * been shown a picture — so a prompt built with `Msg.imageOf` produced confident answers about bytes that never
   * left the server. The other block types are text already and stay text.
   */
  static #messageOf(message: PromptMessage): ChatMessage {
    const { role, content } = message;
    if (content.type !== "image" && content.type !== "audio") return { role, text: AgentPrompts.textOf(content) };
    const name = AgentPrompts.#binaryName(content.mimeType);
    return { role, attachments: [{ name, mimeType: content.mimeType, data: content.data }] };
  }

  /** `Msg.image` carries no filename — the protocol has nowhere to put one — so the type is the label. */
  static #binaryName(mimeType: string) {
    const [kind, subtype] = mimeType.split("/");
    return subtype ? `${kind}.${subtype.split("+")[0]}` : mimeType;
  }

  static textOf(content: PromptContent): string {
    if (content.type === "text") return content.text;
    if (content.type === "resource") return `[resource ${content.resource.uri}]\n${content.resource.text}`;
    if (content.type === "resource_link") return `[link ${content.name}: ${content.uri}]`;
    return `[${content.type}]`;
  }
}
