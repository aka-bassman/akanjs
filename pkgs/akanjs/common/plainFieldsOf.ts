/**
 * Own and inherited enumerable data of an object as a plain record. An Akan model keeps its Date fields as
 * enumerable prototype accessors, which `Object.keys` and a spread never reach; methods are non-enumerable and stay
 * out either way.
 */
export const plainFieldsOf = (source: object): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  for (const key in source) {
    const value = (source as Record<string, unknown>)[key];
    if (typeof value !== "function") out[key] = value;
  }
  return out;
};
