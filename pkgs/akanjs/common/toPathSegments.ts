type PathSegment = string | number;

/**
 * The one definition of what a dotted path's segments are, so a path that writes and a path that reads cannot
 * disagree about it. `a.0.b` and `a[0].b` are the same three segments — the bracket form is what a form field
 * hands `writeOn<Model>`, and a read of the same path has to accept the same spelling or the agent can write
 * somewhere it cannot read back.
 */
export const toPathSegments = (path: string | readonly PathSegment[]) =>
  Array.isArray(path) ? [...path] : path.toString().match(/[^.[\]]+/g) || [];
