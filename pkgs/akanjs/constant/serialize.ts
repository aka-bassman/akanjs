import {
  Any,
  applyFnToArrayObjects,
  type Cls,
  type Dayjs,
  type EnumInstance,
  FIELD_META,
  getNonArrayModel,
  ID,
  PrimitiveRegistry,
  type PrimitiveScalar,
} from "akanjs/base";

import { type ConstantCls, type ConstantModelRef, ConstantRegistry, type FieldProps, withSharedInstances } from ".";

export type Serialized<O> = O extends (infer V)[]
  ? Serialized<V>[]
  : O extends Dayjs
    ? Date
    : O extends Map<infer K, infer V>
      ? { [key in K & string]: Serialized<V> }
      : O extends object
        ? { [K in keyof O]: Serialized<O[K]> }
        : O;

const getSerializeFn = (inputRef: Cls, { optional = false }: { optional?: boolean } = {}) =>
  PrimitiveRegistry.has(inputRef)
    ? (value: unknown) => (inputRef as typeof PrimitiveScalar)._serialize(value as never, { optional })
    : (value: unknown) => value as object;
const serializeInput = <Input = unknown>(
  value: Input | Input[],
  inputRef: ConstantModelRef<Input> | PrimitiveScalar,
  arrDepth: number,
  serializeType: "input" | "object" = "object",
  { optional = false }: { optional?: boolean } = {},
): Input | Input[] => {
  if (arrDepth && Array.isArray(value))
    return value.map((v) => serializeInput(v, inputRef, arrDepth - 1, serializeType) as Input) as unknown as Input[];
  else if ((inputRef as MapConstructor).prototype === Map.prototype) {
    const [valueRef] = getNonArrayModel(inputRef as Cls);
    const serializeFn = getSerializeFn(valueRef, { optional });
    return Object.fromEntries(
      [...(value as Map<string, unknown>).entries()].map(([key, val]) => [
        key,
        applyFnToArrayObjects(val, serializeFn),
      ]),
    ) as unknown as Input;
  } else if (PrimitiveRegistry.has(inputRef as Cls)) {
    const serializeFn = getSerializeFn(inputRef as Cls, { optional });
    return serializeFn(value) as Input;
  } else {
    const modelRef = inputRef as ConstantCls;
    return Object.fromEntries(
      Object.entries(modelRef[FIELD_META]).map(([key, field]) => [
        key,
        serializeType === "input" && field.isClass && !field.isScalar
          ? serialize(ID, field.arrDepth, getRelationId((value as Record<string, unknown>)?.[key]), serializeType, {
              nullable: field.nullable,
              key,
            })
          : serialize(field.modelRef, field.arrDepth, (value as Record<string, unknown>)?.[key], serializeType, {
              nullable: field.nullable,
              key,
            }),
      ]),
    ) as unknown as Input;
  }
};

const getRelationId = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map((item) => getRelationId(item));
  if (value && typeof value === "object" && "id" in value) return (value as { id: unknown }).id;
  return value;
};

export const serialize = (
  argRef: ConstantModelRef | PrimitiveScalar,
  arrDepth: number,
  value: unknown,
  serializeType: "input" | "object" = "object",
  { nullable = false, key }: { nullable?: boolean; key?: string },
) => {
  if (nullable && (value === null || value === undefined)) return null;
  else if (!nullable && (value === null || value === undefined) && argRef !== Any)
    throw new Error(`Invalid Value (Nullable) in ${argRef} for value ${value}${key ? ` in ${key}` : ""}`);
  return serializeInput(value, argRef, arrDepth, serializeType, { optional: nullable }) as object[];
};

const getDeserializeFn = (inputRef: ConstantModelRef | PrimitiveScalar) =>
  PrimitiveRegistry.has(inputRef as Cls)
    ? (value: unknown) => (inputRef as unknown as typeof PrimitiveScalar)._parse(value as never)
    : (value: unknown) => value as object;
const deserializeMap = (value: unknown, field: Pick<FieldProps, "of">) => {
  if (!field.of) return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, val]) => [
      key,
      applyFnToArrayObjects(val, (v: never) => deserializeInput(v, field.of as ConstantModelRef, 0)),
    ]),
  );
};

const deserializeInput = <Input = unknown>(
  value: Input | Input[],
  inputRef: ConstantModelRef<Input> | PrimitiveScalar,
  arrDepth: number,
  convertFn: (value: unknown) => unknown = (value: unknown) => value,
): Input | Input[] => {
  if (arrDepth && Array.isArray(value))
    return value.map((v) => deserializeInput(v, inputRef, arrDepth - 1, convertFn) as Input) as unknown as Input[];
  if ((inputRef as ConstantCls).prototype === Map.prototype) {
    const deserializeFn = getDeserializeFn(inputRef);
    const entries = value instanceof Map ? [...value.entries()] : Object.entries(value as Record<string, unknown>);
    return convertFn(
      Object.fromEntries(entries.map(([key, val]) => [key, applyFnToArrayObjects(val, deserializeFn)])),
    ) as Input;
  }
  if (PrimitiveRegistry.has(inputRef as Cls)) return convertFn(getDeserializeFn(inputRef)(value)) as Input;
  if (!ConstantRegistry.isScalar(inputRef as Cls)) return convertFn(value) as Input;
  return convertFn(
    Object.fromEntries(
      Object.entries((inputRef as ConstantCls)[FIELD_META]).map(([key, field]) => [
        key,
        field.isMap
          ? deserializeMap((value as Record<string, unknown>)[key], field.getProps())
          : deserialize(field.modelRef, field.arrDepth, (value as Record<string, unknown>)[key], {
              key,
              nullable: field.nullable,
              enum: field.enum,
            }),
      ]),
    ),
  ) as Input;
};

interface DeserializeOption {
  key?: string;
  nullable?: boolean;
  convertFn?: (value: unknown) => unknown;
  enum?: EnumInstance;
}

// An `enumOf` erases to its `type` in every `argRef` and `modelRef`, so the parser accepts any string the schema
// said could not exist; the enum handed alongside is the only thing left that can refuse the value.
const assertEnumValue = (enumRef: EnumInstance, value: unknown, key?: string): void => {
  if (Array.isArray(value)) {
    for (const item of value) assertEnumValue(enumRef, item, key);
    return;
  }
  if (value === null || value === undefined || enumRef.has(value as never)) return;
  throw new Error(`Invalid Enum Value in ${key}: ${String(value)} is not one of ${enumRef.values.join(", ")}`);
};

export const deserialize = (
  argRef: ConstantModelRef | PrimitiveScalar,
  arrDepth: number,
  value: unknown,
  { key, nullable = false, convertFn, enum: enumRef }: DeserializeOption,
) => {
  if (nullable && (value === null || value === undefined)) return null;
  else if (!nullable && (value === null || value === undefined) && argRef !== Any)
    throw new Error(`Invalid Value (Nullable) in ${key} ${argRef} for value ${value}`);
  // One response is one pass, so a relation repeated across its rows is built once. Nested `deserialize` calls
  // join the pass their caller opened rather than starting one of their own.
  const result = withSharedInstances(() => deserializeInput(value, argRef, arrDepth, convertFn)) as object[];
  if (enumRef) assertEnumValue(enumRef, result, key);
  return result;
};
