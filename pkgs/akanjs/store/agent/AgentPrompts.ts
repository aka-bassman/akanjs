import type { PromptContent, PromptMessage, PromptResult } from "akanjs/signal";
import type { ChatMessage } from "use-agentic";

export class AgentPrompts {
  /** `/name arg1 "an arg with spaces"` — positional because a prompt's arguments are flat strings by protocol. */
  static parseCommand(draft: string): { name: string; args: string[] } | null {
    const match = /^\/([A-Za-z0-9_-]+)(?:\s+([\s\S]*))?$/.exec(draft.trim());
    if (!match) return null;
    return { name: match[1], args: AgentPrompts.#args(match[2] ?? "") };
  }

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

  // A binary block becomes an attachment: an `[image]` placeholder reads to a model as a picture it was shown.
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
