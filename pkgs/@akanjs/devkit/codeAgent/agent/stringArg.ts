export const stringArg = (args: unknown, key: "path" | "command") => {
  if (!args || typeof args !== "object") return undefined;
  const value = (args as Record<string, unknown>)[key];
  return typeof value === "string" && value ? value : undefined;
};
