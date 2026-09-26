import { toPathSegments } from "./toPathSegments";

type Indexable = Record<string | number, unknown>;
type PathSegment = string | number;

const isIndexable = (value: unknown): value is Indexable => Object(value) === value;

// A `field(Map, …)` value holds entries outside its keys, so bracket access would read a stray property.
const readChild = (container: Indexable, key: PathSegment) =>
  container instanceof Map ? (container as Map<PathSegment, unknown>).get(key) : container[key];

export const pathGet = (
  path: string | (string | number)[],
  obj: unknown,
  separator = ".",
  fallback: unknown = null,
): unknown => {
  // Under a custom separator a `[0]` is part of a key rather than an index, so only `.` gets bracket parsing.
  const properties = separator === "." ? toPathSegments(path) : Array.isArray(path) ? [...path] : path.split(separator);
  return properties.reduce<unknown>(
    (prev, curr) => (isIndexable(prev) ? (readChild(prev, curr) ?? fallback) : fallback),
    obj,
  );
};
