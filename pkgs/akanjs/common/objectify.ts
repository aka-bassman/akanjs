import { isDayjs } from "./isDayjs";

export const objectify = <T extends object>(obj: T, keys = Object.keys(obj) as (keyof T)[]): Partial<T> => {
  const val: Partial<T> = {};
  keys.forEach((key) => {
    if (typeof obj[key] !== "function") val[key] = obj[key];
  });
  return val;
};

// `for...in`: an Akan model keeps its Date fields as enumerable prototype accessors that `Object.keys` never reaches.
export const plainFieldsOf = (source: object): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  for (const key in source) {
    const value = (source as Record<string, unknown>)[key];
    if (typeof value !== "function") out[key] = value;
  }
  return out;
};

interface DeepObjectifyOption {
  serializable?: boolean;
  convertDate?: "string" | "number";
}

const objectifyChild = (value: unknown, option: DeepObjectifyOption): unknown => {
  const modelValue = value as { __ModelType__?: string } | null | undefined;
  return modelValue?.__ModelType__ && !option.serializable ? value : deepObjectify(value, option);
};

export const deepObjectify = <T = unknown>(obj: T | null | undefined, option: DeepObjectifyOption = {}): T => {
  if (isDayjs(obj) || obj?.constructor === Date) {
    if (!option.serializable && !option.convertDate) return obj as T;
    if (option.convertDate === "string") return obj.toISOString() as T;
    else if (option.convertDate === "number")
      return (isDayjs(obj) ? obj.toDate().getTime() : (obj as Date).getTime()) as T;
    else return (isDayjs(obj) ? obj.toDate() : obj) as T;
  } else if (Array.isArray(obj)) {
    return obj.map((o: unknown) => deepObjectify(o, option)) as T;
  } else if (obj instanceof Map) {
    // Map entries are not own enumerable keys, so the plain-object branch below copies a populated Map to `{}`.
    const entries = [...obj.entries()].map(
      ([key, value]: [string, unknown]) => [key, objectifyChild(value, option)] as const,
    );
    return (option.serializable ? Object.fromEntries(entries) : new Map(entries)) as T;
  } else if (obj instanceof Set) {
    const values = [...obj.values()].map((value: unknown) => objectifyChild(value, option));
    return (option.serializable ? values : new Set(values)) as T;
  } else if (obj && typeof obj === "object") {
    const val: Record<string, unknown> = {};
    const objRecord = obj as Record<string, unknown>;
    // `for...in`, not `Object.keys`: an Akan model keeps its Date fields as enumerable prototype accessors.
    for (const key in objRecord) {
      if (typeof objRecord[key] !== "function") val[key] = objectifyChild(objRecord[key], option);
    }
    return val as T;
  } else {
    return obj as unknown as T;
  }
};
