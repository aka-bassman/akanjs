import { toPathSegments } from "./toPathSegments";

type Indexable = Record<string | number, unknown>;
type PathSegment = string | number;

const isIndexable = (value: unknown): value is Indexable => Object(value) === value;

// A `field(Map, …)` value holds its entries outside its own keys, so bracket access reads a stray property rather
// than an entry — the same reason `pathSet` writes one through `Map.set`.
const readChild = (container: Indexable, key: PathSegment) =>
  container instanceof Map ? (container as Map<PathSegment, unknown>).get(key) : container[key];

export const pathGet = (
  path: string | (string | number)[],
  obj: unknown,
  separator = ".",
  fallback: unknown = null,
): unknown => {
  // Bracket notation belongs to the dotted vocabulary only: under any other separator a `[0]` is part of a key
  // rather than an index, so a caller that named its own separator keeps the plain split it has always had.
  const properties = separator === "." ? toPathSegments(path) : Array.isArray(path) ? [...path] : path.split(separator);
  return properties.reduce<unknown>(
    (prev, curr) => (isIndexable(prev) ? (readChild(prev, curr) ?? fallback) : fallback),
    obj,
  );
};
