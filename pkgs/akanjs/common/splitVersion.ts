export const splitVersion = (version: string) => {
  const [major, minor, patch] = version.split(".");
  if (!major || !minor || !patch) throw new Error("Invalid version");
  return { major, minor, patch };
};
