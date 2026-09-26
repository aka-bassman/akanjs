type PathSegment = string | number;
type Indexable = Record<PathSegment, unknown>;
type Container = Indexable | Map<PathSegment, unknown>;

export const isIndexable = (value: unknown): value is Indexable => Object(value) === value;

// A `field(Map, …)` value holds entries outside its keys: bracket access would touch a stray property immer drops.
const readChild = (container: Container, key: PathSegment) =>
  container instanceof Map ? container.get(key) : container[key];

const writeChild = (container: Container, key: PathSegment, value: unknown) => {
  if (container instanceof Map) container.set(key, value);
  else container[key] = value;
};

/** `a.0.b` and `a[0].b` are the same segments, for writes and reads alike. */
export const toPathSegments = (path: string | readonly PathSegment[]) =>
  Array.isArray(path) ? [...path] : path.toString().match(/[^.[\]]+/g) || [];

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

export const pathSet = <T>(obj: T, path: string | readonly PathSegment[], value: unknown): T => {
  if (Object(obj) !== obj) return obj;
  const pathSegments = toPathSegments(path);
  const parent = pathSegments.slice(0, -1).reduce<Container>((a, c, i) => {
    const child = readChild(a, c);
    if (Object(child) === child) return child as Container;
    const created = Math.abs(Number(pathSegments[i + 1])) >> 0 === +pathSegments[i + 1] ? [] : {};
    writeChild(a, c, created);
    return created as unknown as Container;
  }, obj as Container);
  writeChild(parent, pathSegments[pathSegments.length - 1], value);
  return obj;
};
