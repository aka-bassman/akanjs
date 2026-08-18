import { type Cls, FIELD_META, PrimitiveRegistry, type PrimitiveScalar } from "akanjs/base";
import { capitalize } from "akanjs/common";
import { ConstantRegistry } from "akanjs/constant";
import type { AgentRefusal, SerializedArg, SerializedSignal } from "akanjs/signal";
// XXX: Reached as a module, never through the `akanjs/signal` barrel. That barrel value-imports `akanjs/service`,
// which pulls `bun:sqlite` and `node:tls` into whatever loads it — and this file is client code, so importing
// `{ AgentCatalogue } from "akanjs/signal"` breaks the browser bundle for every app. It typechecks and it passes
// every test; only `akan build` catches it.
import { AgentCatalogue } from "../../signal/agent/AgentCatalogue";
import { databaseStateModelTypes, databaseStateNames } from "../databaseStateNames";
import { formSetterNames } from "../formSetterNames";
import type { SliceActionKey } from "../sliceRole";
import type { SliceStateKey } from "../state";
import type { StoreInstance } from "../storeInstance";
import type { SerializedStore, SerializedStoreAction, SerializedStoreState } from "./types";

/** A model field as the catalogue reads it. The parts of `FieldProps` a store setter's argument comes from. */
interface CatalogueField {
  fieldType?: string;
  isClass?: boolean;
  isMap?: boolean;
  isArray?: boolean;
  arrDepth?: number;
  modelRef?: Cls;
  enum?: { refName: string };
  example?: unknown;
}

/** What each generated slice action takes, in the same terms an endpoint states its arguments. */
const sliceActionArgs: {
  [key in SliceActionKey]: { effect: "state" | "query"; args: "slice" | SerializedArg[] };
} = {
  initModel: { effect: "query", args: "slice" },
  refreshModel: { effect: "query", args: [] },
  // Takes the list item itself, not its id, and stores what it was handed — see the refusal in `#sliceActions`.
  selectModel: { effect: "state", args: [] },
  setPageOfModel: { effect: "query", args: [{ type: "param", name: "page", refName: "Int" }] },
  addPageOfModel: { effect: "query", args: [{ type: "param", name: "page", refName: "Int" }] },
  setLimitOfModel: { effect: "query", args: [{ type: "param", name: "limit", refName: "Int" }] },
  setQueryArgsOfModel: { effect: "query", args: "slice" },
  setSortOfModel: { effect: "query", args: [{ type: "param", name: "sort", refName: "String" }] },
};

/** Which of the model's classes each slice state key holds. The rest hold a primitive or a query descriptor. */
const sliceStateModelTypes: { [key in SliceStateKey]?: SerializedStoreState["modelType"] } = {
  defaultModel: "full",
  modelList: "light",
  modelInitList: "light",
  modelSelection: "light",
  modelInsight: "insight",
};

/**
 * What one built store offers an agent, derived from the store the browser is already running.
 *
 * The store is the audience-neutral half of the client surface the way a signal registry is the server's: a key on
 * `st.do` is the same call the user's own click makes, so an agent that drives it cannot reach past what the UI
 * already permits. That is why the default here is the opposite of the MCP catalogue's — every key is published
 * unless something about it cannot be described, and each of those is recorded as a refusal rather than dropped.
 *
 * Nothing is re-declared. An action's arguments come from the endpoint it is named after, from the field metadata
 * the form setter was generated from, or from the role the store recorded while building the slice; a key that
 * matches none of those three is published only when it takes no arguments at all.
 */
export class StoreCatalogue {
  readonly store: SerializedStore;
  readonly refusals: AgentRefusal[] = [];

  readonly #instance: StoreInstance;
  readonly #endpoints = new Map<string, { endpoint: SerializedSignal["endpoint"][string]; refName: string }>();
  readonly #refused = new Set<string>();
  #formSetterCache: Map<string, SerializedStoreAction> | null = null;

  constructor(instance: StoreInstance, serializedSignal: Record<string, SerializedSignal>) {
    this.#instance = instance;
    for (const { key, endpoint, refName } of AgentCatalogue.candidates(serializedSignal))
      this.#endpoints.set(key, { endpoint, refName });
    this.store = { state: this.#state(), action: this.#actions() };
  }

  #refuse(key: string, reason: string) {
    if (this.#refused.has(key)) return;
    this.#refused.add(key);
    this.refusals.push({ key, reason });
  }

  #state(): { [key: string]: SerializedStoreState } {
    const state = this.#instance.get();
    const declared = StoreCatalogue.#declaredStateModels();
    const entries = Object.keys(state)
      .sort()
      .map((key): [string, SerializedStoreState] => {
        const role = this.#instance.sliceStateRoles.get(key);
        const model = role
          ? { refName: role.refName, ...StoreCatalogue.#modelTypeOf(sliceStateModelTypes[role.role]) }
          : (declared.get(key) ?? StoreCatalogue.#refNameOf(state[key]));
        return [
          key,
          {
            type: StoreCatalogue.#typeOf(state[key]),
            ...model,
            ...(role ? { role: role.role } : {}),
            derived: this.#instance.derivedKeys.has(key),
          },
        ];
      });
    return Object.fromEntries(entries);
  }

  /**
   * The model each generated state key holds, taken from the declaration rather than from the value.
   *
   * A read has to be masked by the model, and the value cannot supply it: `immerify` copies a form into a plain
   * object, so `<model>Form` — an `Input` holding whatever the user typed — arrives with its class already gone.
   */
  static #declaredStateModels() {
    const declared = new Map<string, { refName: string; modelType: SerializedStoreState["modelType"] }>();
    for (const refName of ConstantRegistry.database.keys()) {
      const names = databaseStateNames(refName);
      for (const [role, modelType] of Object.entries(databaseStateModelTypes))
        declared.set(names[role as keyof typeof names], { refName, modelType });
    }
    return declared;
  }

  static #modelTypeOf(modelType: SerializedStoreState["modelType"]) {
    return modelType ? { modelType } : {};
  }

  #actions(): { [key: string]: SerializedStoreAction } {
    // Runs first so a setter it refuses is already refused when the loop below reaches that key.
    this.#formSetterCache = this.#formSetters();
    const entries = Object.keys(this.#instance.do)
      .sort()
      .map((key): [string, SerializedStoreAction] | null => this.#action(key))
      .filter((entry): entry is [string, SerializedStoreAction] => !!entry);
    return Object.fromEntries(entries);
  }

  #action(key: string): [string, SerializedStoreAction] | null {
    if (this.#refused.has(key)) return null;
    const endpoint = this.#endpoints.get(key);
    if (endpoint) return [key, this.#endpointAction(key, endpoint)];
    const formSetter = this.#formSetterCache?.get(key);
    if (formSetter) return [key, formSetter];
    const slice = this.#sliceAction(key);
    if (slice) return [key, slice];
    return this.#plainAction(key);
  }

  /**
   * An action named after an endpoint takes the endpoint's arguments. That is not a coincidence to be verified but
   * the house naming rule — "the signal, store, and dictionary re-add the model, so `st.do.X` reads the same as
   * `fetch.X`" — and it is where the store's schemas come from for free.
   */
  #endpointAction(
    key: string,
    { endpoint, refName }: { endpoint: SerializedSignal["endpoint"][string]; refName: string },
  ) {
    const effect = endpoint.type === "mutation" ? "mutation" : "query";
    return { args: endpoint.args, effect, refName, endpoint: key } satisfies SerializedStoreAction;
  }

  /**
   * The generated field setters, computed forward from the same field metadata `makeFormSetter` generated them from.
   *
   * A `hidden` or `secret` field is refused. Nothing else in the framework lets one of those cross an agent
   * boundary — `resolveReturn` strips them on the way out and `Msg.mask` refuses a payload carrying them — and a
   * setter is the same boundary facing the other way: publishing `setPasswordOnUser` names the field and invites a
   * write to it in one entry.
   */
  #formSetters(): Map<string, SerializedStoreAction> {
    const setters = new Map<string, SerializedStoreAction>();
    for (const [refName, cnst] of ConstantRegistry.database) {
      const className = capitalize(refName);
      const fields = (cnst.full as unknown as { [key: symbol]: Record<string, CatalogueField> })[FIELD_META];
      if (!fields) continue;
      for (const [field, meta] of Object.entries(fields)) {
        const names = formSetterNames(className, field);
        if (!(names.setFieldOnModel in this.#instance.do)) continue;
        if (names.uploadFieldOnModel in this.#instance.do)
          this.#refuse(names.uploadFieldOnModel, "it takes a browser `FileList`, which an agent has no way to hold.");
        const arg = this.#argOfField(names.setFieldOnModel, field, meta);
        if (!arg) continue;
        const base = { effect: "state", refName, field } satisfies Partial<SerializedStoreAction>;
        setters.set(names.setFieldOnModel, { ...base, role: "set", args: [arg] });
        if (!meta.isArray) continue;
        const element = { ...arg, ...(arg.arrDepth && arg.arrDepth > 1 ? { arrDepth: arg.arrDepth - 1 } : {}) };
        if (arg.arrDepth === 1) delete element.arrDepth;
        setters.set(names.addFieldOnModel, { ...base, role: "add", args: [element] });
        setters.set(names.addOrSubFieldOnModel, { ...base, role: "addOrSub", args: [element] });
        setters.set(names.subFieldOnModel, {
          ...base,
          role: "sub",
          args: [{ type: "param", name: "idx", refName: "Int" }],
        });
      }
    }
    return setters;
  }

  #argOfField(key: string, name: string, field: CatalogueField): SerializedArg | null {
    if (field.fieldType === "hidden" || field.fieldType === "secret") {
      this.#refuse(key, `\`${name}\` is a ${field.fieldType} field, which never crosses an agent boundary.`);
      return null;
    }
    if (field.isMap) {
      this.#refuse(key, `\`${name}\` is a Map, which has no argument schema to publish.`);
      return null;
    }
    const arrDepth = field.arrDepth ?? 0;
    if (field.enum)
      return { type: "body", name, refName: "String", enum: field.enum.refName, ...(arrDepth ? { arrDepth } : {}) };
    if (field.isClass) {
      const model = field.modelRef ? ConstantRegistry.getRefName(field.modelRef, { allowEmpty: true }) : undefined;
      this.#refuse(
        key,
        `\`${name}\` takes ${model ? `a \`${model}\`` : "an object"}, which an agent holding an id cannot build — it is chosen through the UI.`,
      );
      return null;
    }
    if (!field.modelRef || !PrimitiveRegistry.has(field.modelRef)) {
      this.#refuse(key, `\`${name}\` has no primitive to describe it.`);
      return null;
    }
    return {
      type: "body",
      name,
      refName: PrimitiveRegistry.getName(field.modelRef as typeof PrimitiveScalar),
      ...(arrDepth ? { arrDepth } : {}),
      ...(StoreCatalogue.#exampleOf(field.example) ?? {}),
    };
  }

  #sliceAction(key: string): SerializedStoreAction | null {
    const role = this.#instance.sliceActionRoles.get(key);
    if (!role) return null;
    if (role.role === "selectModel") {
      this.#refuse(key, "it takes the list item itself, and an agent holding an id would store a stub in its place.");
      return null;
    }
    const { effect, args } = sliceActionArgs[role.role];
    return { args: args === "slice" ? role.args : args, effect, refName: role.refName, role: role.role };
  }

  /**
   * Everything else — a state setter the store generated for a plain key, and the actions a module wrote itself.
   *
   * Published only when it declares no parameters, which is the shape most custom actions have: the data comes from
   * the form state the agent has already filled, in the same order a person fills it. One that does declare
   * parameters and matched none of the three schema sources cannot be called safely, so it is refused by name.
   *
   * `Function.length` is the arity, so a rest parameter reads as none — the one shape that slips through. It slips
   * through as callable with no arguments, which for a rest signature is the empty call.
   */
  #plainAction(key: string): [string, SerializedStoreAction] | null {
    const arity = this.#instance.actionArity.get(key) ?? 0;
    if (arity > 0) {
      this.#refuse(key, `it declares ${arity} argument${arity > 1 ? "s" : ""} that no endpoint or field describes.`);
      return null;
    }
    const refName = this.#instance.actionOwners.get(key)?.refName;
    return [key, { args: [], effect: "state", ...(refName ? { refName } : {}) }];
  }

  static #typeOf(value: unknown): SerializedStoreState["type"] {
    if (value === null || value === undefined) return "unknown";
    if (Array.isArray(value)) return "list";
    if (value instanceof Map) return "map";
    if (value instanceof Date) return "date";
    switch (typeof value) {
      case "string":
        return "string";
      case "number":
        return "number";
      case "boolean":
        return "boolean";
      case "object":
        return StoreCatalogue.#isList(value) ? "list" : "object";
      default:
        return "unknown";
    }
  }

  /** `DataList` and `dayjs` are the two objects a store holds that are not what `typeof` says they are. */
  static #isList(value: object) {
    return "values" in value && Array.isArray((value as { values: unknown }).values);
  }

  static #refNameOf(value: unknown) {
    if (!value || typeof value !== "object") return {};
    const refName = ConstantRegistry.getRefName(value.constructor as Cls, { allowEmpty: true });
    return refName ? { refName } : {};
  }

  static #exampleOf(example: unknown) {
    if (example === null || example === undefined) return null;
    if (["string", "number", "boolean"].includes(typeof example)) return { example: example as string };
    return example instanceof Date ? { example } : null;
  }
}
