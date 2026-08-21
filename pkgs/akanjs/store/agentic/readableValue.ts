import { type MaskModel, mask } from "akanjs/constant";

const isPlainAgentValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return true;
  if (Array.isArray(value)) return value.every((item) => isPlainAgentValue(item));
  if (value instanceof Date) return true;
  return typeof value !== "object";
};

/** What `AgentBridge.read` does for store keys, for a hook's value: mask by the declared model, pass scalars, refuse the rest. */
export const readableValue = (name: string, value: unknown, model?: MaskModel): unknown => {
  if (model) return mask(model, value);
  if (isPlainAgentValue(value)) return value;
  throw new Error(
    `State "${name}" holds an object that belongs to no model, so there is nothing to mask it by and it is not published. Declare mask: or serialize: on it.`,
  );
};
