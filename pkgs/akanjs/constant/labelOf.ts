/** The model's own `label()`, else its `text: "title"` field, else `title`/`name`; the id is the caller's floor. */
export const labelOf = (model: unknown, value: unknown): string | undefined => {
  if (!value || typeof value !== "object") return undefined;
  const source = value as Record<string, unknown>;
  const written = source.label;
  if (typeof written === "function") {
    try {
      const label = (written as () => unknown).call(source);
      if (typeof label === "string" && label) return label;
    } catch {
      // A projected row lacks unselected fields, so a label method can throw; fall through to the declared paths.
    }
  }
  const paths = (model as { text?: { title?: Iterable<string> } } | null)?.text?.title;
  const titlePath = [...(paths ?? [])].find((path) => !path.includes(".") && !path.includes("["));
  for (const key of [titlePath, "title", "name"]) {
    if (!key) continue;
    const candidate = source[key];
    if (typeof candidate === "string" && candidate) return candidate;
  }
  return undefined;
};
