import { DEFAULT_VALUE, FIELD_META, type PrimitiveScalar } from "akanjs/base";
import type { FieldObject } from ".";
import type { DefaultOf } from "./types";

export interface DefaultPlan {
  /** Fields whose default is a value that can be shared: a primitive, `null`, or the field's own literal. */
  shared: Record<string, unknown>;
  /** Fields that have to be produced per call — a thunk, a fresh array, or a nested scalar record. */
  perCall: Map<string, () => unknown>;
}

// Keyed on the FIELD_META object a model owns, so one entry per model rather than per call. `via()` memoizes the
// finished record per class already; the database adaptor does not, and reached this per nested scalar value per
// row (`decodeNestedValue`, `fillScalarDefaults`).
const planCache = new WeakMap<FieldObject, DefaultPlan>();

/**
 * The split is what keeps this faithful: `default: () => dayjs()` still means "now" on every call, and an array
 * or nested-scalar default is still a fresh object, so two documents filled from the same model never end up
 * sharing one. Only values that were already shared before this cache existed live in `shared`.
 */
export const getDefault = <T>(fieldObj: FieldObject): DefaultOf<T> => {
  const plan = defaultPlanOf(fieldObj);
  const result: Record<string, unknown> = { ...plan.shared };
  for (const [key, make] of plan.perCall) result[key] = make();
  return result as DefaultOf<T>;
};

/** The per-field default rules, split as above; `HydrationPlan` reads them per field so a present value skips its thunk. */
export const defaultPlanOf = (fieldObj: FieldObject): DefaultPlan => {
  const cached = planCache.get(fieldObj);
  if (cached) return cached;
  const plan = buildPlan(fieldObj);
  planCache.set(fieldObj, plan);
  return plan;
};

const buildPlan = (fieldObj: FieldObject): DefaultPlan => {
  const shared: Record<string, unknown> = {};
  const perCall = new Map<string, () => unknown>();
  for (const [key, field] of Object.entries(fieldObj)) {
    if (field.fieldType === "hidden" || field.fieldType === "secret") shared[key] = null;
    else if (field.default !== undefined && field.default !== null) {
      if (typeof field.default === "function") perCall.set(key, field.default as () => unknown);
      // A literal default is the field's own object, handed out by reference before this cache existed too.
      else shared[key] = field.default as object;
    } else if (field.isArray) perCall.set(key, () => []);
    else if (field.nullable) shared[key] = null;
    else if (field.isClass) {
      if (field.isScalar) perCall.set(key, () => getDefault(field.modelRef[FIELD_META]));
      else shared[key] = null;
    } else shared[key] = (field.modelRef as unknown as typeof PrimitiveScalar)[DEFAULT_VALUE];
  }
  return { shared, perCall };
};
