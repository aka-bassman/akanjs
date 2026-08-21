import { Translator } from "akanjs/client";
import { parseAkanI18nEnv } from "akanjs/common";
import { FetchClient } from "akanjs/fetch";
import type { PromptContent, PromptResult, SerializedSignal } from "akanjs/signal";
import type { ChatMessage } from "use-agentic";

export interface AgentPrompt {
  name: string;
  refName: string;
  description?: string;
  args: { name: string; required: boolean }[];
}

/**
 * The user-invokable `prompt()` endpoints of the mounted app, read off the serialized signals the client already
 * holds — the same catalogue MCP lists them from, so a chat needs no listing endpoint. Guards are not evaluated
 * here: a prompt's own GET enforces them at call time, and the refusal lands in the transcript like any failure.
 */
export class AgentPrompts {
  static of(): AgentPrompts {
    return new AgentPrompts(FetchClient.sharedSerializedSignal);
  }

  readonly #signals: Record<string, SerializedSignal>;

  constructor(signals: Record<string, SerializedSignal>) {
    this.#signals = signals;
  }

  list(): AgentPrompt[] {
    const prompts: AgentPrompt[] = [];
    for (const [refName, signal] of Object.entries(this.#signals))
      for (const [name, endpoint] of Object.entries(signal.endpoint)) {
        if (endpoint.type !== "prompt") continue;
        prompts.push({
          name,
          refName,
          ...(this.#description(refName, name) ? { description: this.#description(refName, name) } : {}),
          args: (endpoint.args ?? []).map((arg) => ({
            name: arg.name,
            required: !(arg.nullable ?? arg.type === "search"),
          })),
        });
      }
    return prompts.sort((a, b) => (a.name < b.name ? -1 : 1));
  }

  find(name: string): AgentPrompt | null {
    return this.list().find((prompt) => prompt.name === name) ?? null;
  }

  /** `/name arg1 arg2` — positional because a prompt's arguments are flat strings by protocol. */
  static parseCommand(draft: string): { name: string; args: string[] } | null {
    const match = /^\/([A-Za-z0-9_-]+)(?:\s+(.*))?$/.exec(draft.trim());
    if (!match) return null;
    return { name: match[1], args: match[2]?.split(/\s+/).filter(Boolean) ?? [] };
  }

  /** The messages a prompt returns become the user's turn, the way an MCP client sends a `prompts/get` result. */
  static messagesOf(result: PromptResult): ChatMessage[] {
    if (typeof result === "string") return [{ role: "user", text: result }];
    return result.map((message) => ({ role: message.role, text: AgentPrompts.textOf(message.content) }));
  }

  static textOf(content: PromptContent): string {
    if (content.type === "text") return content.text;
    if (content.type === "resource") return `[resource ${content.resource.uri}]\n${content.resource.text}`;
    if (content.type === "resource_link") return `[link ${content.name}: ${content.uri}]`;
    return `[${content.type}]`;
  }

  #description(refName: string, name: string) {
    return this.#text(`${refName}.signal.${name}.desc`) ?? this.#text(`${refName}.signal.${name}`);
  }

  #text(key: string) {
    const locale = Translator.getActiveLocale() ?? parseAkanI18nEnv().defaultLocale;
    const text = Translator.translateByLocale(locale, key);
    // A missing key comes back as the key itself, which is the only signal the translator gives.
    return text === key ? undefined : text;
  }
}
