/** A `{name}` placeholder whose value is absent is left as written, never replaced by "undefined". */
export const interpolateTranslation = (message: string, data: Record<string, unknown> | undefined) => {
  if (!data) return message;
  return message.replace(/{([^}]+)}/g, (placeholder, name: string) =>
    data[name] === undefined ? placeholder : String(data[name]),
  );
};
