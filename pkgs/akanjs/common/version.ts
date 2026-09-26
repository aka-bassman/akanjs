// `major.minor` is the build released to the app stores; `patch` is the code-push (framework) version.
export const mergeVersion = (major: number, minor: number, patch: number) => `${major}.${minor}.${patch}`;

export const splitVersion = (version: string) => {
  const [major, minor, patch] = version.split(".");
  if (!major || !minor || !patch) throw new Error("Invalid version");
  return { major, minor, patch };
};
