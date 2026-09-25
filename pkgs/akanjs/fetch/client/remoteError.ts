export interface ErrorResponsePayload {
  error: string;
  statusCode?: number;
  data?: Record<string, unknown>;
  details?: unknown;
  path?: string;
  timestamp?: string;
}

export interface RestoredError extends Error {
  error?: string;
  statusCode?: number;
  data?: unknown;
  details?: unknown;
  path?: string;
  timestamp?: string;
  toJSON?: () => ErrorResponsePayload;
}

export interface ErrorConstructor {
  fromJSON: (payload: ErrorResponsePayload) => RestoredError;
}

/**
 * Rebuilds what a remote process reported: the caller's own `Err` when this client was given one, and a
 * duck-typed `Error` carrying the same payload otherwise.
 *
 * The `toJSON` is what makes the second case rethrowable. A server process that calls another with `{ origin }`
 * and lets the failure propagate is answered by `SignalContext.try`, which forwards a payload only when the
 * thrown value carries both `statusCode` and `toJSON`; anything else is this repo's own bug and is generalized
 * to `Internal Server Error`. Without it the hop loses the dictionary key and its data, and the browser toasts
 * the generalization instead of the sentence the remote endpoint chose.
 */
export const restoreRemoteError = (
  body: unknown,
  fallbackStatusCode: number,
  ErrorCls?: ErrorConstructor,
): RestoredError => {
  const payload =
    body && typeof body === "object" && "error" in body
      ? ({ statusCode: fallbackStatusCode, ...(body as Record<string, unknown>) } as ErrorResponsePayload)
      : ({ error: String(body), statusCode: fallbackStatusCode } satisfies ErrorResponsePayload);
  if (ErrorCls) return ErrorCls.fromJSON(payload);
  const error = new Error(payload.error) as RestoredError;
  Object.assign(error, payload);
  // Only the fields the wire declares: an extra key a transport put on the frame is not part of the error.
  const json: ErrorResponsePayload = {
    error: payload.error,
    statusCode: payload.statusCode ?? fallbackStatusCode,
    ...(payload.details !== undefined ? { details: payload.details } : {}),
    ...(payload.data !== undefined ? { data: payload.data } : {}),
    ...(payload.path !== undefined ? { path: payload.path } : {}),
    ...(payload.timestamp !== undefined ? { timestamp: payload.timestamp } : {}),
  };
  error.toJSON = () => json;
  return error;
};
