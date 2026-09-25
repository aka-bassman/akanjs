export const throwsNewError = () => { throw new Error("boom"); }; // @flag
export const throwsBareError = () => { throw Error("boom"); }; // @flag
export const throwsWithCause = () => { throw new Error("boom", { cause: reason }); }; // @flag
export const throwsWithNoArgument = () => { throw new Error(); }; // @flag
