// `for...in`: an Akan model keeps its Date fields as enumerable prototype accessors that `Object.keys` never reaches.
export const plainFieldsOf = (source: object): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  for (const key in source) {
    const value = (source as Record<string, unknown>)[key];
    if (typeof value !== "function") out[key] = value;
  }
  return out;
};
