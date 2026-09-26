import {
  type CLIENT_VALUE,
  type Cls,
  type Dayjs,
  dayjs,
  type EnumInstance,
  type FIELD_META,
  type GetStateObject,
  isEnum,
  PrimitiveRegistry,
  type PrimitiveScalar,
  type UnCls,
} from "akanjs/base";
import { agentRead, type ConstantModelRef, type MaskModel, mask, maskFieldsOf } from "akanjs/constant";

// biome-ignore lint/suspicious/noExplicitAny: enum values are arbitrary string/number literal unions.
type AgentSingleType = typeof PrimitiveScalar | EnumInstance<string, any> | ConstantModelRef;

/** A scalar, an enum, or a model — or one array level of one. */
export type AgentFieldType = AgentSingleType | AgentSingleType[];

// `refName` is matched before `FIELD_META`: `via.ts` gives the global String/Boolean/Date/Map field metadata too.
export type AgentValueOf<T> = T extends readonly (infer F)[]
  ? AgentValueOf<F>[]
  : T extends { refName: "Any" }
    ? unknown
    : T extends EnumInstance<string, infer V>
      ? V
      : T extends DateConstructor
        ? Dayjs | Date | string
        : T extends { refName: string; [CLIENT_VALUE]: infer V }
          ? V
          : T extends { [FIELD_META]: unknown }
            ? GetStateObject<UnCls<T>>
            : T extends { [CLIENT_VALUE]: infer V }
              ? V
              : unknown;

type ValueKind = "any" | "date" | "scalar" | "agent" | "enum" | "model";

/** Renders a value by its declared type: a model masks, a Date is ISO, an agent-faced primitive reads, Any passes. */
export class AgentValue {
  static serialize(type: AgentFieldType, value: unknown): unknown {
    const single = Array.isArray(type) ? type[0] : type;
    if (Array.isArray(type) && Array.isArray(value)) return value.map((item) => AgentValue.#one(single, item));
    return AgentValue.#one(single, value);
  }

  /** Logs and returns false for an unreadable type; throwing would cost the route its server render. */
  static publishable(owner: string, type: AgentFieldType): boolean {
    try {
      AgentValue.#kindOf(Array.isArray(type) ? type[0] : type);
      return true;
    } catch (error) {
      console.error(`${owner} is not published: its type is ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  static #one(type: AgentSingleType, value: unknown): unknown {
    if (value === null || value === undefined) return value;
    switch (AgentValue.#kindOf(type)) {
      case "date": {
        const parsed = dayjs(value as string | number | Date);
        return parsed.isValid() ? parsed.toISOString() : null;
      }
      case "agent":
        return agentRead(type, value);
      case "model":
        return mask(type as MaskModel, value);
      default:
        return value;
    }
  }

  static #kindOf(type: AgentSingleType): ValueKind {
    if (isEnum(type as Cls)) return "enum";
    if (PrimitiveRegistry.agentOf(type)) return "agent";
    if (PrimitiveRegistry.has(type as unknown as Cls)) {
      const refName = PrimitiveRegistry.getName(type as typeof PrimitiveScalar);
      switch (refName) {
        case "Any":
          return "any";
        case "Date":
          return "date";
        case "ID":
        case "String":
        case "Int":
        case "Float":
        case "Boolean":
          return "scalar";
        default:
          throw new Error(`the scalar ${refName}, which an agent cannot read: it declares no \`agent\` face.`);
      }
    }
    if (maskFieldsOf(type as MaskModel)) return "model";
    throw new Error(`${AgentValue.#typeName(type)}, and a readable value is a scalar, an enum, a model, or Any.`);
  }

  static #typeName(type: AgentSingleType): string {
    const named = type as { name?: string } | null | undefined;
    return named?.name ? `the type ${named.name}` : `${String(type)}`;
  }
}
