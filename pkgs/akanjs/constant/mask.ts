import { type Cls, FIELD_META, getNonArrayModel, type PrimitiveAgentFace, PrimitiveRegistry } from "akanjs/base";

/** Structural rather than `ConstantModelRef`, so anything holding the class can name it; read through `FIELD_META`. */
export interface MaskModel {
  name: string;
}

// Mirrors what `resolveReturn` branches over.
interface MaskField {
  fieldType?: string;
  isClass?: boolean;
  isMap?: boolean;
  modelRef?: MaskModel;
  of?: unknown;
  arrDepth?: number;
  visual?: boolean;
}

export const maskFieldsOf = (model: MaskModel): Record<string, MaskField> | null => {
  const fields = (model as unknown as { [key: symbol]: unknown })[FIELD_META];
  return fields && typeof fields === "object" ? (fields as Record<string, MaskField>) : null;
};

/** The `hidden`/`secret` fields `value` still carries; `visual` is cost, not secrecy, so it never counts as a leak. */
export const leakingFieldsOf = (model: MaskModel, value: Record<string, unknown>): string[] => {
  const fields = maskFieldsOf(model);
  if (!fields) return [];
  return Object.entries(fields)
    .filter(([key, field]) => (field.fieldType === "hidden" || field.fieldType === "secret") && key in value)
    .map(([key]) => key);
};

/**
 * Drops `hidden`, `secret` and `visual` fields for every AI-facing read, by the model named rather than the value's
 * class, so a spread or JSON copy masks the same; unlike `resolveReturn` it loads no relation.
 */
export const mask = (model: MaskModel, value: unknown): unknown => {
  if (value === null || value === undefined || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((item: unknown) => mask(model, item));
  const fields = maskFieldsOf(model);
  if (!fields) return value;
  const source = value as Record<string, unknown>;
  const masked: Record<string, unknown> = {};
  for (const [key, field] of Object.entries(fields)) {
    if (field.fieldType === "hidden" || field.fieldType === "secret" || field.visual || !(key in source)) continue;
    masked[key] = maskField(field, source[key]);
  }
  return masked;
};

/** The primitive's `agent.read` through `arrDepth` array levels when it declares an agent face; the value otherwise. */
export const agentRead = (modelRef: unknown, value: unknown, arrDepth = 0): unknown => {
  const face = PrimitiveRegistry.agentOf(modelRef);
  return face ? readThrough(face, value, arrDepth) : value;
};

const readThrough = (face: PrimitiveAgentFace, value: unknown, arrDepth: number): unknown => {
  if (value === null || value === undefined) return value;
  if (arrDepth > 0 && Array.isArray(value)) return value.map((item) => readThrough(face, item, arrDepth - 1));
  return face.read(value);
};

const maskField = (field: MaskField, value: unknown): unknown => {
  if (field.isClass && field.modelRef) return mask(field.modelRef, value);
  if (field.isMap) return maskMapValues(field.of, value);
  return agentRead(field.modelRef, value, field.arrDepth ?? 0);
};

// A hydrated `Map` or a wire object both leave as a plain object, the only form that survives `JSON.stringify`.
const maskMapValues = (of: unknown, value: unknown): unknown => {
  const [valueRef, arrDepth] = getNonArrayModel(of as Cls);
  if (!PrimitiveRegistry.agentOf(valueRef) || value === null || typeof value !== "object") return value;
  const entries = value instanceof Map ? [...value.entries()] : Object.entries(value);
  return Object.fromEntries(entries.map(([key, item]) => [key, agentRead(valueRef, item, arrDepth)]));
};

/**
 * Drops only `hidden`/`secret`, for a saved form draft: `visual` is the user's work and a key the metadata does not
 * name (`id`) must survive. `for...in` because Date fields are enumerable prototype accessors.
 */
export const stripSecrets = (model: MaskModel, value: unknown): unknown => {
  if (value === null || value === undefined || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((item: unknown) => stripSecrets(model, item));
  const fields = maskFieldsOf(model);
  if (!fields) return value;
  const source = value as Record<string, unknown>;
  const stripped: Record<string, unknown> = {};
  for (const key in source) {
    const field = fields[key];
    if (field?.fieldType === "hidden" || field?.fieldType === "secret") continue;
    stripped[key] = field?.isClass && field.modelRef ? stripSecrets(field.modelRef, source[key]) : source[key];
  }
  return stripped;
};
