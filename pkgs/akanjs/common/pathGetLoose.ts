type Indexable = Record<string, unknown>;

const isIndexable = (value: unknown): value is Indexable => Object(value) === value;

/** Also tries joined prefixes, for keys whose segments contain the separator (an enum value like `gpt-5.6-terra`). */
export const pathGetLoose = (
  path: string | readonly string[],
  obj: unknown,
  separator = ".",
  fallback: unknown = null,
): unknown => {
  const walk = (node: unknown, rest: readonly string[]): unknown => {
    if (!rest.length) return node;
    if (!isIndexable(node)) return undefined;
    // Shortest prefix first, so every path that resolves under a plain segment-by-segment walk resolves the same way.
    for (let take = 1; take <= rest.length; take += 1) {
      const child = node[rest.slice(0, take).join(separator)];
      if (child === undefined) continue;
      const found = walk(child, rest.slice(take));
      if (found !== undefined) return found;
    }
    return undefined;
  };
  return walk(obj, Array.isArray(path) ? [...path] : (path as string).split(separator)) ?? fallback;
};
