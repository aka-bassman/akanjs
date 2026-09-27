import { FIELD_META } from "akanjs/base";
import { ConstantRegistry } from "./constantRegistry";
import type { FieldObject } from "./fieldInfo";

/** The query a field's value counts, declared with `.meta(...)`; read structurally, so any builder can produce it. */
export interface FieldQueryMeta {
  refName: string;
  /** One of that model's declared filter keys. */
  queryKey: string | null;
  /** A thunk is read when the query is applied, so an arg relative to now stays current. */
  queryArgs?: unknown[] | (() => unknown[]);
}

const isFieldQueryMeta = (meta: unknown): meta is FieldQueryMeta => {
  if (!meta || typeof meta !== "object") return false;
  const { refName, queryKey, queryArgs } = meta as Record<string, unknown>;
  if (typeof refName !== "string" || !refName) return false;
  if (queryKey !== null && typeof queryKey !== "string") return false;
  return queryArgs === undefined || Array.isArray(queryArgs) || typeof queryArgs === "function";
};

export const fieldQueryMetaOf = (refName: string, field: string): FieldQueryMeta | undefined => {
  const cnst = ConstantRegistry.getDatabase(refName, { allowEmpty: true });
  const fieldMap = cnst?.full[FIELD_META] as FieldObject | undefined;
  const meta = fieldMap?.[field]?.meta;
  return isFieldQueryMeta(meta) ? meta : undefined;
};
