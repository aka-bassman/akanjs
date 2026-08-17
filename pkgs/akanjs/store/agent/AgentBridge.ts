import { DataList } from "akanjs/base";
import { Translator } from "akanjs/client";
import { parseAkanI18nEnv } from "akanjs/common";
import { ConstantRegistry, type MaskModel, mask } from "akanjs/constant";
import { FetchClient } from "akanjs/fetch";
import type { AgentRefusal, AgentUndescribed, JsonSchema, SerializedArg, SerializedSignal } from "akanjs/signal";
// XXX: Module, not barrel — see the note in `StoreCatalogue`. `akanjs/signal` drags `bun:sqlite` into the browser.
import { JsonSchemaBuilder } from "../../signal/schema/JsonSchemaBuilder";
import type { StoreInstance } from "../storeInstance";
import { StoreRegistry } from "../storeRegistry";
import { StoreCatalogue } from "./StoreCatalogue";
import type { SerializedStore, SerializedStoreAction, SerializedStoreState, StoreActionEffect } from "./types";

export interface AgentTool {
  name: string;
  title?: string;
  description?: string;
  /** One flat named object, the shape MCP publishes. The bridge maps it onto the action's positional parameters. */
  inputSchema: JsonSchema;
  effect: StoreActionEffect;
}

/** One call the agent made, in the order it made them. */
export interface AgentCall {
  name: string;
  args: Record<string, unknown>;
  at: Date;
  error?: string;
}

export interface AgentBridgeOptions {
  /** Resolves a dictionary key to its text. Defaults to the seeded `Translator` in the active locale. */
  resolveDescription?: (key: string) => string | undefined;
}

/**
 * What an in-page agent may do to the app the user is looking at.
 *
 * Every call goes through `st.do`, which is the same single dispatch point a click goes through — so the agent
 * cannot reach past what the UI already lets this user do, the app re-renders from the write, and the user watches
 * the result rather than being told about it. That is why the exposure default here is the opposite of the MCP
 * catalogue's: an external agent's `tools/list` is an attack surface built out of names the operator never chose to
 * publish, while this one is the user's own session, under their own credential, with them watching.
 *
 * It is deliberately not an agent. There is no model, no provider, and no key here — an app wires whichever it uses
 * to `tools`, `call`, and `read`. The framework's half is the catalogue, the argument checking, the masking, and the
 * transcript; the conversation is the app's.
 */
export class AgentBridge {
  readonly tools: AgentTool[];
  readonly refusals: AgentRefusal[];
  /** Published entries with no words an author wrote. What a source scanner cannot see, per `AgentCatalogue`. */
  readonly undescribed: AgentUndescribed[] = [];

  readonly #instance: StoreInstance;
  readonly #store: SerializedStore;
  readonly #options: AgentBridgeOptions;
  readonly #schema = new JsonSchemaBuilder({ refPrefix: "#/$defs/" });
  readonly #byName = new Map<string, SerializedStoreAction>();
  readonly #calls: AgentCall[] = [];

  /**
   * The bridge for the app running in this process: the one store every `st.do` goes through, and every signal any
   * client has applied. An app needs no arguments to reach its own agent surface.
   */
  static of(options: AgentBridgeOptions = {}) {
    return new AgentBridge(StoreRegistry.instance, FetchClient.sharedSerializedSignal, options);
  }

  constructor(
    instance: StoreInstance,
    serializedSignal: Record<string, SerializedSignal>,
    options: AgentBridgeOptions = {},
  ) {
    this.#instance = instance;
    this.#options = options;
    const catalogue = new StoreCatalogue(instance, serializedSignal);
    this.#store = catalogue.store;
    this.refusals = catalogue.refusals;
    for (const [name, action] of Object.entries(this.#store.action)) this.#byName.set(name, action);
    this.tools = Object.entries(this.#store.action).map(([name, action]) => this.#tool(name, action));
  }

  get state(): { [key: string]: SerializedStoreState } {
    return this.#store.state;
  }

  get transcript(): readonly AgentCall[] {
    return this.#calls;
  }

  subscribe(listener: () => void) {
    return this.#instance.subscribe(listener);
  }

  /**
   * The value behind a state key, stripped of what the model marks `hidden` or `secret`.
   *
   * Masking is not optional here even though the data mostly came from the server already masked: `<model>Form`
   * holds what the *user* typed, credentials included, and an in-page agent ships what it reads to a remote model.
   * The mask is by the declared model rather than by the value's class, because `immerify` copies a form into a
   * plain object and the class is gone by the time anyone can ask.
   */
  read(key: string): unknown {
    const entry = this.#store.state[key];
    if (!entry) throw new Error(`Unknown state key: ${key}`);
    const value = AgentBridge.#unwrap(this.#instance.get()[key]);
    if (entry.refName && entry.modelType) {
      const model = ConstantRegistry.getModelRef(entry.refName, entry.modelType) as MaskModel;
      return mask(model, value);
    }
    if (AgentBridge.#isPlainValue(value)) return value;
    throw new Error(
      `State key "${key}" holds an object that belongs to no model, so there is nothing to mask it by and it is not published. Read the model's own keys instead.`,
    );
  }

  /**
   * Dispatches through `st.do`, so what happens is what happens when the user clicks.
   *
   * Arguments arrive named and are mapped onto the action's parameters in declared order. An omitted optional one
   * becomes `null`, which is what the slice query builders already expect; an omitted required one is refused,
   * because the alternative is a call that writes `undefined` into state and reports success.
   */
  async call(name: string, args: Record<string, unknown> = {}) {
    const action = this.#byName.get(name);
    if (!action) throw new Error(`Unknown action: ${name}`);
    // Recorded before the arguments are checked, so a call the bridge itself rejects is still in the transcript.
    // An attempt that was refused is a thing the agent did, and leaving it out is how a transcript starts to lie.
    const record: AgentCall = { name, args, at: new Date() };
    this.#calls.push(record);
    try {
      const positional = action.args.map((arg) => this.#value(name, arg, args));
      await this.#instance.do[name]?.(...positional);
    } catch (error) {
      record.error = error instanceof Error ? error.message : String(error);
      throw error;
    }
  }

  #value(name: string, arg: SerializedArg, args: Record<string, unknown>) {
    if (!(arg.name in args) || args[arg.name] === undefined) {
      if (arg.nullable || arg.type === "search") return null;
      throw new Error(`Missing argument "${arg.name}" for ${name}.`);
    }
    return AgentBridge.#checked(name, arg, args[arg.name]);
  }

  /**
   * Checks a value against what the argument declared, one level of array included.
   *
   * `st.do` accepts anything — it is a rest wrapper — so without this a string where an `Int` belongs is written
   * into state and rendered, and the agent is told the call succeeded. A model argument is checked only for being
   * an object: the published schema describes its fields and the endpoint validates them server-side.
   */
  static #checked(name: string, arg: SerializedArg, value: unknown): unknown {
    const depth = arg.arrDepth ?? 0;
    if (depth) {
      if (!Array.isArray(value)) throw new Error(`Argument "${arg.name}" of ${name} must be an array.`);
      return value.map((item) => AgentBridge.#checked(name, { ...arg, arrDepth: depth - 1 }, item));
    }
    if (value === null) return null;
    if (arg.enum) return AgentBridge.#checkedEnum(name, arg, value);
    switch (arg.refName) {
      case "String":
      case "ID":
        return AgentBridge.#assertType(name, arg, value, "string");
      case "Int":
        if (!Number.isInteger(value)) throw new Error(`Argument "${arg.name}" of ${name} must be a whole number.`);
        return value;
      case "Float":
        if (typeof value !== "number" || !Number.isFinite(value))
          throw new Error(`Argument "${arg.name}" of ${name} must be a finite number.`);
        return value;
      case "Boolean":
        return AgentBridge.#assertType(name, arg, value, "boolean");
      case "Date":
        return AgentBridge.#checkedDate(name, arg, value);
      default:
        if (typeof value !== "object") throw new Error(`Argument "${arg.name}" of ${name} must be an object.`);
        return value;
    }
  }

  static #assertType(name: string, arg: SerializedArg, value: unknown, type: "string" | "boolean") {
    if (typeof value !== type) throw new Error(`Argument "${arg.name}" of ${name} must be a ${type}.`);
    return value;
  }

  static #checkedEnum(name: string, arg: SerializedArg, value: unknown) {
    const values = arg.enum ? ConstantRegistry.enum.get(arg.enum)?.values : undefined;
    if (!values) return value;
    if (!values.includes(value as never))
      throw new Error(`Argument "${arg.name}" of ${name} must be one of: ${[...values].join(", ")}.`);
    return value;
  }

  /** An agent has no `Date`, so an ISO string is what it sends. Anything unparseable is refused rather than `Invalid Date`. */
  static #checkedDate(name: string, arg: SerializedArg, value: unknown) {
    if (value instanceof Date) return value;
    const parsed = typeof value === "string" ? new Date(value) : null;
    if (!parsed || Number.isNaN(parsed.getTime()))
      throw new Error(`Argument "${arg.name}" of ${name} must be an ISO 8601 date string.`);
    return parsed;
  }

  #tool(name: string, action: SerializedStoreAction): AgentTool {
    const properties = Object.fromEntries(action.args.map((arg) => [arg.name, this.#argSchema(action, arg)]));
    const required = action.args.filter((arg) => !arg.nullable && arg.type !== "search").map((arg) => arg.name);
    const defs = this.#schema.referencedSchemas(properties);
    return {
      name,
      ...this.#texts(name, action),
      inputSchema: {
        type: "object",
        properties,
        ...(required.length ? { required } : {}),
        additionalProperties: false,
        ...(Object.keys(defs).length ? { $defs: defs } : {}),
      },
      effect: action.effect,
    };
  }

  /**
   * `.store()` names an action and nothing about its arguments — it takes no `.arg()`, because a store action has
   * no argument metadata of its own to declare. The prose is already written where the argument came from: an
   * endpoint-named action borrows `<refName>.signal.<endpoint>.arg.<name>.desc`, and a field setter's one argument
   * is the field, described at `<refName>.<field>.desc`. A slice role's `page`/`limit`/`sort` are the framework's
   * own and have no dictionary entry to borrow.
   */
  #argSchema(action: SerializedStoreAction, arg: SerializedArg) {
    const description = this.#argText(action, arg);
    return {
      ...this.#schema.arg(arg),
      ...(description ? { description } : {}),
      ...(arg.example !== undefined ? { examples: [arg.example] } : {}),
    };
  }

  #argText({ refName, endpoint, field }: SerializedStoreAction, arg: SerializedArg) {
    if (!refName) return undefined;
    if (endpoint) return this.#text(`${refName}.signal.${endpoint}.arg.${arg.name}.desc`);
    return field && arg.name === field ? this.#text(`${refName}.${field}.desc`) : undefined;
  }

  /**
   * The words an agent picks the action by, from the one channel this codebase has for them.
   *
   * Order matters and follows the same leniency the MCP catalogue uses for a slice: an action's own `.store()`
   * entry, then the endpoint it is named after — which is right rather than merely adequate, because the house
   * rule makes `st.do.X` and `fetch.X` the same verb — then, on a field setter, the field's own label. Only what
   * reaches none of the three is recorded as undescribed.
   */
  #texts(name: string, action: SerializedStoreAction) {
    const { refName, endpoint, field, generated } = action;
    const keys = refName
      ? [
          `${refName}.store.${name}`,
          ...(endpoint ? [`${refName}.signal.${endpoint}`] : []),
          ...(field ? [`${refName}.${field}`] : []),
        ]
      : [];
    for (const key of keys) {
      const title = this.#text(key);
      const description = this.#text(`${key}.desc`);
      if (title || description) return { ...(title ? { title } : {}), ...(description ? { description } : {}) };
    }
    // A generated action is never recorded as debt. `createX`, `setFieldOnX`, `createXInForm` and the rest are named
    // by a rule rather than by an author, so there is no `.store()` entry anyone should be writing for them — the
    // model's own `.desc()` is their only legitimate text, and demanding more would teach authors to ignore the list.
    if (!generated)
      this.undescribed.push({
        key: name,
        reason: refName
          ? `neither \`${refName}.store.${name}\` nor anything it inherits from has text, so an agent has the name and nothing else.`
          : "it belongs to no model, so there is no dictionary node its text could be written in.",
      });
    return {};
  }

  #text(key: string) {
    if (this.#options.resolveDescription) return this.#options.resolveDescription(key);
    const locale = Translator.getActiveLocale() ?? parseAkanI18nEnv().defaultLocale;
    const text = Translator.translateByLocale(locale, key);
    // A missing key comes back as the key itself, which is the only signal the translator gives.
    return text === key ? undefined : text;
  }

  static #unwrap(value: unknown) {
    return value instanceof DataList ? value.values : value;
  }

  /** True when nothing inside could be carrying a model's fields, so there is nothing a mask would have to strip. */
  static #isPlainValue(value: unknown): boolean {
    if (value === null || value === undefined) return true;
    if (Array.isArray(value)) return value.every((item) => AgentBridge.#isPlainValue(item));
    if (value instanceof Date) return true;
    return typeof value !== "object";
  }
}
