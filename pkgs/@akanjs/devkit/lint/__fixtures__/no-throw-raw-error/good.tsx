export const throwsErr = () => { throw new Err("ticket.error.notFound"); }; // @ok
export const throwsASubclass = () => { throw new HttpError("boom"); }; // @ok
export const constructsWithoutThrowing = () => new Error("boom"); // @ok
export const rethrowsACaught = () => { try { run(); } catch (error) { throw error; } }; // @ok
