// `major.minor` is the build released to the app stores; `patch` is the code-push (framework) version.
export const mergeVersion = (major: number, minor: number, patch: number) => `${major}.${minor}.${patch}`;
