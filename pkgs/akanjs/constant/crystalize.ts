import {
  applyFnToArrayObjects,
  type Cls,
  dayjs,
  type GetStateObject,
  PrimitiveRegistry,
  type PrimitiveScalar,
} from "akanjs/base";

import type { FieldProps } from ".";

export type CrystalizeFunc<Model> = (self: GetStateObject<Model>, isChild?: boolean) => Model;

/**
 * The relation instances one hydration pass has already built, by model class and then document id.
 *
 * A listing hands the same relation to every row that references it — twenty users wearing one avatar — and
 * each row would otherwise build its own copy of it, re-parsing every `Date` on the way. Sharing is safe
 * because a constant model is `[immerable]`: a store write copies before it mutates.
 *
 * Module-scoped rather than passed down, because `crystalize` is reached through a model's own constructor,
 * which has nowhere to carry it. A pass is wholly synchronous, so no other one can observe this mid-flight.
 */
let sharedInstances: Map<Cls, Map<string, object>> | null = null;

/** Runs one hydration pass, sharing a relation instance across every value in it that names the same id. */
export const withSharedInstances = <T>(hydrate: () => T): T => {
  if (sharedInstances) return hydrate();
  sharedInstances = new Map();
  try {
    return hydrate();
  } finally {
    sharedInstances = null;
  }
};

type ModelCls = Cls<{ set: (obj: object) => object }>;

const relationIdOf = (value: object): string | null => {
  const id = (value as { id?: unknown }).id;
  return typeof id === "string" && id ? id : null;
};

const crystalizeModel = (field: FieldProps, value: object): object => {
  const modelRef = field.modelRef as ModelCls;
  // Already one of these — a shared relation coming back around, or a model handed straight to `set()`. Copying
  // it would only produce a value equal to the one in hand.
  if (value instanceof modelRef) return value;
  // Only a relation has a document identity to share on; an embedded scalar's `id`, where it has one, names
  // whatever the scalar wanted it to.
  const id = field.isScalar ? null : relationIdOf(value);
  if (!sharedInstances || !id) return new modelRef().set(value);
  const byId = sharedInstances.get(modelRef) ?? new Map<string, object>();
  if (!sharedInstances.has(modelRef)) sharedInstances.set(modelRef, byId);
  const shared = byId.get(id) ?? new modelRef().set(value);
  byId.set(id, shared);
  return shared;
};

export const crystalize = (field: FieldProps, value: unknown): unknown => {
  if (value === undefined || value === null) return value as undefined | null;
  if (field.isArray && Array.isArray(value))
    return value.map((v: unknown) =>
      crystalize({ ...field, isArray: field.arrDepth > 1, arrDepth: field.arrDepth - 1 }, v),
    );
  const crystalizeValue = PrimitiveRegistry.has(field.modelRef)
    ? (value: unknown) => (field.modelRef as unknown as typeof PrimitiveScalar)._parse(value as never)
    : (value: unknown) => value as object;
  if (field.isMap) {
    const mapValueField = {
      ...field,
      modelRef: field.of ?? field.modelRef,
      isMap: false,
      isClass: !!field.of && !PrimitiveRegistry.has(field.of),
      isScalar: !!field.of && PrimitiveRegistry.has(field.of),
      isArray: false,
      arrDepth: 0,
    };
    // An already-crystalized value arrives as a Map, whose entries are not own enumerable keys.
    const entries = value instanceof Map ? [...value.entries()] : Object.entries(value as Record<string, unknown>);
    return new Map(
      entries.map(([key, val]: [string, unknown]) => [
        key,
        field.of
          ? applyFnToArrayObjects(val, (v: never) => crystalize(mapValueField, v))
          : applyFnToArrayObjects(val, crystalizeValue),
      ]),
    );
  }
  if (field.isClass) return crystalizeModel(field, value as object);
  if (field.modelRef === Date) return dayjs(value as Date);
  return crystalizeValue(value);
};
