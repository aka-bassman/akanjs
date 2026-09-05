/**
 * Fills `{name}` placeholders in a translated string.
 *
 * A placeholder whose value is absent is left as written: the author's `{name}` reads as a bug in the UI, while
 * the string "undefined" reads as content, and a partially supplied `data` must not corrupt the rest of the line.
 */
export const interpolateTranslation = (message: string, data: Record<string, unknown> | undefined) => {
  if (!data) return message;
  return message.replace(/{([^}]+)}/g, (placeholder, name: string) =>
    data[name] === undefined ? placeholder : String(data[name]),
  );
};
