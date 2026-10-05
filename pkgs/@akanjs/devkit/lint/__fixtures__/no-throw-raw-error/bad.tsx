export const throwsNewError = () => { throw new Error("boom"); }; // @flag
export const throwsBareError = () => { throw Error("boom"); }; // @flag
export const throwsWithCause = () => { throw new Error("boom", { cause: reason }); }; // @flag
export const throwsWithNoArgument = () => { throw new Error(); }; // @flag
export const throwsWithoutParens = () => { throw new Error; }; // @flag
export const rejectsInAPromise = () => new Promise((_, reject) => reject(new Error(`k8s ${path} failed`))); // @flag
export const rejectsDirectly = () => Promise.reject(new Error("boom")); // @flag
export const throwsAStoredError = () => { const error = new Error("boom"); throw error; }; // @flag
export const returnsAnError = () => { return new Error("boom"); }; // @flag
export const callsWithoutNew = () => Error("boom"); // @flag
