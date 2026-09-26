/**
 * A `pick` or `get` that matched nothing, so a caller can tell a missing document from a failure. Callers match on
 * the message; `statusCode` does not reach HTTP (`isExceptionLike` also wants a `toJSON`), where it stays a 500.
 */
export class NoDocumentError extends Error {
  readonly statusCode = 404;
}
