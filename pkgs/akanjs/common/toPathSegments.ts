type PathSegment = string | number;

/** `a.0.b` and `a[0].b` are the same segments, for writes and reads alike. */
export const toPathSegments = (path: string | readonly PathSegment[]) =>
  Array.isArray(path) ? [...path] : path.toString().match(/[^.[\]]+/g) || [];
