/**
 * The one line a human scans for, derived from what the model already declared: the `text: "title"` search role
 * names exactly that field, so an agent-facing label costs no new declaration. Falls back to the conventional
 * `title`/`name` keys; the id is the caller's floor.
 */
export const labelOf = (model: unknown, value: unknown): string | undefined => {
  if (!value || typeof value !== "object") return undefined;
  const source = value as Record<string, unknown>;
  const paths = (model as { text?: { title?: readonly string[] } } | null)?.text?.title;
  const titlePath = paths?.find((path) => !path.includes(".") && !path.includes("["));
  for (const key of [titlePath, "title", "name"]) {
    if (!key) continue;
    const candidate = source[key];
    if (typeof candidate === "string" && candidate) return candidate;
  }
  return undefined;
};
