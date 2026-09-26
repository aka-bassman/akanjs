import { type Cls, FIELD_META, getNonArrayModel, PrimitiveRegistry, type PrimitiveScalar } from "akanjs/base";
import { type ConstantCls, type ConstantField, ConstantRegistry, type ConstantType } from "akanjs/constant";
import type { SerializedArg, SerializedReturns } from "../types";

export type JsonSchema = Record<string, unknown>;

export interface JsonSchemaBuilderOptions {
  /** Default `#/components/schemas/` (OpenAPI); MCP embeds each tool's models in a per-schema `$defs`. */
  refPrefix?: string;
  /** `anyOf` (default) adds a null branch; `type` merges `"null"` into a plain `type` (and its `enum`), shorter. */
  nullable?: "anyOf" | "type";
  /** `wire` (default) is the HTTP body shape; `agent` uses a primitive's `agent.schema` when it declares one. */
  face?: JsonSchemaFace;
}

export type JsonSchemaFace = "wire" | "agent";

export type JsonSchemaRelations = "inline" | "id" | "named";

export interface JsonSchemaModelOptions {
  /**
   * Response schemas only: drops `hidden`/`secret` (stripped from every response, and on `user` the names alone
   * leak) and `visual` (stripped for AI callers, so listing it `required` would make a client refuse the result).
   */
  readable?: boolean;
  /**
   * A database-model field: `inline` (default) follows the `$ref`, `id` is what a request body carries, `named` is
   * `{ type: "object" }` with the model name. An embedded scalar always stays inline.
   */
  relations?: JsonSchemaRelations;
  /** Whether an id carries the 24-hex `pattern` (default `true`). */
  idPattern?: boolean;
}

export class JsonSchemaBuilder {
  readonly #refPrefix: string;
  readonly #nullableForm: "anyOf" | "type";
  readonly #face: JsonSchemaFace;
  constructor({
    refPrefix = "#/components/schemas/",
    nullable = "anyOf",
    face = "wire",
  }: JsonSchemaBuilderOptions = {}) {
    this.#refPrefix = refPrefix;
    this.#nullableForm = nullable;
    this.#face = face;
  }

  arg(arg: SerializedArg): JsonSchema {
    const schema = arg.oneOf
      ? JsonSchemaBuilder.#inlineEnum(arg.oneOf)
      : arg.enum
        ? this.#enum(arg.enum)
        : this.#ref(arg.refName, arg.modelType);
    return this.#nullable(JsonSchemaBuilder.#arrayed(schema, arg.arrDepth ?? 0), !!arg.nullable);
  }

  upload(arg: SerializedArg): JsonSchema {
    const fileSchema = { type: "string", format: "binary" };
    return this.#nullable(JsonSchemaBuilder.#arrayed(fileSchema, arg.arrDepth ?? 0), !!arg.nullable);
  }

  returns(returns: SerializedReturns): JsonSchema {
    return this.#nullable(
      JsonSchemaBuilder.#arrayed(this.#ref(returns.refName, returns.modelType), returns.arrDepth ?? 0),
      !!returns.nullable,
    );
  }

  model(modelRef: ConstantCls, options: JsonSchemaModelOptions = {}): JsonSchema {
    const { readable = false } = options;
    const fields = (modelRef as { [FIELD_META]?: Record<string, ConstantField> })[FIELD_META] ?? {};
    const properties: Record<string, JsonSchema> = {};
    const required: string[] = [];
    for (const [key, field] of Object.entries(fields)) {
      const props = field.getProps();
      if (readable && (props.fieldType === "hidden" || props.fieldType === "secret" || props.visual)) continue;
      properties[key] = this.#field(field, options);
      if (!props.nullable) required.push(key);
    }
    return {
      type: "object",
      properties,
      ...(required.length ? { required } : {}),
      additionalProperties: false,
    };
  }

  allModelSchemas(options: JsonSchemaModelOptions = {}): Record<string, JsonSchema> {
    const schemas: Record<string, JsonSchema> = {};
    for (const [, database] of ConstantRegistry.database.entries()) {
      [database.input, database.object, database.full, database.light, database.insight].forEach((modelRef) => {
        schemas[ConstantRegistry.getModelName(modelRef)] = this.model(modelRef, options);
      });
    }
    for (const [, scalar] of ConstantRegistry.scalar.entries()) {
      schemas[ConstantRegistry.getModelName(scalar.model)] = this.model(scalar.model, options);
    }
    return schemas;
  }

  /** The transitive closure of the models `seed` references, sorted by name. Pass `allSchemas` when narrowing often. */
  referencedSchemas(seed: unknown, allSchemas: Record<string, JsonSchema> = this.allModelSchemas()) {
    const referencedNames = this.collectRefNames(seed);
    const pending = [...referencedNames];
    for (let idx = 0; idx < pending.length; idx++) {
      const schemaName = pending[idx];
      if (!schemaName) continue;
      const schema = allSchemas[schemaName];
      if (!schema) continue;
      for (const nestedName of this.collectRefNames(schema)) {
        if (referencedNames.has(nestedName)) continue;
        referencedNames.add(nestedName);
        pending.push(nestedName);
      }
    }
    return Object.fromEntries(
      [...referencedNames]
        .sort((a, b) => a.localeCompare(b))
        .flatMap((name) => (allSchemas[name] ? ([[name, allSchemas[name]]] as const) : [])),
    );
  }

  collectRefNames(value: unknown): Set<string> {
    const refs = new Set<string>();
    const visit = (current: unknown) => {
      if (!current || typeof current !== "object") return;
      if (Array.isArray(current)) {
        current.forEach(visit);
        return;
      }
      const record = current as Record<string, unknown>;
      if (typeof record.$ref === "string") {
        const name = this.#refName(record.$ref);
        if (name) refs.add(name);
      }
      Object.values(record).forEach(visit);
    };
    visit(value);
    return refs;
  }

  // Prefix matching, not a RegExp: `#/$defs/` contains `$`, which a naive pattern reads as end-of-input.
  #refName(ref: string): string | undefined {
    if (!ref.startsWith(this.#refPrefix)) return undefined;
    const name = ref.slice(this.#refPrefix.length);
    return name.length ? name : undefined;
  }

  #ref(refName: string, modelType?: ConstantType): JsonSchema {
    if (!modelType) return JsonSchemaBuilder.primitive(refName, { face: this.#face });
    const modelRef = ConstantRegistry.getModelRef(refName, modelType);
    return { $ref: `${this.#refPrefix}${ConstantRegistry.getModelName(modelRef as Cls)}` };
  }

  #modelRef(modelRef: Cls, { relations = "inline", idPattern = true }: JsonSchemaModelOptions = {}): JsonSchema {
    if (PrimitiveRegistry.has(modelRef))
      return JsonSchemaBuilder.primitive(PrimitiveRegistry.getName(modelRef as typeof PrimitiveScalar), {
        idPattern,
        face: this.#face,
      });
    if (relations !== "inline" && !ConstantRegistry.isScalar(modelRef as ConstantCls)) {
      if (relations === "id") return JsonSchemaBuilder.primitive("ID", { idPattern });
      return { type: "object", description: ConstantRegistry.getModelName(modelRef) };
    }
    return { $ref: `${this.#refPrefix}${ConstantRegistry.getModelName(modelRef)}` };
  }

  #field(field: ConstantField, options: JsonSchemaModelOptions): JsonSchema {
    const props = field.getProps();
    const schema = props.enum ? JsonSchemaBuilder.#inlineEnum([...props.enum.values]) : this.#fieldRef(props, options);
    return this.#nullable(JsonSchemaBuilder.#arrayed(schema, props.arrDepth), props.nullable);
  }

  #fieldRef(props: ReturnType<ConstantField["getProps"]>, options: JsonSchemaModelOptions): JsonSchema {
    if (props.isMap) {
      const [valueRef, valueArrDepth] = getNonArrayModel(props.of as Cls | Cls[]);
      // `serialize` sends a map's model values whole rather than as ids, so a request schema keeps them inline.
      const valueOptions = options.relations === "id" ? { ...options, relations: "inline" as const } : options;
      return {
        type: "object",
        additionalProperties: JsonSchemaBuilder.#arrayed(this.#modelRef(valueRef as Cls, valueOptions), valueArrDepth),
      };
    }
    return this.#modelRef(props.modelRef as Cls, options);
  }

  #enum(refName: string): JsonSchema {
    const enumRef = ConstantRegistry.enum.get(refName);
    if (!enumRef) return { type: "string", "x-akan-enum": refName };
    return JsonSchemaBuilder.#inlineEnum([...enumRef.values]);
  }

  static primitive(
    refName: string,
    { idPattern = true, face = "wire" }: Pick<JsonSchemaModelOptions, "idPattern"> & { face?: JsonSchemaFace } = {},
  ): JsonSchema {
    const scalar = PrimitiveRegistry.hasName(refName) ? PrimitiveRegistry.get(refName) : null;
    const declared = (face === "agent" ? scalar?.agent?.schema : undefined) ?? scalar?.jsonSchema;
    if (declared) return { ...declared };
    switch (refName) {
      case "Boolean":
        return { type: "boolean" };
      case "Date":
        return { type: "string", format: "date-time" };
      case "Float":
        return { type: "number" };
      case "ID":
        return idPattern ? { type: "string", pattern: "^[0-9a-fA-F]{24}$" } : { type: "string" };
      case "Int":
        return { type: "integer" };
      case "Upload":
        return { type: "string", format: "binary" };
      case "Binary":
        return { type: "string", contentEncoding: "base64" };
      case "Any":
        return {};
      default:
        return { type: "string" };
    }
  }

  static #inlineEnum(values: unknown[]): JsonSchema {
    return {
      type: values.every((value) => typeof value === "number") ? "number" : "string",
      enum: values,
    };
  }

  static #arrayed(schema: JsonSchema, arrDepth: number): JsonSchema {
    let current = schema;
    for (let idx = 0; idx < arrDepth; idx++) current = { type: "array", items: current };
    return current;
  }

  #nullable(schema: JsonSchema, nullable: boolean): JsonSchema {
    if (!nullable) return schema;
    // A `$ref` has no type to merge into, and an `enum` must list `null` too or it still refuses the value.
    if (this.#nullableForm === "type" && typeof schema.type === "string" && !("$ref" in schema)) {
      const merged = { ...schema, type: [schema.type, "null"] };
      return Array.isArray(schema.enum) ? { ...merged, enum: [...schema.enum, null] } : merged;
    }
    return { anyOf: [schema, { type: "null" }] };
  }
}
