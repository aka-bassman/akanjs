import { type RouteArgsShape, RouteDefinition } from "./RouteDefinition";
import type {
  RouteArgOption,
  RouteArgType,
  RouteArgValue,
  RoutePromptArgument,
  RoutePromptMeta,
  RouteSearchType,
} from "./routeArgs";

interface PagePrompt {
  name: string;
  description: string;
}

export class PageDefinition<Args extends RouteArgsShape = Record<never, never>> extends RouteDefinition<Args> {
  /** MCP names an entry by `^[A-Za-z0-9_-]{1,64}$`; a prompt name outside it never reaches a client's slash menu. */
  static readonly promptName = /^[A-Za-z0-9_-]{1,64}$/;
  /** Appended to a list argument's description: the flat string map of `prompts/get` has no other spelling. */
  static readonly commaSeparated = "Comma-separated list.";

  readonly kind = "page" as const;
  #prompt?: PagePrompt;

  param<Name extends string, Type extends RouteArgType>(name: Name, type: Type, option: RouteArgOption = {}) {
    this.declare({ kind: "param", name, type, list: false, desc: option.desc });
    return this as unknown as PageDefinition<Args & { [Key in Name]: RouteArgValue<Type> }>;
  }

  search<Name extends string, Type extends RouteSearchType>(name: Name, type: Type, option: RouteArgOption = {}) {
    const list = Array.isArray(type);
    this.declare({ kind: "search", name, type: (list ? type[0] : type) as RouteArgType, list, desc: option.desc });
    return this as unknown as PageDefinition<Args & { [Key in Name]?: RouteArgValue<Type> }>;
  }

  /** Publishes this screen as an MCP prompt: the description is the whole instruction a model receives. English. */
  prompt(name: string, description: string) {
    if (!PageDefinition.promptName.test(name))
      throw new Error(`[route-convention] prompt name "${name}" must match ${PageDefinition.promptName}`);
    if (!description.trim()) throw new Error(`[route-convention] prompt "${name}" needs a description`);
    this.#prompt = { name, description };
    return this;
  }

  get promptMeta(): RoutePromptMeta | undefined {
    if (!this.#prompt) return undefined;
    const args: RoutePromptArgument[] = this.args.map((arg) => {
      const description = [arg.desc, arg.list ? PageDefinition.commaSeparated : undefined].filter(Boolean).join(" ");
      return { name: arg.name, ...(description ? { description } : {}), required: arg.kind === "param" };
    });
    return { ...this.#prompt, arguments: args };
  }
}
