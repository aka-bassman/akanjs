export const throwsErr = () => { throw new Err("ticket.error.notFound"); }; // @ok
export const rejectsWithErr = () => Promise.reject(new Err("ticket.error.notFound")); // @ok
export const throwsASubclass = () => { throw new HttpError("boom"); }; // @ok
export const rethrowsACaught = () => { try { run(); } catch (error) { throw error; } }; // @ok
export const narrowsAnError = (value: unknown) => value instanceof Error; // @ok
export const readsAnAttachedField = (error: Error & { stderr: string }) => error.stderr; // @ok
export const capturesAStack = (target: object) => Error.captureStackTrace(target); // @ok
export const callsAMethodNamedError = () => logger.Error("boom"); // @ok
export const quotesTheRule = () => "throw new Error('boom')"; // @ok
export const DocumentsTheRule = () => <code>new Error</code>; // @ok
export const DocumentsTheCallForm = () => <code>Error("boom")</code>; // @ok
